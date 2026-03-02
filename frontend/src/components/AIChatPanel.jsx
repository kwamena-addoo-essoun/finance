import React, { useState, useRef, useEffect } from 'react';
import { aiAPI, userAPI } from '../utils/api';
import { useAuthStore } from '../store/authStore';
import './AIChatPanel.css';

const SUGGESTED = [
  'Where am I overspending?',
  'How does this month compare to last month?',
  "Which category takes the most of my money?",
  'Am I on track to meet my budgets?',
  'Give me 3 tips to reduce my spending.',
];

export default function AIChatPanel({ onClose }) {
  const { aiDataConsent, setAiDataConsent } = useAuthStore();
  const [consentGiven, setConsentGiven] = useState(aiDataConsent);
  const [messages,  setMessages]  = useState([
    { role: 'assistant', content: "Hi! I'm your Finsight AI Coach. I have access to your real spending data — ask me anything about your finances." }
  ]);
  const [input,     setInput]     = useState('');
  const [loading,   setLoading]   = useState(false);
  const bottomRef  = useRef(null);
  const inputRef   = useRef(null);

  async function handleConsent() {
    try {
      await userAPI.updateAiConsent(true);
      setAiDataConsent(true);
    } catch {
      // If the API call fails, still allow the session to proceed
      // (will be enforced server-side per request)
    }
    setConsentGiven(true);
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const send = async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput('');
    const history = messages.filter(m => m.role !== 'system');
    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    setLoading(true);
    try {
      const res = await aiAPI.chat(msg, history);
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.reply }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }]);
    } finally { setLoading(false); }
  };

  const handleKey = e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } };

  return (
    <div className="ai-panel-overlay" onClick={onClose}>
      <div className="ai-panel" onClick={e => e.stopPropagation()}>

        <div className="ai-panel-header">
          <div className="ai-panel-title-wrap">
            <span className="ai-panel-icon">✦</span>
            <div>
              <div className="ai-panel-title">AI Spend Coach</div>
              <div className="ai-panel-sub">Powered by your real financial data</div>
            </div>
          </div>
          <button className="ai-panel-close" onClick={onClose}>✕</button>
        </div>

        {!consentGiven ? (
          /* ── Data-sharing consent screen (GLBA NPI disclosure) ── */
          <div className="ai-consent">
            <div className="ai-consent-icon">🔒</div>
            <h3>Before we continue</h3>
            <p>
              To answer your questions, the AI Coach sends a summary of your
              financial data — including spending totals, category breakdowns,
              and recent transactions — to <strong>OpenAI</strong> to generate
              a response.
            </p>
            <ul className="ai-consent-list">
              <li>Your data is transmitted over an encrypted connection (HTTPS).</li>
              <li>We do not sell your financial information.</li>
              <li>OpenAI processes the data per their{' '}
                <a href="https://openai.com/enterprise-privacy" target="_blank" rel="noopener noreferrer">
                  Enterprise Privacy Policy
                </a>.
              </li>
              <li>You can revoke consent at any time in your account settings.</li>
            </ul>
            <div className="ai-consent-actions">
              <button className="ai-consent-accept" onClick={handleConsent}>
                I understand — continue
              </button>
              <button className="ai-consent-decline" onClick={onClose}>
                Not now
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="ai-messages">
              {messages.map((m, i) => (
                <div key={i} className={`ai-msg ai-msg--${m.role}`}>
                  {m.role === 'assistant' && <span className="ai-avatar">✦</span>}
                  <div className="ai-bubble">{m.content}</div>
                </div>
              ))}
              {loading && (
                <div className="ai-msg ai-msg--assistant">
                  <span className="ai-avatar">✦</span>
                  <div className="ai-bubble ai-typing"><span/><span/><span/></div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {messages.length <= 1 && (
              <div className="ai-suggestions">
                {SUGGESTED.map((s, i) => (
                  <button key={i} className="ai-suggestion" onClick={() => send(s)}>{s}</button>
                ))}
              </div>
            )}

            <div className="ai-input-row">
              <textarea
                ref={inputRef}
                className="ai-input"
                rows={1}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Ask about your spending…"
                disabled={loading}
              />
              <button className="ai-send" onClick={() => send()} disabled={!input.trim() || loading}>
                {loading ? '…' : '↑'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
