import asyncio
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import update, case
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.expense import Expense
from app.models.budget import Budget
from app.models.user import User
from app.schemas.expense import ExpenseCreate, ExpenseResponse, ExpenseUpdate
from app.routes.users import get_current_user
from app.services.ai_service import ai_service
from typing import List

router = APIRouter()


def _update_budget_spent(user_id: int, category_id: int, amount_delta: float, db: Session):
    """Atomically adjust spent_amount on all budgets matching user+category.
    Single UPDATE statement avoids read-modify-write race conditions under concurrent requests.
    """
    new_spent = Budget.spent_amount + amount_delta
    db.execute(
        update(Budget)
        .where(Budget.user_id == user_id)
        .where((Budget.category_id == category_id) | (Budget.category_id == None))
        .values(spent_amount=case((new_spent < 0, 0.0), else_=new_spent))
    )
    db.commit()

@router.post("/", response_model=ExpenseResponse)
async def create_expense(
    expense: ExpenseCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new expense with AI categorization"""
    user = current_user
    
    # AI-suggest category (run sync SDK call in a thread pool to avoid blocking the event loop)
    ai_category = await asyncio.to_thread(
        ai_service.categorize_expense, expense.title, expense.description
    )
    
    db_expense = Expense(
        user_id=user.id,
        title=expense.title,
        description=expense.description,
        amount=expense.amount,
        currency=expense.currency,
        date=expense.date,
        category_id=expense.category_id,
        is_recurring=expense.is_recurring,
        ai_category=ai_category
    )
    
    db.add(db_expense)
    db.commit()
    db.refresh(db_expense)

    # Update budget tracking
    _update_budget_spent(user.id, db_expense.category_id, db_expense.amount, db)

    return db_expense

@router.get("/", response_model=List[ExpenseResponse])
async def get_expenses(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get all expenses for current user"""
    user = current_user
    expenses = db.query(Expense).filter(Expense.user_id == user.id).all()
    return expenses

@router.get("/{expense_id}", response_model=ExpenseResponse)
async def get_expense(expense_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get a specific expense"""
    user = current_user
    expense = db.query(Expense).filter(Expense.id == expense_id, Expense.user_id == user.id).first()
    
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    return expense

@router.put("/{expense_id}", response_model=ExpenseResponse)
async def update_expense(
    expense_id: int,
    expense_update: ExpenseUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update an expense"""
    user = current_user
    expense = db.query(Expense).filter(Expense.id == expense_id, Expense.user_id == user.id).first()
    
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    # Capture old values for budget adjustment
    old_amount = expense.amount
    old_category_id = expense.category_id

    # Update fields
    update_data = expense_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(expense, field, value)

    db.add(expense)
    db.commit()
    db.refresh(expense)

    # Adjust budgets: reverse old, apply new
    if old_amount != expense.amount or old_category_id != expense.category_id:
        _update_budget_spent(user.id, old_category_id, -old_amount, db)
        _update_budget_spent(user.id, expense.category_id, expense.amount, db)

    return expense

@router.delete("/{expense_id}")
async def delete_expense(expense_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Delete an expense"""
    user = current_user
    expense = db.query(Expense).filter(Expense.id == expense_id, Expense.user_id == user.id).first()
    
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    # Reverse budget tracking before deletion
    _update_budget_spent(user.id, expense.category_id, -expense.amount, db)

    db.delete(expense)
    db.commit()

    return {"message": "Expense deleted successfully"}
