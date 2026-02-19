import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.params = config.params || {};
    config.params.token = token;
  }
  return config;
});

export const authAPI = {
  register: (email, username, password) =>
    api.post('/auth/register', { email, username, password }),
  login: (username, password) =>
    api.post('/auth/login', { username, password }),
};

export const expenseAPI = {
  getAll: () => api.get('/expenses/'),
  create: (expense) => api.post('/expenses/', expense),
  update: (id, expense) => api.put(`/expenses/${id}`, expense),
  delete: (id) => api.delete(`/expenses/${id}`),
};

export const categoryAPI = {
  getAll: () => api.get('/categories/'),
  create: (category) => api.post('/categories/', category),
  update: (id, category) => api.put(`/categories/${id}`, category),
  delete: (id) => api.delete(`/categories/${id}`),
};

export const budgetAPI = {
  getAll: () => api.get('/budgets/'),
  create: (budget) => api.post('/budgets/', budget),
  update: (id, budget) => api.put(`/budgets/${id}`, budget),
  delete: (id) => api.delete(`/budgets/${id}`),
};

export default api;
