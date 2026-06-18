import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { assessmentService } from '../services/assessmentService';
import api from '../services/api';
import Sidebar from '../components/Sidebar';
import ProgressRing from '../components/ProgressRing';
import { SkeletonCard } from '../components/SkeletonLoader';
import {
  Dna, Trophy, Zap, ArrowRight,
  Brain, Map, MessageSquare, FileSearch, Play,
  Flame, CheckCircle2, Sparkles, Clock, Mic, Briefcase, TrendingUp, Sparkle, Quote, ChevronRight
} from 'lucide-react';

/* ── Greeting ─────────────────────────────────────────── */
const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

/* ── Dashboard ────────────────────────────────────────── */
const DashboardPage = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const [suggestionData, setSuggestionData] = useState(null);
  const [sugLoading, setSugLoading] = useState(true);

  // New features state
  const [quote, setQuote] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(true);
  const [news, setNews] = useState([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [hiring, setHiring] = useState([]);
  const [hiringLoading, setHiringLoading] = useState(true);
  const [trendingSkills, setTrendingSkills] = useState([]);
  const [trendingLoading, setTrendingLoading] = useState(true);
  const [opportunities, setOpportunities] = useState([]);
  const [oppLoading, setOppLoading] = useState(true);
  const [gpsData, setGpsData] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(true);

  useEffect(() => {
    if (refreshUser) {
      refreshUser();
    }

    // 1. Fetch Assessments
    assessmentService.getAll()
      .then(({ data }) => setAssessments(data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));

    // 2. Fetch AI Suggestions / Journey progress
    api.get('/mentor/suggestions')
      .then(({ data }) => {
        if (data.success) {
          setSuggestionData(data.data);
        }
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

    // 4. Fetch News
    api.get('/dashboard/news')
      .then(({ data }) => {
        if (data.success) setNews(data.data);
      })
      .catch((err) => console.error('Error news:', err))
      .finally(() => setNewsLoading(false));

    // 5. Fetch Hiring Pulse
    api.get('/dashboard/hiring')
      .then(({ data }) => {
        if (data.success) setHiring(data.data);
      })
      .catch((err) => console.error('Error hiring:', err))
      .finally(() => setHiringLoading(false));

    // 6. Fetch Trending Skills
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

    // 8. Fetch Career GPS
    api.get('/gps')
      .then(({ data }) => {
        if (data.success) setGpsData(data.data || data.gps);
      })
      .catch((err) => console.error('Error GPS:', err))
      .finally(() => setGpsLoading(false));

  }, [refreshUser]);

  const latest = assessments[0];
  const topMatchTitle = latest?.result?.[0]?.career?.title || (suggestionData?.suggestion?.actionRoute?.includes('roadmaps') ? 'Software Engineering' : 'Set Your Goal');

  const quickActions = [
    { label: 'Career DNA', desc: 'Discover your career identity', icon: Dna, to: '/career-dna', color: 'var(--color-primary)' },
    { label: 'AI Roadmaps', desc: 'Generate learning paths', icon: Map, to: '/roadmaps', color: 'var(--color-accent)' },
    { label: 'AI Mentor', desc: 'Get personalized advice', icon: MessageSquare, to: '/mentor', color: 'var(--color-success)' },
    { label: 'Mock Interview', desc: 'Practice with AI feedback', icon: Mic, to: '/mock-interview/setup', color: 'var(--color-warning)' },
    { label: 'Skill Gap', desc: 'Analyze your resume', icon: FileSearch, to: '/skill-gap', color: 'var(--color-secondary)' },
    { label: 'Simulator', desc: 'A day in the life', icon: Play, to: '/career-simulator', color: 'var(--color-danger)' },
  ];

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
                  — {quote?.author || 'Unknown'}
                </span>
              </div>
            </div>
          )}
        </motion.div>

        {/* ── SECTION 2: Welcome Back Dashboard (KPI Row) ────────────────── */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <h1 className="page-title" style={{ fontWeight: 800, fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.6rem', margin: 0 }}>
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

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1rem'
          }}>
            {/* KPI 1: Current Goal */}
            <div className="glass-card kpi-card" style={{ padding: '1.25rem', borderRadius: 12 }}>
              <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--color-text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Current Target Goal</span>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0.5rem 0 0.25rem 0', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Briefcase size={18} className="text-primary" /> {topMatchTitle}
              </h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Based on profile fit</span>
            </div>

            {/* KPI 2: Career Progress */}
            <div className="glass-card kpi-card" style={{ padding: '1.25rem', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--color-text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Journey Progress</span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0.5rem 0 0 0', color: 'var(--color-text)' }}>
                  {sugLoading ? '...' : `${suggestionData?.lifecyclePercent || 0}%`}
                </h3>
              </div>
              <div style={{ width: 44, height: 44 }}>
                <ProgressRing percent={suggestionData?.lifecyclePercent || 0} strokeWidth={4} size={44} />
              </div>
            </div>

            {/* KPI 3: Experience (XP) */}
            <div className="glass-card kpi-card" style={{ padding: '1.25rem', borderRadius: 12 }}>
              <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--color-text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Experience</span>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0.5rem 0 0.25rem 0', color: 'var(--color-xp)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Zap size={18} fill="var(--color-xp)" color="var(--color-xp)" /> {user?.xp || 0} XP
              </h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Level {Math.floor((user?.xp || 0) / 100) + 1} Pioneer</span>
            </div>

            {/* KPI 4: Streak & Assessment */}
            <div className="glass-card kpi-card" style={{ padding: '1.25rem', borderRadius: 12 }}>
              <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--color-text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Last Assessment</span>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0.5rem 0 0.25rem 0', color: 'var(--color-text)' }}>
                {latest ? new Date(latest.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'None taken'}
              </h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                {latest ? `${latest.result?.length || 0} matches generated` : 'Start assessment below'}
              </span>
            </div>
          </div>
        </div>

        {/* ── SECTION 3: AI Market Pulse (News Feed Carousel) ────────────────── */}
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <TrendingUp size={20} style={{ color: 'var(--color-accent)' }} />
            <h2 className="section-title" style={{ margin: 0, fontSize: '1.2rem', fontFamily: "'Space Grotesk', sans-serif" }}>AI Market Pulse</h2>
            <span style={{ background: 'var(--color-accent-glow)', color: 'var(--color-accent-light)', fontSize: '0.65rem', padding: '0.2rem 0.5rem', borderRadius: 4, fontWeight: 700, textTransform: 'uppercase' }}>Live</span>
          </div>

          <div className="news-carousel">
            {newsLoading ? (
              [1, 2, 3].map(i => (
                <div key={i} className="glass-card news-card shimmer" style={{ flex: '0 0 350px', height: 180, borderRadius: 12 }} />
              ))
            ) : (
              news.map((item, idx) => (
                <div key={idx} className="glass-card news-card dashboard-card" style={{ padding: '1.25rem', borderRadius: 12 }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <span style={{ fontSize: '0.65rem', padding: '0.15rem 0.5rem', borderRadius: 4, background: 'rgba(255,255,255,0.06)', color: 'var(--color-text-dim)', fontWeight: 600 }}>{item.category}</span>
                      <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>{item.timestamp}</span>
                    </div>
                    <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-text)', lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.title}</h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.summary}</p>
                  </div>
                  <div style={{ marginTop: '1rem', borderTop: '1px solid var(--color-border-subtle)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--color-accent-light)', fontWeight: 600 }}>{item.source}</span>
                    <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.2rem', color: 'var(--color-text-dim)', textDecoration: 'none' }}>
                      Read Story <ArrowRight size={12} />
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── SECTION 8: Sara AI Recommendation (Prominent placement) ────────────────── */}
        {!sugLoading && suggestionData?.suggestion && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="sara-card-enhanced"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1.25rem',
              padding: '1.25rem 1.5rem',
              borderRadius: 16,
              marginBottom: '2.5rem',
              flexWrap: 'wrap'
            }}
          >
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', flex: 1, minWidth: 280 }}>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: 'var(--gradient-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: 'var(--shadow-glow-purple)',
              }}>
                <Sparkles size={20} color="white" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--color-primary-light)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.2rem' }}>
                  AI Copilot Suggestion
                </div>
                <h4 style={{ margin: 0, fontWeight: 700, fontSize: '1.05rem', color: 'var(--color-text)', fontFamily: "'Space Grotesk', sans-serif" }}>
                  {suggestionData.suggestion.title}
                </h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem', marginBottom: 0, lineHeight: 1.5 }}>
                  {suggestionData.suggestion.description}
                </p>
              </div>
            </div>
            <button
              className="btn-primary"
              onClick={() => navigate(suggestionData.suggestion.actionRoute)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.6rem 1.25rem',
                fontSize: '0.85rem',
                fontWeight: 600,
                background: 'var(--color-primary)',
                border: 'none',
                boxShadow: 'var(--shadow-glow-purple)'
              }}
            >
              {suggestionData.suggestion.actionLabel} <ArrowRight size={16} />
            </button>
          </motion.div>
        )}

        {/* ── SECTION 4 & 5: Hiring Grid & Trending Skills ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '2rem',
          marginBottom: '2.5rem'
        }}>
          {/* Hiring Pulse */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <Briefcase size={18} style={{ color: 'var(--color-secondary)' }} />
              <h2 className="section-title" style={{ margin: 0, fontSize: '1.2rem', fontFamily: "'Space Grotesk', sans-serif" }}>Hiring Pulse</h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {hiringLoading ? (
                [1, 2, 3].map(i => (
                  <div key={i} className="glass-card shimmer" style={{ height: 70, borderRadius: 10 }} />
                ))
              ) : (
                hiring.slice(0, 4).map((comp, idx) => (
                  <div key={idx} className="glass-card company-card" style={{ padding: '0.85rem 1rem', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                      <div style={{
                        width: 38,
                        height: 38,
                        borderRadius: 8,
                        background: comp.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '1rem',
                        color: '#fff'
                      }}>
                        {comp.logoText}
                      </div>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text)' }}>{comp.company}</h4>
                        <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>{comp.location}</span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-secondary-light)', display: 'block' }}>{comp.openRoles} Open Roles</span>
                      <a href="/jobs" onClick={(e) => { e.preventDefault(); navigate(`/jobs?company=${comp.company}`); }} style={{ fontSize: '0.7rem', color: 'var(--color-text-dim)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.1rem' }}>
                        Apply <ChevronRight size={10} />
                      </a>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Trending Skills */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <Sparkle size={18} style={{ color: 'var(--color-xp)' }} />
              <h2 className="section-title" style={{ margin: 0, fontSize: '1.2rem', fontFamily: "'Space Grotesk', sans-serif" }}>Trending Tech Skills</h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {trendingLoading ? (
                [1, 2, 3].map(i => (
                  <div key={i} className="glass-card shimmer" style={{ height: 65, borderRadius: 10 }} />
                ))
              ) : (
                trendingSkills.slice(0, 4).map((skill, idx) => (
                  <div key={idx} className="glass-card skill-chip-card" onClick={() => navigate('/skill-trends')} style={{ padding: '0.85rem 1rem', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-text)' }}>{skill.name}</h4>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
                        <span style={{ fontSize: '0.68rem', color: 'var(--color-success)' }}>+{skill.growth}% demand</span>
                        <span style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)' }}>Demand Score: {skill.demandScore}/100</span>
                      </div>
                    </div>
                    <span style={{
                      fontSize: '0.65rem',
                      padding: '0.15rem 0.45rem',
                      borderRadius: 4,
                      background: 'var(--color-accent-glow)',
                      color: 'var(--color-accent-light)',
                      fontWeight: 700
                    }}>
                      {skill.futureRelevance || 'High'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* ── SECTION 6 & 7: Opportunity Radar & GPS Snapshot ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '2rem',
          marginBottom: '2.5rem'
        }}>
          {/* Opportunity Radar Preview */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Trophy size={18} style={{ color: 'var(--color-xp)' }} />
                <h2 className="section-title" style={{ margin: 0, fontSize: '1.2rem', fontFamily: "'Space Grotesk', sans-serif" }}>Opportunity Radar</h2>
              </div>
              <a href="/opportunities" onClick={(e) => { e.preventDefault(); navigate('/opportunities'); }} style={{ fontSize: '0.75rem', color: 'var(--color-primary-light)', textDecoration: 'none' }}>
                View All Opportunities →
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
                      <span style={{
                        fontSize: '0.65rem',
                        padding: '0.15rem 0.45rem',
                        borderRadius: 4,
                        background: opp.type === 'hackathon' ? 'var(--color-primary-glow)' : 'var(--color-accent-glow)',
                        color: opp.type === 'hackathon' ? 'var(--color-primary-light)' : 'var(--color-accent-light)',
                        fontWeight: 700,
                        textTransform: 'uppercase'
                      }}>
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

          {/* Career GPS Snapshot */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <Brain size={18} style={{ color: 'var(--color-primary)' }} />
              <h2 className="section-title" style={{ margin: 0, fontSize: '1.2rem', fontFamily: "'Space Grotesk', sans-serif" }}>Career GPS Snapshot</h2>
            </div>

            <div className="glass-card" style={{ padding: '1.25rem', borderRadius: 12, height: 'calc(100% - 35px)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
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
        </div>

        {/* ── COLLAPSIBLE QUICK ACTIONS & TOOLS (Bottom) ────────────────── */}
        <div style={{ marginTop: '3rem', borderTop: '1px solid var(--color-border)', paddingTop: '2rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text)', fontFamily: "'Space Grotesk', sans-serif", marginBottom: '1.25rem' }}>Career OS Intelligence Suite</h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1rem'
          }}>
            {quickActions.map((action, idx) => {
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
                    background: 'var(--color-surface-2)'
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
                    <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 700, color: 'var(--color-text)' }}>{action.label}</h4>
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
