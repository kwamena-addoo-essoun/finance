import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import './store/themeStore'; // ensure theme token is applied before first render
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import ResendVerificationPage from './pages/ResendVerificationPage';
import AccountsPage from './pages/AccountsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import GoalsPage from './pages/GoalsPage';
import { useAuthStore } from './store/authStore';
import api from './utils/api';

function VerificationBanner() {
  const { isAuthenticated, isVerified, setVerified } = useAuthStore();
  const [dismissed, setDismissed] = useState(false);
  const [sent, setSent] = useState(false);

  if (!isAuthenticated || isVerified || dismissed) return null;

  const handleResend = async () => {
    try {
      // We don't have the email in store — navigate to resend page instead
      setSent(true);
    } catch {}
  };

  return (
    <div style={{
      background: '#fffbeb', borderBottom: '1px solid #fcd34d',
      padding: '0.6rem 1rem', textAlign: 'center', fontSize: '0.875rem', color: '#92400e'
    }}>
      {sent ? (
        <span>Check your inbox for a verification link.</span>
      ) : (
        <>
          ⚠️ Your email is not verified.{' '}
          <a href="/resend-verification" style={{ color: '#6366f1', fontWeight: 600 }}>
            Resend verification email
          </a>{' '}
          <button onClick={() => setDismissed(true)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#92400e', marginLeft: '1rem', fontSize: '0.85rem'
          }}>Dismiss</button>
        </>
      )}
    </div>
  );
}

function App() {
  const { isAuthenticated, setAuth } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        // The access_token httpOnly cookie is sent automatically.
        // A 200 response means the session is still valid.
        const { data } = await api.get('/users/me');
        setAuth(true, data.username, data.is_verified ?? false, data.is_admin ?? false);
      } catch {
        // 401 — no valid session; user stays logged out
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, [setAuth]);

  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <Router>
      <div className="app">
        <Navbar />
        <VerificationBanner />
        <main className="main-content">
          <Routes>
            <Route path="/" element={isAuthenticated ? <HomePage /> : <Navigate to="/login" />} />
            <Route path="/accounts" element={isAuthenticated ? <AccountsPage /> : <Navigate to="/login" />} />
            <Route path="/analytics" element={isAuthenticated ? <AnalyticsPage /> : <Navigate to="/login" />} />
            <Route path="/goals" element={isAuthenticated ? <GoalsPage /> : <Navigate to="/login" />} />
            <Route path="/login" element={!isAuthenticated ? <LoginPage /> : <Navigate to="/" />} />
            <Route path="/register" element={!isAuthenticated ? <RegisterPage /> : <Navigate to="/" />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/resend-verification" element={<ResendVerificationPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
