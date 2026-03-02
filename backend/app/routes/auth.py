from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin, UserResponse
from app.limiter import limiter
from app.services.email_service import send_verification_email, send_password_reset_email
from app.audit import audit_log
from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError
import bcrypt
import os
import secrets

router = APIRouter()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7

COOKIE_SECURE = os.getenv("COOKIE_SECURE", "false").lower() == "true"
COOKIE_DOMAIN = os.getenv("COOKIE_DOMAIN") or None


def _set_auth_cookies(response: Response, access_token: str, refresh_token: str) -> None:
    """Write httpOnly auth cookies onto the response."""
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        samesite="lax",
        secure=COOKIE_SECURE,
        domain=COOKIE_DOMAIN,
        path="/api/",
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        samesite="lax",
        secure=COOKIE_SECURE,
        domain=COOKIE_DOMAIN,
        path="/api/auth/refresh",
        max_age=REFRESH_TOKEN_EXPIRE_DAYS * 86400,
    )


def _clear_auth_cookies(response: Response) -> None:
    """Expire both auth cookies (used by logout)."""
    response.delete_cookie("access_token", path="/api/", domain=COOKIE_DOMAIN)
    response.delete_cookie("refresh_token", path="/api/auth/refresh", domain=COOKIE_DOMAIN)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode(), hashed_password.encode())


_SPECIAL = set('!@#$%^&*()_+-=[]{}|;:\',.<>?/~`')


def _validate_password_strength(password: str) -> None:
    """Raise HTTPException 422 if the password does not meet complexity requirements."""
    errors = []
    if len(password) < 8:            errors.append('at least 8 characters')
    if not any(c.isupper() for c in password): errors.append('one uppercase letter')
    if not any(c.islower() for c in password): errors.append('one lowercase letter')
    if not any(c.isdigit() for c in password): errors.append('one digit')
    if not any(c in _SPECIAL for c in password): errors.append('one special character (!@#$%^&* etc.)')
    if errors:
        raise HTTPException(
            status_code=422,
            detail='Password must contain: ' + ', '.join(errors),
        )


def _create_token(subject: str, token_type: str, expires_delta: timedelta) -> str:
    expire = datetime.now(timezone.utc) + expires_delta
    payload = {"sub": subject, "type": token_type, "exp": expire}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def _utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


# ---------------------------------------------------------------------------
# Request schemas (inline — only used by auth routes)
# ---------------------------------------------------------------------------

class ForgotPasswordRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


class VerifyEmailRequest(BaseModel):
    token: str


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/register", response_model=UserResponse)
@limiter.limit("10/minute")
async def register(request: Request, user: UserCreate, db: Session = Depends(get_db)):
    """Register a new user and send a verification email."""
    if db.query(User).filter(User.email == user.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    if db.query(User).filter(User.username == user.username).first():
        raise HTTPException(status_code=400, detail="Username already taken")

    verification_token = secrets.token_urlsafe(32)
    new_user = User(
        email=user.email,
        username=user.username,
        hashed_password=hash_password(user.password),
        is_verified=False,
        email_verification_token=verification_token,
        email_verification_token_expires=_utcnow() + timedelta(hours=24),
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    try:
        send_verification_email(new_user.email, verification_token)
    except Exception:
        pass  # Don't block registration if email fails

    audit_log("user_registered", user_id=new_user.id, ip=request.client.host if request.client else None)
    return new_user


@router.post("/login")
@limiter.limit("10/minute")
async def login(
    request: Request,
    response: Response,
    credentials: UserLogin,
    db: Session = Depends(get_db),
):
    """Login user, set httpOnly cookies and return session metadata."""
    user = db.query(User).filter(User.username == credentials.username).first()
    if not user or not verify_password(credentials.password, user.hashed_password):
        audit_log(
            "user_login_failed",
            user_id=None,
            ip=request.client.host if request.client else None,
            username=credentials.username,
        )
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access_token = _create_token(
        str(user.id), "access", timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    refresh_token = _create_token(
        str(user.id), "refresh", timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    )

    _set_auth_cookies(response, access_token, refresh_token)

    audit_log(
        "user_login_success",
        user_id=user.id,
        ip=request.client.host if request.client else None,
    )

    return {
        "username": user.username,
        "is_verified": user.is_verified,
        "is_admin": user.is_admin,
        "ai_data_consent": user.ai_data_consent,
    }


@router.post("/refresh")
@limiter.limit("20/minute")
async def refresh(
    request: Request,
    response: Response,
    body: dict = None,
    db: Session = Depends(get_db),
):
    """Exchange a valid refresh token (cookie or body) for a new access token."""
    # Accept token from cookie (browser) or JSON body (Swagger/scripts)
    token = request.cookies.get("refresh_token")
    if not token and body:
        token = body.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="No refresh token provided")

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "refresh":
            raise JWTError("wrong token type")
        user_id = int(payload["sub"])
    except (JWTError, TypeError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    new_access_token = _create_token(
        str(user.id), "access", timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    # Refresh the access_token cookie; keep existing refresh_token cookie alive
    response.set_cookie(
        key="access_token",
        value=new_access_token,
        httponly=True,
        samesite="lax",
        secure=COOKIE_SECURE,
        domain=COOKIE_DOMAIN,
        path="/api/",
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )
    return {"token_type": "bearer"}


@router.post("/logout")
async def logout(request: Request, response: Response):
    """Clear auth cookies (the httpOnly cookies can't be removed by JS)."""
    _clear_auth_cookies(response)
    # best-effort: log if we have an access token to identify the user
    audit_log("user_logout", user_id=None, ip=request.client.host if request.client else None)
    return {"message": "Logged out"}


@router.post("/send-verification")
@limiter.limit("5/minute")
async def send_verification(
    request: Request,
    body: dict,
    db: Session = Depends(get_db),
):
    """Re-send a verification email. Body: {"email": "..."}"""
    email = (body or {}).get("email")
    if not email:
        raise HTTPException(status_code=422, detail="email is required")

    user = db.query(User).filter(User.email == email).first()
    if not user or user.is_verified:
        return {"message": "If that email is registered and unverified, a link has been sent."}

    token = secrets.token_urlsafe(32)
    user.email_verification_token = token
    user.email_verification_token_expires = _utcnow() + timedelta(hours=24)
    db.commit()

    try:
        send_verification_email(user.email, token)
    except Exception:
        pass

    return {"message": "Verification email sent"}


@router.post("/verify-email")
async def verify_email(body: VerifyEmailRequest, db: Session = Depends(get_db)):
    """Mark the user's email as verified using the token from the email link."""
    user = db.query(User).filter(
        User.email_verification_token == body.token
    ).first()

    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired verification link")

    expires = user.email_verification_token_expires
    if expires and expires < _utcnow():
        raise HTTPException(status_code=400, detail="Verification link has expired. Please request a new one.")

    user.is_verified = True
    user.email_verification_token = None
    user.email_verification_token_expires = None
    db.commit()
    return {"message": "Email verified successfully"}


@router.post("/forgot-password")
@limiter.limit("5/minute")
async def forgot_password(
    request: Request,
    body: ForgotPasswordRequest,
    db: Session = Depends(get_db),
):
    """Send a password-reset email."""
    user = db.query(User).filter(User.email == body.email).first()
    if user:
        token = secrets.token_urlsafe(32)
        user.password_reset_token = token
        user.password_reset_token_expires = _utcnow() + timedelta(hours=1)
        db.commit()
        try:
            send_password_reset_email(user.email, token)
        except Exception:
            pass
    return {"message": "If that email is registered, a reset link has been sent."}


@router.post("/reset-password")
async def reset_password(body: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Set a new password using a valid reset token."""
    _validate_password_strength(body.new_password)

    user = db.query(User).filter(
        User.password_reset_token == body.token
    ).first()

    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired reset link")

    expires = user.password_reset_token_expires
    if expires and expires < _utcnow():
        raise HTTPException(status_code=400, detail="Reset link has expired. Please request a new one.")

    user.hashed_password = hash_password(body.new_password)
    user.password_reset_token = None
    user.password_reset_token_expires = None
    db.commit()
    return {"message": "Password updated successfully"}
