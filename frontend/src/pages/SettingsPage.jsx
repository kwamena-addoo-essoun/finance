import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { userAPI, authAPI } from '../utils/api';
import './SettingsPage.css';

export default function SettingsPage() {
  const { user, aiDataConsent, setAiDataConsent, logout } = useAuthStore();
  const navigate = useNavigate();

  /* ── AI consent toggle ── */
  const [consentLoading, setConsentLoading] = useState(false);
  const [consentMsg, setConsentMsg] = useState('');

  const handleConsentToggle = async () => {
    setConsentLoading(true);
    setConsentMsg('');
    try {
      const newVal = !aiDataConsent;
      await userAPI.updateAiConsent(newVal);
      setAiDataConsent(newVal);
      setConsentMsg(newVal ? 'AI data sharing enabled.' : 'AI data sharing disabled.');
    } catch {
      setConsentMsg('Failed to update preference. Please try again.');
    } finally {
      setConsentLoading(false);
    }
  };

  /* ── Data export ── */
  const [exportLoading, setExportLoading] = useState(false);

  const handleExport = async () => {
    setExportLoading(true);
    try {
      const res = await userAPI.exportData();
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `finsight-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Export failed. Please try again.');
    } finally {
      setExportLoading(false);
    }
  };

  /* ── Delete account ── */
  const [deletePhase, setDeletePhase] = useState('idle'); // idle | confirm | deleting
  const [deleteError, setDeleteError] = useState('');

  const handleDeleteRequest = () => setDeletePhase('confirm');
  const handleDeleteCancel  = () => { setDeletePhase('idle'); setDeleteError(''); };

  const handleDeleteConfirm = async () => {
    setDeletePhase('deleting');
    setDeleteError('');
    try {
      await userAPI.deleteAccount();
      logout();
      navigate('/login');
    } catch {
      setDeleteError('Account deletion failed. Please try again or contact support.');
      setDeletePhase('confirm');
    }
  };

  return (
    <div className="settings-page">
      <h1>Account Settings</h1>
      <p className="settings-username">Signed in as <strong>{user}</strong></p>

      {/* ── AI data consent ── */}
      <section className="settings-section">
        <h2>AI Data Sharing</h2>
        <p>
          When enabled, a summary of your financial data is sent to OpenAI to power
          the AI Spend Coach. See our <a href="/privacy-policy" target="_blank" rel="noreferrer">Privacy Policy</a> for details.
        </p>
        <div className="settings-toggle-row">
          <span className={`settings-toggle-label ${aiDataConsent ? 'enabled' : 'disabled'}`}>
            {aiDataConsent ? 'Enabled' : 'Disabled'}
          </span>
          <button
            className={`settings-toggle-btn ${aiDataConsent ? 'on' : 'off'}`}
            onClick={handleConsentToggle}
            disabled={consentLoading}
          >
            {consentLoading ? 'Saving…' : aiDataConsent ? 'Disable AI sharing' : 'Enable AI sharing'}
          </button>
        </div>
        {consentMsg && <p className="settings-feedback">{consentMsg}</p>}
      </section>

      {/* ── Data export ── */}
      <section className="settings-section">
        <h2>Export Your Data</h2>
        <p>
          Download a JSON file containing all your expenses, categories, budgets, and savings goals.
          This is your right under the FTC Safeguards Rule.
        </p>
        <button
          className="settings-action-btn"
          onClick={handleExport}
          disabled={exportLoading}
        >
          {exportLoading ? 'Preparing export…' : '⬇ Download my data'}
        </button>
      </section>

      {/* ── Delete account ── */}
      <section className="settings-section settings-section--danger">
        <h2>Delete Account</h2>
        <p>
          Permanently deletes your account and all associated data. This action is
          <strong> irreversible</strong> and cannot be undone.
        </p>

        {deletePhase === 'idle' && (
          <button className="settings-danger-btn" onClick={handleDeleteRequest}>
            Delete my account
          </button>
        )}

        {(deletePhase === 'confirm' || deletePhase === 'deleting') && (
          <div className="settings-delete-confirm">
            <p className="settings-delete-warning">
              ⚠ Are you absolutely sure? All expenses, budgets, goals, and linked accounts will
              be permanently erased.
            </p>
            {deleteError && <p className="settings-delete-error">{deleteError}</p>}
            <div className="settings-delete-actions">
              <button
                className="settings-danger-btn"
                onClick={handleDeleteConfirm}
                disabled={deletePhase === 'deleting'}
              >
                {deletePhase === 'deleting' ? 'Deleting…' : 'Yes, delete everything'}
              </button>
              <button
                className="settings-cancel-btn"
                onClick={handleDeleteCancel}
                disabled={deletePhase === 'deleting'}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
