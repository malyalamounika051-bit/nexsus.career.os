import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { assessmentService } from '../services/assessmentService';
import api from '../services/api';
import Sidebar from '../components/Sidebar';
import ProgressRing from '../components/ProgressRing';
import { SkeletonCard } from '../components/SkeletonLoader';
import {
  Dna, Trophy, Zap, ArrowRight,
  Brain, Map, MessageSquare, FileSearch, Play,
  Flame, CheckCircle2, Sparkles, Clock, Mic, Briefcase, TrendingUp, Sparkle, Quote, ChevronRight, AlertCircle, BookmarkPlus, ExternalLink, Activity
} from 'lucide-react';

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

const DashboardPage = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const [suggestionData, setSuggestionData] = useState(null);
  const [sugLoading, setSugLoading] = useState(true);

  // Quote & Career Pulse states
  const [quote, setQuote] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(true);
  const [news, setNews] = useState([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  
  // Sara Insight of the Day
  const [insight, setInsight] = useState(null);
  const [insightLoading, setInsightLoading] = useState(true);

  // Core sections preview states
  const [trendingSkills, setTrendingSkills] = useState([]);
  const [trendingLoading, setTrendingLoading] = useState(true);
  const [opportunities, setOpportunities] = useState([]);
  const [oppLoading, setOppLoading] = useState(true);
  const [gpsData, setGpsData] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(true);
  const [jobs, setJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(true);

  const categories = ['All', 'Big Tech', 'AI', 'Hiring', 'Startups', 'Skills', 'Students'];

  useEffect(() => {
    if (refreshUser) {
      refreshUser();
    }

    // 1. Fetch Assessments
    assessmentService.getAll()
      .then(({ data }) => setAssessments(data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));

    // 2. Fetch AI Journey Progress
    api.get('/mentor/suggestions')
      .then(({ data }) => {
        if (data.success) setSuggestionData(data.data);
      })
      .catch((err) => console.error('Error suggestions:', err))
      .finally(() => setSugLoading(false));

    // 3. Fetch Quote
    api.get('/dashboard/quote')
      .then(({ data }) => {
        if (data.success) setQuote(data.data);
      })
      .catch((err) => console.error('Error quote:', err))
      .finally(() => setQuoteLoading(false));

    // 4. Fetch Career Pulse News
    api.get('/dashboard/news')
      .then(({ data }) => {
        if (data.success) setNews(data.data);
      })
      .catch((err) => console.error('Error news:', err))
      .finally(() => setNewsLoading(false));

    // 5. Fetch Sara Insight of the Day
    api.get('/dashboard/insight')
      .then(({ data }) => {
        if (data.success) setInsight(data.data);
      })
      .catch((err) => console.error('Error insight:', err))
      .finally(() => setInsightLoading(false));

    // 6. Fetch Trending Tech Skills
    api.get('/skill-intelligence/trending')
      .then(({ data }) => {
        if (data.success) setTrendingSkills(data.data?.skills || data.data || []);
      })
      .catch((err) => console.error('Error trending skills:', err))
      .finally(() => setTrendingLoading(false));

    // 7. Fetch Opportunities
    api.get('/opportunities')
      .then(({ data }) => {
        if (data.success) setOpportunities(data.data?.slice(0, 3) || []);
      })
      .catch((err) => console.error('Error opportunities:', err))
      .finally(() => setOppLoading(false));

    // 8. Fetch Career GPS Snapshot
    api.get('/gps')
      .then(({ data }) => {
        if (data.success) setGpsData(data.data || data.gps);
      })
      .catch((err) => console.error('Error GPS:', err))
      .finally(() => setGpsLoading(false));

    // 9. Fetch Job Aggregator Recommendations
    api.post('/jobs/search', { role: '', location: '', isRemote: false, isInternship: false })
      .then(({ data }) => {
        if (data.success) setJobs(data.data?.slice(0, 3) || []);
      })
      .catch((err) => console.error('Error jobs:', err))
      .finally(() => setJobsLoading(false));

  }, [refreshUser]);

  const latest = assessments[0];
  const topMatchTitle = latest?.result?.[0]?.career?.title || (suggestionData?.suggestion?.actionRoute?.includes('roadmaps') ? 'Software Engineering' : 'Set Your Goal');

  const filteredNews = activeCategory === 'All' 
    ? news 
    : news.filter(item => item.category.toLowerCase() === activeCategory.toLowerCase());

  return (
    <div className="app-shell">
      <Sidebar collapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(c => !c)} />
      <main className={`app-main ${sidebarCollapsed ? 'sidebar-is-collapsed' : ''}`}>

        {/* ── SECTION 1: Daily Motivation Banner ────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card motivation-banner"
          style={{ padding: '1.5rem', borderRadius: 16, marginBottom: '2rem' }}
        >
          {quoteLoading ? (
            <div className="shimmer" style={{ height: 60, borderRadius: 8 }} />
          ) : (
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div style={{
                background: 'var(--color-primary-glow)',
                padding: '0.75rem',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-primary-light)'
              }}>
                <Quote size={20} />
              </div>
              <div>
                <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--color-primary-light)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '2px' }}>Daily Inspiration ✨</span>
                <p style={{
                  fontSize: '1rem',
                  fontStyle: 'italic',
                  fontWeight: 500,
                  color: 'var(--color-text)',
                  lineHeight: 1.4,
                  margin: 0
                }}>
                  "{quote?.text}"
                </p>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.25rem', display: 'block' }}>
                  — {quote?.author || 'Nexus Inspiration'}
                </span>
              </div>
            </div>
          )}
        </motion.div>

        {/* Welcome Greeting */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
          <h1 className="page-title" style={{ fontWeight: 800, fontFamily: "var(--font-display)", fontSize: '1.6rem', margin: 0 }}>
            {getGreeting()}, <span className="gradient-text">{user?.name?.split(' ')[0] || 'Explorer'}</span> 👋
          </h1>
          {(user?.streak || 0) > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.4rem 0.85rem', borderRadius: 99,
              background: 'var(--color-warning-glow)',
              border: '1px solid rgba(245,158,11,0.25)',
            }}>
              <Flame size={14} color="var(--color-warning)" />
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#fbbf24' }}>{user.streak} day streak</span>
            </div>
          )}
        </div>

        {/* ── SECTION 2: Career Pulse Hub (Curated and Categorized News) ────────────────── */}
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Activity size={20} style={{ color: 'var(--color-primary-light)' }} />
              <h2 className="section-title" style={{ margin: 0, fontSize: '1.35rem', fontFamily: "var(--font-display)", fontWeight: 700 }}>Career Pulse Hub</h2>
              <span style={{ background: 'var(--color-primary-glow)', color: 'var(--color-primary-light)', border: '1px solid rgba(124,58,237,0.2)', fontSize: '0.65rem', padding: '0.2rem 0.5rem', borderRadius: 4, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Live Intelligence</span>
            </div>

            {/* Smart Filtering Tabs */}
            <div className="cat-tabs" style={{ margin: 0 }}>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`cat-tab ${activeCategory === cat ? 'active' : ''}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Career Pulse rolling feed */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {newsLoading ? (
              [1, 2, 3].map(i => (
                <div key={i} className="glass-card shimmer" style={{ height: 220, borderRadius: 16 }} />
              ))
            ) : filteredNews.length > 0 ? (
              <AnimatePresence mode="popLayout">
                {filteredNews.map((item) => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    key={item._id || item.headline}
                    className="glass-card dashboard-card"
                    style={{ padding: '1.5rem', borderRadius: 16, display: 'flex', flexDirection: 'column', border: '1px solid var(--color-border)', justifyContent: 'space-between', minHeight: '260px' }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                        <span className="tag tag-purple" style={{ textTransform: 'uppercase', fontSize: '0.65rem', fontWeight: 700 }}>{item.category}</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                          {item.timestamp ? new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently'}
                        </span>
                      </div>
                      <h4 style={{ margin: '0 0 0.6rem 0', fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-text)', fontFamily: 'var(--font-display)', lineHeight: 1.3 }}>
                        {item.headline}
                      </h4>
                      <p style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', margin: '0 0 1rem 0', lineHeight: 1.5 }}>
                        {item.summary}
                      </p>

                      {/* Why it Matters Block */}
                      <div style={{ background: 'var(--color-primary-glow)', borderLeft: '3px solid var(--color-primary-light)', padding: '0.75rem', borderRadius: '4px 8px 8px 4px', marginBottom: '1.25rem' }}>
                        <span style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--color-primary-light)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '2px' }}>Why It Matters</span>
                        <span style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>{item.whyItMatters}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--color-border-subtle)', paddingTop: '0.85rem', marginTop: 'auto' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--color-primary-light)', fontWeight: 600 }}>{item.source}</span>
                      <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--color-accent-light)', textDecoration: 'none', fontWeight: 600 }}>
                        Read More <ArrowRight size={14} />
                      </a>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            ) : (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', background: 'var(--color-surface-glass-2)', border: '1px solid var(--color-border)', borderRadius: 16 }}>
                <AlertCircle size={32} className="text-slate-500" style={{ margin: '0 auto 12px auto' }} />
                <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>No recent stories available for this category.</p>
              </div>
            )}
          </div>
        </div>

        {/* ── SECTION 3: Sara Insight of the Day (Prominent AI Card) ────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="sara-card-enhanced"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1.5rem',
            padding: '1.5rem',
            borderRadius: 16,
            marginBottom: '2.5rem',
            flexWrap: 'wrap',
            border: '1px solid rgba(139,92,246,0.2)'
          }}
        >
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', flex: 1, minWidth: 280 }}>
            <div style={{
              width: 46,
              height: 46,
              borderRadius: 12,
              background: 'var(--gradient-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: 'var(--shadow-glow-purple)',
            }}>
              <Sparkles size={22} color="white" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--color-primary-light)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.2rem' }}>
                Sara Says: Insight of the Day
              </div>
              {insightLoading ? (
                <div className="shimmer" style={{ height: 40, width: '80%', borderRadius: 4 }} />
              ) : (
                <p style={{ fontSize: '0.95rem', color: 'var(--color-text)', fontWeight: 500, margin: 0, lineHeight: 1.5 }}>
                  {insight?.content}
                </p>
              )}
            </div>
          </div>
          <button
            className="btn-primary"
            onClick={() => navigate('/mentor')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.65rem 1.35rem',
              fontSize: '0.85rem',
              fontWeight: 600,
              background: 'var(--color-primary)',
              border: 'none',
              boxShadow: 'var(--shadow-glow-purple)'
            }}
          >
            Chat with Sara <ChevronRight size={16} />
          </button>
        </motion.div>

        {/* ── SECTION 4 & 5: Trending Tech Skills & Opportunity Radar ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '2rem',
          marginBottom: '2.5rem'
        }}>
          {/* Trending Tech Skills */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <Sparkle size={18} style={{ color: 'var(--color-xp)' }} />
              <h2 className="section-title" style={{ margin: 0, fontSize: '1.2rem', fontFamily: "var(--font-display)" }}>Trending Tech Skills</h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {trendingLoading ? (
                [1, 2, 3].map(i => (
                  <div key={i} className="glass-card shimmer" style={{ height: 65, borderRadius: 10 }} />
                ))
              ) : (
                trendingSkills.slice(0, 3).map((skill, idx) => (
                  <div key={idx} className="glass-card skill-chip-card" onClick={() => navigate('/skill-trends')} style={{ padding: '0.85rem 1rem', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-text)' }}>{skill.name}</h4>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
                        <span style={{ fontSize: '0.68rem', color: 'var(--color-success)' }}>+{skill.growth}% demand</span>
                        <span style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)' }}>Demand Score: {skill.demandScore}/100</span>
                      </div>
                    </div>
                    <span className="tag tag-cyan" style={{ fontSize: '0.65rem', fontWeight: 700 }}>
                      {skill.futureRelevance || 'High'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Opportunity Radar Preview */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Trophy size={18} style={{ color: 'var(--color-xp)' }} />
                <h2 className="section-title" style={{ margin: 0, fontSize: '1.2rem', fontFamily: "var(--font-display)" }}>Opportunity Radar</h2>
              </div>
              <a href="/opportunities" onClick={(e) => { e.preventDefault(); navigate('/opportunities'); }} style={{ fontSize: '0.75rem', color: 'var(--color-primary-light)', textDecoration: 'none', fontWeight: 600 }}>
                View All →
              </a>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {oppLoading ? (
                [1, 2].map(i => (
                  <div key={i} className="glass-card shimmer" style={{ height: 80, borderRadius: 10 }} />
                ))
              ) : (
                opportunities.map((opp, idx) => (
                  <div key={idx} className="glass-card dashboard-card" style={{ padding: '1rem', borderRadius: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span className="tag tag-cyan" style={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase' }}>
                        {opp.type}
                      </span>
                      <span style={{ fontSize: '0.68rem', color: 'var(--color-text-dim)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                        <Clock size={12} /> {opp.daysLeft} days left
                      </span>
                    </div>
                    <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text)' }}>{opp.title}</h4>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
                      <span style={{ color: 'var(--color-text-muted)' }}>{opp.organization}</span>
                      <button onClick={() => navigate('/opportunities')} style={{ background: 'none', border: 'none', color: 'var(--color-primary-light)', fontWeight: 600, cursor: 'pointer', padding: 0 }}>Apply Now</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* ── SECTION 6 & 7: Career GPS Snapshot & Job Aggregator Preview ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '2rem',
          marginBottom: '3rem'
        }}>
          {/* Career GPS Snapshot */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <Brain size={18} style={{ color: 'var(--color-primary)' }} />
              <h2 className="section-title" style={{ margin: 0, fontSize: '1.2rem', fontFamily: "var(--font-display)" }}>Career GPS Snapshot</h2>
            </div>

            <div className="glass-card" style={{ padding: '1.25rem', borderRadius: 12, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '220px', border: '1px solid var(--color-border)' }}>
              {gpsLoading ? (
                <div className="shimmer" style={{ height: 120, borderRadius: 8 }} />
              ) : gpsData ? (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--color-text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Current Checkpoint</span>
                      <h4 style={{ margin: '0.1rem 0 0 0', fontSize: '1rem', fontWeight: 700, color: 'var(--color-text)' }}>{gpsData.checkpointName || gpsData.currentCheckpoint?.title || 'Initial Setup'}</h4>
                    </div>
                    <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: 4, background: 'var(--color-primary-glow)', color: 'var(--color-primary-light)', fontWeight: 700 }}>
                      {gpsData.progressPercent || gpsData.overallProgress || 0}% Done
                    </span>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 8, height: 6, marginBottom: '1.25rem', overflow: 'hidden' }}>
                    <div style={{ background: 'var(--gradient-primary)', height: '100%', width: `${gpsData.progressPercent || gpsData.overallProgress || 0}%`, transition: 'width 0.5s' }} />
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '1.5rem', background: 'var(--color-surface-2)', padding: '0.65rem', borderRadius: 8, border: '1px solid var(--color-border)' }}>
                    <CheckCircle2 size={16} style={{ color: 'var(--color-success)', flexShrink: 0 }} />
                    <span style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
                      Next Skill: <strong style={{ color: 'var(--color-text)' }}>{gpsData.nextSkill || 'Assessment Review'}</strong>
                    </span>
                  </div>

                  <button className="btn-primary" onClick={() => navigate('/gps')} style={{ width: '100%', fontSize: '0.82rem', padding: '0.6rem' }}>
                    Open Career GPS
                  </button>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '1.5rem 1rem' }}>
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '1.25rem' }}>You haven't initialized your Career GPS path yet.</p>
                  <button className="btn-primary" onClick={() => navigate('/roadmaps')} style={{ fontSize: '0.82rem', padding: '0.6rem 1.2rem' }}>
                    Generate Career Path
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Job Aggregator Preview */}
          <div>
            <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Briefcase size={18} style={{ color: 'var(--color-accent)' }} />
                <h2 className="section-title" style={{ margin: 0, fontSize: '1.2rem', fontFamily: "var(--font-display)" }}>Job Openings</h2>
              </div>
              <a href="/jobs" onClick={(e) => { e.preventDefault(); navigate('/jobs'); }} style={{ fontSize: '0.75rem', color: 'var(--color-primary-light)', textDecoration: 'none', fontWeight: 600 }}>
                Explore Jobs →
              </a>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {jobsLoading ? (
                [1, 2, 3].map(i => (
                  <div key={i} className="glass-card shimmer" style={{ height: 60, borderRadius: 10 }} />
                ))
              ) : jobs.length > 0 ? (
                jobs.map((job, idx) => (
                  <div key={idx} className="glass-card company-card" style={{ padding: '0.85rem 1rem', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid var(--color-border)' }}>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                      <div style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        background: 'var(--color-surface-3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        color: 'var(--color-text-secondary)',
                        border: '1px solid var(--color-border)'
                      }}>
                        {job.company?.slice(0, 2) || 'JB'}
                      </div>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-text)' }}>{job.title}</h4>
                        <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>{job.company} • {job.location || 'Remote'}</span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span className="tag tag-cyan" style={{ fontSize: '0.62rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                        {job.matchScore || 85}% Match
                      </span>
                      <a href="/jobs" onClick={(e) => { e.preventDefault(); navigate(`/jobs?search=${encodeURIComponent(job.title)}`); }} style={{ fontSize: '0.72rem', color: 'var(--color-primary-light)', textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                        View <ChevronRight size={12} />
                      </a>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '1.5rem', background: 'var(--color-surface-glass-2)', border: '1px solid var(--color-border)', borderRadius: 10 }}>
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', margin: 0 }}>No matching jobs found.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── COLLAPSIBLE QUICK ACTIONS & TOOLS (Bottom) ────────────────── */}
        <div style={{ marginTop: '3rem', borderTop: '1px solid var(--color-border)', paddingTop: '2rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text)', fontFamily: "var(--font-display)", marginBottom: '1.25rem' }}>Career OS Intelligence Suite</h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1rem'
          }}>
            {[
              { label: 'Career DNA', desc: 'Discover your career identity', icon: Dna, to: '/career-dna', color: 'var(--color-primary)' },
              { label: 'AI Roadmaps', desc: 'Generate learning paths', icon: Map, to: '/roadmaps', color: 'var(--color-accent)' },
              { label: 'AI Mentor', desc: 'Get personalized advice', icon: MessageSquare, to: '/mentor', color: 'var(--color-success)' },
              { label: 'Mock Interview', desc: 'Practice with AI feedback', icon: Mic, to: '/mock-interview/setup', color: 'var(--color-warning)' },
              { label: 'Skill Gap', desc: 'Analyze your resume', icon: FileSearch, to: '/skill-gap', color: 'var(--color-secondary)' },
              { label: 'Simulator', desc: 'A day in the life', icon: Play, to: '/career-simulator', color: 'var(--color-danger)' },
            ].map((action, idx) => {
              const Icon = action.icon;
              return (
                <div
                  key={idx}
                  onClick={() => navigate(action.to)}
                  className="glass-card dashboard-card"
                  style={{
                    padding: '1.25rem',
                    borderRadius: 12,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    background: 'var(--color-surface-2)',
                    border: '1px solid var(--color-border)'
                  }}
                >
                  <div style={{
                    width: 44,
                    height: 44,
                    borderRadius: 10,
                    background: 'var(--color-surface)',
                    border: `1px solid ${action.color}33`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: action.color,
                    flexShrink: 0
                  }}>
                    <Icon size={20} />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 700, color: 'var(--color-text)', fontFamily: 'var(--font-display)' }}>{action.label}</h4>
                    <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>{action.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </main>
    </div>
  );
};

export default DashboardPage;
