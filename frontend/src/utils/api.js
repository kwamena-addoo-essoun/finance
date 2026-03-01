import axios from 'axios';

// In development CRA proxies /api → http://localhost:8000/api (see package.json "proxy").
// In production, NGINX routes /api to the backend container.
const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,   // send httpOnly cookies on every request
});

// --- Refresh-token logic ---
// Track in-flight refresh so concurrent 401s don't fire multiple refresh calls.
let _isRefreshing = false;
let _pendingQueue = []; // [{ resolve, reject }]

function _processQueue(error) {
  _pendingQueue.forEach(({ resolve, reject }) =>
    error ? reject(error) : resolve()
  );
  _pendingQueue = [];
}

function _redirectToLogin() {
  if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register')) {
    window.location.href = '/login';
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only handle 401s that haven't already been retried
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Don't try to refresh on auth endpoints themselves
    if (originalRequest.url?.includes('/auth/')) {
      _redirectToLogin();
      return Promise.reject(error);
    }

    if (_isRefreshing) {
      // Queue this request until the in-flight refresh resolves
      return new Promise((resolve, reject) => {
        _pendingQueue.push({ resolve, reject });
      }).then(() => api(originalRequest));
    }

    originalRequest._retry = true;
    _isRefreshing = true;

    try {
      // The refresh_token httpOnly cookie is sent automatically here
      await axios.post(`${API_BASE_URL}/auth/refresh`, {}, { withCredentials: true });
      _processQueue(null);
      return api(originalRequest);
    } catch (refreshError) {
      _processQueue(refreshError);
      _redirectToLogin();
      return Promise.reject(refreshError);
    } finally {
      _isRefreshing = false;
    }
  }
);

export const authAPI = {
  register: (email, username, password) =>
    api.post('/auth/register', { email, username, password }),
  login: (username, password) =>
    api.post('/auth/login', { username, password }),
  logout: () =>
    api.post('/auth/logout'),
  forgotPassword: (email) =>
    api.post('/auth/forgot-password', { email }),
  resetPassword: (token, new_password) =>
    api.post('/auth/reset-password', { token, new_password }),
  sendVerification: (email) =>
    api.post('/auth/send-verification', { email }),
  verifyEmail: (token) =>
    api.post('/auth/verify-email', { token }),
};

export const plaidAPI = {
  createLinkToken: () => api.post('/plaid/create-link-token'),
  exchangeToken: (public_token, institution_id, institution_name) =>
    api.post('/plaid/exchange-token', { public_token, institution_id, institution_name }),
  getAccounts: () => api.get('/plaid/accounts'),
  deleteAccount: (id) => api.delete(`/plaid/accounts/${id}`),
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

export const aiAPI = {
  chat: (message, history = []) => api.post('/ai/chat', { message, history }),
};

export const goalsAPI = {
  getAll: () => api.get('/goals/'),
  create: (goal) => api.post('/goals/', goal),
  update: (id, goal) => api.put(`/goals/${id}`, goal),
  contribute: (id, amount) => api.post(`/goals/${id}/contribute`, { amount }),
  delete: (id) => api.delete(`/goals/${id}`),
};

export const userAPI = {
  exportData: () => api.get('/users/me/export'),
  deleteAccount: () => api.delete('/users/me'),
};

export default api;
