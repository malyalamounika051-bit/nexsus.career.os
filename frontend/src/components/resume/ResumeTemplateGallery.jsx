import React from 'react';
import { 
  Palette, Type, Sliders, Eye, EyeOff, Layout, FileText, 
  Layers, Sparkles, Settings, CheckCircle2 
} from 'lucide-react';

const ACCENT_COLORS = [
  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#ec4899',
  '#ef4444', '#f59e0b', '#10b981', '#06b6d4', '#0f766e',
  '#475569', '#0f172a', '#b45309', '#a27b5c', '#111111'
];

const FONT_OPTIONS = [
  { id: 'inter', name: 'Inter (Sans)', family: "'Inter', sans-serif" },
  { id: 'roboto', name: 'Roboto (Modern)', family: "'Roboto', sans-serif" },
  { id: 'georgia', name: 'Georgia (Serif)', family: "'Georgia', serif" },
  { id: 'outfit', name: 'Outfit (Sleek)', family: "'Outfit', sans-serif" },
  { id: 'montserrat', name: 'Montserrat (Creative)', family: "'Montserrat', sans-serif" },
  { id: 'poppins', name: 'Poppins (Geometric)', family: "'Poppins', sans-serif" },
];

export default function ResumeTemplateGallery({
  templateId,
  setTemplateId,
  accentColor,
  setAccentColor,
  selectedFont,
  setSelectedFont,
  sectionOrder,
  setSectionOrder,
  TEMPLATES,
  info,
  skills,
  experiences,
  education,
  projects,
  achievements,
  certifications,
  languages
}) {
  const effectiveAccent = accentColor || TEMPLATES.find(t => t.id === templateId)?.color || '#3b82f6';

  // Toggle visibility helper
  const handleToggleSection = (sectionId) => {
    if (sectionOrder.includes(sectionId)) {
      setSectionOrder(sectionOrder.filter(id => id !== sectionId));
    } else {
      setSectionOrder([...sectionOrder, sectionId]);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Accent Colors */}
      <div className="glass-card" style={{ padding: '1.5rem', border: '1px solid var(--color-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <div style={{ width: '28px', height: '28px', background: 'var(--color-primary-glow)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Palette size={14} color="var(--color-primary)" />
          </div>
          <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--color-text)' }}>Accent Color</span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
          {ACCENT_COLORS.map(c => (
            <button 
              key={c} 
              onClick={() => setAccentColor(c)}
              style={{
                width: '32px', height: '32px', borderRadius: '50%', border: effectiveAccent === c ? '3px solid var(--color-text)' : '2px solid transparent',
                background: c, cursor: 'pointer', transition: 'all 0.2s',
                boxShadow: effectiveAccent === c ? `0 0 0 2px var(--color-bg), 0 0 0 4px ${c}` : 'none'
              }}
            />
          ))}
        </div>
      </div>

      {/* Typography Fonts */}
      <div className="glass-card" style={{ padding: '1.5rem', border: '1px solid var(--color-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <div style={{ width: '28px', height: '28px', background: 'var(--color-primary-glow)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Type size={14} color="var(--color-primary)" />
          </div>
          <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--color-text)' }}>Typography Font</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
          {FONT_OPTIONS.map(f => {
            const isSelected = selectedFont === f.family;
            return (
              <button 
                key={f.id} 
                onClick={() => setSelectedFont(f.family)}
                style={{
                  padding: '0.65rem 0.85rem', borderRadius: '10px', fontSize: '0.82rem', fontWeight: 700,
                  fontFamily: f.family, cursor: 'pointer', transition: 'all 0.2s',
                  background: isSelected ? 'var(--color-primary-glow)' : 'var(--color-surface-2)',
                  border: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                  color: isSelected ? 'var(--color-primary)' : 'var(--color-text)'
                }}
              >
                {f.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Section Visibility Toggles */}
      <div className="glass-card" style={{ padding: '1.5rem', border: '1px solid var(--color-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <div style={{ width: '28px', height: '28px', background: 'var(--color-primary-glow)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sliders size={14} color="var(--color-primary)" />
          </div>
          <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--color-text)' }}>Section Visibility</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {[
            { id: 'experience', label: 'Work Experience' },
            { id: 'education', label: 'Education' },
            { id: 'projects', label: 'Projects' },
            { id: 'certifications', label: 'Certifications' },
            { id: 'languages', label: 'Languages' },
            { id: 'volunteering', label: 'Volunteering' },
            { id: 'researchPapers', label: 'Research Papers' },
            { id: 'references', label: 'References' }
          ].map(sect => {
            const isVisible = sectionOrder.includes(sect.id);
            return (
              <button 
                key={sect.id}
                onClick={() => handleToggleSection(sect.id)}
                style={{
                  width: '100%', padding: '0.6rem 0.85rem', borderRadius: '10px', border: '1px solid var(--color-border)',
                  background: 'var(--color-surface-2)', color: isVisible ? 'var(--color-text)' : 'var(--color-text-muted)',
                  cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  fontSize: '0.82rem', fontWeight: 700
                }}
              >
                <span>{sect.label}</span>
                {isVisible ? <Eye size={14} color="var(--color-primary)" /> : <EyeOff size={14} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Templates List */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {TEMPLATES.map(t => (
          <div 
            key={t.id} 
            onClick={() => setTemplateId(t.id)}
            style={{ 
              cursor: 'pointer', borderRadius: '20px', overflow: 'hidden', border: `2px solid ${templateId === t.id ? effectiveAccent : 'var(--color-border)'}`,
              transition: 'all 0.3s', background: 'var(--color-surface)'
            }}
          >
            <div style={{ height: '240px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: 'scale(0.35)', transformOrigin: 'center' }}>
               <t.component data={{ personalInfo: info, skills, experiences, education, projects, achievements, certifications, languages }} />
            </div>
            <div style={{ padding: '1.25rem', borderTop: '1px solid var(--color-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                 <span style={{ fontWeight: 800, color: 'var(--color-text)' }}>{t.name}</span>
                 {templateId === t.id && <CheckCircle2 size={18} color={effectiveAccent} />}
              </div>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: 'var(--color-text-muted)', lineHeight: 1.4 }}>{t.desc}</p>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
