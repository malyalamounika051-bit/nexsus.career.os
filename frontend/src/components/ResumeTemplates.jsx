import React from 'react';

const SectionTitle = ({ title, color, style }) => (
  <div style={{
    fontSize: '18px', fontWeight: 800, letterSpacing: '0.1em',
    color: color || '#1d4ed8', textTransform: 'uppercase',
    borderBottom: `1.5px solid ${color ? color + '40' : '#dbeafe'}`,
    paddingBottom: '4px', marginBottom: '10px',
    ...style
  }}>
    {title}
  </div>
);

// Helper to dynamically render sections based on order
const SectionRenderer = ({ id, data, primaryColor }) => {
  const { experiences, internships, projects, skills, education, achievements, customSections, certifications, languages, socialLinks } = data;
  
  switch(id) {
    case 'experience':
      if (!experiences?.length || (experiences.length === 1 && !experiences[0].title)) return null;
      return (
        <section style={{ marginBottom: '20px' }}>
          <SectionTitle title="Experience" color={primaryColor} />
          {experiences.map((exp, i) => (
            <div key={i} style={{ marginBottom: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '21px' }}>
                <span>{exp.title}</span>
                <span style={{ color: '#64748b', fontSize: '18px' }}>{exp.period}</span>
              </div>
              <div style={{ color: primaryColor, fontSize: '20px', fontWeight: 600, marginBottom: '4px' }}>{exp.company}</div>
              <p style={{ fontSize: '19px', color: '#4b5563', margin: 0, whiteSpace: 'pre-wrap' }}>{exp.desc}</p>
            </div>
          ))}
        </section>
      );
    case 'internships':
      if (!internships?.length) return null;
      return (
        <section style={{ marginBottom: '20px' }}>
          <SectionTitle title="Internships" color={primaryColor} />
          {internships.map((int, i) => (
            <div key={i} style={{ marginBottom: '12px' }}>
              <div style={{ fontWeight: 700, fontSize: '20px' }}>{int.title} @ {int.company}</div>
              <div style={{ color: '#64748b', fontSize: '18px' }}>{int.period}</div>
              <p style={{ fontSize: '18px', color: '#4b5563', margin: '4px 0 0', whiteSpace: 'pre-wrap' }}>{int.desc}</p>
            </div>
          ))}
        </section>
      );
    case 'projects':
      if (!projects?.length) return null;
      return (
        <section style={{ marginBottom: '20px' }}>
          <SectionTitle title="Projects" color={primaryColor} />
          {projects.map((proj, i) => (
            <div key={i} style={{ marginBottom: '12px' }}>
              <div style={{ fontWeight: 700, fontSize: '20px' }}>{proj.name}</div>
              <div style={{ color: primaryColor, fontSize: '18px' }}>{proj.tech}</div>
              <p style={{ fontSize: '18px', color: '#4b5563', margin: '2px 0 0', whiteSpace: 'pre-wrap' }}>{proj.desc}</p>
            </div>
          ))}
        </section>
      );
    case 'skills':
      if (!skills?.length) return null;
      return (
        <section style={{ marginBottom: '20px' }}>
          <SectionTitle title="Skills" color={primaryColor} />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {skills.map((s, i) => (
              <span key={i} style={{
                background: primaryColor + '15', color: primaryColor,
                padding: '2px 8px', borderRadius: '4px', fontSize: '16px', fontWeight: 600,
                border: `1px solid ${primaryColor}30`
              }}>{s}</span>
            ))}
          </div>
        </section>
      );
    case 'education':
      if (!education?.length || (education.length === 1 && !education[0].degree)) return null;
      return (
        <section style={{ marginBottom: '20px' }}>
          <SectionTitle title="Education" color={primaryColor} />
          {education.map((edu, i) => (
            <div key={i} style={{ marginBottom: '10px' }}>
              <div style={{ fontWeight: 700, fontSize: '20px' }}>{edu.degree}</div>
              <div style={{ color: '#64748b', fontSize: '18px' }}>{edu.institution} | {edu.year}</div>
            </div>
          ))}
        </section>
      );
    case 'achievements':
      if (!achievements?.length) return null;
      return (
        <section style={{ marginBottom: '20px' }}>
          <SectionTitle title="Achievements" color={primaryColor} />
          <ul style={{ paddingLeft: '15px', margin: 0 }}>
            {achievements.map((ach, i) => (
              ach && <li key={i} style={{ fontSize: '18px', color: '#4b5563', marginBottom: '5px' }}>{ach}</li>
            ))}
          </ul>
        </section>
      );
    case 'certifications':
      if (!certifications?.length) return null;
      return (
        <section style={{ marginBottom: '20px' }}>
          <SectionTitle title="Certifications" color={primaryColor} />
          <ul style={{ paddingLeft: '15px', margin: 0 }}>
            {certifications.map((cert, i) => (
              cert && <li key={i} style={{ fontSize: '18px', color: '#4b5563', marginBottom: '5px' }}>{cert}</li>
            ))}
          </ul>
        </section>
      );
    case 'languages':
      if (!languages?.length) return null;
      return (
        <section style={{ marginBottom: '20px' }}>
          <SectionTitle title="Languages" color={primaryColor} />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '18px', color: '#4b5563' }}>
            {languages.map((lang, i) => lang && <span key={i}>• {lang}</span>)}
          </div>
        </section>
      );
    default:
      return null;
  }
};

// ─── 1. MODERN TEMPLATE ───────────────────────────────────────────────────
export const ModernTemplate = ({ data }) => {
  const { personalInfo: info = {}, sectionOrder = [] } = data || {};
  const primaryColor = data?.customStyles?.primaryColor || '#3b82f6';
  
  const defaultLeft = ['experience', 'internships', 'projects'];
  const defaultRight = ['skills', 'education', 'achievements', 'certifications', 'languages'];
  
  const leftOrder = sectionOrder.length ? sectionOrder.filter(id => defaultLeft.includes(id)) : defaultLeft;
  const rightOrder = sectionOrder.length ? sectionOrder.filter(id => defaultRight.includes(id)) : defaultRight;

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", color: '#1a1a2e', padding: '10px' }}>
      <header style={{ borderBottom: `3px solid ${primaryColor}`, paddingBottom: '16px', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '45px', fontWeight: 800, margin: 0, color: '#0f172a' }}>{info.name || 'Your Name'}</h1>
        <div style={{ fontSize: '25px', color: primaryColor, fontWeight: 600, marginTop: '4px' }}>{info.title}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', marginTop: '10px', fontSize: '18px', color: '#64748b' }}>
          {info.email && <span>✉ {info.email}</span>}
          {info.phone && <span>✆ {info.phone}</span>}
          {info.location && <span>⌖ {info.location}</span>}
          {info.linkedin && <span>in {info.linkedin}</span>}
        </div>
      </header>

      {info.summary && (
        <section style={{ marginBottom: '20px' }}>
          <SectionTitle title="Summary" color={primaryColor} />
          <p style={{ fontSize: '20px', lineHeight: 1.6, color: '#374151' }}>{info.summary}</p>
        </section>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '25px' }}>
        <div>
          {leftOrder.map(id => <SectionRenderer key={id} id={id} data={data} primaryColor={primaryColor} />)}
        </div>
        <div>
          {rightOrder.map(id => <SectionRenderer key={id} id={id} data={data} primaryColor={primaryColor} />)}
        </div>
      </div>
    </div>
  );
};

// ─── 2. PROFESSIONAL TEMPLATE ──────────────────────────────────────────────
export const ProfessionalTemplate = ({ data }) => {
  const { personalInfo: info = {}, sectionOrder = [] } = data || {};
  
  const defaultOrder = ['experience', 'education', 'skills', 'projects', 'achievements', 'certifications', 'languages'];
  const order = sectionOrder.length ? sectionOrder.filter(id => defaultOrder.includes(id)) : defaultOrder;

  return (
    <div style={{ fontFamily: "'Georgia', serif", color: '#000', padding: '20px' }}>
      <header style={{ textAlign: 'center', marginBottom: '30px', borderBottom: '2px solid #000', paddingBottom: '15px' }}>
        <h1 style={{ fontSize: '43px', textTransform: 'uppercase', letterSpacing: '3px', marginBottom: '8px' }}>{info.name}</h1>
        <div style={{ fontSize: '21px', fontStyle: 'italic', marginBottom: '10px' }}>
          {info.location} • {info.phone} • {info.email}
        </div>
        <div style={{ fontSize: '23px', fontWeight: 'bold', color: '#333' }}>{info.title}</div>
      </header>
      
      {info.summary && (
        <section style={{ marginBottom: '20px' }}>
          <p style={{ fontSize: '20px', lineHeight: 1.6, textAlign: 'justify' }}>{info.summary}</p>
        </section>
      )}

      {order.map(id => (
         <div key={id} style={{ marginBottom: '10px' }}>
           <SectionRenderer id={id} data={data} primaryColor="#000" />
         </div>
      ))}
    </div>
  );
};

// ─── 3. CREATIVE TEMPLATE ─────────────────────────────────────────────────
export const CreativeTemplate = ({ data }) => {
  const { personalInfo: info = {}, skills = [], achievements = [], sectionOrder = [] } = data || {};
  const accentColor = data?.customStyles?.primaryColor || '#ec4899';
  
  const defaultMain = ['experience', 'education', 'projects', 'internships'];
  const mainOrder = sectionOrder.length ? sectionOrder.filter(id => defaultMain.includes(id)) : defaultMain;

  return (
    <div style={{ fontFamily: "'Montserrat', sans-serif", display: 'grid', gridTemplateColumns: '260px 1fr', minHeight: '1123px', color: '#1f2937' }}>
      {/* Sidebar */}
      <div style={{ background: '#111827', color: 'white', padding: '40px 25px' }}>
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{ fontSize: '39px', fontWeight: 900, lineHeight: 1.1, marginBottom: '8px' }}>{info.name}</h1>
          <div style={{ fontSize: '21px', color: accentColor, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>{info.title}</div>
        </div>

        <div style={{ marginBottom: '35px' }}>
          <h3 style={{ fontSize: '21px', borderBottom: `2px solid ${accentColor}`, paddingBottom: '6px', marginBottom: '15px', letterSpacing: '1px' }}>CONTACT</h3>
          <div style={{ fontSize: '18px', display: 'flex', flexDirection: 'column', gap: '10px', color: '#9ca3af' }}>
            {info.email && <div><span style={{ color: accentColor }}>✉</span> {info.email}</div>}
            {info.phone && <div><span style={{ color: accentColor }}>✆</span> {info.phone}</div>}
            {info.location && <div><span style={{ color: accentColor }}>⌖</span> {info.location}</div>}
          </div>
        </div>

        {skills?.length > 0 && (
          <div style={{ marginBottom: '35px' }}>
            <h3 style={{ fontSize: '21px', borderBottom: `2px solid ${accentColor}`, paddingBottom: '6px', marginBottom: '15px', letterSpacing: '1px' }}>SKILLS</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {skills.map((s, i) => (
                <span key={i} style={{ background: '#374151', padding: '4px 10px', borderRadius: '4px', fontSize: '16px' }}>{s}</span>
              ))}
            </div>
          </div>
        )}

        {achievements?.length > 0 && (
          <div>
            <h3 style={{ fontSize: '21px', borderBottom: `2px solid ${accentColor}`, paddingBottom: '6px', marginBottom: '15px', letterSpacing: '1px' }}>AWARD</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {achievements.map((ach, i) => (
                ach && <div key={i} style={{ fontSize: '18px', color: '#d1d5db', lineHeight: 1.4 }}>🏆 {ach}</div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div style={{ padding: '40px', background: 'white' }}>
        {info.summary && (
          <section style={{ marginBottom: '30px' }}>
            <p style={{ fontSize: '21px', lineHeight: 1.7, color: '#4b5563', fontStyle: 'italic', borderLeft: `4px solid ${accentColor}`, paddingLeft: '15px' }}>{info.summary}</p>
          </section>
        )}

        {mainOrder.map(id => <div key={id} style={{marginBottom: '20px'}}><SectionRenderer id={id} data={data} primaryColor={accentColor} /></div>)}
      </div>
    </div>
  );
};

// ─── 4. MINIMALIST TEMPLATE ───────────────────────────────────────────────
export const MinimalistTemplate = ({ data }) => {
  const { personalInfo: info = {}, sectionOrder = [] } = data || {};
  
  const defaultOrder = ['experience', 'skills', 'education', 'projects', 'achievements', 'certifications'];
  const order = sectionOrder.length ? sectionOrder.filter(id => defaultOrder.includes(id)) : defaultOrder;

  return (
    <div style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#111', padding: '40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
        <div>
          <h1 style={{ fontSize: '61px', fontWeight: 700, letterSpacing: '-2px', margin: 0, lineHeight: 1 }}>{info.name}</h1>
          <div style={{ fontSize: '29px', color: '#666', marginTop: '5px' }}>{info.title}</div>
        </div>
        <div style={{ textAlign: 'right', fontSize: '20px', lineHeight: 1.8, color: '#444' }}>
          <div>{info.email}</div>
          <div>{info.phone}</div>
          <div>{info.location}</div>
        </div>
      </div>
      
      {info.summary && (
        <section style={{ marginBottom: '40px' }}>
          <p style={{ fontSize: '21px', lineHeight: 1.6 }}>{info.summary}</p>
        </section>
      )}

      {order.map(id => <div key={id} style={{ marginBottom: '20px' }}><SectionRenderer id={id} data={data} primaryColor="#111" /></div>)}
    </div>
  );
};
