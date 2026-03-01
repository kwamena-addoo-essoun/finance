"""Tests for authentication endpoints."""


class TestRegister:
    def test_register_success(self, client):
        resp = client.post("/api/auth/register", json={
            "email": "newuser@example.com",
            "username": "newuser",
            "password": "SecurePass1!",
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["email"] == "newuser@example.com"
        assert data["username"] == "newuser"
        assert "hashed_password" not in data  # must never be exposed

    def test_register_duplicate_email(self, client, registered_user):
        resp = client.post("/api/auth/register", json={
            "email": registered_user["email"],
            "username": "different_username",
            "password": "AnotherPass1!",
        })
        assert resp.status_code == 400
        assert "already registered" in resp.json()["detail"].lower()

    def test_register_duplicate_username(self, client, registered_user):
        resp = client.post("/api/auth/register", json={
            "email": "another@example.com",
            "username": registered_user["username"],
            "password": "AnotherPass1!",
        })
        assert resp.status_code == 400
        assert "taken" in resp.json()["detail"].lower()


class TestLogin:
    def test_login_success(self, client, registered_user):
        resp = client.post("/api/auth/login", json={
            "username": registered_user["username"],
            "password": registered_user["password"],
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"

    def test_login_wrong_password(self, client, registered_user):
        resp = client.post("/api/auth/login", json={
            "username": registered_user["username"],
            "password": "wrongpassword",
        })
        assert resp.status_code == 401

    def test_login_unknown_user(self, client):
        resp = client.post("/api/auth/login", json={
            "username": "nobody",
            "password": "irrelevant",
        })
        assert resp.status_code == 401


class TestRefreshToken:
    def test_refresh_returns_new_access_token(self, client, registered_user):
        login = client.post("/api/auth/login", json={
            "username": registered_user["username"],
            "password": registered_user["password"],
        })
        refresh_token = login.json()["refresh_token"]

        resp = client.post("/api/auth/refresh", json={"refresh_token": refresh_token})
        assert resp.status_code == 200
        assert "access_token" in resp.json()

    def test_refresh_rejects_access_token_as_refresh(self, client, registered_user):
        login = client.post("/api/auth/login", json={
            "username": registered_user["username"],
            "password": registered_user["password"],
        })
        access_token = login.json()["access_token"]

        # Using the access token as a refresh token must be rejected
        resp = client.post("/api/auth/refresh", json={"refresh_token": access_token})
        assert resp.status_code == 401

    def test_refresh_rejects_garbage(self, client):
        resp = client.post("/api/auth/refresh", json={"refresh_token": "not.a.token"})
        assert resp.status_code == 401

    def test_refresh_missing_body(self, client):
        resp = client.post("/api/auth/refresh", json={})
        assert resp.status_code == 422


class TestProtectedRoute:
    def test_me_requires_auth(self, client):
        resp = client.get("/api/users/me")
        assert resp.status_code == 403  # HTTPBearer returns 403 when header is absent

    def test_me_returns_user(self, client, auth_headers):
        resp = client.get("/api/users/me", headers=auth_headers)
        assert resp.status_code == 200
        assert "email" in resp.json()

    def test_me_rejects_refresh_token(self, client, registered_user):
        login = client.post("/api/auth/login", json={
            "username": registered_user["username"],
            "password": registered_user["password"],
        })
        refresh_token = login.json()["refresh_token"]
        resp = client.get("/api/users/me", headers={"Authorization": f"Bearer {refresh_token}"})
        assert resp.status_code == 401
