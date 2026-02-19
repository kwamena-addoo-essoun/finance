from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.routes import users, expenses, categories, budgets, auth

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Finance Dashboard API",
    description="AI-powered personal finance management",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routes
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(expenses.router, prefix="/api/expenses", tags=["expenses"])
app.include_router(categories.router, prefix="/api/categories", tags=["categories"])
app.include_router(budgets.router, prefix="/api/budgets", tags=["budgets"])

@app.get("/")
def read_root():
    return {"message": "Finance Dashboard API is running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
