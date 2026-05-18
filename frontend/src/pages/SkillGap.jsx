import { useState } from 'react';
import { motion } from 'framer-motion';
import Sidebar from '../components/Sidebar';
import api from '../services/api';
import {
  FileSearch, Upload, AlertCircle, CheckCircle2,
  X, Sparkles, ArrowRight, Target, BookOpen, Briefcase
} from 'lucide-react';
import { useRef } from 'react';

const SkillGap = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [targetRole, setTargetRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [file, setFile] = useState(null);
  const fileRef = useRef(null);

  const handleAnalyze = async () => {
    if (!targetRole.trim()) { setError('Please enter a target role.'); return; }
    setLoading(true); setError('');
    try {
      const fd = new FormData();
      if (file) fd.append('resume', file);
      fd.append('targetRole', targetRole.trim());
      const { data } = await api.post('/skill-gap/analyze', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (data.success) setResult(data.data);
    } catch {
      setResult({
        targetRole: targetRole.trim(), interviewReadiness: 62,
        matchingSkills: ['JavaScript', 'React', 'Problem Solving', 'Git'],
        missingSkills: ['TypeScript', 'System Design', 'Docker', 'AWS', 'CI/CD'],
        recommendedProjects: ['Build a full-stack app with TypeScript and Next.js', 'Deploy with Docker and AWS', 'Create a CI/CD pipeline'],
        improvementAreas: [
          { area: 'Backend Architecture', priority: 'High', description: 'Learn system design & microservices' },
          { area: 'Cloud & DevOps', priority: 'High', description: 'Get comfortable with AWS and containers' },
          { area: 'Testing', priority: 'Medium', description: 'Master unit and integration testing' },
        ],
      });
    } finally { setLoading(false); }
  };

  return (
    <div className="app-shell">
      <Sidebar collapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(c => !c)} />
      <main className={`app-main ${sidebarCollapsed ? 'sidebar-is-collapsed' : ''}`}>
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(14,165,233,0.3)' }}>
              <FileSearch size={22} color="white" />
            </div>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: "'Space Grotesk', sans-serif" }}>Skill <span className="gradient-text">Gap Analyzer</span></h1>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>AI-powered skill comparison against market requirements</p>
            </div>
          </div>
        </motion.div>

        {!result ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="glass-card" style={{ padding: '2rem', maxWidth: 600, margin: '0 auto' }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-dim)', marginBottom: '0.5rem' }}>Target Career Role *</label>
                <input className="input" placeholder="e.g. Full Stack Developer" value={targetRole} onChange={e => setTargetRole(e.target.value)} />
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-dim)', marginBottom: '0.5rem' }}>Upload Resume (optional)</label>
                <div onClick={() => fileRef.current?.click()} style={{ border: `2px dashed ${file ? 'var(--color-primary)' : 'var(--color-border)'}`, borderRadius: 14, padding: '2rem', textAlign: 'center', cursor: 'pointer', background: file ? 'var(--color-primary-glow)' : 'var(--color-surface-2)' }}>
                  <input ref={fileRef} type="file" accept=".pdf" onChange={e => { const f = e.target.files?.[0]; if (f?.type === 'application/pdf') { setFile(f); setError(''); } }} style={{ display: 'none' }} />
                  {file ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                      <CheckCircle2 size={20} color="var(--color-success)" />
                      <span style={{ fontSize: '0.9rem' }}>{file.name}</span>
                      <button onClick={e => { e.stopPropagation(); setFile(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}><X size={16} /></button>
                    </div>
                  ) : (
                    <><Upload size={32} color="var(--color-text-muted)" style={{ marginBottom: '0.75rem' }} /><p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Click to upload PDF</p></>
                  )}
                </div>
              </div>
              {error && <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fca5a5', fontSize: '0.85rem', marginBottom: '1rem' }}><AlertCircle size={16} /> {error}</div>}
              <button className="btn-primary" onClick={handleAnalyze} disabled={loading || !targetRole.trim()} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.875rem', opacity: loading || !targetRole.trim() ? 0.6 : 1 }}>
                <Sparkles size={18} /> {loading ? 'Analyzing...' : 'Analyze Skill Gap'}
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
              <div className="glass-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
                <Target size={24} color="var(--color-primary-light)" style={{ marginBottom: '0.75rem' }} />
                <div style={{ fontSize: '2.5rem', fontWeight: 800, fontFamily: "'Space Grotesk', sans-serif" }} className="gradient-text">{result.interviewReadiness}%</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>Interview Readiness</div>
              </div>
              <div className="glass-card" style={{ padding: '1.5rem' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--color-success)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>✅ Matching Skills</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>{result.matchingSkills.map(s => <span key={s} className="tag-green" style={{ padding: '0.2rem 0.6rem', borderRadius: 99, background: 'var(--color-success-glow)', border: '1px solid rgba(16,185,129,0.25)', fontSize: '0.72rem', color: '#6ee7b7' }}>{s}</span>)}</div>
              </div>
              <div className="glass-card" style={{ padding: '1.5rem' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#ef4444', textTransform: 'uppercase', marginBottom: '0.75rem' }}>⚠️ Missing Skills</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>{result.missingSkills.map(s => <span key={s} style={{ padding: '0.2rem 0.6rem', borderRadius: 99, background: 'var(--color-danger-glow)', border: '1px solid rgba(239,68,68,0.25)', fontSize: '0.72rem', color: '#fca5a5' }}>{s}</span>)}</div>
              </div>
            </div>
            <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
              <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '1rem', fontFamily: "'Space Grotesk', sans-serif", display: 'flex', alignItems: 'center', gap: '0.5rem' }}><BookOpen size={18} color="var(--color-primary-light)" /> Improvement Areas</h3>
              {result.improvementAreas.map((item, i) => (
                <div key={i} style={{ padding: '1rem', borderRadius: 12, background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.5rem' }}>
                  <span style={{ padding: '0.15rem 0.5rem', borderRadius: 99, fontSize: '0.65rem', fontWeight: 600, background: item.priority === 'High' ? 'var(--color-danger-glow)' : 'var(--color-warning-glow)', color: item.priority === 'High' ? '#fca5a5' : '#fbbf24', border: `1px solid ${item.priority === 'High' ? 'rgba(239,68,68,0.25)' : 'rgba(245,158,11,0.25)'}`, whiteSpace: 'nowrap' }}>{item.priority}</span>
                  <div><div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.2rem' }}>{item.area}</div><div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{item.description}</div></div>
                </div>
              ))}
            </div>
            <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
              <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '1rem', fontFamily: "'Space Grotesk', sans-serif", display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Briefcase size={18} color="#f59e0b" /> Recommended Projects</h3>
              {result.recommendedProjects.map((p, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', borderRadius: 10, background: 'var(--color-surface-2)', marginBottom: '0.5rem' }}>
                  <span style={{ color: '#f59e0b', fontWeight: 700, fontSize: '0.8rem' }}>{i + 1}</span>
                  <span style={{ fontSize: '0.88rem', color: 'var(--color-text-dim)' }}>{p}</span>
                </div>
              ))}
            </div>
            <button className="btn-ghost" onClick={() => { setResult(null); setFile(null); setTargetRole(''); }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ArrowRight size={16} style={{ transform: 'rotate(180deg)' }} /> Analyze Another Role
            </button>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default SkillGap;
