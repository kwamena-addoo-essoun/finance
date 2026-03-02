from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    username: str

class UserCreate(UserBase):
    password: str

    @field_validator('password')
    @classmethod
    def password_strength(cls, v: str) -> str:
        errors = []
        if len(v) < 8:
            errors.append('at least 8 characters')
        if not any(c.isupper() for c in v):
            errors.append('at least one uppercase letter')
        if not any(c.islower() for c in v):
            errors.append('at least one lowercase letter')
        if not any(c.isdigit() for c in v):
            errors.append('at least one digit')
        if not any(c in '!@#$%^&*()_+-=[]{}|;:\',.<>?/~`' for c in v):
            errors.append('at least one special character (!@#$%^&* etc.)')
        if errors:
            raise ValueError('Password must contain ' + ', '.join(errors))
        return v

    @field_validator('username')
    @classmethod
    def username_valid(cls, v: str) -> str:
        if len(v) < 3:
            raise ValueError('Username must be at least 3 characters')
        if not v.replace('_', '').replace('-', '').isalnum():
            raise ValueError('Username may only contain letters, numbers, hyphens and underscores')
        return v

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(UserBase):
    id: int
    user_id: str
    is_verified: bool
    is_admin: bool
    ai_data_consent: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
