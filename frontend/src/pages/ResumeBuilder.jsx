import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { resumeService } from '../services/resumeService';
import Sidebar from '../components/Sidebar';
import {
  ModernTemplate,
  ProfessionalTemplate,
  CreativeTemplate,
  MinimalistTemplate
} from '../components/ResumeTemplates';
import {
  FileText, Download, Plus, Trash2, Zap, User, Mail, Phone,
  MapPin, Link, Globe, Briefcase, GraduationCap, Code2,
  ChevronDown, ChevronUp, Eye, Edit3, Sparkles, Save,
  Layers, Palette, Type, Layout, History, Share2, 
  CheckCircle2, AlertCircle, TrendingUp, Info, ExternalLink,
  ChevronRight, MoreHorizontal, Settings, Moon, Sun, Monitor
} from 'lucide-react';
import html2pdf from 'html2pdf.js';
import { exportToDocx } from '../utils/resumeExportUtils';

// ─── Constants ───────────────────────────────────────────────────────────────
const TEMPLATES = [
  { id: 'modern', name: 'Modern ATS', icon: Layout, component: ModernTemplate, color: '#3b82f6', desc: 'Clean, professional, and optimized for ATS systems.' },
  { id: 'professional', name: 'Executive', icon: Briefcase, component: ProfessionalTemplate, color: '#111827', desc: 'Traditional serif design for corporate leadership roles.' },
  { id: 'creative', name: 'Creative', icon: Palette, component: CreativeTemplate, color: '#ec4899', desc: 'Modern two-column layout for designers and marketers.' },
  { id: 'minimalist', name: 'Minimalist', icon: Type, component: MinimalistTemplate, color: '#111111', desc: 'Ultra-clean design focused on high-end typography.' },
];

const EMPTY_EXP = () => ({ id: Date.now(), title: '', company: '', period: '', desc: '' });
const EMPTY_EDU = () => ({ id: Date.now(), degree: '', institution: '', year: '' });

// ─── Shared Styles ──────────────────────────────────────────────────────────
const sectionHeadStyle = {
  fontSize: '1.25rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--color-text)'
};

const labelStyle = {
  fontSize: '0.95rem', fontWeight: 900, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', display: 'block'
};

// ─── Helper Components ──────────────────────────────────────────────────────
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

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function ResumeBuilder() {
  const { user } = useAuth();
  const printRef = useRef();
  const [activeTab, setActiveTab] = useState('edit'); 
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [savedResumes, setSavedResumes] = useState([]);
  const [currentResumeId, setCurrentResumeId] = useState(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [zoom, setZoom] = useState(0.7);

  // Resume State
  const [resumeTitle, setResumeTitle] = useState('Untitled Resume');
  const [templateId, setTemplateId] = useState('modern');
  const [isPublic, setIsPublic] = useState(false);
  const [shareableToken, setShareableToken] = useState('');
  
  const [info, setInfo] = useState({ name: user?.name || '', title: '', email: user?.email || '', phone: '', location: '', linkedin: '', summary: '' });
  const [skills, setSkills] = useState([]);
  const [skillInput, setSkillInput] = useState('');
  const [experiences, setExperiences] = useState([EMPTY_EXP()]);
  const [internships, setInternships] = useState([]);
  const [education, setEducation] = useState([EMPTY_EDU()]);
  const [projects, setProjects] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [certifications, setCertifications] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [socialLinks, setSocialLinks] = useState([]);
  const [customSections, setCustomSections] = useState([]);
  
  // Section Ordering State
  const [sectionOrder, setSectionOrder] = useState([
    'personalInfo', 'experience', 'education', 'skills', 
    'projects', 'internships', 'certifications', 'languages', 
    'achievements', 'socialLinks', 'customSections'
  ]);
  
  const [analysis, setAnalysis] = useState({ score: 0, atsScore: 0, tips: [], keywords: [] });
  
  // Ref to prevent initial auto-save
  const isInitialMount = useRef(true);

  useEffect(() => {
    fetchSavedResumes();
  }, []);

  const fetchSavedResumes = async () => {
    try {
      const { data } = await resumeService.getAll();
      setSavedResumes(data.data || []);
    } catch (e) { console.error(e); }
  };

  const handleAIAnalyze = async () => {
    if (!currentResumeId) return alert("Please save your resume first.");
    try {
      setIsOptimizing(true);
      const { data } = await resumeService.optimize(currentResumeId);
      setAnalysis(data.data);
      setShowAnalysis(true);
    } catch (e) { alert("AI analysis unavailable."); }
    finally { setIsOptimizing(false); }
  };



  const loadResume = (res) => {
    setCurrentResumeId(res._id);
    setResumeTitle(res.resumeTitle);
    setTemplateId(res.templateId);
    setIsPublic(res.isPublic);
    setShareableToken(res.shareableToken);
    setInfo(res.personalInfo);
    setSkills(res.skills);
    setExperiences(res.experiences);
    setInternships(res.internships || []);
    setEducation(res.education);
    setProjects(res.projects || []);
    setAchievements(res.achievements || []);
    setCertifications(res.certifications || []);
    setLanguages(res.languages || []);
    setSocialLinks(res.socialLinks || []);
    setCustomSections(res.customSections || []);
    if (res.sectionOrder?.length) setSectionOrder(res.sectionOrder);
    setAnalysis(res.analysis || { score: 0, atsScore: 0, tips: [], keywords: [] });
    setActiveTab('edit');
  };



  const renderSection = (id) => {
    switch (id) {
      case 'personalInfo':
        return (
          <Accordion title="Personal Information" icon={User} defaultOpen>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
              <Input label="Full Name" value={info.name} onChange={e => setInfo({...info, name: e.target.value})} placeholder="Jane Doe" />
              <Input label="Job Title" value={info.title} onChange={e => setInfo({...info, title: e.target.value})} placeholder="Full Stack Developer" />
              <Input label="Email" icon={Mail} value={info.email} onChange={e => setInfo({...info, email: e.target.value})} placeholder="jane@example.com" />
              <Input label="Phone" icon={Phone} value={info.phone} onChange={e => setInfo({...info, phone: e.target.value})} placeholder="+1 234 567 890" />
              <Input label="Location" icon={MapPin} value={info.location} onChange={e => setInfo({...info, location: e.target.value})} placeholder="New York, NY" />
              <Input label="LinkedIn/Website" icon={Globe} value={info.linkedin} onChange={e => setInfo({...info, linkedin: e.target.value})} placeholder="linkedin.com/in/jane" />
              <div style={{ gridColumn: 'span 2' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={labelStyle}>Professional Summary</label>
                </div>
                <TextArea value={info.summary} onChange={e => setInfo({...info, summary: e.target.value})} placeholder="Describe your career highlights..." />
              </div>
            </div>
          </Accordion>
        );
      case 'experience':
        return (
          <Accordion title="Work Experience" icon={Briefcase}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              {experiences.map((exp, i) => (
                <div key={exp.id || i} style={{ padding: '1.25rem', background: 'var(--color-surface-3)', borderRadius: '16px', position: 'relative', border: '1px solid var(--color-border)' }}>
                  <button onClick={() => setExperiences(experiences.filter((_, idx) => idx !== i))} style={{ position: 'absolute', top: '1rem', right: '1rem', color: 'var(--color-danger)', border: 'none', background: 'none', cursor: 'pointer' }}><Trash2 size={14} /></button>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div style={{ gridColumn: 'span 2' }}><Input label="Job Title" value={exp.title} onChange={e => { const n = [...experiences]; n[i].title = e.target.value; setExperiences(n); }} placeholder="Senior Developer" /></div>
                    <Input label="Company" value={exp.company} onChange={e => { const n = [...experiences]; n[i].company = e.target.value; setExperiences(n); }} placeholder="Google" />
                    <Input label="Period" value={exp.period} onChange={e => { const n = [...experiences]; n[i].period = e.target.value; setExperiences(n); }} placeholder="Jan 2022 - Present" />
                    <div style={{ gridColumn: 'span 2' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                         <label style={labelStyle}>Description</label>
                      </div>
                      <TextArea value={exp.desc} onChange={e => { const n = [...experiences]; n[i].desc = e.target.value; setExperiences(n); }} placeholder="What did you achieve?" />
                    </div>
                  </div>
                </div>
              ))}
              <button onClick={() => setExperiences([...experiences, EMPTY_EXP()])} className="btn-ghost" style={{ width: '100%', padding: '1rem', borderStyle: 'dashed', background: 'transparent' }}><Plus size={16} /> Add Experience</button>
            </div>
          </Accordion>
        );
      case 'education':
        return (
          <Accordion title="Education" icon={GraduationCap}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              {education.map((edu, i) => (
                <div key={edu.id || i} style={{ padding: '1.25rem', background: 'var(--color-surface-3)', borderRadius: '16px', position: 'relative', border: '1px solid var(--color-border)' }}>
                  <button onClick={() => setEducation(education.filter((_, idx) => idx !== i))} style={{ position: 'absolute', top: '1rem', right: '1rem', color: 'var(--color-danger)', border: 'none', background: 'none', cursor: 'pointer' }}><Trash2 size={14} /></button>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div style={{ gridColumn: 'span 2' }}><Input label="Degree / Major" value={edu.degree} onChange={e => { const n = [...education]; n[i].degree = e.target.value; setEducation(n); }} placeholder="B.S. Computer Science" /></div>
                    <Input label="Institution" value={edu.institution} onChange={e => { const n = [...education]; n[i].institution = e.target.value; setEducation(n); }} placeholder="Stanford University" />
                    <Input label="Year" value={edu.year} onChange={e => { const n = [...education]; n[i].year = e.target.value; setEducation(n); }} placeholder="2020 - 2024" />
                  </div>
                </div>
              ))}
              <button onClick={() => setEducation([...education, EMPTY_EDU()])} className="btn-ghost" style={{ width: '100%', padding: '1rem', borderStyle: 'dashed', background: 'transparent' }}><Plus size={16} /> Add Education</button>
            </div>
          </Accordion>
        );
      case 'skills':
        return (
          <Accordion title="Skills & Keywords" icon={Code2}>
            <div style={{ marginTop: '1rem' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.25rem' }}>
                {skills.map(s => (
                  <span key={s} className="tag" style={{ background: 'var(--color-surface-glass-2)', padding: '0.6rem 1rem', fontSize: '0.8rem' }}>
                    {s} <button onClick={() => setSkills(skills.filter(x => x !== s))} style={{ border: 'none', background: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', paddingLeft: '0.5rem' }}>×</button>
                  </span>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <input 
                  value={skillInput} 
                  onChange={e => setSkillInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && skillInput) { setSkills([...skills, skillInput]); setSkillInput(''); } }}
                  placeholder="Add a skill..."
                  style={{ flex: 1, background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)', padding: '0.75rem 1rem', borderRadius: '12px', outline: 'none' }}
                />
                <button onClick={() => skillInput && (setSkills([...skills, skillInput]), setSkillInput(''))} className="btn-primary" style={{ padding: '0 1.25rem' }}><Plus size={20} /></button>
              </div>
            </div>
          </Accordion>
        );
      case 'projects':
        return (
          <Accordion title="Projects" icon={Layers}>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                {projects.map((proj, i) => (
                  <div key={proj.id || i} style={{ padding: '1.25rem', background: 'var(--color-surface-3)', borderRadius: '16px', position: 'relative', border: '1px solid var(--color-border)' }}>
                     <button onClick={() => setProjects(projects.filter((_, idx) => idx !== i))} style={{ position: 'absolute', top: '1rem', right: '1rem', color: 'var(--color-danger)', border: 'none', background: 'none', cursor: 'pointer' }}><Trash2 size={14} /></button>
                     <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <Input label="Project Name" value={proj.name} onChange={e => { const n = [...projects]; n[i].name = e.target.value; setProjects(n); }} placeholder="E-commerce Platform" />
                        <Input label="Technologies" value={proj.tech} onChange={e => { const n = [...projects]; n[i].tech = e.target.value; setProjects(n); }} placeholder="React, Node.js" />
                        <div style={{ gridColumn: 'span 2' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                             <label style={labelStyle}>Description</label>
                          </div>
                          <TextArea value={proj.desc} onChange={e => { const n = [...projects]; n[i].desc = e.target.value; setProjects(n); }} placeholder="Describe the project impact..." />
                        </div>
                     </div>
                  </div>
                ))}
                <button onClick={() => setProjects([...projects, { id: Date.now(), name: '', tech: '', desc: '' }])} className="btn-ghost" style={{ width: '100%', padding: '1rem', borderStyle: 'dashed', background: 'transparent' }}><Plus size={16} /> Add Project</button>
             </div>
          </Accordion>
        );
      case 'achievements':
        return (
          <Accordion title="Achievements" icon={Zap}>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                {achievements.map((ach, i) => (
                  <div key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                     <input value={ach} onChange={e => { const n = [...achievements]; n[i] = e.target.value; setAchievements(n); }} style={{ flex: 1, background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)', padding: '0.75rem 1rem', borderRadius: '12px', outline: 'none' }} placeholder="Award or accomplishment..." />
                     <button onClick={() => setAchievements(achievements.filter((_, idx) => idx !== i))} style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', padding: '0.5rem' }}><Trash2 size={16} /></button>
                  </div>
                ))}
                <button onClick={() => setAchievements([...achievements, ''])} className="btn-ghost" style={{ width: '100%', padding: '1rem', borderStyle: 'dashed', background: 'transparent' }}><Plus size={16} /> Add Achievement</button>
             </div>
          </Accordion>
        );
      case 'certifications':
        return (
          <Accordion title="Certifications" icon={FileText}>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                {certifications.map((cert, i) => (
                  <div key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                     <input value={cert} onChange={e => { const n = [...certifications]; n[i] = e.target.value; setCertifications(n); }} style={{ flex: 1, background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)', padding: '0.75rem 1rem', borderRadius: '12px', outline: 'none' }} placeholder="AWS Certified..." />
                     <button onClick={() => setCertifications(certifications.filter((_, idx) => idx !== i))} style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', padding: '0.5rem' }}><Trash2 size={16} /></button>
                  </div>
                ))}
                <button onClick={() => setCertifications([...certifications, ''])} className="btn-ghost" style={{ width: '100%', padding: '1rem', borderStyle: 'dashed', background: 'transparent' }}><Plus size={16} /> Add Certification</button>
             </div>
          </Accordion>
        );
      case 'languages':
        return (
          <Accordion title="Languages" icon={Globe}>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                {languages.map((lang, i) => (
                  <div key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                     <input value={lang} onChange={e => { const n = [...languages]; n[i] = e.target.value; setLanguages(n); }} style={{ flex: 1, background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)', padding: '0.75rem 1rem', borderRadius: '12px', outline: 'none' }} placeholder="English (Native)..." />
                     <button onClick={() => setLanguages(languages.filter((_, idx) => idx !== i))} style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', padding: '0.5rem' }}><Trash2 size={16} /></button>
                  </div>
                ))}
                <button onClick={() => setLanguages([...languages, ''])} className="btn-ghost" style={{ width: '100%', padding: '1rem', borderStyle: 'dashed', background: 'transparent' }}><Plus size={16} /> Add Language</button>
             </div>
          </Accordion>
        );
      case 'internships':
      case 'socialLinks':
      case 'customSections':
        return null; 
      default: return null;
    }
  };

  const CurrentTemplate = TEMPLATES.find(t => t.id === templateId)?.component || ModernTemplate;

  return (
    <div className="app-shell" style={{ background: 'var(--color-bg)', height: '100vh', overflow: 'hidden' }}>
      <Sidebar />
      <main className="app-main" style={{ marginLeft: 'var(--sidebar-width)', padding: 0, height: '100vh', display: 'flex', flexDirection: 'column' }}>
        
        {/* ── Top Bar ── */}
        <header style={{ height: '72px', background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2rem', zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '40px', height: '40px', background: 'var(--gradient-primary)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
              <FileText size={20} />
            </div>
            <div>
              <input 
                value={resumeTitle} 
                onChange={e => setResumeTitle(e.target.value)}
                style={{ background: 'transparent', border: 'none', color: 'var(--color-text)', fontSize: '1rem', fontWeight: 700, outline: 'none', width: '240px' }}
              />
              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <TrendingUp size={10} /> {currentResumeId ? `Saved at ${new Date().toLocaleTimeString()}` : 'Unsaved draft'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div className="hide-mobile" style={{ display: 'flex', background: 'var(--color-surface-2)', padding: '0.25rem', borderRadius: '10px', marginRight: '1rem' }}>
              {[
                { id: 'edit', icon: Edit3, label: 'Editor' },
                { id: 'templates', icon: Layers, label: 'Design' },
                { id: 'history', icon: History, label: 'My Library' }
              ].map(tab => (
                <button 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', fontSize: '0.8rem', fontWeight: 600,
                    background: activeTab === tab.id ? 'var(--color-surface-3)' : 'transparent',
                    color: activeTab === tab.id ? 'var(--color-primary-light)' : 'var(--color-text-muted)',
                    cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '0.5rem'
                  }}
                >
                  <tab.icon size={14} /> {tab.label}
                </button>
              ))}
            </div>
            
            <div style={{ position: 'relative', display: 'inline-block' }}>
               <button className="btn-primary" style={{ padding: '0.6rem 1.25rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                 <Download size={16} /> Export <ChevronDown size={14} />
               </button>
               <div className="glass-card dropdown-menu" style={{ position: 'absolute', top: '110%', right: 0, width: '180px', padding: '0.5rem', zIndex: 100 }}>
                  <button onClick={() => html2pdf().from(printRef.current).save()} className="btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', fontSize: '0.8rem', border: 'none' }}>PDF Document</button>
                  <button onClick={() => exportToDocx({ personalInfo: info, experiences, education, skills, achievements })} className="btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', fontSize: '0.8rem', border: 'none' }}>Word (DOCX)</button>
               </div>
            </div>
          </div>
        </header>

        {/* ── Main Content Area ── */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          
          {/* ══ LEFT: SCROLLABLE EDITOR ══ */}
          <div style={{ flex: 1, minWidth: '450px', overflowY: 'auto', padding: '2rem', borderRight: '1px solid var(--color-border)', scrollbarWidth: 'thin' }}>
            <div style={{ maxWidth: '640px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              <AnimatePresence mode="wait">
                {activeTab === 'edit' && (
                  <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '-0.5rem', textAlign: 'right' }}>Drag sections to reorder</div>
                    
                    <Reorder.Group axis="y" values={sectionOrder} onReorder={setSectionOrder} style={{ listStyleType: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      {sectionOrder.map(id => {
                        const sectionContent = renderSection(id);
                        if (!sectionContent) return null;
                        return (
                          <Reorder.Item key={id} value={id} style={{ cursor: 'grab' }} whileDrag={{ scale: 1.02, boxShadow: 'var(--shadow-glow-mix)' }}>
                            {sectionContent}
                          </Reorder.Item>
                        );
                      })}
                    </Reorder.Group>

                    <div style={{ padding: '2rem', background: 'var(--color-primary-glow)', borderRadius: '20px', border: '1px dashed var(--color-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div style={{ width: '48px', height: '48px', background: 'var(--color-primary)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 8px 16px rgba(14,165,233,0.3)' }}>
                             <Zap size={24} fill="white" />
                          </div>
                          <div>
                             <h4 style={{ margin: 0, fontWeight: 700 }}>ATS Optimization</h4>
                             <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-dim)' }}>Check your resume score with AI</p>
                          </div>
                       </div>
                       <button onClick={handleAIAnalyze} disabled={isOptimizing} className="btn-primary" style={{ padding: '0.75rem 1.5rem', borderRadius: '12px' }}>
                          {isOptimizing ? 'Analyzing...' : 'Run Scan'}
                       </button>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'templates' && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    {TEMPLATES.map(t => (
                      <div 
                        key={t.id} 
                        onClick={() => setTemplateId(t.id)}
                        style={{ 
                          cursor: 'pointer', borderRadius: '20px', overflow: 'hidden', border: `2px solid ${templateId === t.id ? t.color : 'var(--color-border)'}`,
                          transition: 'all 0.3s', background: 'var(--color-surface)'
                        }}
                      >
                        <div style={{ height: '240px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: 'scale(0.35)', transformOrigin: 'center' }}>
                           <t.component data={{ personalInfo: info, skills, experiences, internships, education, projects, achievements, certifications, languages, socialLinks, customSections, sectionOrder, templateId: t.id }} />
                        </div>
                        <div style={{ padding: '1.25rem', borderTop: '1px solid var(--color-border)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                             <span style={{ fontWeight: 800 }}>{t.name}</span>
                             {templateId === t.id && <CheckCircle2 size={18} color={t.color} />}
                          </div>
                          <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{t.desc}</p>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}

                {activeTab === 'history' && (
                   <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
                      {savedResumes.map(res => (
                        <div key={res._id} className="glass-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                           <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <div style={{ width: '40px', height: '40px', background: 'var(--color-surface-2)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FileText size={20} /></div>
                              <button onClick={async (e) => { e.stopPropagation(); if(confirm('Delete?')){ await resumeService.delete(res._id); fetchSavedResumes(); }}} style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer' }}><Trash2 size={16} /></button>
                           </div>
                           <div>
                              <h5 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700 }}>{res.resumeTitle}</h5>
                              <p style={{ margin: '0.2rem 0 0', fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Last updated {new Date(res.updatedAt).toLocaleDateString()}</p>
                           </div>
                           <button onClick={() => loadResume(res)} className="btn-ghost" style={{ width: '100%', padding: '0.5rem', fontSize: '0.8rem' }}>Open Editor</button>
                        </div>
                      ))}
                   </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* ══ RIGHT: FIXED STICKY PREVIEW ══ */}
          <div style={{ flex: 1.1, minWidth: 0, background: 'var(--color-bg-secondary)', display: 'flex', flexDirection: 'column', position: 'relative' }}>
             
             {/* Toolbar */}
             <div style={{ padding: '1rem 2rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', letterSpacing: '0.1em' }}>LIVE PREVIEW</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                   <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--color-surface)', padding: '4px', borderRadius: '8px' }}>
                      <button onClick={() => setZoom(Math.max(0.2, zoom - 0.05))} style={{ width: '28px', height: '28px', border: 'none', background: 'none', color: 'white', cursor: 'pointer' }}><Monitor size={14} /></button>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', alignSelf: 'center', minWidth: '40px', textAlign: 'center' }}>{Math.round(zoom * 200)}%</span>
                      <button onClick={() => setZoom(Math.min(1, zoom + 0.05))} style={{ width: '28px', height: '28px', border: 'none', background: 'none', color: 'white', cursor: 'pointer' }}><Plus size={14} /></button>
                   </div>
                   <button onClick={() => setActiveTab('templates')} className="btn-ghost" style={{ padding: '0.4rem 0.8rem', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Palette size={14} /> Change Style
                   </button>
                </div>
             </div>

             {/* Preview Surface */}
             <div style={{ flex: 1, overflow: 'auto', display: 'flex', justifyContent: 'center', padding: '40px', background: 'var(--color-bg)' }}>
                {/* Scaled Wrapper to maintain layout space */}
                <div style={{ width: 794 * zoom, height: 1123 * zoom, flexShrink: 0, position: 'relative', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}>
                   <div 
                     style={{ 
                       background: 'white', boxShadow: '0 30px 60px -15px rgba(0,0,0,0.5)', 
                       overflow: 'hidden', transform: `scale(${zoom})`, transformOrigin: 'top left',
                       width: '794px', height: '1123px', minWidth: '794px', maxWidth: 'none',
                       transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                       position: 'absolute', top: 0, left: 0
                     }}
                   >
                      <div ref={printRef} style={{ pointerEvents: 'none', width: '100%', height: '100%' }}>
                         <CurrentTemplate data={{ personalInfo: info, skills, experiences, internships, education, projects, achievements, certifications, languages, socialLinks, customSections, sectionOrder, templateId, customStyles: { primaryColor: TEMPLATES.find(t=>t.id===templateId)?.color || '#3b82f6' } }} />
                      </div>
                   </div>
                </div>
             </div>

             {/* Analysis Sidebar (Overlays preview) */}
             <AnimatePresence>
               {showAnalysis && (
                 <motion.div initial={{ x: 350 }} animate={{ x: 0 }} exit={{ x: 350 }} style={{ position: 'absolute', right: 0, top: '72px', bottom: 0, width: '320px', background: 'var(--color-surface)', borderLeft: '1px solid var(--color-border)', padding: '1.5rem', zIndex: 5, boxShadow: '-10px 0 30px rgba(0,0,0,0.3)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                       <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>Resume Insights</h3>
                       <button onClick={() => setShowAnalysis(false)} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}><ChevronRight size={20} /></button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                       <div className="glass-card" style={{ padding: '1.25rem', textAlign: 'center' }}>
                          <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontWeight: 700, marginBottom: '0.5rem' }}>OVERALL SCORE</div>
                          <div style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--color-primary)' }}>{analysis.score}</div>
                          <div style={{ height: '4px', background: 'var(--color-surface-2)', borderRadius: '2px', marginTop: '0.5rem', overflow: 'hidden' }}>
                             <div style={{ width: `${analysis.score}%`, height: '100%', background: 'var(--color-primary)' }} />
                          </div>
                       </div>

                       <div>
                          <div style={{ ...labelStyle, color: 'var(--color-success)' }}>Strengths & Tips</div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                             {analysis.tips.map((tip, i) => (
                               <div key={i} style={{ display: 'flex', gap: '0.75rem', fontSize: '0.8rem' }}>
                                  <CheckCircle2 size={16} color="var(--color-success)" style={{ flexShrink: 0 }} />
                                  <span>{tip}</span>
                               </div>
                             ))}
                          </div>
                       </div>

                       <div>
                          <div style={{ ...labelStyle, color: 'var(--color-primary)' }}>Keywords Found</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                             {analysis.keywords.map(kw => <span key={kw} style={{ background: 'var(--color-surface-2)', padding: '0.25rem 0.6rem', borderRadius: '4px', fontSize: '0.7rem' }}>{kw}</span>)}
                          </div>
                       </div>
                    </div>
                 </motion.div>
               )}
             </AnimatePresence>
          </div>

        </div>
      </main>
    </div>
  );
}
