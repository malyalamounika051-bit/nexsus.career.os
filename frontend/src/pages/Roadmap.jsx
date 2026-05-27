import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../components/Sidebar';
import { careerService } from '../services/adviceService';
import { Map, Briefcase, Plus, Sparkles, ChevronDown, ChevronUp, ExternalLink, Trash2, CheckCircle2, Circle, Clock, TrendingUp, DollarSign, Lightbulb, BookOpen, Wrench, Award, Code, Play, GraduationCap, FileText, Users, Globe, AlertCircle, ArrowRight } from 'lucide-react';


const CATEGORY_ICONS = { youtube: Play, course: GraduationCap, docs: FileText, blog: Globe, platform: Code, community: Users, book: BookOpen, other: ExternalLink };
const CATEGORY_COLORS = { youtube: '#ef4444', course: '#a855f7', docs: '#0ea5e9', blog: '#f59e0b', platform: '#10b981', community: '#ec4899', book: '#06b6d4', other: '#8899b0' };
const LOADING_MSGS = ['Analyzing career landscape...', 'Building learning phases...', 'Finding best resources...', 'Crafting your roadmap...'];

const PhaseCard = ({ phase, index, onToggleComplete }) => {
  const [open, setOpen] = useState(false);
  const diff = phase.difficulty || 'beginner';
  return (
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.08 }} style={{ position: 'relative' }}>
      <div className={`roadmap-phase-dot ${phase.completed ? 'completed' : open ? 'active' : ''}`} />
      <div className={`roadmap-phase-card ${phase.completed ? 'completed' : ''}`} style={{ padding: 0 }}>
        <div onClick={() => setOpen(o => !o)} style={{ padding: '1.25rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button onClick={e => { e.stopPropagation(); onToggleComplete(index); }} style={{ background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0, color: phase.completed ? 'var(--color-success)' : 'var(--color-text-muted)' }}>
            {phase.completed ? <CheckCircle2 size={20} /> : <Circle size={20} />}
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 700, fontSize: '0.95rem', fontFamily: "'Space Grotesk', sans-serif" }}>{phase.phase}</span>
              <span className={`difficulty-badge difficulty-${diff}`}>{diff}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.3rem', fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Clock size={12} /> {phase.duration}</span>
              <span>{phase.skills?.length || 0} skills</span>
              <span>{phase.resources?.length || 0} resources</span>
            </div>
          </div>
          {open ? <ChevronUp size={18} color="var(--color-text-muted)" /> : <ChevronDown size={18} color="var(--color-text-muted)" />}
        </div>
        <AnimatePresence>
          {open && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} style={{ overflow: 'hidden' }}>
              <div style={{ padding: '0 1.25rem 1.25rem', borderTop: '1px solid var(--color-border)' }}>
                <div className="phase-content-grid" style={{ marginTop: '1rem' }}>
                  {phase.skills?.length > 0 && (
                    <div>
                      <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--color-primary-light)', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Sparkles size={12} /> Skills
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                        {phase.skills.map((s, i) => <span key={i} className="tag" style={{ fontSize: '0.7rem' }}>{s}</span>)}
                      </div>
                    </div>
                  )}
                  {phase.tools?.length > 0 && (
                    <div>
                      <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#f59e0b', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Wrench size={12} /> Tools
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                        {phase.tools.map((t, i) => (
                          <span key={i} className="tag-warning" style={{ padding: '0.2rem 0.55rem', borderRadius: 99, fontSize: '0.7rem', background: 'var(--color-warning-glow)', border: '1px solid rgba(245,158,11,0.25)', color: '#fbbf24' }}>
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                {phase.topics?.length > 0 && (
                  <div style={{ marginTop: '1rem' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--color-accent-light)', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <BookOpen size={12} /> Topics
                    </div>
                    {phase.topics.map((t, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', padding: '0.4rem 0', fontSize: '0.82rem', color: 'var(--color-text-dim)' }}>
                        <span style={{ color: 'var(--color-primary)', fontWeight: 600, fontSize: '0.75rem', minWidth: 18 }}>{i + 1}.</span>{t}
                      </div>
                    ))}
                  </div>
                )}
                {phase.projects?.length > 0 && (
                  <div style={{ marginTop: '1rem' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#10b981', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Code size={12} /> Projects
                    </div>
                    {phase.projects.map((p, i) => (
                      <div key={i} style={{ padding: '0.6rem 0.75rem', borderRadius: 10, background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', marginBottom: '0.4rem', fontSize: '0.82rem', color: 'var(--color-text-dim)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Code size={14} color="#10b981" />{p}
                      </div>
                    ))}
                  </div>
                )}
                {phase.certifications?.length > 0 && (
                  <div style={{ marginTop: '1rem' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#06b6d4', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Award size={12} /> Certifications
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                      {phase.certifications.map((c, i) => (
                        <span key={i} style={{ padding: '0.25rem 0.6rem', borderRadius: 99, fontSize: '0.72rem', background: 'rgba(6,182,212,0.12)', border: '1px solid rgba(6,182,212,0.25)', color: '#67e8f9' }}>
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {phase.practiceTasks?.length > 0 && (
                  <div style={{ marginTop: '1rem' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#ec4899', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Practice Tasks</div>
                    {phase.practiceTasks.map((t, i) => (
                      <div key={i} style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', padding: '0.3rem 0', display: 'flex', gap: '0.4rem' }}>
                        <span style={{ color: '#ec4899' }}>•</span>{t}
                      </div>
                    ))}
                  </div>
                )}
                {phase.resources?.length > 0 && (
                  <div style={{ marginTop: '1rem' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--color-text-dim)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Resources</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                      {phase.resources.map((r, i) => {
                        const CatIcon = CATEGORY_ICONS[r.category] || ExternalLink;
                        const catColor = CATEGORY_COLORS[r.category] || '#8899b0';
                        return (
                          <a key={i} href={r.url} target="_blank" rel="noopener noreferrer" className="resource-chip" title={r.title}>
                            <CatIcon size={14} style={{ color: catColor, flexShrink: 0 }} />
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.title}</span>
                          </a>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

const RoadmapPage = () => {
  const [sc, setSc] = useState(false);
  const [roadmaps, setRoadmaps] = useState([]);
  const [active, setActive] = useState(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [loadMsg, setLoadMsg] = useState(0);

  useEffect(() => {
    careerService.getMyRoadmaps()
      .then(({ data }) => setRoadmaps(data.data || []))
      .catch(() => {})
      .finally(() => setFetching(false));
  }, []);

  useEffect(() => {
    if (!loading) return;
    const iv = setInterval(() => setLoadMsg(m => (m + 1) % LOADING_MSGS.length), 3000);
    return () => clearInterval(iv);
  }, [loading]);

  const handleGenerate = async () => {
    if (!query.trim()) { setError('Please enter a career goal.'); return; }
    setLoading(true); setError(''); setLoadMsg(0);
    try {
      const { data } = await careerService.generateRoadmap(query.trim());
      if (data.success) {
        setActive(data.data);
        if (!data.cached) {
          const { data: listRes } = await careerService.getMyRoadmaps();
          setRoadmaps(listRes.data || []);
        }
        setShowForm(false); setQuery('');
      } else { setError(data.message || 'Generation failed.'); }
    } catch (err) {
      setError(err?.response?.data?.message || 'Roadmap generation failed. Please try again.');
    } finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this roadmap?')) return;
    try {
      await careerService.deleteRoadmap(id);
      setRoadmaps(prev => prev.filter(r => r._id !== id));
      if (active?._id === id) setActive(null);
    } catch {}
  };

  const handleToggleComplete = async (phaseIndex) => {
    if (!active) return;
    const newCompleted = !active.roadmap[phaseIndex].completed;
    try {
      const { data } = await careerService.updateProgress(active._id, { phaseIndex, completed: newCompleted });
      if (data.success) {
        setActive(data.data);
        setRoadmaps(prev => prev.map(r => r._id === data.data._id ? data.data : r));
      }
    } catch {}
  };

  const completedCount = active?.roadmap?.filter(p => p.completed).length || 0;
  const totalPhases = active?.roadmap?.length || 7;
  const progressPct = Math.round((completedCount / totalPhases) * 100);

  return (
    <div className="app-shell">
      <Sidebar collapsed={sc} onToggleCollapse={() => setSc(c => !c)} />
      <main className={`app-main ${sc ? 'sidebar-is-collapsed' : ''}`}>
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: 44, height: 44, borderRadius: 14, background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(14,165,233,0.3)' }}>
                <Map size={22} color="white" />
              </div>
              <div>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: "'Space Grotesk', sans-serif" }}>AI <span className="gradient-text">Roadmap Generator</span></h1>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Generate structured career learning paths with AI</p>
              </div>
            </div>
            <button className="btn-primary" onClick={() => { setShowForm(true); setActive(null); }} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Plus size={16} /> New Roadmap
            </button>
          </div>
        </motion.div>

        {showForm && !active && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card" style={{ padding: '2rem', maxWidth: 600, margin: '0 auto 2rem' }}>
            <h3 style={{ fontWeight: 700, marginBottom: '0.25rem', fontFamily: "'Space Grotesk', sans-serif" }}>What career do you want to pursue?</h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.82rem', marginBottom: '1.25rem' }}>e.g. AI Engineer, UI/UX Designer, Cybersecurity Analyst, Entrepreneur</p>
            <input className="input" value={query} onChange={e => setQuery(e.target.value)} placeholder="Enter your career goal..." onKeyDown={e => e.key === 'Enter' && handleGenerate()} disabled={loading} />
            {error && <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#fca5a5', fontSize: '0.82rem', marginTop: '0.75rem' }}><AlertCircle size={14} /> {error}</div>}
            <button className="btn-primary" onClick={handleGenerate} disabled={loading || !query.trim()} style={{ width: '100%', marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: loading || !query.trim() ? 0.6 : 1 }}>
              {loading ? (
                <>
                  <div className="roadmap-loading-dots"><span /><span /><span /></div>
                  {LOADING_MSGS[loadMsg]}
                </>
              ) : (
                <><Sparkles size={16} /> Generate Career Roadmap</>
              )}
            </button>
          </motion.div>
        )}

        {!showForm && !active && (
          <div>
            {fetching ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>Loading roadmaps...</div>
            ) : roadmaps.length === 0 ? (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card" style={{ padding: '3rem', textAlign: 'center', maxWidth: 500, margin: '0 auto' }}>
                <Map size={48} color="var(--color-text-muted)" style={{ margin: '0 auto 1rem', display: 'block', opacity: 0.5 }} />
                <h3 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>No roadmaps yet</h3>
                <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>Generate your first AI-powered career roadmap</p>
                <button className="btn-primary" onClick={() => setShowForm(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Plus size={16} /> Generate Your First Roadmap
                </button>
              </motion.div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                {roadmaps.map((r, i) => {
                  const prog = r.roadmap?.filter(p => p.completed).length || 0;
                  const tot = r.roadmap?.length || 7;
                  return (
                    <motion.div key={r._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="glass-card" style={{ padding: '1.25rem', cursor: 'pointer' }} onClick={() => setActive(r)}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: '1rem', fontFamily: "'Space Grotesk', sans-serif", marginBottom: '0.3rem' }}>{r.domain}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>{new Date(r.createdAt).toLocaleDateString()}</div>
                        </div>
                        <button onClick={e => { e.stopPropagation(); handleDelete(r._id); }} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <div className="progress-bar" style={{ flex: 1 }}>
                          <div className="progress-bar-fill" style={{ width: `${Math.round((prog / tot) * 100)}%` }} />
                        </div>
                        <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>{prog}/{tot}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                        <span className="tag" style={{ fontSize: '0.65rem' }}>{r.demand} Demand</span>
                        {r.futureScore && (
                          <span className="tag-purple" style={{ padding: '0.2rem 0.5rem', borderRadius: 99, fontSize: '0.65rem', background: 'var(--color-accent-glow)', color: 'var(--color-accent-light)', border: '1px solid rgba(168,85,247,0.25)' }}>
                            Future: {r.futureScore}%
                          </span>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {active && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <button className="btn-ghost" onClick={() => setActive(null)} style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
              <ArrowRight size={14} style={{ transform: 'rotate(180deg)' }} /> Back to My Roadmaps
            </button>
            <div className="roadmap-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.5rem', alignItems: 'start' }}>
              <div>
                <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                  <h2 style={{ fontWeight: 800, fontSize: '1.3rem', fontFamily: "'Space Grotesk', sans-serif", marginBottom: '0.3rem' }}>{active.domain}</h2>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginBottom: '1rem', lineHeight: 1.6 }}>{active.description}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div className="progress-bar" style={{ width: 120 }}><div className="progress-bar-fill" style={{ width: `${progressPct}%` }} /></div>
                      <span style={{ fontSize: '0.78rem', fontWeight: 600 }} className="gradient-text">{progressPct}%</span>
                    </div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>{completedCount} of {totalPhases} phases complete</span>
                  </div>
                </div>
                <div className="roadmap-timeline">
                  {active.roadmap?.map((phase, i) => (
                    <PhaseCard key={i} phase={phase} index={i} onToggleComplete={handleToggleComplete} />
                  ))}
                </div>
              </div>
              <div className="roadmap-insights-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="glass-card" style={{ padding: '1.25rem' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Award size={12} /> Interview Readiness
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 800, fontFamily: "'Space Grotesk', sans-serif", color: 'var(--color-primary-light)' }}>
                      {active.progress?.interviewReadiness !== undefined ? active.progress.interviewReadiness : progressPct}%
                    </div>
                    <div className="progress-bar" style={{ flex: 1 }}>
                      <div className="progress-bar-fill" style={{ width: `${active.progress?.interviewReadiness !== undefined ? active.progress.interviewReadiness : progressPct}%` }} />
                    </div>
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
                    Complete phases to boost readiness!
                  </div>
                </div>
                <div className="glass-card" style={{ padding: '1.25rem' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <DollarSign size={12} /> Salary Range
                  </div>
                  <div style={{ fontWeight: 800, fontSize: '1.1rem', fontFamily: "'Space Grotesk', sans-serif" }} className="gradient-text">
                    {active.salaryRange?.min || active.avgSalary} — {active.salaryRange?.max || ''}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>Growth: {active.growthRate}</div>
                </div>
                <div className="glass-card" style={{ padding: '1.25rem' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <TrendingUp size={12} /> Future Demand
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 800, fontFamily: "'Space Grotesk', sans-serif", color: (active.futureScore || 70) >= 70 ? 'var(--color-success)' : (active.futureScore || 70) >= 40 ? '#fbbf24' : '#fca5a5' }}>
                      {active.futureScore || 70}%
                    </div>
                    <div className="progress-bar" style={{ flex: 1 }}>
                      <div className="progress-bar-fill" style={{ width: `${active.futureScore || 70}%`, background: (active.futureScore || 70) >= 70 ? 'var(--color-success)' : '#f59e0b' }} />
                    </div>
                  </div>
                </div>
                {active.alternativePaths?.length > 0 && (
                  <div className="glass-card" style={{ padding: '1.25rem' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Alternative Paths</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                      {active.alternativePaths.map((p, i) => (
                        <span key={i} className="tag-purple" style={{ padding: '0.2rem 0.55rem', borderRadius: 99, fontSize: '0.68rem', background: 'var(--color-accent-glow)', color: 'var(--color-accent-light)', border: '1px solid rgba(168,85,247,0.25)' }}>
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {active.studyStrategy && (
                  <div className="glass-card" style={{ padding: '1.25rem' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Lightbulb size={12} /> AI Study Strategy
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--color-text-dim)', lineHeight: 1.6 }}>{active.studyStrategy}</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default RoadmapPage;
