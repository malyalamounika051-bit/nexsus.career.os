import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { resumeService } from '../services/resumeService';
import { profileService } from '../services/profileService';
import Sidebar from '../components/Sidebar';
import { 
  FileText, Sparkles, Wand2, Download, CheckCircle2, ChevronRight,
  TrendingUp, Award, Layers, Save, Trash2, ArrowLeft,
  Plus, Minus, RefreshCw, Send, Brain, ExternalLink,
  Target, Info, AlertTriangle, FileJson, Check, Clipboard, ListTodo, Star, BookOpen, GraduationCap,
  XCircle, Zap, Clock, DollarSign, BarChart3, Briefcase, User, Mail, Phone, MapPin,
  Code, Shield, Loader2, ChevronDown, ChevronUp, Edit3, Eye
} from 'lucide-react';
import html2pdf from 'html2pdf.js';
import { exportToDocx } from '../utils/resumeExportUtils';
import {
  ModernTemplate,
  SaharaContrastTemplate,
  GreyLiningTemplate,
  GlacierChillTemplate,
  IvoryPrestigeTemplate,
  RoyalEssenceTemplate,
  ExecutiveEdgeTemplate
} from '../components/ResumeTemplates';

const TEMPLATES = [
  { id: 'modern', name: 'Modern ATS', color: '#3b82f6', Component: ModernTemplate },
  { id: 'sahara_contrast', name: 'Sahara Contrast', color: '#b45309', Component: SaharaContrastTemplate },
  { id: 'grey_lining', name: 'Grey Lining', color: '#475569', Component: GreyLiningTemplate },
  { id: 'glacier_chill', name: 'Glacier Chill', color: '#0f172a', Component: GlacierChillTemplate },
  { id: 'ivory_prestige', name: 'Ivory Prestige', color: '#a27b5c', Component: IvoryPrestigeTemplate },
  { id: 'royal_essence', name: 'Royal Essence', color: '#0f2963', Component: RoyalEssenceTemplate },
  { id: 'executive_edge', name: 'Executive Edge', color: '#0f766e', Component: ExecutiveEdgeTemplate }
];

const QUICK_ROLES = [
  { id: 'frontend', name: 'Frontend Developer', icon: '⚛️' },
  { id: 'backend', name: 'Backend Developer', icon: '⚙️' },
  { id: 'fullstack', name: 'Full Stack Developer', icon: '🔗' },
  { id: 'ai_ml', name: 'AI / ML Engineer', icon: '🤖' },
  { id: 'data_analyst', name: 'Data Analyst', icon: '📊' },
  { id: 'devops', name: 'DevOps Engineer', icon: '☁️' },
  { id: 'mobile', name: 'Mobile App Developer', icon: '📱' },
  { id: 'cybersecurity', name: 'Cybersecurity Analyst', icon: '🔒' },
  { id: 'ui_ux', name: 'UI/UX Designer', icon: '🎨' },
  { id: 'product_manager', name: 'Product Manager', icon: '📋' },
  { id: 'software_engineer', name: 'Software Engineer', icon: '💻' },
  { id: 'cloud_architect', name: 'Cloud Architect', icon: '🏗️' },
];

const GENERATION_STEPS = [
  { label: 'Analyzing your Profile', icon: User },
  { label: 'Matching Skills to Job', icon: Target },
  { label: 'Building ATS Resume', icon: FileText },
  { label: 'Generating Skill Gap Report', icon: BarChart3 },
  { label: 'Scoring & Recommendations', icon: Award },
];

export default function ResumeBuilder() {
  const { user } = useAuth();
  const printRef = useRef();

  // Mode: 'landing', 'generating', 'result'
  const [mode, setMode] = useState('landing');
  const [selectedTemplate, setSelectedTemplate] = useState('modern');
  const [accentColor, setAccentColor] = useState('#3b82f6');
  const [zoom, setZoom] = useState(0.65);

  // Profile data
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // Job input
  const [jobRole, setJobRole] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [inputMode, setInputMode] = useState('role'); // 'role' or 'jd'

  // Generation state
  const [generating, setGenerating] = useState(false);
  const [genStep, setGenStep] = useState(0);
  const [genError, setGenError] = useState('');

  // Result state
  const [generatedResume, setGeneratedResume] = useState(null);
  const [skillGap, setSkillGap] = useState(null);
  const [scores, setScores] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [resumeId, setResumeId] = useState(null);

  // UI state
  const [expandedSkill, setExpandedSkill] = useState(null);
  const [improving, setImproving] = useState(false);
  const [activeResultTab, setActiveResultTab] = useState('gap'); // 'gap', 'scores', 'recs'

  // Load profile on mount
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setProfileLoading(true);
    try {
      const { data } = await profileService.getProfile();
      if (data.success && data.data) {
        setProfile(data.data);
      }
    } catch (e) {
      console.error('Failed to load profile:', e);
    } finally {
      setProfileLoading(false);
    }
  };

  const profileStats = profile ? {
    hasName: !!profile.fullName,
    hasEmail: !!profile.email,
    skillsCount: (profile.skills || []).length,
    projectsCount: (profile.projects || []).length,
    experienceCount: (profile.experience || []).length,
    educationCount: (profile.education || []).length,
    certsCount: (profile.certifications || []).length,
    achievementsCount: (profile.achievements || []).length,
    completion: profile.profileCompletion?.percentage || 0,
  } : null;

  const canGenerate = (jobRole.trim() || jobDescription.trim()) && profile && profileStats?.completion >= 10;

  // ── Generate resume from profile ──
  const handleGenerate = async () => {
    if (!canGenerate) return;
    setMode('generating');
    setGenerating(true);
    setGenError('');
    setGenStep(0);

    // Animate through steps
    const stepInterval = setInterval(() => {
      setGenStep(prev => {
        if (prev < GENERATION_STEPS.length - 1) return prev + 1;
        return prev;
      });
    }, 3000);

    try {
      const payload = {};
      if (jobDescription.trim()) payload.jobDescription = jobDescription.trim();
      if (jobRole.trim()) payload.jobRole = jobRole.trim();

      const { data } = await resumeService.generateFromProfile(payload);

      clearInterval(stepInterval);

      if (data.success && data.data) {
        setGeneratedResume(data.data.resume);
        setSkillGap(data.data.skillGap);
        setScores(data.data.scores);
        setRecommendations(data.data.recommendations || []);
        setResumeId(data.data.resumeId);
        setMode('result');
      } else {
        setGenError(data.message || 'Generation failed. Please try again.');
        setMode('landing');
      }
    } catch (err) {
      clearInterval(stepInterval);
      setGenError(err.response?.data?.message || 'Resume generation failed. Please try again.');
      setMode('landing');
    } finally {
      setGenerating(false);
    }
  };

  // ── Improve resume ──
  const handleImprove = async () => {
    if (!resumeId || improving) return;
    setImproving(true);
    try {
      const payload = {
        jobDescription: jobDescription.trim() || undefined,
        jobRole: jobRole.trim() || undefined,
      };
      const { data } = await resumeService.generateFromProfile(payload);
      if (data.success && data.data) {
        setGeneratedResume(data.data.resume);
        setSkillGap(data.data.skillGap);
        setScores(data.data.scores);
        setRecommendations(data.data.recommendations || []);
        setResumeId(data.data.resumeId);
      }
    } catch (err) {
      console.error('Improve failed:', err);
    } finally {
      setImproving(false);
    }
  };

  // ── Export handlers ──
  const handleExportPdf = () => {
    if (!printRef.current) return;
    html2pdf().set({
      margin: 0,
      filename: `${jobRole || 'AI_Resume'}_Resume.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    }).from(printRef.current).save();
  };

  const handleExportDocx = () => {
    if (!generatedResume) return;
    exportToDocx({
      personalInfo: generatedResume.personalInfo,
      skills: generatedResume.skills,
      experiences: generatedResume.experiences,
      education: generatedResume.education,
      projects: generatedResume.projects,
      certifications: generatedResume.certifications,
      achievements: generatedResume.achievements,
    });
  };

  // ── Get template component ──
  const TemplateComponent = TEMPLATES.find(t => t.id === selectedTemplate)?.Component || ModernTemplate;

  // ── Score ring helper ──
  const ScoreRing = ({ score, label, size = 80 }) => {
    const radius = (size - 10) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;
    const color = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444';
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem' }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size/2} cy={size/2} r={radius} stroke="var(--color-border)" strokeWidth="5" fill="none" />
          <circle cx={size/2} cy={size/2} r={radius} stroke={color} strokeWidth="5" fill="none"
            strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s ease' }} />
          <text x={size/2} y={size/2} textAnchor="middle" dominantBaseline="central"
            style={{ transform: 'rotate(90deg)', transformOrigin: 'center', fontSize: `${size * 0.22}px`, fontWeight: 900, fill: 'var(--color-text)' }}>
            {score}%
          </text>
        </svg>
        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-muted)', textAlign: 'center' }}>{label}</span>
      </div>
    );
  };

  return (
    <div className="app-shell" style={{ background: 'var(--color-bg)', height: '100vh', overflow: 'hidden' }}>
      <Sidebar />
      <main className="app-main" style={{ marginLeft: 'var(--sidebar-width)', padding: 0, height: '100vh', display: 'flex', flexDirection: 'column' }}>
        
        {/* Header */}
        <header style={{ height: '72px', background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2.5rem', zIndex: 10, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            {mode !== 'landing' && (
              <button onClick={() => { setMode('landing'); setGenError(''); }} className="btn-ghost" style={{ padding: '0.5rem', display: 'flex', alignItems: 'center' }}>
                <ArrowLeft size={18} />
              </button>
            )}
            <div style={{ width: '40px', height: '40px', background: 'var(--gradient-primary)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
              <FileText size={20} />
            </div>
            <div>
              <span style={{ color: 'var(--color-text)', fontSize: '1.25rem', fontWeight: 900 }}>AI Resume Builder</span>
              <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', marginLeft: '0.75rem', fontWeight: 600 }}>Profile-Powered</span>
            </div>
          </div>

          {mode === 'result' && (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={handleExportDocx} className="btn-ghost" style={{ padding: '0.6rem 1rem', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.4rem', border: '1px solid var(--color-border)' }}>
                <FileJson size={15} /> DOCX
              </button>
              <button onClick={handleExportPdf} className="btn-primary" style={{ padding: '0.6rem 1.2rem', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Download size={15} /> Export PDF
              </button>
            </div>
          )}
        </header>

        {/* Main Content */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <AnimatePresence mode="wait">

            {/* ══════════ LANDING ══════════ */}
            {mode === 'landing' && (
              <motion.div key="landing" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }}
                style={{ height: '100%', overflowY: 'auto', padding: '2.5rem 3.5rem' }}>
                <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

                  {/* Hero */}
                  <div style={{ marginBottom: '2rem' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'var(--color-primary-glow)', padding: '0.45rem 1rem', borderRadius: '99px', marginBottom: '0.75rem' }}>
                      <Sparkles size={14} color="var(--color-primary)" />
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-primary)' }}>Profile-Powered AI Generation</span>
                    </div>
                    <h2 style={{ fontSize: '2rem', fontWeight: 950, color: 'var(--color-text)', margin: 0 }}>
                      Generate Your ATS Resume
                    </h2>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', marginTop: '0.3rem', maxWidth: '600px' }}>
                      Your profile is the single source of truth. Just enter a job role or paste a job description — AI handles the rest.
                    </p>
                  </div>

                  {/* Error banner */}
                  {genError && (
                    <div style={{ padding: '1rem 1.25rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '12px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <AlertTriangle size={18} color="#ef4444" />
                      <span style={{ color: '#ef4444', fontSize: '0.88rem', fontWeight: 600 }}>{genError}</span>
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '2rem' }}>

                    {/* Left: Job Input */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                      {/* Input mode toggle */}
                      <div className="glass-card" style={{ padding: '1.5rem', border: '1px solid var(--color-border)' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
                          {[{ key: 'role', label: 'Enter Job Role', icon: Briefcase }, { key: 'jd', label: 'Paste Job Description', icon: Clipboard }].map(tab => (
                            <button key={tab.key} onClick={() => setInputMode(tab.key)}
                              style={{
                                padding: '0.55rem 1rem', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer',
                                border: inputMode === tab.key ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                                background: inputMode === tab.key ? 'var(--color-primary-glow)' : 'transparent',
                                color: inputMode === tab.key ? 'var(--color-primary)' : 'var(--color-text-muted)',
                                display: 'flex', alignItems: 'center', gap: '0.4rem', transition: 'all 0.2s'
                              }}>
                              <tab.icon size={14} /> {tab.label}
                            </button>
                          ))}
                        </div>

                        {inputMode === 'role' ? (
                          <div>
                            <input type="text" value={jobRole} onChange={e => setJobRole(e.target.value)}
                              placeholder="e.g. Frontend Developer, AI Engineer, Data Analyst..."
                              style={{
                                width: '100%', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid var(--color-border)',
                                background: 'var(--color-surface-2)', color: 'var(--color-text)', fontSize: '0.95rem', outline: 'none',
                                transition: 'border-color 0.2s', boxSizing: 'border-box'
                              }}
                              onFocus={e => e.target.style.borderColor = 'var(--color-primary)'}
                              onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
                            />
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '1rem' }}>
                              {QUICK_ROLES.map(role => (
                                <button key={role.id} onClick={() => setJobRole(role.name)}
                                  style={{
                                    padding: '0.4rem 0.75rem', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer',
                                    border: jobRole === role.name ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                                    background: jobRole === role.name ? 'var(--color-primary-glow)' : 'var(--color-surface-2)',
                                    color: jobRole === role.name ? 'var(--color-primary)' : 'var(--color-text-muted)',
                                    transition: 'all 0.2s'
                                  }}>
                                  {role.icon} {role.name}
                                </button>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <textarea value={jobDescription} onChange={e => setJobDescription(e.target.value)}
                            placeholder="Paste the complete job description here..."
                            rows={8}
                            style={{
                              width: '100%', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid var(--color-border)',
                              background: 'var(--color-surface-2)', color: 'var(--color-text)', fontSize: '0.88rem', outline: 'none',
                              resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6, boxSizing: 'border-box'
                            }}
                            onFocus={e => e.target.style.borderColor = 'var(--color-primary)'}
                            onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
                          />
                        )}
                      </div>

                      {/* Generate button */}
                      <button onClick={handleGenerate} disabled={!canGenerate}
                        className="btn-primary"
                        style={{
                          padding: '1rem 2rem', fontSize: '1rem', fontWeight: 800, borderRadius: '12px',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
                          opacity: canGenerate ? 1 : 0.5, cursor: canGenerate ? 'pointer' : 'not-allowed',
                          width: '100%'
                        }}>
                        <Sparkles size={18} /> Generate My Resume
                      </button>
                    </div>

                    {/* Right: Profile Summary */}
                    <div className="glass-card" style={{ padding: '1.5rem', border: '1px solid var(--color-border)', alignSelf: 'start' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                        <User size={16} color="var(--color-primary)" />
                        <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--color-text)', textTransform: 'uppercase' }}>Your Profile</span>
                      </div>

                      {profileLoading ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                          <Loader2 size={20} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
                          <span style={{ marginLeft: '0.5rem', fontSize: '0.85rem' }}>Loading profile...</span>
                        </div>
                      ) : !profile ? (
                        <div style={{ textAlign: 'center', padding: '1.5rem' }}>
                          <AlertTriangle size={28} color="#f59e0b" style={{ marginBottom: '0.5rem' }} />
                          <p style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>No profile found. Please complete your profile first.</p>
                          <a href="/profile" className="btn-primary" style={{ padding: '0.5rem 1.25rem', fontSize: '0.82rem', textDecoration: 'none' }}>Go to Profile</a>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          {/* Profile completion bar */}
                          <div style={{ marginBottom: '0.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>Profile Completion</span>
                              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: profileStats.completion >= 60 ? '#10b981' : '#f59e0b' }}>{profileStats.completion}%</span>
                            </div>
                            <div style={{ height: '6px', background: 'var(--color-surface-2)', borderRadius: '99px', overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${profileStats.completion}%`, background: profileStats.completion >= 60 ? '#10b981' : '#f59e0b', borderRadius: '99px', transition: 'width 0.5s ease' }} />
                            </div>
                          </div>

                          {/* Stat items */}
                          {[
                            { icon: User, label: 'Name', value: profile.fullName || 'Not set', ok: profileStats.hasName },
                            { icon: Mail, label: 'Email', value: profile.email || 'Not set', ok: profileStats.hasEmail },
                            { icon: Code, label: 'Skills', value: `${profileStats.skillsCount} skills`, ok: profileStats.skillsCount > 0 },
                            { icon: Layers, label: 'Projects', value: `${profileStats.projectsCount} projects`, ok: profileStats.projectsCount > 0 },
                            { icon: Briefcase, label: 'Experience', value: `${profileStats.experienceCount} entries`, ok: profileStats.experienceCount > 0 },
                            { icon: GraduationCap, label: 'Education', value: `${profileStats.educationCount} entries`, ok: profileStats.educationCount > 0 },
                            { icon: Award, label: 'Certifications', value: `${profileStats.certsCount} certs`, ok: profileStats.certsCount > 0 },
                            { icon: Star, label: 'Achievements', value: `${profileStats.achievementsCount} items`, ok: profileStats.achievementsCount > 0 },
                          ].map((item, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.35rem 0' }}>
                              <item.icon size={14} color={item.ok ? '#10b981' : 'var(--color-text-muted)'} />
                              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text-muted)', flex: 1 }}>{item.label}</span>
                              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: item.ok ? 'var(--color-text)' : 'var(--color-text-muted)' }}>{item.value}</span>
                            </div>
                          ))}

                          {profileStats.completion < 30 && (
                            <div style={{ marginTop: '0.5rem', padding: '0.6rem', background: 'rgba(245,158,11,0.08)', borderRadius: '8px', border: '1px solid rgba(245,158,11,0.15)' }}>
                              <p style={{ fontSize: '0.72rem', color: '#f59e0b', fontWeight: 600, margin: 0 }}>
                                ⚠ Low profile completion. Add more details for a better resume.
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ══════════ GENERATING ══════════ */}
            {mode === 'generating' && (
              <motion.div key="generating" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center', maxWidth: '480px' }}>
                  
                  {/* Pulsing brain icon */}
                  <div style={{
                    width: '80px', height: '80px', borderRadius: '50%', background: 'var(--color-primary-glow)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem',
                    animation: 'pulse 2s ease-in-out infinite'
                  }}>
                    <Brain size={36} color="var(--color-primary)" />
                  </div>

                  <h3 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--color-text)', margin: '0 0 0.5rem' }}>
                    Generating Your Resume
                  </h3>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '0.88rem', marginBottom: '2.5rem' }}>
                    AI is analyzing your profile and crafting a tailored resume for <strong>{jobRole || 'the target role'}</strong>
                  </p>

                  {/* Step indicators */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', textAlign: 'left' }}>
                    {GENERATION_STEPS.map((step, i) => {
                      const StepIcon = step.icon;
                      const isActive = i === genStep;
                      const isDone = i < genStep;
                      return (
                        <motion.div key={i}
                          initial={{ opacity: 0.4 }} animate={{ opacity: isDone || isActive ? 1 : 0.4 }}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.65rem 1rem',
                            borderRadius: '10px',
                            background: isActive ? 'var(--color-primary-glow)' : isDone ? 'rgba(16,185,129,0.06)' : 'transparent',
                            border: isActive ? '1px solid var(--color-primary)' : '1px solid transparent',
                          }}>
                          {isDone ? (
                            <CheckCircle2 size={18} color="#10b981" />
                          ) : isActive ? (
                            <Loader2 size={18} color="var(--color-primary)" style={{ animation: 'spin 1s linear infinite' }} />
                          ) : (
                            <StepIcon size={18} color="var(--color-text-muted)" />
                          )}
                          <span style={{ fontSize: '0.88rem', fontWeight: isActive ? 800 : 600, color: isActive ? 'var(--color-primary)' : isDone ? '#10b981' : 'var(--color-text-muted)' }}>
                            {step.label}
                          </span>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ══════════ RESULT ══════════ */}
            {mode === 'result' && generatedResume && (
              <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ height: '100%', display: 'flex' }}>

                {/* Left: Analysis Panel */}
                <div style={{ width: '400px', borderRight: '1px solid var(--color-border)', background: 'var(--color-surface)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
                  
                  {/* Tab bar */}
                  <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)' }}>
                    {[
                      { key: 'gap', label: 'Skill Gap', icon: Target },
                      { key: 'scores', label: 'Scores', icon: BarChart3 },
                      { key: 'recs', label: 'Tips', icon: Zap },
                    ].map(tab => (
                      <button key={tab.key} onClick={() => setActiveResultTab(tab.key)}
                        style={{
                          flex: 1, padding: '0.75rem 0.5rem', fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer',
                          background: 'transparent', border: 'none', borderBottom: activeResultTab === tab.key ? '2px solid var(--color-primary)' : '2px solid transparent',
                          color: activeResultTab === tab.key ? 'var(--color-primary)' : 'var(--color-text-muted)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem',
                          textTransform: 'uppercase', transition: 'all 0.2s'
                        }}>
                        <tab.icon size={13} /> {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Tab content */}
                  <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem', scrollbarWidth: 'thin' }}>

                    {/* ── SKILL GAP TAB ── */}
                    {activeResultTab === 'gap' && skillGap && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        
                        {/* Matching Skills */}
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#10b981', textTransform: 'uppercase' }}>✔ Matching Skills</span>
                            <span style={{ fontSize: '0.72rem', fontWeight: 700, background: 'rgba(16,185,129,0.1)', color: '#10b981', padding: '0.15rem 0.5rem', borderRadius: '99px' }}>
                              {(skillGap.matchingSkills || []).length}
                            </span>
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                            {(skillGap.matchingSkills || []).map((s, i) => (
                              <span key={i} style={{
                                padding: '0.3rem 0.65rem', borderRadius: '99px', fontSize: '0.72rem', fontWeight: 700,
                                background: 'rgba(16,185,129,0.08)', color: '#10b981', border: '1px solid rgba(16,185,129,0.15)'
                              }}>
                                <CheckCircle2 size={10} style={{ marginRight: '0.25rem', verticalAlign: 'middle' }} />
                                {s.name || s}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Missing Skills */}
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#ef4444', textTransform: 'uppercase' }}>✖ Missing Skills</span>
                            <span style={{ fontSize: '0.72rem', fontWeight: 700, background: 'rgba(239,68,68,0.1)', color: '#ef4444', padding: '0.15rem 0.5rem', borderRadius: '99px' }}>
                              {(skillGap.missingSkills || []).length}
                            </span>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                            {(skillGap.missingSkills || []).map((skill, i) => (
                              <div key={i} className="glass-card" style={{ padding: '0.85rem', border: '1px solid var(--color-border)', background: 'var(--color-surface-2)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                                  onClick={() => setExpandedSkill(expandedSkill === i ? null : i)}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <XCircle size={14} color="#ef4444" />
                                    <span style={{ fontWeight: 800, fontSize: '0.82rem', color: 'var(--color-text)' }}>{skill.name}</span>
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <span style={{
                                      fontSize: '0.62rem', fontWeight: 700, padding: '0.15rem 0.4rem', borderRadius: '4px',
                                      background: skill.importance === 'Critical' ? 'rgba(239,68,68,0.1)' : skill.importance === 'Important' ? 'rgba(245,158,11,0.1)' : 'rgba(107,114,128,0.1)',
                                      color: skill.importance === 'Critical' ? '#ef4444' : skill.importance === 'Important' ? '#f59e0b' : '#6b7280'
                                    }}>
                                      {skill.importance}
                                    </span>
                                    {expandedSkill === i ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                  </div>
                                </div>

                                <AnimatePresence>
                                  {expandedSkill === i && (
                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                      style={{ overflow: 'hidden', marginTop: '0.6rem', paddingTop: '0.6rem', borderTop: '1px solid var(--color-border-subtle)' }}>
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.72rem' }}>
                                        <div style={{ display: 'flex', gap: '0.4rem', color: 'var(--color-text-muted)' }}>
                                          <Shield size={12} /> <strong>Difficulty:</strong> {skill.difficulty}
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.4rem', color: 'var(--color-text-muted)' }}>
                                          <Clock size={12} /> <strong>Learning Time:</strong> {skill.estimatedLearningTime}
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.4rem', color: 'var(--color-text-muted)' }}>
                                          <TrendingUp size={12} /> <strong>Career Impact:</strong> {skill.careerImpact}
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.4rem', color: 'var(--color-text-muted)' }}>
                                          <DollarSign size={12} /> <strong>Salary Impact:</strong> {skill.salaryImpact}
                                        </div>
                                        {skill.whyItMatters && (
                                          <p style={{ color: 'var(--color-text-muted)', fontStyle: 'italic', margin: '0.25rem 0 0', lineHeight: 1.4 }}>
                                            💡 {skill.whyItMatters}
                                          </p>
                                        )}
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ── SCORES TAB ── */}
                    {activeResultTab === 'scores' && scores && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                          <ScoreRing score={scores.overall || 0} label="Overall Resume Strength" size={120} />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                          <ScoreRing score={scores.atsScore || 0} label="ATS Score" size={90} />
                          <ScoreRing score={scores.jobMatch || 0} label="Job Match" size={90} />
                          <ScoreRing score={scores.technicalMatch || 0} label="Technical Match" size={90} />
                          <ScoreRing score={scores.projectRelevance || 0} label="Project Relevance" size={90} />
                        </div>

                        {/* Improve button */}
                        <button onClick={handleImprove} disabled={improving}
                          className="btn-primary"
                          style={{
                            width: '100%', padding: '0.85rem', fontSize: '0.88rem', fontWeight: 800,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                            marginTop: '0.5rem', borderRadius: '10px',
                            opacity: improving ? 0.6 : 1
                          }}>
                          {improving ? (
                            <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Improving...</>
                          ) : (
                            <><Wand2 size={16} /> Improve My Resume</>
                          )}
                        </button>
                      </div>
                    )}

                    {/* ── RECOMMENDATIONS TAB ── */}
                    {activeResultTab === 'recs' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                          AI Recommendations
                        </span>
                        {(recommendations || []).map((rec, i) => (
                          <div key={i} className="glass-card" style={{
                            padding: '0.85rem', border: '1px solid var(--color-border)', background: 'var(--color-surface-2)',
                            display: 'flex', gap: '0.65rem', alignItems: 'flex-start'
                          }}>
                            <div style={{
                              width: '24px', height: '24px', borderRadius: '6px', flexShrink: 0,
                              background: rec.impact === 'High' ? 'rgba(16,185,129,0.1)' : rec.impact === 'Medium' ? 'rgba(245,158,11,0.1)' : 'rgba(107,114,128,0.1)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '1px'
                            }}>
                              <Zap size={12} color={rec.impact === 'High' ? '#10b981' : rec.impact === 'Medium' ? '#f59e0b' : '#6b7280'} />
                            </div>
                            <div>
                              <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text)', margin: 0, lineHeight: 1.45 }}>{rec.suggestion}</p>
                              <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.35rem' }}>
                                <span style={{
                                  fontSize: '0.62rem', fontWeight: 700, padding: '0.1rem 0.35rem', borderRadius: '4px',
                                  background: 'rgba(99,102,241,0.1)', color: '#6366f1'
                                }}>{rec.category}</span>
                                <span style={{
                                  fontSize: '0.62rem', fontWeight: 700, padding: '0.1rem 0.35rem', borderRadius: '4px',
                                  background: rec.impact === 'High' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                                  color: rec.impact === 'High' ? '#10b981' : '#f59e0b'
                                }}>{rec.impact} Impact</span>
                              </div>
                            </div>
                          </div>
                        ))}

                        {(!recommendations || recommendations.length === 0) && (
                          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', textAlign: 'center', padding: '2rem 0' }}>No recommendations generated.</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Resume Preview */}
                <div style={{ flex: 1, background: 'var(--color-bg-secondary)', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                  
                  {/* Template + Zoom controls */}
                  <div style={{ padding: '0.85rem 2rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-surface)', flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <select value={selectedTemplate} onChange={e => setSelectedTemplate(e.target.value)}
                        style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)', padding: '0.4rem 0.6rem', borderRadius: '8px', fontSize: '0.78rem', outline: 'none', fontWeight: 600 }}>
                        {TEMPLATES.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        {['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'].map(c => (
                          <button key={c} onClick={() => setAccentColor(c)}
                            style={{ width: '16px', height: '16px', borderRadius: '50%', background: c, border: `2px solid ${accentColor === c ? 'var(--color-text)' : 'transparent'}`, cursor: 'pointer' }} />
                        ))}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--color-surface-2)', padding: '3px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                      <button onClick={() => setZoom(Math.max(0.4, zoom - 0.05))} style={{ border: 'none', background: 'none', color: 'var(--color-text)', cursor: 'pointer', padding: '2px' }}><Minus size={13} /></button>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, minWidth: '35px', textAlign: 'center' }}>{Math.round(zoom * 100)}%</span>
                      <button onClick={() => setZoom(Math.min(1, zoom + 0.05))} style={{ border: 'none', background: 'none', color: 'var(--color-text)', cursor: 'pointer', padding: '2px' }}><Plus size={13} /></button>
                    </div>
                  </div>

                  {/* Resume render */}
                  <div style={{ flex: 1, overflow: 'auto', display: 'flex', justifyContent: 'center', padding: '40px', background: 'var(--color-bg)' }}>
                    <div style={{ width: 794 * zoom, height: 1123 * zoom, flexShrink: 0, position: 'relative' }}>
                      <div style={{ background: 'white', boxShadow: '0 30px 60px -15px rgba(0,0,0,0.55)', overflow: 'hidden', transform: `scale(${zoom})`, transformOrigin: 'top left', width: '794px', height: '1123px', position: 'absolute', top: 0, left: 0 }}>
                        <div ref={printRef} style={{ pointerEvents: 'none', width: '100%', height: '100%' }}>
                          <TemplateComponent data={{
                            personalInfo: generatedResume.personalInfo,
                            skills: generatedResume.skills,
                            experiences: generatedResume.experiences,
                            education: generatedResume.education,
                            projects: generatedResume.projects,
                            certifications: generatedResume.certifications,
                            achievements: generatedResume.achievements,
                            templateId: selectedTemplate,
                            customStyles: { primaryColor: accentColor, fontFamily: "'Inter', sans-serif" }
                          }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </main>

      {/* Keyframe animations */}
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.08); opacity: 0.8; } }
      `}</style>
    </div>
  );
}
