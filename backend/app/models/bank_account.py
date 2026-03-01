from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime


class BankAccount(Base):
    """A single account (checking, savings, credit, etc.) from a PlaidItem."""
    __tablename__ = "bank_accounts"

    id = Column(Integer, primary_key=True, index=True)
    plaid_item_id = Column(Integer, ForeignKey("plaid_items.id"), nullable=False, index=True)
    account_id = Column(String, unique=True, nullable=False)       # Plaid account_id
    name = Column(String, nullable=False)
    official_name = Column(String, nullable=True)
    type = Column(String, nullable=True)        # depository, credit, investment, loan
    subtype = Column(String, nullable=True)     # checking, savings, credit card …
    mask = Column(String(4), nullable=True)     # last 4 digits
    current_balance = Column(Float, nullable=True)
    available_balance = Column(Float, nullable=True)
    currency_code = Column(String(3), nullable=True, default="USD")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    plaid_item = relationship("PlaidItem", back_populates="accounts")
