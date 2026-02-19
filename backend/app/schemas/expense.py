from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ExpenseBase(BaseModel):
    title: str
    description: Optional[str] = None
    amount: float
    currency: str = "USD"
    date: datetime
    category_id: int
    is_recurring: bool = False

class ExpenseCreate(ExpenseBase):
    pass

class ExpenseUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    amount: Optional[float] = None
    currency: Optional[str] = None
    date: Optional[datetime] = None
    category_id: Optional[int] = None
    is_recurring: Optional[bool] = None

class ExpenseResponse(ExpenseBase):
    id: int
    expense_id: str
    user_id: int
    ai_category: Optional[str] = None
    ai_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
