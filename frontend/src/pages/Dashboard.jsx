import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { assessmentService } from '../services/assessmentService';
import Sidebar from '../components/Sidebar';
import StatCard from '../components/StatCard';
import ProgressRing from '../components/ProgressRing';
import ScoreGauge from '../components/ScoreGauge';
import RadarChart from '../components/RadarChart';
import { SkeletonCard } from '../components/SkeletonLoader';
import {
  Dna, Trophy, Shield, Zap, ArrowRight,
  Brain, Map, MessageSquare, FileSearch, Play,
  Flame, Star, CheckCircle2, Sparkles, Clock, Mic
} from 'lucide-react';

/* ── Career DNA Archetypes ────────────────────────────── */
const ARCHETYPES = {
  analytical_builder: { label: 'Analytical Builder', emoji: '🔧', color: '#0ea5e9' },
  visual_creator: { label: 'Visual Creator', emoji: '🎨', color: '#a855f7' },
  strategic_thinker: { label: 'Strategic Thinker', emoji: '♟️', color: '#f59e0b' },
  product_innovator: { label: 'Product Innovator', emoji: '💡', color: '#10b981' },
  tech_leader: { label: 'Tech Leader', emoji: '🚀', color: '#0ea5e9' },
  people_connector: { label: 'People Connector', emoji: '🤝', color: '#ec4899' },
  data_scientist: { label: 'Data Scientist', emoji: '📊', color: '#06b6d4' },
  creative_engineer: { label: 'Creative Engineer', emoji: '⚡', color: '#8b5cf6' },
};

const getArchetype = (scores) => {
  if (!scores) return ARCHETYPES.analytical_builder;
  const { technical = 0, creative = 0, analytical = 0, leadership = 0, communication = 0 } = scores;
  if (technical >= analytical && technical >= creative && analytical >= creative) return ARCHETYPES.analytical_builder;
  if (creative >= technical && creative >= analytical) return ARCHETYPES.visual_creator;
  if (leadership >= analytical && leadership >= communication) return ARCHETYPES.strategic_thinker;
  if (creative >= communication && technical >= analytical) return ARCHETYPES.creative_engineer;
  if (communication >= leadership) return ARCHETYPES.people_connector;
  if (analytical >= technical) return ARCHETYPES.data_scientist;
  return ARCHETYPES.product_innovator;
};

/* ── Greeting ─────────────────────────────────────────── */
const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

const AI_INSIGHTS = [
  "Your design creativity score has been trending up. Frontend Engineering is becoming a stronger match.",
  "Based on your profile, Full Stack Development offers the best growth-to-income ratio for your skill set.",
  "You're in the top 15% for analytical thinking. Consider exploring Data Science roles.",
  "Your communication skills are a hidden strength — Product Management could be a great fit.",
  "The AI/ML job market grew 34% this quarter. Your technical scores make you a strong candidate.",
];

/* ── Dashboard ────────────────────────────────────────── */
const DashboardPage = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (refreshUser) {
      refreshUser();
    }
    assessmentService.getAll()
      .then(({ data }) => setAssessments(data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [refreshUser]);

  const latest = assessments[0];
  const archetype = getArchetype(latest?.scores);
  const topMatch = latest?.result?.[0]?.match || 0;
  const futureProofScore = latest ? Math.round(topMatch * 0.85 + (latest.scores?.technical || 0) * 2) : 0;
  const aiInsight = AI_INSIGHTS[Math.floor(Math.random() * AI_INSIGHTS.length)];

  const traitData = latest?.scores ? [
    { trait: 'Technical', value: latest.scores.technical || 0, fullMark: 15 },
    { trait: 'Creative', value: latest.scores.creative || 0, fullMark: 15 },
    { trait: 'Analytical', value: latest.scores.analytical || 0, fullMark: 15 },
    { trait: 'Leadership', value: latest.scores.leadership || 0, fullMark: 15 },
    { trait: 'Communication', value: latest.scores.communication || 0, fullMark: 15 },
  ] : [];

  const quickActions = [
    { label: 'Career DNA', desc: 'Discover your career identity', icon: Dna, to: '/career-dna', color: '#0ea5e9' },
    { label: 'AI Roadmaps', desc: 'Generate learning paths', icon: Map, to: '/roadmaps', color: '#a855f7' },
    { label: 'AI Mentor', desc: 'Get personalized advice', icon: MessageSquare, to: '/mentor', color: '#10b981' },
    { label: 'Mock Interview', desc: 'Practice with AI feedback', icon: Mic, to: '/mock-interview/setup', color: '#f59e0b' },
    { label: 'Skill Gap', desc: 'Analyze your resume', icon: FileSearch, to: '/skill-gap', color: '#06b6d4' },
    { label: 'Simulator', desc: 'A day in the life', icon: Play, to: '/career-simulator', color: '#ec4899' },
  ];

  return (
    <div className="app-shell">
      <Sidebar collapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(c => !c)} />
      <main className={`app-main ${sidebarCollapsed ? 'sidebar-is-collapsed' : ''}`}>

        {/* ── Hero Section ────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{ marginBottom: '2rem' }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 className="page-title" style={{ fontWeight: 800, fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.75rem' }}>
                {getGreeting()}, <span className="gradient-text">{user?.name?.split(' ')[0] || 'Explorer'}</span> 👋
              </h1>
              <p style={{ color: 'var(--color-text-muted)', marginTop: '0.35rem', fontSize: '0.9rem' }}>
                Your career intelligence overview
              </p>
            </div>
            {(user?.streak || 0) > 0 && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.5rem 1rem', borderRadius: 99,
                background: 'var(--color-warning-glow)',
                border: '1px solid rgba(245,158,11,0.25)',
              }}>
                <Flame size={16} color="#f59e0b" />
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fbbf24' }}>{user.streak} day streak</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* ── AI Insight Banner ────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          style={{
            display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
            padding: '1rem 1.25rem', borderRadius: 14,
            background: 'var(--gradient-primary-soft)',
            border: '1px solid rgba(14,165,233,0.12)',
            marginBottom: '1.75rem',
          }}
        >
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'var(--gradient-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 0 15px rgba(14,165,233,0.3)',
          }}>
            <Sparkles size={18} color="white" />
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-primary-light)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.3rem' }}>
              AI Career Intelligence
            </div>
            <p style={{ fontSize: '0.88rem', color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: 0 }}>
              {latest ? aiInsight : "Take your first Career DNA assessment to unlock personalized AI insights about your career path."}
            </p>
          </div>
        </motion.div>

        {loading ? (
          <div className="grid-3" style={{ marginBottom: '2rem' }}>
            {[1,2,3].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : (
          <>
            {/* ── Top Cards Row ───────────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: latest ? '1fr 1fr 1fr' : '1fr', gap: '1.25rem', marginBottom: '2rem' }}>

              {/* Career DNA Profile */}
              {latest ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                  className="glass-card"
                  style={{ padding: '1.5rem', cursor: 'pointer' }}
                  onClick={() => navigate('/results')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                    <Dna size={16} color="var(--color-primary-light)" />
                    <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Career DNA</span>
                  </div>
                  <RadarChart data={traitData} size={180} />
                  <div style={{ textAlign: 'center', marginTop: '0.75rem' }}>
                    <span style={{ fontSize: '1.4rem' }}>{archetype.emoji}</span>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: archetype.color, marginTop: '0.25rem', fontFamily: "'Space Grotesk', sans-serif" }}>
                      {archetype.label}
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                  className="glass-card"
                  style={{ padding: '3rem 2rem', textAlign: 'center', gridColumn: '1 / -1' }}
                >
                  <Dna size={48} color="var(--color-text-muted)" style={{ margin: '0 auto 1rem', display: 'block', opacity: 0.5 }} />
                  <h3 style={{ fontWeight: 700, marginBottom: '0.5rem', fontFamily: "'Space Grotesk', sans-serif" }}>Discover Your Career DNA</h3>
                  <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>Take an 8-question assessment to unlock your personalized career identity</p>
                  <button className="btn-primary" onClick={() => navigate('/career-dna')} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Brain size={18} /> Start Career DNA Assessment <ArrowRight size={16} />
                  </button>
                </motion.div>
              )}

              {/* Top Career Match */}
              {latest && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                  className="glass-card"
                  style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', alignSelf: 'flex-start' }}>
                    <Trophy size={16} color="#f59e0b" />
                    <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Top Match</span>
                  </div>
                  <ProgressRing value={topMatch} size={130} />
                  <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                    <div style={{ fontWeight: 700, fontSize: '1.1rem', fontFamily: "'Space Grotesk', sans-serif" }}>
                      {latest.topCareer}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'center', marginTop: '0.35rem' }}>
                      <span className={`neon-dot neon-dot-${latest.result?.[0]?.demand === 'High' ? 'green' : 'blue'}`} />
                      <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>{latest.result?.[0]?.demand} Demand</span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                      {latest.result?.[0]?.salary}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Future-Proof Score */}
              {latest && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                  className="glass-card"
                  style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', alignSelf: 'flex-start' }}>
                    <Shield size={16} color="#10b981" />
                    <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Future-Proof</span>
                  </div>
                  <ScoreGauge
                    value={Math.min(futureProofScore, 95)}
                    size={180}
                    label="Future-Proof Score"
                    sublabel="AI stability prediction"
                  />
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                    <span className="tag-green" style={{ padding: '0.2rem 0.6rem', borderRadius: 99, background: 'var(--color-success-glow)', border: '1px solid rgba(16,185,129,0.25)', fontSize: '0.68rem', fontWeight: 600, color: '#6ee7b7' }}>Low AI Risk</span>
                    <span className="tag" style={{ fontSize: '0.68rem' }}>Growing Industry</span>
                  </div>
                </motion.div>
              )}
            </div>

            {/* ── Stats Row ───────────────────────────────────── */}
            <div className="grid-auto stats-grid-4" style={{ marginBottom: '2rem' }}>
              <StatCard icon={Brain} label="Assessments" value={assessments.length} sub="Career quizzes taken" color="#0ea5e9" delay={0.25} glow />
              <StatCard icon={Star} label="Career Score" value={topMatch ? `${topMatch}%` : '—'} sub="Best career fit" color="#a855f7" delay={0.3} />
              <StatCard icon={Zap} label="XP Points" value={user?.xp || 0} sub={`Level ${Math.floor((user?.xp || 0) / 200) + 1}`} color="#10b981" delay={0.35} />
              <StatCard icon={Clock} label="Member Since" value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—'} sub={user?.role === 'admin' ? 'Admin' : 'Explorer'} color="#f59e0b" delay={0.4} />
            </div>

            {/* ── Skill Growth (if assessment exists) ─────────── */}
            {latest?.scores && (
              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
                className="glass-card"
                style={{ padding: '1.5rem', marginBottom: '2rem' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                  <Zap size={16} color="var(--color-primary-light)" />
                  <span style={{ fontWeight: 700, fontSize: '0.95rem', fontFamily: "'Space Grotesk', sans-serif" }}>Skill Growth Progress</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  {Object.entries(latest.scores).map(([trait, val], i) => {
                    const maxVal = 15;
                    const pct = Math.round((val / maxVal) * 100);
                    const colors = ['#0ea5e9', '#a855f7', '#10b981', '#f59e0b', '#ec4899'];
                    return (
                      <div key={trait}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                          <span style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--color-text-dim)', textTransform: 'capitalize' }}>{trait}</span>
                          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: colors[i] }}>{val}/{maxVal}</span>
                        </div>
                        <div className="progress-bar">
                          <motion.div
                            className="progress-bar-fill"
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 1, delay: 0.5 + i * 0.1 }}
                            style={{ background: colors[i] }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </>
        )}

        {/* ── Quick Actions ───────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--color-text-dim)', fontFamily: "'Space Grotesk', sans-serif" }}>
            Quick Actions
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.875rem', marginBottom: '2rem' }}>
            {quickActions.map((a, i) => (
              <motion.button
                key={i}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55 + i * 0.06 }}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(a.to)}
                className="glass-card"
                style={{
                  padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.875rem',
                  cursor: 'pointer', background: 'none', textAlign: 'left', width: '100%',
                }}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: `${a.color}12`, border: `1px solid ${a.color}25`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <a.icon size={18} color={a.color} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--color-text)' }}>{a.label}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: '0.15rem' }}>{a.desc}</div>
                </div>
                <ArrowRight size={14} color="var(--color-text-muted)" />
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* ── Recent Assessments ──────────────────────────── */}
        {assessments.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-dim)', fontFamily: "'Space Grotesk', sans-serif" }}>Recent Assessments</h2>
              <button onClick={() => navigate('/results')} style={{ background: 'none', border: 'none', color: 'var(--color-primary-light)', fontSize: '0.82rem', cursor: 'pointer', fontWeight: 500 }}>
                View all →
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {assessments.slice(0, 3).map((a, i) => (
                <motion.div
                  key={a._id}
                  initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.65 + i * 0.08 }}
                  className="glass-card"
                  style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer' }}
                  onClick={() => navigate(`/results?id=${a._id}`)}
                >
                  <div style={{
                    width: 38, height: 38, borderRadius: 10,
                    background: 'var(--color-primary-glow)',
                    border: '1px solid rgba(14,165,233,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <Trophy size={16} color="var(--color-primary-light)" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{a.topCareer}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>{new Date(a.createdAt).toLocaleDateString()}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, fontSize: '1.05rem' }} className="gradient-text">{a.result?.[0]?.match || 0}%</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)' }}>match</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default DashboardPage;
