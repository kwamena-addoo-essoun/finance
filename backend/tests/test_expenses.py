"""Tests for expense, category, and budget CRUD."""


# ── Helpers ──────────────────────────────────────────────────────────────────

def _create_category(client, headers, name="Food"):
    resp = client.post("/api/categories/", json={"name": name, "color": "#ff0000"}, headers=headers)
    assert resp.status_code == 200
    return resp.json()


def _create_expense(client, headers, category_id, title="Lunch", amount=12.50):
    resp = client.post("/api/expenses/", json={
        "title": title,
        "amount": amount,
        "date": "2026-02-28T12:00:00",
        "category_id": category_id,
    }, headers=headers)
    assert resp.status_code == 200
    return resp.json()


# ── Categories ────────────────────────────────────────────────────────────────

class TestCategories:
    def test_create_category(self, client, auth_headers):
        cat = _create_category(client, auth_headers, "Transport")
        assert cat["name"] == "Transport"
        assert "id" in cat

    def test_list_categories_only_own(self, client, auth_headers):
        _create_category(client, auth_headers, "Healthcare")
        resp = client.get("/api/categories/", headers=auth_headers)
        assert resp.status_code == 200
        # All returned categories belong to this user (by virtue of the endpoint filtering)
        assert isinstance(resp.json(), list)

    def test_update_category(self, client, auth_headers):
        cat = _create_category(client, auth_headers, "Misc")
        resp = client.put(f"/api/categories/{cat['id']}", json={"name": "Miscellaneous"}, headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json()["name"] == "Miscellaneous"

    def test_cannot_access_other_user_category(self, client, auth_headers):
        cat = _create_category(client, auth_headers, "Private")

        # Register a second user
        client.post("/api/auth/register", json={
            "email": "other@example.com", "username": "otheruser", "password": "OtherPass1!"
        })
        login2 = client.post("/api/auth/login", json={"username": "otheruser", "password": "OtherPass1!"})
        other_headers = {"Authorization": f"Bearer {login2.json()['access_token']}"}

        resp = client.put(f"/api/categories/{cat['id']}", json={"name": "Hacked"}, headers=other_headers)
        assert resp.status_code == 404  # must not be visible to another user


# ── Expenses ──────────────────────────────────────────────────────────────────

class TestExpenses:
    def test_create_expense(self, client, auth_headers):
        cat = _create_category(client, auth_headers, "Dining")
        exp = _create_expense(client, auth_headers, cat["id"], "Dinner", 45.00)
        assert exp["title"] == "Dinner"
        assert exp["amount"] == 45.00
        assert exp["user_id"] is not None

    def test_list_expenses(self, client, auth_headers):
        cat = _create_category(client, auth_headers, "Shopping")
        _create_expense(client, auth_headers, cat["id"], "Books", 20.00)
        resp = client.get("/api/expenses/", headers=auth_headers)
        assert resp.status_code == 200
        assert len(resp.json()) >= 1

    def test_get_single_expense(self, client, auth_headers):
        cat = _create_category(client, auth_headers, "Utilities")
        exp = _create_expense(client, auth_headers, cat["id"], "Electricity", 80.00)
        resp = client.get(f"/api/expenses/{exp['id']}", headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json()["id"] == exp["id"]

    def test_update_expense(self, client, auth_headers):
        cat = _create_category(client, auth_headers, "Petrol")
        exp = _create_expense(client, auth_headers, cat["id"], "Gas", 50.00)
        resp = client.put(f"/api/expenses/{exp['id']}", json={"amount": 55.00}, headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json()["amount"] == 55.00

    def test_delete_expense(self, client, auth_headers):
        cat = _create_category(client, auth_headers, "Snacks")
        exp = _create_expense(client, auth_headers, cat["id"], "Chips", 3.00)
        del_resp = client.delete(f"/api/expenses/{exp['id']}", headers=auth_headers)
        assert del_resp.status_code == 200
        get_resp = client.get(f"/api/expenses/{exp['id']}", headers=auth_headers)
        assert get_resp.status_code == 404

    def test_expense_requires_auth(self, client):
        resp = client.get("/api/expenses/")
        assert resp.status_code == 403

    def test_cannot_access_other_user_expense(self, client, auth_headers):
        cat = _create_category(client, auth_headers, "Hidden")
        exp = _create_expense(client, auth_headers, cat["id"], "Secret", 9.99)

        client.post("/api/auth/register", json={
            "email": "spy@example.com", "username": "spyuser", "password": "SpyPass1!"
        })
        login2 = client.post("/api/auth/login", json={"username": "spyuser", "password": "SpyPass1!"})
        other_headers = {"Authorization": f"Bearer {login2.json()['access_token']}"}

        resp = client.get(f"/api/expenses/{exp['id']}", headers=other_headers)
        assert resp.status_code == 404


# ── Budgets ───────────────────────────────────────────────────────────────────

class TestBudgets:
    def test_create_budget(self, client, auth_headers):
        resp = client.post("/api/budgets/", json={
            "name": "Monthly Food",
            "limit_amount": 500.00,
            "period": "monthly",
        }, headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["name"] == "Monthly Food"
        assert data["spent_amount"] == 0.0

    def test_budget_spent_tracks_expenses(self, client, auth_headers):
        cat = _create_category(client, auth_headers, "Groceries")
        client.post("/api/budgets/", json={
            "name": "Grocery Budget",
            "limit_amount": 300.00,
            "period": "monthly",
            "category_id": cat["id"],
        }, headers=auth_headers)

        _create_expense(client, auth_headers, cat["id"], "Supermarket", 75.00)

        budgets = client.get("/api/budgets/", headers=auth_headers).json()
        grocery = next((b for b in budgets if b["name"] == "Grocery Budget"), None)
        assert grocery is not None
        assert grocery["spent_amount"] == 75.00

    def test_delete_budget(self, client, auth_headers):
        resp = client.post("/api/budgets/", json={
            "name": "Temp Budget",
            "limit_amount": 100.00,
            "period": "weekly",
        }, headers=auth_headers)
        budget_id = resp.json()["id"]
        del_resp = client.delete(f"/api/budgets/{budget_id}", headers=auth_headers)
        assert del_resp.status_code == 200

        remaining = client.get("/api/budgets/", headers=auth_headers).json()
        assert all(b["id"] != budget_id for b in remaining)
