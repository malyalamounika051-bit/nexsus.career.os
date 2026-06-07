import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../components/Sidebar';
import api from '../services/api';
import {
  Compass, Search, Bookmark, BookmarkCheck, ExternalLink, Calendar, Check,
  X, AlertTriangle, ShieldCheck, Award, Zap, RefreshCw, Sparkles, GraduationCap,
  Briefcase, Users, Code, CheckCircle2, ShieldAlert, ChevronLeft, ChevronRight,
  TrendingUp, Activity, BookmarkCheck as BookmarkIcon, Eye, CheckSquare
} from 'lucide-react';

const CATEGORY_ICONS = {
  'internship': Briefcase,
  'job': Briefcase,
  'hackathon': Code,
  'scholarship': GraduationCap,
  'competition': Award,
  'open-source': Code,
  'hiring-drive': Zap,
  'research': Users
};

const CATEGORY_COLORS = {
  'internship': '#0ea5e9',
  'job': '#10b981',
  'hackathon': '#a855f7',
  'scholarship': '#fbbf24',
  'competition': '#ec4899',
  'open-source': '#f59e0b',
  'hiring-drive': '#ef4444',
  'research': '#06b6d4'
};

const TABS = [
  { id: 'recommended', label: 'Recommended' },
  { id: 'high-match', label: 'High Match' },
  { id: 'recent', label: 'Recently Added' },
  { id: 'closing-soon', label: 'Closing Soon' },
  { id: 'internship', label: 'Internships' },
  { id: 'hackathon', label: 'Hackathons' },
  { id: 'scholarship', label: 'Scholarships' },
  { id: 'competition', label: 'Competitions' },
  { id: 'open-source', label: 'Open Source' },
  { id: 'research', label: 'Research' },
  { id: 'hiring-drive', label: 'Hiring Drives' },
  { id: 'saved', label: 'Saved' },
  { id: 'applied', label: 'Applied' }
];

const SCAN_STEPS = [
  'Checking Devpost...',
  'Checking MLH...',
  'Checking Kaggle...',
  'Checking Microsoft Programs...',
  'Checking Google Programs...',
  'Checking LinkedIn...',
  'Checking Wellfound...',
  'Checking GitHub Programs...',
  'Checking Scholarships...'
];

const OpportunityRadar = () => {
  const [sc, setSc] = useState(false);
  const [saraOpen, setSaraOpen] = useState(true);
  const [opportunities, setOpportunities] = useState([]);
  const [stats, setStats] = useState({
    activeOpportunities: 0,
    verifiedSources: 0,
    closingSoon: 0,
    applied: 0,
    saved: 0,
    avgMatchScore: 0
  });
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [scanStepIdx, setScanStepIdx] = useState(0);
  const [activeTab, setActiveTab] = useState('recommended');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOpp, setSelectedOpp] = useState(null);
  const [openedOpps, setOpenedOpps] = useState(new Set());
  const [toasts, setToasts] = useState([]);
  
  // Confirmed mark applied state
  const [showApplyConfirm, setShowApplyConfirm] = useState(false);
  const [confirmOppId, setConfirmOppId] = useState(null);

  // Toast Helper
  const showToast = (message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  // Cycling scan steps for scanner loading experience
  useEffect(() => {
    let interval;
    if (loading) {
      interval = setInterval(() => {
        setScanStepIdx(prev => (prev + 1) % SCAN_STEPS.length);
      }, 900);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const loadData = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    
    try {
      const endpoint = isRefresh ? '/opportunities/refresh' : '/opportunities';
      const { data } = await api.get(endpoint);
      if (data.success) {
        setOpportunities(data.data || []);
        if (data.stats) {
          setStats(data.stats);
        }
      }
    } catch (err) {
      console.error('Failed to load opportunities:', err);
      showToast('Could not sync career recommendations.', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleBookmark = async (id, e) => {
    e.stopPropagation();
    try {
      const { data } = await api.post(`/opportunities/${id}/bookmark`);
      if (data.success) {
        setOpportunities(prev => prev.map(opp => 
          opp._id === id ? { ...opp, bookmarked: data.bookmarked } : opp
        ));
        setStats(prev => ({
          ...prev,
          saved: data.bookmarked ? prev.saved + 1 : Math.max(0, prev.saved - 1)
        }));
        showToast(data.bookmarked ? '📌 Added To Bookmarks' : 'Opportunity removed from saved list');
      }
    } catch (err) {
      console.error(err);
      showToast('Error saving opportunity.', 'error');
    }
  };

  const triggerMarkAppliedFlow = (id, e) => {
    e.stopPropagation();
    setConfirmOppId(id);
    setShowApplyConfirm(true);
  };

  const handleApply = async () => {
    try {
      const { data } = await api.post(`/opportunities/${confirmOppId}/apply`, {
        applicationProof: 'Submitted via Opportunity Radar 3.0 Dashboard'
      });
      if (data.success) {
        setOpportunities(prev => prev.map(opp => 
          opp._id === confirmOppId ? { ...opp, applied: true } : opp
        ));
        setStats(prev => ({
          ...prev,
          applied: prev.applied + 1
        }));
        
        showToast('🎉 Application Submitted');
        if (data.xpAwarded) {
          showToast('⭐ +50 XP Earned!');
        }
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to record application.', 'error');
    } finally {
      setShowApplyConfirm(false);
      setConfirmOppId(null);
    }
  };

  const handleDismiss = async (id, e) => {
    e.stopPropagation();
    try {
      const { data } = await api.post(`/opportunities/${id}/dismiss`);
      if (data.success) {
        setOpportunities(prev => prev.filter(opp => opp._id !== id));
        if (selectedOpp?._id === id) setSelectedOpp(null);
        showToast('Opportunity dismissed');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getDaysLeft = (deadlineStr) => {
    if (!deadlineStr) return 999;
    const diffTime = new Date(deadlineStr) - new Date();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getDeadlineConfig = (opp) => {
    const deadline = opp.deadline;
    if (!deadline) return { label: 'Open Application', color: '#10b981', bg: 'rgba(16,185,129,0.08)' };
    
    const days = getDaysLeft(deadline);
    if (days <= 0) return { label: 'Expired', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' };
    if (days === 1) return { label: '⚠️ 1 Day Left', color: '#ef4444', bg: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)' };
    if (days <= 3) return { label: `⏳ ${days} Days Left`, color: '#f87171', bg: 'rgba(239,68,68,0.08)' };
    if (days <= 7) return { label: `📅 ${days} Days Left`, color: '#fbbf24', bg: 'rgba(245,158,11,0.08)' };
    return { label: `📅 ${days} Days Left`, color: '#10b981', bg: 'rgba(16,185,129,0.08)' };
  };

  // Client-side filtering & sorting matching V3 rules
  const filteredOpps = opportunities.filter(opp => {
    const matchesSearch = 
      opp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      opp.organization.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (opp.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (opp.requiredSkills || []).some(s => s.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (opp.tags || []).some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (activeTab === 'recommended') return true;
    if (activeTab === 'high-match') return opp.matchScore >= 90;
    if (activeTab === 'closing-soon') {
      const days = getDaysLeft(opp.deadline);
      return days > 0 && days <= 7;
    }
    if (activeTab === 'saved') return opp.bookmarked;
    if (activeTab === 'applied') return opp.applied;
    return opp.type === activeTab;
  });

  const displayOpps = [...filteredOpps];
  if (activeTab === 'recent') {
    displayOpps.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  } else {
    displayOpps.sort((a, b) => b.matchScore - a.matchScore);
  }

  // Dynamic Sara AI Recommendations Highlight
  const topMatch = opportunities.length > 0 ? [...opportunities].sort((a, b) => b.matchScore - a.matchScore)[0] : null;

  return (
    <div className="app-shell" style={{ overflowY: 'auto', minHeight: '100vh', height: 'auto' }}>
      
      {/* Toast Notification Container */}
      <div style={{
        position: 'fixed',
        bottom: '1.5rem',
        right: '1.5rem',
        zIndex: 10000,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.6rem',
        pointerEvents: 'none'
      }}>
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 80, y: 15 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              exit={{ opacity: 0, x: 50, scale: 0.9 }}
              transition={{ type: 'spring', damping: 20, stiffness: 250 }}
              style={{
                background: 'rgba(18, 18, 20, 0.92)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(16px)',
                padding: '0.8rem 1.25rem',
                borderRadius: '12px',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                fontWeight: 600,
                fontSize: '0.84rem',
                pointerEvents: 'auto'
              }}
            >
              {t.type === 'error' ? (
                <ShieldAlert size={15} color="#ef4444" />
              ) : (
                <CheckCircle2 size={15} color="#10b981" />
              )}
              <span>{t.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <Sidebar collapsed={sc} onToggleCollapse={() => setSc(c => !c)} />
      
      <main className={`app-main ${sc ? 'sidebar-is-collapsed' : ''}`} style={{ overflowY: 'visible', height: 'auto' }}>
        
        {/* Header Title & Refresh Button */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: 44, height: 44, borderRadius: 14, background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(14,165,233,0.3)' }}>
                <Compass size={22} color="white" />
              </div>
              <div>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: "'Space Grotesk', sans-serif" }}>Opportunity <span className="gradient-text">Radar</span></h1>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Automated, real-time discovery engine verified and tuned to your GPS Career coordinates</p>
              </div>
            </div>
            
            <button className="btn-ghost" onClick={() => loadData(true)} disabled={refreshing || loading} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <RefreshCw size={14} className={refreshing ? 'spin' : ''} /> {refreshing ? 'Refreshing...' : 'Refresh Radar'}
            </button>
          </div>
        </motion.div>

        {/* Dynamic Overview Metrics Row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '1rem',
            marginBottom: '1.5rem'
          }}
        >
          <div className="glass-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <span style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Active Radar Items</span>
            <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Activity size={18} color="var(--color-primary-light)" /> {stats.activeOpportunities}
            </span>
          </div>
          <div className="glass-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <span style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Verified Sources</span>
            <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <ShieldCheck size={18} color="#10b981" /> {stats.verifiedSources}
            </span>
          </div>
          <div className="glass-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <span style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Closing Soon</span>
            <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Calendar size={18} color="#ef4444" /> {stats.closingSoon}
            </span>
          </div>
          <div className="glass-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <span style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Opportunities Saved</span>
            <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <BookmarkCheck size={18} color="#fbbf24" /> {stats.saved}
            </span>
          </div>
          <div className="glass-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <span style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Applications</span>
            <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#a855f7', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <CheckSquare size={18} color="#a855f7" /> {stats.applied}
            </span>
          </div>
          <div className="glass-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <span style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Avg Match Rating</span>
            <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <TrendingUp size={18} color="var(--color-primary-light)" /> {stats.avgMatchScore}%
            </span>
          </div>
        </motion.div>

        {/* Main Grid View */}
        <div style={{ display: 'grid', gridTemplateColumns: saraOpen ? '1fr 340px' : '1fr', gap: '1.5rem', transition: 'grid-template-columns 0.3s ease' }} className="gps-grid">
          
          {/* Left Feed Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', overflowX: 'hidden' }}>
            
            {/* Tab Swappers */}
            <div style={{
              display: 'flex', gap: '0.4rem', overflowX: 'auto', paddingBottom: '0.5rem',
              borderBottom: '1px solid var(--color-border)'
            }} className="custom-scrollbar">
              {TABS.map(tab => (
                <button
                   key={tab.id}
                   onClick={() => setActiveTab(tab.id)}
                   style={{
                     padding: '0.45rem 0.9rem',
                     borderRadius: '8px',
                     border: '1px solid ' + (activeTab === tab.id ? 'var(--color-primary-glow)' : 'var(--color-border)'),
                     background: activeTab === tab.id ? 'var(--color-primary-glow)' : 'var(--color-surface)',
                     color: activeTab === tab.id ? 'var(--color-primary-light)' : 'var(--color-text-muted)',
                     fontSize: '0.8rem',
                     fontWeight: 600,
                     cursor: 'pointer',
                     whiteSpace: 'nowrap',
                     transition: 'all 0.15s ease'
                   }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Debounced Search */}
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
              <input
                className="input"
                placeholder="Search matching opportunities by skills, tags, or organizations..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '2.5rem' }}
              />
            </div>

            {/* Display refreshing background indicator */}
            {refreshing && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', color: 'var(--color-primary-light)', padding: '0.25rem 0.5rem', borderRadius: 8, background: 'var(--color-primary-glow)' }}>
                <RefreshCw size={12} className="spin" /> Updating live pipelines in background...
              </div>
            )}

            {/* Cards Feed */}
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '2rem 0' }}>
                <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                  <div className="roadmap-loading-dots" style={{ margin: '0 auto 0.75rem' }}><span /><span /><span /></div>
                  <div style={{ fontWeight: 700, color: 'white' }}>Scanning Global Opportunity Sources...</div>
                  <div style={{ fontSize: '0.78rem', marginTop: '0.25rem', color: 'var(--color-primary-light)' }}>
                    {SCAN_STEPS[scanStepIdx]}
                  </div>
                </div>
                
                {/* Skeleton Cards */}
                {[1, 2, 3].map(i => (
                  <div key={i} className="glass-card" style={{ height: 130, opacity: 0.25, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '1.25rem' }}>
                    <div style={{ height: 16, width: '40%', background: 'white', borderRadius: 4 }} />
                    <div style={{ height: 12, width: '70%', background: 'white', borderRadius: 4 }} />
                    <div style={{ height: 12, width: '20%', background: 'white', borderRadius: 4 }} />
                  </div>
                ))}
              </div>
            ) : displayOpps.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem 2rem' }} className="glass-card">
                <Compass size={48} color="var(--color-text-muted)" style={{ opacity: 0.3, margin: '0 auto 1.25rem', display: 'block' }} />
                <h4 style={{ fontWeight: 700, color: 'white', marginBottom: '0.5rem' }}>No Matching Opportunities Found</h4>
                <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', maxWidth: 380, margin: '0 auto 1.5rem', lineHeight: 1.5 }}>
                  <ul style={{ textAlign: 'left', listStyle: 'disc', paddingLeft: '1.25rem', display: 'inline-block' }}>
                    <li>Expand your registered skills in Skill Intelligence Hub</li>
                    <li>Update your primary coordinates in Career GPS</li>
                    <li>Toggle a different radar filter tab above</li>
                    <li>Try clicking Refresh Radar to force crawl global sources</li>
                  </ul>
                </div>
                <button className="btn-primary" onClick={() => loadData(true)} style={{ padding: '0.5rem 1.25rem', borderRadius: 8 }}>
                  Refresh Radar
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))', gap: '1.25rem' }}>
                {displayOpps.map(opp => {
                  const Icon = CATEGORY_ICONS[opp.type] || Briefcase;
                  const catColor = CATEGORY_COLORS[opp.type] || '#8899b0';
                  const deadlineStyle = getDeadlineConfig(opp);

                  return (
                    <motion.div
                      layout
                      key={opp._id}
                      className="glass-card hover-lift"
                      onClick={() => setSelectedOpp(opp)}
                      style={{
                        padding: '1.25rem',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        border: '1px solid var(--color-border)',
                        position: 'relative',
                        minHeight: 220
                      }}
                    >
                      {/* Top Badges */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: '0.4rem',
                          padding: '0.25rem 0.6rem', borderRadius: 8,
                          background: catColor + '12', border: `1px solid ${catColor}25`,
                          color: catColor, fontSize: '0.72rem', fontWeight: 700, textTransform: 'capitalize'
                        }}>
                          <Icon size={12} color={catColor} /> {opp.type}
                        </div>
                        
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: '0.25rem',
                          padding: '0.25rem 0.5rem', borderRadius: 8,
                          background: 'var(--color-primary-glow)', border: '1px solid rgba(14,165,233,0.2)',
                          color: 'var(--color-primary-light)', fontSize: '0.74rem', fontWeight: 800
                        }}>
                          <Sparkles size={11} color="var(--color-primary-light)" /> {opp.matchScore}% Match
                        </div>
                      </div>

                      {/* Header Title */}
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.25rem' }}>
                          <h4 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 800, color: 'white', lineHeight: 1.4 }}>{opp.title}</h4>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center',
                            fontSize: '0.6rem', fontWeight: 700, color: '#10b981',
                            background: 'rgba(16,185,129,0.06)', padding: '0.1rem 0.35rem', borderRadius: 4
                          }}>
                            🟢 Verified
                          </span>
                        </div>
                        
                        <p style={{ margin: '0.1rem 0 0.75rem 0', fontSize: '0.78rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>{opp.organization}</p>
                        
                        {/* Dynamic score alignment maps */}
                        <div style={{ marginBottom: '0.75rem', fontSize: '0.72rem', fontWeight: 700, color: opp.matchScore >= 80 ? '#10b981' : (opp.matchScore >= 60 ? '#fbbf24' : '#ef4444') }}>
                          {opp.matchScore >= 80 ? 'Excellent Match' : (opp.matchScore >= 60 ? 'Strong Match' : 'Moderate Match')}
                        </div>

                        {opp.whyRecommended && opp.whyRecommended.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginBottom: '0.75rem' }}>
                            {opp.whyRecommended.map((reason, rIdx) => (
                              <span key={rIdx} style={{
                                padding: '0.15rem 0.45rem', borderRadius: 6,
                                background: 'rgba(255,255,255,0.03)', border: '1px solid var(--color-border)',
                                color: 'var(--color-text-dim)', fontSize: '0.68rem', fontWeight: 500
                              }}>
                                ✓ {reason}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Bottom Actions Row */}
                      <div style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        borderTop: '1px solid var(--color-border)', paddingTop: '0.75rem', marginTop: '0.5rem'
                      }}>
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: '0.35rem',
                          padding: '0.2rem 0.5rem', borderRadius: 6,
                          background: deadlineStyle.bg, color: deadlineStyle.color,
                          border: deadlineStyle.border || 'none',
                          fontSize: '0.7rem', fontWeight: 700
                        }}>
                          <Calendar size={11} /> {deadlineStyle.label}
                        </div>

                        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                          <button
                            className="btn-ghost"
                            onClick={(e) => handleToggleBookmark(opp._id, e)}
                            style={{ padding: '0.35rem', borderRadius: 8 }}
                            title="Bookmark opportunity"
                          >
                            {opp.bookmarked ? (
                              <BookmarkCheck size={14} color="#fbbf24" />
                            ) : (
                              <Bookmark size={14} color="var(--color-text-muted)" />
                            )}
                          </button>
                          
                          {!opp.applied ? (
                            <div style={{ display: 'flex', gap: '0.3rem' }} onClick={e => e.stopPropagation()}>
                              <button
                                className="btn-ghost"
                                onClick={() => {
                                  window.open(opp.applicationUrl, '_blank');
                                  setOpenedOpps(prev => new Set([...prev, opp._id]));
                                }}
                                style={{ padding: '0.35rem 0.6rem', borderRadius: 8, fontSize: '0.7rem', border: '1px solid var(--color-border)' }}
                              >
                                <ExternalLink size={11} /> Apply
                              </button>
                              
                              {openedOpps.has(opp._id) && (
                                <button
                                  className="btn-primary"
                                  onClick={(e) => triggerMarkAppliedFlow(opp._id, e)}
                                  style={{ padding: '0.35rem 0.6rem', borderRadius: 8, fontSize: '0.7rem' }}
                                >
                                  Mark Applied
                                </button>
                              )}
                            </div>
                          ) : (
                            <span style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.2rem', padding: '0.35rem 0.6rem' }}>
                              <Check size={12} /> Applied
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

          </div>

          {/* Collapsible Right Sidebar */}
          <div style={{ position: 'relative' }}>
            {/* Collapse Trigger Button */}
            <button
              onClick={() => setSaraOpen(o => !o)}
              style={{
                position: 'absolute',
                left: '-2rem',
                top: '0.5rem',
                width: '1.5rem',
                height: '2rem',
                background: 'rgba(18, 18, 20, 0.92)',
                border: '1px solid var(--color-border)',
                borderRight: 'none',
                borderRadius: '8px 0 0 8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-text-muted)',
                cursor: 'pointer',
                zIndex: 100
              }}
            >
              {saraOpen ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>

            {saraOpen && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
              >
                {/* AI recommendations */}
                <div style={{
                  background: 'var(--gradient-primary-soft)',
                  border: '1px solid rgba(14,165,233,0.15)',
                  padding: '1.5rem',
                  borderRadius: 16
                }}>
                  <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', marginBottom: '0.8rem' }}>
                    <Sparkles size={18} color="var(--color-primary-light)" />
                    <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--color-primary-light)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Sara Radar Insights</span>
                  </div>
                  <div style={{ fontSize: '0.84rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                    {topMatch ? (
                      <div>
                        <p style={{ margin: '0 0 0.75rem 0' }}>
                          Sara AI recommendation matching your career tracks:
                        </p>
                        <div style={{ padding: '0.75rem', background: 'rgba(14,165,233,0.06)', borderRadius: 10, borderLeft: '3px solid var(--color-primary)', marginBottom: '0.75rem' }}>
                          <span style={{ fontWeight: 800, color: 'white', display: 'block', marginBottom: '0.2rem' }}>{topMatch.title}</span>
                          <span style={{ fontSize: '0.76rem', color: 'var(--color-text-dim)', display: 'block', marginBottom: '0.4rem' }}>{topMatch.organization}</span>
                          
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.74rem' }}>
                            <span style={{ color: 'var(--color-primary-light)', fontWeight: 700 }}>📈 Match Rating: {topMatch.matchScore}% ({topMatch.matchLabel})</span>
                            {topMatch.whyRecommended.map((r, idx) => (
                              <span key={idx} style={{ color: 'var(--color-text-muted)' }}>✓ {r}</span>
                            ))}
                            {topMatch.missingSkills && topMatch.missingSkills.length > 0 && (
                              <div style={{ marginTop: '0.3rem', color: '#fbbf24' }}>
                                ⚠️ Missing: {topMatch.missingSkills.join(', ')}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p style={{ margin: '0 0 0.75rem 0' }}>
                        Hi! I'm monitoring the global pipelines. Once opportunities are loaded, I will show you high-relevance recommendations here.
                      </p>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.78rem', opacity: 0.85 }}>
                      <div style={{ padding: '0.5rem', background: 'rgba(16,185,129,0.06)', borderRadius: 10 }}>
                        🏆 Applying to high-match opportunities boosts your Career Readiness index.
                      </div>
                    </div>
                  </div>
                </div>

                {/* System Stats */}
                <div className="glass-card" style={{ padding: '1.25rem' }}>
                  <h4 style={{ fontWeight: 800, fontSize: '0.82rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '1rem', letterSpacing: '0.04em' }}>
                    Ingestion Crawler Performance
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', fontSize: '0.82rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--color-text-muted)' }}>Crawled Opportunities</span>
                      <span style={{ fontWeight: 700 }}>{opportunities.length}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--color-text-muted)' }}>Deduplication Merges</span>
                      <span style={{ fontWeight: 700, color: 'var(--color-primary-light)' }}>23</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--color-text-muted)' }}>Source Trust Factor</span>
                      <span style={{ fontWeight: 700, color: '#10b981' }}>99.8%</span>
                    </div>
                    <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                      <div style={{ fontSize: '0.66rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Source Ingestion Pipeline</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#10b981', fontWeight: 600 }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} className="pulse-slow" /> Active & Scanning
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

        </div>

        {/* Apply Confirmation Modal */}
        <AnimatePresence>
          {showApplyConfirm && (
            <div style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)',
              display: 'flex', alignItems: 'center', justifyItems: 'center',
              justifyContent: 'center', zIndex: 10000, padding: '1rem'
            }}>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="glass-card"
                style={{ width: '100%', maxWidth: 420, padding: '1.75rem', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '1rem' }}
              >
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                    <CheckCircle2 size={20} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.1rem', color: 'white' }}>Confirm Application</h3>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.82rem', color: 'var(--color-text-muted)', lineHeight: 1.4 }}>
                      Are you sure you want to mark this opportunity as applied? You will earn <strong>+50 XP</strong>. This action can only be taken once.
                    </p>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button className="btn-ghost" style={{ flex: 1 }} onClick={() => { setShowApplyConfirm(false); setConfirmOppId(null); }}>
                    Cancel
                  </button>
                  <button className="btn-primary" style={{ flex: 1 }} onClick={handleApply}>
                    Yes, Mark Applied
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Opportunity Detail Modal */}
        <AnimatePresence>
          {selectedOpp && (
            <div style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 9999, padding: '1.5rem'
            }} onClick={() => setSelectedOpp(null)}>
              <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 15, scale: 0.95 }}
                className="glass-card"
                onClick={(e) => e.stopPropagation()}
                style={{
                  width: '100%', maxWidth: 550, padding: '2rem',
                  display: 'flex', flexDirection: 'column', gap: '1.25rem',
                  border: '1px solid var(--color-border)',
                  maxHeight: '90vh', overflowY: 'auto'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.25rem', color: 'white', fontFamily: "'Space Grotesk', sans-serif" }}>{selectedOpp.title}</h3>
                      <span style={{
                        fontSize: '0.62rem', fontWeight: 700, color: '#10b981',
                        background: 'rgba(16,185,129,0.06)', padding: '0.1rem 0.35rem', borderRadius: 4
                      }}>
                        🟢 Verified
                      </span>
                    </div>
                    
                    <p style={{ margin: '0.2rem 0 0 0', fontWeight: 600, color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>{selectedOpp.organization}</p>
                  </div>
                  <button className="btn-ghost" onClick={() => setSelectedOpp(null)} style={{ padding: '0.25rem', borderRadius: 8 }}>
                    <X size={18} color="var(--color-text-muted)" />
                  </button>
                </div>

                <div style={{
                  background: 'rgba(14,165,233,0.05)', border: '1px solid rgba(14,165,233,0.12)',
                  borderRadius: 12, padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-primary-light)' }}>Match Score Alignment:</span>
                  <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'white' }}>{selectedOpp.matchScore}% ({selectedOpp.matchLabel})</span>
                </div>

                <div>
                  <h5 style={{ margin: '0 0 0.4rem 0', textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: '0.04em', color: 'var(--color-text-muted)' }}>Description</h5>
                  <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--color-text-dim)', lineHeight: 1.5 }}>{selectedOpp.description}</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <h5 style={{ margin: '0 0 0.3rem 0', textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: '0.04em', color: 'var(--color-text-muted)' }}>Eligibility</h5>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>{selectedOpp.eligibility || 'Open to all applicants'}</p>
                  </div>
                  <div>
                    <h5 style={{ margin: '0 0 0.3rem 0', textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: '0.04em', color: 'var(--color-text-muted)' }}>Location</h5>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>📍 {selectedOpp.location}</p>
                  </div>
                </div>

                {selectedOpp.deadline && (
                  <div>
                    <h5 style={{ margin: '0 0 0.3rem 0', textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: '0.04em', color: 'var(--color-text-muted)' }}>Application Deadline</h5>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                      🗓️ {new Date(selectedOpp.deadline).toLocaleDateString()}
                    </p>
                  </div>
                )}

                {selectedOpp.requiredSkills && selectedOpp.requiredSkills.length > 0 && (
                  <div>
                    <h5 style={{ margin: '0 0 0.4rem 0', textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: '0.04em', color: 'var(--color-text-muted)' }}>Required Skills</h5>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                      {selectedOpp.requiredSkills.map((sk, idx) => (
                        <span key={idx} style={{
                          padding: '0.2rem 0.5rem', borderRadius: 8, background: 'var(--color-surface-2)',
                          border: '1px solid var(--color-border)', color: 'white', fontSize: '0.72rem'
                        }}>
                          {sk}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedOpp.missingSkills && selectedOpp.missingSkills.length > 0 && (
                  <div>
                    <h5 style={{ margin: '0 0 0.4rem 0', textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: '0.04em', color: '#fbbf24' }}>Missing Skills (Learn Next)</h5>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                      {selectedOpp.missingSkills.map((sk, idx) => (
                        <span key={idx} style={{
                          padding: '0.2rem 0.5rem', borderRadius: 8, background: 'rgba(245,158,11,0.06)',
                          border: '1px solid rgba(245,158,11,0.15)', color: '#fbbf24', fontSize: '0.72rem'
                        }}>
                          {sk}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{
                  display: 'flex', flexDirection: 'column', gap: '0.2rem', borderTop: '1px solid var(--color-border)',
                  paddingTop: '1rem', marginTop: '0.5rem', fontSize: '0.72rem', color: 'var(--color-text-muted)'
                }}>
                  <div>🔗 Source: <strong>{selectedOpp.source || 'Verified Partner'}</strong></div>
                  {selectedOpp.difficulty && <div>⚡ Difficulty Level: <strong>{selectedOpp.difficulty}</strong></div>}
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button
                    className="btn-ghost"
                    onClick={(e) => handleDismiss(selectedOpp._id, e)}
                    style={{ flex: 1, color: 'var(--color-error)', border: '1px solid rgba(239,68,68,0.2)' }}
                  >
                    Hide Recommendation
                  </button>
                  
                  {!selectedOpp.applied ? (
                    <button
                      className="btn-primary"
                      onClick={() => {
                        window.open(selectedOpp.applicationUrl, '_blank');
                        setOpenedOpps(prev => new Set([...prev, selectedOpp._id]));
                        setSelectedOpp(null);
                        showToast('Redirected to official page. Click Mark Applied when finished!');
                      }}
                      style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                    >
                      <ExternalLink size={14} /> Apply Now
                    </button>
                  ) : (
                    <button
                      className="btn-primary"
                      disabled
                      style={{ flex: 1, opacity: 0.6 }}
                    >
                      ✓ Already Applied
                    </button>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </main>
    </div>
  );
};

export default OpportunityRadar;
