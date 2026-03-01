import React, { useEffect, useState, useCallback } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import './AccountsPage.css';
import api from '../utils/api';

// ---- Helper: account type icon ----
function accountIcon(type) {
  if (!type) return '🏦';
  if (type.includes('credit')) return '💳';
  if (type.includes('investment') || type.includes('brokerage')) return '📈';
  if (type.includes('loan') || type.includes('mortgage')) return '🏠';
  return '🏦';
}

// ---- Plaid Link wrapper ----
function PlaidLinkButton({ onSuccess, linkToken }) {
  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: (public_token, metadata) => {
      onSuccess(public_token, metadata);
    },
  });

  return (
    <button
      className="link-bank-btn"
      onClick={() => open()}
      disabled={!ready || !linkToken}
    >
      {!linkToken ? 'Loading…' : '+ Link Bank Account'}
    </button>
  );
}

// ---- Main component ----
function AccountsPage() {
  const [accounts, setAccounts] = useState([]);
  const [linkToken, setLinkToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [unlinkingId, setUnlinkingId] = useState(null);

  // Fetch accounts
  const fetchAccounts = useCallback(async () => {
    try {
      const res = await api.get('/plaid/accounts');
      setAccounts(res.data);
    } catch (err) {
      setError('Could not load accounts. ' + (err.response?.data?.detail || ''));
    }
  }, []);

  // Create Plaid link token
  const fetchLinkToken = useCallback(async () => {
    try {
      const res = await api.post('/plaid/create-link-token');
      setLinkToken(res.data.link_token);
    } catch (err) {
      // Plaid not configured — show friendly message
      setError(
        err.response?.data?.detail ||
          'Bank linking is not yet configured on this server.'
      );
    }
  }, []);

  useEffect(() => {
    Promise.all([fetchAccounts(), fetchLinkToken()]).finally(() =>
      setLoading(false)
    );
  }, [fetchAccounts, fetchLinkToken]);

  // After Plaid Link completes
  const handlePlaidSuccess = async (publicToken, metadata) => {
    try {
      await api.post('/plaid/exchange-token', {
        public_token: publicToken,
        institution_id: metadata.institution?.institution_id,
        institution_name: metadata.institution?.name,
      });
      await fetchAccounts();
      // Refresh link token for next use
      await fetchLinkToken();
    } catch (err) {
      setError('Failed to link account: ' + (err.response?.data?.detail || ''));
    }
  };

  const handleUnlink = async (id) => {
    setUnlinkingId(id);
    try {
      await api.delete(`/plaid/accounts/${id}`);
      setAccounts((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      setError('Failed to unlink account.');
    } finally {
      setUnlinkingId(null);
    }
  };

  if (loading) return <div className="accounts-loading">Loading accounts…</div>;

  return (
    <div className="accounts-page">
      <div className="accounts-header">
        <h2>Linked Bank Accounts</h2>
        <PlaidLinkButton linkToken={linkToken} onSuccess={handlePlaidSuccess} />
      </div>

      {error && <div className="accounts-error">{error}</div>}

      {accounts.length === 0 && !error && (
        <div className="accounts-empty">
          <p>No bank accounts linked yet.</p>
          <p>Click <strong>+ Link Bank Account</strong> to connect your first account.</p>
        </div>
      )}

      <div className="accounts-list">
        {accounts.map((acct) => (
          <div key={acct.id} className="account-card">
            <div className="account-icon">{accountIcon(acct.subtype || acct.type)}</div>
            <div className="account-info">
              <div className="account-name">
                {acct.official_name || acct.name}
                {acct.mask && <span className="account-mask"> ···{acct.mask}</span>}
              </div>
              <div className="account-meta">
                {acct.institution_name && (
                  <span className="account-institution">{acct.institution_name}</span>
                )}
                <span className="account-type">
                  {acct.subtype || acct.type || 'account'}
                </span>
              </div>
            </div>
            <div className="account-balances">
              {acct.current_balance != null && (
                <div className="balance-current">
                  ${acct.current_balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  <span className="balance-label"> current</span>
                </div>
              )}
              {acct.available_balance != null && (
                <div className="balance-available">
                  ${acct.available_balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  <span className="balance-label"> available</span>
                </div>
              )}
            </div>
            <button
              className="unlink-btn"
              onClick={() => handleUnlink(acct.id)}
              disabled={unlinkingId === acct.id}
            >
              {unlinkingId === acct.id ? '…' : 'Unlink'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AccountsPage;
