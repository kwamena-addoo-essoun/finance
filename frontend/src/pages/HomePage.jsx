import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import './HomePage.css';
import { expenseAPI, categoryAPI, budgetAPI } from '../utils/api';
import OnboardingModal from '../components/OnboardingModal';

// ── Empty state templates ─────────────────────────────────────────────────────
const EMPTY_EXPENSE  = { title: '', description: '', amount: '', date: new Date().toISOString().split('T')[0], category_id: '', is_recurring: false, currency: 'USD' };
const CURRENCIES = [
  { code: 'USD', symbol: '$',   label: 'USD – US Dollar' },
  { code: 'EUR', symbol: '€',   label: 'EUR – Euro' },
  { code: 'GBP', symbol: '£',   label: 'GBP – British Pound' },
  { code: 'CAD', symbol: 'CA$', label: 'CAD – Canadian Dollar' },
  { code: 'AUD', symbol: 'A$',  label: 'AUD – Australian Dollar' },
  { code: 'JPY', symbol: '¥',   label: 'JPY – Japanese Yen' },
  { code: 'CHF', symbol: 'Fr',  label: 'CHF – Swiss Franc' },
  { code: 'CNY', symbol: '¥',   label: 'CNY – Chinese Yuan' },
  { code: 'INR', symbol: '₹',   label: 'INR – Indian Rupee' },
  { code: 'MXN', symbol: 'MX$', label: 'MXN – Mexican Peso' },
];
const currencySymbol = code => (CURRENCIES.find(c => c.code === code) || CURRENCIES[0]).symbol;
const EMPTY_CATEGORY = { name: '', description: '', color: '#6366f1' };
const EMPTY_BUDGET   = { name: '', limit_amount: '', period: 'monthly', category_id: '' };

// ── Toast system ──────────────────────────────────────────────────────────────
function useToast() {
  const [toasts, setToasts] = useState([]);
  const add = useCallback((message, type = 'info', undoFn = null, duration = 5000) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type, undoFn }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
    return id;
  }, []);
  const dismiss = useCallback((id) => setToasts(prev => prev.filter(t => t.id !== id)), []);
  return { toasts, add, dismiss };
}

function ToastContainer({ toasts, onDismiss }) {
  if (!toasts.length) return null;
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast--${t.type}`}>
          <span className="toast-msg">{t.message}</span>
          {t.undoFn && (
            <button className="toast-undo" onClick={() => { t.undoFn(); onDismiss(t.id); }}>
              Undo
            </button>
          )}
          <button className="toast-dismiss" onClick={() => onDismiss(t.id)}>✕</button>
        </div>
      ))}
    </div>
  );
}

function FormError({ message }) {
  if (!message) return null;
  return <div className="form-error">{message}</div>;
}

function fmt(n) { return `$${Number(n).toFixed(2)}`; }

// ── Date range helpers ────────────────────────────────────────────────────────
function getDateBounds(range, customFrom, customTo) {
  const now = new Date();
  if (range === 'month') return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: now };
  if (range === '30d')   { const f = new Date(now); f.setDate(f.getDate() - 29); return { from: f, to: now }; }
  if (range === 'year')  return { from: new Date(now.getFullYear(), 0, 1), to: now };
  if (range === 'custom' && customFrom && customTo) return { from: new Date(customFrom), to: new Date(customTo + 'T23:59:59') };
  return null;
}

// ── SVG bar chart ─────────────────────────────────────────────────────────────
function BarChart({ days }) {
  const max = Math.max(...days.map(d => d.amount), 0.01);
  const COLORS = ['#6366f1','#8b5cf6','#6366f1','#8b5cf6','#10b981','#6366f1','#8b5cf6'];
  return (
    <div className="chart-wrap">
      <svg viewBox="0 0 252 72" width="100%" height="72" preserveAspectRatio="none">
        {days.map((d, i) => {
          const h = Math.max(4, (d.amount / max) * 64);
          return <rect key={i} x={i * 36 + 2} y={72 - h} width={30} height={h} rx={4} fill={COLORS[i]} opacity="0.85" />;
        })}
      </svg>
      <div className="chart-labels">{days.map((d, i) => <span key={i}>{d.dayLabel}</span>)}</div>
    </div>
  );
}

function KpiCard({ label, value, sub, subColor }) {
  return (
    <div className="kpi-card">
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      {sub && <div className="kpi-sub" style={{ color: subColor }}>{sub}</div>}
    </div>
  );
}

// ── CSV export ────────────────────────────────────────────────────────────────
function exportCSV(expenses, categories) {
  const header = ['Date','Title','Description','Category','Amount','Currency','Recurring','AI Category'];
  const rows = expenses.map(e => {
    const cat = categories.find(c => c.id === e.category_id);
    return [
      new Date(e.date).toLocaleDateString(),
      `"${(e.title||'').replace(/"/g,'""')}"`,
      `"${(e.description||'').replace(/"/g,'""')}"`,
      `"${(cat?.name||'Uncategorized').replace(/"/g,'""')}"`,
      e.amount.toFixed(2),
      e.currency||'USD',
      e.is_recurring?'Yes':'No',
      `"${(e.ai_category||'').replace(/"/g,'""')}"`,
    ].join(',');
  });
  const csv  = [header.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement('a'), { href: url, download: `finsight-${new Date().toISOString().split('T')[0]}.csv` });
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── Main dashboard ────────────────────────────────────────────────────────────
function HomePage() {
  const [expenses,   setExpenses]   = useState([]);
  const [categories, setCategories] = useState([]);
  const [budgets,    setBudgets]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [fetchError, setFetchError] = useState('');

  const [modal, setModal] = useState(null);

  // date range
  const [dateRange,  setDateRange]  = useState('month');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo,   setCustomTo]   = useState('');

  // add expense
  const [newExpense,        setNewExpense]        = useState(EMPTY_EXPENSE);
  const [expenseError,      setExpenseError]      = useState('');
  const [expenseSubmitting, setExpenseSubmitting] = useState(false);

  // edit expense
  const [editingExpense,    setEditingExpense]    = useState(null);
  const [editExpenseError,  setEditExpenseError]  = useState('');
  const [editExpenseSubmit, setEditExpenseSubmit] = useState(false);

  // category
  const [newCategory,        setNewCategory]        = useState(EMPTY_CATEGORY);
  const [categoryError,      setCategoryError]      = useState('');
  const [categorySubmitting, setCategorySubmitting] = useState(false);

  // budget
  const [newBudget,        setNewBudget]        = useState(EMPTY_BUDGET);
  const [budgetError,      setBudgetError]      = useState('');
  const [budgetSubmitting, setBudgetSubmitting] = useState(false);

  const { toasts, add: addToast, dismiss: dismissToast } = useToast();

  // onboarding
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => { fetchData(); }, []);
  useEffect(() => {
    if (!localStorage.getItem('finsight-onboarded')) {
      const t = setTimeout(() => setShowOnboarding(true), 600);
      return () => clearTimeout(t);
    }
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true); setFetchError('');
      const [eRes, cRes, bRes] = await Promise.all([expenseAPI.getAll(), categoryAPI.getAll(), budgetAPI.getAll()]);
      setExpenses(eRes.data); setCategories(cRes.data); setBudgets(bRes.data);
    } catch { setFetchError('Failed to load data. Please refresh.'); }
    finally { setLoading(false); }
  };

  const extractError = err => {
    const d = err.response?.data?.detail;
    if (Array.isArray(d)) return d.map(e => e.msg?.replace('Value error, ','')||e).join(' · ');
    return d || 'Something went wrong.';
  };

  const closeModal = () => setModal(null);

  // ── Add expense ─────────────────────────────────────────────────────────────
  const handleAddExpense = async e => {
    e.preventDefault(); setExpenseError('');
    if (!newExpense.category_id) { setExpenseError('Please select a category.'); return; }
    setExpenseSubmitting(true);
    try {
      await expenseAPI.create({ ...newExpense, amount: parseFloat(newExpense.amount), category_id: parseInt(newExpense.category_id), date: new Date(newExpense.date).toISOString(), currency: newExpense.currency || 'USD' });
      setNewExpense(EMPTY_EXPENSE); closeModal(); fetchData();
      addToast('Expense added.', 'success');
    } catch (err) { setExpenseError(extractError(err)); }
    finally { setExpenseSubmitting(false); }
  };

  // ── Edit expense ────────────────────────────────────────────────────────────
  const openEditExpense = exp => {
    setEditingExpense({ ...exp, date: (exp.date||'').slice(0,10), category_id: String(exp.category_id||'') });
    setEditExpenseError(''); setModal('editExpense');
  };

  const handleEditExpense = async e => {
    e.preventDefault(); setEditExpenseError('');
    if (!editingExpense.category_id) { setEditExpenseError('Please select a category.'); return; }
    setEditExpenseSubmit(true);
    try {
      await expenseAPI.update(editingExpense.id, {
        title: editingExpense.title, description: editingExpense.description,
        amount: parseFloat(editingExpense.amount), category_id: parseInt(editingExpense.category_id),
        date: new Date(editingExpense.date).toISOString(), is_recurring: editingExpense.is_recurring,
        currency: editingExpense.currency || 'USD',
      });
      closeModal(); fetchData(); addToast('Expense updated.', 'success');
    } catch (err) { setEditExpenseError(extractError(err)); }
    finally { setEditExpenseSubmit(false); }
  };

  // ── Delete expense ──────────────────────────────────────────────────────────
  const handleDeleteExpense = async exp => {
    setExpenses(prev => prev.filter(e => e.id !== exp.id));
    try {
      await expenseAPI.delete(exp.id);
      addToast(`"${exp.title}" deleted.`, 'warning', async () => {
        try {
          await expenseAPI.create({ title: exp.title, description: exp.description, amount: exp.amount, category_id: exp.category_id, date: exp.date, is_recurring: exp.is_recurring });
          fetchData();
        } catch { fetchData(); }
      });
    } catch {
      setExpenses(prev => [...prev, exp].sort((a,b) => new Date(b.date)-new Date(a.date)));
      addToast('Delete failed.', 'error');
    }
  };

  // ── Add category ────────────────────────────────────────────────────────────
  const handleAddCategory = async e => {
    e.preventDefault(); setCategoryError(''); setCategorySubmitting(true);
    try {
      await categoryAPI.create(newCategory); setNewCategory(EMPTY_CATEGORY); closeModal(); fetchData();
      addToast('Category created.', 'success');
    } catch (err) { setCategoryError(extractError(err)); }
    finally { setCategorySubmitting(false); }
  };

  // ── Add budget ──────────────────────────────────────────────────────────────
  const handleAddBudget = async e => {
    e.preventDefault(); setBudgetError(''); setBudgetSubmitting(true);
    try {
      await budgetAPI.create({ ...newBudget, limit_amount: parseFloat(newBudget.limit_amount), category_id: newBudget.category_id ? parseInt(newBudget.category_id) : null });
      setNewBudget(EMPTY_BUDGET); closeModal(); fetchData(); addToast('Budget created.', 'success');
    } catch (err) { setBudgetError(extractError(err)); }
    finally { setBudgetSubmitting(false); }
  };

  // ── Filtered expenses ────────────────────────────────────────────────────────
  const filteredExpenses = useMemo(() => {
    const bounds = getDateBounds(dateRange, customFrom, customTo);
    if (!bounds) return expenses;
    return expenses.filter(e => { const d = new Date(e.date); return d >= bounds.from && d <= bounds.to; });
  }, [expenses, dateRange, customFrom, customTo]);

  // ── KPIs ─────────────────────────────────────────────────────────────────────
  const totalSpent  = filteredExpenses.reduce((s,e) => s+e.amount, 0);
  const totalBudget = budgets.reduce((s,b) => s+b.limit_amount, 0);
  const remaining   = totalBudget - totalSpent;
  const budgetPct   = totalBudget > 0 ? Math.min(100, Math.round((totalSpent/totalBudget)*100)) : 0;

  const last7Days = useMemo(() => {
    const result = [];
    for (let i=6; i>=0; i--) {
      const d = new Date(); d.setDate(d.getDate()-i);
      const dateStr  = d.toISOString().split('T')[0];
      const dayLabel = d.toLocaleDateString('en-US',{weekday:'short'}).charAt(0);
      const amount   = filteredExpenses.filter(e=>(e.date||'').slice(0,10)===dateStr).reduce((s,e)=>s+e.amount,0);
      result.push({ dateStr, dayLabel, amount });
    }
    return result;
  }, [filteredExpenses]);

  const categoryTotals = useMemo(() => {
    const map = {};
    filteredExpenses.forEach(e => {
      const cat=categories.find(c=>c.id===e.category_id); const name=cat?.name||'Uncategorized'; const color=cat?.color||'#9ca3af';
      if (!map[name]) map[name]={name,color,amount:0}; map[name].amount+=e.amount;
    });
    return Object.values(map).sort((a,b)=>b.amount-a.amount).slice(0,6);
  }, [filteredExpenses, categories]);

  const maxCatAmount = Math.max(...categoryTotals.map(c=>c.amount), 0.01);
  const today = new Date().toLocaleDateString('en-US',{month:'long',year:'numeric'});
  const RANGE_LABELS = { month:'This Month','30d':'Last 30 Days',year:'This Year',all:'All Time',custom:'Custom' };

  if (loading) return <div className="loading">Loading…</div>;

  return (
    <div className="dashboard-page">

      {/* ── Sub-bar ─────────────────────────────────────────── */}
      <div className="dash-subbar">
        <div className="dash-subbar-left">
          <h1 className="dash-title">Finance Dashboard</h1>
          <span className="dash-date">{today}</span>
        </div>
        <div className="dash-actions">
          <button className="dash-btn" title="Export filtered expenses as CSV" onClick={() => exportCSV(filteredExpenses, categories)}>↓ Export CSV</button>
          <button className="dash-btn" onClick={() => { setCategoryError(''); setModal('category'); }}>+ Category</button>
          <button className="dash-btn" onClick={() => { setBudgetError(''); setModal('budget'); }}>+ Budget</button>
          <button className="dash-btn dash-btn--cta" onClick={() => { setExpenseError(''); setModal('expense'); }}>+ Add Expense</button>
        </div>
      </div>

      {/* ── Date range filter bar ────────────────────────────── */}
      <div className="filter-bar">
        <div className="filter-chips">
          {['month','30d','year','all','custom'].map(r => (
            <button key={r} className={`filter-chip${dateRange===r?' filter-chip--active':''}`} onClick={() => setDateRange(r)}>
              {RANGE_LABELS[r]}
            </button>
          ))}
        </div>
        {dateRange === 'custom' && (
          <div className="filter-custom">
            <input type="date" value={customFrom} onChange={e=>setCustomFrom(e.target.value)} max={customTo||undefined} />
            <span className="filter-sep">→</span>
            <input type="date" value={customTo} onChange={e=>setCustomTo(e.target.value)} min={customFrom||undefined} />
          </div>
        )}
        {dateRange !== 'all' && (
          <span className="filter-count">{filteredExpenses.length} transaction{filteredExpenses.length!==1?'s':''}</span>
        )}
      </div>

      {/* ── Content ─────────────────────────────────────────── */}
      <div className="dash-content">
        {fetchError && <div className="fetch-error">{fetchError}</div>}

        {/* KPI grid */}
        <div className="kpi-grid">
          <KpiCard label="Total Spent" value={fmt(totalSpent)}
            sub={filteredExpenses.length>0?`${filteredExpenses.length} transaction${filteredExpenses.length!==1?'s':''}` :'No expenses'} subColor="var(--text-3)" />
          <KpiCard label="Total Budget" value={fmt(totalBudget)}
            sub={`${budgets.length} budget${budgets.length!==1?'s':''}`} subColor="var(--text-3)" />
          <KpiCard label="Remaining" value={fmt(Math.abs(remaining))}
            sub={totalBudget===0?'No budgets set':remaining>=0?'✓ Under budget':'⚠ Over budget'} subColor={remaining>=0?'#10b981':'#ef4444'} />
          <KpiCard label="Budget Used" value={`${budgetPct}%`}
            sub={totalBudget===0?'Set a budget to track':`${fmt(totalSpent)} of ${fmt(totalBudget)}`}
            subColor={budgetPct>90?'#ef4444':budgetPct>70?'#f59e0b':'#10b981'} />
          <KpiCard label="Categories" value={categories.length}
            sub={categoryTotals[0]?`Top: ${categoryTotals[0].name}`:'None yet'} subColor="var(--text-3)" />
        </div>

        {/* 3-col grid */}
        <div className="dash-mid-grid">
          <div className="dash-card">
            <div className="dash-card-header">
              <span className="dash-card-title">7-Day Spending</span>
              <span className="dash-card-meta">{fmt(last7Days.reduce((s,d)=>s+d.amount,0))} this week</span>
            </div>
            <BarChart days={last7Days} />
            <div style={{marginTop:'1.25rem'}}>
              <div className="dash-card-title" style={{marginBottom:'.6rem'}}>Trend</div>
              <svg viewBox="0 0 300 50" width="100%" height="50" preserveAspectRatio="none">
                <defs><linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3"/><stop offset="100%" stopColor="#6366f1" stopOpacity="0"/>
                </linearGradient></defs>
                <path d="M0,40 C40,35 70,15 110,20 S160,8 200,12 S250,5 300,8 L300,50 L0,50 Z" fill="url(#trendGrad)"/>
                <path d="M0,40 C40,35 70,15 110,20 S160,8 200,12 S250,5 300,8" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
          </div>
          <div className="dash-card">
            <div className="dash-card-header"><span className="dash-card-title">By Category</span></div>
            {categoryTotals.length===0 ? <p className="empty-hint">Add expenses with categories to see a breakdown.</p> : (
              categoryTotals.map(cat => (
                <div key={cat.name} className="cat-row">
                  <div className="cat-row-top">
                    <span className="cat-dot" style={{background:cat.color}} />
                    <span className="cat-name">{cat.name}</span>
                    <span className="cat-amount">{fmt(cat.amount)}</span>
                  </div>
                  <div className="progress-track"><div className="progress-fill" style={{width:`${(cat.amount/maxCatAmount)*100}%`,background:cat.color}} /></div>
                </div>
              ))
            )}
          </div>
          <div className="dash-card">
            <div className="dash-card-header"><span className="dash-card-title">Budgets</span></div>
            {budgets.length===0 ? <p className="empty-hint">No budgets yet.</p> : (
              budgets.map(b => {
                const pct=b.limit_amount>0?Math.min(100,Math.round(((b.spent_amount||0)/b.limit_amount)*100)):0;
                const over=(b.spent_amount||0)>b.limit_amount; const barColor=over?'#ef4444':pct>80?'#f59e0b':'#6366f1';
                return (
                  <div key={b.id} className="budget-row">
                    <div className="budget-row-top"><span className="budget-name">{b.name}</span><span className="budget-pct" style={{color:barColor}}>{pct}%</span></div>
                    <div className="progress-track"><div className="progress-fill" style={{width:`${pct}%`,background:barColor}} /></div>
                    <div className="budget-amounts"><span>{fmt(b.spent_amount||0)} spent</span><span>{fmt(b.limit_amount)} limit</span></div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Transactions table */}
        <div className="dash-card">
          <div className="dash-card-header">
            <span className="dash-card-title">Transactions</span>
            <span className="dash-card-meta">{filteredExpenses.length} shown</span>
          </div>
          {filteredExpenses.length===0 ? <p className="empty-hint">No transactions in this period.</p> : (
            <table className="tx-table">
              <thead><tr><th>Description</th><th>Category</th><th>Date</th><th>Amount</th><th style={{width:72}}></th></tr></thead>
              <tbody>
                {[...filteredExpenses].sort((a,b)=>new Date(b.date)-new Date(a.date)).map(exp => {
                  const cat=categories.find(c=>c.id===exp.category_id);
                  return (
                    <tr key={exp.id}>
                      <td>
                        <div style={{display:'flex',alignItems:'center',gap:'.4rem',flexWrap:'wrap'}}>
                          <span className="tx-title">{exp.title}</span>
                          {exp.is_recurring && <span className="recur-badge">↻</span>}
                          {exp.ai_category && <span className="ai-tag">AI: {exp.ai_category}</span>}
                        </div>
                        {exp.description && <div className="tx-desc">{exp.description}</div>}
                      </td>
                      <td>{cat?<span className="cat-badge" style={{background:cat.color+'22',color:cat.color}}>{cat.name}</span>:<span className="tx-desc">—</span>}</td>
                      <td className="tx-date">{new Date(exp.date).toLocaleDateString()}</td>
                      <td className="tx-amount">-{currencySymbol(exp.currency)}{fmt(exp.amount)}{exp.currency && exp.currency !== 'USD' && <span className="tx-currency">{exp.currency}</span>}</td>
                      <td><div className="tx-actions">
                        <button className="tx-btn tx-btn--edit" title="Edit" onClick={()=>openEditExpense(exp)}>✏</button>
                        <button className="tx-btn tx-btn--delete" title="Delete" onClick={()=>handleDeleteExpense(exp)}>🗑</button>
                      </div></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── Modals ──────────────────────────────────────────────────────────── */}
      {modal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-box" onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">
                {modal==='expense'?'Add Expense':modal==='editExpense'?'Edit Expense':modal==='category'?'New Category':'New Budget'}
              </span>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>

            {modal==='expense' && (
              <form onSubmit={handleAddExpense} className="modal-form">
                <FormError message={expenseError} />
                <div className="form-group"><label>Title</label><input type="text" value={newExpense.title} onChange={e=>setNewExpense({...newExpense,title:e.target.value})} placeholder="e.g. Grocery run" required autoFocus /></div>
                <div className="form-row">
                  <div className="form-group"><label>Amount ($)</label><input type="number" step="0.01" min="0.01" value={newExpense.amount} onChange={e=>setNewExpense({...newExpense,amount:e.target.value})} required /></div>
                  <div className="form-group"><label>Date</label><input type="date" value={newExpense.date} max={new Date().toISOString().split('T')[0]} onChange={e=>setNewExpense({...newExpense,date:e.target.value})} required /></div>
                </div>
                <div className="form-group"><label>Category</label>
                  <select value={newExpense.category_id} onChange={e=>setNewExpense({...newExpense,category_id:e.target.value})} required>
                    <option value="">Select a category</option>
                    {categories.map(cat=><option key={cat.id} value={cat.id}>{cat.name}</option>)}
                  </select>
                  {categories.length===0&&<span className="field-hint">No categories yet — create one first.</span>}
                </div>
                <div className="form-group"><label>Description (optional)</label><input type="text" value={newExpense.description} onChange={e=>setNewExpense({...newExpense,description:e.target.value})} /></div>
                <div className="form-group"><label>Currency</label>
                  <select value={newExpense.currency} onChange={e=>setNewExpense({...newExpense,currency:e.target.value})}>
                    {CURRENCIES.map(c=><option key={c.code} value={c.code}>{c.label}</option>)}
                  </select>
                </div>
                <label className="form-check"><input type="checkbox" checked={newExpense.is_recurring} onChange={e=>setNewExpense({...newExpense,is_recurring:e.target.checked})} /><span>Recurring expense</span></label>
                <button type="submit" className="modal-submit" disabled={expenseSubmitting}>{expenseSubmitting?'Adding…':'Add Expense'}</button>
              </form>
            )}

            {modal==='editExpense' && editingExpense && (
              <form onSubmit={handleEditExpense} className="modal-form">
                <FormError message={editExpenseError} />
                <div className="form-group"><label>Title</label><input type="text" value={editingExpense.title} onChange={e=>setEditingExpense({...editingExpense,title:e.target.value})} required autoFocus /></div>
                <div className="form-row">
                  <div className="form-group"><label>Amount ($)</label><input type="number" step="0.01" min="0.01" value={editingExpense.amount} onChange={e=>setEditingExpense({...editingExpense,amount:e.target.value})} required /></div>
                  <div className="form-group"><label>Date</label><input type="date" value={editingExpense.date} onChange={e=>setEditingExpense({...editingExpense,date:e.target.value})} required /></div>
                </div>
                <div className="form-group"><label>Category</label>
                  <select value={editingExpense.category_id} onChange={e=>setEditingExpense({...editingExpense,category_id:e.target.value})} required>
                    <option value="">Select a category</option>
                    {categories.map(cat=><option key={cat.id} value={cat.id}>{cat.name}</option>)}
                  </select>
                </div>
                <div className="form-group"><label>Description (optional)</label><input type="text" value={editingExpense.description||''} onChange={e=>setEditingExpense({...editingExpense,description:e.target.value})} /></div>
                <div className="form-group"><label>Currency</label>
                  <select value={editingExpense.currency||'USD'} onChange={e=>setEditingExpense({...editingExpense,currency:e.target.value})}>
                    {CURRENCIES.map(c=><option key={c.code} value={c.code}>{c.label}</option>)}
                  </select>
                </div>
                <label className="form-check"><input type="checkbox" checked={!!editingExpense.is_recurring} onChange={e=>setEditingExpense({...editingExpense,is_recurring:e.target.checked})} /><span>Recurring expense</span></label>
                <button type="submit" className="modal-submit" disabled={editExpenseSubmit}>{editExpenseSubmit?'Saving…':'Save Changes'}</button>
              </form>
            )}

            {modal==='category' && (
              <form onSubmit={handleAddCategory} className="modal-form">
                <FormError message={categoryError} />
                <div className="form-group"><label>Name</label><input type="text" value={newCategory.name} onChange={e=>setNewCategory({...newCategory,name:e.target.value})} placeholder="e.g. Food & Dining" required autoFocus /></div>
                <div className="form-group"><label>Description (optional)</label><input type="text" value={newCategory.description} onChange={e=>setNewCategory({...newCategory,description:e.target.value})} /></div>
                <div className="form-group form-group--color"><label>Color</label><input type="color" value={newCategory.color} onChange={e=>setNewCategory({...newCategory,color:e.target.value})} /></div>
                <button type="submit" className="modal-submit" disabled={categorySubmitting}>{categorySubmitting?'Creating…':'Create Category'}</button>
              </form>
            )}

            {modal==='budget' && (
              <form onSubmit={handleAddBudget} className="modal-form">
                <FormError message={budgetError} />
                <div className="form-group"><label>Name</label><input type="text" value={newBudget.name} onChange={e=>setNewBudget({...newBudget,name:e.target.value})} placeholder="e.g. Monthly groceries" required autoFocus /></div>
                <div className="form-row">
                  <div className="form-group"><label>Limit ($)</label><input type="number" step="0.01" min="0.01" value={newBudget.limit_amount} onChange={e=>setNewBudget({...newBudget,limit_amount:e.target.value})} required /></div>
                  <div className="form-group"><label>Period</label>
                    <select value={newBudget.period} onChange={e=>setNewBudget({...newBudget,period:e.target.value})}>
                      <option value="weekly">Weekly</option><option value="monthly">Monthly</option><option value="yearly">Yearly</option>
                    </select>
                  </div>
                </div>
                <div className="form-group"><label>Category (optional)</label>
                  <select value={newBudget.category_id} onChange={e=>setNewBudget({...newBudget,category_id:e.target.value})}>
                    <option value="">All categories</option>
                    {categories.map(cat=><option key={cat.id} value={cat.id}>{cat.name}</option>)}
                  </select>
                </div>
                <button type="submit" className="modal-submit" disabled={budgetSubmitting}>{budgetSubmitting?'Creating…':'Create Budget'}</button>
              </form>
            )}
          </div>
        </div>
      )}

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {showOnboarding && (
        <OnboardingModal onComplete={() => { setShowOnboarding(false); fetchData(); }} />
      )}
    </div>
  );
}

export default HomePage;
