from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class BudgetBase(BaseModel):
    name: str
    limit_amount: float
    currency: str = "USD"
    period: str  # monthly, weekly, yearly
    category_id: Optional[int] = None

class BudgetCreate(BudgetBase):
    pass

class BudgetUpdate(BaseModel):
    name: Optional[str] = None
    limit_amount: Optional[float] = None
    currency: Optional[str] = None
    period: Optional[str] = None
    category_id: Optional[int] = None

class BudgetResponse(BudgetBase):
    id: int
    budget_id: str
    user_id: int
    spent_amount: float
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
