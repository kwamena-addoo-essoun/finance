from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ExchangeTokenRequest(BaseModel):
    public_token: str
    institution_id: Optional[str] = None
    institution_name: Optional[str] = None


class BankAccountResponse(BaseModel):
    id: int
    account_id: str
    name: str
    official_name: Optional[str]
    type: Optional[str]
    subtype: Optional[str]
    mask: Optional[str]
    current_balance: Optional[float]
    available_balance: Optional[float]
    currency_code: Optional[str]
    institution_name: Optional[str]   # denormalised from PlaidItem
    updated_at: datetime

    class Config:
        from_attributes = True


class LinkTokenResponse(BaseModel):
    link_token: str
    expiration: str
