import { useState } from 'react';
import { motion } from 'framer-motion';
import Sidebar from '../components/Sidebar';
import api from '../services/api';
import { Play, Clock, TrendingUp, Heart, Sparkles, Users, DollarSign, ArrowRight, Brain } from 'lucide-react';

const POPULAR_CAREERS = [
  'Full Stack Developer', 'Data Scientist', 'UX Designer', 'Product Manager',
  'DevOps Engineer', 'AI/ML Engineer', 'Cybersecurity Analyst', 'Mobile Developer',
];

const CareerSimulator = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [career, setCareer] = useState('');
  const [loading, setLoading] = useState(false);
  const [simulation, setSimulation] = useState(null);

  const handleSimulate = async (c) => {
    const target = c || career;
    if (!target.trim()) return;
    setCareer(target);
    setLoading(true);
    try {
      const { data } = await api.post('/simulator/simulate', { career: target });
      if (data.success) { setSimulation(data.data); setLoading(false); return; }
    } catch { /* fallback */ }
    // Mock data for demo
    setSimulation({
      career: target,
      dailySchedule: [
        { time: '9:00 AM', activity: 'Team standup & sprint planning', type: 'meeting' },
        { time: '9:30 AM', activity: 'Deep work: Feature development & code review', type: 'coding' },
        { time: '12:00 PM', activity: 'Lunch & tech community browsing', type: 'break' },
        { time: '1:00 PM', activity: 'Architecture discussions & design reviews', type: 'meeting' },
        { time: '2:30 PM', activity: 'Problem solving: Bug fixes & optimization', type: 'coding' },
        { time: '4:30 PM', activity: 'Documentation & knowledge sharing', type: 'writing' },
        { time: '5:30 PM', activity: 'Learning: Online courses & side projects', type: 'learning' },
      ],
      stressLevel: 45,
      growthPath: ['Junior', 'Mid-Level', 'Senior', 'Lead', 'Staff', 'Principal'],
      salaryProgression: ['₹4-8 LPA', '₹8-15 LPA', '₹15-30 LPA', '₹30-50 LPA', '₹50-80 LPA', '₹80+ LPA'],
      requiredTraits: ['Problem Solving', 'Continuous Learning', 'Team Collaboration', 'Adaptability'],
      futureOpportunities: ['Tech Lead', 'Engineering Manager', 'CTO', 'Startup Founder', 'Tech Consultant'],
      workLifeBalance: 72,
      remoteWorkChance: 85,
    });
    setLoading(false);
  };

  const typeColors = { meeting: '#f59e0b', coding: '#0ea5e9', break: '#10b981', writing: '#a855f7', learning: '#ec4899' };

  return (
    <div className="app-shell">
      <Sidebar collapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(c => !c)} />
      <main className={`app-main ${sidebarCollapsed ? 'sidebar-is-collapsed' : ''}`}>
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(14,165,233,0.3)' }}>
              <Play size={22} color="white" />
            </div>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: "'Space Grotesk', sans-serif" }}>Career <span className="gradient-text">Simulator</span></h1>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Experience a day in the life of any career</p>
            </div>
          </div>
        </motion.div>

        {!simulation ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="glass-card" style={{ padding: '2rem', maxWidth: 600, margin: '0 auto' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-dim)', marginBottom: '0.5rem' }}>Choose a career to simulate</label>
              <input className="input" placeholder="e.g. Full Stack Developer" value={career} onChange={e => setCareer(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSimulate()} style={{ marginBottom: '1rem' }} />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
                {POPULAR_CAREERS.map(c => (
                  <button key={c} onClick={() => handleSimulate(c)} className="tag" style={{ cursor: 'pointer', transition: 'all 0.2s', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.background = 'var(--color-primary-glow)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.background = 'var(--color-surface-2)'; }}
                  >{c}</button>
                ))}
              </div>
              <button className="btn-primary" onClick={() => handleSimulate()} disabled={loading || !career.trim()} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.875rem', opacity: loading || !career.trim() ? 0.6 : 1 }}>
                <Sparkles size={18} /> {loading ? 'Simulating...' : 'Start Simulation'}
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", marginBottom: '1.5rem' }}>
              A Day as a <span className="gradient-text">{simulation.career}</span>
            </h2>
            {/* Stats row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
              {[
                { label: 'Stress Level', value: `${simulation.stressLevel}%`, icon: Heart, color: simulation.stressLevel > 60 ? '#ef4444' : '#10b981' },
                { label: 'Work-Life Balance', value: `${simulation.workLifeBalance}%`, icon: Clock, color: '#0ea5e9' },
                { label: 'Remote Work', value: `${simulation.remoteWorkChance}%`, icon: Users, color: '#a855f7' },
              ].map((s, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="stat-card" style={{ textAlign: 'center' }}>
                  <s.icon size={20} color={s.color} style={{ marginBottom: '0.5rem' }} />
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: "'Space Grotesk', sans-serif", color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>{s.label}</div>
                </motion.div>
              ))}
            </div>
            {/* Daily Timeline */}
            <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
              <h3 style={{ fontWeight: 700, marginBottom: '1.25rem', fontFamily: "'Space Grotesk', sans-serif", display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Clock size={18} color="var(--color-primary-light)" /> Daily Schedule</h3>
              {simulation.dailySchedule.map((item, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.08 }}
                  style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 0', borderBottom: i < simulation.dailySchedule.length - 1 ? '1px solid var(--color-border-subtle)' : 'none' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-primary-light)', fontFamily: "'JetBrains Mono', monospace", minWidth: 70 }}>{item.time}</span>
                  <div style={{ width: 4, height: 4, borderRadius: '50%', background: typeColors[item.type] || '#0ea5e9', boxShadow: `0 0 6px ${typeColors[item.type] || '#0ea5e9'}` }} />
                  <span style={{ fontSize: '0.88rem', color: 'var(--color-text-dim)' }}>{item.activity}</span>
                </motion.div>
              ))}
            </div>
            {/* Growth Path */}
            <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
              <h3 style={{ fontWeight: 700, marginBottom: '1.25rem', fontFamily: "'Space Grotesk', sans-serif", display: 'flex', alignItems: 'center', gap: '0.5rem' }}><TrendingUp size={18} color="#10b981" /> Growth & Salary Path</h3>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {simulation.growthPath.map((g, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ padding: '0.5rem 0.875rem', borderRadius: 10, background: i === 0 ? 'var(--color-primary-glow)' : 'var(--color-surface-2)', border: `1px solid ${i === 0 ? 'rgba(14,165,233,0.2)' : 'var(--color-border)'}`, textAlign: 'center' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text)' }}>{g}</div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>{simulation.salaryProgression[i]}</div>
                    </div>
                    {i < simulation.growthPath.length - 1 && <ArrowRight size={14} color="var(--color-text-muted)" />}
                  </div>
                ))}
              </div>
            </div>
            {/* Required Traits & Future */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
              <div className="glass-card" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '1rem', fontFamily: "'Space Grotesk', sans-serif" }}><Brain size={16} color="#f59e0b" /> Required Traits</h3>
                {simulation.requiredTraits.map(t => <div key={t} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}><span style={{ color: '#f59e0b' }}>•</span><span style={{ fontSize: '0.85rem', color: 'var(--color-text-dim)' }}>{t}</span></div>)}
              </div>
              <div className="glass-card" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '1rem', fontFamily: "'Space Grotesk', sans-serif" }}><Sparkles size={16} color="#a855f7" /> Future Opportunities</h3>
                {simulation.futureOpportunities.map(o => <div key={o} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}><span style={{ color: '#a855f7' }}>→</span><span style={{ fontSize: '0.85rem', color: 'var(--color-text-dim)' }}>{o}</span></div>)}
              </div>
            </div>
            <button className="btn-ghost" onClick={() => setSimulation(null)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ArrowRight size={16} style={{ transform: 'rotate(180deg)' }} /> Try Another Career
            </button>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default CareerSimulator;
