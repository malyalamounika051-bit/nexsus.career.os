import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { resumeService } from '../services/resumeService';
import Sidebar from '../components/Sidebar';
import ResumeDashboard from '../components/resume/ResumeDashboard';
import ResumeATSReport from '../components/resume/ResumeATSReport';
import ResumeJobMatch from '../components/resume/ResumeJobMatch';
import ResumeTemplateGallery from '../components/resume/ResumeTemplateGallery';
import ResumeProfileMatch from '../components/resume/ResumeProfileMatch';
import {
  ModernTemplate,
  ProfessionalTemplate,
  CreativeTemplate,
  MinimalistTemplate,
  GreyLiningTemplate,
  SaharaContrastTemplate,
  GlacierChillTemplate,
  IvoryPrestigeTemplate,
  RoyalEssenceTemplate,
  ExecutiveEdgeTemplate
} from '../components/ResumeTemplates';
import {
  FileText, Download, Plus, Minus, Trash2, Zap, User, Mail, Phone,
  MapPin, Link, Globe, Briefcase, GraduationCap, Code2,
  ChevronDown, ChevronUp, Eye, Edit3, Sparkles, Save,
  Layers, Palette, Type, Layout, History, Share2, 
  ExternalLink, ChevronRight, MoreHorizontal, Settings, Moon, Sun, Monitor,
  TrendingUp, CheckCircle2, Copy, RefreshCw, Target, BarChart3, Wand2,
  AlertCircle, Check, Search, BookOpen, Presentation, Heart, Quote, 
  Award, ArrowLeft, Calendar, FileJson
} from 'lucide-react';
import html2pdf from 'html2pdf.js';
import { exportToDocx } from '../utils/resumeExportUtils';

// ─── Constants ───────────────────────────────────────────────────────────────
const TEMPLATES = [
  { id: 'modern', name: 'Modern ATS', component: ModernTemplate, color: '#3b82f6', desc: 'Clean, professional, and optimized for ATS systems.' },
  { id: 'grey_lining', name: 'Grey Lining', component: GreyLiningTemplate, color: '#475569', desc: 'Clean ATS-friendly template with slate lining separators.' },
  { id: 'sahara_contrast', name: 'Sahara Contrast', component: SaharaContrastTemplate, color: '#b45309', desc: 'Top ATS template featuring sand/amber accents.' },
  { id: 'glacier_chill', name: 'Glacier Chill', component: GlacierChillTemplate, color: '#0f172a', desc: 'Premium modern layout with a bold top banner.' },
  { id: 'ivory_prestige', name: 'Ivory Prestige', component: IvoryPrestigeTemplate, color: '#a27b5c', desc: 'Serif template with ivory background and gold accents.' },
  { id: 'royal_essence', name: 'Royal Essence', component: RoyalEssenceTemplate, color: '#0f2963', desc: 'Bold design with deep royal banners and structured grids.' },
  { id: 'executive_edge', name: 'Executive Edge', component: ExecutiveEdgeTemplate, color: '#0f766e', desc: 'Teal highlights with left timeline accents.' },
  { id: 'professional', name: 'Executive', component: ProfessionalTemplate, color: '#111827', desc: 'Traditional serif design for corporate roles.' },
  { id: 'creative', name: 'Creative', component: CreativeTemplate, color: '#ec4899', desc: 'Modern two-column layout for designers.' },
  { id: 'minimalist', name: 'Minimalist', component: MinimalistTemplate, color: '#111111', desc: 'Ultra-clean design focused on high-end typography.' },
];

const EMPTY_EXP = () => ({ id: Date.now() + Math.random(), title: '', company: '', period: '', desc: '' });
const EMPTY_EDU = () => ({ id: Date.now() + Math.random(), degree: '', institution: '', year: '' });
const EMPTY_RESEARCH = () => ({ id: Date.now() + Math.random(), title: '', publisher: '', year: '', desc: '', link: '' });
const EMPTY_WORKSHOP = () => ({ id: Date.now() + Math.random(), name: '', organizer: '', year: '', desc: '' });
const EMPTY_VOLUNTEER = () => ({ id: Date.now() + Math.random(), organization: '', role: '', period: '', desc: '' });
const EMPTY_REFERENCE = () => ({ id: Date.now() + Math.random(), name: '', company: '', contact: '', relation: '' });

const labelStyle = {
  fontSize: '0.95rem', fontWeight: 900, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', display: 'block'
};

const Input = ({ label, icon: Icon, ...props }) => (
  <div style={{ width: '100%' }}>
    {label && <label style={labelStyle}>{label}</label>}
    <div style={{ position: 'relative' }}>
      {Icon && <Icon size={14} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />}
      <input 
        {...props}
        style={{
          width: '100%', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', 
          color: 'var(--color-text)', padding: `0.85rem ${Icon ? '2.75rem' : '1.15rem'}`, borderRadius: '12px',
          fontSize: '1.15rem', outline: 'none', transition: 'all 0.2s'
        }}
        onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
        onBlur={(e) => e.target.style.borderColor = 'var(--color-border)'}
      />
    </div>
  </div>
);

const TextArea = ({ label, ...props }) => (
  <div style={{ width: '100%' }}>
    {label && <label style={labelStyle}>{label}</label>}
    <textarea 
      {...props}
      rows={4}
      style={{
        width: '100%', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', 
        color: 'var(--color-text)', padding: '1.15rem', borderRadius: '12px',
        fontSize: '1.15rem', outline: 'none', transition: 'all 0.2s', resize: 'vertical',
        fontFamily: 'inherit'
      }}
      onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
      onBlur={(e) => e.target.style.borderColor = 'var(--color-border)'}
    />
  </div>
);

const Accordion = ({ title, icon: Icon, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="glass-card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--color-border)' }}>
      <button 
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{ 
          width: '100%', padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'none', border: 'none', color: 'var(--color-text)', cursor: 'pointer'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '32px', height: '32px', background: 'var(--color-primary-glow)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>
            <Icon size={18} />
          </div>
          <span style={{ fontWeight: 800, fontSize: '1.2rem' }}>{title}</span>
        </div>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }}><ChevronDown size={18} color="var(--color-text-muted)" /></motion.div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} style={{ overflow: 'hidden' }}>
            <div style={{ padding: '0 1.5rem 1.5rem', borderTop: '1px solid var(--color-border-subtle)' }}>
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const AIWriteBar = ({ text, onResult, context, aiLoadingField, currentField, setAiLoadingField }) => {
  const handleAction = async (actionId) => {
    if (!text || !text.trim()) return;
    setAiLoadingField(`${currentField}:${actionId}`);
    try {
      const { data } = await resumeService.rewriteContent({ text, action: actionId, context });
      if (data.data) onResult(data.data);
    } catch (e) {
      console.error('AI rewrite error:', e);
    } finally {
      setAiLoadingField('');
    }
  };

  const AI_ACTIONS = [
    { id: 'improve', label: 'Improve', icon: '✨', color: '#8b5cf6' },
    { id: 'shorten', label: 'Shorten', icon: '✂️', color: '#f59e0b' },
    { id: 'expand', label: 'Expand', icon: '📐', color: '#3b82f6' },
    { id: 'professional', label: 'Professional', icon: '👔', color: '#0f766e' },
    { id: 'ats-optimize', label: 'ATS Optimize', icon: '🎯', color: '#ef4444' },
    { id: 'star-method', label: 'STAR', icon: '⭐', color: '#f59e0b' },
  ];

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.6rem', padding: '0.5rem 0.6rem', background: 'var(--color-surface-glass-2)', borderRadius: '10px', border: '1px solid var(--color-border-subtle)' }}>
      {AI_ACTIONS.map(a => {
        const isLoading = aiLoadingField === `${currentField}:${a.id}`;
        return (
          <button 
            key={a.id} 
            type="button"
            onClick={() => handleAction(a.id)}
            disabled={!!aiLoadingField}
            style={{
              background: 'transparent',
              border: `1px solid var(--color-border)`,
              color: 'var(--color-text-muted)',
              padding: '0.3rem 0.6rem', borderRadius: '6px', fontSize: '0.68rem', cursor: aiLoadingField ? 'wait' : 'pointer',
              display: 'flex', alignItems: 'center', gap: '0.25rem', transition: 'all 0.2s', fontWeight: 600,
            }}
          >
            {isLoading ? <RefreshCw size={10} style={{ animation: 'spin 1s linear infinite' }} /> : <span>{a.icon}</span>} {a.label}
          </button>
        );
      })}
    </div>
  );
};

export default function ResumeBuilder() {
  const { user } = useAuth();
  const printRef = useRef();
  
  // Tab control: 'dashboard', 'edit', 'templates', 'ats', 'job-match', 'profile-match'
  const [activeTab, setActiveTab] = useState('dashboard');
  const [savedResumes, setSavedResumes] = useState([]);
  const [currentResumeId, setCurrentResumeId] = useState(null);
  const [zoom, setZoom] = useState(0.7);

  // Wizard Onboarding Step
  const [editorStep, setEditorStep] = useState(0);

  // Resume Document States
  const [resumeTitle, setResumeTitle] = useState('Untitled Resume');
  const [templateId, setTemplateId] = useState('modern');
  const [isPublic, setIsPublic] = useState(false);
  const [shareableToken, setShareableToken] = useState('');
  
  const [info, setInfo] = useState({ name: user?.name || '', title: '', email: user?.email || '', phone: '', location: '', linkedin: '', github: '', portfolio: '', summary: '', objective: '', dateOfBirth: '', city: '', country: '', currentRole: '', targetRole: '', yearsOfExperience: '', preferredIndustry: '', college: '', degree: '', branch: '', cgpa: '', graduationYear: '', stackOverflow: '', behance: '', dribbble: '', leetcode: '', codeforces: '' });
  const [skills, setSkills] = useState([]);
  const [technicalSkills, setTechnicalSkills] = useState([]);
  const [softSkills, setSoftSkills] = useState([]);
  
  const [skillInput, setSkillInput] = useState('');
  const [techSkillInput, setTechSkillInput] = useState('');
  const [softSkillInput, setSoftSkillInput] = useState('');
  
  const [experiences, setExperiences] = useState([EMPTY_EXP()]);
  const [internships, setInternships] = useState([]);
  const [education, setEducation] = useState([EMPTY_EDU()]);
  const [projects, setProjects] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [certifications, setCertifications] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [socialLinks, setSocialLinks] = useState([]);
  const [customSections, setCustomSections] = useState([]);
  
  const [researchPapers, setResearchPapers] = useState([]);
  const [workshops, setWorkshops] = useState([]);
  const [volunteering, setVolunteering] = useState([]);
  const [interests, setInterests] = useState([]);
  const [interestInput, setInterestInput] = useState('');
  const [references, setReferences] = useState([]);
  
  const [sectionOrder, setSectionOrder] = useState([
    'personalInfo', 'experience', 'education', 'skills', 'technicalSkills', 'softSkills', 
    'projects', 'internships', 'certifications', 'languages', 'researchPapers', 'workshops', 
    'volunteering', 'interests', 'references', 'achievements', 'socialLinks', 'customSections'
  ]);

  const [accentColor, setAccentColor] = useState('');
  const [selectedFont, setSelectedFont] = useState('');
  const [saveStatus, setSaveStatus] = useState('idle');
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [aiLoadingField, setAiLoadingField] = useState('');
  const [syncStatus, setSyncStatus] = useState('idle');

  // ATS & JD Matching States
  const [atsAnalysis, setAtsAnalysis] = useState(null);
  const [atsLoading, setAtsLoading] = useState(false);
  const [jobDescription, setJobDescription] = useState('');
  const [jobAnalysis, setJobAnalysis] = useState(null);
  const [jobLoading, setJobLoading] = useState(false);
  const [tailorLoading, setTailorLoading] = useState(false);

  const isInitialMount = useRef(true);
  const autoSaveTimer = useRef(null);

  useEffect(() => {
    fetchSavedResumes();
  }, []);

  const fetchSavedResumes = async () => {
    try {
      const { data } = await resumeService.getAll();
      setSavedResumes(data.data || []);
    } catch (e) { console.error(e); }
  };

  const getResumeData = useCallback(() => ({
    resumeTitle, templateId, isPublic,
    personalInfo: info, skills, technicalSkills, softSkills, experiences, internships,
    education, projects, achievements, certifications,
    languages, socialLinks, customSections, researchPapers, workshops, volunteering, interests, references,
    sectionOrder,
    customStyles: {
      primaryColor: accentColor || TEMPLATES.find(t => t.id === templateId)?.color || '#3b82f6',
      fontFamily: selectedFont || "'Inter', sans-serif"
    }
  }), [resumeTitle, templateId, isPublic, info, skills, technicalSkills, softSkills, experiences, internships,
    education, projects, achievements, certifications, languages, socialLinks,
    customSections, researchPapers, workshops, volunteering, interests, references,
    sectionOrder, accentColor, selectedFont]);

  // Debounced Autosave (3s)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (!currentResumeId) return;

    setSaveStatus('saving');
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(async () => {
      try {
        await resumeService.update(currentResumeId, getResumeData());
        setSaveStatus('saved');
        setLastSavedAt(new Date());
      } catch (e) {
        setSaveStatus('error');
        console.error('Auto-save failed:', e);
      }
    }, 3000);

    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); };
  }, [info, skills, technicalSkills, softSkills, experiences, internships, education, projects, achievements,
    certifications, languages, socialLinks, customSections, researchPapers, workshops, volunteering, interests, references,
    sectionOrder, templateId, resumeTitle, accentColor, selectedFont, currentResumeId, getResumeData]);

  // Manual save
  const handleSave = async () => {
    setSaveStatus('saving');
    try {
      if (currentResumeId) {
        await resumeService.update(currentResumeId, getResumeData());
      } else {
        const { data } = await resumeService.create(getResumeData());
        setCurrentResumeId(data.data._id);
        setShareableToken(data.data.shareableToken);
      }
      setSaveStatus('saved');
      setLastSavedAt(new Date());
      fetchSavedResumes();
    } catch (e) {
      setSaveStatus('error');
      console.error('Save failed:', e);
    }
  };

  const handleDuplicate = async (id) => {
    try {
      await resumeService.duplicate(id);
      fetchSavedResumes();
    } catch (e) { console.error('Duplicate failed:', e); }
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this resume?')) {
      try {
        await resumeService.delete(id);
        if (currentResumeId === id) {
          setCurrentResumeId(null);
        }
        fetchSavedResumes();
      } catch (e) { console.error('Delete failed:', e); }
    }
  };

  const loadResume = (res) => {
    isInitialMount.current = true;
    setCurrentResumeId(res._id);
    setResumeTitle(res.resumeTitle);
    setTemplateId(res.templateId);
    setIsPublic(res.isPublic);
    setShareableToken(res.shareableToken);
    setInfo(res.personalInfo || {});
    setSkills(res.skills || []);
    setTechnicalSkills(res.technicalSkills || []);
    setSoftSkills(res.softSkills || []);
    setExperiences(res.experiences || []);
    setInternships(res.internships || []);
    setEducation(res.education || []);
    setProjects(res.projects || []);
    setAchievements(res.achievements || []);
    setCertifications(res.certifications || []);
    setLanguages(res.languages || []);
    setSocialLinks(res.socialLinks || []);
    setCustomSections(res.customSections || []);
    setResearchPapers(res.researchPapers || []);
    setWorkshops(res.workshops || []);
    setVolunteering(res.volunteering || []);
    setInterests(res.interests || []);
    setReferences(res.references || []);
    if (res.sectionOrder?.length) setSectionOrder(res.sectionOrder);
    if (res.customStyles?.primaryColor) setAccentColor(res.customStyles.primaryColor);
    if (res.customStyles?.fontFamily) setSelectedFont(res.customStyles.fontFamily);
    if (res.analysis) setAtsAnalysis(res.analysis);
    setActiveTab('edit');
    setSaveStatus('saved');
    setLastSavedAt(new Date(res.updatedAt));
  };

  const handleCreateNew = () => {
    isInitialMount.current = true;
    setCurrentResumeId(null);
    setResumeTitle('Untitled Resume');
    setTemplateId('modern');
    setInfo({ name: user?.name || '', title: '', email: user?.email || '', phone: '', location: '', linkedin: '', github: '', portfolio: '', summary: '', objective: '', dateOfBirth: '', city: '', country: '', currentRole: '', targetRole: '', yearsOfExperience: '', preferredIndustry: '', college: '', degree: '', branch: '', cgpa: '', graduationYear: '', stackOverflow: '', behance: '', dribbble: '', leetcode: '', codeforces: '' });
    setSkills([]);
    setTechnicalSkills([]);
    setSoftSkills([]);
    setExperiences([EMPTY_EXP()]);
    setInternships([]);
    setEducation([EMPTY_EDU()]);
    setProjects([]);
    setAchievements([]);
    setCertifications([]);
    setLanguages([]);
    setSocialLinks([]);
    setCustomSections([]);
    setResearchPapers([]);
    setWorkshops([]);
    setVolunteering([]);
    setInterests([]);
    setReferences([]);
    setAccentColor('');
    setSelectedFont('');
    setSaveStatus('idle');
    setAtsAnalysis(null);
    setJobAnalysis(null);
    setJobDescription('');
    setActiveTab('edit');
  };

  const handleATSAnalyze = async () => {
    if (!currentResumeId) {
      await handleSave();
    }
    if (!currentResumeId) return;
    setAtsLoading(true);
    try {
      const { data } = await resumeService.atsAnalyze(currentResumeId);
      setAtsAnalysis(data.data);
    } catch (e) { console.error('ATS analyze error:', e); }
    finally { setAtsLoading(false); }
  };

  const handleJobAnalyze = async () => {
    if (!jobDescription.trim()) return;
    setJobLoading(true);
    try {
      const { data } = await resumeService.analyzeJob({
        jobDescription,
        resumeSkills: [...skills, ...technicalSkills, ...softSkills],
        resumeExperiences: experiences,
        resumeTitle: info.title
      });
      setJobAnalysis(data.data);
    } catch (e) { console.error('Job analyze error:', e); }
    finally { setJobLoading(false); }
  };

  const handleTailorResume = async () => {
    if (!jobDescription.trim()) return;
    setTailorLoading(true);
    try {
      const { data } = await resumeService.tailorResume({
        jobDescription,
        personalInfo: info,
        experiences,
        skills: [...skills, ...technicalSkills, ...softSkills],
        summary: info.summary
      });
      const result = data.data;
      if (result.tailoredSummary) setInfo(prev => ({ ...prev, summary: result.tailoredSummary }));
      if (result.tailoredExperiences?.length) {
        setExperiences(prev => prev.map((exp, i) => {
          const tailored = result.tailoredExperiences[i];
          return tailored ? { ...exp, desc: tailored.desc || exp.desc } : exp;
        }));
      }
    } catch (e) { console.error('Tailor error:', e); }
    finally { setTailorLoading(false); }
  };

  const exportToTxt = () => {
    let text = `${info.name || ''}\n${info.title || ''}\n`;
    if (info.email || info.phone || info.location) {
      text += [info.email, info.phone, info.location].filter(Boolean).join(' | ') + '\n';
    }
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `${resumeTitle}.txt`; a.click();
  };

  const exportToJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(getResumeData(), null, 2));
    const a = document.createElement('a');
    a.setAttribute("href", dataStr);
    a.setAttribute("download", `${resumeTitle}.json`);
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  // Render wizard sections based on current wizard step
  const renderWizardStep = () => {
    switch (editorStep) {
      case 0:
        return (
          <Accordion title="1. Personal Information & Socials" icon={User} defaultOpen>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
              <Input label="Full Name" value={info.name} onChange={e => setInfo({...info, name: e.target.value})} placeholder="Jane Doe" />
              <Input label="Job Title" value={info.title} onChange={e => setInfo({...info, title: e.target.value})} placeholder="Full Stack Developer" />
              <Input label="Email" icon={Mail} value={info.email} onChange={e => setInfo({...info, email: e.target.value})} placeholder="jane@example.com" />
              <Input label="Phone" icon={Phone} value={info.phone} onChange={e => setInfo({...info, phone: e.target.value})} placeholder="+1 234 567 890" />
              <Input label="Date of Birth" icon={Calendar} value={info.dateOfBirth} onChange={e => setInfo({...info, dateOfBirth: e.target.value})} placeholder="DD/MM/YYYY" />
              <Input label="City" icon={MapPin} value={info.city} onChange={e => setInfo({...info, city: e.target.value})} placeholder="New York" />
              <Input label="Country" icon={MapPin} value={info.country} onChange={e => setInfo({...info, country: e.target.value})} placeholder="United States" />
              
              <div style={{ gridColumn: 'span 2', borderBottom: '1px solid var(--color-border-subtle)', margin: '1rem 0 0.5rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-primary)' }}>Social & Coding Portfolios</span>
              </div>
              <Input label="LinkedIn Link" icon={Link} value={info.linkedin} onChange={e => setInfo({...info, linkedin: e.target.value})} placeholder="linkedin.com/in/jane" />
              <Input label="GitHub Link" icon={Globe} value={info.github} onChange={e => setInfo({...info, github: e.target.value})} placeholder="github.com/jane" />
              <Input label="Portfolio Website" icon={Globe} value={info.portfolio} onChange={e => setInfo({...info, portfolio: e.target.value})} placeholder="janedoe.dev" />
              <Input label="LeetCode" icon={Link} value={info.leetcode} onChange={e => setInfo({...info, leetcode: e.target.value})} placeholder="leetcode.com/jane" />
              <Input label="Codeforces" icon={Link} value={info.codeforces} onChange={e => setInfo({...info, codeforces: e.target.value})} placeholder="codeforces.com/profile/jane" />
              <Input label="Stack Overflow" icon={Link} value={info.stackOverflow} onChange={e => setInfo({...info, stackOverflow: e.target.value})} placeholder="stackoverflow.com/users/jane" />
              <Input label="Behance" icon={Link} value={info.behance} onChange={e => setInfo({...info, behance: e.target.value})} placeholder="behance.net/jane" />
            </div>
          </Accordion>
        );
      case 1:
        return (
          <Accordion title="2. Professional Target & Skills" icon={Code2} defaultOpen>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
              <Input label="Current Role" value={info.currentRole} onChange={e => setInfo({...info, currentRole: e.target.value})} placeholder="Software Developer" />
              <Input label="Target Role" value={info.targetRole} onChange={e => setInfo({...info, targetRole: e.target.value})} placeholder="Senior Architect" />
              <Input label="Years of Experience" value={info.yearsOfExperience} onChange={e => setInfo({...info, yearsOfExperience: e.target.value})} placeholder="5" />
              <Input label="Preferred Industry" value={info.preferredIndustry} onChange={e => setInfo({...info, preferredIndustry: e.target.value})} placeholder="Financial Technology" />
              
              <div style={{ gridColumn: 'span 2', marginTop: '1rem' }}>
                <TextArea label="Career Objective" value={info.objective} onChange={e => setInfo({...info, objective: e.target.value})} placeholder="State your immediate career objective..." />
                <AIWriteBar text={info.objective} context="Objective" currentField="objective" onResult={(text) => setInfo({...info, objective: text})} aiLoadingField={aiLoadingField} setAiLoadingField={setAiLoadingField} />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <TextArea label="Professional Summary" value={info.summary} onChange={e => setInfo({...info, summary: e.target.value})} placeholder="Describe your career highlights..." />
                <AIWriteBar text={info.summary} context="Summary" onResult={(text) => setInfo({...info, summary: text})} aiLoadingField={aiLoadingField} setAiLoadingField={setAiLoadingField} />
              </div>

              {/* Technical skills list */}
              <div style={{ gridColumn: 'span 2', marginTop: '1rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 900, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'block' }}>Technical Skills</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                  {technicalSkills.map(s => (
                    <span key={s} className="tag" style={{ background: 'var(--color-surface-glass-2)', padding: '0.6rem 1rem', fontSize: '0.8rem', color: 'var(--color-primary)' }}>
                      {s} <button type="button" onClick={() => setTechnicalSkills(technicalSkills.filter(x => x !== s))} style={{ border: 'none', background: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', paddingLeft: '0.5rem' }}>×</button>
                    </span>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <input 
                    value={techSkillInput} onChange={e => setTechSkillInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && techSkillInput) { setTechnicalSkills([...technicalSkills, techSkillInput]); setTechSkillInput(''); } }}
                    placeholder="React, C++, Python..."
                    style={{ flex: 1, background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)', padding: '0.75rem 1rem', borderRadius: '12px', outline: 'none' }}
                  />
                  <button type="button" onClick={() => techSkillInput && (setTechnicalSkills([...technicalSkills, techSkillInput]), setTechSkillInput(''))} className="btn-primary" style={{ padding: '0 1.25rem' }}><Plus size={20} /></button>
                </div>
              </div>
            </div>
          </Accordion>
        );
      case 2:
        return (
          <Accordion title="3. Education History" icon={GraduationCap} defaultOpen>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
              <Input label="College / University" value={info.college} onChange={e => setInfo({...info, college: e.target.value})} placeholder="Stanford" />
              <Input label="Degree" value={info.degree} onChange={e => setInfo({...info, degree: e.target.value})} placeholder="B.S. Computer Science" />
              <Input label="Branch" value={info.branch} onChange={e => setInfo({...info, branch: e.target.value})} placeholder="Information Technology" />
              <Input label="CGPA / Percentage" value={info.cgpa} onChange={e => setInfo({...info, cgpa: e.target.value})} placeholder="3.8" />
              <Input label="Graduation Year" value={info.graduationYear} onChange={e => setInfo({...info, graduationYear: e.target.value})} placeholder="2024" />
              
              <div style={{ gridColumn: 'span 2', marginTop: '1rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-text-muted)' }}>Additional Degrees</span>
              </div>
              <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {education.map((edu, i) => (
                  <div key={edu.id || i} style={{ padding: '1.25rem', background: 'var(--color-surface-3)', borderRadius: '16px', position: 'relative', border: '1px solid var(--color-border)' }}>
                    <button type="button" onClick={() => setEducation(education.filter((_, idx) => idx !== i))} style={{ position: 'absolute', top: '1rem', right: '1rem', color: 'var(--color-danger)', border: 'none', background: 'none', cursor: 'pointer' }}><Trash2 size={14} /></button>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div style={{ gridColumn: 'span 2' }}><Input label="Degree / Major" value={edu.degree} onChange={e => { const n = [...education]; n[i].degree = e.target.value; setEducation(n); }} placeholder="B.S. Computer Science" /></div>
                      <Input label="Institution" value={edu.institution} onChange={e => { const n = [...education]; n[i].institution = e.target.value; setEducation(n); }} placeholder="Stanford University" />
                      <Input label="Year" value={edu.year} onChange={e => { const n = [...education]; n[i].year = e.target.value; setEducation(n); }} placeholder="2020 - 2024" />
                    </div>
                  </div>
                ))}
                <button type="button" onClick={() => setEducation([...education, EMPTY_EDU()])} className="btn-ghost" style={{ width: '100%', padding: '1rem', borderStyle: 'dashed', background: 'transparent' }}><Plus size={16} /> Add Additional Education</button>
              </div>
            </div>
          </Accordion>
        );
      case 3:
        return (
          <Accordion title="4. Experience & Projects" icon={Briefcase} defaultOpen>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1rem' }}>
              
              <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--color-primary)', textTransform: 'uppercase' }}>Work Experience & Internships</span>
              {experiences.map((exp, i) => (
                <div key={exp.id || i} style={{ padding: '1.25rem', background: 'var(--color-surface-3)', borderRadius: '16px', position: 'relative', border: '1px solid var(--color-border)' }}>
                  <button type="button" onClick={() => setExperiences(experiences.filter((_, idx) => idx !== i))} style={{ position: 'absolute', top: '1rem', right: '1rem', color: 'var(--color-danger)', border: 'none', background: 'none', cursor: 'pointer' }}><Trash2 size={14} /></button>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div style={{ gridColumn: 'span 2' }}><Input label="Job Title / Role" value={exp.title} onChange={e => { const n = [...experiences]; n[i].title = e.target.value; setExperiences(n); }} placeholder="Senior Developer" /></div>
                    <Input label="Company" value={exp.company} onChange={e => { const n = [...experiences]; n[i].company = e.target.value; setExperiences(n); }} placeholder="Google" />
                    <Input label="Period" value={exp.period} onChange={e => { const n = [...experiences]; n[i].period = e.target.value; setExperiences(n); }} placeholder="Jan 2022 - Present" />
                    <div style={{ gridColumn: 'span 2' }}>
                      <TextArea label="Description" value={exp.desc} onChange={e => { const n = [...experiences]; n[i].desc = e.target.value; setExperiences(n); }} placeholder="What did you achieve? Include measurable metrics." />
                      <AIWriteBar text={exp.desc} context={`Experience description for ${exp.title}`} currentField={`exp-${i}`} onResult={(text) => { const n = [...experiences]; n[i].desc = text; setExperiences(n); }} aiLoadingField={aiLoadingField} setAiLoadingField={setAiLoadingField} />
                    </div>
                  </div>
                </div>
              ))}
              <button type="button" onClick={() => setExperiences([...experiences, EMPTY_EXP()])} className="btn-ghost" style={{ width: '100%', padding: '1rem', borderStyle: 'dashed', background: 'transparent' }}><Plus size={16} /> Add Experience</button>

              <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--color-primary)', textTransform: 'uppercase', marginTop: '1.5rem' }}>Projects & Hackathons</span>
              {projects.map((proj, i) => (
                <div key={proj.id || i} style={{ padding: '1.25rem', background: 'var(--color-surface-3)', borderRadius: '16px', position: 'relative', border: '1px solid var(--color-border)' }}>
                  <button type="button" onClick={() => setProjects(projects.filter((_, idx) => idx !== i))} style={{ position: 'absolute', top: '1rem', right: '1rem', color: 'var(--color-danger)', border: 'none', background: 'none', cursor: 'pointer' }}><Trash2 size={14} /></button>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <Input label="Project Name" value={proj.name} onChange={e => { const n = [...projects]; n[i].name = e.target.value; setProjects(n); }} placeholder="E-commerce Platform" />
                    <Input label="Technologies" value={proj.tech} onChange={e => { const n = [...projects]; n[i].tech = e.target.value; setProjects(n); }} placeholder="React, Node.js" />
                    <Input label="Live Demo URL" value={proj.link} onChange={e => { const n = [...projects]; n[i].link = e.target.value; setProjects(n); }} placeholder="https://live.dev" />
                    <Input label="GitHub Link" value={proj.github} onChange={e => { const n = [...projects]; n[i].github = e.target.value; setProjects(n); }} placeholder="https://github.com/..." />
                    <div style={{ gridColumn: 'span 2' }}>
                      <TextArea label="Description" value={proj.desc} onChange={e => { const n = [...projects]; n[i].desc = e.target.value; setProjects(n); }} placeholder="Describe the project impact..." />
                      <AIWriteBar text={proj.desc} context={`Project ${proj.name}`} currentField={`proj-${i}`} onResult={(text) => { const n = [...projects]; n[i].desc = text; setProjects(n); }} aiLoadingField={aiLoadingField} setAiLoadingField={setAiLoadingField} />
                    </div>
                  </div>
                </div>
              ))}
              <button type="button" onClick={() => setProjects([...projects, { id: Date.now() + Math.random(), name: '', tech: '', desc: '', link: '', github: '' }])} className="btn-ghost" style={{ width: '100%', padding: '1rem', borderStyle: 'dashed', background: 'transparent' }}><Plus size={16} /> Add Project / Hackathon</button>

            </div>
          </Accordion>
        );
      case 4:
        return (
          <Accordion title="5. Certifications & Extra-Curriculars" icon={Award} defaultOpen>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1rem' }}>
              
              <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--color-primary)', textTransform: 'uppercase' }}>Certifications</span>
              {certifications.map((cert, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input 
                    value={cert} onChange={e => { const n = [...certifications]; n[i] = e.target.value; setCertifications(n); }}
                    placeholder="AWS Certified Cloud Practitioner..."
                    style={{ flex: 1, background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)', padding: '0.75rem 1rem', borderRadius: '12px', outline: 'none' }}
                  />
                  <button type="button" onClick={() => setCertifications(certifications.filter((_, idx) => idx !== i))} style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer' }}><Trash2 size={16} /></button>
                </div>
              ))}
              <button type="button" onClick={() => setCertifications([...certifications, ''])} className="btn-ghost" style={{ width: '100%', padding: '0.8rem', borderStyle: 'dashed', background: 'transparent' }}><Plus size={14} /> Add Certification</button>

              <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--color-primary)', textTransform: 'uppercase', marginTop: '1.5rem' }}>Research Papers & Publications</span>
              {researchPapers.map((paper, i) => (
                <div key={paper.id || i} style={{ padding: '1.25rem', background: 'var(--color-surface-3)', borderRadius: '16px', position: 'relative', border: '1px solid var(--color-border)' }}>
                  <button type="button" onClick={() => setResearchPapers(researchPapers.filter((_, idx) => idx !== i))} style={{ position: 'absolute', top: '1rem', right: '1rem', color: 'var(--color-danger)', border: 'none', background: 'none', cursor: 'pointer' }}><Trash2 size={14} /></button>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div style={{ gridColumn: 'span 2' }}><Input label="Paper Title" value={paper.title} onChange={e => { const n = [...researchPapers]; n[i].title = e.target.value; setResearchPapers(n); }} placeholder="Paper title" /></div>
                    <Input label="Publisher" value={paper.publisher} onChange={e => { const n = [...researchPapers]; n[i].publisher = e.target.value; setResearchPapers(n); }} placeholder="IEEE Journal" />
                    <Input label="Year" value={paper.year} onChange={e => { const n = [...researchPapers]; n[i].year = e.target.value; setResearchPapers(n); }} placeholder="2024" />
                  </div>
                </div>
              ))}
              <button type="button" onClick={() => setResearchPapers([...researchPapers, EMPTY_RESEARCH()])} className="btn-ghost" style={{ width: '100%', padding: '1rem', borderStyle: 'dashed', background: 'transparent' }}><Plus size={16} /> Add Publication</button>

            </div>
          </Accordion>
        );
      default: return null;
    }
  };

  const CurrentTemplate = TEMPLATES.find(t => t.id === templateId)?.component || ModernTemplate;
  const effectiveAccent = accentColor || TEMPLATES.find(t => t.id === templateId)?.color || '#3b82f6';

  return (
    <div className="app-shell" style={{ background: 'var(--color-bg)', height: '100vh', overflow: 'hidden' }}>
      <Sidebar />
      <main className="app-main" style={{ marginLeft: 'var(--sidebar-width)', padding: 0, height: '100vh', display: 'flex', flexDirection: 'column' }}>
        
        {/* Top Control Bar */}
        <header style={{ height: '72px', background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2rem', zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {activeTab !== 'dashboard' && (
              <button onClick={() => setActiveTab('dashboard')} className="btn-ghost" style={{ padding: '0.5rem', display: 'flex', alignItems: 'center' }}>
                <ArrowLeft size={18} />
              </button>
            )}
            <div style={{ width: '40px', height: '40px', background: 'var(--gradient-primary)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
              <FileText size={20} />
            </div>
            <div>
              {activeTab === 'dashboard' ? (
                <span style={{ color: 'var(--color-text)', fontSize: '1.25rem', fontWeight: 900 }}>Career Profile OS</span>
              ) : (
                <input 
                  value={resumeTitle} 
                  onChange={e => setResumeTitle(e.target.value)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--color-text)', fontSize: '1.1rem', fontWeight: 800, outline: 'none', width: '220px' }}
                />
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            {activeTab !== 'dashboard' && (
              <>
                <div className="hide-mobile" style={{ display: 'flex', background: 'var(--color-surface-2)', padding: '0.25rem', borderRadius: '10px' }}>
                  {[
                    { id: 'edit', label: 'Editor' },
                    { id: 'templates', label: 'Design' },
                    { id: 'ats', label: 'ATS Score' },
                    { id: 'job-match', label: 'Job Match' },
                    { id: 'profile-match', label: 'Match Profile' }
                  ].map(tab => (
                    <button 
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      style={{
                        padding: '0.5rem 0.85rem', borderRadius: '8px', border: 'none', fontSize: '0.75rem', fontWeight: 700,
                        background: activeTab === tab.id ? 'var(--color-surface-3)' : 'transparent',
                        color: activeTab === tab.id ? 'var(--color-primary-light)' : 'var(--color-text-muted)',
                        cursor: 'pointer', transition: 'all 0.2s'
                      }}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <button onClick={handleSave} className="btn-ghost" style={{ padding: '0.6rem 1rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}>
                  <Save size={15} /> Save
                </button>

                <div style={{ position: 'relative', display: 'inline-block' }}>
                   <button className="btn-primary" style={{ padding: '0.6rem 1.25rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                     <Download size={16} /> Export <ChevronDown size={14} />
                   </button>
                   <div className="glass-card dropdown-menu" style={{ position: 'absolute', top: '110%', right: 0, width: '180px', padding: '0.5rem', zIndex: 100 }}>
                      <button onClick={() => html2pdf().from(printRef.current).save()} className="btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', fontSize: '0.8rem', border: 'none' }}>PDF Document</button>
                      <button onClick={() => exportToDocx({ personalInfo: info, experiences, education, skills: [...skills, ...technicalSkills, ...softSkills], achievements })} className="btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', fontSize: '0.8rem', border: 'none' }}>Word (DOCX)</button>
                      <button onClick={exportToTxt} className="btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', fontSize: '0.8rem', border: 'none' }}>Plain Text (TXT)</button>
                      <button onClick={exportToJson} className="btn-ghost" style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.25rem', justifyContent: 'flex-start', fontSize: '0.8rem', border: 'none' }}><FileJson size={13} /> JSON Format</button>
                   </div>
                </div>
              </>
            )}
          </div>
        </header>

        {/* Content Wrapper */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          
          {activeTab === 'dashboard' ? (
            <div style={{ flex: 1, overflowY: 'auto', padding: '2rem 3rem' }}>
              <ResumeDashboard 
                savedResumes={savedResumes}
                currentResumeId={currentResumeId}
                onLoadResume={loadResume}
                onDuplicate={handleDuplicate}
                onDelete={handleDelete}
                onCreateNew={handleCreateNew}
                atsAnalysis={atsAnalysis}
              />
            </div>
          ) : (
            <>
              {/* Left Form Editor Panels */}
              <div style={{ flex: 1, minWidth: '450px', overflowY: 'auto', padding: '2rem', borderRight: '1px solid var(--color-border)', scrollbarWidth: 'thin' }}>
                <div style={{ maxWidth: '640px', margin: '0 auto' }}>
                  <AnimatePresence mode="wait">
                    {activeTab === 'edit' && (
                      <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        
                        {/* Multi-step progress indicator */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', background: 'var(--color-surface-2)', padding: '0.5rem 1rem', borderRadius: '12px', border: '1px solid var(--color-border)', marginBottom: '1rem' }}>
                          {['Bio', 'Skills', 'Education', 'Projects', 'Extras'].map((step, idx) => (
                            <button
                              key={step}
                              onClick={() => setEditorStep(idx)}
                              style={{
                                border: 'none', background: 'none', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer',
                                color: editorStep === idx ? 'var(--color-primary-light)' : 'var(--color-text-muted)',
                                paddingBottom: '3px', borderBottom: editorStep === idx ? '2px solid var(--color-primary)' : '2px solid transparent'
                              }}
                            >
                              {step}
                            </button>
                          ))}
                        </div>

                        {renderWizardStep()}

                        {/* Step navigation buttons */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem' }}>
                          <button
                            type="button"
                            disabled={editorStep === 0}
                            onClick={() => setEditorStep(prev => Math.max(0, prev - 1))}
                            className="btn-ghost"
                            style={{ padding: '0.6rem 1.25rem' }}
                          >
                            Previous Step
                          </button>
                          <button
                            type="button"
                            disabled={editorStep === 4}
                            onClick={() => setEditorStep(prev => Math.min(4, prev + 1))}
                            className="btn-primary"
                            style={{ padding: '0.6rem 1.25rem' }}
                          >
                            Next Step
                          </button>
                        </div>

                      </motion.div>
                    )}

                    {activeTab === 'templates' && (
                      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
                        <ResumeTemplateGallery 
                          templateId={templateId} setTemplateId={setTemplateId}
                          accentColor={accentColor} setAccentColor={setAccentColor}
                          selectedFont={selectedFont} setSelectedFont={setSelectedFont}
                          sectionOrder={sectionOrder} setSectionOrder={setSectionOrder}
                          TEMPLATES={TEMPLATES} info={info} skills={skills}
                          experiences={experiences} education={education} projects={projects}
                          achievements={achievements} certifications={certifications} languages={languages}
                        />
                      </motion.div>
                    )}

                    {activeTab === 'ats' && (
                      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
                        <ResumeATSReport 
                          atsAnalysis={atsAnalysis}
                          onAnalyze={handleATSAnalyze}
                          loading={atsLoading}
                        />
                      </motion.div>
                    )}

                    {activeTab === 'job-match' && (
                      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
                        <ResumeJobMatch 
                          jobDescription={jobDescription} setJobDescription={setJobDescription}
                          jobAnalysis={jobAnalysis} onAnalyze={handleJobAnalyze}
                          onTailor={handleTailorResume} jobLoading={jobLoading} tailorLoading={tailorLoading}
                        />
                      </motion.div>
                    )}

                    {activeTab === 'profile-match' && (
                      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
                        <ResumeProfileMatch 
                          info={info} 
                          skills={skills} 
                          technicalSkills={technicalSkills} 
                          softSkills={softSkills} 
                          experiences={experiences} 
                          projects={projects} 
                          certifications={certifications}
                          researchPapers={researchPapers}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Right Live Preview Panel */}
              <div style={{ flex: 1.1, minWidth: 0, background: 'var(--color-bg-secondary)', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                 <div style={{ padding: '1rem 2rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', letterSpacing: '0.1em' }}>LIVE PREVIEW</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                       <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--color-surface-2)', padding: '4px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                          <button onClick={() => setZoom(Math.max(0.2, zoom - 0.05))} style={{ width: '28px', height: '28px', border: 'none', background: 'none', color: 'var(--color-text)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Zoom Out"><Minus size={14} /></button>
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-text)', alignSelf: 'center', minWidth: '40px', textAlign: 'center', fontWeight: 600 }}>{Math.round(zoom * 200)}%</span>
                          <button onClick={() => setZoom(Math.min(1, zoom + 0.05))} style={{ width: '28px', height: '28px', border: 'none', background: 'none', color: 'var(--color-text)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Zoom In"><Plus size={14} /></button>
                       </div>
                    </div>
                 </div>

                 <div style={{ flex: 1, overflow: 'auto', display: 'flex', justifyContent: 'center', padding: '40px', background: 'var(--color-bg)' }}>
                    <div style={{ width: 794 * zoom, height: 1123 * zoom, flexShrink: 0, position: 'relative', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}>
                       <div style={{ background: 'white', boxShadow: '0 30px 60px -15px rgba(0,0,0,0.5)', overflow: 'hidden', transform: `scale(${zoom})`, transformOrigin: 'top left', width: '794px', height: '1123px', minWidth: '794px', position: 'absolute', top: 0, left: 0 }}>
                          <div ref={printRef} style={{ pointerEvents: 'none', width: '100%', height: '100%' }}>
                             <CurrentTemplate data={{ personalInfo: info, skills: [...skills, ...technicalSkills, ...softSkills], experiences, internships, education, projects, achievements, certifications, languages, customSections, researchPapers, workshops, volunteering, interests, references, templateId, customStyles: { primaryColor: effectiveAccent, fontFamily: selectedFont || undefined } }} />
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
            </>
          )}

        </div>
      </main>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
