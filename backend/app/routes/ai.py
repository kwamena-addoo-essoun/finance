import asyncio
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List
from app.database import get_db
from app.models.user import User
from app.models.expense import Expense
from app.models.budget import Budget
from app.models.category import Category
from app.routes.users import get_current_user
from app.services.ai_service import ai_service

router = APIRouter()

class ChatMessage(BaseModel):
    role: str   # "user" | "assistant"
    content: str

class ChatRequest(BaseModel):
    message: str
    history: List[ChatMessage] = []

def _build_context(user_id: int, db: Session) -> str:
    """Build a concise financial context string for the AI."""
    expenses   = db.query(Expense).filter(Expense.user_id == user_id).all()
    budgets    = db.query(Budget).filter(Budget.user_id == user_id).all()
    categories = db.query(Category).filter(Category.user_id == user_id).all()

    total_spend = sum(e.amount for e in expenses)
    recent = sorted(expenses, key=lambda e: e.date, reverse=True)[:10]

    cat_totals = {}
    for e in expenses:
        cat = next((c for c in categories if c.id == e.category_id), None)
        name = cat.name if cat else "Uncategorized"
        cat_totals[name] = cat_totals.get(name, 0) + e.amount

    budget_lines = [f"  - {b.name}: ${b.spent_amount or 0:.2f} / ${b.limit_amount:.2f}" for b in budgets]
    cat_lines    = [f"  - {k}: ${v:.2f}" for k, v in sorted(cat_totals.items(), key=lambda x: -x[1])[:8]]
    recent_lines = [f"  - {e.title}: ${e.amount:.2f} on {str(e.date)[:10]}" for e in recent]

    ctx = f"""Financial summary for this user:
- Total all-time spend: ${total_spend:.2f}
- Number of transactions: {len(expenses)}
- Number of budgets: {len(budgets)}

Spending by category:
{chr(10).join(cat_lines) or '  (none)'}

Budget status:
{chr(10).join(budget_lines) or '  (none)'}

10 most recent transactions:
{chr(10).join(recent_lines) or '  (none)'}
"""
    return ctx

SYSTEM_PROMPT = """You are Finsight AI, a knowledgeable and friendly personal finance coach built into the Finsight app.
You have access to the user's real financial data (provided below).
Be concise, practical, and supportive. Use specific numbers from their data when relevant.
When you don't have enough data to answer accurately, say so honestly.
Keep responses under 200 words unless a detailed breakdown is requested.
Never ask for sensitive information like bank accounts or passwords."""

@router.post("/chat")
async def ai_chat(
    req: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # GLBA: user must have given explicit, server-persisted AI data-sharing consent.
    if not current_user.ai_data_consent:
        from fastapi import HTTPException as _HTTPException
        raise _HTTPException(
            status_code=403,
            detail="AI data sharing consent is required. Please enable it in the AI Chat panel.",
        )

    if not ai_service.api_key_available or not ai_service.client:
        return {"reply": "AI Coach is unavailable — no OpenAI API key is configured. Add OPENAI_API_KEY to your .env file to enable this feature.", "available": False}

    ctx = await asyncio.to_thread(_build_context, current_user.id, db)

    system_msg = f"{SYSTEM_PROMPT}\n\n{ctx}"

    messages = [{"role": "system", "content": system_msg}]
    for m in req.history[-10:]:   # keep last 10 turns for context
        messages.append({"role": m.role, "content": m.content})
    messages.append({"role": "user", "content": req.message})

    try:
        resp = await asyncio.to_thread(
            lambda: ai_service.client.chat.completions.create(
                model=ai_service.model,
                messages=messages,
                temperature=0.6,
                max_tokens=300,
            )
        )
        reply = resp.choices[0].message.content.strip()
        return {"reply": reply, "available": True}
    except Exception as e:
        return {"reply": f"Sorry, I hit an error: {str(e)}", "available": False}
