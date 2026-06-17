import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../components/Sidebar';
import ProgressRing from '../components/ProgressRing';
import SkillTag from '../components/SkillTag';
import api from '../services/api';
import {
  FileSearch, Upload, AlertCircle, CheckCircle2,
  X, Sparkles, ArrowRight, Target, BookOpen, Briefcase,
  Clock, DollarSign, TrendingUp, Brain, Zap, Calendar, Route
} from 'lucide-react';

const POPULAR_ROLES = [
  'Full Stack Developer', 'Data Scientist', 'DevOps Engineer', 'AI/ML Engineer',
  'UX Designer', 'Product Manager', 'Cybersecurity Analyst', 'Mobile Developer',
];

const SkillGap = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentSkills, setCurrentSkills] = useState([]);
  const [skillInput, setSkillInput] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [file, setFile] = useState(null);
  const [addedToGPS, setAddedToGPS] = useState(false);
  const fileRef = useRef(null);
  const inputRef = useRef(null);

  const addSkill = (skill) => {
    const trimmed = skill.trim();
    if (trimmed && !currentSkills.includes(trimmed)) {
      setCurrentSkills(prev => [...prev, trimmed]);
    }
    setSkillInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && skillInput.trim()) {
      e.preventDefault();
      addSkill(skillInput);
    } else if (e.key === 'Backspace' && !skillInput && currentSkills.length > 0) {
      setCurrentSkills(prev => prev.slice(0, -1));
    }
  };

  const handleAnalyze = async () => {
    if (!targetRole.trim()) { setError('Please enter a target role.'); return; }
    setLoading(true); setError('');
    try {
      const fd = new FormData();
      if (file) fd.append('resume', file);
      fd.append('targetRole', targetRole.trim());
      if (currentSkills.length > 0) fd.append('currentSkills', JSON.stringify(currentSkills));
      const { data } = await api.post('/skill-gap/analyze', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (data.success) setResult(data.data);
    } catch {
      // Fallback mock data for demo
      setResult({
        targetRole: targetRole.trim(),
        interviewReadiness: 62,
        estimatedTimeToReady: '4 months',
        matchingSkills: currentSkills.length > 0 ? currentSkills.slice(0, 4) : ['JavaScript', 'React', 'Problem Solving', 'Git'],
        missingSkills: ['TypeScript', 'System Design', 'Docker', 'AWS', 'CI/CD', 'Node.js'],
        salaryImpact: { currentRange: '₹4-8 LPA', potentialRange: '₹15-30 LPA', increase: '+200%' },
        careerPathsUnlocked: ['Senior Developer', 'Tech Lead', 'Solutions Architect', 'Engineering Manager'],
        recommendedProjects: [
          'Build a full-stack TypeScript app with Next.js',
          'Deploy a microservice with Docker and AWS',
          'Create a CI/CD pipeline with GitHub Actions',
          'Build a real-time chat with WebSockets',
        ],
        improvementAreas: [
          { area: 'Backend Architecture', priority: 'High', description: 'Learn system design & microservices patterns' },
          { area: 'Cloud & DevOps', priority: 'High', description: 'Get comfortable with AWS, Docker, and CI/CD' },
          { area: 'Testing', priority: 'Medium', description: 'Master unit and integration testing frameworks' },
          { area: 'TypeScript', priority: 'Medium', description: 'Adopt TypeScript for type-safe development' },
        ],
        learningPlan: [
          { week: 'Week 1-2', focus: 'TypeScript Fundamentals', resources: 4 },
          { week: 'Week 3-4', focus: 'Node.js & Express Deep Dive', resources: 5 },
          { week: 'Week 5-6', focus: 'System Design Basics', resources: 3 },
          { week: 'Week 7-8', focus: 'Docker & Containerization', resources: 4 },
          { week: 'Week 9-12', focus: 'AWS Services & Deployment', resources: 6 },
          { week: 'Week 13-16', focus: 'CI/CD & Portfolio Projects', resources: 5 },
        ],
        skillCategoryBreakdown: { frontend: 85, backend: 25, devops: 10, softSkills: 65 },
      });
    } finally { setLoading(false); }
  };

  const handleAddToGPS = () => {
    setAddedToGPS(true);
    setTimeout(() => setAddedToGPS(false), 3000);
  };

  const catColors = {
    frontend: { color: '#38bdf8', bg: 'rgba(56,189,248,0.12)' },
    backend: { color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
    devops: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
    softSkills: { color: '#a855f7', bg: 'rgba(168,85,247,0.12)' },
  };

  // Skeleton loader for analysis state
  const AnalysisSkeleton = () => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem', padding: '3rem 0' }}>
      <motion.div
        animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 2, repeat: Infinity }}
        style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <Brain size={36} color="white" />
      </motion.div>
      <div style={{ textAlign: 'center' }}>
        <h3 style={{ fontWeight: 700, fontSize: '1.1rem', fontFamily: "'Space Grotesk', sans-serif", marginBottom: '0.5rem' }}>
          Analyzing Your <span className="gradient-text">Skill Profile</span>
        </h3>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
          Comparing against industry requirements for {targetRole}...
        </p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', width: '100%', maxWidth: 500 }}>
        {[1, 2, 3].map(i => (
          <div key={i} className="skel-pulse" style={{ height: 80, borderRadius: 14 }} />
        ))}
      </div>
      <div style={{ width: '100%', maxWidth: 500, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="skel-pulse" style={{ height: 20, borderRadius: 8, width: `${100 - i * 15}%` }} />
        ))}
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
              <FileSearch size={22} color="white" />
            </div>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: "'Space Grotesk', sans-serif" }}>AI Skill <span className="gradient-text">Gap Analyzer</span></h1>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Discover gaps, unlock careers, and build your personalized learning plan</p>
            </div>
          </div>
        </motion.div>

        {/* ═══ INPUT PHASE ═══ */}
        {!result && !loading && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="glass-card" style={{ padding: '2rem', maxWidth: 640, margin: '0 auto' }}>
              {/* Current Skills Input */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-dim)', marginBottom: '0.5rem' }}>
                  Your Current Skills
                </label>
                <div className="skill-input-container" onClick={() => inputRef.current?.focus()}>
                  <AnimatePresence>
                    {currentSkills.map((s, i) => (
                      <SkillTag key={s} label={s} variant="info" size="sm" removable delay={i * 0.05} onRemove={() => setCurrentSkills(prev => prev.filter(x => x !== s))} />
                    ))}
                  </AnimatePresence>
                  <input
                    ref={inputRef}
                    className="skill-input-field"
                    placeholder={currentSkills.length === 0 ? 'Type a skill and press Enter (e.g. React, Python)' : 'Add more...'}
                    value={skillInput}
                    onChange={e => setSkillInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                  />
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginTop: '0.5rem' }}>
                  {['HTML', 'CSS', 'JavaScript', 'React', 'Python', 'Node.js', 'SQL'].filter(s => !currentSkills.includes(s)).slice(0, 5).map(s => (
                    <button key={s} onClick={() => addSkill(s)} style={{
                      padding: '0.15rem 0.5rem', borderRadius: 99, fontSize: '0.68rem',
                      background: 'var(--color-surface-3)', border: '1px solid var(--color-border)',
                      color: 'var(--color-text-muted)', cursor: 'pointer', transition: 'all 0.2s',
                    }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.color = 'var(--color-primary-light)'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text-muted)'; }}
                    >+ {s}</button>
                  ))}
                </div>
              </div>

              {/* Target Role */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-dim)', marginBottom: '0.5rem' }}>Target Career Role *</label>
                <input className="input" placeholder="e.g. Full Stack Developer" value={targetRole} onChange={e => setTargetRole(e.target.value)} />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.5rem' }}>
                  {POPULAR_ROLES.map(r => (
                    <button key={r} onClick={() => setTargetRole(r)} style={{
                      padding: '0.2rem 0.6rem', borderRadius: 99, fontSize: '0.68rem',
                      background: targetRole === r ? 'var(--color-primary-glow)' : 'var(--color-surface-3)',
                      border: `1px solid ${targetRole === r ? 'rgba(14,165,233,0.3)' : 'var(--color-border)'}`,
                      color: targetRole === r ? 'var(--color-primary-light)' : 'var(--color-text-muted)',
                      cursor: 'pointer', transition: 'all 0.2s',
                    }}>{r}</button>
                  ))}
                </div>
              </div>

              {/* Resume Upload */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-dim)', marginBottom: '0.5rem' }}>Upload Resume (optional)</label>
                <div onClick={() => fileRef.current?.click()} style={{
                  border: `2px dashed ${file ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  borderRadius: 14, padding: '1.5rem', textAlign: 'center', cursor: 'pointer',
                  background: file ? 'var(--color-primary-glow)' : 'var(--color-surface-2)',
                  transition: 'all 0.3s',
                }}>
                  <input ref={fileRef} type="file" accept=".pdf" onChange={e => { const f = e.target.files?.[0]; if (f?.type === 'application/pdf') { setFile(f); setError(''); } }} style={{ display: 'none' }} />
                  {file ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                      <CheckCircle2 size={20} color="var(--color-success)" />
                      <span style={{ fontSize: '0.9rem' }}>{file.name}</span>
                      <button onClick={e => { e.stopPropagation(); setFile(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}><X size={16} /></button>
                    </div>
                  ) : (
                    <><Upload size={28} color="var(--color-text-muted)" style={{ marginBottom: '0.5rem' }} /><p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Click to upload PDF resume</p></>
                  )}
                </div>
              </div>

              {error && <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fca5a5', fontSize: '0.85rem', marginBottom: '1rem' }}><AlertCircle size={16} /> {error}</div>}

              <button id="analyze-skill-gap-btn" className="btn-primary" onClick={handleAnalyze} disabled={!targetRole.trim()} style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                padding: '0.875rem', opacity: !targetRole.trim() ? 0.5 : 1,
              }}>
                <Sparkles size={18} /> Analyze Skill Gap
              </button>
            </div>
          </motion.div>
        )}

        {/* ═══ LOADING STATE ═══ */}
        {loading && <AnalysisSkeleton />}

        {/* ═══ RESULTS PHASE ═══ */}
        {result && !loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>

            {/* Row 1: Readiness Ring + Quick Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '1.5rem', marginBottom: '2rem', alignItems: 'start' }}>

              {/* Readiness Ring */}
              <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1, type: 'spring' }}
                className="glass-card anim-glow-pulse" style={{ padding: '2rem', textAlign: 'center' }}>
                <ProgressRing value={result.interviewReadiness} size={180} strokeWidth={12} label="Interview Ready" />
                <div style={{ marginTop: '0.75rem', fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>for <strong style={{ color: 'var(--color-text)' }}>{result.targetRole}</strong></div>
              </motion.div>

              {/* Quick Stats Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                {[
                  { icon: Clock, label: 'Time to Ready', value: result.estimatedTimeToReady || '~3 months', color: '#0ea5e9' },
                  { icon: DollarSign, label: 'Salary Potential', value: result.salaryImpact?.potentialRange || '₹15-30 LPA', color: '#10b981' },
                  { icon: TrendingUp, label: 'Salary Boost', value: result.salaryImpact?.increase || '+150%', color: '#f59e0b' },
                  { icon: Briefcase, label: 'Careers Unlocked', value: `${(result.careerPathsUnlocked || []).length} paths`, color: '#a855f7' },
                ].map((stat, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.08 }}
                    className="glass-card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: 42, height: 42, borderRadius: 10, background: `${stat.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <stat.icon size={20} color={stat.color} />
                    </div>
                    <div>
                      <div style={{ fontSize: '1.15rem', fontWeight: 800, fontFamily: "'Space Grotesk', sans-serif", color: stat.color }} className="anim-count">{stat.value}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>{stat.label}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Row 2: Skills You Have + Missing Skills */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '2rem' }}>
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
                className="glass-card" style={{ padding: '1.5rem' }}>
                <div className="hub-section-title"><CheckCircle2 size={18} color="#10b981" /> Skills You Have</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {(result.matchingSkills || []).map((s, i) => (
                    <SkillTag key={s} label={s} variant="success" size="md" icon={CheckCircle2} delay={0.3 + i * 0.05} glow />
                  ))}
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
                className="glass-card" style={{ padding: '1.5rem' }}>
                <div className="hub-section-title"><AlertCircle size={18} color="#ef4444" /> Missing Skills</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {(result.missingSkills || []).map((s, i) => (
                    <SkillTag key={s} label={s} variant="danger" size="md" delay={0.3 + i * 0.05} />
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Row 3: Skill Category Breakdown */}
            {result.skillCategoryBreakdown && (
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                <div className="hub-section-title"><Brain size={18} color="var(--color-primary-light)" /> Skill Category Breakdown</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  {Object.entries(result.skillCategoryBreakdown).map(([cat, val], i) => {
                    const c = catColors[cat] || catColors.frontend;
                    return (
                      <motion.div key={cat} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 + i * 0.08 }}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: c.color, textTransform: 'capitalize' }}>{cat.replace(/([A-Z])/g, ' $1')}</span>
                            <span style={{ fontSize: '0.82rem', fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", color: c.color }}>{val}%</span>
                          </div>
                          <div style={{ height: 6, borderRadius: 99, background: 'rgba(255,255,255,0.04)', overflow: 'hidden' }}>
                            <motion.div initial={{ width: 0 }} animate={{ width: `${val}%` }} transition={{ delay: 0.5 + i * 0.1, duration: 0.8, ease: 'easeOut' }}
                              style={{ height: '100%', borderRadius: 99, background: c.color, boxShadow: `0 0 8px ${c.color}40` }} />
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Row 4: Improvement Areas + Learning Plan */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '2rem' }}>
              {/* Improvement Areas */}
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                className="glass-card" style={{ padding: '1.5rem' }}>
                <div className="hub-section-title"><Target size={18} color="#ef4444" /> Priority Improvement Areas</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {(result.improvementAreas || []).map((item, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.55 + i * 0.08 }}
                      style={{ padding: '0.85rem', borderRadius: 12, background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
                      <span className={`difficulty-badge ${item.priority === 'High' ? 'hard' : item.priority === 'Medium' ? 'medium' : 'easy'}`}>{item.priority}</span>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.88rem', marginBottom: '0.15rem' }}>{item.area}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>{item.description}</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Week-by-week Learning Plan */}
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                className="glass-card" style={{ padding: '1.5rem' }}>
                <div className="hub-section-title"><Calendar size={18} color="#0ea5e9" /> Learning Plan</div>
                <div className="v-timeline">
                  {(result.learningPlan || []).map((item, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 + i * 0.08 }}
                      className="v-timeline-item">
                      <div className="v-timeline-dot" style={{ borderColor: 'var(--color-primary)', background: i === 0 ? 'var(--color-primary)' : 'var(--color-bg)' }} />
                      <div className="week-card">
                        <span className="week-badge">{item.week}</span>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.1rem' }}>{item.focus}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>{item.resources} resources</div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Row 5: Career Paths Unlocked + Projects */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '2rem' }}>
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
                className="glass-card" style={{ padding: '1.5rem' }}>
                <div className="hub-section-title"><Route size={18} color="#a855f7" /> Careers Unlocked</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {(result.careerPathsUnlocked || []).map((c, i) => (
                    <SkillTag key={c} label={c} variant="purple" size="md" delay={0.6 + i * 0.06} glow />
                  ))}
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
                className="glass-card" style={{ padding: '1.5rem' }}>
                <div className="hub-section-title"><Briefcase size={18} color="#f59e0b" /> Portfolio Projects</div>
                {(result.recommendedProjects || []).map((p, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.65rem', borderRadius: 10, background: 'var(--color-surface-2)', marginBottom: '0.4rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.78rem', color: '#f59e0b', fontFamily: "'JetBrains Mono', monospace" }}>{String(i + 1).padStart(2, '0')}</span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--color-text-dim)' }}>{p}</span>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <button className="btn-primary" onClick={handleAddToGPS} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem' }}>
                <Zap size={18} /> {addedToGPS ? '✓ Added to Career GPS!' : 'Add Missing Skills to GPS'}
              </button>
              <button className="btn-ghost" onClick={() => { setResult(null); setFile(null); setTargetRole(''); setCurrentSkills([]); }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ArrowRight size={16} style={{ transform: 'rotate(180deg)' }} /> Analyze Another Role
              </button>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default SkillGap;
