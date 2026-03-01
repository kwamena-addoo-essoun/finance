import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Cell, PieChart, Pie, Legend,
} from 'recharts';
import './AnalyticsPage.css';
import { expenseAPI, categoryAPI } from '../utils/api';

const COLORS = ['#6366f1','#10b981','#f59e0b','#ef4444','#8b5cf6','#0ea5e9','#ec4899','#14b8a6'];

function StatCard({ label, value, sub, color }) {
  return (
    <div className="an-stat-card" style={{ borderTopColor: color || '#6366f1' }}>
      <div className="an-stat-label">{label}</div>
      <div className="an-stat-value">{value}</div>
      {sub && <div className="an-stat-sub">{sub}</div>}
    </div>
  );
}

const fmt = n => `$${Number(n).toFixed(2)}`;
const fmtK = n => n >= 1000 ? `$${(n/1000).toFixed(1)}k` : `$${n.toFixed(0)}`;

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="an-tooltip">
      <div className="an-tooltip-label">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="an-tooltip-row" style={{ color: p.color || p.fill }}>
          <span>{p.name}:</span><span>{fmt(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

export default function AnalyticsPage() {
  const [expenses,   setExpenses]   = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [eRes, cRes] = await Promise.all([expenseAPI.getAll(), categoryAPI.getAll()]);
        setExpenses(eRes.data);
        setCategories(cRes.data);
      } catch { setError('Failed to load analytics data.'); }
      finally   { setLoading(false); }
    })();
  }, []);

  // ── Last 6 months labels ───────────────────────────────────────────────────
  const months = useMemo(() => {
    const result = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - i);
      result.push({
        key:   `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`,
        label: d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        year:  d.getFullYear(),
        month: d.getMonth(),
      });
    }
    return result;
  }, []);

  // ── Monthly totals ─────────────────────────────────────────────────────────
  const monthlyData = useMemo(() => {
    return months.map(m => {
      const total = expenses
        .filter(e => (e.date||'').startsWith(m.key))
        .reduce((s,e) => s+e.amount, 0);
      return { ...m, total };
    });
  }, [expenses, months]);

  // ── MoM change ────────────────────────────────────────────────────────────
  const momChange = useMemo(() => {
    const cur  = monthlyData.at(-1)?.total || 0;
    const prev = monthlyData.at(-2)?.total || 0;
    if (prev === 0) return null;
    return ((cur - prev) / prev) * 100;
  }, [monthlyData]);

  // ── Per-category monthly spend (stacked bar) ───────────────────────────────
  const categoryMonthly = useMemo(() => {
    const topCats = [...categories].slice(0, 6);
    return months.map(m => {
      const row = { month: m.label };
      topCats.forEach(cat => {
        row[cat.name] = expenses
          .filter(e => (e.date||'').startsWith(m.key) && e.category_id === cat.id)
          .reduce((s,e) => s+e.amount, 0);
      });
      return row;
    });
  }, [expenses, categories, months]);

  // ── Category totals for pie ────────────────────────────────────────────────
  const pieData = useMemo(() => {
    const map = {};
    expenses.forEach(e => {
      const cat = categories.find(c => c.id === e.category_id);
      const name = cat?.name || 'Uncategorized';
      map[name] = (map[name] || 0) + e.amount;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a,b) => b.value-a.value);
  }, [expenses, categories]);

  // ── MoM category changes ───────────────────────────────────────────────────
  const momCategoryChanges = useMemo(() => {
    const curKey  = months.at(-1)?.key;
    const prevKey = months.at(-2)?.key;
    const changes = categories.map(cat => {
      const cur  = expenses.filter(e=>(e.date||'').startsWith(curKey)&&e.category_id===cat.id).reduce((s,e)=>s+e.amount,0);
      const prev = expenses.filter(e=>(e.date||'').startsWith(prevKey)&&e.category_id===cat.id).reduce((s,e)=>s+e.amount,0);
      const delta = cur - prev;
      return { name: cat.name, color: cat.color, cur, prev, delta };
    }).filter(c => c.cur > 0 || c.prev > 0).sort((a,b) => Math.abs(b.delta) - Math.abs(a.delta));
    return changes.slice(0, 8);
  }, [expenses, categories, months]);

  // ── Summary stats ─────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    if (!expenses.length) return {};
    const total = expenses.reduce((s,e)=>s+e.amount,0);
    const dates = [...new Set(expenses.map(e=>(e.date||'').slice(0,10)))];
    const avgDaily = dates.length ? total/dates.length : 0;
    const biggest  = [...expenses].sort((a,b)=>b.amount-a.amount)[0];
    const dayTotals = {0:0,1:0,2:0,3:0,4:0,5:0,6:0};
    const dayCounts = {0:0,1:0,2:0,3:0,4:0,5:0,6:0};
    expenses.forEach(e => {
      const d = new Date(e.date).getDay();
      dayTotals[d] += e.amount; dayCounts[d]++;
    });
    const busiestDay = Object.entries(dayCounts).sort((a,b)=>b[1]-a[1])[0];
    const dayName = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const recurringCount = expenses.filter(e=>e.is_recurring).length;
    return { total, avgDaily, biggest, busiestDay: dayName[busiestDay?.[0]], recurringCount };
  }, [expenses]);

  // ── Projected this month ───────────────────────────────────────────────────
  const projected = useMemo(() => {
    const now     = new Date();
    const curKey  = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
    const dayOfMonth = now.getDate();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth()+1, 0).getDate();
    const spentSoFar  = expenses.filter(e=>(e.date||'').startsWith(curKey)).reduce((s,e)=>s+e.amount,0);
    if (dayOfMonth === 0) return spentSoFar;
    return (spentSoFar / dayOfMonth) * daysInMonth;
  }, [expenses]);

  if (loading) return <div className="loading">Loading analytics…</div>;
  if (error)   return <div className="an-error">{error}</div>;

  const topCatKeys = categories.slice(0, 6).map(c => c.name);

  return (
    <div className="analytics-page">
      <div className="an-header">
        <div>
          <h1 className="an-title">Analytics</h1>
          <p className="an-subtitle">Trends, patterns, and insights across all your expenses.</p>
        </div>
      </div>

      <div className="an-content">

        {/* ── Stat cards ──────────────────────────────────────── */}
        <div className="an-stats-grid">
          <StatCard label="Total All-Time Spend" value={fmt(stats.total||0)} color="#6366f1" />
          <StatCard label="Avg Daily Spend" value={fmt(stats.avgDaily||0)} color="#10b981" />
          <StatCard label="Projected This Month" value={fmt(projected)} color="#f59e0b"
            sub="Based on current pace" />
          <StatCard label="Month-over-Month"
            value={momChange===null?'—':`${momChange>0?'+':''}${momChange.toFixed(1)}%`}
            color={momChange===null?'#6366f1':momChange>0?'#ef4444':'#10b981'}
            sub={momChange===null?'Not enough data':momChange>0?'Spending increased':'Spending decreased'} />
          <StatCard label="Biggest Expense"
            value={stats.biggest?fmt(stats.biggest.amount):'—'}
            sub={stats.biggest?.title} color="#8b5cf6" />
          <StatCard label="Busiest Spend Day" value={stats.busiestDay||'—'} color="#0ea5e9"
            sub={`${stats.recurringCount||0} recurring expenses`} />
        </div>

        {/* ── Monthly spend trend ──────────────────────────────── */}
        <div className="an-card">
          <div className="an-card-header">
            <span className="an-card-title">Monthly Spending — Last 6 Months</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={fmtK} tick={{ fontSize: 11, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} width={48} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99,102,241,.06)' }} />
              <Bar dataKey="total" name="Spent" radius={[6,6,0,0]}>
                {monthlyData.map((_, i) => <Cell key={i} fill={i===monthlyData.length-1?'#6366f1':'#6366f155'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="an-two-col">
          {/* ── Category stacked bar ──────────────────────────── */}
          <div className="an-card">
            <div className="an-card-header">
              <span className="an-card-title">Spend by Category — Last 6 Months</span>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={categoryMonthly} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barSize={20}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={fmtK} tick={{ fontSize: 10, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} width={44} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99,102,241,.06)' }} />
                <Legend wrapperStyle={{ fontSize: '0.68rem', color: 'var(--text-3)' }} />
                {topCatKeys.map((name, i) => (
                  <Bar key={name} dataKey={name} stackId="a" fill={categories.find(c=>c.name===name)?.color || COLORS[i % COLORS.length]} radius={i===topCatKeys.length-1?[4,4,0,0]:[0,0,0,0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* ── Pie chart ────────────────────────────────────── */}
          <div className="an-card">
            <div className="an-card-header">
              <span className="an-card-title">All-Time Category Split</span>
            </div>
            {pieData.length === 0 ? (
              <p className="an-empty">No data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} paddingAngle={2}>
                    {pieData.map((entry, i) => {
                      const cat = categories.find(c=>c.name===entry.name);
                      return <Cell key={i} fill={cat?.color || COLORS[i%COLORS.length]} />;
                    })}
                  </Pie>
                  <Tooltip formatter={(v) => fmt(v)} contentStyle={{ background: 'var(--modal-bg)', border: '1px solid var(--border)', borderRadius: 8, fontSize: '0.78rem' }} />
                  <Legend wrapperStyle={{ fontSize: '0.68rem', color: 'var(--text-3)' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* ── Month-over-Month changes ──────────────────────── */}
        <div className="an-card">
          <div className="an-card-header">
            <span className="an-card-title">Month-over-Month Category Changes</span>
            <span className="an-card-meta">vs. previous month</span>
          </div>
          {momCategoryChanges.length === 0 ? (
            <p className="an-empty">Not enough data across two months.</p>
          ) : (
            <div className="mom-table">
              <div className="mom-header">
                <span>Category</span><span>Prev Month</span><span>This Month</span><span>Change</span>
              </div>
              {momCategoryChanges.map(c => (
                <div key={c.name} className="mom-row">
                  <span className="mom-cat">
                    <span className="cat-dot" style={{ background: c.color }} />
                    {c.name}
                  </span>
                  <span className="mom-val">{c.prev>0?fmt(c.prev):'—'}</span>
                  <span className="mom-val">{c.cur>0?fmt(c.cur):'—'}</span>
                  <span className={`mom-delta ${c.delta>0?'mom-delta--up':c.delta<0?'mom-delta--down':''}`}>
                    {c.delta===0?'—':`${c.delta>0?'+':''}${fmt(c.delta)}`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Daily spending line (this month) ─────────────── */}
        <div className="an-card">
          <div className="an-card-header">
            <span className="an-card-title">Daily Spending This Month</span>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart
              data={(() => {
                const now = new Date(); const daysInMonth = now.getDate();
                const curKey = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
                return Array.from({ length: daysInMonth }, (_,i) => {
                  const d = String(i+1).padStart(2,'0');
                  const dateStr = `${curKey}-${d}`;
                  const amt = expenses.filter(e=>(e.date||'').startsWith(dateStr)).reduce((s,e)=>s+e.amount,0);
                  return { day: i+1, amount: amt };
                });
              })()}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={fmtK} tick={{ fontSize: 10, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} width={44} />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#6366f1', strokeWidth: 1 }} />
              <Line type="monotone" dataKey="amount" name="Spent" stroke="#6366f1" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

      </div>
    </div>
  );
}
