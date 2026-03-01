import React, { useState, useEffect, useCallback } from "react";
import { goalsAPI } from "../utils/api";
import "./GoalsPage.css";

const ICONS = ["🎯","✈️","🏠","🚗","💻","📚","💍","🏖️","💰","🎓","🏋️","🎸"];
const COLORS = [
  "#10b981","#6366f1","#f59e0b","#ef4444","#3b82f6",
  "#8b5cf6","#ec4899","#14b8a6","#f97316","#84cc16",
];

function ring(pct) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const fill = Math.min(pct, 100) / 100;
  return { strokeDasharray: circ, strokeDashoffset: circ * (1 - fill) };
}

function fmt(n) {
  return Number(n || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

const EMPTY = {
  name: "",
  target_amount: "",
  current_amount: "0",
  deadline: "",
  color: COLORS[0],
  icon: "🎯",
  notes: "",
};

export default function GoalsPage() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState(null); // null | "add" | "edit" | "contribute" | "delete"
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [contributeAmt, setContributeAmt] = useState("");
  const [saving, setSaving] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [celebrate, setCelebrate] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await goalsAPI.getAll();
      setGoals(res.data);
    } catch {
      setError("Failed to load goals");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const active = goals.filter(g => !g.is_completed);
  const completed = goals.filter(g => g.is_completed);
  const totalTarget = active.reduce((s, g) => s + g.target_amount, 0);
  const totalSaved = active.reduce((s, g) => s + g.current_amount, 0);
  const overallPct = totalTarget > 0 ? (totalSaved / totalTarget * 100) : 0;

  function openAdd() { setForm(EMPTY); setModal("add"); }
  function openEdit(g) {
    setSelected(g);
    setForm({
      name: g.name,
      target_amount: g.target_amount,
      current_amount: g.current_amount,
      deadline: g.deadline ? g.deadline.slice(0, 10) : "",
      color: g.color,
      icon: g.icon,
      notes: g.notes || "",
    });
    setModal("edit");
  }
  function openContribute(g) { setSelected(g); setContributeAmt(""); setModal("contribute"); }
  function openDelete(g) { setSelected(g); setModal("delete"); }
  function closeModal() { setModal(null); setSelected(null); }

  async function handleAdd(e) {
    e.preventDefault(); setSaving(true);
    try {
      await goalsAPI.create({
        name: form.name,
        target_amount: parseFloat(form.target_amount),
        current_amount: parseFloat(form.current_amount) || 0,
        color: form.color,
        icon: form.icon,
        notes: form.notes || null,
        deadline: form.deadline ? new Date(form.deadline).toISOString() : null,
      });
      closeModal(); load();
    } catch { setError("Failed to create goal"); }
    finally { setSaving(false); }
  }

  async function handleEdit(e) {
    e.preventDefault(); setSaving(true);
    try {
      await goalsAPI.update(selected.id, {
        name: form.name,
        target_amount: parseFloat(form.target_amount),
        current_amount: parseFloat(form.current_amount) || 0,
        color: form.color,
        icon: form.icon,
        notes: form.notes || null,
        deadline: form.deadline ? new Date(form.deadline).toISOString() : null,
      });
      closeModal(); load();
    } catch { setError("Failed to update goal"); }
    finally { setSaving(false); }
  }

  async function handleContribute(e) {
    e.preventDefault(); setSaving(true);
    try {
      const res = await goalsAPI.contribute(selected.id, parseFloat(contributeAmt));
      if (res.data.is_completed) {
        setCelebrate(res.data.id);
        setTimeout(() => setCelebrate(null), 3500);
      }
      closeModal(); load();
    } catch { setError("Failed to add contribution"); }
    finally { setSaving(false); }
  }

  async function handleDelete() {
    setSaving(true);
    try { await goalsAPI.delete(selected.id); closeModal(); load(); }
    catch { setError("Failed to delete goal"); }
    finally { setSaving(false); }
  }

  function daysLeft(iso) {
    if (!iso) return null;
    const diff = Math.ceil((new Date(iso) - Date.now()) / 86400000);
    if (diff < 0) return "Overdue";
    if (diff === 0) return "Due today";
    return `${diff}d left`;
  }

  function GoalCard({ g }) {
    const pct = g.target_amount > 0 ? (g.current_amount / g.target_amount * 100) : 0;
    const dl = daysLeft(g.deadline);
    return (
      <div className={`goal-card${g.is_completed ? " goal-card--done" : ""}${celebrate === g.id ? " goal-card--celebrate" : ""}`}>
        <div className="goal-ring-wrap">
          <svg viewBox="0 0 120 120" className="goal-ring">
            <circle cx="60" cy="60" r="54" className="ring-bg" />
            <circle cx="60" cy="60" r="54" className="ring-fill"
              style={{ ...ring(pct), stroke: g.color }} />
          </svg>
          <span className="goal-icon">{g.icon}</span>
        </div>
        <div className="goal-info">
          <h3 className="goal-name">{g.name}</h3>
          <p className="goal-amounts">
            <span style={{ color: g.color }}>${fmt(g.current_amount)}</span>
            &nbsp;/ ${fmt(g.target_amount)}
          </p>
          <div className="goal-bar-row">
            <div className="goal-bar">
              <div className="goal-bar-fill" style={{ width: `${Math.min(pct, 100)}%`, background: g.color }} />
            </div>
            <span className="goal-pct">{Math.round(pct)}%</span>
          </div>
          {dl && (
            <span className={`goal-deadline${dl === "Overdue" ? " goal-deadline--late" : ""}`}>
              📅 {dl}
            </span>
          )}
          {g.notes && <p className="goal-notes">{g.notes}</p>}
        </div>
        {!g.is_completed && (
          <div className="goal-actions">
            <button className="goal-action-btn goal-action-btn--contribute"
              onClick={() => openContribute(g)} title="Add funds">＋</button>
            <button className="goal-action-btn goal-action-btn--edit"
              onClick={() => openEdit(g)} title="Edit">✏</button>
            <button className="goal-action-btn goal-action-btn--delete"
              onClick={() => openDelete(g)} title="Delete">🗑</button>
          </div>
        )}
        {g.is_completed && <div className="goal-done-badge">✓ Done</div>}
        {celebrate === g.id && <div className="goal-confetti">🎉 Goal reached!</div>}
      </div>
    );
  }

  function GoalForm({ onSubmit, submitLabel }) {
    return (
      <form onSubmit={onSubmit} className="goal-form">
        <label>Name
          <input value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            required placeholder="e.g. Emergency Fund" />
        </label>
        <div className="form-row">
          <label>Target ($)
            <input type="number" min="0.01" step="0.01" value={form.target_amount}
              onChange={e => setForm(f => ({ ...f, target_amount: e.target.value }))} required />
          </label>
          <label>Saved so far ($)
            <input type="number" min="0" step="0.01" value={form.current_amount}
              onChange={e => setForm(f => ({ ...f, current_amount: e.target.value }))} />
          </label>
        </div>
        <label>Deadline (optional)
          <input type="date" value={form.deadline}
            onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} />
        </label>
        <label>Icon
          <div className="icon-picker">
            {ICONS.map(ic => (
              <button type="button" key={ic}
                className={`icon-opt${form.icon === ic ? " icon-opt--active" : ""}`}
                style={form.icon === ic ? { borderColor: form.color } : {}}
                onClick={() => setForm(f => ({ ...f, icon: ic }))}>{ic}</button>
            ))}
          </div>
        </label>
        <label>Color
          <div className="color-picker">
            {COLORS.map(c => (
              <button type="button" key={c}
                className={`color-swatch${form.color === c ? " color-swatch--active" : ""}`}
                style={{ background: c }}
                onClick={() => setForm(f => ({ ...f, color: c }))} />
            ))}
          </div>
        </label>
        <label>Notes (optional)
          <textarea rows="2" value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            placeholder="What's this goal for?" />
        </label>
        <div className="modal-footer">
          <button type="button" className="btn-ghost" onClick={closeModal}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? "Saving…" : submitLabel}
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="goals-page">
      <div className="goals-header">
        <div>
          <h1 className="goals-title">Savings Goals</h1>
          <p className="goals-sub">Track progress towards what matters most</p>
        </div>
        <button className="btn-primary" onClick={openAdd}>＋ New Goal</button>
      </div>

      {error && (
        <div className="error-banner">
          {error}
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {goals.length > 0 && (
        <div className="goals-summary">
          <div className="gs-stat">
            <span className="gs-val">{active.length}</span>
            <span className="gs-label">Active</span>
          </div>
          <div className="gs-stat">
            <span className="gs-val">${fmt(totalSaved)}</span>
            <span className="gs-label">Total saved</span>
          </div>
          <div className="gs-stat">
            <span className="gs-val">${fmt(totalTarget)}</span>
            <span className="gs-label">Total target</span>
          </div>
          <div className="gs-stat gs-stat--progress">
            <div className="gs-overall-bar">
              <div className="gs-overall-fill" style={{ width: `${Math.min(overallPct, 100)}%` }} />
            </div>
            <span className="gs-label">{Math.round(overallPct)}% overall</span>
          </div>
          <div className="gs-stat">
            <span className="gs-val">{completed.length}</span>
            <span className="gs-label">Completed</span>
          </div>
        </div>
      )}

      {loading ? (
        <div className="goals-loading">Loading goals…</div>
      ) : active.length === 0 ? (
        <div className="goals-empty">
          <span className="goals-empty-icon">🎯</span>
          <p>No active goals yet.</p>
          <button className="btn-primary" onClick={openAdd}>Create your first goal</button>
        </div>
      ) : (
        <div className="goals-grid">
          {active.map(g => <GoalCard key={g.id} g={g} />)}
        </div>
      )}

      {completed.length > 0 && (
        <div className="completed-section">
          <button className="completed-toggle"
            onClick={() => setShowCompleted(s => !s)}>
            {showCompleted ? "▾" : "▸"} Completed goals ({completed.length})
          </button>
          {showCompleted && (
            <div className="goals-grid goals-grid--done">
              {completed.map(g => <GoalCard key={g.id} g={g} />)}
            </div>
          )}
        </div>
      )}

      {/* ADD */}
      {modal === "add" && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h2>New Savings Goal</h2>
            <GoalForm onSubmit={handleAdd} submitLabel="Create Goal" />
          </div>
        </div>
      )}

      {/* EDIT */}
      {modal === "edit" && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h2>Edit Goal</h2>
            <GoalForm onSubmit={handleEdit} submitLabel="Save Changes" />
          </div>
        </div>
      )}

      {/* CONTRIBUTE */}
      {modal === "contribute" && selected && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-box modal-box--sm" onClick={e => e.stopPropagation()}>
            <h2>Add Funds — {selected.icon} {selected.name}</h2>
            <p className="contribute-current">
              Current: <strong>${fmt(selected.current_amount)}</strong> / ${fmt(selected.target_amount)}
              &nbsp;({Math.round(selected.current_amount / selected.target_amount * 100)}%)
            </p>
            <form onSubmit={handleContribute}>
              <label>Amount to add ($)
                <input type="number" min="0.01" step="0.01" value={contributeAmt}
                  onChange={e => setContributeAmt(e.target.value)}
                  autoFocus required placeholder="0.00" />
              </label>
              <div className="modal-footer">
                <button type="button" className="btn-ghost" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? "Saving…" : "Add Funds"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE */}
      {modal === "delete" && selected && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-box modal-box--sm" onClick={e => e.stopPropagation()}>
            <h2>Delete Goal?</h2>
            <p>Delete <strong>{selected.icon} {selected.name}</strong>? This cannot be undone.</p>
            <div className="modal-footer">
              <button className="btn-ghost" onClick={closeModal}>Cancel</button>
              <button className="btn-danger" onClick={handleDelete} disabled={saving}>
                {saving ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
