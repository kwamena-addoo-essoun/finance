from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime


class PlaidItem(Base):
    """Represents one linked bank/institution (one per Plaid Link session)."""
    __tablename__ = "plaid_items"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    item_id = Column(String, unique=True, nullable=False)          # Plaid item_id
    access_token = Column(String, nullable=False)                  # Keep private — never expose
    institution_id = Column(String, nullable=True)
    institution_name = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="plaid_items")
    accounts = relationship("BankAccount", back_populates="plaid_item", cascade="all, delete-orphan")
