from sqlalchemy import Column, Integer, String, DateTime, Boolean
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime
import uuid

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, unique=True, index=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Email verification
    is_verified = Column(Boolean, nullable=False, default=False)
    email_verification_token = Column(String, nullable=True)
    email_verification_token_expires = Column(DateTime, nullable=True)

    # Password reset
    password_reset_token = Column(String, nullable=True)
    password_reset_token_expires = Column(DateTime, nullable=True)

    # Role
    is_admin = Column(Boolean, nullable=False, default=False)

    # AI data-sharing consent (GLBA — persisted server-side per must-do.md)
    ai_data_consent = Column(Boolean, nullable=False, default=False)

    # Relationships
    expenses = relationship("Expense", back_populates="owner")
    categories = relationship("Category", back_populates="owner")
    budgets = relationship("Budget", back_populates="owner")
    plaid_items = relationship("PlaidItem", back_populates="owner", cascade="all, delete-orphan")
    savings_goals = relationship("SavingsGoal", back_populates="owner", cascade="all, delete-orphan")
