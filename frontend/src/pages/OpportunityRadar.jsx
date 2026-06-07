import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../components/Sidebar';
import api from '../services/api';
import {
  Compass, Search, Bookmark, BookmarkCheck, ExternalLink, Calendar, Check,
  X, AlertTriangle, ShieldCheck, Award, Zap, RefreshCw, Sparkles, GraduationCap,
  Briefcase, Users, Code, CheckCircle2, ShieldAlert
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
  { id: 'high-match', label: 'High Match (90%+)' },
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

const OpportunityRadar = () => {
  const [sc, setSc] = useState(false);
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('recommended');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOpp, setSelectedOpp] = useState(null);
  const [openedOpps, setOpenedOpps] = useState(new Set());
  const [toasts, setToasts] = useState([]);

  // Toast Helper
  const showToast = (message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      // Fetch/seed mock data in dev, failsafe gracefully in prod
      try {
        await api.get('/opportunities/seed');
      } catch (seedErr) {
        console.warn('Seeder skipped or forbidden:', seedErr.message);
      }
      
      const { data } = await api.get('/opportunities');
      if (data.success) {
        setOpportunities(data.data || []);
      }
    } catch (err) {
      console.error('Failed to load opportunities:', err);
      showToast('Could not load career recommendations.', 'error');
    } finally {
      setLoading(false);
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
        showToast(data.bookmarked ? '📌 Added To Bookmarks' : 'Opportunity removed from saved list');
      }
    } catch (err) {
      console.error(err);
      showToast('Error saving opportunity.', 'error');
    }
  };

  const handleApply = async (id, e) => {
    e.stopPropagation();
    try {
      const { data } = await api.post(`/opportunities/${id}/apply`);
      if (data.success) {
        setOpportunities(prev => prev.map(opp => 
          opp._id === id ? { ...opp, applied: true } : opp
        ));
        
        showToast('🎉 Application Submitted');
        if (data.xpAwarded) {
          showToast('⭐ +50 XP Earned!');
        }
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to record application.', 'error');
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
    const deadline = opp.registrationDeadline || opp.submissionDeadline;
    if (!deadline) return { label: 'Open Application', color: '#10b981', bg: 'rgba(16,185,129,0.08)' };
    
    const days = getDaysLeft(deadline);
    if (days <= 0) return { label: 'Closed', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' };
    if (days === 1) return { label: 'Closing Tomorrow', color: '#ef4444', bg: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)' };
    if (days <= 3) return { label: `${days} Days Left`, color: '#f87171', bg: 'rgba(239,68,68,0.08)' };
    if (days <= 7) return { label: `${days} Days Left`, color: '#fbbf24', bg: 'rgba(245,158,11,0.08)' };
    return { label: `${days} Days Left`, color: '#10b981', bg: 'rgba(16,185,129,0.08)' };
  };

  // Client-side filtering & sorting matching backend logic
  const filteredOpps = opportunities.filter(opp => {
    const matchesSearch = 
      opp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      opp.organization.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (opp.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (opp.requiredSkills || []).some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (activeTab === 'recommended') return true;
    if (activeTab === 'high-match') return opp.matchScore >= 90;
    if (activeTab === 'closing-soon') {
      const deadline = opp.registrationDeadline || opp.submissionDeadline;
      if (!deadline) return false;
      const days = getDaysLeft(deadline);
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

  // Dynamic Sara Highlight
  const topMatch = opportunities.length > 0 ? [...opportunities].sort((a, b) => b.matchScore - a.matchScore)[0] : null;

  return (
    <div className="app-shell">
      
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
      
      <main className={`app-main ${sc ? 'sidebar-is-collapsed' : ''}`}>
        
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: 44, height: 44, borderRadius: 14, background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(14,165,233,0.3)' }}>
                <Compass size={22} color="white" />
              </div>
              <div>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: "'Space Grotesk', sans-serif" }}>Opportunity <span className="gradient-text">Radar</span></h1>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Proactive recommendation dashboard continuously matching active career pipelines</p>
              </div>
            </div>
            
            <button className="btn-ghost" onClick={loadData} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh Radar
            </button>
          </div>
        </motion.div>

        {/* Dashboard Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.75rem', alignItems: 'start' }} className="gps-grid">
          
          {/* Left Feed */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Filter Navigation */}
            <div style={{
              display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem',
              borderBottom: '1px solid var(--color-border)'
            }} className="custom-scrollbar">
              {TABS.map(tab => (
                <button
                   key={tab.id}
                   onClick={() => setActiveTab(tab.id)}
                   style={{
                     padding: '0.5rem 1rem',
                     borderRadius: '10px',
                     border: '1px solid ' + (activeTab === tab.id ? 'var(--color-primary-glow)' : 'var(--color-border)'),
                     background: activeTab === tab.id ? 'var(--color-primary-glow)' : 'var(--color-surface)',
                     color: activeTab === tab.id ? 'var(--color-primary-light)' : 'var(--color-text-muted)',
                     fontSize: '0.82rem',
                     fontWeight: 600,
                     cursor: 'pointer',
                     whiteSpace: 'nowrap',
                     transition: 'all 0.2s ease'
                   }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search */}
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

            {/* Cards Feed */}
            {loading ? (
              <div style={{ textAlign: 'center', padding: '5rem 0', color: 'var(--color-text-muted)' }}>
                <div className="roadmap-loading-dots" style={{ margin: '0 auto 1rem' }}><span /><span /><span /></div>
                Scanning career dimensions for matched roles...
              </div>
            ) : displayOpps.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem 2rem' }} className="glass-card">
                <Compass size={48} color="var(--color-text-muted)" style={{ opacity: 0.3, margin: '0 auto 1rem', display: 'block' }} />
                <h4 style={{ fontWeight: 700, color: 'var(--color-text)', marginBottom: '0.25rem' }}>No Opportunities Found</h4>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Try clearing your search or switching categories.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
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
                        overflow: 'hidden'
                      }}
                    >
                      {/* Top elements */}
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
                          display: 'flex', alignItems: 'center', gap: '0.2rem',
                          padding: '0.25rem 0.5rem', borderRadius: 8,
                          background: 'var(--color-primary-glow)', border: '1px solid rgba(14,165,233,0.2)',
                          color: 'var(--color-primary-light)', fontSize: '0.76rem', fontWeight: 800
                        }}>
                          <Sparkles size={11} color="var(--color-primary-light)" /> {opp.matchScore}% Match
                        </div>
                      </div>

                      {/* Info & Badges */}
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.3rem' }}>
                          <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: 'white', lineHeight: 1.4 }}>{opp.title}</h4>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center',
                            fontSize: '0.62rem', fontWeight: 700, color: '#10b981',
                            background: 'rgba(16,185,129,0.06)', padding: '0.1rem 0.35rem', borderRadius: 4
                          }}>
                            🟢 Verified
                          </span>
                        </div>
                        
                        <p style={{ margin: '0.15rem 0 0.75rem 0', fontSize: '0.78rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>{opp.organization}</p>
                        
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

                      {/* Footer Actions */}
                      <div style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        borderTop: '1px solid var(--color-border)', paddingTop: '0.75rem', marginTop: '0.5rem'
                      }}>
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: '0.35rem',
                          padding: '0.2' + 'rem 0.5rem', borderRadius: 6,
                          background: deadlineStyle.bg, color: deadlineStyle.color,
                          border: deadlineStyle.border || 'none',
                          fontSize: '0.72rem', fontWeight: 700
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
                                style={{ padding: '0.35rem 0.6rem', borderRadius: 8, fontSize: '0.72rem', border: '1px solid var(--color-border)' }}
                              >
                                <ExternalLink size={11} /> Apply
                              </button>
                              
                              {openedOpps.has(opp._id) && (
                                <button
                                  className="btn-primary"
                                  onClick={(e) => handleApply(opp._id, e)}
                                  style={{ padding: '0.35rem 0.6rem', borderRadius: 8, fontSize: '0.72rem' }}
                                >
                                  Mark Applied
                                </button>
                              )}
                            </div>
                          ) : (
                            <span style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.2rem', padding: '0.35rem 0.6rem' }}>
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

          {/* Right Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Sara AI Recommendation Panel */}
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
                      I found this opportunity because it matches your career profile:
                    </p>
                    <div style={{ padding: '0.6rem', background: 'rgba(14,165,233,0.06)', borderRadius: 10, borderLeft: '3px solid var(--color-primary)', marginBottom: '0.75rem' }}>
                      🔥 <strong>{topMatch.title}</strong> by <strong>{topMatch.organization}</strong>
                      <div style={{ fontSize: '0.76rem', marginTop: '0.4rem', color: 'var(--color-text-dim)', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        {topMatch.whyRecommended.map((r, idx) => (
                          <span key={idx}>✓ {r}</span>
                        ))}
                        <span>📈 Match Score: {topMatch.matchScore}%</span>
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

            {/* System Status */}
            <div className="glass-card" style={{ padding: '1.25rem' }}>
              <h4 style={{ fontWeight: 800, fontSize: '0.82rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '1rem', letterSpacing: '0.04em' }}>
                Radar Performance
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', fontSize: '0.82rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Opportunities Crawled</span>
                  <span style={{ fontWeight: 700 }}>{opportunities.length}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Global Source Trust Rating</span>
                  <span style={{ fontWeight: 700, color: '#10b981' }}>99.8%</span>
                </div>
                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                  <div style={{ fontSize: '0.66rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Discovery Ingestion Pipeline</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#10b981', fontWeight: 600 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} className="pulse-slow" /> Active & Scanning
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>

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
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-primary-light)' }}>AI Opportunity Matching:</span>
                  <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'white' }}>{selectedOpp.matchScore}% Score</span>
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

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  {selectedOpp.registrationDeadline && (
                    <div>
                      <h5 style={{ margin: '0 0 0.3rem 0', textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: '0.04em', color: 'var(--color-text-muted)' }}>Registration Deadline</h5>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                        🗓️ {new Date(selectedOpp.registrationDeadline).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  {selectedOpp.submissionDeadline && (
                    <div>
                      <h5 style={{ margin: '0 0 0.3rem 0', textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: '0.04em', color: 'var(--color-text-muted)' }}>Submission Deadline</h5>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                        🗓️ {new Date(selectedOpp.submissionDeadline).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>

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

                {selectedOpp.benefits && selectedOpp.benefits.length > 0 && (
                  <div>
                    <h5 style={{ margin: '0 0 0.4rem 0', textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: '0.04em', color: 'var(--color-text-muted)' }}>Benefits</h5>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                      {selectedOpp.benefits.map((b, idx) => (
                        <span key={idx} style={{
                          padding: '0.2rem 0.5rem', borderRadius: 8, background: 'rgba(16,185,129,0.06)',
                          border: '1px solid rgba(16,185,129,0.15)', color: '#10b981', fontSize: '0.72rem'
                        }}>
                          {b}
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
                  {selectedOpp.difficultyLevel && <div>⚡ Difficulty Level: <strong>{selectedOpp.difficultyLevel}</strong></div>}
                  {selectedOpp.estimatedCommitment && <div>⏱️ Estimated Commitment: <strong>{selectedOpp.estimatedCommitment}</strong></div>}
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
