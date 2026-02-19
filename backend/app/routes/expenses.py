from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.expense import Expense
from app.models.user import User
from app.schemas.expense import ExpenseCreate, ExpenseResponse, ExpenseUpdate
from app.routes.users import get_current_user
from app.services.ai_service import ai_service
from typing import List

router = APIRouter()

@router.post("/", response_model=ExpenseResponse)
async def create_expense(
    expense: ExpenseCreate,
    token: str,
    db: Session = Depends(get_db)
):
    """Create a new expense with AI categorization"""
    user = get_current_user(token, db)
    
    # AI-suggest category
    ai_category = ai_service.categorize_expense(expense.title, expense.description)
    
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
    
    return db_expense

@router.get("/", response_model=List[ExpenseResponse])
async def get_expenses(token: str, db: Session = Depends(get_db)):
    """Get all expenses for current user"""
    user = get_current_user(token, db)
    expenses = db.query(Expense).filter(Expense.user_id == user.id).all()
    return expenses

@router.get("/{expense_id}", response_model=ExpenseResponse)
async def get_expense(expense_id: int, token: str, db: Session = Depends(get_db)):
    """Get a specific expense"""
    user = get_current_user(token, db)
    expense = db.query(Expense).filter(Expense.id == expense_id, Expense.user_id == user.id).first()
    
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    return expense

@router.put("/{expense_id}", response_model=ExpenseResponse)
async def update_expense(
    expense_id: int,
    expense_update: ExpenseUpdate,
    token: str,
    db: Session = Depends(get_db)
):
    """Update an expense"""
    user = get_current_user(token, db)
    expense = db.query(Expense).filter(Expense.id == expense_id, Expense.user_id == user.id).first()
    
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    # Update fields
    update_data = expense_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(expense, field, value)
    
    db.add(expense)
    db.commit()
    db.refresh(expense)
    
    return expense

@router.delete("/{expense_id}")
async def delete_expense(expense_id: int, token: str, db: Session = Depends(get_db)):
    """Delete an expense"""
    user = get_current_user(token, db)
    expense = db.query(Expense).filter(Expense.id == expense_id, Expense.user_id == user.id).first()
    
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    db.delete(expense)
    db.commit()
    
    return {"message": "Expense deleted successfully"}
