import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './AuthPages.css';
import { authAPI } from '../utils/api';
import { useAuthStore } from '../store/authStore';
import FinsightLogo from '../components/FinsightLogo';

function RegisterPage() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      await authAPI.register(email, username, password);
      const loginResponse = await authAPI.login(username, password);
      const { username: returnedUsername, is_verified, is_admin } = loginResponse.data;
      setAuth(true, returnedUsername ?? username, is_verified ?? false, is_admin ?? false);
      navigate('/');
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (Array.isArray(detail)) {
        setError(detail.map((e) => e.msg?.replace('Value error, ', '') ?? e).join(' · '));
      } else {
        setError(detail || 'Registration failed');
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
            Start your financial journey today.
          </p>
          <p className="auth-panel-sub">
            Join thousands of people who've taken control of their finances with Finsight.
          </p>
        </div>

        <div className="auth-panel-stats">
          <div>
            <div className="auth-stat-num">Free</div>
            <div className="auth-stat-lbl">Always</div>
          </div>
          <div>
            <div className="auth-stat-num">AI</div>
            <div className="auth-stat-lbl">Powered insights</div>
          </div>
          <div>
            <div className="auth-stat-num">Bank</div>
            <div className="auth-stat-lbl">Sync via Plaid</div>
          </div>
        </div>
      </aside>

      {/* ── Right form panel ── */}
      <div className="auth-form-panel">
        <div className="auth-card">
          <h1>Create account</h1>
          <p className="auth-subtitle">
            Already have one?{' '}
            <Link to="/login">Sign in →</Link>
          </p>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleRegister}>
            <div className="form-group">
              <label htmlFor="reg-email">Email</label>
              <input
                id="reg-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label htmlFor="reg-username">Username</label>
              <input
                id="reg-username"
                type="text"
                placeholder="choose_a_username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="reg-password">Password</label>
              <input
                id="reg-password"
                type="password"
                placeholder="min. 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="reg-confirm">Confirm Password</label>
              <input
                id="reg-confirm"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" disabled={loading}>
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>
        </div>
      </div>

    </div>
  );
}

export default RegisterPage;
