from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./finance_app.db")

_is_sqlite = "sqlite" in DATABASE_URL

# SQLite: needs check_same_thread=False for FastAPI's async threading model.
# PostgreSQL: connection pool with pre-ping so stale connections are detected and
# replaced rather than causing 500 errors under concurrent load.
_pg_kwargs = {
    "pool_size": 10,
    "max_overflow": 20,
    "pool_pre_ping": True,   # drops and replaces stale/dead connections
    "pool_recycle": 1800,    # recycle connections after 30 minutes
}

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if _is_sqlite else {},
    **({} if _is_sqlite else _pg_kwargs)
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
