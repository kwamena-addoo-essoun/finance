from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.category import Category
from app.schemas.category import CategoryCreate, CategoryResponse, CategoryUpdate
from app.routes.users import get_current_user
from typing import List

router = APIRouter()

@router.post("/", response_model=CategoryResponse)
async def create_category(
    category: CategoryCreate,
    token: str,
    db: Session = Depends(get_db)
):
    """Create a new category"""
    user = get_current_user(token, db)
    
    db_category = Category(
        user_id=user.id,
        name=category.name,
        description=category.description,
        color=category.color,
        icon=category.icon
    )
    
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    
    return db_category

@router.get("/", response_model=List[CategoryResponse])
async def get_categories(token: str, db: Session = Depends(get_db)):
    """Get all categories for current user"""
    user = get_current_user(token, db)
    categories = db.query(Category).filter(Category.user_id == user.id).all()
    return categories

@router.put("/{category_id}", response_model=CategoryResponse)
async def update_category(
    category_id: int,
    category_update: CategoryUpdate,
    token: str,
    db: Session = Depends(get_db)
):
    """Update a category"""
    user = get_current_user(token, db)
    category = db.query(Category).filter(Category.id == category_id, Category.user_id == user.id).first()
    
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    update_data = category_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(category, field, value)
    
    db.add(category)
    db.commit()
    db.refresh(category)
    
    return category

@router.delete("/{category_id}")
async def delete_category(category_id: int, token: str, db: Session = Depends(get_db)):
    """Delete a category"""
    user = get_current_user(token, db)
    category = db.query(Category).filter(Category.id == category_id, Category.user_id == user.id).first()
    
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    db.delete(category)
    db.commit()
    
    return {"message": "Category deleted successfully"}
