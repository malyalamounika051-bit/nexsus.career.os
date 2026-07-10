import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { profileService } from '../services/profileService';
import Sidebar from '../components/Sidebar';
import {
  User, Mail, Phone, MapPin, Globe, Link2, Briefcase, GraduationCap,
  Code2, Rocket, Award, FileText, Settings, BarChart3, Clock,
  Plus, Trash2, Save, CheckCircle2, Sparkles, ChevronRight, Upload,
  RefreshCw, Star, TrendingUp, Target, Zap, Shield, Brain, Heart,
  X, Search, AlertTriangle, Edit3, Camera, ExternalLink
} from 'lucide-react';

/* ─── Theme Tokens ─── */
const T = {
  purple: '#a855f7', purpleDark: '#7c3aed', purpleGlow: 'rgba(168,85,247,0.15)',
  cyan: '#06b6d4', cyanDark: '#0891b2', cyanGlow: 'rgba(6,182,212,0.15)',
  amber: '#f59e0b', amberDark: '#d97706', amberGlow: 'rgba(245,158,11,0.12)',
  green: '#10b981', red: '#ef4444', glass: 'rgba(255,255,255,0.03)',
  gradPrimary: 'linear-gradient(135deg, #a855f7, #06b6d4)',
  gradWarm: 'linear-gradient(135deg, #f59e0b, #ef4444)',
  gradCool: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
  gradSuccess: 'linear-gradient(135deg, #10b981, #06b6d4)',
};

/* ─── Skill Categories & Suggestions ─── */
const SKILL_CATEGORIES = [
  'Programming Languages', 'Frameworks', 'Databases', 'Cloud', 'AI & ML',
  'Cybersecurity', 'DevOps', 'Mobile', 'Soft Skills', 'Tools', 'Other'
];
const SKILL_SUGGESTIONS = {
  'Programming Languages': ['JavaScript', 'Python', 'Java', 'C++', 'TypeScript', 'Go', 'Rust', 'C#', 'Ruby', 'Swift', 'Kotlin', 'PHP', 'R', 'Scala'],
  'Frameworks': ['React', 'Angular', 'Vue.js', 'Next.js', 'Express.js', 'Django', 'Flask', 'Spring Boot', 'FastAPI', 'NestJS', 'Svelte', 'Laravel', 'Rails'],
  'Databases': ['MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Elasticsearch', 'Cassandra', 'DynamoDB', 'Firebase', 'SQLite', 'Neo4j'],
  'Cloud': ['AWS', 'Azure', 'GCP', 'Heroku', 'Vercel', 'Netlify', 'DigitalOcean', 'Cloudflare'],
  'AI & ML': ['TensorFlow', 'PyTorch', 'Scikit-learn', 'Keras', 'OpenCV', 'Hugging Face', 'LangChain', 'Pandas', 'NumPy'],
  'Cybersecurity': ['Nmap', 'Wireshark', 'Metasploit', 'Burp Suite', 'OWASP', 'Kali Linux'],
  'DevOps': ['Docker', 'Kubernetes', 'Jenkins', 'GitHub Actions', 'Terraform', 'Ansible', 'CI/CD', 'Nginx', 'Linux'],
  'Mobile': ['React Native', 'Flutter', 'Swift', 'Kotlin', 'Ionic', 'Xamarin'],
  'Soft Skills': ['Communication', 'Leadership', 'Problem Solving', 'Teamwork', 'Time Management', 'Critical Thinking', 'Adaptability'],
  'Tools': ['Git', 'VS Code', 'Postman', 'Figma', 'Jira', 'Notion', 'Slack', 'Docker Desktop'],
  'Other': []
};
const EXPERIENCE_TYPES = ['Internship', 'Full-time', 'Part-time', 'Freelance', 'Research', 'Volunteer'];
const ACHIEVEMENT_TYPES = ['Hackathon', 'Coding Contest', 'Research Paper', 'Scholarship', 'Award', 'Open Source', 'Other'];
const PROFICIENCY_LEVELS = ['Beginner', 'Intermediate', 'Advanced'];

const TABS = [
  { id: 'personal', label: 'Personal', icon: User },
  { id: 'education', label: 'Education', icon: GraduationCap },
  { id: 'skills', label: 'Skills', icon: Code2 },
  { id: 'projects', label: 'Projects', icon: Rocket },
  { id: 'experience', label: 'Experience', icon: Briefcase },
  { id: 'certifications', label: 'Certifications', icon: Award },
  { id: 'achievements', label: 'Achievements', icon: Star },
  { id: 'resume', label: 'Resume', icon: FileText },
  { id: 'preferences', label: 'Preferences', icon: Settings },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'activity', label: 'Activity', icon: Clock },
];

/* ─── Reusable Components ─── */
const labelStyle = { fontSize: '0.8rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.35rem', display: 'block' };

const Input = ({ label, icon: Icon, ...props }) => (
  <div style={{ width: '100%' }}>
    {label && <label style={labelStyle}>{label}</label>}
    <div style={{ position: 'relative' }}>
      {Icon && <Icon size={14} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.35)' }} />}
      <input {...props} style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', padding: `0.7rem ${Icon ? '2.5rem' : '0.85rem'}`, borderRadius: '10px', fontSize: '0.9rem', outline: 'none', transition: 'all 0.2s', ...(props.style || {}) }} />
    </div>
  </div>
);

const TextArea = ({ label, rows = 3, ...props }) => (
  <div style={{ width: '100%' }}>
    {label && <label style={labelStyle}>{label}</label>}
    <textarea {...props} rows={rows} style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', padding: '0.85rem', borderRadius: '10px', fontSize: '0.9rem', outline: 'none', resize: 'vertical', fontFamily: 'inherit', transition: 'all 0.2s', ...(props.style || {}) }} />
  </div>
);

const Select = ({ label, options, ...props }) => (
  <div style={{ width: '100%' }}>
    {label && <label style={labelStyle}>{label}</label>}
    <select {...props} style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', padding: '0.7rem 0.85rem', borderRadius: '10px', fontSize: '0.9rem', outline: 'none', ...(props.style || {}) }}>
      {options.map(o => <option key={o} value={o} style={{ background: '#1a1a2e' }}>{o}</option>)}
    </select>
  </div>
);

const GlassCard = ({ children, style, glow, ...props }) => (
  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} style={{ background: T.glass, backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '1.75rem', boxShadow: glow ? `0 0 40px ${glow}` : 'none', ...style }} {...props}>
    {children}
  </motion.div>
);

const SectionHeader = ({ icon: Icon, title, subtitle, action }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '1rem' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
      <div style={{ width: 36, height: 36, borderRadius: '10px', background: T.purpleGlow, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={18} color={T.purple} />
      </div>
      <div>
        <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#fff' }}>{title}</h3>
        {subtitle && <p style={{ margin: 0, fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>{subtitle}</p>}
      </div>
    </div>
    {action}
  </div>
);

const StatCard = ({ label, value, icon: Icon, color, glow }) => (
  <motion.div whileHover={{ scale: 1.03, y: -2 }} style={{ background: T.glass, backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', padding: '1.15rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.85rem', boxShadow: `0 0 30px ${glow}`, cursor: 'default', minWidth: 0 }}>
    <div style={{ width: 42, height: 42, borderRadius: '12px', background: glow, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Icon size={20} color={color} />
    </div>
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: '1.35rem', fontWeight: 900, color }}>{value}</div>
      <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</div>
    </div>
  </motion.div>
);

const CircleProgress = ({ value, size = 90, strokeWidth = 7, color = T.purple }) => {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={strokeWidth} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={strokeWidth} strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
    </svg>
  );
};

/* ─── Main Component ─── */
export default function ProfilePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('personal');
  const autoSaveTimer = useRef(null);

  // Auto-save state
  const [saveStatus, setSaveStatus] = useState('idle'); // idle | saving | saved | error
  const [lastSaved, setLastSaved] = useState(null);

  // Profile data
  const [profile, setProfile] = useState({
    fullName: '', headline: '', profilePhoto: '', email: '', phone: '', location: '',
    linkedIn: '', github: '', portfolio: '',
    education: [],
    skills: [],
    projects: [],
    experience: [],
    certifications: [],
    achievements: [],
    resumeUrl: '', resumeText: '', resumeFileName: '',
    preferences: { preferredLocation: '', workMode: 'Any', expectedSalary: '', preferredRoles: [], preferredCompanies: [], noticePeriod: '' },
    profileCompletion: { percentage: 0, completedSections: [], missingSections: [] },
    aiAnalysis: null,
    activities: []
  });

  // UI state
  const [skillSearch, setSkillSearch] = useState('');
  const [selectedSkillCategory, setSelectedSkillCategory] = useState('Programming Languages');
  const [aiEnhancing, setAiEnhancing] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [resumeUploading, setResumeUploading] = useState(false);
  const [parsedResume, setParsedResume] = useState(null);
  const [mergeModalOpen, setMergeModalOpen] = useState(false);
  const [roleInput, setRoleInput] = useState('');
  const [companyInput, setCompanyInput] = useState('');

  /* ─── Load Profile ─── */
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const { data } = await profileService.getProfile();
      if (data.data) {
        setProfile(prev => ({ ...prev, ...data.data }));
      }
    } catch (e) {
      console.error('Failed to load profile:', e);
    } finally {
      setLoading(false);
    }
  };

  /* ─── Auto-Save with Debounce ─── */
  const triggerAutoSave = useCallback((updatedProfile) => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(async () => {
      setSaveStatus('saving');
      try {
        const { data } = await profileService.saveProfile(updatedProfile);
        if (data.data) {
          setProfile(prev => ({ ...prev, profileCompletion: data.data.profileCompletion || prev.profileCompletion }));
        }
        setSaveStatus('saved');
        setLastSaved(new Date());
        setTimeout(() => setSaveStatus('idle'), 3000);
      } catch (e) {
        setSaveStatus('error');
        console.error('Auto-save failed:', e);
        setTimeout(() => setSaveStatus('idle'), 4000);
      }
    }, 1500);
  }, []);

  const updateProfile = (key, value) => {
    const updated = { ...profile, [key]: value };
    setProfile(updated);
    triggerAutoSave(updated);
  };

  const updateField = (key, value) => {
    const updated = { ...profile, [key]: value };
    setProfile(updated);
    triggerAutoSave(updated);
  };

  const updatePreference = (key, value) => {
    const newPrefs = { ...profile.preferences, [key]: value };
    const updated = { ...profile, preferences: newPrefs };
    setProfile(updated);
    triggerAutoSave(updated);
  };

  /* ─── AI Enhance Project ─── */
  const handleAIEnhanceProject = async (index) => {
    const proj = profile.projects[index];
    if (!proj?.title) return;
    setAiEnhancing(index);
    try {
      const { data } = await profileService.aiEnhanceProject({
        title: proj.title, shortDescription: proj.shortDescription,
        technologies: proj.technologies, githubRepo: proj.githubRepo
      });
      if (data.data) {
        const updated = [...profile.projects];
        updated[index] = { ...updated[index], aiGenerated: data.data };
        updateProfile('projects', updated);
      }
    } catch (e) { console.error(e); }
    finally { setAiEnhancing(null); }
  };

  /* ─── AI Profile Analysis ─── */
  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const { data } = await profileService.analyzeProfile();
      if (data.data) {
        setProfile(prev => ({ ...prev, aiAnalysis: data.data }));
      }
    } catch (e) { console.error(e); }
    finally { setAnalyzing(false); }
  };

  /* ─── Resume Upload ─── */
  const handleResumeUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setResumeUploading(true);
    try {
      const formData = new FormData();
      formData.append('resume', file);
      const { data } = await profileService.uploadResume(formData);
      if (data.data) {
        setParsedResume(data.data.parsedData);
        setProfile(prev => ({ ...prev, resumeFileName: file.name, resumeUploadedAt: new Date() }));
        setMergeModalOpen(true);
      }
    } catch (e) { console.error(e); }
    finally { setResumeUploading(false); }
  };

  const handleMergeAction = async (action) => {
    try {
      const { data } = await profileService.mergeResume({ action, parsedData: parsedResume });
      if (data.data) setProfile(prev => ({ ...prev, ...data.data }));
      setMergeModalOpen(false);
      setParsedResume(null);
    } catch (e) { console.error(e); }
  };

  /* ─── Helpers ─── */
  const addToArray = (key, template) => {
    const updated = [...(profile[key] || []), template];
    updateProfile(key, updated);
  };

  const removeFromArray = (key, index) => {
    const updated = profile[key].filter((_, i) => i !== index);
    updateProfile(key, updated);
  };

  const updateArrayItem = (key, index, field, value) => {
    const updated = [...profile[key]];
    updated[index] = { ...updated[index], [field]: value };
    updateProfile(key, updated);
  };

  const timeSince = (date) => {
    if (!date) return '';
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const completion = profile.profileCompletion?.percentage || 0;
  const ai = profile.aiAnalysis || {};

  /* ─── LOADING ─── */
  if (loading) {
    return (
      <div className="app-shell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0a0a1a' }}>
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
          <RefreshCw size={32} color={T.purple} />
        </motion.div>
      </div>
    );
  }

  /* ─── RENDER SECTIONS ─── */
  const renderPersonal = () => (
    <GlassCard>
      <SectionHeader icon={User} title="Personal Information" subtitle="Your professional identity" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.15rem' }}>
        <Input label="Full Name" icon={User} value={profile.fullName || ''} onChange={e => updateField('fullName', e.target.value)} placeholder="John Doe" />
        <Input label="Headline" icon={Sparkles} value={profile.headline || ''} onChange={e => updateField('headline', e.target.value)} placeholder="Full Stack Developer | AI Enthusiast" />
        <Input label="Email" icon={Mail} value={profile.email || ''} onChange={e => updateField('email', e.target.value)} placeholder="john@example.com" />
        <Input label="Phone" icon={Phone} value={profile.phone || ''} onChange={e => updateField('phone', e.target.value)} placeholder="+91 9876543210" />
        <Input label="Location" icon={MapPin} value={profile.location || ''} onChange={e => updateField('location', e.target.value)} placeholder="Hyderabad, India" />
        <Input label="LinkedIn" icon={Link2} value={profile.linkedIn || ''} onChange={e => updateField('linkedIn', e.target.value)} placeholder="https://linkedin.com/in/..." />
        <Input label="GitHub" icon={Link2} value={profile.github || ''} onChange={e => updateField('github', e.target.value)} placeholder="https://github.com/..." />
        <Input label="Portfolio" icon={Globe} value={profile.portfolio || ''} onChange={e => updateField('portfolio', e.target.value)} placeholder="https://portfolio.dev" />
      </div>
    </GlassCard>
  );

  const renderEducation = () => (
    <GlassCard>
      <SectionHeader icon={GraduationCap} title="Education" subtitle="Academic background"
        action={<button onClick={() => addToArray('education', { degree: '', branch: '', college: '', university: '', startYear: '', endYear: '', cgpa: '', currentSemester: '', currentlyStudying: false })} style={{ background: T.purpleGlow, border: `1px solid ${T.purple}40`, color: T.purple, padding: '0.45rem 1rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem' }}><Plus size={14} /> Add</button>} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {(profile.education || []).map((edu, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', padding: '1.5rem', position: 'relative' }}>
            <button onClick={() => removeFromArray('education', i)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: T.red, borderRadius: '8px', padding: '0.35rem', cursor: 'pointer' }}><Trash2 size={14} /></button>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <Input label="Degree" value={edu.degree || ''} onChange={e => updateArrayItem('education', i, 'degree', e.target.value)} placeholder="B.Tech" />
              <Input label="Branch" value={edu.branch || ''} onChange={e => updateArrayItem('education', i, 'branch', e.target.value)} placeholder="Computer Science" />
              <Input label="College" value={edu.college || ''} onChange={e => updateArrayItem('education', i, 'college', e.target.value)} placeholder="IIT Delhi" />
              <Input label="University" value={edu.university || ''} onChange={e => updateArrayItem('education', i, 'university', e.target.value)} placeholder="Delhi University" />
              <Input label="Start Year" value={edu.startYear || ''} onChange={e => updateArrayItem('education', i, 'startYear', e.target.value)} placeholder="2020" />
              <Input label="End Year" value={edu.endYear || ''} onChange={e => updateArrayItem('education', i, 'endYear', e.target.value)} placeholder="2024" />
              <Input label="CGPA / Percentage" value={edu.cgpa || ''} onChange={e => updateArrayItem('education', i, 'cgpa', e.target.value)} placeholder="8.5 / 85%" />
              <Input label="Current Semester" value={edu.currentSemester || ''} onChange={e => updateArrayItem('education', i, 'currentSemester', e.target.value)} placeholder="6" />
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem', color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={edu.currentlyStudying || false} onChange={e => updateArrayItem('education', i, 'currentlyStudying', e.target.checked)} style={{ accentColor: T.purple }} />
              Currently Studying
            </label>
          </motion.div>
        ))}
        {(profile.education || []).length === 0 && (
          <div style={{ textAlign: 'center', padding: '2.5rem', color: 'rgba(255,255,255,0.3)', fontSize: '0.9rem' }}>
            <GraduationCap size={36} style={{ marginBottom: '0.75rem', opacity: 0.3 }} /><br />
            No education added yet. Click "Add" to get started.
          </div>
        )}
      </div>
    </GlassCard>
  );

  const renderSkills = () => {
    const filteredSuggestions = (SKILL_SUGGESTIONS[selectedSkillCategory] || []).filter(s =>
      !profile.skills?.some(sk => sk.name.toLowerCase() === s.toLowerCase()) &&
      (!skillSearch || s.toLowerCase().includes(skillSearch.toLowerCase()))
    );

    return (
      <GlassCard>
        <SectionHeader icon={Code2} title="Skills" subtitle="Technical & soft skills with proficiency levels" />

        {/* Category Tabs */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1.25rem' }}>
          {SKILL_CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setSelectedSkillCategory(cat)} style={{ background: selectedSkillCategory === cat ? T.purpleGlow : 'rgba(255,255,255,0.03)', border: `1px solid ${selectedSkillCategory === cat ? T.purple + '50' : 'rgba(255,255,255,0.06)'}`, color: selectedSkillCategory === cat ? T.purple : 'rgba(255,255,255,0.5)', padding: '0.35rem 0.75rem', borderRadius: '8px', fontSize: '0.73rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>
              {cat}
            </button>
          ))}
        </div>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: '1rem' }}>
          <Search size={14} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
          <input value={skillSearch} onChange={e => setSkillSearch(e.target.value)} placeholder="Search skills..." style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', padding: '0.65rem 0.85rem 0.65rem 2.5rem', borderRadius: '10px', fontSize: '0.85rem', outline: 'none' }} />
        </div>

        {/* Suggestions */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1.5rem' }}>
          {filteredSuggestions.slice(0, 12).map(s => (
            <motion.button key={s} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => { updateProfile('skills', [...(profile.skills || []), { name: s, category: selectedSkillCategory, proficiency: 'Beginner' }]); }} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', padding: '0.35rem 0.7rem', borderRadius: '20px', fontSize: '0.78rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Plus size={12} /> {s}
            </motion.button>
          ))}
        </div>

        {/* Added Skills */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {(profile.skills || []).map((sk, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '0.6rem 0.85rem' }}>
              <span style={{ flex: 1, fontSize: '0.88rem', color: '#fff', fontWeight: 600 }}>{sk.name}</span>
              <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.35)', background: 'rgba(255,255,255,0.04)', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>{sk.category}</span>
              <select value={sk.proficiency || 'Beginner'} onChange={e => updateArrayItem('skills', i, 'proficiency', e.target.value)} style={{ background: 'rgba(168,85,247,0.1)', border: `1px solid ${T.purple}40`, color: T.purple, padding: '0.25rem 0.5rem', borderRadius: '6px', fontSize: '0.73rem', fontWeight: 600, outline: 'none' }}>
                {PROFICIENCY_LEVELS.map(l => <option key={l} value={l} style={{ background: '#1a1a2e' }}>{l}</option>)}
              </select>
              <button onClick={() => removeFromArray('skills', i)} style={{ background: 'none', border: 'none', color: 'rgba(239,68,68,0.6)', cursor: 'pointer', padding: '0.2rem' }}><X size={14} /></button>
            </motion.div>
          ))}
          {(profile.skills || []).length === 0 && (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem' }}>
              Click skill suggestions above to add skills
            </div>
          )}
        </div>
      </GlassCard>
    );
  };

  const renderProjects = () => (
    <GlassCard>
      <SectionHeader icon={Rocket} title="Projects" subtitle="Showcase your work"
        action={<button onClick={() => addToArray('projects', { title: '', shortDescription: '', technologies: [], skillsLearned: [], role: '', teamSize: '', duration: '', githubRepo: '', liveDemo: '', problemStatement: '', solution: '', keyFeatures: [], aiGenerated: null })} style={{ background: T.purpleGlow, border: `1px solid ${T.purple}40`, color: T.purple, padding: '0.45rem 1rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem' }}><Plus size={14} /> Add Project</button>} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {(profile.projects || []).map((proj, i) => (
          <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', padding: '1.5rem', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', gap: '0.4rem' }}>
              <button onClick={() => handleAIEnhanceProject(i)} disabled={aiEnhancing === i} style={{ background: 'rgba(168,85,247,0.1)', border: `1px solid ${T.purple}40`, color: T.purple, borderRadius: '8px', padding: '0.35rem 0.65rem', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Sparkles size={12} /> {aiEnhancing === i ? 'Generating...' : '✨ AI Enhance'}
              </button>
              <button onClick={() => removeFromArray('projects', i)} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: T.red, borderRadius: '8px', padding: '0.35rem', cursor: 'pointer' }}><Trash2 size={14} /></button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.5rem' }}>
              <Input label="Project Title" value={proj.title || ''} onChange={e => updateArrayItem('projects', i, 'title', e.target.value)} placeholder="AI Career Advisor" />
              <Input label="Your Role" value={proj.role || ''} onChange={e => updateArrayItem('projects', i, 'role', e.target.value)} placeholder="Lead Developer" />
              <Input label="Team Size" value={proj.teamSize || ''} onChange={e => updateArrayItem('projects', i, 'teamSize', e.target.value)} placeholder="4" />
              <Input label="Duration" value={proj.duration || ''} onChange={e => updateArrayItem('projects', i, 'duration', e.target.value)} placeholder="3 months" />
              <Input label="GitHub Repository" icon={Link2} value={proj.githubRepo || ''} onChange={e => updateArrayItem('projects', i, 'githubRepo', e.target.value)} placeholder="https://github.com/..." />
              <Input label="Live Demo" icon={ExternalLink} value={proj.liveDemo || ''} onChange={e => updateArrayItem('projects', i, 'liveDemo', e.target.value)} placeholder="https://demo.app" />
              <div style={{ gridColumn: 'span 2' }}>
                <TextArea label="Short Description" value={proj.shortDescription || ''} onChange={e => updateArrayItem('projects', i, 'shortDescription', e.target.value)} placeholder="A brief description of your project..." rows={2} />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <Input label="Technologies (comma-separated)" value={(proj.technologies || []).join(', ')} onChange={e => updateArrayItem('projects', i, 'technologies', e.target.value.split(',').map(t => t.trim()).filter(Boolean))} placeholder="React, Node.js, MongoDB" />
              </div>
            </div>

            {/* AI Generated Content */}
            {proj.aiGenerated && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} style={{ marginTop: '1.25rem', background: 'rgba(168,85,247,0.05)', border: `1px solid ${T.purple}25`, borderRadius: '12px', padding: '1.25rem' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 800, color: T.purple, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Sparkles size={13} /> AI-Generated Content</div>
                {proj.aiGenerated.resumeBullets?.length > 0 && (
                  <div style={{ marginBottom: '0.85rem' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: '0.3rem' }}>RESUME BULLETS</div>
                    {proj.aiGenerated.resumeBullets.map((b, bi) => (
                      <div key={bi} style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.7)', padding: '0.2rem 0', display: 'flex', gap: '0.4rem' }}>
                        <ChevronRight size={12} style={{ flexShrink: 0, marginTop: '0.2rem' }} color={T.cyan} /> {b}
                      </div>
                    ))}
                  </div>
                )}
                {proj.aiGenerated.atsKeywords?.length > 0 && (
                  <div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: '0.3rem' }}>ATS KEYWORDS</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                      {proj.aiGenerated.atsKeywords.map((k, ki) => (
                        <span key={ki} style={{ background: T.cyanGlow, border: `1px solid ${T.cyan}30`, color: T.cyan, padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.72rem' }}>{k}</span>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </motion.div>
        ))}
        {(profile.projects || []).length === 0 && (
          <div style={{ textAlign: 'center', padding: '2.5rem', color: 'rgba(255,255,255,0.3)', fontSize: '0.9rem' }}>
            <Rocket size={36} style={{ marginBottom: '0.75rem', opacity: 0.3 }} /><br />
            No projects added yet. Click "Add Project" to showcase your work.
          </div>
        )}
      </div>
    </GlassCard>
  );

  const renderExperience = () => (
    <GlassCard>
      <SectionHeader icon={Briefcase} title="Experience" subtitle="Professional experience"
        action={<button onClick={() => addToArray('experience', { type: 'Internship', company: '', role: '', startDate: '', endDate: '', currentlyWorking: false, technologies: [], responsibilities: [], achievements: [] })} style={{ background: T.purpleGlow, border: `1px solid ${T.purple}40`, color: T.purple, padding: '0.45rem 1rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem' }}><Plus size={14} /> Add</button>} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {(profile.experience || []).map((exp, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', padding: '1.5rem', position: 'relative' }}>
            <button onClick={() => removeFromArray('experience', i)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: T.red, borderRadius: '8px', padding: '0.35rem', cursor: 'pointer' }}><Trash2 size={14} /></button>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <Select label="Type" options={EXPERIENCE_TYPES} value={exp.type || 'Internship'} onChange={e => updateArrayItem('experience', i, 'type', e.target.value)} />
              <Input label="Company" value={exp.company || ''} onChange={e => updateArrayItem('experience', i, 'company', e.target.value)} placeholder="Google" />
              <Input label="Role" value={exp.role || ''} onChange={e => updateArrayItem('experience', i, 'role', e.target.value)} placeholder="Software Engineer Intern" />
              <Input label="Start Date" value={exp.startDate || ''} onChange={e => updateArrayItem('experience', i, 'startDate', e.target.value)} placeholder="Jan 2024" />
              <Input label="End Date" value={exp.endDate || ''} onChange={e => updateArrayItem('experience', i, 'endDate', e.target.value)} placeholder="Jun 2024" />
              <div style={{ gridColumn: 'span 2' }}>
                <Input label="Technologies (comma-separated)" value={(exp.technologies || []).join(', ')} onChange={e => updateArrayItem('experience', i, 'technologies', e.target.value.split(',').map(t => t.trim()).filter(Boolean))} placeholder="React, Node.js, AWS" />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <TextArea label="Responsibilities (one per line)" value={(exp.responsibilities || []).join('\n')} onChange={e => updateArrayItem('experience', i, 'responsibilities', e.target.value.split('\n').filter(Boolean))} placeholder="Led frontend development...&#10;Implemented CI/CD pipeline..." rows={3} />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <TextArea label="Achievements (one per line)" value={(exp.achievements || []).join('\n')} onChange={e => updateArrayItem('experience', i, 'achievements', e.target.value.split('\n').filter(Boolean))} placeholder="Reduced page load time by 40%&#10;Improved test coverage to 90%" rows={2} />
              </div>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem', color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={exp.currentlyWorking || false} onChange={e => updateArrayItem('experience', i, 'currentlyWorking', e.target.checked)} style={{ accentColor: T.purple }} />
              Currently Working Here
            </label>
          </motion.div>
        ))}
        {(profile.experience || []).length === 0 && (
          <div style={{ textAlign: 'center', padding: '2.5rem', color: 'rgba(255,255,255,0.3)', fontSize: '0.9rem' }}>
            <Briefcase size={36} style={{ marginBottom: '0.75rem', opacity: 0.3 }} /><br />
            No experience added yet.
          </div>
        )}
      </div>
    </GlassCard>
  );

  const renderCertifications = () => (
    <GlassCard>
      <SectionHeader icon={Award} title="Certifications" subtitle="Professional certifications & courses"
        action={<button onClick={() => addToArray('certifications', { name: '', organization: '', issueDate: '', credentialId: '', credentialUrl: '' })} style={{ background: T.purpleGlow, border: `1px solid ${T.purple}40`, color: T.purple, padding: '0.45rem 1rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem' }}><Plus size={14} /> Add</button>} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {(profile.certifications || []).map((cert, i) => (
          <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', padding: '1.25rem', position: 'relative' }}>
            <button onClick={() => removeFromArray('certifications', i)} style={{ position: 'absolute', top: '0.85rem', right: '0.85rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: T.red, borderRadius: '8px', padding: '0.35rem', cursor: 'pointer' }}><Trash2 size={14} /></button>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <Input label="Certificate Name" value={cert.name || ''} onChange={e => updateArrayItem('certifications', i, 'name', e.target.value)} placeholder="AWS Solutions Architect" />
              <Input label="Organization" value={cert.organization || ''} onChange={e => updateArrayItem('certifications', i, 'organization', e.target.value)} placeholder="Amazon Web Services" />
              <Input label="Issue Date" value={cert.issueDate || ''} onChange={e => updateArrayItem('certifications', i, 'issueDate', e.target.value)} placeholder="March 2024" />
              <Input label="Credential ID" value={cert.credentialId || ''} onChange={e => updateArrayItem('certifications', i, 'credentialId', e.target.value)} placeholder="ABC123XYZ" />
              <div style={{ gridColumn: 'span 2' }}>
                <Input label="Credential URL" icon={Link2} value={cert.credentialUrl || ''} onChange={e => updateArrayItem('certifications', i, 'credentialUrl', e.target.value)} placeholder="https://verify.cert.com/..." />
              </div>
            </div>
          </motion.div>
        ))}
        {(profile.certifications || []).length === 0 && (
          <div style={{ textAlign: 'center', padding: '2.5rem', color: 'rgba(255,255,255,0.3)', fontSize: '0.9rem' }}>
            <Award size={36} style={{ marginBottom: '0.75rem', opacity: 0.3 }} /><br />
            No certifications added yet.
          </div>
        )}
      </div>
    </GlassCard>
  );

  const renderAchievements = () => (
    <GlassCard>
      <SectionHeader icon={Star} title="Achievements" subtitle="Awards, hackathons, competitions"
        action={<button onClick={() => addToArray('achievements', { type: 'Hackathon', title: '', description: '', date: '', link: '' })} style={{ background: T.purpleGlow, border: `1px solid ${T.purple}40`, color: T.purple, padding: '0.45rem 1rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem' }}><Plus size={14} /> Add</button>} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {(profile.achievements || []).map((ach, i) => (
          <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', padding: '1.25rem', position: 'relative' }}>
            <button onClick={() => removeFromArray('achievements', i)} style={{ position: 'absolute', top: '0.85rem', right: '0.85rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: T.red, borderRadius: '8px', padding: '0.35rem', cursor: 'pointer' }}><Trash2 size={14} /></button>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <Select label="Type" options={ACHIEVEMENT_TYPES} value={ach.type || 'Other'} onChange={e => updateArrayItem('achievements', i, 'type', e.target.value)} />
              <Input label="Title" value={ach.title || ''} onChange={e => updateArrayItem('achievements', i, 'title', e.target.value)} placeholder="1st Place - HackMIT" />
              <div style={{ gridColumn: 'span 2' }}>
                <TextArea label="Description" value={ach.description || ''} onChange={e => updateArrayItem('achievements', i, 'description', e.target.value)} placeholder="Built an AI-powered..." rows={2} />
              </div>
              <Input label="Date" value={ach.date || ''} onChange={e => updateArrayItem('achievements', i, 'date', e.target.value)} placeholder="March 2024" />
              <Input label="Link" icon={Link2} value={ach.link || ''} onChange={e => updateArrayItem('achievements', i, 'link', e.target.value)} placeholder="https://..." />
            </div>
          </motion.div>
        ))}
        {(profile.achievements || []).length === 0 && (
          <div style={{ textAlign: 'center', padding: '2.5rem', color: 'rgba(255,255,255,0.3)', fontSize: '0.9rem' }}>
            <Star size={36} style={{ marginBottom: '0.75rem', opacity: 0.3 }} /><br />
            No achievements added yet.
          </div>
        )}
      </div>
    </GlassCard>
  );

  const renderResume = () => (
    <GlassCard>
      <SectionHeader icon={FileText} title="Resume Upload" subtitle="Upload and parse your resume" />
      <div style={{ border: '2px dashed rgba(255,255,255,0.1)', borderRadius: '16px', padding: '3rem 2rem', textAlign: 'center', background: 'rgba(255,255,255,0.01)', cursor: 'pointer', position: 'relative', transition: 'all 0.3s' }}>
        <input type="file" accept=".pdf,.docx" onChange={handleResumeUpload} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
        {resumeUploading ? (
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
            <RefreshCw size={40} color={T.purple} />
          </motion.div>
        ) : (
          <>
            <Upload size={40} color={T.purple} style={{ marginBottom: '1rem' }} />
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', marginBottom: '0.35rem' }}>Drop your resume here or click to browse</div>
            <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>Supports PDF and DOCX (Max 5MB)</div>
          </>
        )}
      </div>
      {profile.resumeFileName && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginTop: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '12px', padding: '1rem 1.25rem' }}>
          <FileText size={20} color={T.green} />
          <div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}>{profile.resumeFileName}</div>
            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>Uploaded {profile.resumeUploadedAt ? timeSince(profile.resumeUploadedAt) : ''}</div>
          </div>
          <CheckCircle2 size={18} color={T.green} style={{ marginLeft: 'auto' }} />
        </motion.div>
      )}
    </GlassCard>
  );

  const renderPreferences = () => (
    <GlassCard>
      <SectionHeader icon={Settings} title="Career Preferences" subtitle="Help us find the right opportunities" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.15rem' }}>
        <Input label="Preferred Location" icon={MapPin} value={profile.preferences?.preferredLocation || ''} onChange={e => updatePreference('preferredLocation', e.target.value)} placeholder="Bangalore, India" />
        <Select label="Work Mode" options={['Any', 'Remote', 'Hybrid', 'Onsite']} value={profile.preferences?.workMode || 'Any'} onChange={e => updatePreference('workMode', e.target.value)} />
        <Input label="Expected Salary" value={profile.preferences?.expectedSalary || ''} onChange={e => updatePreference('expectedSalary', e.target.value)} placeholder="12-18 LPA" />
        <Input label="Notice Period" value={profile.preferences?.noticePeriod || ''} onChange={e => updatePreference('noticePeriod', e.target.value)} placeholder="30 days" />
      </div>

      {/* Preferred Roles */}
      <div style={{ marginTop: '1.5rem' }}>
        <label style={labelStyle}>Preferred Roles</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.75rem' }}>
          {(profile.preferences?.preferredRoles || []).map((role, i) => (
            <span key={i} style={{ background: T.cyanGlow, border: `1px solid ${T.cyan}30`, color: T.cyan, padding: '0.3rem 0.65rem', borderRadius: '20px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              {role}
              <button onClick={() => { const r = [...(profile.preferences?.preferredRoles || [])]; r.splice(i, 1); updatePreference('preferredRoles', r); }} style={{ background: 'none', border: 'none', color: T.cyan, cursor: 'pointer', padding: 0 }}>×</button>
            </span>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input value={roleInput} onChange={e => setRoleInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && roleInput.trim()) { updatePreference('preferredRoles', [...(profile.preferences?.preferredRoles || []), roleInput.trim()]); setRoleInput(''); } }} placeholder="Add a role..." style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', padding: '0.6rem 0.85rem', borderRadius: '10px', fontSize: '0.85rem', outline: 'none' }} />
          <button onClick={() => { if (roleInput.trim()) { updatePreference('preferredRoles', [...(profile.preferences?.preferredRoles || []), roleInput.trim()]); setRoleInput(''); } }} style={{ background: T.purpleGlow, border: `1px solid ${T.purple}40`, color: T.purple, padding: '0.5rem 1rem', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>Add</button>
        </div>
      </div>

      {/* Preferred Companies */}
      <div style={{ marginTop: '1.5rem' }}>
        <label style={labelStyle}>Dream Companies</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.75rem' }}>
          {(profile.preferences?.preferredCompanies || []).map((co, i) => (
            <span key={i} style={{ background: T.amberGlow, border: `1px solid ${T.amber}30`, color: T.amber, padding: '0.3rem 0.65rem', borderRadius: '20px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              {co}
              <button onClick={() => { const c = [...(profile.preferences?.preferredCompanies || [])]; c.splice(i, 1); updatePreference('preferredCompanies', c); }} style={{ background: 'none', border: 'none', color: T.amber, cursor: 'pointer', padding: 0 }}>×</button>
            </span>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input value={companyInput} onChange={e => setCompanyInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && companyInput.trim()) { updatePreference('preferredCompanies', [...(profile.preferences?.preferredCompanies || []), companyInput.trim()]); setCompanyInput(''); } }} placeholder="Add a company..." style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', padding: '0.6rem 0.85rem', borderRadius: '10px', fontSize: '0.85rem', outline: 'none' }} />
          <button onClick={() => { if (companyInput.trim()) { updatePreference('preferredCompanies', [...(profile.preferences?.preferredCompanies || []), companyInput.trim()]); setCompanyInput(''); } }} style={{ background: T.amberGlow, border: `1px solid ${T.amber}40`, color: T.amber, padding: '0.5rem 1rem', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>Add</button>
        </div>
      </div>
    </GlassCard>
  );

  const renderAnalytics = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <GlassCard glow={T.purpleGlow}>
        <SectionHeader icon={BarChart3} title="Career Health Dashboard" subtitle="AI-powered profile analysis"
          action={<button onClick={handleAnalyze} disabled={analyzing} style={{ background: T.gradPrimary, border: 'none', color: '#fff', padding: '0.5rem 1.15rem', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem' }}><Brain size={14} /> {analyzing ? 'Analyzing...' : 'Run Analysis'}</button>} />

        {ai.lastAnalyzed ? (
          <>
            {/* Score Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
              {[
                { label: 'Job Readiness', value: ai.jobReadinessScore || 0, color: T.purple },
                { label: 'Interview Ready', value: ai.interviewReadiness || 0, color: T.cyan },
                { label: 'Resume Quality', value: ai.resumeQuality || 0, color: T.green },
                { label: 'Project Strength', value: ai.projectStrength || 0, color: T.amber },
                { label: 'Skill Market Fit', value: ai.skillMarketFit || 0, color: '#3b82f6' },
                { label: 'ATS Score', value: ai.atsScore || 0, color: '#ec4899' },
              ].map((item, idx) => (
                <div key={idx} style={{ textAlign: 'center', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', padding: '1.15rem 0.75rem' }}>
                  <div style={{ position: 'relative', display: 'inline-block', marginBottom: '0.5rem' }}>
                    <CircleProgress value={item.value} size={72} strokeWidth={6} color={item.color} />
                    <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(90deg)', fontSize: '1rem', fontWeight: 900, color: item.color }}>{item.value}%</span>
                  </div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>{item.label}</div>
                </div>
              ))}
            </div>

            {/* Hiring Probability */}
            <div style={{ background: ai.hiringProbability === 'High' ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.08)', border: `1px solid ${ai.hiringProbability === 'High' ? T.green : T.amber}30`, borderRadius: '12px', padding: '1rem 1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>Hiring Probability</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 900, color: ai.hiringProbability === 'High' ? T.green : T.amber }}>{ai.hiringProbability || 'Medium'}</div>
            </div>

            {/* Strengths & Weaknesses */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 800, color: T.green, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Strengths</div>
                {(ai.strengths || []).map((s, i) => (
                  <div key={i} style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.7)', padding: '0.25rem 0', display: 'flex', gap: '0.4rem' }}>
                    <CheckCircle2 size={13} color={T.green} style={{ flexShrink: 0, marginTop: '0.15rem' }} /> {s}
                  </div>
                ))}
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 800, color: T.amber, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Areas to Improve</div>
                {(ai.weaknesses || []).map((w, i) => (
                  <div key={i} style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.7)', padding: '0.25rem 0', display: 'flex', gap: '0.4rem' }}>
                    <AlertTriangle size={13} color={T.amber} style={{ flexShrink: 0, marginTop: '0.15rem' }} /> {w}
                  </div>
                ))}
              </div>
            </div>

            {/* Sara Suggestions */}
            {(ai.saraSuggestions || []).length > 0 && (
              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 800, color: T.purple, textTransform: 'uppercase', marginBottom: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Sparkles size={13} /> Sara Suggestions</div>
                {ai.saraSuggestions.map((s, i) => (
                  <div key={i} style={{ background: 'rgba(168,85,247,0.06)', border: `1px solid ${T.purple}20`, borderRadius: '12px', padding: '1rem', marginBottom: '0.65rem' }}>
                    <div style={{ fontSize: '0.88rem', color: '#fff', fontWeight: 600, marginBottom: '0.4rem' }}>{s.message}</div>
                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem' }}>
                      {s.impact && <span style={{ color: T.green }}>Impact: {s.impact}</span>}
                      {s.confidence && <span style={{ color: T.cyan }}>Confidence: {s.confidence}%</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(255,255,255,0.3)' }}>
            <Brain size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
            <div style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.3rem' }}>No Analysis Yet</div>
            <div style={{ fontSize: '0.85rem' }}>Click "Run Analysis" to generate your Career Health Dashboard</div>
          </div>
        )}
      </GlassCard>
    </div>
  );

  const renderActivity = () => (
    <GlassCard>
      <SectionHeader icon={Clock} title="Recent Activity" subtitle="Your career journey timeline" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        {(profile.activities || []).length > 0 ? profile.activities.slice(0, 20).map((act, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }} style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '0.85rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: T.purple, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.88rem', color: '#fff', fontWeight: 600 }}>{act.title || act.type}</div>
              <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)' }}>{act.type}</div>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)' }}>{timeSince(act.timestamp)}</div>
          </motion.div>
        )) : (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(255,255,255,0.3)' }}>
            <Clock size={36} style={{ marginBottom: '0.75rem', opacity: 0.3 }} />
            <div style={{ fontSize: '0.9rem' }}>No activity yet. Start building your profile!</div>
          </div>
        )}
      </div>
    </GlassCard>
  );

  const renderActiveSection = () => {
    switch (activeTab) {
      case 'personal': return renderPersonal();
      case 'education': return renderEducation();
      case 'skills': return renderSkills();
      case 'projects': return renderProjects();
      case 'experience': return renderExperience();
      case 'certifications': return renderCertifications();
      case 'achievements': return renderAchievements();
      case 'resume': return renderResume();
      case 'preferences': return renderPreferences();
      case 'analytics': return renderAnalytics();
      case 'activity': return renderActivity();
      default: return renderPersonal();
    }
  };

  /* ─── MAIN RENDER ─── */
  return (
    <div className="app-shell" style={{ background: '#0a0a1a', minHeight: '100vh', overflow: 'hidden' }}>
      <Sidebar />
      <main className="app-main" style={{ marginLeft: 'var(--sidebar-width)', padding: '1.5rem 2.5rem', height: '100vh', overflowY: 'auto' }}>

        {/* ── Top Bar: Title + Auto-Save Indicator ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#fff', margin: 0, background: T.gradPrimary, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Smart Profile</h1>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', margin: '0.2rem 0 0' }}>Your professional single source of truth</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <AnimatePresence mode="wait">
              {saveStatus === 'saving' && (
                <motion.div key="saving" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: T.amber, fontSize: '0.8rem', fontWeight: 600 }}>
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8 }}><RefreshCw size={14} /></motion.div> Saving...
                </motion.div>
              )}
              {saveStatus === 'saved' && (
                <motion.div key="saved" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: T.green, fontSize: '0.8rem', fontWeight: 600 }}>
                  <CheckCircle2 size={14} /> Saved
                </motion.div>
              )}
              {saveStatus === 'error' && (
                <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: T.red, fontSize: '0.8rem', fontWeight: 600 }}>
                  <AlertTriangle size={14} /> Save failed
                </motion.div>
              )}
              {saveStatus === 'idle' && lastSaved && (
                <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)' }}>
                  Last saved {timeSince(lastSaved)}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ── Dashboard Stats ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '0.85rem', marginBottom: '1.75rem' }}>
          <StatCard label="Profile" value={`${completion}%`} icon={User} color={T.purple} glow={T.purpleGlow} />
          <StatCard label="Job Ready" value={`${ai.jobReadinessScore || '—'}%`} icon={Target} color={T.cyan} glow={T.cyanGlow} />
          <StatCard label="ATS Score" value={`${ai.atsScore || '—'}%`} icon={Shield} color={T.green} glow="rgba(16,185,129,0.12)" />
          <StatCard label="Interview" value={`${ai.interviewReadiness || '—'}%`} icon={Zap} color={T.amber} glow={T.amberGlow} />
          <StatCard label={`Level ${user?.level || 1}`} value={`${(user?.xp || 0).toLocaleString()} XP`} icon={Star} color="#ec4899" glow="rgba(236,72,153,0.12)" />
          <StatCard label="Skills" value={profile.skills?.length || 0} icon={Code2} color="#3b82f6" glow="rgba(59,130,246,0.12)" />
        </div>

        {/* ── Completion Progress Bar ── */}
        <div style={{ marginBottom: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Profile Completion</span>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: T.purple }}>{completion}%</span>
          </div>
          <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '99px', overflow: 'hidden' }}>
            <motion.div initial={{ width: 0 }} animate={{ width: `${completion}%` }} transition={{ duration: 1, ease: 'easeOut' }} style={{ height: '100%', background: T.gradPrimary, borderRadius: '99px' }} />
          </div>
          {(profile.profileCompletion?.missingSections || []).length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.65rem' }}>
              {profile.profileCompletion.missingSections.slice(0, 4).map((s, i) => (
                <span key={i} style={{ background: T.amberGlow, border: `1px solid ${T.amber}25`, color: T.amber, padding: '0.25rem 0.6rem', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 600 }}>
                  + Add {s}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* ── Tab Navigation ── */}
        <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.75rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <motion.button key={tab.id} whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }} onClick={() => setActiveTab(tab.id)} style={{ background: isActive ? T.purpleGlow : 'transparent', border: `1px solid ${isActive ? T.purple + '40' : 'transparent'}`, color: isActive ? T.purple : 'rgba(255,255,255,0.4)', padding: '0.55rem 1rem', borderRadius: '10px', fontSize: '0.78rem', fontWeight: isActive ? 700 : 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', whiteSpace: 'nowrap', transition: 'all 0.2s' }}>
                <Icon size={14} /> {tab.label}
              </motion.button>
            );
          })}
        </div>

        {/* ── Active Section Content ── */}
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
            {renderActiveSection()}
          </motion.div>
        </AnimatePresence>

        {/* Bottom spacer */}
        <div style={{ height: '3rem' }} />
      </main>

      {/* ── Resume Merge Modal ── */}
      <AnimatePresence>
        {mergeModalOpen && parsedResume && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} style={{ background: '#12121f', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '2rem', maxWidth: 520, width: '90%', maxHeight: '80vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#fff' }}>Resume Parsed Successfully</h3>
                <button onClick={() => setMergeModalOpen(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}><X size={20} /></button>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.88rem', lineHeight: 1.5 }}>
                  We extracted <strong style={{ color: T.cyan }}>{parsedResume.skills?.length || 0} skills</strong>,{' '}
                  <strong style={{ color: T.cyan }}>{parsedResume.education?.length || 0} education entries</strong>,{' '}
                  <strong style={{ color: T.cyan }}>{parsedResume.experience?.length || 0} experiences</strong>, and{' '}
                  <strong style={{ color: T.cyan }}>{parsedResume.projects?.length || 0} projects</strong> from your resume.
                </p>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.82rem' }}>How would you like to update your profile?</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <button onClick={() => handleMergeAction('merge')} style={{ background: T.purpleGlow, border: `1px solid ${T.purple}40`, color: '#fff', padding: '1rem', borderRadius: '12px', fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer', textAlign: 'left' }}>
                  <div style={{ color: T.purple, fontSize: '0.9rem', fontWeight: 800 }}>🔀 Merge</div>
                  <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.2rem' }}>Add extracted data alongside existing profile data</div>
                </button>
                <button onClick={() => handleMergeAction('replace')} style={{ background: T.amberGlow, border: `1px solid ${T.amber}40`, color: '#fff', padding: '1rem', borderRadius: '12px', fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer', textAlign: 'left' }}>
                  <div style={{ color: T.amber, fontSize: '0.9rem', fontWeight: 800 }}>🔄 Replace</div>
                  <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.2rem' }}>Replace existing data with extracted data</div>
                </button>
                <button onClick={() => handleMergeAction('ignore')} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', padding: '1rem', borderRadius: '12px', fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer', textAlign: 'left' }}>
                  <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', fontWeight: 800 }}>❌ Ignore</div>
                  <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.2rem' }}>Keep resume file but don't update profile data</div>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        input:focus, textarea:focus, select:focus { border-color: ${T.purple}60 !important; box-shadow: 0 0 0 3px ${T.purple}15 !important; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 99px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.15); }
        @media (max-width: 1200px) {
          .app-main { padding: 1rem 1.25rem !important; }
        }
        @media (max-width: 768px) {
          .app-main { margin-left: 0 !important; padding: 1rem !important; padding-bottom: 5rem !important; }
        }
      `}</style>
    </div>
  );
}
