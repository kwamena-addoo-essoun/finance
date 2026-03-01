from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from app.database import engine, Base
from app.routes import users, expenses, categories, budgets, auth, plaid
from app.routes import ai as ai_routes
from app.routes import savings_goals as savings_goals_routes
from app.limiter import limiter
import os
import uuid
import sentry_sdk
from dotenv import load_dotenv

load_dotenv()

# Fail fast if critical config is missing
_secret_key = os.getenv("SECRET_KEY")
if not _secret_key:
    raise RuntimeError(
        "SECRET_KEY environment variable is not set. "
        "Generate one with: python -c \"import secrets; print(secrets.token_hex(32))\""
    )

# Sentry error monitoring (no-op when SENTRY_DSN is empty)
_sentry_dsn = os.getenv("SENTRY_DSN", "")
if _sentry_dsn:
    sentry_sdk.init(
        dsn=_sentry_dsn,
        traces_sample_rate=0.2,   # 20% of transactions for performance monitoring
        profiles_sample_rate=0.1,
    )

# Create database tables (SQLite / local dev convenience).
# In production with PostgreSQL, migrations are handled by Alembic (see Dockerfile CMD).
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Finsight API",
    description="AI-powered personal finance management",
    version="1.0.0"
)

# Rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS middleware — reads from env, falls back to localhost defaults for dev
_raw_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:5173")
allowed_origins = [o.strip() for o in _raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept", "X-Request-ID"],
)

# Request-ID middleware — adds X-Request-ID to every response for traceability
@app.middleware("http")
async def add_request_id(request: Request, call_next):
    request_id = str(uuid.uuid4())
    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    return response

# Include routes
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(expenses.router, prefix="/api/expenses", tags=["expenses"])
app.include_router(categories.router, prefix="/api/categories", tags=["categories"])
app.include_router(budgets.router, prefix="/api/budgets", tags=["budgets"])
app.include_router(plaid.router, prefix="/api/plaid", tags=["plaid"])
app.include_router(ai_routes.router, prefix="/api/ai", tags=["ai"])
app.include_router(savings_goals_routes.router, prefix="/api/goals", tags=["goals"])

@app.get("/")
def read_root():
    return {"message": "Finance Dashboard API is running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
