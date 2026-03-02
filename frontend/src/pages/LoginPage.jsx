import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './AuthPages.css';
import { authAPI } from '../utils/api';
import { useAuthStore } from '../store/authStore';
import FinsightLogo from '../components/FinsightLogo';

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.login(username, password);
      const { username: returnedUsername, is_verified, is_admin, ai_data_consent } = response.data;
      setAuth(true, returnedUsername ?? username, is_verified ?? false, is_admin ?? false, ai_data_consent ?? false);
      navigate('/');
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (Array.isArray(detail)) {
        setError(detail.map((e) => e.msg?.replace('Value error, ', '') ?? e).join(' · '));
      } else {
        setError(detail || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">

      {/* ── Left brand panel ── */}
      <aside className="auth-panel">
        <div className="auth-panel-logo">
          <FinsightLogo size="sm" />
        </div>

        <div className="auth-panel-body">
          <p className="auth-panel-tagline">
            Your money,<br />finally making sense.
          </p>
          <p className="auth-panel-sub">
            Track spending, set budgets, and get AI-powered insights — all in one place.
          </p>
        </div>

        <div className="auth-panel-stats">
          <div>
            <div className="auth-stat-num">$2.4M</div>
            <div className="auth-stat-lbl">Tracked by users</div>
          </div>
          <div>
            <div className="auth-stat-num">12k</div>
            <div className="auth-stat-lbl">Active accounts</div>
          </div>
          <div>
            <div className="auth-stat-num">99%</div>
            <div className="auth-stat-lbl">Uptime</div>
          </div>
        </div>
      </aside>

      {/* ── Right form panel ── */}
      <div className="auth-form-panel">
        <div className="auth-card">
          <h1>Welcome back</h1>
          <p className="auth-subtitle">
            No account?{' '}
            <Link to="/register">Create one free →</Link>
          </p>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                placeholder="your_username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="auth-row">
              <Link to="/forgot-password">Forgot password?</Link>
            </div>

            <button type="submit" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>

    </div>
  );
}

export default LoginPage;
