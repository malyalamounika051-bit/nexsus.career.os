import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../components/Sidebar';
import ProgressRing from '../components/ProgressRing';
import SkillTag from '../components/SkillTag';
import api from '../services/api';
import {
  Play, Clock, TrendingUp, Heart, Sparkles, Users, DollarSign,
  ArrowRight, Brain, Zap, Shield, Code2, Coffee, BookOpen,
  Wrench, AlertTriangle, BarChart2, Briefcase, Monitor
} from 'lucide-react';

const POPULAR_CAREERS = [
  'Full Stack Developer', 'Data Scientist', 'UX Designer', 'Product Manager',
  'DevOps Engineer', 'AI/ML Engineer', 'Cybersecurity Analyst', 'Mobile Developer',
  'Cloud Architect', 'Blockchain Developer',
];

const typeIcons = {
  meeting: Users, coding: Code2, break: Coffee, writing: BookOpen,
  learning: Brain, design: Monitor, analysis: BarChart2,
};
const typeColors = {
  meeting: '#f59e0b', coding: '#0ea5e9', break: '#10b981',
  writing: '#a855f7', learning: '#ec4899', design: '#06b6d4', analysis: '#f97316',
};

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
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to simulate career. Please try again.';
      alert(msg);
    }
    setLoading(false);
  };

  // Loading skeleton
  const SimulatorSkeleton = () => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem', padding: '3rem 0' }}>
      <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        style={{ width: 72, height: 72, borderRadius: '50%', border: '3px solid transparent', borderTopColor: 'var(--color-primary)', borderRightColor: 'var(--color-accent)' }} />
      <div style={{ textAlign: 'center' }}>
        <h3 style={{ fontWeight: 700, fontSize: '1.1rem', fontFamily: "'Space Grotesk', sans-serif" }}>
          Simulating <span className="gradient-text">{career}</span>
        </h3>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.82rem', marginTop: '0.25rem' }}>Building your immersive career experience...</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', width: '100%', maxWidth: 500 }}>
        {[1, 2, 3].map(i => <div key={i} className="skel-pulse" style={{ height: 90, borderRadius: 14 }} />)}
      </div>
    </div>
  );

  const totalWeeklyHours = simulation?.weeklyView
    ? Object.values(simulation.weeklyView).reduce((a, b) => a + b, 0) : 40;

  return (
    <div className="app-shell">
      <Sidebar collapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(c => !c)} />
      <main className={`app-main ${sidebarCollapsed ? 'sidebar-is-collapsed' : ''}`}>
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(14,165,233,0.3)' }}>
              <Play size={22} color="white" />
            </div>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: "'Space Grotesk', sans-serif" }}>Career <span className="gradient-text">Simulator</span></h1>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Experience a day in the life, explore challenges, and plan your growth</p>
            </div>
          </div>
        </motion.div>

        {/* ═══ INPUT PHASE ═══ */}
        {!simulation && !loading && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="glass-card" style={{ padding: '2rem', maxWidth: 640, margin: '0 auto' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-dim)', marginBottom: '0.5rem' }}>Choose a career to simulate</label>
              <input id="career-simulator-input" className="input" placeholder="e.g. Full Stack Developer" value={career}
                onChange={e => setCareer(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSimulate()}
                style={{ marginBottom: '1rem' }} />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1.5rem' }}>
                {POPULAR_CAREERS.map(c => (
                  <button key={c} onClick={() => handleSimulate(c)}
                    style={{
                      padding: '0.25rem 0.7rem', borderRadius: 99, fontSize: '0.75rem',
                      background: 'var(--color-surface-2)', border: '1px solid var(--color-border)',
                      color: 'var(--color-text-muted)', cursor: 'pointer', transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.color = 'var(--color-primary-light)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text-muted)'; }}
                  >{c}</button>
                ))}
              </div>
              <button id="start-simulation-btn" className="btn-primary" onClick={() => handleSimulate()} disabled={!career.trim()}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.875rem', opacity: !career.trim() ? 0.5 : 1 }}>
                <Sparkles size={18} /> Start Simulation
              </button>
            </div>
          </motion.div>
        )}

        {/* ═══ LOADING ═══ */}
        {loading && <SimulatorSkeleton />}

        {/* ═══ SIMULATION RESULTS ═══ */}
        {simulation && !loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", marginBottom: '1.5rem' }}>
              A Day as a <span className="gradient-text">{simulation.career}</span>
            </h2>

            {/* Row 1: Quick Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
              {[
                { label: 'Stress Level', value: simulation.stressLevel, icon: Heart, color: simulation.stressLevel > 60 ? '#ef4444' : '#10b981', suffix: '%' },
                { label: 'Work-Life Balance', value: simulation.workLifeBalance, icon: Clock, color: '#0ea5e9', suffix: '%' },
                { label: 'Remote Work', value: simulation.remoteWorkChance, icon: Users, color: '#a855f7', suffix: '%' },
                { label: 'Demand Level', value: simulation.industryDemand?.level || 'High', icon: TrendingUp, color: '#f59e0b', isText: true },
              ].map((s, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                  className="glass-card" style={{ padding: '1.25rem', textAlign: 'center' }}>
                  <s.icon size={20} color={s.color} style={{ marginBottom: '0.5rem' }} />
                  <div style={{ fontSize: s.isText ? '1rem' : '1.75rem', fontWeight: 800, fontFamily: "'Space Grotesk', sans-serif", color: s.color }}>
                    {s.isText ? s.value : `${s.value}${s.suffix}`}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>{s.label}</div>
                </motion.div>
              ))}
            </div>

            {/* Row 2: Daily Timeline + Weekly Breakdown */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
              {/* Daily Timeline */}
              <motion.div initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
                className="glass-card" style={{ padding: '1.5rem' }}>
                <div className="hub-section-title"><Clock size={18} color="var(--color-primary-light)" /> Daily Schedule</div>
                <div className="v-timeline">
                  {simulation.dailySchedule.map((item, i) => {
                    const color = typeColors[item.type] || '#0ea5e9';
                    const Icon = typeIcons[item.type] || Code2;
                    return (
                      <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 + i * 0.06 }}
                        className="v-timeline-item">
                        <div className="v-timeline-dot" style={{ borderColor: color, background: i === 0 ? color : 'var(--color-bg)' }} />
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0.75rem', borderRadius: 10, background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
                          <span style={{ fontSize: '0.72rem', fontWeight: 600, color, fontFamily: "'JetBrains Mono', monospace", minWidth: 58 }}>{item.time}</span>
                          <Icon size={14} color={color} style={{ flexShrink: 0 }} />
                          <span style={{ fontSize: '0.82rem', color: 'var(--color-text-dim)' }}>{item.activity}</span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>

              {/* Weekly View + Industry Demand */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <motion.div initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}
                  className="glass-card" style={{ padding: '1.5rem' }}>
                  <div className="hub-section-title"><BarChart2 size={18} color="#f59e0b" /> Weekly Breakdown</div>
                  {simulation.weeklyView && Object.entries(simulation.weeklyView).map(([key, hours], i) => {
                    const labels = { codingHours: 'Coding', meetingHours: 'Meetings', learningHours: 'Learning', otherHours: 'Other' };
                    const colors = { codingHours: '#0ea5e9', meetingHours: '#f59e0b', learningHours: '#a855f7', otherHours: '#64748b' };
                    const pct = Math.round((hours / totalWeeklyHours) * 100);
                    return (
                      <div key={key} style={{ marginBottom: '0.75rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                          <span style={{ fontSize: '0.78rem', color: 'var(--color-text-dim)' }}>{labels[key] || key}</span>
                          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: colors[key], fontFamily: "'JetBrains Mono', monospace" }}>{hours}h ({pct}%)</span>
                        </div>
                        <div style={{ height: 6, borderRadius: 99, background: 'rgba(255,255,255,0.04)', overflow: 'hidden' }}>
                          <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ delay: 0.3 + i * 0.1, duration: 0.7 }}
                            style={{ height: '100%', borderRadius: 99, background: colors[key] }} />
                        </div>
                      </div>
                    );
                  })}
                </motion.div>

                {/* Industry Demand */}
                {simulation.industryDemand && (
                  <motion.div initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
                    className="glass-card anim-glow-pulse" style={{ padding: '1.5rem', textAlign: 'center' }}>
                    <div className="hub-section-title" style={{ justifyContent: 'center' }}><TrendingUp size={18} color="#10b981" /> Industry Demand</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: "'Space Grotesk', sans-serif", color: '#10b981', marginBottom: '0.25rem' }}>
                      {simulation.industryDemand.level}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginTop: '0.5rem' }}>
                      <div>
                        <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-primary-light)' }}>{simulation.industryDemand.openings}</div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>Open Roles</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '1rem', fontWeight: 700, color: '#10b981' }}>{simulation.industryDemand.growthRate}</div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>Growth Rate</div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Row 3: Tools Used + Challenge Scenarios */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '2rem' }}>
              {/* Tools Used */}
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                className="glass-card" style={{ padding: '1.5rem' }}>
                <div className="hub-section-title"><Wrench size={18} color="var(--color-primary-light)" /> Tools & Technologies</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '0.5rem' }}>
                  {(simulation.toolsUsed || []).map((tool, i) => (
                    <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 + i * 0.04 }}
                      style={{
                        padding: '0.7rem', borderRadius: 10, background: 'var(--color-surface-2)', border: '1px solid var(--color-border)',
                        textAlign: 'center', transition: 'border-color 0.2s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-primary)'}
                      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
                    >
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.15rem' }}>{tool.name}</div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>{tool.category}</div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Challenge Scenarios */}
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                className="glass-card" style={{ padding: '1.5rem' }}>
                <div className="hub-section-title"><AlertTriangle size={18} color="#ef4444" /> Real-World Challenges</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {(simulation.challengeScenarios || []).map((ch, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + i * 0.08 }}
                      className="challenge-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{ch.title}</span>
                        <span className={`difficulty-badge ${ch.difficulty?.toLowerCase()}`}>{ch.difficulty}</span>
                      </div>
                      <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', lineHeight: 1.4 }}>{ch.description}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Row 4: Growth Path + Salary Progression */}
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
              <div className="hub-section-title"><TrendingUp size={18} color="#10b981" /> Growth & Salary Path</div>
              <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', alignItems: 'center' }}>
                {simulation.growthPath.map((g, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.45 + i * 0.06 }}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <div style={{
                      padding: '0.6rem 1rem', borderRadius: 12,
                      background: i === 0 ? 'var(--color-primary-glow)' : 'var(--color-surface-2)',
                      border: `1px solid ${i === 0 ? 'rgba(14,165,233,0.25)' : 'var(--color-border)'}`,
                      textAlign: 'center', transition: 'all 0.2s', minWidth: 90,
                    }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.1rem' }}>{g}</div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--color-primary-light)', fontFamily: "'JetBrains Mono', monospace" }}>
                        {simulation.salaryProgression?.[i] || ''}
                      </div>
                    </div>
                    {i < simulation.growthPath.length - 1 && <ArrowRight size={14} color="var(--color-text-muted)" />}
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Row 5: Required Traits + Future Opportunities */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '2rem' }}>
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                className="glass-card" style={{ padding: '1.5rem' }}>
                <div className="hub-section-title"><Brain size={18} color="#f59e0b" /> Required Traits</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {(simulation.requiredTraits || []).map((t, i) => (
                    <SkillTag key={t} label={t} variant="warning" size="md" delay={0.55 + i * 0.06} glow />
                  ))}
                </div>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                className="glass-card" style={{ padding: '1.5rem' }}>
                <div className="hub-section-title"><Sparkles size={18} color="#a855f7" /> Career Transitions</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {(simulation.futureOpportunities || []).map((o, i) => (
                    <SkillTag key={o} label={o} variant="purple" size="md" delay={0.55 + i * 0.06} />
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Action */}
            <button className="btn-ghost" onClick={() => { setSimulation(null); setCareer(''); }}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ArrowRight size={16} style={{ transform: 'rotate(180deg)' }} /> Try Another Career
            </button>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default CareerSimulator;
