# Finsight

AI-powered personal finance — track expenses, manage budgets, and get smart spending insights.

## Features

- **User Authentication**: Secure registration and login with JWT tokens
- **Expense Tracking**: Log and categorize expenses with rich details
- **AI Categorization**: Automatic expense categorization using OpenAI
- **Budget Management**: Create and monitor budgets with spending alerts
- **Dashboard**: Real-time visualization of spending patterns and budgets
- **AI Insights**: Smart spending predictions and recommendations

## Tech Stack

### Backend
- FastAPI (Python)
- SQLAlchemy ORM
- PostgreSQL / SQLite
- OpenAI API integration
- JWT Authentication

### Frontend
- React 18
- Zustand (State Management)
- Recharts (Data Visualization)
- Axios (HTTP Client)

## Setup & Installation

### Backend Setup

1. Navigate to the backend directory:
   \`\`\`bash
   cd backend
   \`\`\`

2. Create a virtual environment:
   \`\`\`bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\\Scripts\\activate
   \`\`\`

3. Install dependencies:
   \`\`\`bash
   pip install -r requirements.txt
   \`\`\`

4. Create a \`.env\` file (copy from \`.env.example\`):
   \`\`\`bash
   cp .env.example .env
   \`\`\`

5. Set up your database and add your OpenAI API key to \`.env\`

6. Run the backend:
   \`\`\`bash
   python main.py
   \`\`\`

The API will be available at \`http://localhost:8000\`

### Frontend Setup

1. Navigate to the frontend directory:
   \`\`\`bash
   cd frontend
   \`\`\`

2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

3. Create a \`.env\` file (copy from \`.env.example\`):
   \`\`\`bash
   cp .env.example .env
   \`\`\`

4. Start the development server:
   \`\`\`bash
   npm start
   \`\`\`

The app will be available at \`http://localhost:3000\`

## API Endpoints

### Authentication
- \`POST /api/auth/register\` - Register a new user
- \`POST /api/auth/login\` - Login user

### Expenses
- \`GET /api/expenses/\` - Get all expenses
- \`POST /api/expenses/\` - Create new expense
- \`PUT /api/expenses/{id}\` - Update expense
- \`DELETE /api/expenses/{id}\` - Delete expense

### Categories
- \`GET /api/categories/\` - Get all categories
- \`POST /api/categories/\` - Create new category
- \`PUT /api/categories/{id}\` - Update category
- \`DELETE /api/categories/{id}\` - Delete category

### Budgets
- \`GET /api/budgets/\` - Get all budgets
- \`POST /api/budgets/\` - Create new budget
- \`PUT /api/budgets/{id}\` - Update budget
- \`DELETE /api/budgets/{id}\` - Delete budget

## Development Notes

This project demonstrates:
- Full-stack development with React and FastAPI
- AI integration for automatic categorization
- JWT-based authentication
- RESTful API design
- Responsive UI components
- State management with Zustand

## Future Enhancements

- Mobile app with React Native
- Advanced analytics and reporting
- Recurring expense automation
- Multi-currency support
- Export to PDF/CSV
- Email notifications
- Integration with bank APIs

## License

MIT
