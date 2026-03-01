import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import '../pages/AuthPages.css';
import api from '../utils/api';
import { useAuthStore } from '../store/authStore';

function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const { setVerified } = useAuthStore();

  const [status, setStatus] = useState('verifying'); // verifying | success | error
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No verification token found in the link.');
      return;
    }

    api
      .post('/auth/verify-email', { token })
      .then((res) => {
        setStatus('success');
        setMessage(res.data.message);
        setVerified(true);
      })
      .catch((err) => {
        setStatus('error');
        setMessage(
          err.response?.data?.detail || 'Verification failed. The link may have expired.'
        );
      });
  }, [token, setVerified]);

  return (
    <div className="auth-container">
      <div className="auth-card">
        {status === 'verifying' && (
          <>
            <h1>Verifying…</h1>
            <p>Please wait while we verify your email.</p>
          </>
        )}
        {status === 'success' && (
          <>
            <h1>✅ Email Verified</h1>
            <div className="success-message">{message}</div>
            <p>
              <Link to="/">Go to dashboard →</Link>
            </p>
          </>
        )}
        {status === 'error' && (
          <>
            <h1>Verification Failed</h1>
            <div className="error-message">{message}</div>
            <p>
              Need a new link?{' '}
              <Link to="/resend-verification">Resend verification email</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default VerifyEmailPage;
