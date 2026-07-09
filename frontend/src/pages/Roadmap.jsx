import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../components/Sidebar';
import { careerService } from '../services/adviceService';
import api from '../services/api';
import { formatExternalUrl } from '../utils/url';
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
  const [gpsList, setGpsList] = useState([]);
  const [activeCheckpoint, setActiveCheckpoint] = useState(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [loadMsg, setLoadMsg] = useState(0);
  const [viewMode, setViewMode] = useState('tree'); // 'tree' or 'timeline'
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('resources'); // 'resources' or 'ai'

  // Project submission state
  const [projName, setProjName] = useState('');
  const [projUrl, setProjUrl] = useState('');
  const [projDesc, setProjDesc] = useState('');
  const [projSubmitting, setProjSubmitting] = useState(false);
  const [projSuccess, setProjSuccess] = useState(false);

  const loadData = async (selectedTemplateId = null) => {
    setFetching(true);
    try {
      const { data: roadRes } = await careerService.getMyRoadmaps();
      setRoadmaps(roadRes.data || []);

      const { data: gpsListRes } = await api.get('/gps/list');
      const list = gpsListRes.data || [];
      setGpsList(list);

      if (list.length > 0) {
        let activeGps = null;
        if (selectedTemplateId) {
          activeGps = list.find(g => g.templateId === selectedTemplateId);
        } else if (gps) {
          activeGps = list.find(g => g.templateId === gps.templateId);
        }
        
        if (!activeGps) {
          activeGps = list[0];
        }

        setGps(activeGps);
        const activeCp = activeGps.checkpoints.find(c => !c.completed) || activeGps.checkpoints[0];
        setActiveCheckpoint(activeCp);
      } else {
        setGps(null);
        setActiveCheckpoint(null);
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

  const handleSwitchGPS = (templateId) => {
    const targetGps = gpsList.find(g => g.templateId === templateId);
    if (targetGps) {
      setGps(targetGps);
      const activeCp = targetGps.checkpoints.find(c => !c.completed) || targetGps.checkpoints[0];
      setActiveCheckpoint(activeCp);
    }
  };

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
          setShowForm(false);
          setQuery('');
          await loadData(gpsData.data.templateId);
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
        completed: !currentStatus,
        templateId: gps?.templateId
      });
      if (data.success) {
        setGps(data.data);
        setGpsList(prev => prev.map(g => g.templateId === data.data.templateId ? data.data : g));
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
        description: projDesc,
        templateId: gps?.templateId
      });
      if (data.success) {
        setGps(data.data);
        setGpsList(prev => prev.map(g => g.templateId === data.data.templateId ? data.data : g));
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
    if (!gps) return;
    if (!confirm(`Are you sure you want to delete the GPS route for "${gps.destination}"? Your progress will be lost.`)) return;
    try {
      // Delete the GPS record on backend
      await api.delete(`/gps/${gps._id}`);

      // Find matching roadmap and delete it if it exists
      const matchingRoadmap = roadmaps.find(r => r.domain.toLowerCase() === gps.destination.toLowerCase());
      if (matchingRoadmap) {
        await careerService.deleteRoadmap(matchingRoadmap._id);
      }
      
      // Reload lists
      await loadData();
    } catch (err) {
      console.error('Delete failed:', err);
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              {gpsList.length > 0 && (
                <div style={{ position: 'relative' }}>
                  <select 
                    value={gps?.templateId || ''} 
                    onChange={e => handleSwitchGPS(e.target.value)}
                    style={{
                      background: 'var(--color-surface)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '10px',
                      padding: '0.5rem 2.25rem 0.5rem 1rem',
                      color: 'var(--color-text)',
                      fontSize: '0.88rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      appearance: 'none',
                      WebkitAppearance: 'none',
                      minWidth: '200px'
                    }}
                  >
                    {gpsList.map(g => (
                      <option key={g.templateId} value={g.templateId}>
                        📍 {g.destination} ({g.progress}%)
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={14} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--color-text-muted)' }} />
                </div>
              )}
              
              {!showForm && (
                <button className="btn-primary" onClick={() => setShowForm(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Plus size={16} /> New Route
                </button>
              )}
              
              {gps && (
                <button className="btn-ghost" onClick={handleDeleteGPS} style={{ color: 'var(--color-error)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Trash2 size={14} /> Delete Route
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Dynamic Route Form */}
        {showForm && (
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
            {gpsList.length > 0 && (
              <button className="btn-ghost" onClick={() => setShowForm(false)} disabled={loading} style={{ width: '100%', marginTop: '0.5rem' }}>
                Cancel
              </button>
            )}
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%', maxWidth: '800px', margin: '0 auto' }}>
              
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
                    {gps.templateVersion && (
                      <div style={{ display: 'flex', gap: '0.8rem', marginTop: '0.4rem', fontSize: '0.74rem', color: 'var(--color-text-muted)', flexWrap: 'wrap' }}>
                        <span>🏷️ <strong>Version:</strong> {gps.templateVersion}</span>
                        <span>👥 <strong>Learners:</strong> {gps.totalLearners?.toLocaleString() || 1}</span>
                        <span>🔥 <strong>Popularity:</strong> {gps.popularityScore || 1}</span>
                        <span>⏱️ <strong>Duration:</strong> {gps.estimatedDuration}</span>
                      </div>
                    )}
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <h3 style={{ fontWeight: 700, fontSize: '1.05rem', fontFamily: "'Space Grotesk', sans-serif", color: 'var(--color-text-dim)', margin: 0 }}>GPS Route Checkpoints</h3>
                  <div style={{ display: 'flex', background: 'var(--color-surface-3)', padding: '2px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                    <button
                      onClick={() => setViewMode('tree')}
                      style={{
                        padding: '0.35rem 0.85rem',
                        borderRadius: '6px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        background: viewMode === 'tree' ? 'var(--gradient-primary)' : 'transparent',
                        color: viewMode === 'tree' ? 'white' : 'var(--color-text-dim)',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem'
                      }}
                    >
                      <Map size={13} /> Interactive Map
                    </button>
                    <button
                      onClick={() => setViewMode('timeline')}
                      style={{
                        padding: '0.35rem 0.85rem',
                        borderRadius: '6px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        background: viewMode === 'timeline' ? 'var(--gradient-primary)' : 'transparent',
                        color: viewMode === 'timeline' ? 'white' : 'var(--color-text-dim)',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem'
                      }}
                    >
                      <Clock size={13} /> Timeline
                    </button>
                  </div>
                </div>
                
                {viewMode === 'tree' ? (
                  /* Interactive Branching Skill Tree Layout (roadmap.sh inspired) */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', position: 'relative', padding: '1rem 0' }}>
                    {gps.checkpoints.map((cp, idx) => {
                      const isActive = activeCheckpoint?.level === cp.level;
                      const isCurrentGoal = gps.currentCheckpoint === cp.title;
                      const isEven = idx % 2 === 0;

                      return (
                        <div key={cp._id || cp.level} style={{ display: 'grid', gridTemplateColumns: '1fr 60px 1fr', alignItems: 'center', width: '100%' }}>
                          
                          {/* Left Branch Node */}
                          <div style={{ display: 'flex', justifyContent: 'flex-end', opacity: isEven ? 1 : 0.05, pointerEvents: isEven ? 'auto' : 'none' }}>
                            {isEven && (
                              <motion.div
                                whileHover={{ scale: 1.04, y: -2 }}
                                onClick={() => { setActiveCheckpoint(cp); setDrawerOpen(true); }}
                                style={{
                                  background: isActive ? 'var(--color-primary-glow)' : 'var(--color-surface-2)',
                                  border: isActive ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                                  borderRadius: '12px',
                                  padding: '0.9rem 1.1rem',
                                  cursor: 'pointer',
                                  maxWidth: '220px',
                                  width: '100%',
                                  textAlign: 'right',
                                  boxShadow: isActive ? '0 0 15px var(--color-primary-glow-strong)' : 'none',
                                  position: 'relative'
                                }}
                              >
                                <span style={{ fontSize: '0.62rem', color: cp.completed ? 'var(--color-success)' : 'var(--color-text-muted)', fontWeight: 700, letterSpacing: '0.04em' }}>
                                  {cp.completed ? '✓ COMPLETED' : `LEVEL ${cp.level}`}
                                </span>
                                <h4 style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-text)', lineHeight: 1.3 }}>{cp.title}</h4>
                                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.7rem', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cp.description}</p>
                              </motion.div>
                            )}
                          </div>

                          {/* Center Node / Bullet Connector */}
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', height: '100%' }}>
                            <div
                              onClick={() => { setActiveCheckpoint(cp); setDrawerOpen(true); }}
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                background: cp.completed ? 'var(--color-success)' : isCurrentGoal ? 'var(--gradient-primary)' : 'var(--color-bg)',
                                border: isCurrentGoal ? '2px solid #fff' : cp.completed ? 'none' : '2px solid var(--color-border)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontWeight: 800,
                                fontSize: '0.78rem',
                                zIndex: 2,
                                cursor: 'pointer',
                                boxShadow: isCurrentGoal ? '0 0 15px var(--color-primary)' : 'none',
                                transition: 'all 0.2s'
                              }}
                            >
                              {cp.completed ? '✓' : cp.level}
                            </div>
                          </div>

                          {/* Right Branch Node */}
                          <div style={{ display: 'flex', justifyContent: 'flex-start', opacity: !isEven ? 1 : 0.05, pointerEvents: !isEven ? 'auto' : 'none' }}>
                            {!isEven && (
                              <motion.div
                                whileHover={{ scale: 1.04, y: -2 }}
                                onClick={() => { setActiveCheckpoint(cp); setDrawerOpen(true); }}
                                style={{
                                  background: isActive ? 'var(--color-primary-glow)' : 'var(--color-surface-2)',
                                  border: isActive ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                                  borderRadius: '12px',
                                  padding: '0.9rem 1.1rem',
                                  cursor: 'pointer',
                                  maxWidth: '220px',
                                  width: '100%',
                                  textAlign: 'left',
                                  boxShadow: isActive ? '0 0 15px var(--color-primary-glow-strong)' : 'none',
                                  position: 'relative'
                                }}
                              >
                                <span style={{ fontSize: '0.62rem', color: cp.completed ? 'var(--color-success)' : 'var(--color-text-muted)', fontWeight: 700, letterSpacing: '0.04em' }}>
                                  {cp.completed ? '✓ COMPLETED' : `LEVEL ${cp.level}`}
                                </span>
                                <h4 style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-text)', lineHeight: 1.3 }}>{cp.title}</h4>
                                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.7rem', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cp.description}</p>
                              </motion.div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {/* Vertical Connecting Line */}
                    <div style={{ position: 'absolute', top: '24px', bottom: '24px', left: '50%', transform: 'translateX(-50%)', width: '3px', background: 'var(--gradient-primary)', opacity: 0.18, zIndex: 1 }} />
                  </div>
                ) : (
                  /* Standard Timeline List Layout */
                  <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingLeft: '2rem' }}>
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
                      const isActive = activeCheckpoint?.level === cp.level;
                      const isCurrentGoal = gps.currentCheckpoint === cp.title;
                      
                      return (
                        <motion.div
                          key={cp._id || cp.level}
                          whileHover={{ x: 4 }}
                          onClick={() => { setActiveCheckpoint(cp); setDrawerOpen(true); }}
                          style={{
                            display: 'flex',
                            gap: '1.25rem',
                            cursor: 'pointer',
                            position: 'relative',
                            zIndex: 2
                          }}
                        >
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
                )}
              </div>
            </div>
          )
        }

        {/* Sliding Side Drawer Overlay & Panel (roadmap.sh style) */}
        <AnimatePresence>
          {drawerOpen && activeCheckpoint && (
            <>
              {/* Dim/Blur Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setDrawerOpen(false)}
                style={{
                  position: 'fixed',
                  inset: 0,
                  background: 'rgba(3, 5, 12, 0.6)',
                  backdropFilter: 'blur(5px)',
                  zIndex: 9998
                }}
              />

              {/* Slide-in Drawer */}
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                style={{
                  position: 'fixed',
                  top: 0,
                  right: 0,
                  bottom: 0,
                  width: 'min(500px, 100vw)',
                  background: 'var(--color-surface)',
                  borderLeft: '1px solid var(--color-border)',
                  boxShadow: '-10px 0 40px rgba(0,0,0,0.6)',
                  zIndex: 9999,
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden'
                }}
              >
                {/* Drawer Header */}
                <div style={{
                  padding: '1.25rem 1.5rem',
                  borderBottom: '1px solid var(--color-border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'var(--color-bg-secondary)'
                }}>
                  {/* Tab Selector */}
                  <div style={{ display: 'flex', background: 'var(--color-surface-3)', padding: '2px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                    <button
                      onClick={() => setActiveTab('resources')}
                      style={{
                        padding: '0.4rem 1rem',
                        borderRadius: '6px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        background: activeTab === 'resources' ? 'var(--gradient-primary)' : 'transparent',
                        color: activeTab === 'resources' ? 'white' : 'var(--color-text-dim)',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      📚 Resources
                    </button>
                    <button
                      onClick={() => setActiveTab('ai')}
                      style={{
                        padding: '0.4rem 1rem',
                        borderRadius: '6px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        background: activeTab === 'ai' ? 'var(--gradient-primary)' : 'transparent',
                        color: activeTab === 'ai' ? 'white' : 'var(--color-text-dim)',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      🤖 AI Guide
                    </button>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {/* Completion Status Badge */}
                    <div style={{
                      padding: '0.35rem 0.75rem',
                      borderRadius: '8px',
                      background: activeCheckpoint.completed ? 'var(--color-success-glow)' : 'rgba(245,158,11,0.08)',
                      border: activeCheckpoint.completed ? '1px solid var(--color-success)' : '1px solid var(--color-warning)',
                      color: activeCheckpoint.completed ? 'var(--color-success)' : 'var(--color-warning)',
                      fontSize: '0.74rem',
                      fontWeight: 700
                    }}>
                      {activeCheckpoint.completed ? 'Completed' : 'In Progress'}
                    </div>

                    {/* Close Button */}
                    <button
                      onClick={() => setDrawerOpen(false)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--color-text-dim)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '0.25rem',
                        borderRadius: '50%',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-surface-2)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                    >
                      <Plus size={22} style={{ transform: 'rotate(45deg)' }} />
                    </button>
                  </div>
                </div>

                {/* Drawer Body */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {activeTab === 'resources' ? (
                    <>
                      {/* Title & Description */}
                      <div>
                        <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>Current Checkpoint</span>
                        <h2 style={{ margin: '0.1rem 0 0.4rem 0', fontWeight: 800, fontSize: '1.4rem', fontFamily: "'Space Grotesk', sans-serif" }}>{activeCheckpoint.title}</h2>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>{activeCheckpoint.description}</p>
                      </div>

                      {/* Skills to Learn */}
                      {activeCheckpoint.skills && activeCheckpoint.skills.length > 0 && (
                        <div>
                          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '0.45rem' }}>Skills to Master</span>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                            {activeCheckpoint.skills.map((skill, idx) => (
                              <span key={idx} style={{ padding: '0.25rem 0.6rem', borderRadius: '6px', fontSize: '0.72rem', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text-dim)' }}>
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Learning Resources */}
                      {activeCheckpoint.resources && activeCheckpoint.resources.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-text)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>Learning Hub Resources</span>
                          
                          {/* Grouped Layout */}
                          {(() => {
                            const docs = activeCheckpoint.resources.filter(r => r.isOfficial || r.type === 'documentation');
                            const courses = activeCheckpoint.resources.filter(r => r.type === 'course');
                            const videos = activeCheckpoint.resources.filter(r => r.type === 'video');
                            const practice = activeCheckpoint.resources.filter(r => r.type === 'platform' || r.type === 'tool');
                            const articles = activeCheckpoint.resources.filter(r => r.type === 'article');

                            const renderGroup = (title, icon, items) => {
                              if (!items || items.length === 0) return null;
                              return (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-primary-light)' }}>
                                    {icon} <span>{title}</span>
                                  </div>
                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem' }}>
                                    {items.map((res, idx) => (
                                      <div 
                                        key={idx} 
                                        className="glass-card" 
                                        style={{ 
                                          padding: '1.25rem', 
                                          border: '1px solid var(--color-border)', 
                                          background: 'var(--color-surface-2)',
                                          borderRadius: '12px',
                                          display: 'flex',
                                          flexDirection: 'column',
                                          gap: '0.6rem'
                                        }}
                                      >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                                          <span style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                                            {res.provider || 'Community'}
                                          </span>
                                          <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                                            {res.isOfficial && <span style={{ fontSize: '0.62rem', background: 'var(--color-primary-glow)', color: 'var(--color-primary-light)', padding: '0.15rem 0.4rem', borderRadius: '4px', fontWeight: 800 }}>Official</span>}
                                            <span style={{ fontSize: '0.62rem', background: res.isFree ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.08)', color: res.isFree ? '#10b981' : '#f59e0b', padding: '0.15rem 0.4rem', borderRadius: '4px', fontWeight: 800 }}>{res.isFree ? 'Free' : 'Paid'}</span>
                                            {res.verified && <span style={{ fontSize: '0.62rem', background: 'rgba(16,185,129,0.1)', color: '#10b981', padding: '0.15rem 0.4rem', borderRadius: '4px', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '2px' }}>✓ Verified</span>}
                                          </div>
                                        </div>

                                        <h5 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 700, color: 'var(--color-text)' }}>{res.title}</h5>
                                        {res.description && <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>{res.description}</p>}

                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem', borderTop: '1px solid var(--color-border-subtle)', paddingTop: '0.5rem' }}>
                                          <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.68rem', color: 'var(--color-text-muted)' }}>
                                            <span>Difficulty: <strong>{res.difficulty || 'Beginner'}</strong></span>
                                            <span>·</span>
                                            <span>Duration: <strong>{res.duration || 'Self-paced'}</strong></span>
                                          </div>
                                          <a 
                                            href={res.verifiedUrl || res.url} 
                                            target="_blank" 
                                            rel="noopener noreferrer" 
                                            className="btn-ghost" 
                                            style={{ padding: '0.35rem 0.65rem', fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none', fontWeight: 700 }}
                                          >
                                            Open <Link size={12} />
                                          </a>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            };

                            return (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                {renderGroup('Official Documentation', <BookOpen size={14} />, docs)}
                                {renderGroup('Online Courses', <GraduationCap size={14} />, courses)}
                                {renderGroup('Video Playlists', <Play size={14} />, videos)}
                                {renderGroup('Interactive Practice', <Code size={14} />, practice)}
                                {renderGroup('Articles & Guides', <FileText size={14} />, articles)}
                              </div>
                            );
                          })()}
                        </div>
                      )}

                      {/* Certifications */}
                      {activeCheckpoint.certifications && activeCheckpoint.certifications.length > 0 && (
                        <div>
                          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '0.45rem' }}>Certifications</span>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                            {activeCheckpoint.certifications.map((cert, idx) => (
                              <div key={idx} style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.6rem 0.75rem',
                                borderRadius: 8,
                                background: 'rgba(251, 191, 36, 0.03)',
                                border: '1px solid rgba(251, 191, 36, 0.1)',
                                fontSize: '0.82rem',
                                color: 'var(--color-text-dim)'
                              }}>
                                <Award size={14} color="#fbbf24" />
                                <span style={{ fontWeight: 500 }}>{cert}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Mini Projects */}
                      {activeCheckpoint.projects && activeCheckpoint.projects.length > 0 && (
                        <div>
                          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '0.45rem' }}>Checkpoint Projects</span>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                            {activeCheckpoint.projects.map((proj, idx) => (
                              <div key={idx} style={{
                                padding: '0.75rem',
                                borderRadius: 8,
                                background: 'var(--color-surface-2)',
                                border: '1px solid var(--color-border)',
                                fontSize: '0.82rem'
                              }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                  <span style={{ fontWeight: 700, color: 'var(--color-text)' }}>{proj.title}</span>
                                  <span style={{ fontSize: '0.62rem', color: '#10b981', background: 'rgba(16,185,129,0.08)', padding: '0.05rem 0.3rem', borderRadius: 4, fontWeight: 600 }}>{proj.difficulty}</span>
                                </div>
                                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.78rem', margin: '0 0 0.4rem 0', lineHeight: 1.4 }}>{proj.description}</p>
                                {proj.expectedOutcome && (
                                  <div style={{ fontSize: '0.72rem', color: 'var(--color-text-dim)' }}>
                                    <strong>Outcome:</strong> {proj.expectedOutcome}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Completion Criteria List */}
                      {activeCheckpoint.completionCriteria && activeCheckpoint.completionCriteria.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
                          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-dim)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Completion Criteria</span>
                          {activeCheckpoint.completionCriteria.map((task, idx) => (
                            <div
                              key={idx}
                              onClick={() => handleToggleTask(activeCheckpoint.level, task.title, task.completed)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.6rem',
                                padding: '0.6rem 0.8rem',
                                borderRadius: 8,
                                background: 'var(--color-surface-2)',
                                border: '1px solid var(--color-border)',
                                cursor: 'pointer',
                                fontSize: '0.82rem',
                                color: task.completed ? 'var(--color-text-muted)' : 'var(--color-text-dim)'
                              }}
                            >
                              <span style={{ color: task.completed ? 'var(--color-success)' : 'var(--color-text-muted)', display: 'flex', alignItems: 'center' }}>
                                {task.completed ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                              </span>
                              <span style={{ textDecoration: task.completed ? 'line-through' : 'none' }}>{task.title}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Project Submission Form */}
                      <form onSubmit={handleProjectSubmit} style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1.25rem' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-dim)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '0.6rem' }}>
                          Submit Checkpoint Project (+500 XP)
                        </span>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <input
                            className="input"
                            placeholder="Project Name"
                            value={projName}
                            onChange={e => setProjName(e.target.value)}
                            style={{ padding: '0.5rem 0.75rem', fontSize: '0.82rem' }}
                            required
                          />
                          <input
                            className="input"
                            placeholder="GitHub URL"
                            value={projUrl}
                            onChange={e => setProjUrl(e.target.value)}
                            style={{ padding: '0.5rem 0.75rem', fontSize: '0.82rem' }}
                            required
                          />
                          <textarea
                            className="input"
                            placeholder="Short description"
                            value={projDesc}
                            onChange={e => setProjDesc(e.target.value)}
                            style={{ padding: '0.5rem 0.75rem', fontSize: '0.82rem', height: 50, resize: 'none' }}
                          />
                          <button
                            type="submit"
                            disabled={projSubmitting || !projName || !projUrl}
                            className="btn-primary"
                            style={{ padding: '0.5rem', fontSize: '0.82rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', width: '100%' }}
                          >
                            {projSubmitting ? 'Submitting...' : <><Link size={14} /> Submit Project</>}
                          </button>
                          {projSuccess && (
                            <span style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 600, textAlign: 'center', display: 'block', marginTop: '0.25rem' }}>
                              ✓ Project saved! +500 XP Earned
                            </span>
                          )}
                        </div>
                      </form>
                    </>
                  ) : (
                    <>
                      {/* AI guidance navigator */}
                      {(() => {
                        const nextIncomplete = gps.checkpoints.find(c => !c.completed) || gps.checkpoints[0];
                        const recommendedCourse = nextIncomplete?.resources?.find(r => r.type === 'course' || r.type === 'youtube');
                        const recommendedProject = nextIncomplete?.projects?.[0];

                        return (
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
                            <div style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                              {gps.progress === 100 ? (
                                <p style={{ margin: 0 }}>Incredible achievement! You have fully completed the GPS route for {gps.destination}. Practice mock interviews to ensure job readiness!</p>
                              ) : (
                                <div>
                                  <p style={{ margin: '0 0 0.5rem 0', fontWeight: 700, color: 'var(--color-text)' }}>
                                    Your next checkpoint is <span style={{ color: 'var(--color-primary-light)' }}>{nextIncomplete?.title}</span>.
                                  </p>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--color-text-dim)' }}>
                                    <div>⏱️ <strong>Estimated Time:</strong> {nextIncomplete?.estimatedTime || '2 Weeks'}</div>
                                    {recommendedCourse && (
                                      <div>🎓 <strong>Recommended Course:</strong> <span style={{ color: 'var(--color-primary-light)' }}>{recommendedCourse.title}</span></div>
                                    )}
                                    {recommendedProject && (
                                      <div>🛠️ <strong>Project:</strong> <span style={{ color: 'var(--color-accent-light)' }}>{recommendedProject.title}</span></div>
                                    )}
                                    <div>🏆 <strong>Completion Reward:</strong> +{nextIncomplete?.xpReward || 250} XP</div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })()}

                      {/* Achievements */}
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
                    </>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

      </main>
    </div>
  );
};

export default RoadmapPage;
