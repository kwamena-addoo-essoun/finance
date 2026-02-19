from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime
import uuid

class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    expense_id = Column(String, unique=True, index=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(Integer, ForeignKey("users.id"))
    category_id = Column(Integer, ForeignKey("categories.id"))
    
    title = Column(String, index=True)
    description = Column(String, nullable=True)
    amount = Column(Float)
    currency = Column(String, default="USD")
    date = Column(DateTime)
    
    ai_category = Column(String, nullable=True)  # AI-suggested category
    ai_notes = Column(String, nullable=True)  # AI-generated insights
    is_recurring = Column(Boolean, default=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    owner = relationship("User", back_populates="expenses")
    category = relationship("Category", back_populates="expenses")
