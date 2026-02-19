import os
from dotenv import load_dotenv

load_dotenv()

class AIService:
    def __init__(self):
        api_key = os.getenv("OPENAI_API_KEY")
        self.client = None
        self.model = "gpt-3.5-turbo"
        self.api_key_available = api_key is not None and api_key != ""
        
        if self.api_key_available:
            try:
                from openai import OpenAI
                self.client = OpenAI(api_key=api_key)
            except Exception as e:
                print(f"Warning: OpenAI client initialization failed: {e}")
                self.api_key_available = False
    
    def categorize_expense(self, title: str, description: str = None) -> str:
        """
        Use AI to suggest a category for an expense based on title and description.
        Returns the suggested category name.
        """
        if not self.api_key_available or not self.client:
            return "Other"
            
        try:
            prompt = f"Categorize this expense into one of these categories: Food, Transportation, Entertainment, Shopping, Utilities, Healthcare, Education, Other. Expense: {title}"
            if description:
                prompt += f". Description: {description}"
            
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a financial assistant. Categorize expenses accurately. Only respond with the category name."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=10
            )
            
            return response.choices[0].message.content.strip()
        except Exception as e:
            print(f"Error in categorize_expense: {e}")
            return "Other"
    
    def generate_spending_insight(self, expenses_data: str) -> str:
        """
        Generate AI insights about spending patterns.
        """
        if not self.api_key_available or not self.client:
            return "Unable to generate insights without API connection."
            
        try:
            prompt = f"Analyze this spending data and provide 2-3 key insights about spending patterns:\n{expenses_data}"
            
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a financial advisor. Provide practical, actionable insights about spending patterns."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=150
            )
            
            return response.choices[0].message.content.strip()
        except Exception as e:
            print(f"Error in generate_spending_insight: {e}")
            return "Unable to generate insights at this time."
    
    def predict_budget_usage(self, category: str, current_spending: float, budget_limit: float) -> str:
        """
        Predict if user will exceed budget based on spending patterns.
        """
        if not self.api_key_available or not self.client:
            return "Budget analysis unavailable without API connection."
            
        try:
            percentage = (current_spending / budget_limit * 100) if budget_limit > 0 else 0
            prompt = f"User has spent ${current_spending} of their ${budget_limit} budget for {category} ({percentage:.1f}%). Provide a brief prediction if they'll exceed the budget."
            
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a financial advisor. Be concise and practical."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=50
            )
            
            return response.choices[0].message.content.strip()
        except Exception as e:
            print(f"Error in predict_budget_usage: {e}")
            return "Budget analysis unavailable."

# Initialize service
ai_service = AIService()
