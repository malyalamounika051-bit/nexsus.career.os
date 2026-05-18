import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { careerService } from '../services/adviceService';
import Sidebar from '../components/Sidebar';
import { TrendingUp, DollarSign, BarChart2, Shield, Zap } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';

const demandColor = { High: '#10b981', Medium: '#f59e0b', Low: '#ef4444' };

const MarketInsightsPage = () => {
  const [careers, setCareers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('demandScore');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    careerService.getMarketInsights().then(({ data }) => {
      setCareers(data.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const sorted = [...careers].sort((a, b) => {
    if (sortBy === 'demandScore') return b.demandScore - a.demandScore;
    return a.domain.localeCompare(b.domain);
  });

  const max = Math.max(...careers.map(c => c.demandScore), 1);

  return (
    <div className="app-shell">
      <Sidebar collapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(c => !c)} />
      <main className={`app-main ${sidebarCollapsed ? 'sidebar-is-collapsed' : ''}`}>
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: "'Space Grotesk', sans-serif" }}>
                Market <span className="gradient-text">Intelligence</span>
              </h1>
              <p style={{ color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>Demand scores, salary ranges, and growth rates for top career domains</p>
            </div>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)', padding: '0.5rem 1rem', borderRadius: 10, fontSize: '0.875rem', cursor: 'pointer', outline: 'none' }}
            >
              <option value="demandScore">Sort: Demand Score</option>
              <option value="domain">Sort: Alphabetical</option>
            </select>
          </div>
        </motion.div>

        {/* Summary cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          {[
            { label: 'High Demand Careers', value: careers.filter(c => c.demand === 'High').length, icon: TrendingUp, color: '#10b981' },
            { label: 'Avg. Demand Score', value: careers.length ? Math.round(careers.reduce((s, c) => s + c.demandScore, 0) / careers.length) : 0, icon: BarChart2, color: '#3b82f6' },
            { label: 'Career Domains', value: careers.length, icon: DollarSign, color: '#8b5cf6' },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="stat-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: `${s.color}20`, border: `1px solid ${s.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <s.icon size={18} color={s.color} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1.4rem', color: 'var(--color-text)' }}>{s.value}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>{s.label}</div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Demand Chart */}
        {careers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="glass-card"
            style={{ padding: '1.5rem', marginBottom: '2rem' }}
          >
            <h3 style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '1rem', fontFamily: "'Space Grotesk', sans-serif", display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BarChart2 size={16} color="var(--color-primary-light)" /> Demand Score Comparison
            </h3>
            <div style={{ width: '100%', height: 280 }}>
              <ResponsiveContainer>
                <BarChart data={sorted.map(c => ({ name: c.domain.length > 12 ? c.domain.slice(0, 12) + '…' : c.domain, score: c.demandScore, demand: c.demand }))} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <XAxis dataKey="name" tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} axisLine={{ stroke: 'var(--color-border)' }} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 10, fontSize: '0.82rem' }}
                    labelStyle={{ color: 'var(--color-text)', fontWeight: 600 }}
                    itemStyle={{ color: 'var(--color-text-dim)' }}
                  />
                  <Bar dataKey="score" radius={[6, 6, 0, 0]} animationDuration={1200}>
                    {sorted.map((c, i) => (
                      <Cell key={i} fill={demandColor[c.demand] || '#0ea5e9'} fillOpacity={0.75} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}

        {/* Career cards */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--color-text-muted)' }}>Loading market data...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {sorted.map((career, i) => (
              <motion.div
                key={career._id}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                className="glass-card"
                style={{ padding: '1.75rem' }}
              >
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div>
                    <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.35rem' }}>{career.domain}</h3>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', lineHeight: 1.5 }}>{career.description}</p>
                  </div>
                  <div style={{ padding: '0.3rem 0.7rem', borderRadius: 99, background: `${demandColor[career.demand]}20`, border: `1px solid ${demandColor[career.demand]}40`, fontSize: '0.72rem', fontWeight: 600, color: demandColor[career.demand], whiteSpace: 'nowrap', marginLeft: '0.75rem', flexShrink: 0 }}>
                    {career.demand} Demand
                  </div>
                </div>

                {/* Demand bar */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.78rem' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>Market Demand</span>
                    <span style={{ color: demandColor[career.demand], fontWeight: 600 }}>{career.demandScore}/100</span>
                  </div>
                  <div className="progress-bar">
                    <motion.div
                      className="progress-bar-fill"
                      initial={{ width: 0 }}
                      whileInView={{ width: `${(career.demandScore / max) * 100}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, delay: i * 0.05 }}
                      style={{ background: demandColor[career.demand] }}
                    />
                  </div>
                </div>

                {/* Stats row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
                  <div style={{ background: 'var(--color-surface-2)', padding: '0.75rem', borderRadius: 10, textAlign: 'center' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginBottom: '0.3rem' }}>Avg. Salary</div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-success)' }}>{career.avgSalary}</div>
                  </div>
                  <div style={{ background: 'var(--color-surface-2)', padding: '0.75rem', borderRadius: 10, textAlign: 'center' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginBottom: '0.3rem' }}>Growth Rate</div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-primary-light)' }}>{career.growthRate}</div>
                  </div>
                </div>

                {/* Trending skills */}
                {career.trendingSkills?.length > 0 && (
                  <div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>🔥 Trending Skills</div>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      {career.trendingSkills.map(s => (
                        <span key={s} className="tag tag-purple" style={{ fontSize: '0.7rem' }}>{s}</span>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default MarketInsightsPage;
