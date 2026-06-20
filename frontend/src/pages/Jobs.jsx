import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../components/Sidebar';
import { jobService } from '../services/adviceService';
import { resumeService } from '../services/resumeService';
import api from '../services/api';
import { 
  Briefcase, Search, MapPin, Building, DollarSign, 
  ExternalLink, BookmarkPlus, BookmarkCheck, Loader2,
  Sparkles, CheckCircle2, AlertCircle, X, ChevronRight,
  TrendingUp, Star, UploadCloud, FileText, Cpu, AlertTriangle,
  Zap, Award, RefreshCw, BarChart2
} from 'lucide-react';

const CAREER_TRACKS = [
  'Software Engineer',
  'AI Engineer',
  'Data Scientist',
  'Cybersecurity Analyst',
  'Cloud Engineer',
  'Full Stack Developer',
  'Product Manager',
  'UI UX Designer',
  'DevOps Engineer',
  'Business Analyst'
];

const JobsPage = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('discover'); // discover, saved
  
  // Search State
  const [searchRole, setSearchRole] = useState('');
  const [searchLocation, setSearchLocation] = useState('');
  const [isRemote, setIsRemote] = useState(false);
  const [isInternship, setIsInternship] = useState(false);
  
  // Data State
  const [jobs, setJobs] = useState([]);
  const [savedJobs, setSavedJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    jobsMatched: 0,
    applicationsSent: 0,
    interviewsScheduled: 0,
    companiesHiring: 0,
    avgMatchScore: 85
  });
  const [hiringPulse, setHiringPulse] = useState([]);
  
  // Fit Analysis Modal
  const [selectedJob, setSelectedJob] = useState(null);
  const [fitData, setFitData] = useState(null);
  const [fitLoading, setFitLoading] = useState(false);

  // AI Match State
  const [isMatchMode, setIsMatchMode] = useState(false);
  const [userResumes, setUserResumes] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [resumeFile, setResumeFile] = useState(null);

  // Success Modal State for Applied Job
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [congratsMsg, setCongratsMsg] = useState('');

  // Initial load
  useEffect(() => {
    fetchSavedJobs();
    fetchUserResumes();
    handleSearchInitial();
  }, []);

  const fetchUserResumes = async () => {
    try {
      const { data } = await resumeService.getAll();
      if (data && data.data) setUserResumes(data.data);
    } catch (err) { console.error('Failed to fetch resumes', err); }
  };

  const fetchSavedJobs = async () => {
    try {
      const { data } = await jobService.getSavedJobs();
      if (data.success) {
        setSavedJobs(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch saved jobs', err);
    }
  };

  // Initial load (Netflix-style Recommendations without search button click)
  const handleSearchInitial = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await jobService.searchJobs({
        role: '',
        location: '',
        isRemote: false,
        isInternship: false
      });
      if (res.data.success) {
        setJobs(res.data.data);
        if (res.data.stats) setStats(res.data.stats);
        if (res.data.hiringPulse) setHiringPulse(res.data.hiringPulse);
      }
    } catch (err) {
      console.error('Initial load failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e, customRole = null) => {
    e?.preventDefault();
    const queryRole = customRole !== null ? customRole : searchRole;
    if (customRole !== null) {
      setSearchRole(customRole);
    }
    
    setLoading(true);
    setError('');
    setActiveTab('discover');
    
    try {
      let data;
      if (isMatchMode && (selectedResumeId || resumeFile)) {
        const formData = new FormData();
        formData.append('role', queryRole.trim());
        formData.append('location', searchLocation.trim());
        formData.append('isRemote', isRemote);
        formData.append('isInternship', isInternship);
        if (resumeFile) formData.append('resumeFile', resumeFile);
        if (selectedResumeId) formData.append('resumeId', selectedResumeId);
        
        const res = await jobService.aiMatchJobs(formData);
        data = res.data;
      } else {
        const res = await jobService.searchJobs({
          role: queryRole.trim(),
          location: searchLocation.trim(),
          isRemote,
          isInternship
        });
        data = res.data;
      }
      
      if (data.success) {
        setJobs(data.data);
        if (data.stats) setStats(data.stats);
        if (data.hiringPulse) setHiringPulse(data.hiringPulse);
      } else {
        setError(data.message || 'Search failed');
      }
    } catch (err) {
      const errMsg = err?.response?.data?.error ? `: ${err.response.data.error}` : '';
      setError((err?.response?.data?.message || 'Error searching jobs. Please try again.') + errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSave = async (job) => {
    const isSaved = savedJobs.some(s => s.jobId === job.id);
    
    try {
      if (isSaved) {
        await jobService.removeSavedJob(job.id);
        setSavedJobs(prev => prev.filter(s => s.jobId !== job.id));
        showToast('🗑️ Job removed from saved list');
      } else {
        const { data } = await jobService.saveJob({
          jobId: job.id,
          title: job.title,
          company: job.company,
          location: job.location,
          salary: job.salary,
          type: job.type,
          platform: job.platform,
          url: job.url,
          matchScore: job.matchScore,
          reasonFit: job.whyRecommended?.join(', ') || ''
        });
        if (data.success) {
          setSavedJobs(prev => [data.data, ...prev]);
          showToast('📌 Job saved successfully!');
        }
      }
    } catch (err) {
      console.error('Failed to toggle save:', err);
    }
  };

  const handleUpdateStatus = async (jobId, newStatus) => {
    try {
      const { data } = await api.post(`/jobs/saved/${jobId}/status`, { status: newStatus });
      if (data.success) {
        setSavedJobs(prev => prev.map(s => s.jobId === jobId ? { ...s, status: newStatus } : s));
        if (newStatus === 'applied') {
          setCongratsMsg(data.message || 'Job marked as applied! +50 XP earned.');
          setShowSuccessOverlay(true);
        } else {
          showToast(`Job status updated to: ${newStatus}`);
        }
      }
    } catch (err) {
      console.error('Failed to update status:', err);
      showToast('Could not update application status.', 'error');
    }
  };

  const handleAnalyzeFit = async (job) => {
    setSelectedJob(job);
    setFitLoading(true);
    setFitData(null);
    
    try {
      const { data } = await jobService.analyzeFit({
        jobTitle: job.title,
        jobSkills: job.skills || ['General'],
        userSkills: ['JavaScript', 'React', 'Node.js'] 
      });
      if (data.success) {
        setFitData(data.data);
      }
    } catch (err) {
      console.error('Failed to analyze fit', err);
    } finally {
      setFitLoading(false);
    }
  };

  // Toast Handler helper
  const [toasts, setToasts] = useState([]);
  const showToast = (message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  // UI Components
  const PlatformTag = ({ platform }) => {
    let color = 'var(--color-primary-light)';
    let bg = 'var(--color-primary-glow)';
    const p = (platform || '').toLowerCase();
    
    if (p.includes('linkedin')) { color = '#0a66c2'; bg = 'rgba(10, 102, 194, 0.15)'; }
    else if (p.includes('indeed')) { color = '#2164f4'; bg = 'rgba(33, 100, 244, 0.15)'; }
    else if (p.includes('wellfound') || p.includes('angellist')) { color = '#06B6D4'; bg = 'var(--color-secondary-glow)'; }
    else if (p.includes('glassdoor')) { color = '#0caa41'; bg = 'rgba(12, 170, 65, 0.15)'; }
    else if (p.includes('internshala')) { color = '#ec4899'; bg = 'rgba(236, 72, 153, 0.12)'; }

    return (
      <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 700, color, background: bg, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {platform || 'External'}
      </span>
    );
  };

  const JobCard = ({ job, isSavedView = false }) => {
    const internalId = isSavedView ? job.jobId : job.id;
    const isSaved = isSavedView || savedJobs.some(s => s.jobId === internalId);
    const savedJobInstance = savedJobs.find(s => s.jobId === internalId);
    const currentStatus = savedJobInstance?.status || 'saved';

    return (
      <motion.div 
        initial={{ opacity: 0, y: 15 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="glass-card dashboard-card" 
        style={{ padding: '1.25rem', position: 'relative', display: 'flex', flexDirection: 'column', height: '100%', border: '1px solid var(--color-border)' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <PlatformTag platform={job.platform} />
              <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>{job.type}</span>
            </div>
            
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", lineHeight: 1.3, marginBottom: '0.25rem', color: 'var(--color-text)' }}>
              {job.title}
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
              <Building size={14} style={{ color: 'var(--color-secondary)' }} /> {job.company}
              {job.companyRating && <span style={{ color: '#fbbf24', marginLeft: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.1rem' }}><Star size={12} fill="#fbbf24" /> {job.companyRating}</span>}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
            <button 
              onClick={() => handleToggleSave({ ...job, id: internalId })}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: isSaved ? 'var(--color-success)' : 'var(--color-text-muted)' }}
              title={isSaved ? "Remove Saved" : "Save Job"}
            >
              {isSaved ? <BookmarkCheck size={22} /> : <BookmarkPlus size={22} />}
            </button>
            {job.matchScore !== undefined && (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                width: 38, 
                height: 38, 
                borderRadius: '50%', 
                border: `3px solid ${job.matchScore >= 80 ? 'var(--color-success)' : job.matchScore >= 65 ? 'var(--color-accent)' : '#fca5a5'}`, 
                fontWeight: 800, 
                fontSize: '0.75rem', 
                background: 'var(--color-surface-2)',
                color: '#fff'
              }}>
                {job.matchScore}%
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', fontSize: '0.8rem', color: 'var(--color-text-dim)', marginBottom: '1rem' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><MapPin size={14} /> {job.location}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--color-success)' }}><DollarSign size={14} /> {job.salary || 'Competitive'}</span>
        </div>

        {/* Dynamic job metadata */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', background: 'var(--color-surface-2)', padding: '0.6rem', borderRadius: 8, fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '1rem', border: '1px solid var(--color-border)' }}>
          <div>Exp: <strong style={{ color: 'var(--color-text)' }}>{job.experienceLevel || 'Mid-level'}</strong></div>
          <div>Location: <strong style={{ color: 'var(--color-text)' }}>{job.remoteHybridOnsite || 'Remote'}</strong></div>
          <div>Positions: <strong style={{ color: 'var(--color-text)' }}>{job.openPositions || 1} Open</strong></div>
          <div>Deadline: <strong style={{ color: 'var(--color-primary)' }}>{job.applicationDeadline || 'Apply Soon'}</strong></div>
        </div>

        {/* Why Recommended tags */}
        {job.whyRecommended && job.whyRecommended.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginBottom: '1rem' }}>
            {job.whyRecommended.map((tag, idx) => (
              <span key={idx} style={{ background: 'var(--color-primary-glow)', color: 'var(--color-primary-light)', fontSize: '0.65rem', padding: '0.15rem 0.45rem', borderRadius: '4px', fontWeight: 600 }}>
                ✓ {tag}
              </span>
            ))}
          </div>
        )}

        {/* Career Readiness Gauge */}
        {job.readinessScore !== undefined && (
          <div style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-dim)', textTransform: 'uppercase' }}>AI Career Readiness</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-accent-light)' }}>{job.readinessScore}%</span>
            </div>
            <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden', marginBottom: '0.5rem' }}>
              <div style={{ height: '100%', width: `${job.readinessScore}%`, background: 'var(--gradient-primary)', borderRadius: 2 }} />
            </div>
            {job.missingSkills && job.missingSkills.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', alignItems: 'center', marginTop: '0.4rem' }}>
                <span style={{ fontSize: '0.65rem', color: '#fca5a5', display: 'flex', alignItems: 'center', gap: '0.1rem' }}><AlertTriangle size={10} /> Missing:</span>
                {job.missingSkills.slice(0, 3).map((s, idx) => (
                  <span key={idx} style={{ background: 'rgba(252,165,165,0.08)', color: '#fca5a5', fontSize: '0.6rem', padding: '0.05rem 0.3rem', borderRadius: '3px' }}>{s}</span>
                ))}
                <a href="/skill-trends" style={{ fontSize: '0.65rem', color: 'var(--color-accent-light)', textDecoration: 'none', marginLeft: 'auto', fontWeight: 600 }}>Learn →</a>
              </div>
            )}
          </div>
        )}

        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {!isSavedView && (
              <button 
                className="btn-ghost" 
                onClick={() => handleAnalyzeFit(job)} 
                style={{ flex: 1, padding: '0.6rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
              >
                <Sparkles size={14} className="gradient-text" /> AI Fit
              </button>
            )}
            <a 
              href={job.url || '#'} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="btn-primary" 
              style={{ flex: 1, padding: '0.6rem', fontSize: '0.8rem', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', textDecoration: 'none', background: 'var(--color-primary)' }}
            >
              Apply Now <ExternalLink size={14} />
            </a>
          </div>

          {/* Applied Status Controller */}
          {isSaved && (
            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--color-text-dim)' }}>Status:</span>
              <select 
                value={currentStatus} 
                onChange={(e) => handleUpdateStatus(internalId, e.target.value)}
                style={{
                  background: 'var(--color-surface-3)',
                  border: '1px solid var(--color-border)',
                  color: currentStatus === 'applied' ? 'var(--color-success)' : 'var(--color-text)',
                  padding: '0.2rem 0.5rem',
                  borderRadius: 6,
                  fontSize: '0.75rem',
                  outline: 'none',
                  fontWeight: 600
                }}
              >
                <option value="saved">Saved (Pending)</option>
                <option value="applied">Applied (Submit)</option>
                <option value="interviewing">Interviewing</option>
                <option value="offered">Offered 🚀</option>
                <option value="rejected">Archived/Rejected</option>
              </select>
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="app-shell">
      <Sidebar collapsed={collapsed} onToggleCollapse={() => setCollapsed(!collapsed)} />
      
      <main className={`app-main ${collapsed ? 'sidebar-is-collapsed' : ''}`}>
        
        {/* Toast Container */}
        <div style={{ position: 'fixed', top: '1rem', right: '1rem', zIndex: 1000, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {toasts.map(t => (
            <div key={t.id} style={{ background: t.type === 'error' ? '#ef4444' : 'var(--color-surface-2)', borderLeft: `4px solid ${t.type === 'error' ? '#b91c1c' : 'var(--color-success)'}`, padding: '0.75rem 1rem', borderRadius: '6px', color: '#fff', fontSize: '0.85rem', boxShadow: '0 4px 12px rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {t.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
              {t.message}
            </div>
          ))}
        </div>

        {/* Congrats Success Overlay */}
        <AnimatePresence>
          {showSuccessOverlay && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="glass-card" style={{ maxWidth: 420, width: '100%', padding: '2rem', textAlign: 'center', border: '1px solid var(--color-primary-light)' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--color-primary-glow)', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', color: 'var(--color-primary-light)' }}>
                  <Award size={36} />
                </div>
                <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: '1.5rem', marginBottom: '0.5rem' }}>Application Submitted!</h2>
                <p style={{ color: 'var(--color-text-dim)', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '1.5rem' }}>
                  {congratsMsg || 'Your job progress is recorded. Keep up the high readiness track!'}
                </p>
                <button className="btn-primary" onClick={() => setShowSuccessOverlay(false)} style={{ width: '100%', padding: '0.75rem' }}>Let's Go!</button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* HEADER SECTION */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-glow-purple)' }}>
              <Briefcase size={22} color="white" />
            </div>
            <div>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 800, fontFamily: "'Space Grotesk', sans-serif", margin: 0 }}>Nexus <span className="gradient-text">Job Discovery Engine</span></h1>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', margin: 0 }}>Automated real-time job discovery, matching, and application ecosystem</p>
            </div>
          </div>

          {/* STATISTICS ROW */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
            gap: '1rem',
            marginBottom: '1.5rem'
          }}>
            <div className="glass-card" style={{ padding: '0.85rem 1.25rem', borderRadius: 10, borderLeft: '3px solid var(--color-primary)' }}>
              <span style={{ fontSize: '0.65rem', color: 'var(--color-text-dim)', textTransform: 'uppercase', display: 'block', fontWeight: 700 }}>Jobs Matched</span>
              <strong style={{ fontSize: '1.25rem', color: 'var(--color-text)' }}>{stats.jobsMatched}</strong>
            </div>
            <div className="glass-card" style={{ padding: '0.85rem 1.25rem', borderRadius: 10, borderLeft: '3px solid var(--color-success)' }}>
              <span style={{ fontSize: '0.65rem', color: 'var(--color-text-dim)', textTransform: 'uppercase', display: 'block', fontWeight: 700 }}>Applications Sent</span>
              <strong style={{ fontSize: '1.25rem', color: 'var(--color-success)' }}>{stats.applicationsSent}</strong>
            </div>
            <div className="glass-card" style={{ padding: '0.85rem 1.25rem', borderRadius: 10, borderLeft: '3px solid var(--color-accent)' }}>
              <span style={{ fontSize: '0.65rem', color: 'var(--color-text-dim)', textTransform: 'uppercase', display: 'block', fontWeight: 700 }}>Interviews</span>
              <strong style={{ fontSize: '1.25rem', color: 'var(--color-accent-light)' }}>{stats.interviewsScheduled}</strong>
            </div>
            <div className="glass-card" style={{ padding: '0.85rem 1.25rem', borderRadius: 10, borderLeft: '3px solid var(--color-secondary)' }}>
              <span style={{ fontSize: '0.65rem', color: 'var(--color-text-dim)', textTransform: 'uppercase', display: 'block', fontWeight: 700 }}>Companies Hiring</span>
              <strong style={{ fontSize: '1.25rem', color: '#fff' }}>{stats.companiesHiring}</strong>
            </div>
            <div className="glass-card" style={{ padding: '0.85rem 1.25rem', borderRadius: 10, borderLeft: '3px solid var(--color-xp)' }}>
              <span style={{ fontSize: '0.65rem', color: 'var(--color-text-dim)', textTransform: 'uppercase', display: 'block', fontWeight: 700 }}>Average Match</span>
              <strong style={{ fontSize: '1.25rem', color: 'var(--color-xp)' }}>{stats.avgMatchScore}%</strong>
            </div>
          </div>

          {/* SEARCH BAR PANEL */}
          <form onSubmit={handleSearch} className="glass-card" style={{ padding: '1rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', border: '1px solid var(--color-border)' }}>
            <div style={{ flex: '1 1 250px', position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
              <input 
                className="input" 
                placeholder="Job Role, Skill, or Company..." 
                value={searchRole} 
                onChange={(e) => setSearchRole(e.target.value)}
                style={{ paddingLeft: '2.75rem', width: '100%', border: 'none', background: 'var(--color-surface-2)' }} 
              />
            </div>
            <div style={{ flex: '1 1 200px', position: 'relative' }}>
              <MapPin size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
              <input 
                className="input" 
                placeholder="City or Remote..." 
                value={searchLocation} 
                onChange={(e) => setSearchLocation(e.target.value)}
                style={{ paddingLeft: '2.75rem', width: '100%', border: 'none', background: 'var(--color-surface-2)' }} 
              />
            </div>
            
            {/* AI Match Toggle */}
            <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', background: isMatchMode ? 'rgba(124, 58, 237, 0.05)' : 'var(--color-surface)', borderRadius: '12px', border: isMatchMode ? '1px solid rgba(124, 58, 237, 0.3)' : '1px solid var(--color-border)', transition: 'all 0.3s' }}>
               <button type="button" onClick={() => setIsMatchMode(!isMatchMode)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', color: isMatchMode ? 'var(--color-primary-light)' : 'var(--color-text-muted)', fontWeight: 700, fontSize: '0.9rem' }}>
                  <Cpu size={20} /> AI Resume Matcher
               </button>
               
               {isMatchMode && (
                 <div style={{ display: 'flex', flex: 1, gap: '1rem', alignItems: 'center', borderLeft: '1px solid var(--color-border)', paddingLeft: '1rem' }}>
                    <select value={selectedResumeId} onChange={e => { setSelectedResumeId(e.target.value); setResumeFile(null); }} style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)', padding: '0.5rem', borderRadius: '8px', fontSize: '0.8rem', outline: 'none' }}>
                      <option value="">Select a saved resume...</option>
                      {userResumes.map(r => <option key={r._id} value={r._id}>{r.resumeTitle}</option>)}
                    </select>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>OR</span>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.8rem', color: 'var(--color-text-dim)', background: 'var(--color-surface-2)', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px dashed var(--color-border)' }}>
                      <UploadCloud size={16} /> {resumeFile ? resumeFile.name : 'Upload PDF'}
                      <input type="file" accept=".pdf" style={{ display: 'none' }} onChange={e => { if(e.target.files[0]) { setResumeFile(e.target.files[0]); setSelectedResumeId(''); } }} />
                    </label>
                 </div>
               )}
            </div>

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--color-text-dim)' }}>
                <input type="checkbox" checked={isRemote} onChange={(e) => setIsRemote(e.target.checked)} style={{ accentColor: 'var(--color-primary)' }} />
                Remote Only
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--color-text-dim)' }}>
                <input type="checkbox" checked={isInternship} onChange={(e) => setIsInternship(e.target.checked)} style={{ accentColor: 'var(--color-primary)' }} />
                Internships
              </label>
            </div>
            
            <button type="submit" className="btn-primary" disabled={loading} style={{ padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: 'auto', background: 'var(--color-primary)' }}>
              {loading ? <Loader2 size={18} className="spin" /> : <Search size={18} />} 
              {loading ? 'Analyzing...' : 'Find Jobs'}
            </button>
          </form>
          {error && <div style={{ color: '#fca5a5', fontSize: '0.85rem', marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><AlertCircle size={14} /> {error}</div>}
        </motion.div>

        {/* CHOOSE YOUR CAREER TRACK (ROLE SELECTION) */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>Choose Your Career Track</h3>
          <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem', scrollbarWidth: 'none' }}>
            {CAREER_TRACKS.map(track => {
              const isSelected = searchRole === track;
              return (
                <button
                  key={track}
                  onClick={(e) => handleSearch(e, track)}
                  style={{
                    padding: '0.4rem 0.85rem',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    border: isSelected ? '1px solid var(--color-primary-light)' : '1px solid var(--color-border)',
                    background: isSelected ? 'var(--color-primary)' : 'var(--color-surface-2)',
                    color: isSelected ? '#fff' : 'var(--color-text-dim)',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {track}
                </button>
              );
            })}
          </div>
        </div>

        {/* MNC HIRING PULSE */}
        {hiringPulse && hiringPulse.length > 0 && (
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>🔥 Who's Hiring Today (Updated hourly)</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.75rem' }}>
              {hiringPulse.map(pulse => (
                <div
                  key={pulse.company}
                  onClick={(e) => handleSearch(e, pulse.company)}
                  className="glass-card"
                  style={{
                    padding: '0.75rem 1rem',
                    borderRadius: 10,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    borderLeft: `3px solid ${pulse.color || 'var(--color-secondary)'}`,
                    background: 'var(--color-surface-2)',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: 6,
                    background: pulse.color || '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    color: '#fff'
                  }}>
                    {pulse.logoText}
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text)' }}>{pulse.company}</h4>
                    <span style={{ fontSize: '0.7rem', color: 'var(--color-success)', fontWeight: 600 }}>{pulse.openRoles} Positions</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Discover / Saved tabs */}
        <div style={{ display: 'flex', gap: '2rem', borderBottom: '1px solid var(--color-border)', marginBottom: '1.5rem' }}>
          <button 
            onClick={() => setActiveTab('discover')}
            style={{ background: 'none', border: 'none', padding: '0.5rem 0', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600, color: activeTab === 'discover' ? 'var(--color-text)' : 'var(--color-text-muted)', borderBottom: activeTab === 'discover' ? '2px solid var(--color-primary)' : '2px solid transparent' }}
          >
            Recommended Jobs For You {jobs.length > 0 && <span style={{ background: 'var(--color-surface-2)', padding: '0.1rem 0.4rem', borderRadius: 99, fontSize: '0.7rem', marginLeft: '0.4rem' }}>{jobs.length}</span>}
          </button>
          <button 
            onClick={() => { setActiveTab('saved'); fetchSavedJobs(); }}
            style={{ background: 'none', border: 'none', padding: '0.5rem 0', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600, color: activeTab === 'saved' ? 'var(--color-text)' : 'var(--color-text-muted)', borderBottom: activeTab === 'saved' ? '2px solid var(--color-primary)' : '2px solid transparent' }}
          >
            Saved & Applied Applications {savedJobs.length > 0 && <span style={{ background: 'var(--color-surface-2)', padding: '0.1rem 0.4rem', borderRadius: 99, fontSize: '0.7rem', marginLeft: '0.4rem' }}>{savedJobs.length}</span>}
          </button>
        </div>

        {/* Content Area */}
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            {activeTab === 'discover' ? (
              loading ? (
                <div style={{ padding: '4rem 0', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                  <div className="roadmap-loading-dots" style={{ justifyContent: 'center', marginBottom: '1rem' }}><span /><span /><span /></div>
                  <p>Aggregating listings across platforms...</p>
                </div>
              ) : jobs.length === 0 ? (
                <div style={{ padding: '4rem 0', textAlign: 'center', color: 'var(--color-text-muted)', maxWidth: 400, margin: '0 auto' }}>
                  <Search size={48} style={{ opacity: 0.2, margin: '0 auto 1rem', display: 'block' }} />
                  <h3 style={{ fontWeight: 600, marginBottom: '0.5rem', color: 'var(--color-text)' }}>No active matches</h3>
                  <p style={{ fontSize: '0.85rem' }}>Select a track or search above to scan LinkedIn, Glassdoor, Indeed, and Wellfound Careers.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
                  {jobs.map(job => <JobCard key={job.id} job={job} />)}
                </div>
              )
            ) : (
              savedJobs.length === 0 ? (
                <div style={{ padding: '4rem 0', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                  <BookmarkCheck size={48} style={{ opacity: 0.2, margin: '0 auto 1rem', display: 'block' }} />
                  <p>You haven't saved any jobs yet.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
                  {savedJobs.map(job => <JobCard key={job.jobId} job={job} isSavedView={true} />)}
                </div>
              )
            )}
          </motion.div>
        </AnimatePresence>

        {/* AI Fit Analysis Modal */}
        <AnimatePresence>
          {selectedJob && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }} 
                animate={{ opacity: 1, scale: 1 }} 
                exit={{ opacity: 0, scale: 0.95 }}
                className="glass-card"
                style={{ width: '100%', maxWidth: 500, padding: '1.5rem', position: 'relative', border: '1px solid var(--color-border)' }}
              >
                <button 
                  onClick={() => setSelectedJob(null)}
                  style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}
                >
                  <X size={20} />
                </button>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(124, 58, 237, 0.1)', border: '1px solid rgba(124, 58, 237, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Sparkles size={20} color="var(--color-primary-light)" />
                  </div>
                  <div>
                    <h3 style={{ fontWeight: 700, fontSize: '1.1rem', fontFamily: "'Space Grotesk', sans-serif" }}>AI Resume Fit Analysis</h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', margin: 0 }}>{selectedJob.title} @ {selectedJob.company}</p>
                  </div>
                </div>

                {fitLoading ? (
                  <div style={{ padding: '2rem 0', textAlign: 'center' }}>
                    <Loader2 size={32} className="spin" style={{ color: 'var(--color-primary)', margin: '0 auto 1rem', display: 'block' }} />
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Analyzing skill overlap with your profile...</p>
                  </div>
                ) : fitData ? (
                  <div>
                    <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 100, height: 100, borderRadius: '50%', border: `4px solid ${fitData.matchScore > 75 ? 'var(--color-success)' : fitData.matchScore > 50 ? 'var(--color-accent)' : '#fca5a5'}`, background: 'var(--color-surface-2)', marginBottom: '1rem' }}>
                        <span style={{ fontSize: '2rem', fontWeight: 800, fontFamily: "'Space Grotesk', sans-serif" }}>{fitData.matchScore}%</span>
                      </div>
                      <h4 style={{ fontWeight: 600, color: 'var(--color-text)', margin: 0 }}>Match Score</h4>
                    </div>
                    <div style={{ background: 'var(--color-surface-2)', padding: '1rem', borderRadius: 12, border: '1px solid var(--color-border)', fontSize: '0.85rem', color: 'var(--color-text-dim)', lineHeight: 1.6 }}>
                      {fitData.reason}
                    </div>
                    <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
                      <button className="btn-ghost" onClick={() => setSelectedJob(null)} style={{ flex: 1, padding: '0.75rem' }}>Close</button>
                      <a href={selectedJob.url || '#'} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ flex: 1, padding: '0.75rem', textAlign: 'center', textDecoration: 'none', background: 'var(--color-primary)' }}>Apply Now</a>
                    </div>
                  </div>
                ) : (
                  <div style={{ color: '#fca5a5', textAlign: 'center', padding: '2rem 0' }}>Analysis failed. Please try again.</div>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </main>
    </div>
  );
};

export default JobsPage;
