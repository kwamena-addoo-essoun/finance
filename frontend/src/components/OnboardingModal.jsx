import React, { useState } from "react";
import { categoryAPI, budgetAPI } from "../utils/api";
import "./OnboardingModal.css";

const STARTER_CATEGORIES = [
  { name: "Housing",       color: "#6366f1", icon: "🏠", suggested: 50 },
  { name: "Food & Dining", color: "#10b981", icon: "🍔", suggested: 15 },
  { name: "Transport",     color: "#3b82f6", icon: "🚗", suggested: 15 },
  { name: "Health",        color: "#ef4444", icon: "💊", suggested: 10 },
  { name: "Entertainment", color: "#f59e0b", icon: "🎬", suggested: 10 },
];

export default function OnboardingModal({ onComplete }) {
  const [step, setStep] = useState(0);
  const [income, setIncome] = useState("");
  const [selected, setSelected] = useState(
    new Set(STARTER_CATEGORIES.map(c => c.name))
  );
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState(false);
  const [error, setError] = useState("");

  function toggleCat(name) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  }

  async function handleFinish() {
    setCreating(true);
    setError("");
    try {
      const inc = parseFloat(income) || 0;
      if (inc > 0) localStorage.setItem("finsight-monthly-income", inc.toString());

      const cats = STARTER_CATEGORIES.filter(c => selected.has(c.name));
      for (const cat of cats) {
        try {
          const res = await categoryAPI.create({ name: cat.name, description: `${cat.icon} ${cat.name}`, color: cat.color });
          // Create a default monthly budget if income was set
          if (inc > 0) {
            const limit = Math.round(inc * cat.suggested / 100);
            await budgetAPI.create({
              name: `${cat.name} Budget`,
              limit_amount: limit,
              period: "monthly",
              category_id: res.data.id,
            });
          }
        } catch {
          // skip if category already exists
        }
      }
      setCreated(true);
      setStep(3);
    } catch {
      setError("Something went wrong. You can set categories up manually.");
    } finally {
      setCreating(false);
    }
  }

  function finish() {
    localStorage.setItem("finsight-onboarded", "1");
    onComplete();
  }

  const STEPS = ["Welcome", "Income", "Categories", "Done"];

  return (
    <div className="ob-overlay">
      <div className="ob-modal">
        {/* step dots */}
        <div className="ob-steps">
          {STEPS.map((s, i) => (
            <div key={s} className={`ob-dot${step === i ? " ob-dot--active" : step > i ? " ob-dot--done" : ""}`} />
          ))}
        </div>

        {/* ─── Step 0: Welcome ─── */}
        {step === 0 && (
          <div className="ob-body">
            <div className="ob-emoji">👋</div>
            <h2>Welcome to Finsight!</h2>
            <p className="ob-desc">
              Let's get your account set up in 2 quick steps so you can start
              tracking your finances right away.
            </p>
            <button className="ob-btn-primary" onClick={() => setStep(1)}>
              Get Started →
            </button>
            <button className="ob-skip" onClick={finish}>Skip for now</button>
          </div>
        )}

        {/* ─── Step 1: Monthly income ─── */}
        {step === 1 && (
          <div className="ob-body">
            <div className="ob-emoji">💰</div>
            <h2>What's your monthly income?</h2>
            <p className="ob-desc">
              We'll use this to suggest budget allocations based on the
              popular&nbsp;<strong>50/30/20 rule</strong>.
            </p>
            <div className="ob-input-wrap">
              <span className="ob-currency-prefix">$</span>
              <input
                type="number"
                min="0"
                step="100"
                className="ob-income-input"
                placeholder="e.g. 4000"
                value={income}
                onChange={e => setIncome(e.target.value)}
                autoFocus
              />
            </div>
            <p className="ob-hint">Leave blank to skip budget suggestions.</p>
            <div className="ob-row">
              <button className="ob-btn-ghost" onClick={() => setStep(0)}>← Back</button>
              <button className="ob-btn-primary" onClick={() => setStep(2)}>
                Next →
              </button>
            </div>
          </div>
        )}

        {/* ─── Step 2: Starter categories ─── */}
        {step === 2 && (
          <div className="ob-body">
            <div className="ob-emoji">📂</div>
            <h2>Choose starter categories</h2>
            <p className="ob-desc">
              We'll create these categories{income ? " and matching monthly budgets" : ""} for you.
              Deselect any you don't need.
            </p>
            <div className="ob-cats">
              {STARTER_CATEGORIES.map(cat => {
                const active = selected.has(cat.name);
                return (
                  <button
                    key={cat.name}
                    className={`ob-cat${active ? " ob-cat--active" : ""}`}
                    style={active ? { borderColor: cat.color, background: cat.color + "22" } : {}}
                    onClick={() => toggleCat(cat.name)}
                  >
                    <span className="ob-cat-icon">{cat.icon}</span>
                    <span className="ob-cat-name">{cat.name}</span>
                    {income && (
                      <span className="ob-cat-pct"
                        style={{ color: active ? cat.color : "var(--text-muted)" }}>
                        {cat.suggested}%
                      </span>
                    )}
                    {active && <span className="ob-check" style={{ color: cat.color }}>✓</span>}
                  </button>
                );
              })}
            </div>
            {error && <p className="ob-error">{error}</p>}
            <div className="ob-row">
              <button className="ob-btn-ghost" onClick={() => setStep(1)}>← Back</button>
              <button
                className="ob-btn-primary"
                onClick={handleFinish}
                disabled={creating}
              >
                {creating ? "Setting up…" : "Set Up →"}
              </button>
            </div>
            <button className="ob-skip" onClick={finish}>Skip setup</button>
          </div>
        )}

        {/* ─── Step 3: Done ─── */}
        {step === 3 && (
          <div className="ob-body ob-body--center">
            <div className="ob-emoji ob-emoji--spin">🎉</div>
            <h2>You're all set!</h2>
            <p className="ob-desc">
              {created
                ? `Your categories${income ? " and budgets" : ""} have been created. Start adding expenses to track your spending.`
                : "Your workspace is ready. Start adding expenses to track your spending."}
            </p>
            <button className="ob-btn-primary ob-btn--lg" onClick={finish}>
              Let's go! →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
