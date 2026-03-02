from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy.orm import Session
from jose import jwt, JWTError
from pydantic import BaseModel
from app.database import get_db
from app.models.user import User
from app.schemas.user import UserResponse
from app.audit import audit_log
from typing import List
from datetime import datetime, timezone
import os

router = APIRouter()

_SECRET_KEY = os.getenv("SECRET_KEY")
_ALGORITHM = "HS256"


def get_current_user(
    request: Request,
    db: Session = Depends(get_db),
) -> User:
    """Validate the access token (httpOnly cookie preferred, Bearer fallback for Swagger)."""
    # 1. Try the httpOnly cookie set by the /login endpoint
    token = request.cookies.get("access_token")

    # 2. Fall back to Authorization: Bearer <token> (Swagger UI / non-browser clients)
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]

    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    try:
        payload = jwt.decode(token, _SECRET_KEY, algorithms=[_ALGORITHM])
        if payload.get("type") != "access":
            raise JWTError("wrong token type")
        user_id: int = int(payload.get("sub"))
    except (JWTError, TypeError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Dependency that raises 403 if the user is not an admin."""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """Get current user profile"""
    return current_user


class AiConsentUpdate(BaseModel):
    consent: bool


@router.patch("/me/ai-consent")
async def update_ai_consent(
    payload: AiConsentUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Persist the user's AI data-sharing consent server-side.
    Required by must-do.md: consent must survive browser data clears.
    """
    current_user.ai_data_consent = payload.consent
    db.commit()
    audit_log(
        "ai_consent_updated",
        user_id=current_user.id,
        details={"consent": payload.consent},
    )
    return {"ai_data_consent": current_user.ai_data_consent}


# ---------------------------------------------------------------------------
# Admin-only endpoints
# ---------------------------------------------------------------------------

@router.get("/admin/users", response_model=List[UserResponse])
async def list_users(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    """List all registered users (admin only)."""
    return db.query(User).order_by(User.created_at).all()


@router.patch("/admin/users/{user_id}/promote")
async def promote_user(
    user_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    """Grant admin role to a user (admin only)."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_admin = True
    db.commit()
    return {"message": f"{user.username} is now an admin"}


@router.patch("/admin/users/{user_id}/demote")
async def demote_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Revoke admin role from a user (admin only, cannot demote yourself)."""
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="You cannot demote yourself")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_admin = False
    db.commit()
    return {"message": f"{user.username} is no longer an admin"}


# ---------------------------------------------------------------------------
# Data rights endpoints  (GLBA / FTC Safeguards Rule)
# ---------------------------------------------------------------------------

@router.get("/me/export")
async def export_my_data(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Export all personal data for the current user as JSON.
    Fulfils the data-portability expectation under the FTC Safeguards Rule.
    """
    from app.models.expense import Expense
    from app.models.category import Category
    from app.models.budget import Budget
    from app.models.savings_goal import SavingsGoal

    expenses   = db.query(Expense).filter(Expense.user_id == current_user.id).all()
    categories = db.query(Category).filter(Category.user_id == current_user.id).all()
    budgets    = db.query(Budget).filter(Budget.user_id == current_user.id).all()
    goals      = db.query(SavingsGoal).filter(SavingsGoal.user_id == current_user.id).all()

    audit_log("data_export", user_id=current_user.id)

    return {
        "exported_at": datetime.now(timezone.utc).isoformat(),
        "account": {
            "username": current_user.username,
            "email": current_user.email,
            "created_at": current_user.created_at.isoformat() if current_user.created_at else None,
        },
        "expenses": [
            {
                "id": e.expense_id,
                "title": e.title,
                "description": e.description,
                "amount": e.amount,
                "currency": e.currency,
                "date": str(e.date)[:10],
                "is_recurring": e.is_recurring,
                "created_at": str(e.created_at),
            }
            for e in expenses
        ],
        "categories": [{"name": c.name, "color": c.color} for c in categories],
        "budgets": [
            {
                "name": b.name,
                "limit_amount": b.limit_amount,
                "spent_amount": b.spent_amount,
                "period": b.period,
            }
            for b in budgets
        ],
        "savings_goals": [
            {
                "name": g.name,
                "target_amount": g.target_amount,
                "current_amount": g.current_amount,
                "is_completed": g.is_completed,
            }
            for g in goals
        ],
    }


@router.delete("/me", status_code=204)
async def delete_my_account(
    request: Request,
    response: Response,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Permanently delete the current user's account and ALL associated data.
    Fulfils the right-to-erasure requirement under the FTC Safeguards Rule.
    This action is irreversible.
    """
    from app.models.expense import Expense
    from app.models.category import Category
    from app.models.budget import Budget
    from app.models.savings_goal import SavingsGoal

    user_id = current_user.id
    audit_log(
        "account_deletion_requested",
        user_id=user_id,
        ip=request.client.host if request.client else None,
    )

    # Delete child records in FK-safe order
    db.query(Expense).filter(Expense.user_id == user_id).delete(synchronize_session=False)
    db.query(Budget).filter(Budget.user_id == user_id).delete(synchronize_session=False)
    db.query(SavingsGoal).filter(SavingsGoal.user_id == user_id).delete(synchronize_session=False)
    # Categories last (budgets may reference them)
    db.query(Category).filter(Category.user_id == user_id).delete(synchronize_session=False)
    db.query(User).filter(User.id == user_id).delete(synchronize_session=False)
    db.commit()

    # Expire auth cookies so the browser session ends
    from app.routes.auth import COOKIE_DOMAIN
    response.delete_cookie("access_token",  path="/api/",            domain=COOKIE_DOMAIN)
    response.delete_cookie("refresh_token", path="/api/auth/refresh", domain=COOKIE_DOMAIN)

    return None
