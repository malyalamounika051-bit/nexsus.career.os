import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../components/Sidebar';
import { jobService } from '../services/adviceService';
import { resumeService } from '../services/resumeService';
import { 
  Briefcase, Search, MapPin, Building, DollarSign, 
  ExternalLink, BookmarkPlus, BookmarkCheck, Loader2,
  Sparkles, CheckCircle2, AlertCircle, X, ChevronRight,
  TrendingUp, Star, UploadCloud, FileText, Cpu, AlertTriangle
} from 'lucide-react';

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
  
  // Fit Analysis Modal
  const [selectedJob, setSelectedJob] = useState(null);
  const [fitData, setFitData] = useState(null);
  const [fitLoading, setFitLoading] = useState(false);

  // AI Match State
  const [isMatchMode, setIsMatchMode] = useState(false);
  const [userResumes, setUserResumes] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [resumeFile, setResumeFile] = useState(null);


  useEffect(() => {
    fetchSavedJobs();
    fetchUserResumes();
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

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!searchRole.trim()) {
      setError('Please enter a role or skill to search.');
      return;
    }
    
    setLoading(true);
    setError('');
    setActiveTab('discover');
    
    try {
      let data;
      if (isMatchMode && (selectedResumeId || resumeFile)) {
        const formData = new FormData();
        formData.append('role', searchRole.trim());
        formData.append('location', searchLocation.trim());
        formData.append('isRemote', isRemote);
        formData.append('isInternship', isInternship);
        if (resumeFile) formData.append('resumeFile', resumeFile);
        if (selectedResumeId) formData.append('resumeId', selectedResumeId);
        
        const res = await jobService.aiMatchJobs(formData);
        data = res.data;
      } else {
        const res = await jobService.searchJobs({
          role: searchRole.trim(),
          location: searchLocation.trim(),
          isRemote,
          isInternship
        });
        data = res.data;
      }
      
      if (data.success) {
        setJobs(data.data);
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
      } else {
        const { data } = await jobService.saveJob({
          jobId: job.id,
          title: job.title,
          company: job.company,
          location: job.location,
          salary: job.salary,
          type: job.type,
          platform: job.platform,
          url: job.url
        });
        if (data.success) {
          setSavedJobs(prev => [data.data, ...prev]);
        }
      }
    } catch (err) {
      console.error('Failed to toggle save:', err);
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
        userSkills: ['JavaScript', 'React', 'Node.js'] // Mock user skills or fetch from Context
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

  // UI Components
  const PlatformTag = ({ platform }) => {
    let color = '#8899b0';
    let bg = 'rgba(136, 153, 176, 0.1)';
    const p = (platform || '').toLowerCase();
    
    if (p.includes('linkedin')) { color = '#0a66c2'; bg = 'rgba(10, 102, 194, 0.15)'; }
    else if (p.includes('indeed')) { color = '#2164f4'; bg = 'rgba(33, 100, 244, 0.15)'; }
    else if (p.includes('wellfound') || p.includes('angellist')) { color = '#000000'; bg = 'rgba(255,255,255,0.8)'; }
    else if (p.includes('glassdoor')) { color = '#0caa41'; bg = 'rgba(12, 170, 65, 0.15)'; }

    return (
      <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 600, color, background: bg, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {platform || 'External'}
      </span>
    );
  };

  const JobCard = ({ job, isSavedView = false }) => {
    // Standardize IDs since backend uses jobId for saved jobs and id for raw search results
    const internalId = isSavedView ? job.jobId : job.id;
    const isSaved = isSavedView || savedJobs.some(s => s.jobId === internalId);
    
    return (
      <motion.div 
        initial={{ opacity: 0, y: 15 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="glass-card" 
        style={{ padding: '1.25rem', position: 'relative', display: 'flex', flexDirection: 'column', height: '100%' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <PlatformTag platform={job.platform} />
              <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{job.type}</span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", lineHeight: 1.3, marginBottom: '0.25rem' }}>
                {job.title}
              </h3>
              {job.matchScore !== undefined && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: '50%', border: `3px solid ${job.matchScore >= 80 ? '#10b981' : job.matchScore >= 50 ? '#fbbf24' : '#fca5a5'}`, fontWeight: 800, fontSize: '0.75rem', background: 'var(--color-surface-2)' }}>
                  {job.matchScore}%
                </div>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
              <Building size={14} /> {job.company}
            </div>
          </div>
          <button 
            onClick={() => handleToggleSave({ ...job, id: internalId })}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: isSaved ? '#10b981' : 'var(--color-text-muted)' }}
            title={isSaved ? "Remove Saved" : "Save Job"}
          >
            {isSaved ? <BookmarkCheck size={20} /> : <BookmarkPlus size={20} />}
          </button>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', fontSize: '0.8rem', color: 'var(--color-text-dim)', marginBottom: '1rem' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><MapPin size={14} /> {job.location}</span>
          {job.salary && job.salary !== 'Not specified' && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#10b981' }}><DollarSign size={14} /> {job.salary}</span>
          )}
        </div>

        {!isSavedView && job.skills && job.skills.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginBottom: '1.25rem' }}>
            {job.skills.slice(0, 3).map((s, i) => (
              <span key={i} className="tag" style={{ fontSize: '0.65rem' }}>{s}</span>
            ))}
            {job.skills.length > 3 && <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', alignSelf: 'center' }}>+{job.skills.length - 3}</span>}
          </div>
        )}

        
        {job.reasonFit && (
          <div style={{ background: 'rgba(168, 85, 247, 0.05)', border: '1px solid rgba(168, 85, 247, 0.2)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#a855f7', fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
              <Sparkles size={12} /> AI Insight
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-dim)', lineHeight: 1.4, margin: 0 }}>{job.reasonFit}</p>
            {job.missingSkills && job.missingSkills.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginTop: '0.5rem' }}>
                <span style={{ fontSize: '0.7rem', color: '#fca5a5', display: 'flex', alignItems: 'center', gap: '0.2rem' }}><AlertTriangle size={12}/> Missing:</span>
                {job.missingSkills.map((s, i) => <span key={i} style={{ background: 'rgba(252, 165, 165, 0.1)', color: '#fca5a5', fontSize: '0.65rem', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>{s}</span>)}
              </div>
            )}
          </div>
        )}
<div style={{ marginTop: 'auto', display: 'flex', gap: '0.5rem' }}>
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
            style={{ flex: 1, padding: '0.6rem', fontSize: '0.8rem', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', textDecoration: 'none' }}
          >
            Apply <ExternalLink size={14} />
          </a>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="app-shell">
      <Sidebar collapsed={collapsed} onToggleCollapse={() => setCollapsed(!collapsed)} />
      
      <main className={`app-main ${collapsed ? 'sidebar-is-collapsed' : ''}`}>
        {/* Header section */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(14,165,233,0.3)' }}>
              <Briefcase size={22} color="white" />
            </div>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: "'Space Grotesk', sans-serif" }}>Job <span className="gradient-text">Aggregator</span></h1>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>AI-powered real-time job discovery engine</p>
            </div>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="glass-card" style={{ padding: '1rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
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
                placeholder="City, State, or Country..." 
                value={searchLocation} 
                onChange={(e) => setSearchLocation(e.target.value)}
                style={{ paddingLeft: '2.75rem', width: '100%', border: 'none', background: 'var(--color-surface-2)' }} 
              />
            </div>
            
            
            {/* AI Match Toggle */}
            <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', background: isMatchMode ? 'rgba(168, 85, 247, 0.05)' : 'var(--color-surface)', borderRadius: '12px', border: isMatchMode ? '1px solid rgba(168, 85, 247, 0.3)' : '1px solid var(--color-border)', transition: 'all 0.3s' }}>
               <button type="button" onClick={() => setIsMatchMode(!isMatchMode)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', color: isMatchMode ? '#a855f7' : 'var(--color-text-muted)', fontWeight: 700, fontSize: '0.9rem' }}>
                  <Cpu size={20} /> AI Match Mode
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
            
            <button type="submit" className="btn-primary" disabled={loading} style={{ padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: 'auto' }}>
              {loading ? <Loader2 size={18} className="spin" /> : <Search size={18} />} 
              {loading ? 'Scanning...' : 'Find Jobs'}
            </button>
          </form>
          {error && <div style={{ color: '#fca5a5', fontSize: '0.85rem', marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><AlertCircle size={14} /> {error}</div>}
        </motion.div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '2rem', borderBottom: '1px solid var(--color-border)', marginBottom: '1.5rem' }}>
          <button 
            onClick={() => setActiveTab('discover')}
            style={{ background: 'none', border: 'none', padding: '0.5rem 0', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600, color: activeTab === 'discover' ? 'var(--color-text)' : 'var(--color-text-muted)', borderBottom: activeTab === 'discover' ? '2px solid var(--color-primary)' : '2px solid transparent' }}
          >
            Discover Jobs {jobs.length > 0 && <span style={{ background: 'var(--color-surface-2)', padding: '0.1rem 0.4rem', borderRadius: 99, fontSize: '0.7rem', marginLeft: '0.4rem' }}>{jobs.length}</span>}
          </button>
          <button 
            onClick={() => { setActiveTab('saved'); fetchSavedJobs(); }}
            style={{ background: 'none', border: 'none', padding: '0.5rem 0', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600, color: activeTab === 'saved' ? 'var(--color-text)' : 'var(--color-text-muted)', borderBottom: activeTab === 'saved' ? '2px solid var(--color-primary)' : '2px solid transparent' }}
          >
            Saved Jobs {savedJobs.length > 0 && <span style={{ background: 'var(--color-surface-2)', padding: '0.1rem 0.4rem', borderRadius: 99, fontSize: '0.7rem', marginLeft: '0.4rem' }}>{savedJobs.length}</span>}
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
                  <h3 style={{ fontWeight: 600, marginBottom: '0.5rem', color: 'var(--color-text)' }}>No active search</h3>
                  <p style={{ fontSize: '0.85rem' }}>Enter a role and location above to scan multiple job platforms simultaneously using our AI engine.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
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
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
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
                style={{ width: '100%', maxWidth: 500, padding: '1.5rem', position: 'relative' }}
              >
                <button 
                  onClick={() => setSelectedJob(null)}
                  style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}
                >
                  <X size={20} />
                </button>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Sparkles size={20} color="#a855f7" />
                  </div>
                  <div>
                    <h3 style={{ fontWeight: 700, fontSize: '1.1rem', fontFamily: "'Space Grotesk', sans-serif" }}>AI Resume Fit Analysis</h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{selectedJob.title} @ {selectedJob.company}</p>
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
                      <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 100, height: 100, borderRadius: '50%', border: `4px solid ${fitData.matchScore > 75 ? '#10b981' : fitData.matchScore > 50 ? '#fbbf24' : '#fca5a5'}`, background: 'var(--color-surface-2)', marginBottom: '1rem' }}>
                        <span style={{ fontSize: '2rem', fontWeight: 800, fontFamily: "'Space Grotesk', sans-serif" }}>{fitData.matchScore}%</span>
                      </div>
                      <h4 style={{ fontWeight: 600, color: 'var(--color-text)' }}>Match Score</h4>
                    </div>
                    <div style={{ background: 'var(--color-surface-2)', padding: '1rem', borderRadius: 12, border: '1px solid var(--color-border)', fontSize: '0.85rem', color: 'var(--color-text-dim)', lineHeight: 1.6 }}>
                      {fitData.reason}
                    </div>
                    <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
                      <button className="btn-ghost" onClick={() => setSelectedJob(null)} style={{ flex: 1, padding: '0.75rem' }}>Close</button>
                      <a href={selectedJob.url || '#'} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ flex: 1, padding: '0.75rem', textAlign: 'center', textDecoration: 'none' }}>Apply Now</a>
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
