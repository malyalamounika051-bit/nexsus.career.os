import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../components/Sidebar';
import SkillTag from '../components/SkillTag';
import TrendGauge from '../components/TrendGauge';
import api from '../services/api';
import {
  GitCompareArrows, Sparkles, DollarSign, Clock, TrendingUp,
  Briefcase, Zap, ArrowRight, Brain, BarChart2, Target, Scale
} from 'lucide-react';

const QUICK_SKILLS = [
  'React', 'Angular', 'Vue.js', 'Next.js', 'Python', 'Java', 'Go', 'Rust',
  'Node.js', 'Django', 'Docker', 'Kubernetes', 'AWS', 'Azure', 'TypeScript',
  'GraphQL', 'MongoDB', 'PostgreSQL', 'TensorFlow', 'PyTorch',
];

const SkillCompare = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [skill1, setSkill1] = useState('');
  const [skill2, setSkill2] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleCompare = async () => {
    if (!skill1.trim() || !skill2.trim()) { setError('Please enter both skills.'); return; }
    if (skill1.trim().toLowerCase() === skill2.trim().toLowerCase()) { setError('Please pick two different skills.'); return; }
    setLoading(true); setError('');
    try {
      const { data } = await api.post('/skill-intelligence/compare', { skill1: skill1.trim(), skill2: skill2.trim() });
      if (data.success) { setResult(data.data); }
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to compare skills. Please try again.';
      setError(msg);
    } finally { setLoading(false); }
  };

  const metricRows = result ? [
    { label: 'Market Demand', key: 'demandScore', suffix: '/100', icon: BarChart2, color: '#0ea5e9', isScore: true },
    { label: 'Avg Salary', key: 'avgSalaryLpa', prefix: '₹', suffix: ' LPA', icon: DollarSign, color: '#10b981' },
    { label: 'Time to Learn', key: 'timeToLearn', icon: Clock, color: '#f59e0b' },
    { label: 'Difficulty', key: 'difficulty', icon: Brain, color: '#a855f7' },
    { label: 'Future Relevance', key: 'futureRelevance', icon: TrendingUp, color: '#ec4899' },
    { label: 'Job Openings', key: 'jobOpenings', icon: Briefcase, color: '#06b6d4' },
    { label: 'Top Use Case', key: 'topUseCase', icon: Target, color: '#f97316' },
    { label: 'Ecosystem', key: 'ecosystem', icon: Zap, color: '#8b5cf6' },
  ] : [];

  const getWinner = (key) => {
    if (!result) return null;
    const v1 = result.skill1[key];
    const v2 = result.skill2[key];
    if (typeof v1 === 'number' && typeof v2 === 'number') return v1 > v2 ? 1 : v2 > v1 ? 2 : 0;
    return 0;
  };

  // Loading skeleton
  const ComparisonSkeleton = () => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem', padding: '3rem 0' }}>
      <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
        style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Scale size={32} color="white" />
      </motion.div>
      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.88rem' }}>Analyzing <strong>{skill1}</strong> vs <strong>{skill2}</strong>...</p>
      <div style={{ width: '100%', maxWidth: 700, display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skel-pulse" style={{ height: 48, borderRadius: 12 }} />)}
      </div>
    </div>
  );

  return (
    <div className="app-shell">
      <Sidebar collapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(c => !c)} />
      <main className={`app-main ${sidebarCollapsed ? 'sidebar-is-collapsed' : ''}`}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(14,165,233,0.3)' }}>
              <GitCompareArrows size={22} color="white" />
            </div>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: "'Space Grotesk', sans-serif" }}>Skill <span className="gradient-text">Comparison</span></h1>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Compare any two skills side-by-side with AI-powered analysis</p>
            </div>
          </div>
        </motion.div>

        {/* ═══ INPUT PHASE ═══ */}
        {!result && !loading && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="glass-card" style={{ padding: '2rem', maxWidth: 640, margin: '0 auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '1rem', alignItems: 'end', marginBottom: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-dim)', marginBottom: '0.4rem' }}>Skill 1</label>
                  <input id="skill-compare-1" className="input" placeholder="e.g. React" value={skill1} onChange={e => setSkill1(e.target.value)} />
                </div>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.82rem', color: 'white', marginBottom: '2px' }}>
                  VS
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-dim)', marginBottom: '0.4rem' }}>Skill 2</label>
                  <input id="skill-compare-2" className="input" placeholder="e.g. Angular" value={skill2} onChange={e => setSkill2(e.target.value)} />
                </div>
              </div>

              {/* Quick picks */}
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.4rem', textTransform: 'uppercase' }}>Quick Pick</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                  {QUICK_SKILLS.map(s => (
                    <button key={s} onClick={() => { if (!skill1) setSkill1(s); else if (!skill2 && s !== skill1) setSkill2(s); }}
                      style={{
                        padding: '0.2rem 0.55rem', borderRadius: 99, fontSize: '0.7rem', cursor: 'pointer',
                        background: (s === skill1 || s === skill2) ? 'var(--color-primary-glow)' : 'var(--color-surface-2)',
                        border: `1px solid ${(s === skill1 || s === skill2) ? 'rgba(14,165,233,0.3)' : 'var(--color-border)'}`,
                        color: (s === skill1 || s === skill2) ? 'var(--color-primary-light)' : 'var(--color-text-muted)',
                        transition: 'all 0.2s',
                      }}>{s}</button>
                  ))}
                </div>
              </div>

              {/* Popular matchups */}
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.4rem', textTransform: 'uppercase' }}>Popular Matchups</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {[['React', 'Angular'], ['Python', 'Java'], ['AWS', 'Azure'], ['Docker', 'Kubernetes'], ['MongoDB', 'PostgreSQL']].map(([a, b]) => (
                    <button key={a + b} onClick={() => { setSkill1(a); setSkill2(b); }}
                      style={{
                        padding: '0.3rem 0.7rem', borderRadius: 99, fontSize: '0.72rem', cursor: 'pointer',
                        background: 'var(--color-surface-2)', border: '1px solid var(--color-border)',
                        color: 'var(--color-text-dim)', transition: 'all 0.2s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-accent)'; e.currentTarget.style.color = 'var(--color-accent-light)'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text-dim)'; }}
                    >{a} vs {b}</button>
                  ))}
                </div>
              </div>

              {error && <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fca5a5', fontSize: '0.82rem', marginBottom: '1rem' }}>{error}</div>}

              <button id="compare-skills-btn" className="btn-primary" onClick={handleCompare} disabled={!skill1.trim() || !skill2.trim()}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.875rem', opacity: (!skill1.trim() || !skill2.trim()) ? 0.5 : 1 }}>
                <Sparkles size={18} /> Compare Skills
              </button>
            </div>
          </motion.div>
        )}

        {/* ═══ LOADING ═══ */}
        {loading && <ComparisonSkeleton />}

        {/* ═══ RESULTS ═══ */}
        {result && !loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

            {/* Score Header */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="glass-card" style={{ padding: '2rem', marginBottom: '2rem', textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2.5rem', flexWrap: 'wrap' }}>
                <div>
                  <TrendGauge value={result.skill1.demandScore} size={130} label={result.skill1.name} colorFrom="#0ea5e9" colorTo="#38bdf8" />
                </div>
                <div style={{
                  width: 56, height: 56, borderRadius: '50%', background: 'var(--gradient-primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 900, fontSize: '0.9rem', color: 'white',
                  boxShadow: 'var(--shadow-glow-mix)',
                }}>VS</div>
                <div>
                  <TrendGauge value={result.skill2.demandScore} size={130} label={result.skill2.name} colorFrom="#a855f7" colorTo="#c084fc" />
                </div>
              </div>
            </motion.div>

            {/* Comparison Table */}
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem', overflow: 'hidden' }}>
              {/* Header row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 1.5fr', gap: '0.75rem', padding: '0.75rem 0', borderBottom: '1px solid var(--color-border)', marginBottom: '0.5rem' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Metric</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#38bdf8', fontFamily: "'Space Grotesk', sans-serif", textAlign: 'center' }}>{result.skill1.name}</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#c084fc', fontFamily: "'Space Grotesk', sans-serif", textAlign: 'center' }}>{result.skill2.name}</div>
              </div>

              {metricRows.map((row, i) => {
                const v1 = result.skill1[row.key];
                const v2 = result.skill2[row.key];
                const winner = getWinner(row.key);
                return (
                  <motion.div key={row.key} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + i * 0.04 }}
                    style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 1.5fr', gap: '0.75rem', padding: '0.65rem 0', borderBottom: '1px solid var(--color-border-subtle)', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                      <row.icon size={14} color={row.color} /> {row.label}
                    </div>
                    <div style={{
                      textAlign: 'center', fontSize: '0.88rem', fontWeight: 700,
                      fontFamily: typeof v1 === 'number' ? "'Space Grotesk', sans-serif" : "'Inter', sans-serif",
                      color: winner === 1 ? '#38bdf8' : 'var(--color-text-dim)',
                      padding: '0.3rem 0.5rem', borderRadius: 8,
                      background: winner === 1 ? 'rgba(56,189,248,0.08)' : 'transparent',
                    }}>
                      {row.prefix || ''}{v1}{row.isScore ? '/100' : row.suffix || ''}
                      {winner === 1 && ' ✨'}
                    </div>
                    <div style={{
                      textAlign: 'center', fontSize: '0.88rem', fontWeight: 700,
                      fontFamily: typeof v2 === 'number' ? "'Space Grotesk', sans-serif" : "'Inter', sans-serif",
                      color: winner === 2 ? '#c084fc' : 'var(--color-text-dim)',
                      padding: '0.3rem 0.5rem', borderRadius: 8,
                      background: winner === 2 ? 'rgba(192,132,252,0.08)' : 'transparent',
                    }}>
                      {row.prefix || ''}{v2}{row.isScore ? '/100' : row.suffix || ''}
                      {winner === 2 && ' ✨'}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>

            {/* Verdict + Synergy + Common Careers */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '2rem' }}>
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                className="glass-card anim-glow-pulse" style={{ padding: '1.5rem' }}>
                <div className="hub-section-title"><Sparkles size={18} color="#f59e0b" /> AI Verdict</div>
                <p style={{ fontSize: '0.88rem', color: 'var(--color-text-dim)', lineHeight: 1.6 }}>{result.verdict}</p>
                <div style={{ marginTop: '1rem', padding: '0.75rem', borderRadius: 10, background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--color-primary-light)', marginBottom: '0.25rem', textTransform: 'uppercase' }}>Synergy</div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>{result.synergy}</p>
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                className="glass-card" style={{ padding: '1.5rem' }}>
                <div className="hub-section-title"><Briefcase size={18} color="#a855f7" /> Common Career Paths</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {(result.commonCareers || []).map((c, i) => (
                    <SkillTag key={c} label={c} variant="purple" size="md" delay={0.45 + i * 0.06} glow />
                  ))}
                </div>
                <div style={{ marginTop: '1.25rem', padding: '0.75rem', borderRadius: 10, background: 'var(--color-surface-2)' }}>
                  <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
                    Both <strong style={{ color: '#38bdf8' }}>{result.skill1.name}</strong> and <strong style={{ color: '#c084fc' }}>{result.skill2.name}</strong> are valuable. Consider learning both sequentially for maximum career versatility.
                  </p>
                </div>
              </motion.div>
            </div>

            {/* Action */}
            <button className="btn-ghost" onClick={() => { setResult(null); setSkill1(''); setSkill2(''); }}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ArrowRight size={16} style={{ transform: 'rotate(180deg)' }} /> Compare Other Skills
            </button>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default SkillCompare;
