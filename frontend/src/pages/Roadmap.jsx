import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../components/Sidebar';
import { careerService } from '../services/adviceService';
import api from '../services/api';
import {
  Map, Briefcase, Plus, Sparkles, ChevronDown, ChevronUp, ExternalLink, Trash2,
  CheckCircle2, Circle, Clock, TrendingUp, DollarSign, Lightbulb, BookOpen,
  Wrench, Award, Code, Play, GraduationCap, FileText, Users, Globe, AlertCircle,
  ArrowRight, Shield, Flame, Target, Star, Compass, Terminal, Link
} from 'lucide-react';

const CATEGORY_ICONS = { youtube: Play, course: GraduationCap, docs: FileText, blog: Globe, platform: Code, community: Users, book: BookOpen, other: ExternalLink };
const CATEGORY_COLORS = { youtube: '#ef4444', course: '#a855f7', docs: '#0ea5e9', blog: '#f59e0b', platform: '#10b981', community: '#ec4899', book: '#06b6d4', other: '#8899b0' };
const LOADING_MSGS = ['Scanning destination routes...', 'Configuring GPS coordinates...', 'Plotting checkpoints...', 'Engaging AI career engines...'];

const getRank = (level) => {
  if (level < 5) return { label: 'Explorer', color: '#0ea5e9', bg: 'rgba(14,165,233,0.1)' };
  if (level < 10) return { label: 'Builder', color: '#a855f7', bg: 'rgba(168,85,247,0.1)' };
  if (level < 20) return { label: 'Creator', color: '#fbbf24', bg: 'rgba(251,191,36,0.1)' };
  if (level < 30) return { label: 'Professional', color: '#10b981', bg: 'rgba(16,185,129,0.1)' };
  return { label: 'Career Master', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' };
};

const RoadmapPage = () => {
  const location = useLocation();
  const [sc, setSc] = useState(false);
  const [roadmaps, setRoadmaps] = useState([]);
  const [gps, setGps] = useState(null);
  const [activeCheckpoint, setActiveCheckpoint] = useState(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [loadMsg, setLoadMsg] = useState(0);

  // Project submission state
  const [projName, setProjName] = useState('');
  const [projUrl, setProjUrl] = useState('');
  const [projDesc, setProjDesc] = useState('');
  const [projSubmitting, setProjSubmitting] = useState(false);
  const [projSuccess, setProjSuccess] = useState(false);

  const loadData = async () => {
    setFetching(true);
    try {
      const { data: roadRes } = await careerService.getMyRoadmaps();
      setRoadmaps(roadRes.data || []);

      const { data: gpsRes } = await api.get('/gps/current');
      if (gpsRes.success && gpsRes.data) {
        setGps(gpsRes.data);
        // Set first incomplete checkpoint or first checkpoint as active by default
        const activeCp = gpsRes.data.checkpoints.find(c => !c.completed) || gpsRes.data.checkpoints[0];
        setActiveCheckpoint(activeCp);
      } else {
        setGps(null);
      }
    } catch (err) {
      console.error('Error loading roadmap/GPS data:', err);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (location.state?.prefillCareer) {
      setQuery(location.state.prefillCareer);
      setShowForm(true);
    }
  }, [location.state]);

  useEffect(() => {
    if (!loading) return;
    const iv = setInterval(() => setLoadMsg(m => (m + 1) % LOADING_MSGS.length), 3000);
    return () => clearInterval(iv);
  }, [loading]);

  const handleGenerateGPS = async (careerTitle) => {
    setLoading(true);
    setError('');
    setLoadMsg(0);
    try {
      // First make sure roadmap is generated
      const { data: rdData } = await careerService.generateRoadmap(careerTitle);
      if (rdData.success) {
        // Then generate GPS route based on the roadmap
        const { data: gpsData } = await api.post('/gps/generate', { destination: rdData.data.domain });
        if (gpsData.success) {
          setGps(gpsData.data);
          const activeCp = gpsData.data.checkpoints.find(c => !c.completed) || gpsData.data.checkpoints[0];
          setActiveCheckpoint(activeCp);
          setShowForm(false);
          setQuery('');
          await loadData();
        }
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to initialize GPS route. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTask = async (checkpointLevel, taskTitle, currentStatus) => {
    try {
      const { data } = await api.patch('/gps/task', {
        checkpointLevel,
        taskTitle,
        completed: !currentStatus
      });
      if (data.success) {
        setGps(data.data);
        // Keep active checkpoint in sync
        const updatedCp = data.data.checkpoints.find(c => c.level === checkpointLevel);
        setActiveCheckpoint(updatedCp);
      }
    } catch (err) {
      console.error('Failed to toggle task:', err);
    }
  };

  const handleProjectSubmit = async (e) => {
    e.preventDefault();
    if (!projName.trim() || !projUrl.trim()) return;
    setProjSubmitting(true);
    setProjSuccess(false);
    try {
      const { data } = await api.post('/gps/project', {
        projectName: projName,
        githubUrl: projUrl,
        description: projDesc
      });
      if (data.success) {
        setGps(data.data);
        setProjSuccess(true);
        setProjName('');
        setProjUrl('');
        setProjDesc('');
        setTimeout(() => setProjSuccess(false), 4000);
      }
    } catch (err) {
      console.error('Project submission failed:', err);
    } finally {
      setProjSubmitting(false);
    }
  };

  const handleDeleteGPS = async () => {
    if (!confirm('Are you sure you want to reset your Career GPS? Your progress will be lost.')) return;
    try {
      // Find matching roadmap and delete it
      if (gps) {
        const matchingRoadmap = roadmaps.find(r => r.domain.toLowerCase() === gps.destination.toLowerCase());
        if (matchingRoadmap) {
          await careerService.deleteRoadmap(matchingRoadmap._id);
        }
      }
      // Delete/clear current GPS in local state
      setGps(null);
      setActiveCheckpoint(null);
      await loadData();
    } catch (err) {
      console.error('Reset failed:', err);
    }
  };

  return (
    <div className="app-shell">
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9, x: '-50%' }}
            animate={{ opacity: 1, y: 0, scale: 1, x: '-50%' }}
            exit={{ opacity: 0, y: -20, scale: 0.9, x: '-50%' }}
            style={{
              position: 'fixed',
              top: '2.5rem',
              left: '50%',
              zIndex: 9999,
              background: 'rgba(239, 68, 68, 0.16)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              backdropFilter: 'blur(12px)',
              padding: '0.75rem 1.5rem',
              borderRadius: '12px',
              color: '#fca5a5',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
              fontWeight: 500,
              fontSize: '0.9rem',
            }}
          >
            <AlertCircle size={18} color="#fca5a5" />
            <span>{error}</span>
          </motion.div>
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
                <h1 style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: "'Space Grotesk', sans-serif" }}>AI <span className="gradient-text">Career GPS</span></h1>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Navigate your learning segments like a game progression map</p>
              </div>
            </div>
            {!gps && !showForm && (
              <button className="btn-primary" onClick={() => setShowForm(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Plus size={16} /> New GPS Route
              </button>
            )}
            {gps && (
              <button className="btn-ghost" onClick={handleDeleteGPS} style={{ color: 'var(--color-error)', border: '1px solid rgba(239,68,68,0.2)' }}>
                Reset Route
              </button>
            )}
          </div>
        </motion.div>

        {/* Dynamic Route Form */}
        {showForm && !gps && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card" style={{ padding: '2rem', maxWidth: 600, margin: '0 auto 2rem' }}>
            <h3 style={{ fontWeight: 700, marginBottom: '0.25rem', fontFamily: "'Space Grotesk', sans-serif" }}>Choose Career Destination</h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.82rem', marginBottom: '1.25rem' }}>Where do you want to arrive? e.g. Full Stack Developer, AI Engineer, UI/UX Designer</p>
            <input className="input" value={query} onChange={e => setQuery(e.target.value)} placeholder="Enter your destination role..." onKeyDown={e => e.key === 'Enter' && handleGenerateGPS(query)} disabled={loading} />
            <button className="btn-primary" onClick={() => handleGenerateGPS(query)} disabled={loading || !query.trim()} style={{ width: '100%', marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              {loading ? (
                <>
                  <div className="roadmap-loading-dots"><span /><span /><span /></div>
                  {LOADING_MSGS[loadMsg]}
                </>
              ) : (
                <><Sparkles size={16} /> Generate GPS Route</>
              )}
            </button>
          </motion.div>
        )}

        {/* Loading placeholder */}
        {fetching && (
          <div style={{ textAlign: 'center', padding: '5rem 0', color: 'var(--color-text-muted)' }}>
            <div className="roadmap-loading-dots" style={{ margin: '0 auto 1rem' }}><span /><span /><span /></div>
            Loading Career coordinates...
          </div>
        )}

        {/* Empty State */}
        {!fetching && !gps && !showForm && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card" style={{ padding: '4rem 2rem', textAlign: 'center', maxWidth: 500, margin: '0 auto' }}>
            <Compass size={54} color="var(--color-text-muted)" style={{ margin: '0 auto 1.5rem', display: 'block', opacity: 0.4 }} />
            <h3 style={{ fontWeight: 700, marginBottom: '0.5rem', fontSize: '1.2rem', fontFamily: "'Space Grotesk', sans-serif" }}>No Active GPS Route</h3>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem', fontSize: '0.9rem', lineHeight: 1.5 }}>
              Plot a dynamically generated custom learning path toward your chosen career destination with XP milestones.
            </p>
            <button className="btn-primary" onClick={() => setShowForm(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles size={16} /> Build Your Route Map
            </button>
          </motion.div>
        )}

        {/* Active GPS Dashboard */}
        {gps && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.75rem', alignItems: 'start' }} className="gps-grid">
            
            {/* Left Column: Journey Map + Details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Section 1: Career Overview Card */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card"
                style={{ padding: '1.5rem' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>Active Destination</span>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: "'Space Grotesk', sans-serif", marginTop: '0.2rem', color: 'var(--color-text)' }}>{gps.destination}</h2>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <div style={{
                      padding: '0.35rem 0.8rem',
                      borderRadius: 12,
                      background: getRank(gps.currentLevel).bg,
                      border: `1px solid ${getRank(gps.currentLevel).color}25`,
                      color: getRank(gps.currentLevel).color,
                      fontSize: '0.78rem',
                      fontWeight: 700
                    }}>
                      Level {gps.currentLevel}: {getRank(gps.currentLevel).label}
                    </div>
                    {gps.streak > 0 && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        padding: '0.35rem 0.8rem',
                        borderRadius: 12,
                        background: 'var(--color-warning-glow)',
                        border: '1px solid rgba(245,158,11,0.2)',
                        color: '#fbbf24',
                        fontSize: '0.78rem',
                        fontWeight: 700
                      }}>
                        <Flame size={14} color="#f59e0b" /> {gps.streak} Day Streak
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '1.5rem', borderTop: '1px solid var(--color-border)', paddingTop: '1.25rem' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>GPS Route Progress</span>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700 }} className="gradient-text">{gps.progress}%</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-bar-fill" style={{ width: `${gps.progress}%` }} />
                    </div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>Job Readiness</span>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#10b981' }}>{Math.min(98, Math.round(gps.progress * 0.9 + 10))}%</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-bar-fill" style={{ width: `${Math.min(98, Math.round(gps.progress * 0.9 + 10))}%`, background: '#10b981' }} />
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Section 2: Journey Map */}
              <div className="glass-card" style={{ padding: '1.75rem' }}>
                <h3 style={{ fontWeight: 700, fontSize: '1.05rem', fontFamily: "'Space Grotesk', sans-serif", marginBottom: '1.5rem', color: 'var(--color-text-dim)' }}>GPS Route Checkpoints</h3>
                
                <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingLeft: '2rem' }}>
                  {/* Vertical Line Connector */}
                  <div style={{
                    position: 'absolute',
                    top: 15,
                    bottom: 15,
                    left: 21,
                    width: 3,
                    background: 'rgba(255, 255, 255, 0.08)',
                    zIndex: 1
                  }} />

                  {gps.checkpoints.map((cp, idx) => {
                    // Check completion states
                    const isActive = activeCheckpoint?.level === cp.level;
                    const isCurrentGoal = gps.currentCheckpoint === cp.title;
                    
                    return (
                      <motion.div
                        key={cp._id || cp.level}
                        whileHover={{ x: 4 }}
                        onClick={() => setActiveCheckpoint(cp)}
                        style={{
                          display: 'flex',
                          gap: '1.25rem',
                          cursor: 'pointer',
                          position: 'relative',
                          zIndex: 2
                        }}
                      >
                        {/* Bullet indicator */}
                        <div style={{
                          width: 26,
                          height: 26,
                          borderRadius: '50%',
                          background: cp.completed ? 'var(--gradient-primary)' : isCurrentGoal ? 'var(--color-surface)' : 'var(--color-bg)',
                          border: isCurrentGoal ? '2px solid var(--color-primary)' : cp.completed ? 'none' : '2px solid rgba(255,255,255,0.12)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: cp.completed || isCurrentGoal ? 'white' : 'var(--color-text-muted)',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          position: 'absolute',
                          left: -22,
                          top: 4,
                          boxShadow: isCurrentGoal ? '0 0 12px var(--color-primary-glow)' : 'none'
                        }}>
                          {cp.completed ? '✓' : cp.level}
                        </div>

                        {/* Text details */}
                        <div style={{
                          flex: 1,
                          padding: '0.8rem 1.25rem',
                          borderRadius: 12,
                          background: isActive ? 'var(--color-primary-glow)' : 'var(--color-surface-2)',
                          border: isActive ? '1px solid rgba(14,165,233,0.25)' : '1px solid var(--color-border)',
                          transition: 'all 0.2s ease'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h4 style={{ margin: 0, fontWeight: 700, fontSize: '0.92rem', color: cp.completed ? 'var(--color-text-muted)' : 'var(--color-text)' }}>
                              {cp.title}
                            </h4>
                            {cp.completed && (
                              <span style={{ fontSize: '0.68rem', color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                <CheckCircle2 size={12} /> Completed
                              </span>
                            )}
                            {isCurrentGoal && !cp.completed && (
                              <span style={{ fontSize: '0.68rem', color: 'var(--color-primary-light)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                Next Checkpoint
                              </span>
                            )}
                          </div>
                          <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{cp.description}</p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Column: Mission Control + Sara Navigator */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Section 4: Sara AI Guidance Box */}
              <div style={{
                background: 'var(--gradient-primary-soft)',
                border: '1px solid rgba(14,165,233,0.15)',
                padding: '1.25rem',
                borderRadius: 16
              }}>
                <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', marginBottom: '0.6rem' }}>
                  <Sparkles size={16} color="var(--color-primary-light)" />
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-primary-light)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Sara Navigator Guidance</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                  {gps.progress === 0 && `Welcome aboard! Let's start with your first segment, ${gps.checkpoints[0]?.title || 'checkpoint'}.`}
                  {gps.progress > 0 && gps.progress < 100 && `You're ${gps.progress}% closer to becoming an ${gps.destination}. Complete more checkpoint tasks to reach Level ${gps.currentLevel + 1}!`}
                  {gps.progress === 100 && `Incredible achievement! You have fully completed the GPS route for ${gps.destination}. Practice mock interviews to ensure job readiness!`}
                </p>
              </div>

              {/* Section 3: Current Mission Details */}
              {activeCheckpoint && (
                <div className="glass-card" style={{ padding: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.6rem' }}>
                    <div>
                      <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Current Mission</span>
                      <h4 style={{ margin: 0, fontWeight: 800, fontSize: '0.95rem', fontFamily: "'Space Grotesk', sans-serif" }}>{activeCheckpoint.title}</h4>
                    </div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--color-primary-light)', fontWeight: 700 }}>+{activeCheckpoint.rewardXP} XP</span>
                  </div>

                  {/* Tasks List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-dim)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Milestone Tasks</span>
                    {activeCheckpoint.tasks.map((task, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleToggleTask(activeCheckpoint.level, task.title, task.completed)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.6rem',
                          padding: '0.5rem 0.75rem',
                          borderRadius: 8,
                          background: 'var(--color-surface-2)',
                          border: '1px solid var(--color-border)',
                          cursor: 'pointer',
                          fontSize: '0.82rem',
                          color: task.completed ? 'var(--color-text-muted)' : 'var(--color-text-dim)'
                        }}
                      >
                        <span style={{ color: task.completed ? 'var(--color-success)' : 'var(--color-text-muted)' }}>
                          {task.completed ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                        </span>
                        <span style={{ textDecoration: task.completed ? 'line-through' : 'none' }}>{task.title}</span>
                      </div>
                    ))}
                  </div>

                  {/* Section 6: Project Submission Form */}
                  <form onSubmit={handleProjectSubmit} style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-dim)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '0.5rem' }}>
                      Submit Checkpoint Project (+500 XP)
                    </span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <input
                        className="input"
                        placeholder="Project Name"
                        value={projName}
                        onChange={e => setProjName(e.target.value)}
                        style={{ padding: '0.4rem 0.6rem', fontSize: '0.78rem' }}
                        required
                      />
                      <input
                        className="input"
                        placeholder="GitHub URL"
                        value={projUrl}
                        onChange={e => setProjUrl(e.target.value)}
                        style={{ padding: '0.4rem 0.6rem', fontSize: '0.78rem' }}
                        required
                      />
                      <textarea
                        className="input"
                        placeholder="Short description"
                        value={projDesc}
                        onChange={e => setProjDesc(e.target.value)}
                        style={{ padding: '0.4rem 0.6rem', fontSize: '0.78rem', height: 44, resize: 'none' }}
                      />
                      <button
                        type="submit"
                        disabled={projSubmitting || !projName || !projUrl}
                        className="btn-primary"
                        style={{ padding: '0.4rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', width: '100%' }}
                      >
                        {projSubmitting ? 'Submitting...' : <><Link size={12} /> Submit Project</>}
                      </button>
                      {projSuccess && (
                        <span style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 600, textAlign: 'center', display: 'block', marginTop: '0.2rem' }}>
                          ✓ Project saved! +500 XP Earned
                        </span>
                      )}
                    </div>
                  </form>
                </div>
              )}

              {/* Section 5: Achievements & Badges */}
              <div className="glass-card" style={{ padding: '1.25rem' }}>
                <h4 style={{ fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '1rem', letterSpacing: '0.04em' }}>
                  Achievements & Badges
                </h4>
                {gps.badges.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '1rem 0', color: 'var(--color-text-muted)', fontSize: '0.78rem' }}>
                    Complete checkpoints or submit projects to unlock badges!
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                    {gps.badges.map((b, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: '0.6rem',
                          borderRadius: 10,
                          background: 'var(--color-surface-2)',
                          border: '1px solid var(--color-border)',
                          textAlign: 'center',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '0.3rem'
                        }}
                      >
                        <Award size={20} color="#fbbf24" />
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text)' }}>{b.name}</span>
                        <span style={{ fontSize: '0.55rem', color: 'var(--color-text-muted)' }}>{new Date(b.unlockedAt).toLocaleDateString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

          </div>
        )}

      </main>
    </div>
  );
};

export default RoadmapPage;
