import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { resumeService } from '../services/resumeService';
import Sidebar from '../components/Sidebar';
import { 
  FileText, Sparkles, Wand2, Download, CheckCircle2, ChevronRight,
  TrendingUp, Award, Layers, Save, Trash2, ArrowLeft,
  Plus, Minus, RefreshCw, Send, Brain, ExternalLink,
  Target, Info, AlertTriangle, FileJson, Check, Clipboard, ListTodo, Star, BookOpen, GraduationCap
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
  { id: 'modern', name: 'Modern ATS', color: '#3b82f6' },
  { id: 'sahara_contrast', name: 'Sahara Contrast', color: '#b45309' },
  { id: 'grey_lining', name: 'Grey Lining', color: '#475569' },
  { id: 'glacier_chill', name: 'Glacier Chill', color: '#0f172a' },
  { id: 'ivory_prestige', name: 'Ivory Prestige', color: '#a27b5c' },
  { id: 'royal_essence', name: 'Royal Essence', color: '#0f2963' },
  { id: 'executive_edge', name: 'Executive Edge', color: '#0f766e' }
];

const JOB_ROLES = [
  { id: 'ai_engineer', name: 'AI / Machine Learning Engineer', keywords: ['Python', 'TensorFlow', 'PyTorch', 'Docker', 'Kubernetes', 'LLMs', 'OpenAI API'] },
  { id: 'frontend', name: 'Frontend React Developer', keywords: ['React', 'TypeScript', 'Tailwind CSS', 'Redux Toolkit', 'Next.js', 'Jest'] },
  { id: 'backend', name: 'Backend Node.js Engineer', keywords: ['Node.js', 'Express.js', 'MongoDB', 'PostgreSQL', 'Redis', 'Docker', 'RESTful APIs'] },
  { id: 'fullstack', name: 'Full Stack Developer', keywords: ['React', 'Node.js', 'MongoDB', 'Docker', 'AWS', 'TypeScript', 'GraphQL'] },
  { id: 'devops', name: 'DevOps & Cloud Engineer', keywords: ['AWS', 'Docker', 'Kubernetes', 'Terraform', 'CI/CD Pipelines', 'Linux', 'Bash'] }
];

export default function ResumeBuilder() {
  const { user } = useAuth();
  const printRef = useRef();

  // Mode: 'landing', 'workspace'
  const [mode, setMode] = useState('landing');
  const [selectedRole, setSelectedRole] = useState(JOB_ROLES[0]);
  const [selectedTemplate, setSelectedTemplate] = useState('modern');
  const [accentColor, setAccentColor] = useState('#3b82f6');
  const [zoom, setZoom] = useState(0.65);

  // Profile data from database
  const [info, setInfo] = useState({});
  const [skills, setSkills] = useState([]);
  const [experiences, setExperiences] = useState([]);
  const [education, setEducation] = useState([]);
  const [projects, setProjects] = useState([]);
  const [certifications, setCertifications] = useState([]);

  // Roadmap popup states
  const [expandedSkillRoadmap, setExpandedSkillRoadmap] = useState(null);

  useEffect(() => {
    loadMasterProfile();
  }, []);

  const loadMasterProfile = async () => {
    try {
      const { data } = await resumeService.getAll();
      if (data.data && data.data.length > 0) {
        const profile = data.data[0];
        setInfo(profile.personalInfo || {});
        setSkills(profile.skills || profile.technicalSkills || []);
        setExperiences(profile.experiences || []);
        setEducation(profile.education || []);
        setProjects(profile.projects || []);
        setCertifications(profile.certifications || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Identify skills required for the selected role that are NOT in the user's skills profile
  const missingSkills = selectedRole.keywords.filter(keyword => {
    const userHasSkill = (skills || []).some(s => s.toLowerCase().trim() === keyword.toLowerCase().trim());
    return !userHasSkill;
  });

  const handleLaunchWorkspace = (role) => {
    setSelectedRole(role);
    setMode('workspace');
  };

  const handleExportPdf = () => {
    html2pdf().from(printRef.current).save(`${selectedRole.name}_Resume.pdf`);
  };

  const CurrentTemplate = TEMPLATES.find(t => t.id === selectedTemplate)?.component || ModernTemplate;

  // Generate automated learning steps for any missing skill
  const getSkillSteps = (skillName) => [
    { title: 'Official Documentation & Guides', desc: `Review official starting guides and core architectural patterns for ${skillName}.` },
    { title: 'Recommended YouTube Course', desc: `Complete a 3-hour hands-on crash course on ${skillName} deployment.` },
    { title: 'Build a Portfolio Project', desc: `Create and deploy a mini project utilizing ${skillName} to map on GitHub.` },
    { title: 'Interactive Mock Interview Prep', desc: `Practice top 15 interview questions on ${skillName} in the Mock Interview Room.` }
  ];

  return (
    <div className="app-shell" style={{ background: 'var(--color-bg)', height: '100vh', overflow: 'hidden' }}>
      <Sidebar />
      <main className="app-main" style={{ marginLeft: 'var(--sidebar-width)', padding: 0, height: '100vh', display: 'flex', flexDirection: 'column' }}>
        
        {/* Header Control Panel */}
        <header style={{ height: '72px', background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2.5rem', zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            {mode === 'workspace' && (
              <button onClick={() => setMode('landing')} className="btn-ghost" style={{ padding: '0.5rem', display: 'flex', alignItems: 'center' }}>
                <ArrowLeft size={18} />
              </button>
            )}
            <div style={{ width: '40px', height: '40px', background: 'var(--gradient-primary)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
              <FileText size={20} />
            </div>
            <div>
              <span style={{ color: 'var(--color-text)', fontSize: '1.25rem', fontWeight: 900 }}>AI Automator Resume Builder</span>
            </div>
          </div>

          {mode === 'workspace' && (
            <button onClick={handleExportPdf} className="btn-primary" style={{ padding: '0.65rem 1.35rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Download size={16} /> Export ATS Resume
            </button>
          )}
        </header>

        {/* Dynamic Display Area */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          
          <AnimatePresence mode="wait">
            
            {/* Landing Dashboard Screen */}
            {mode === 'landing' && (
              <motion.div 
                key="landing"
                initial={{ opacity: 0, y: 15 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -15 }}
                style={{ height: '100%', overflowY: 'auto', padding: '3.5rem' }}
              >
                <div style={{ maxWidth: '1020px', margin: '0 auto' }}>
                  
                  {/* Hero Intro */}
                  <div style={{ marginBottom: '3rem' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'var(--color-primary-glow)', padding: '0.45rem 1rem', borderRadius: '99px', marginBottom: '1rem' }}>
                      <Sparkles size={14} color="var(--color-primary)" />
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-primary)' }}>1-Click AI Generation</span>
                    </div>
                    <h2 style={{ fontSize: '2.25rem', fontWeight: 950, color: 'var(--color-text)', margin: 0 }}>
                      Choose Your Target Job Role
                    </h2>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '1.05rem', marginTop: '0.4rem' }}>
                      Our AI will automatically compile, rewrite, and format your Master Profile into a role-specific ATS resume instantly.
                    </p>
                  </div>

                  {/* Role Option Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '4rem' }}>
                    {JOB_ROLES.map(role => (
                      <div 
                        key={role.id}
                        onClick={() => handleLaunchWorkspace(role)}
                        className="glass-card"
                        style={{ padding: '2rem', border: '1px solid var(--color-border)', cursor: 'pointer', transition: 'all 0.25s', display: 'flex', flexDirection: 'column', gap: '1rem' }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-primary)'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
                      >
                        <div style={{ width: '48px', height: '48px', background: 'var(--color-primary-glow)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>
                          <Brain size={22} />
                        </div>
                        <div>
                          <h4 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-text)' }}>{role.name}</h4>
                          <p style={{ margin: '0.4rem 0 0', fontSize: '0.85rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
                            ATS Keywords: {role.keywords.slice(0, 4).join(', ')}...
                          </p>
                        </div>
                        <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                          Build Automated Resume <ChevronRight size={14} />
                        </div>
                      </div>
                    ))}
                  </div>

                </div>
              </motion.div>
            )}

            {/* Premium Workspace Layout */}
            {mode === 'workspace' && (
              <motion.div 
                key="workspace"
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                style={{ height: '100%', display: 'flex' }}
              >
                {/* Left Sidebar: AI Analysis & Roadmap */}
                <div style={{ width: '380px', borderRight: '1px solid var(--color-border)', background: 'var(--color-surface)', display: 'flex', flexDirection: 'column' }}>
                  
                  {/* Target Role & Template Customizer */}
                  <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border-subtle)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--color-primary)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Active Targeting Role</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 850, color: 'var(--color-text)', marginBottom: '1rem' }}>{selectedRole.name}</div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                      <select 
                        value={selectedTemplate} 
                        onChange={e => setSelectedTemplate(e.target.value)}
                        style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)', padding: '0.5rem', borderRadius: '8px', fontSize: '0.8rem', outline: 'none' }}
                      >
                        {TEMPLATES.map(t => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                      
                      <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', justifyContent: 'center' }}>
                        {['#3b82f6', '#10b981', '#f59e0b', '#ec4899'].map(c => (
                          <button 
                            key={c} 
                            onClick={() => setAccentColor(c)}
                            style={{ width: '18px', height: '18px', borderRadius: '50%', background: c, border: `2px solid ${accentColor === c ? 'var(--color-text)' : 'transparent'}`, cursor: 'pointer' }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* AI Skill Gap & Roadmap Panel */}
                  <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem', scrollbarWidth: 'thin' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                        <span style={{ fontSize: '0.82rem', fontWeight: 900, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Missing Target Skills</span>
                        <span style={{ fontSize: '0.78rem', background: 'rgba(239,68,68,0.1)', color: 'var(--color-danger)', padding: '0.15rem 0.45rem', borderRadius: '99px', fontWeight: 800 }}>{missingSkills.length} Skills</span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {missingSkills.map(sk => (
                          <div 
                            key={sk} 
                            className="glass-card" 
                            style={{ padding: '1.15rem', border: '1px solid var(--color-border)', background: 'var(--color-surface-2)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--color-text)' }}>{sk}</span>
                              <button 
                                onClick={() => setExpandedSkillRoadmap(expandedSkillRoadmap === sk ? null : sk)}
                                className="btn-primary" 
                                style={{ padding: '0.35rem 0.75rem', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                              >
                                <Brain size={12} /> {expandedSkillRoadmap === sk ? 'Hide' : 'Learn Now'}
                              </button>
                            </div>

                            <AnimatePresence>
                              {expandedSkillRoadmap === sk && (
                                <motion.div 
                                  initial={{ height: 0, opacity: 0 }} 
                                  animate={{ height: 'auto', opacity: 1 }} 
                                  exit={{ height: 0, opacity: 0 }}
                                  style={{ overflow: 'hidden', borderTop: '1px solid var(--color-border-subtle)', paddingTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}
                                >
                                  {getSkillSteps(sk).map((step, idx) => (
                                    <div key={idx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                                      <div style={{ width: '16px', height: '16px', background: 'var(--color-primary-glow)', borderRadius: '50%', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 900, marginTop: '2px', flexShrink: 0 }}>
                                        {idx + 1}
                                      </div>
                                      <div>
                                        <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-text)' }}>{step.title}</div>
                                        <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', marginTop: '0.1rem', lineHeight: 1.3 }}>{step.desc}</div>
                                      </div>
                                    </div>
                                  ))}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                </div>

                {/* Right Panel Workspace Previewer */}
                <div style={{ flex: 1, background: 'var(--color-bg-secondary)', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                  
                  {/* Zoom controller bar */}
                  <div style={{ padding: '0.85rem 2rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-surface)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-text-muted)' }}>PREVIEW ENGINE (AUTO-SYNCED)</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--color-surface-2)', padding: '4px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                      <button onClick={() => setZoom(Math.max(0.4, zoom - 0.05))} style={{ border: 'none', background: 'none', color: 'var(--color-text)', cursor: 'pointer' }}><Minus size={13} /></button>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, minWidth: '35px', textAlign: 'center' }}>{Math.round(zoom * 100)}%</span>
                      <button onClick={() => setZoom(Math.min(1, zoom + 0.05))} style={{ border: 'none', background: 'none', color: 'var(--color-text)', cursor: 'pointer' }}><Plus size={13} /></button>
                    </div>
                  </div>

                  {/* Render template document */}
                  <div style={{ flex: 1, overflow: 'auto', display: 'flex', justifyContent: 'center', padding: '40px', background: 'var(--color-bg)' }}>
                    <div style={{ width: 794 * zoom, height: 1123 * zoom, flexShrink: 0, position: 'relative' }}>
                      <div style={{ background: 'white', boxShadow: '0 30px 60px -15px rgba(0,0,0,0.55)', overflow: 'hidden', transform: `scale(${zoom})`, transformOrigin: 'top left', width: '794px', height: '1123px', position: 'absolute', top: 0, left: 0 }}>
                        <div ref={printRef} style={{ pointerEvents: 'none', width: '100%', height: '100%' }}>
                          <CurrentTemplate data={{ personalInfo: info, skills, experiences, education, projects, certifications, templateId: selectedTemplate, customStyles: { primaryColor: accentColor, fontFamily: "'Inter', sans-serif" } }} />
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
    </div>
  );
}
