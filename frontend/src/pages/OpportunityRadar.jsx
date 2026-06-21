import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../components/Sidebar';
import api from '../services/api';
import { formatExternalUrl } from '../utils/url';
import {
  Compass, Search, Bookmark, BookmarkCheck, ExternalLink, Calendar, Check,
  X, AlertTriangle, ShieldCheck, Award, Zap, RefreshCw, Sparkles, GraduationCap,
  Users, Code, CheckCircle2, ShieldAlert, ChevronLeft, ChevronRight,
  TrendingUp, Activity, Eye, CheckSquare, BookOpen, FileText, Clock, Sparkle,
  Loader2
} from 'lucide-react';

const CATEGORY_ICONS = {
  'hackathon': Code,
  'scholarship': GraduationCap,
  'competition': Award,
  'open-source': Code,
  'fellowship': Users,
  'course': BookOpen,
  'certification': FileText,
  'quiz': CheckSquare
};

const CATEGORY_COLORS = {
  'hackathon': '#a855f7',
  'scholarship': '#fbbf24',
  'competition': '#ec4899',
  'open-source': '#f59e0b',
  'fellowship': '#06b6d4',
  'course': '#10b981',
  'certification': '#3b82f6',
  'quiz': '#8b5cf6'
};

const TABS = [
  { id: 'recommended', label: 'Recommended' },
  { id: 'high-match', label: 'High Match' },
  { id: 'recent', label: 'Recently Added' },
  { id: 'closing-soon', label: 'Closing Soon' },
  { id: 'hackathon', label: 'Hackathons' },
  { id: 'competition', label: 'Competitions' },
  { id: 'scholarship', label: 'Scholarships' },
  { id: 'fellowship', label: 'Fellowships' },
  { id: 'open-source', label: 'Open Source' },
  { id: 'course', label: 'Free Courses' },
  { id: 'certification', label: 'Free Certifications' },
  { id: 'quiz', label: 'Quizzes & Challenges' },
  { id: 'registered', label: 'Registered' },
  { id: 'saved', label: 'Saved' },
  { id: 'applied', label: 'Applied' }
];

const SCAN_STEPS = [
  'Checking Devpost...',
  'Checking MLH...',
  'Checking Kaggle...',
  'Checking Unstop...',
  'Checking Google Programs...',
  'Checking Microsoft Learn...',
  'Checking AWS Educate...',
  'Checking GitHub Education...',
  'Checking Coursera Free Programs...',
  'Checking MIT OpenCourseWare...'
];

const OpportunityRadar = () => {
  const [sc, setSc] = useState(false);
  const [opportunities, setOpportunities] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [stats, setStats] = useState({
    hackathonsOpen: 0,
    scholarshipsOpen: 0,
    coursesAvailable: 0,
    deadlinesThisWeek: 0,
    applicationsSubmitted: 0,
    avgMatchScore: 85
  });
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [scanStepIdx, setScanStepIdx] = useState(0);
  const [activeTab, setActiveTab] = useState('recommended');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOpp, setSelectedOpp] = useState(null);
  const [toasts, setToasts] = useState([]);
  
  // Confirmed mark applied state
  const [showApplyConfirm, setShowApplyConfirm] = useState(false);
  const [confirmOppId, setConfirmOppId] = useState(null);

  // Success Modal State for Applied Opportunity
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [congratsMsg, setCongratsMsg] = useState('');

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
      
      const { data: remData } = await api.get('/opportunities/reminders').catch(() => ({ data: { success: false } }));
      if (remData?.success) {
        setReminders(remData.data || []);
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
        showToast(data.bookmarked ? '📌 Opportunity Saved!' : 'Opportunity removed from bookmarks');
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
      const { data } = await api.post(`/opportunities/${confirmOppId}/register`);
      if (data.success) {
        setOpportunities(prev => prev.map(opp => 
          opp._id === confirmOppId ? { ...opp, registered: true, applied: true } : opp
        ));
        setStats(prev => ({
          ...prev,
          applicationsSubmitted: prev.applicationsSubmitted + 1
        }));
        
        if (data.xpAwarded) {
          setCongratsMsg('Opportunity registered successfully! +50 XP Earned! 🚀');
          setShowSuccessOverlay(true);
        } else {
          showToast('🎉 Registered successfully');
        }
        
        const { data: remData } = await api.get('/opportunities/reminders').catch(() => ({ data: { success: false } }));
        if (remData?.success) {
          setReminders(remData.data || []);
        }
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to record registration.', 'error');
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

  const handleViewOpportunity = async (oppId) => {
    // Check if we already have it in the local list
    const opp = opportunities.find(o => o._id === oppId);
    if (opp) {
      setSelectedOpp(opp);
      return;
    }

    // Otherwise fetch the specific opportunity details from the backend
    try {
      const { data } = await api.get(`/opportunities/${oppId}`);
      if (data.success && data.data) {
        setSelectedOpp(data.data);
      } else {
        showToast('Opportunity details could not be found.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error loading opportunity details.', 'error');
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
    if (!deadline) return { label: 'Open Registration', color: '#10b981', bg: 'rgba(16,185,129,0.08)' };
    
    const days = getDaysLeft(deadline);
    if (days <= 0) return { label: 'Expired', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' };
    if (days === 1) return { label: '⚠️ 1 Day Left', color: '#ef4444', bg: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)' };
    if (days <= 3) return { label: `⏳ ${days} Days Left`, color: '#f87171', bg: 'rgba(239,68,68,0.08)' };
    if (days <= 7) return { label: `📅 ${days} Days Left`, color: '#fbbf24', bg: 'rgba(245,158,11,0.08)' };
    return { label: `📅 ${days} Days Left`, color: '#10b981', bg: 'rgba(16,185,129,0.08)' };
  };

  // Client-side filtering & sorting
  const filteredOpps = opportunities.filter(opp => {
    const matchesSearch = 
      opp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      opp.organization.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (opp.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (opp.requiredSkills || []).some(s => s.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (opp.tags || []).some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (activeTab === 'recommended' || activeTab === 'recent') return true;
    if (activeTab === 'high-match') return (opp.matchScore || 0) >= 80;
    if (activeTab === 'closing-soon') {
      const days = getDaysLeft(opp.submissionDeadline || opp.deadline);
      return days > 0 && days <= 30;
    }
    if (activeTab === 'saved') return opp.bookmarked;
    if (activeTab === 'applied') return opp.applied;
    if (activeTab === 'registered') return opp.registered;
    return opp.type === activeTab;
  });

  const displayOpps = [...filteredOpps];
  if (activeTab === 'recent') {
    displayOpps.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  } else {
    displayOpps.sort((a, b) => b.matchScore - a.matchScore);
  }

  return (
    <div className="app-shell" style={{ overflowY: 'auto', minHeight: '100vh', height: 'auto' }}>
      
      {/* Toast Notification Container */}
      <div style={{ position: 'fixed', top: '1rem', right: '1rem', zIndex: 10000, display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: -15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              style={{
                background: 'var(--color-surface-2)',
                borderLeft: `4px solid ${t.type === 'error' ? '#ef4444' : 'var(--color-success)'}`,
                padding: '0.8rem 1.25rem',
                borderRadius: '8px',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                fontWeight: 600,
                fontSize: '0.85rem'
              }}
            >
              {t.type === 'error' ? <ShieldAlert size={16} color="#ef4444" /> : <CheckCircle2 size={16} color="var(--color-success)" />}
              <span>{t.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Congrats Success Overlay */}
      <AnimatePresence>
        {showSuccessOverlay && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="glass-card" style={{ maxWidth: 420, width: '100%', padding: '2rem', textAlign: 'center', border: '1px solid var(--color-primary-light)' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--color-primary-glow)', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', color: 'var(--color-primary-light)' }}>
                <Award size={36} />
              </div>
              <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: '1.5rem', marginBottom: '0.5rem' }}>Opportunity Registered!</h2>
              <p style={{ color: 'var(--color-text-dim)', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '1.5rem' }}>
                {congratsMsg || 'Your participation has been successfully logged. Keep matching and learning!'}
              </p>
              <button className="btn-primary" onClick={() => setShowSuccessOverlay(false)} style={{ width: '100%', padding: '0.75rem' }}>Let's Go!</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Sidebar collapsed={sc} onToggleCollapse={() => setSc(c => !c)} />
      
      <main className={`app-main ${sc ? 'sidebar-is-collapsed' : ''}`} style={{ overflowY: 'visible', height: 'auto' }}>
        
        {/* Header Title & Refresh Button */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: 44, height: 44, borderRadius: 14, background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-glow-purple)' }}>
                <Compass size={22} color="white" />
              </div>
              <div>
                <h1 style={{ fontSize: '1.6rem', fontWeight: 800, fontFamily: "'Space Grotesk', sans-serif", margin: 0 }}>Nexus <span className="gradient-text">Opportunity Radar</span></h1>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', margin: 0 }}>Discover verified hackathons, competitions, scholarships, open source, and free learning pathways</p>
              </div>
            </div>
            
            <button className="btn-ghost" onClick={() => loadData(true)} disabled={refreshing || loading} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <RefreshCw size={14} className={refreshing ? 'spin' : ''} /> {refreshing ? 'Scanning Global Sources...' : 'Scan Global Radar'}
            </button>
          </div>
        </motion.div>

        {/* Dynamic Opportunity Overview Metrics Row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '1rem',
            marginBottom: '2rem'
          }}
        >
          <div className="glass-card" style={{ padding: '0.85rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', borderLeft: '3px solid var(--color-primary)' }}>
            <span style={{ fontSize: '0.65rem', color: 'var(--color-text-dim)', fontWeight: 700, textTransform: 'uppercase' }}>Hackathons Open</span>
            <span style={{ fontSize: '1.3rem', fontWeight: 800, color: 'white' }}>{stats.hackathonsOpen}</span>
          </div>
          <div className="glass-card" style={{ padding: '0.85rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', borderLeft: '3px solid var(--color-warning)' }}>
            <span style={{ fontSize: '0.65rem', color: 'var(--color-text-dim)', fontWeight: 700, textTransform: 'uppercase' }}>Scholarships Open</span>
            <span style={{ fontSize: '1.3rem', fontWeight: 800, color: 'white' }}>{stats.scholarshipsOpen}</span>
          </div>
          <div className="glass-card" style={{ padding: '0.85rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', borderLeft: '3px solid var(--color-success)' }}>
            <span style={{ fontSize: '0.65rem', color: 'var(--color-text-dim)', fontWeight: 700, textTransform: 'uppercase' }}>Free Courses Available</span>
            <span style={{ fontSize: '1.3rem', fontWeight: 800, color: 'white' }}>{stats.coursesAvailable}</span>
          </div>
          <div className="glass-card" style={{ padding: '0.85rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', borderLeft: '3px solid var(--color-danger)' }}>
            <span style={{ fontSize: '0.65rem', color: 'var(--color-text-dim)', fontWeight: 700, textTransform: 'uppercase' }}>Deadlines This Week</span>
            <span style={{ fontSize: '1.3rem', fontWeight: 800, color: '#f87171' }}>{stats.deadlinesThisWeek}</span>
          </div>
          <div className="glass-card" style={{ padding: '0.85rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', borderLeft: '3px solid var(--color-accent)' }}>
            <span style={{ fontSize: '0.65rem', color: 'var(--color-text-dim)', fontWeight: 700, textTransform: 'uppercase' }}>Applied/Registered</span>
            <span style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-accent-light)' }}>{stats.applicationsSubmitted}</span>
          </div>
        </motion.div>

        {/* Deadline Reminders Section */}
        {reminders.length > 0 && (
          <div className="glass-card" style={{
            padding: '1.25rem',
            borderRadius: 12,
            marginBottom: '1.5rem',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.05) 0%, rgba(245, 158, 11, 0.05) 100%)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <Clock size={18} style={{ color: '#ef4444' }} />
              <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'white', fontFamily: "'Space Grotesk', sans-serif" }}>
                Active Deadline Reminders
              </h3>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, background: '#ef4444', color: 'white', padding: '0.15rem 0.45rem', borderRadius: 12, marginLeft: 'auto' }}>
                {reminders.length} Urgent
              </span>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem' }}>
              {reminders.map(rem => (
                <div key={rem.opportunityId} style={{
                  padding: '0.85rem',
                  borderRadius: 8,
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: `1px solid ${rem.urgency === 'critical' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(255, 255, 255, 0.08)'}`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.35rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      padding: '0.15rem 0.4rem',
                      borderRadius: 4,
                      background: rem.urgency === 'critical' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.1)',
                      color: rem.urgency === 'critical' ? '#ef4444' : '#fbbf24'
                    }}>
                      {rem.daysLeft} {rem.daysLeft === 1 ? 'day' : 'days'} left
                    </span>
                    <span style={{ fontSize: '0.62rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                      {rem.type}
                    </span>
                  </div>
                  
                  <h4 style={{ margin: 0, fontSize: '0.82rem', fontWeight: 700, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {rem.title}
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--color-text-dim)' }}>
                    {rem.organization}
                  </p>
                  
                  <div style={{ marginTop: '0.4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.65rem' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>
                      Due: {new Date(rem.deadline).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() => handleViewOpportunity(rem.opportunityId)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--color-primary-light)',
                        fontWeight: 700,
                        cursor: 'pointer',
                        padding: 0
                      }}
                    >
                      View Link
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Global Opportunity Sources Panel */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>🌐 Verified Global Sources Searched</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', opacity: 0.85 }}>
            {['Devpost', 'MLH', 'Kaggle', 'Unstop', 'Google Programs', 'Microsoft Learn', 'AWS Educate', 'GitHub Education', 'GSoC', 'Outreachy', 'LFX', 'Coursera Free', 'edX'].map(src => (
              <span key={src} style={{ padding: '0.3rem 0.6rem', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text-dim)', fontSize: '0.72rem', borderRadius: '6px', fontWeight: 600 }}>
                {src}
              </span>
            ))}
          </div>
        </div>

        {/* Search Input Bar */}
        <div className="glass-card" style={{ padding: '0.85rem 1.25rem', display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem', border: '1px solid var(--color-border)' }}>
          <Search size={18} style={{ color: 'var(--color-text-muted)' }} />
          <input
            className="input"
            placeholder="Search hackathons, scholarships, coding challenges..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', border: 'none', background: 'none', padding: 0 }}
          />
        </div>

        {/* Category Navigation Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.75rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border)' }}>
          {TABS.map(tab => {
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '0.4rem 0.85rem',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  border: isSelected ? '1px solid var(--color-primary-light)' : '1px solid transparent',
                  background: isSelected ? 'var(--color-primary-glow)' : 'none',
                  color: isSelected ? 'var(--color-primary-light)' : 'var(--color-text-dim)',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Dynamic Learning Challenges "Learn & Earn" Banner */}
        {activeTab === 'course' || activeTab === 'certification' || activeTab === 'recommended' ? (
          <div style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(59, 130, 246, 0.08) 100%)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            padding: '1.25rem',
            borderRadius: 12,
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '0.6rem', borderRadius: '50%', color: 'var(--color-success)' }}>
                <Sparkle size={24} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'white', fontFamily: "'Space Grotesk', sans-serif" }}>Learn & Earn Program Available</h3>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--color-text-dim)' }}>
                  Participate in free certification tracks or learning challenges to earn badges and verified profile scores.
                </p>
              </div>
            </div>
            <span style={{ fontSize: '0.7rem', fontWeight: 800, background: 'var(--color-success)', color: '#fff', padding: '0.25rem 0.6rem', borderRadius: 4 }}>FREE ACCREDITED</span>
          </div>
        ) : null}

        {/* Content Display Grid */}
        <AnimatePresence mode="wait">
          {loading ? (
            <div style={{ padding: '5rem 0', textAlign: 'center' }}>
              <Loader2 size={36} className="spin" style={{ color: 'var(--color-primary)', margin: '0 auto 1.25rem' }} />
              <p style={{ color: 'var(--color-text-dim)', fontSize: '0.9rem' }}>{SCAN_STEPS[scanStepIdx]}</p>
            </div>
          ) : displayOpps.length === 0 ? (
            <div style={{ padding: '5rem 0', textAlign: 'center', color: 'var(--color-text-dim)', maxWidth: 420, margin: '0 auto' }}>
              <Activity size={48} style={{ opacity: 0.15, margin: '0 auto 1rem', display: 'block' }} />
              <h3 style={{ fontWeight: 700, color: 'white', marginBottom: '0.5rem' }}>No matching opportunities</h3>
              <p style={{ fontSize: '0.85rem' }}>Our scanner is active. We filter out expired listings automatically. Try clearing search keywords or selecting another category.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '1.25rem' }}>
              {displayOpps.map(opp => {
                const Icon = CATEGORY_ICONS[opp.type] || Code;
                const deadlineCfg = getDeadlineConfig(opp);
                const isClosingSoon = opp.deadline && getDaysLeft(opp.deadline) <= 3;
                
                // Priority badges
                const priorityBadge = isClosingSoon ? '⚡ Closing Soon' : opp.matchScore >= 90 ? '🔥 High Priority' : '⭐ Recommended';

                return (
                  <motion.div
                    key={opp._id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="glass-card dashboard-card"
                    onClick={() => setSelectedOpp(opp)}
                    style={{
                      padding: '1.25rem',
                      borderRadius: 12,
                      cursor: 'pointer',
                      border: '1px solid var(--color-border)',
                      position: 'relative',
                      display: 'flex',
                      flexDirection: 'column',
                      height: '100%'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          background: `${opp.type === 'scholarship' ? 'rgba(245,158,11,0.1)' : 'rgba(124,58,237,0.1)'}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: CATEGORY_COLORS[opp.type] || '#a855f7'
                        }}>
                          <Icon size={16} />
                        </div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--color-text-dim)', fontWeight: 700, textTransform: 'uppercase' }}>
                          {opp.type}
                        </span>
                      </div>

                      <button
                        onClick={(e) => handleToggleBookmark(opp._id, e)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: opp.bookmarked ? 'var(--color-warning)' : 'var(--color-text-muted)' }}
                      >
                        {opp.bookmarked ? <BookmarkCheck size={20} /> : <Bookmark size={20} />}
                      </button>
                    </div>

                    <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.05rem', fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", color: 'white', lineHeight: 1.3 }}>
                      {opp.title}
                    </h3>
                    
                    <p style={{ margin: '0 0 1rem 0', fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>
                      {opp.organization}
                    </p>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1.25rem' }}>
                      {opp.requiredSkills && opp.requiredSkills.slice(0, 3).map((skill, idx) => (
                        <span key={idx} style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--color-text-dim)', fontSize: '0.65rem', padding: '0.15rem 0.45rem', borderRadius: 4, fontWeight: 600 }}>
                          {skill}
                        </span>
                      ))}
                    </div>

                    <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {/* Priority, deadline & Match Score info */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--color-border)', paddingTop: '0.75rem' }}>
                        <span style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', borderRadius: 4, background: deadlineCfg.bg, color: deadlineCfg.color, fontWeight: 700, border: deadlineCfg.border || 'none' }}>
                          {deadlineCfg.label}
                        </span>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Match:</span>
                          <strong style={{ fontSize: '0.8rem', color: opp.matchScore >= 80 ? 'var(--color-success)' : 'var(--color-accent-light)' }}>
                            {opp.matchScore}%
                          </strong>
                        </div>
                      </div>

                      {/* Verification Badge */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem' }}>
                        <span style={{ color: opp.isVerified ? 'var(--color-success)' : 'var(--color-warning)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: opp.isVerified ? 'var(--color-success)' : 'var(--color-warning)' }} />
                          {opp.isVerified ? 'Verified' : 'Reviewing'}
                        </span>
                        <span style={{ color: 'var(--color-text-muted)' }}>
                          {priorityBadge}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </AnimatePresence>

        {/* Opportunity Detail Drawer/Modal */}
        <AnimatePresence>
          {selectedOpp && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="glass-card"
                style={{ width: '100%', maxWidth: 550, padding: '1.75rem', position: 'relative', border: '1px solid var(--color-border)', maxHeight: '90vh', overflowY: 'auto' }}
              >
                <button
                  onClick={() => setSelectedOpp(null)}
                  style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}
                >
                  <X size={20} />
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                  <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    background: `${selectedOpp.type === 'scholarship' ? 'rgba(245,158,11,0.1)' : 'rgba(124,58,237,0.1)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: CATEGORY_COLORS[selectedOpp.type] || '#a855f7'
                  }}>
                    {(() => {
                      const Icon = CATEGORY_ICONS[selectedOpp.type] || Code;
                      return <Icon size={20} />;
                    })()}
                  </div>
                  <div>
                    <span style={{ fontSize: '0.65rem', color: 'var(--color-text-dim)', fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>{selectedOpp.type} Details</span>
                    <h3 style={{ fontWeight: 800, fontSize: '1.25rem', fontFamily: "'Space Grotesk', sans-serif", margin: 0 }}>{selectedOpp.title}</h3>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-surface-2)', padding: '0.75rem 1rem', borderRadius: 10, border: '1px solid var(--color-border)', marginBottom: '1.25rem' }}>
                  <div>
                    <span style={{ fontSize: '0.65rem', color: 'var(--color-text-dim)', textTransform: 'uppercase', display: 'block' }}>Opportunity Match</span>
                    <strong style={{ fontSize: '1.1rem', color: 'var(--color-accent-light)' }}>{selectedOpp.matchScore}% Match Score</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.65rem', color: 'var(--color-text-dim)', textTransform: 'uppercase', display: 'block', textAlign: 'right' }}>Status</span>
                    <span style={{ fontSize: '0.8rem', color: selectedOpp.isVerified ? 'var(--color-success)' : 'var(--color-warning)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: selectedOpp.isVerified ? 'var(--color-success)' : 'var(--color-warning)' }} />
                      {selectedOpp.isVerified ? '🟢 Verified Live' : '🟡 Pending Review'}
                    </span>
                  </div>
                </div>

                <div style={{ marginBottom: '1.25rem' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'white', marginBottom: '0.4rem' }}>Host Organization</h4>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>{selectedOpp.organization}</p>
                </div>

                <div style={{ marginBottom: '1.25rem' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'white', marginBottom: '0.4rem' }}>Overview</h4>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-dim)', lineHeight: 1.5 }}>
                    {selectedOpp.description || 'Details regarding this opportunity will be validated directly at the official portal.'}
                  </p>
                </div>

                {selectedOpp.whyRecommended && (
                  <div style={{ background: 'var(--color-primary-glow)', padding: '0.85rem', borderRadius: 8, border: '1px solid rgba(124,58,237,0.2)', marginBottom: '1.5rem' }}>
                    <h5 style={{ margin: '0 0 0.35rem 0', fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-primary-light)', textTransform: 'uppercase' }}>Why Recommended</h5>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-dim)' }}>{selectedOpp.whyRecommended}</p>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                  {selectedOpp.registered || selectedOpp.applied ? (
                    <div style={{ flex: 1, padding: '0.75rem', background: 'var(--color-success-glow)', border: '1px solid var(--color-success)', color: 'var(--color-success)', borderRadius: 8, fontSize: '0.85rem', fontWeight: 700, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}>
                      <Check size={16} /> Registered
                    </div>
                  ) : (
                    <>
                      <button
                        className="btn-ghost"
                        onClick={(e) => triggerMarkAppliedFlow(selectedOpp._id, e)}
                        style={{ flex: 1, padding: '0.75rem', fontSize: '0.85rem', fontWeight: 700 }}
                      >
                        Mark Registered
                      </button>
                      <a
                        href={formatExternalUrl(selectedOpp.applicationUrl, `${selectedOpp.title} ${selectedOpp.organization}`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-primary"
                        style={{ flex: 1, padding: '0.75rem', fontSize: '0.85rem', fontWeight: 700, textAlign: 'center', textDecoration: 'none', background: 'var(--color-primary)' }}
                      >
                        Apply Official Link <ExternalLink size={14} style={{ marginLeft: '0.2rem' }} />
                      </a>
                    </>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Mark Applied Confirmation Dialog */}
        <AnimatePresence>
          {showApplyConfirm && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="glass-card" style={{ maxWidth: 400, width: '100%', padding: '1.5rem', border: '1px solid var(--color-border)' }}>
                <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '1.15rem', marginBottom: '0.5rem' }}>Mark Participation</h3>
                <p style={{ color: 'var(--color-text-dim)', fontSize: '0.85rem', lineHeight: 1.5, marginBottom: '1.5rem' }}>
                  Please confirm that you have submitted your details on the official provider portal. Clicking confirm will log this application on your radar and award **+50 XP** to your profile.
                </p>
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                  <button className="btn-ghost" onClick={() => setShowApplyConfirm(false)} style={{ padding: '0.5rem 1rem' }}>Cancel</button>
                  <button className="btn-primary" onClick={handleApply} style={{ padding: '0.5rem 1rem', background: 'var(--color-primary)' }}>Confirm</button>
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
