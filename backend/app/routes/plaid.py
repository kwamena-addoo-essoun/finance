"""Plaid bank-linking routes.

Required .env variables:
    PLAID_CLIENT_ID
    PLAID_SECRET
    PLAID_ENV   — sandbox | development | production  (default: sandbox)
"""
import os
import plaid
from plaid.api_client import ApiClient, Configuration
from plaid.api import plaid_api
from plaid.model.link_token_create_request import LinkTokenCreateRequest
from plaid.model.link_token_create_request_user import LinkTokenCreateRequestUser
from plaid.model.item_public_token_exchange_request import ItemPublicTokenExchangeRequest
from plaid.model.accounts_get_request import AccountsGetRequest
from plaid.model.country_code import CountryCode
from plaid.model.products import Products

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.routes.users import get_current_user
from app.models.user import User
from app.models.plaid_item import PlaidItem
from app.models.bank_account import BankAccount
from app.schemas.plaid import ExchangeTokenRequest, BankAccountResponse, LinkTokenResponse

router = APIRouter()

# ---------------------------------------------------------------------------
# Plaid client initialisation (lazy — fails gracefully if keys not set)
# ---------------------------------------------------------------------------

_ENV_MAP = {
    "sandbox": "https://sandbox.plaid.com",
    "development": "https://development.plaid.com",
    "production": "https://production.plaid.com",
}

_plaid_client: plaid_api.PlaidApi | None = None


def _get_plaid_client() -> plaid_api.PlaidApi:
    global _plaid_client
    if _plaid_client is None:
        client_id = os.getenv("PLAID_CLIENT_ID")
        secret = os.getenv("PLAID_SECRET")
        env_name = os.getenv("PLAID_ENV", "sandbox").lower()
        if not client_id or not secret:
            raise HTTPException(
                status_code=503,
                detail="Plaid is not configured on this server. Set PLAID_CLIENT_ID and PLAID_SECRET.",
            )
        configuration = Configuration(
            host=_ENV_MAP.get(env_name, plaid.Environment.Sandbox),
            api_key={"clientId": client_id, "secret": secret},
        )
        api_client = ApiClient(configuration)
        _plaid_client = plaid_api.PlaidApi(api_client)
    return _plaid_client


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@router.post("/create-link-token", response_model=LinkTokenResponse)
async def create_link_token(current_user: User = Depends(get_current_user)):
    """Create a Plaid Link token for the authenticated user."""
    client = _get_plaid_client()
    request = LinkTokenCreateRequest(
        user=LinkTokenCreateRequestUser(client_user_id=str(current_user.id)),
        client_name="Finsight",
        products=[Products("transactions")],
        country_codes=[CountryCode("US")],
        language="en",
    )
    try:
        response = client.link_token_create(request)
    except plaid.ApiException as e:
        raise HTTPException(status_code=502, detail=f"Plaid error: {e.body}")

    return LinkTokenResponse(
        link_token=response["link_token"],
        expiration=str(response["expiration"]),
    )


@router.post("/exchange-token")
async def exchange_token(
    body: ExchangeTokenRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Exchange a Plaid public_token for a permanent access_token, then save accounts."""
    client = _get_plaid_client()

    # 1. Exchange token
    try:
        exchange_response = client.item_public_token_exchange(
            ItemPublicTokenExchangeRequest(public_token=body.public_token)
        )
    except plaid.ApiException as e:
        raise HTTPException(status_code=502, detail=f"Plaid error: {e.body}")

    access_token: str = exchange_response["access_token"]
    item_id: str = exchange_response["item_id"]

    # 2. Persist PlaidItem (idempotent — don't duplicate if already linked)
    plaid_item = db.query(PlaidItem).filter(PlaidItem.item_id == item_id).first()
    if not plaid_item:
        plaid_item = PlaidItem(
            user_id=current_user.id,
            item_id=item_id,
            access_token=access_token,
            institution_id=body.institution_id,
            institution_name=body.institution_name,
        )
        db.add(plaid_item)
        db.commit()
        db.refresh(plaid_item)

    # 3. Fetch and upsert accounts
    try:
        accounts_response = client.accounts_get(
            AccountsGetRequest(access_token=access_token)
        )
    except plaid.ApiException as e:
        raise HTTPException(status_code=502, detail=f"Plaid error fetching accounts: {e.body}")

    for acct in accounts_response["accounts"]:
        existing = db.query(BankAccount).filter(
            BankAccount.account_id == acct["account_id"]
        ).first()
        bal = acct.get("balances", {})
        if existing:
            existing.current_balance = bal.get("current")
            existing.available_balance = bal.get("available")
        else:
            db.add(BankAccount(
                plaid_item_id=plaid_item.id,
                account_id=acct["account_id"],
                name=acct["name"],
                official_name=acct.get("official_name"),
                type=str(acct["type"]) if acct.get("type") else None,
                subtype=str(acct["subtype"]) if acct.get("subtype") else None,
                mask=acct.get("mask"),
                current_balance=bal.get("current"),
                available_balance=bal.get("available"),
                currency_code=bal.get("iso_currency_code", "USD"),
            ))
    db.commit()
    return {"message": "Bank linked successfully", "item_id": item_id}


@router.get("/accounts", response_model=list[BankAccountResponse])
async def get_accounts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return all bank accounts for the authenticated user."""
    items = db.query(PlaidItem).filter(PlaidItem.user_id == current_user.id).all()
    result = []
    for item in items:
        for acct in item.accounts:
            # Attach institution name for display
            acct.__dict__["institution_name"] = item.institution_name
            result.append(acct)
    return result


@router.delete("/accounts/{account_id}")
async def unlink_account(
    account_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Remove a single bank account (and its PlaidItem if no other accounts remain)."""
    acct = db.query(BankAccount).filter(BankAccount.id == account_id).first()
    if not acct:
        raise HTTPException(status_code=404, detail="Account not found")

    # Ownership check
    item = db.query(PlaidItem).filter(
        PlaidItem.id == acct.plaid_item_id,
        PlaidItem.user_id == current_user.id,
    ).first()
    if not item:
        raise HTTPException(status_code=403, detail="Not authorised")

    db.delete(acct)
    db.commit()

    # Remove the parent item if it has no remaining accounts
    remaining = db.query(BankAccount).filter(BankAccount.plaid_item_id == item.id).count()
    if remaining == 0:
        db.delete(item)
        db.commit()

    return {"message": "Account unlinked"}
