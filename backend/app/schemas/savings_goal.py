from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class SavingsGoalBase(BaseModel):
    name: str
    target_amount: float
    current_amount: float = 0.0
    deadline: Optional[datetime] = None
    color: str = "#10b981"
    icon: str = "🎯"
    notes: Optional[str] = None


class SavingsGoalCreate(SavingsGoalBase):
    pass


class SavingsGoalUpdate(BaseModel):
    name: Optional[str] = None
    target_amount: Optional[float] = None
    current_amount: Optional[float] = None
    deadline: Optional[datetime] = None
    color: Optional[str] = None
    icon: Optional[str] = None
    notes: Optional[str] = None
    is_completed: Optional[bool] = None


class SavingsGoalContribute(BaseModel):
    amount: float


class SavingsGoalResponse(SavingsGoalBase):
    id: int
    goal_id: str
    is_completed: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
