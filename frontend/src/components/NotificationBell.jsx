import React, { useState, useEffect, useRef, useCallback } from 'react';
import { budgetAPI } from '../utils/api';
import './NotificationBell.css';

const STORAGE_KEY = 'finsight-dismissed-alerts';

function getAlerts(budgets) {
  return budgets
    .filter(b => b.limit_amount > 0)
    .map(b => {
      const pct = ((b.spent_amount || 0) / b.limit_amount) * 100;
      if (pct >= 100) return { id: `exc-${b.id}`, type: 'exceeded', title: `Budget exceeded`, msg: `"${b.name}" is over limit (${pct.toFixed(0)}%)`, color: '#ef4444' };
      if (pct >= 80)  return { id: `warn-${b.id}`, type: 'warning',  title: `Budget warning`,  msg: `"${b.name}" is at ${pct.toFixed(0)}% of limit`, color: '#f59e0b' };
      return null;
    })
    .filter(Boolean);
}

export default function NotificationBell() {
  const [budgets,    setBudgets]    = useState([]);
  const [dismissed,  setDismissed]  = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
  });
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const fetchBudgets = useCallback(async () => {
    try { const res = await budgetAPI.getAll(); setBudgets(res.data); } catch {}
  }, []);

  useEffect(() => { fetchBudgets(); }, [fetchBudgets]);

  // Close on outside click
  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const allAlerts  = getAlerts(budgets);
  const visible    = allAlerts.filter(a => !dismissed.includes(a.id));
  const count      = visible.length;

  const dismiss = (id) => {
    const next = [...dismissed, id];
    setDismissed(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const dismissAll = () => {
    const next = [...dismissed, ...visible.map(a => a.id)];
    setDismissed(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setOpen(false);
  };

  return (
    <div ref={ref} className="notif-wrap">
      <button className="notif-bell" onClick={() => setOpen(o => !o)} title="Notifications">
        <span className="notif-bell-icon">🔔</span>
        {count > 0 && <span className="notif-badge">{count}</span>}
      </button>

      {open && (
        <div className="notif-dropdown">
          <div className="notif-dd-header">
            <span className="notif-dd-title">Notifications</span>
            {count > 0 && <button className="notif-clear-all" onClick={dismissAll}>Clear all</button>}
          </div>
          {count === 0 ? (
            <div className="notif-empty">All clear — no budget alerts.</div>
          ) : (
            visible.map(a => (
              <div key={a.id} className="notif-item">
                <div className="notif-item-dot" style={{ background: a.color }} />
                <div className="notif-item-body">
                  <div className="notif-item-title" style={{ color: a.color }}>{a.title}</div>
                  <div className="notif-item-msg">{a.msg}</div>
                </div>
                <button className="notif-item-close" onClick={() => dismiss(a.id)}>✕</button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
