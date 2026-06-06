import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { assessmentService } from '../services/assessmentService';
import Sidebar from '../components/Sidebar';
import RadarChart from '../components/RadarChart';
import ProgressRing from '../components/ProgressRing';
import { Trophy, DollarSign, Star, Brain, Dna, Map, Mic } from 'lucide-react';

const COLORS = ['#0ea5e9', '#a855f7', '#10b981', '#f59e0b', '#ef4444'];

const ARCHETYPES = {
  analytical_builder: { label: 'Analytical Builder', emoji: '🔧' },
  visual_creator: { label: 'Visual Creator', emoji: '🎨' },
  strategic_thinker: { label: 'Strategic Thinker', emoji: '♟️' },
  product_innovator: { label: 'Product Innovator', emoji: '💡' },
  data_scientist: { label: 'Data Scientist', emoji: '📊' },
  people_connector: { label: 'People Connector', emoji: '🤝' },
  creative_engineer: { label: 'Creative Engineer', emoji: '⚡' },
};

const getArchetype = (scores) => {
  if (!scores) return ARCHETYPES.analytical_builder;
  const { technical = 0, creative = 0, analytical = 0, leadership = 0, communication = 0 } = scores;
  if (technical >= analytical && technical >= creative && analytical >= creative) return ARCHETYPES.analytical_builder;
  if (creative >= technical && creative >= analytical) return ARCHETYPES.visual_creator;
  if (leadership >= analytical) return ARCHETYPES.strategic_thinker;
  if (analytical >= technical) return ARCHETYPES.data_scientist;
  if (communication >= leadership) return ARCHETYPES.people_connector;
  return ARCHETYPES.product_innovator;
};

const ResultsPage = () => {
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id');
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState(null);
  const [all, setAll] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        if (id) {
          const { data } = await assessmentService.getById(id);
          setAssessment(data.data);
        }
        const { data: allData } = await assessmentService.getAll();
        setAll(allData.data || []);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    load();
  }, [id]);

  const display = assessment || all[0];
  const archetype = getArchetype(display?.scores);
  const traitData = display?.scores ? [
    { trait: 'Technical', value: display.scores.technical || 0, fullMark: 15 },
    { trait: 'Creative', value: display.scores.creative || 0, fullMark: 15 },
    { trait: 'Analytical', value: display.scores.analytical || 0, fullMark: 15 },
    { trait: 'Leadership', value: display.scores.leadership || 0, fullMark: 15 },
    { trait: 'Communication', value: display.scores.communication || 0, fullMark: 15 },
  ] : [];

  return (
    <div className="app-shell">
      <Sidebar collapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(c => !c)} />
      <main className={`app-main ${sidebarCollapsed ? 'sidebar-is-collapsed' : ''}`}>
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: "'Space Grotesk', sans-serif" }}>
                Your <span className="gradient-text">Career DNA Results</span>
              </h1>
              <p style={{ color: 'var(--color-text-muted)', marginTop: '0.25rem', fontSize: '0.88rem' }}>Based on your assessment profile</p>
            </div>
            <button className="btn-primary" onClick={() => navigate('/career-dna')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
              <Brain size={16} /> Retake Assessment
            </button>
          </div>
        </motion.div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--color-text-muted)' }}>Loading results...</div>
        ) : !display ? (
          <div className="glass-card" style={{ padding: '4rem', textAlign: 'center' }}>
            <Dna size={64} color="var(--color-text-muted)" style={{ margin: '0 auto 1rem', display: 'block', opacity: 0.4 }} />
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.75rem' }}>No Results Yet</h2>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>Take a Career DNA assessment to see your results.</p>
            <button className="btn-primary" onClick={() => navigate('/career-dna')}>Start Assessment →</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem' }}>
            {/* Left */}
            <div>
              {/* Career DNA Archetype */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.25rem' }}>
                <div style={{ textAlign: 'center', marginBottom: display.careerDNA ? '1.25rem' : 0 }}>
                  <span style={{ fontSize: '2rem' }}>{archetype.emoji}</span>
                  <div style={{ fontWeight: 800, fontSize: '1.3rem', fontFamily: "'Space Grotesk', sans-serif", marginTop: '0.5rem' }} className="gradient-text">
                    {display.careerDNA?.archetype || archetype.label}
                  </div>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '0.82rem', marginTop: '0.35rem' }}>Your career DNA identity</p>
                </div>
                {display.careerDNA && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div style={{ padding: '0.75rem', borderRadius: 10, background: 'var(--color-surface-2)' }}>
                      <div style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--color-success)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>✦ Strengths</div>
                      {display.careerDNA.strengths?.map((s, i) => (
                        <div key={i} style={{ fontSize: '0.78rem', color: 'var(--color-text-dim)', marginBottom: '0.2rem' }}>• {s}</div>
                      ))}
                    </div>
                    <div style={{ padding: '0.75rem', borderRadius: 10, background: 'var(--color-surface-2)' }}>
                      <div style={{ fontSize: '0.68rem', fontWeight: 600, color: '#f59e0b', textTransform: 'uppercase', marginBottom: '0.4rem' }}>⚡ Growth Areas</div>
                      {display.careerDNA.weaknesses?.map((w, i) => (
                        <div key={i} style={{ fontSize: '0.78rem', color: 'var(--color-text-dim)', marginBottom: '0.2rem' }}>• {w}</div>
                      ))}
                    </div>
                    {display.careerDNA.workEnvironment && (
                      <div style={{ padding: '0.75rem', borderRadius: 10, background: 'var(--color-surface-2)' }}>
                        <div style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--color-primary-light)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>🏢 Work Environment</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--color-text-dim)' }}>{display.careerDNA.workEnvironment}</div>
                      </div>
                    )}
                    {display.careerDNA.learningStyle && (
                      <div style={{ padding: '0.75rem', borderRadius: 10, background: 'var(--color-surface-2)' }}>
                        <div style={{ fontSize: '0.68rem', fontWeight: 600, color: '#a855f7', textTransform: 'uppercase', marginBottom: '0.4rem' }}>📚 Learning Style</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--color-text-dim)' }}>{display.careerDNA.learningStyle}</div>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>

              {/* Career Matches */}
              <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--color-text-dim)' }}>
                Career Matches — <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>{new Date(display.createdAt).toLocaleDateString()}</span>
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {display.result?.map((r, i) => (
                  <motion.div key={r.career} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                    className="glass-card" style={{ padding: '1.25rem', borderLeft: `3px solid ${COLORS[i]}` }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '0.75rem' }}>
                      <div style={{ width: 42, height: 42, borderRadius: 12, background: `${COLORS[i]}12`, border: `1px solid ${COLORS[i]}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {i === 0 ? <Trophy size={18} color={COLORS[i]} /> : <Star size={18} color={COLORS[i]} />}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                          <h3 style={{ fontWeight: 700, fontSize: '1rem' }}>{r.career}</h3>
                          {i === 0 && <span className="tag" style={{ fontSize: '0.65rem' }}>Best Match</span>}
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.78rem', color: 'var(--color-text-muted)' }}><DollarSign size={12} /> {r.salary}</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                            <span className={`neon-dot neon-dot-${r.demand === 'High' ? 'green' : 'blue'}`} /> {r.demand} Demand
                          </span>
                        </div>
                      </div>
                      <div style={{ textAlign: 'center', flexShrink: 0 }}>
                        <div style={{ fontSize: '1.75rem', fontWeight: 800, lineHeight: 1, color: COLORS[i] }}>{r.match}%</div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>match</div>
                      </div>
                    </div>
                    <div className="progress-bar" style={{ marginBottom: '0.75rem' }}>
                      <motion.div className="progress-bar-fill" initial={{ width: 0 }} animate={{ width: `${r.match}%` }} transition={{ duration: 1, delay: i * 0.15 }} style={{ background: COLORS[i] }} />
                    </div>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      {r.skills?.map(s => <span key={s} className="tag" style={{ fontSize: '0.68rem' }}>{s}</span>)}
                    </div>
                    <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                      <button
                        className="btn-primary"
                        onClick={() => navigate('/roadmaps', { state: { prefillCareer: r.career } })}
                        style={{ fontSize: '0.8rem', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                      >
                        <Map size={14} /> Generate Roadmap
                      </button>
                      <button
                        className="btn-ghost"
                        onClick={() => navigate('/mock-interview/setup', { state: { jobRole: r.career } })}
                        style={{ fontSize: '0.8rem', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                      >
                        <Mic size={14} /> Practice Interview
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Right */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Radar Chart */}
              {traitData.length > 0 && (
                <div className="glass-card" style={{ padding: '1.5rem' }}>
                  <h3 style={{ fontWeight: 700, marginBottom: '0.75rem', fontSize: '0.9rem', color: 'var(--color-text-dim)' }}>Trait Radar</h3>
                  <RadarChart data={traitData} size={240} />
                </div>
              )}
              {/* Trait scores */}
              <div className="glass-card" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontWeight: 700, marginBottom: '1rem', fontSize: '0.9rem', color: 'var(--color-text-dim)' }}>Trait Scores</h3>
                {display.scores && Object.entries(display.scores).map(([cat, val], i) => (
                  <div key={cat} style={{ marginBottom: '0.875rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', fontSize: '0.78rem' }}>
                      <span style={{ color: 'var(--color-text-dim)', textTransform: 'capitalize', fontWeight: 500 }}>{cat}</span>
                      <span style={{ color: COLORS[i], fontWeight: 600 }}>{val}</span>
                    </div>
                    <div className="progress-bar">
                      <motion.div className="progress-bar-fill" initial={{ width: 0 }} animate={{ width: `${Math.min(val * 7, 100)}%` }} transition={{ duration: 0.8, delay: i * 0.1 }} style={{ background: COLORS[i] }} />
                    </div>
                  </div>
                ))}
              </div>
              {/* History */}
              {all.length > 1 && (
                <div className="glass-card" style={{ padding: '1.5rem' }}>
                  <h3 style={{ fontWeight: 700, marginBottom: '1rem', fontSize: '0.9rem', color: 'var(--color-text-dim)' }}>History</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {all.slice(0, 5).map(a => (
                      <button key={a._id} onClick={() => navigate(`/results?id=${a._id}`)}
                        style={{ display: 'flex', justifyContent: 'space-between', padding: '0.65rem', borderRadius: 10, background: a._id === display._id ? 'var(--color-primary-glow)' : 'var(--color-surface-2)', border: `1px solid ${a._id === display._id ? 'rgba(14,165,233,0.2)' : 'var(--color-border)'}`, cursor: 'pointer', fontSize: '0.8rem' }}>
                        <span style={{ color: 'var(--color-text-dim)' }}>{a.topCareer}</span>
                        <span style={{ color: 'var(--color-primary-light)', fontWeight: 600 }}>{a.result?.[0]?.match}%</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ResultsPage;
