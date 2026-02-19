import React, { useState, useEffect } from 'react';
import './HomePage.css';
import { expenseAPI, categoryAPI, budgetAPI } from '../utils/api';

function HomePage() {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [newExpense, setNewExpense] = useState({
    title: '',
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    category_id: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [expensesRes, categoriesRes, budgetsRes] = await Promise.all([
        expenseAPI.getAll(),
        categoryAPI.getAll(),
        budgetAPI.getAll(),
      ]);
      
      setExpenses(expensesRes.data);
      setCategories(categoriesRes.data);
      setBudgets(budgetsRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    try {
      await expenseAPI.create({
        ...newExpense,
        amount: parseFloat(newExpense.amount),
        category_id: parseInt(newExpense.category_id),
      });
      setNewExpense({
        title: '',
        description: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        category_id: '',
      });
      setShowExpenseForm(false);
      fetchData();
    } catch (error) {
      console.error('Failed to add expense:', error);
    }
  };

  const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const totalBudget = budgets.reduce((sum, b) => sum + b.limit_amount, 0);

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="home-page">
      <h1>Finance Dashboard</h1>
      
      <div className="dashboard-grid">
        <div className="card summary-card">
          <h2>Total Spent</h2>
          <p className="amount">${totalSpent.toFixed(2)}</p>
        </div>
        
        <div className="card summary-card">
          <h2>Total Budget</h2>
          <p className="amount">${totalBudget.toFixed(2)}</p>
        </div>
        
        <div className="card summary-card">
          <h2>Remaining</h2>
          <p className="amount" style={{ color: totalSpent <= totalBudget ? '#27ae60' : '#e74c3c' }}>
            ${(totalBudget - totalSpent).toFixed(2)}
          </p>
        </div>
      </div>

      <div className="card expenses-card">
        <div className="card-header">
          <h2>Recent Expenses</h2>
          <button onClick={() => setShowExpenseForm(!showExpenseForm)} className="btn-primary">
            {showExpenseForm ? 'Cancel' : 'Add Expense'}
          </button>
        </div>

        {showExpenseForm && (
          <form onSubmit={handleAddExpense} className="expense-form">
            <div className="form-group">
              <label>Title</label>
              <input
                type="text"
                value={newExpense.title}
                onChange={(e) => setNewExpense({ ...newExpense, title: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Amount</label>
              <input
                type="number"
                step="0.01"
                value={newExpense.amount}
                onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Category</label>
              <select
                value={newExpense.category_id}
                onChange={(e) => setNewExpense({ ...newExpense, category_id: e.target.value })}
                required
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <button type="submit" className="btn-primary">Add Expense</button>
          </form>
        )}

        <div className="expenses-list">
          {expenses.length === 0 ? (
            <p>No expenses yet. Add one to get started!</p>
          ) : (
            expenses.slice(0, 10).map((exp) => (
              <div key={exp.id} className="expense-item">
                <div>
                  <h4>{exp.title}</h4>
                  <p>{new Date(exp.date).toLocaleDateString()}</p>
                  {exp.ai_category && <p className="ai-tag">AI: {exp.ai_category}</p>}
                </div>
                <p className="amount">${exp.amount.toFixed(2)}</p>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="card budgets-card">
        <h2>Budgets</h2>
        <div className="budgets-list">
          {budgets.length === 0 ? (
            <p>No budgets set. Create one to manage your spending!</p>
          ) : (
            budgets.map((budget) => (
              <div key={budget.id} className="budget-item">
                <h4>{budget.name}</h4>
                <div className="budget-progress">
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${Math.min((budget.spent_amount / budget.limit_amount) * 100, 100)}%`,
                        backgroundColor: (budget.spent_amount / budget.limit_amount) > 0.8 ? '#e74c3c' : '#3498db'
                      }}
                    ></div>
                  </div>
                  <p>${budget.spent_amount.toFixed(2)} / ${budget.limit_amount.toFixed(2)}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default HomePage;
