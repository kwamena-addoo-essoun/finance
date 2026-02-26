from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.budget import Budget
from app.models.user import User
from app.schemas.budget import BudgetCreate, BudgetResponse, BudgetUpdate
from app.routes.users import get_current_user
from typing import List

router = APIRouter()

@router.post("/", response_model=BudgetResponse)
async def create_budget(
    budget: BudgetCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new budget"""
    user = current_user
    
    db_budget = Budget(
        user_id=user.id,
        name=budget.name,
        limit_amount=budget.limit_amount,
        currency=budget.currency,
        period=budget.period,
        category_id=budget.category_id
    )
    
    db.add(db_budget)
    db.commit()
    db.refresh(db_budget)
    
    return db_budget

@router.get("/", response_model=List[BudgetResponse])
async def get_budgets(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get all budgets for current user"""
    user = current_user
    budgets = db.query(Budget).filter(Budget.user_id == user.id).all()
    return budgets

@router.put("/{budget_id}", response_model=BudgetResponse)
async def update_budget(
    budget_id: int,
    budget_update: BudgetUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update a budget"""
    user = current_user
    budget = db.query(Budget).filter(Budget.id == budget_id, Budget.user_id == user.id).first()
    
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")
    
    update_data = budget_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(budget, field, value)
    
    db.add(budget)
    db.commit()
    db.refresh(budget)
    
    return budget

@router.delete("/{budget_id}")
async def delete_budget(budget_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Delete a budget"""
    user = current_user
    budget = db.query(Budget).filter(Budget.id == budget_id, Budget.user_id == user.id).first()
    
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")
    
    db.delete(budget)
    db.commit()
    
    return {"message": "Budget deleted successfully"}
