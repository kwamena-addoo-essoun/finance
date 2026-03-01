"""Shared pytest fixtures for all backend tests."""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Disable rate limiting before any app code runs
from app.limiter import limiter
limiter.enabled = False

from app.database import Base, get_db
from main import app

# In-memory SQLite — each test session gets a fresh database.
TEST_DATABASE_URL = "sqlite:///./test_finance.db"

engine = create_engine(
    TEST_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    """Create all tables once for the test session, drop them afterwards."""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def client():
    """FastAPI test client with the DB dependency overridden."""
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture()
def registered_user(client):
    """Register and return credentials for a test user."""
    payload = {"email": "test@example.com", "username": "testuser", "password": "TestPass123!"}
    resp = client.post("/api/auth/register", json=payload)
    # Might already exist if tests share the session DB — both 200 and 400 are fine here.
    assert resp.status_code in (200, 400)
    return payload


@pytest.fixture()
def auth_headers(client, registered_user):
    """Return Authorization headers with a fresh access token."""
    resp = client.post("/api/auth/login", json={
        "username": registered_user["username"],
        "password": registered_user["password"],
    })
    assert resp.status_code == 200
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
