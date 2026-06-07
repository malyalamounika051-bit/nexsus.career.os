import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../components/Sidebar';
import api from '../services/api';
import {
  Compass, Search, Bookmark, BookmarkCheck, ExternalLink, Calendar, Check,
  X, AlertTriangle, ShieldCheck, Award, Zap, RefreshCw, Sparkles, GraduationCap,
  Flame, Briefcase, HelpCircle, Code, Users, FileText, ChevronRight, CheckCircle2
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
  { id: 'all', label: 'All Recommended' },
  { id: 'closing', label: 'Closing Soon' },
  { id: 'internship', label: 'Internships' },
  { id: 'hackathon', label: 'Hackathons' },
  { id: 'scholarship', label: 'Scholarships' },
  { id: 'competition', label: 'Competitions' },
  { id: 'open-source', label: 'Open Source' },
  { id: 'hiring-drive', label: 'Hiring Drives' },
  { id: 'saved', label: 'Saved' }
];

const OpportunityRadar = () => {
  const [sc, setSc] = useState(false); // Sidebar collapse
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [selectedOpp, setSelectedOpp] = useState(null); // Detail modal

  // Gamification & badge alerts
  const [showBadgeUnlock, setShowBadgeUnlock] = useState(false);
  const [unlockedBadge, setUnlockedBadge] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      // Trigger seed check first to populate if database empty
      await api.get('/opportunities/seed');

      const { data } = await api.get('/opportunities');
      if (data.success) {
        setOpportunities(data.data || []);
      }
    } catch (err) {
      console.error('Failed to load opportunities:', err);
      setError('Could not connect to the Opportunity engine.');
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
        setSuccessMsg(data.bookmarked ? 'Opportunity added to bookmarks!' : 'Opportunity removed from bookmarks');
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleApply = async (id, url, e) => {
    e.stopPropagation();
    try {
      const { data } = await api.post(`/opportunities/${id}/apply`);
      if (data.success) {
        setOpportunities(prev => prev.map(opp => 
          opp._id === id ? { ...opp, applied: true } : opp
        ));
        
        // Show application success badge unlock
        setUnlockedBadge({
          name: 'Opportunity Hunter',
          desc: 'Uncovered your first matched career opportunity!',
          icon: ShieldCheck
        });
        setShowBadgeUnlock(true);

        // Open application url in new tab
        window.open(url, '_blank');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDismiss = async (id, e) => {
    e.stopPropagation();
    try {
      const { data } = await api.post(`/opportunities/${id}/dismiss`);
      if (data.success) {
        setOpportunities(prev => prev.filter(opp => opp._id !== id));
        if (selectedOpp?._id === id) setSelectedOpp(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Get days left helper
  const getDaysLeft = (deadlineStr) => {
    const diffTime = new Date(deadlineStr) - new Date();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Get deadline label / style
  const getDeadlineConfig = (deadlineStr) => {
    const days = getDaysLeft(deadlineStr);
    if (days <= 0) return { label: 'Closed', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' };
    if (days === 1) return { label: 'Closing Tomorrow', color: '#ef4444', bg: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)' };
    if (days <= 3) return { label: `${days} Days Left`, color: '#f87171', bg: 'rgba(239,68,68,0.08)' };
    if (days <= 7) return { label: `${days} Days Left`, color: '#fbbf24', bg: 'rgba(245,158,11,0.08)' };
    return { label: `${days} Days Left`, color: '#10b981', bg: 'rgba(16,185,129,0.08)' };
  };

  // Filter opportunities
  const filteredOpps = opportunities.filter(opp => {
    // Search query match
    const matchesSearch = 
      opp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      opp.organization.toLowerCase().includes(searchQuery.toLowerCase()) ||
      opp.description.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    // Tab filter match
    if (activeTab === 'all') return true;
    if (activeTab === 'saved') return opp.bookmarked;
    if (activeTab === 'closing') {
      const days = getDaysLeft(opp.deadline);
      return days > 0 && days <= 7;
    }
    return opp.type === activeTab;
  });

  return (
    <div className="app-shell">
      {/* Toast Alert */}
      <AnimatePresence>
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9, x: '-50%' }}
            animate={{ opacity: 1, y: 0, scale: 1, x: '-50%' }}
            exit={{ opacity: 0, y: -20, scale: 0.9, x: '-50%' }}
            style={{
              position: 'fixed',
              top: '2.5rem',
              left: '50%',
              zIndex: 9999,
              background: 'rgba(16, 185, 129, 0.16)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              backdropFilter: 'blur(12px)',
              padding: '0.75rem 1.5rem',
              borderRadius: '12px',
              color: '#a7f3d0',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
              fontWeight: 500
            }}
          >
            <CheckCircle2 size={18} color="#a7f3d0" />
            <span>{successMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Gamification Badge Popup */}
      <AnimatePresence>
        {showBadgeUnlock && unlockedBadge && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 10000
          }}>
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="glass-card"
              style={{
                padding: '2.5rem', maxWidth: 420, textAlign: 'center',
                border: '1px solid rgba(251,191,36,0.3)',
                boxShadow: '0 0 40px rgba(251,191,36,0.15)'
              }}
            >
              <div style={{
                width: 72, height: 72, borderRadius: '50%',
                background: 'rgba(251,191,36,0.1)',
                border: '2px solid #fbbf24',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 1.5rem'
              }}>
                <Award size={36} color="#fbbf24" className="pulse-slow" />
              </div>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'white', marginBottom: '0.5rem', fontFamily: "'Space Grotesk', sans-serif" }}>Badge Unlocked!</h3>
              <p style={{ fontSize: '1.05rem', color: '#fbbf24', fontWeight: 700 }}>{unlockedBadge.name}</p>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.86rem', margin: '0.75rem 0 1.5rem', lineHeight: 1.5 }}>
                {unlockedBadge.desc}
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                <span style={{ padding: '0.35rem 0.75rem', borderRadius: 10, background: 'var(--color-surface-2)', fontSize: '0.76rem', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}>
                  🎉 +200 XP Awarded
                </span>
              </div>
              <button className="btn-primary" onClick={() => setShowBadgeUnlock(false)} style={{ width: '100%', marginTop: '1.5rem' }}>
                Awesome!
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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

        {/* Dashboard Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.75rem', alignItems: 'start' }} className="gps-grid">
          
          {/* Left Column: Switcher & Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Filter Switcher Menu */}
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

            {/* Search Input */}
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

            {/* Main Cards Feed */}
            {loading ? (
              <div style={{ textAlign: 'center', padding: '5rem 0', color: 'var(--color-text-muted)' }}>
                <div className="roadmap-loading-dots" style={{ margin: '0 auto 1rem' }}><span /><span /><span /></div>
                Scanning career dimensions for matched roles...
              </div>
            ) : filteredOpps.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem 2rem' }} className="glass-card">
                <Compass size={48} color="var(--color-text-muted)" style={{ opacity: 0.3, margin: '0 auto 1rem', display: 'block' }} />
                <h4 style={{ fontWeight: 700, color: 'var(--color-text)', marginBottom: '0.25rem' }}>No Opportunities Found</h4>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Try clearing your search or switching categories.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
                {filteredOpps.map(opp => {
                  const Icon = CATEGORY_ICONS[opp.type] || Briefcase;
                  const catColor = CATEGORY_COLORS[opp.type] || '#8899b0';
                  const deadlineStyle = getDeadlineConfig(opp.deadline);

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
                      {/* Top Row: Category badge & Match score */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: '0.4rem',
                          padding: '0.25rem 0.6rem', borderRadius: 8,
                          background: catColor + '12', border: `1px solid ${catColor}25`,
                          color: catColor, fontSize: '0.72rem', fontWeight: 700, textTransform: 'capitalize'
                        }}>
                          <Icon size={12} color={catColor} /> {opp.type}
                        </div>
                        
                        {/* Radial match badge */}
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: '0.2rem',
                          padding: '0.25rem 0.5rem', borderRadius: 8,
                          background: 'var(--color-primary-glow)', border: '1px solid rgba(14,165,233,0.2)',
                          color: 'var(--color-primary-light)', fontSize: '0.76rem', fontWeight: 800
                        }}>
                          <Sparkles size={11} color="var(--color-primary-light)" /> {opp.matchScore}% Match
                        </div>
                      </div>

                      {/* Opportunity Title & Organization */}
                      <div>
                        <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: 'white', lineHeight: 1.4 }}>{opp.title}</h4>
                        <p style={{ margin: '0.15rem 0 0.75rem 0', fontSize: '0.78rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>{opp.organization}</p>
                        
                        {/* Why recommended reasons */}
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

                      {/* Bottom Row: Deadline & action icons */}
                      <div style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        borderTop: '1px solid var(--color-border)', paddingTop: '0.75rem', marginTop: '0.5rem'
                      }}>
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: '0.35rem',
                          padding: '0.2rem 0.5rem', borderRadius: 6,
                          background: deadlineStyle.bg, color: deadlineStyle.color,
                          border: deadlineStyle.border || 'none',
                          fontSize: '0.72rem', fontWeight: 700
                        }}>
                          <Calendar size={11} /> {deadlineStyle.label}
                        </div>

                        {/* Interactive Buttons */}
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
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
                          
                          <button
                            className="btn-primary"
                            onClick={(e) => handleApply(opp._id, opp.applicationUrl, e)}
                            style={{
                              padding: '0.35rem 0.75rem', borderRadius: 8, fontSize: '0.74rem',
                              display: 'flex', alignItems: 'center', gap: '0.25rem'
                            }}
                          >
                            {opp.applied ? 'Applied' : <><ExternalLink size={12} /> Apply</>}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

          </div>

          {/* Right Column: Sara AI Assistant Sidebar Box */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Sara Career Navigator */}
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
                <p style={{ margin: '0 0 0.75rem 0' }}>
                  Hi! I'm monitoring the global pipelines. Based on your active GPS coordinates, here is what I found:
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  <div style={{ padding: '0.6rem', background: 'rgba(14,165,233,0.06)', borderRadius: 10, borderLeft: '3px solid var(--color-primary)' }}>
                    🔥 <strong>Devpost AI Hackathon</strong> aligns with your Python projects. Only 4 days left to join!
                  </div>
                  <div style={{ padding: '0.6rem', background: 'rgba(245,158,11,0.06)', borderRadius: 10, borderLeft: '3px solid #f59e0b' }}>
                    📦 <strong>Google Summer of Code</strong> matches your open-source path requirements.
                  </div>
                  <div style={{ padding: '0.6rem', background: 'rgba(16,185,129,0.06)', borderRadius: 10, borderLeft: '3px solid #10b981' }}>
                    🏆 Applying to high-match hackathons can boost your job-readiness score by up to <strong>15%</strong>.
                  </div>
                </div>
              </div>
            </div>

            {/* Radar Audit & Stats Box */}
            <div className="glass-card" style={{ padding: '1.25rem' }}>
              <h4 style={{ fontWeight: 800, fontSize: '0.82rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '1rem', letterSpacing: '0.04em' }}>
                Radar Performance
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', fontSize: '0.82rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Opportunities Crawled</span>
                  <span style={{ fontWeight: 700 }}>147</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Duplicate Matches Merged</span>
                  <span style={{ fontWeight: 700, color: 'var(--color-primary-light)' }}>23</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Global Source Trust Rating</span>
                  <span style={{ fontWeight: 700, color: '#10b981' }}>98.2%</span>
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
                {/* Header title */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem' }}>
                  <div>
                    <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.25rem', color: 'white', fontFamily: "'Space Grotesk', sans-serif" }}>{selectedOpp.title}</h3>
                    <p style={{ margin: '0.2rem 0 0 0', fontWeight: 600, color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>{selectedOpp.organization}</p>
                  </div>
                  <button className="btn-ghost" onClick={() => setSelectedOpp(null)} style={{ padding: '0.25rem', borderRadius: 8 }}>
                    <X size={18} color="var(--color-text-muted)" />
                  </button>
                </div>

                {/* Match score bar */}
                <div style={{
                  background: 'rgba(14,165,233,0.05)', border: '1px solid rgba(14,165,233,0.12)',
                  borderRadius: 12, padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-primary-light)' }}>AI Opportunity Matching:</span>
                  <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'white' }}>{selectedOpp.matchScore}% Score</span>
                </div>

                {/* Description */}
                <div>
                  <h5 style={{ margin: '0 0 0.4rem 0', textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: '0.04em', color: 'var(--color-text-muted)' }}>Description</h5>
                  <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--color-text-dim)', lineHeight: 1.5 }}>{selectedOpp.description}</p>
                </div>

                {/* Details layout */}
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

                {/* Required Skills */}
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

                {/* Source validation */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '0.4rem', borderTop: '1px solid var(--color-border)',
                  paddingTop: '1rem', marginTop: '0.5rem', fontSize: '0.72rem', color: 'var(--color-text-muted)'
                }}>
                  <ShieldCheck size={14} color="#10b981" /> 
                  <span>Source: <strong>{selectedOpp.source || 'Verified Partner'}</strong> (Reliability Score: 100/100)</span>
                </div>

                {/* Modal actions */}
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button
                    className="btn-ghost"
                    onClick={(e) => handleDismiss(selectedOpp._id, e)}
                    style={{ flex: 1, color: 'var(--color-error)', border: '1px solid rgba(239,68,68,0.2)' }}
                  >
                    Hide/Dismiss Recommendation
                  </button>
                  
                  <button
                    className="btn-primary"
                    onClick={(e) => handleApply(selectedOpp._id, selectedOpp.applicationUrl, e)}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                  >
                    <ExternalLink size={14} /> {selectedOpp.applied ? 'Apply Again' : 'Apply Now'}
                  </button>
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
