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

const ProjectTitleLink = ({ name, link, github, color, fontSize = '20px' }) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
      <span style={{ fontWeight: 700, fontSize }}>{name}</span>
      {link && (
        <a 
          href={link} 
          target="_blank" 
          rel="noopener noreferrer" 
          style={{ display: 'inline-flex', alignItems: 'center', color: color || '#1d4ed8', textDecoration: 'none' }} 
          title="Live Demo"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle' }}>
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
            <polyline points="15 3 21 3 21 9"></polyline>
            <line x1="10" y1="14" x2="21" y2="3"></line>
          </svg>
        </a>
      )}
      {github && (
        <a 
          href={github} 
          target="_blank" 
          rel="noopener noreferrer" 
          style={{ display: 'inline-flex', alignItems: 'center', color: '#64748b', textDecoration: 'none' }} 
          title="GitHub Repository"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle' }}>
            <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
          </svg>
        </a>
      )}
    </div>
  );
};

// Helper to dynamically render sections based on order
const SectionRenderer = ({ id, data, primaryColor }) => {
  const { 
    experiences, internships, projects, skills, education, achievements, 
    customSections, certifications, languages, socialLinks,
    technicalSkills, softSkills, researchPapers, workshops, volunteering, interests, references
  } = data;
  
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
              <ProjectTitleLink name={proj.name} link={proj.link} github={proj.github} color={primaryColor} fontSize="20px" />
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
    case 'technicalSkills':
      if (!technicalSkills?.length) return null;
      return (
        <section style={{ marginBottom: '20px' }}>
          <SectionTitle title="Technical Skills" color={primaryColor} />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {technicalSkills.map((s, i) => (
              <span key={i} style={{
                background: primaryColor + '15', color: primaryColor,
                padding: '2px 8px', borderRadius: '4px', fontSize: '16px', fontWeight: 600,
                border: `1px solid ${primaryColor}30`
              }}>{s}</span>
            ))}
          </div>
        </section>
      );
    case 'softSkills':
      if (!softSkills?.length) return null;
      return (
        <section style={{ marginBottom: '20px' }}>
          <SectionTitle title="Soft Skills" color={primaryColor} />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {softSkills.map((s, i) => (
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
    case 'researchPapers':
      if (!researchPapers?.length) return null;
      return (
        <section style={{ marginBottom: '20px' }}>
          <SectionTitle title="Research Papers" color={primaryColor} />
          {researchPapers.map((paper, i) => (
            <div key={i} style={{ marginBottom: '12px' }}>
              <div style={{ fontWeight: 700, fontSize: '20px' }}>{paper.title}</div>
              <div style={{ color: '#64748b', fontSize: '18px' }}>{paper.publisher} | {paper.year}</div>
              {paper.desc && <p style={{ fontSize: '18px', color: '#4b5563', margin: '4px 0 0' }}>{paper.desc}</p>}
            </div>
          ))}
        </section>
      );
    case 'workshops':
      if (!workshops?.length) return null;
      return (
        <section style={{ marginBottom: '20px' }}>
          <SectionTitle title="Workshops & Seminars" color={primaryColor} />
          {workshops.map((w, i) => (
            <div key={i} style={{ marginBottom: '12px' }}>
              <div style={{ fontWeight: 700, fontSize: '20px' }}>{w.name}</div>
              <div style={{ color: '#64748b', fontSize: '18px' }}>Organized by {w.organizer} | {w.year}</div>
              {w.desc && <p style={{ fontSize: '18px', color: '#4b5563', margin: '4px 0 0' }}>{w.desc}</p>}
            </div>
          ))}
        </section>
      );
    case 'volunteering':
      if (!volunteering?.length) return null;
      return (
        <section style={{ marginBottom: '20px' }}>
          <SectionTitle title="Volunteering" color={primaryColor} />
          {volunteering.map((v, i) => (
            <div key={i} style={{ marginBottom: '12px' }}>
              <div style={{ fontWeight: 700, fontSize: '20px' }}>{v.role} @ {v.organization}</div>
              <div style={{ color: '#64748b', fontSize: '18px' }}>{v.period}</div>
              {v.desc && <p style={{ fontSize: '18px', color: '#4b5563', margin: '4px 0 0' }}>{v.desc}</p>}
            </div>
          ))}
        </section>
      );
    case 'interests':
      if (!interests?.length) return null;
      return (
        <section style={{ marginBottom: '20px' }}>
          <SectionTitle title="Interests" color={primaryColor} />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '18px', color: '#4b5563' }}>
            {interests.map((interest, i) => interest && <span key={i}>• {interest}</span>)}
          </div>
        </section>
      );
    case 'references':
      if (!references?.length) return null;
      return (
        <section style={{ marginBottom: '20px' }}>
          <SectionTitle title="References" color={primaryColor} />
          {references.map((ref, i) => (
            <div key={i} style={{ marginBottom: '10px' }}>
              <div style={{ fontWeight: 700, fontSize: '19px' }}>{ref.name}</div>
              <div style={{ fontSize: '17px', color: '#4b5563' }}>{ref.company} | {ref.relation}</div>
              {ref.contact && <div style={{ fontSize: '17px', color: '#64748b' }}>Contact: {ref.contact}</div>}
            </div>
          ))}
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
          {info.github && <span>🔗 GitHub: {info.github}</span>}
          {info.portfolio && <span>💼 Portfolio: {info.portfolio}</span>}
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
      <div style={{ background: '#111827', color: '#ffffff', padding: '40px 25px' }}>
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{ fontSize: '39px', fontWeight: 900, lineHeight: 1.1, marginBottom: '8px', color: '#ffffff' }}>{info.name}</h1>
          <div style={{ fontSize: '21px', color: accentColor, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>{info.title}</div>
        </div>

        <div style={{ marginBottom: '35px' }}>
          <h3 style={{ fontSize: '21px', borderBottom: `2px solid ${accentColor}`, paddingBottom: '6px', marginBottom: '15px', letterSpacing: '1px', color: '#ffffff' }}>CONTACT</h3>
          <div style={{ fontSize: '18px', display: 'flex', flexDirection: 'column', gap: '10px', color: '#9ca3af' }}>
            {info.email && <div style={{ color: '#9ca3af' }}><span style={{ color: accentColor }}>✉</span> {info.email}</div>}
            {info.phone && <div style={{ color: '#9ca3af' }}><span style={{ color: accentColor }}>✆</span> {info.phone}</div>}
            {info.location && <div style={{ color: '#9ca3af' }}><span style={{ color: accentColor }}>⌖</span> {info.location}</div>}
          </div>
        </div>

        {skills?.length > 0 && (
          <div style={{ marginBottom: '35px' }}>
            <h3 style={{ fontSize: '21px', borderBottom: `2px solid ${accentColor}`, paddingBottom: '6px', marginBottom: '15px', letterSpacing: '1px', color: '#ffffff' }}>SKILLS</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {skills.map((s, i) => (
                <span key={i} style={{ background: '#374151', padding: '4px 10px', borderRadius: '4px', fontSize: '16px', color: '#ffffff' }}>{s}</span>
              ))}
            </div>
          </div>
        )}

        {achievements?.length > 0 && (
          <div>
            <h3 style={{ fontSize: '21px', borderBottom: `2px solid ${accentColor}`, paddingBottom: '6px', marginBottom: '15px', letterSpacing: '1px', color: '#ffffff' }}>AWARD</h3>
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

// ─── 5. GREY LINING TEMPLATE ───────────────────────────────────────────────
export const GreyLiningTemplate = ({ data }) => {
  const { personalInfo: info = {}, sectionOrder = [] } = data || {};
  const primaryColor = data?.customStyles?.primaryColor || '#475569';

  const defaultOrder = ['experience', 'education', 'skills', 'projects', 'achievements', 'certifications', 'languages'];
  const order = sectionOrder.length ? sectionOrder.filter(id => defaultOrder.includes(id)) : defaultOrder;

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", color: '#1e293b', padding: '30px 40px', lineHeight: 1.5 }}>
      <header style={{ marginBottom: '15px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 800, margin: '0 0 4px 0', color: '#0f172a', letterSpacing: '-0.03em' }}>{info.name || 'Your Name'}</h1>
        <div style={{ fontSize: '16px', color: primaryColor, fontWeight: 600, marginBottom: '10px' }}>{info.title}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', fontSize: '12px', color: '#64748b', alignItems: 'center' }}>
          {info.email && <span>{info.email}</span>}
          {info.email && (info.phone || info.location || info.linkedin) && <span>•</span>}
          {info.phone && <span>{info.phone}</span>}
          {info.phone && (info.location || info.linkedin) && <span>•</span>}
          {info.location && <span>{info.location}</span>}
          {info.location && info.linkedin && <span>•</span>}
          {info.linkedin && <span>{info.linkedin}</span>}
        </div>
      </header>

      <div style={{ height: '1px', background: '#e2e8f0', margin: '15px 0' }} />

      {info.summary && (
        <section style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <h2 style={{ fontSize: '13px', fontWeight: 800, color: '#334155', textTransform: 'uppercase', margin: 0, letterSpacing: '0.08em' }}>Summary</h2>
            <div style={{ flex: 1, height: '1px', background: '#cbd5e1' }} />
          </div>
          <p style={{ fontSize: '12px', color: '#334155', margin: 0, lineHeight: 1.6 }}>{info.summary}</p>
        </section>
      )}

      {order.map(id => {
        switch(id) {
          case 'skills':
            if (!data.skills?.length) return null;
            return (
              <section key={id} style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <h2 style={{ fontSize: '13px', fontWeight: 800, color: '#334155', textTransform: 'uppercase', margin: 0, letterSpacing: '0.08em' }}>Skills</h2>
                  <div style={{ flex: 1, height: '1px', background: '#cbd5e1' }} />
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {data.skills.map((s, i) => (
                    <span key={i} style={{
                      background: '#f1f5f9', color: '#334155',
                      padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600,
                      border: '1px solid #e2e8f0'
                    }}>{s}</span>
                  ))}
                </div>
              </section>
            );

          case 'experience':
            if (!data.experiences?.length || (data.experiences.length === 1 && !data.experiences[0].title)) return null;
            return (
              <section key={id} style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <h2 style={{ fontSize: '13px', fontWeight: 800, color: '#334155', textTransform: 'uppercase', margin: 0, letterSpacing: '0.08em' }}>Work Experience</h2>
                  <div style={{ flex: 1, height: '1px', background: '#cbd5e1' }} />
                </div>
                {data.experiences.map((exp, i) => (
                  <div key={i} style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '13px', color: '#0f172a' }}>
                      <span>{exp.title}</span>
                      <span style={{ color: '#64748b', fontSize: '12px', fontWeight: 500 }}>{exp.period}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: primaryColor, fontWeight: 600, marginBottom: '4px' }}>
                      <span>{exp.company}</span>
                      {exp.location && <span style={{ color: '#64748b', fontWeight: 400 }}>{exp.location}</span>}
                    </div>
                    <p style={{ fontSize: '12px', color: '#334155', margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{exp.desc}</p>
                  </div>
                ))}
              </section>
            );

          case 'education':
            if (!data.education?.length || (data.education.length === 1 && !data.education[0].degree)) return null;
            return (
              <section key={id} style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <h2 style={{ fontSize: '13px', fontWeight: 800, color: '#334155', textTransform: 'uppercase', margin: 0, letterSpacing: '0.08em' }}>Education</h2>
                  <div style={{ flex: 1, height: '1px', background: '#cbd5e1' }} />
                </div>
                {data.education.map((edu, i) => (
                  <div key={i} style={{ marginBottom: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '13px', color: '#0f172a' }}>
                      <span>{edu.degree}</span>
                      <span style={{ color: '#64748b', fontSize: '12px', fontWeight: 500 }}>{edu.year}</span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#475569', fontWeight: 500 }}>{edu.institution}</div>
                  </div>
                ))}
              </section>
            );

          case 'projects':
            if (!data.projects?.length) return null;
            return (
              <section key={id} style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <h2 style={{ fontSize: '13px', fontWeight: 800, color: '#334155', textTransform: 'uppercase', margin: 0, letterSpacing: '0.08em' }}>Projects</h2>
                  <div style={{ flex: 1, height: '1px', background: '#cbd5e1' }} />
                </div>
                {data.projects.map((proj, i) => (
                  <div key={i} style={{ marginBottom: '10px' }}>
                    <ProjectTitleLink name={proj.name} link={proj.link} github={proj.github} color={primaryColor} fontSize="13px" />
                    <div style={{ color: primaryColor, fontSize: '11px', fontWeight: 600, marginBottom: '2px' }}>{proj.tech}</div>
                    <p style={{ fontSize: '12px', color: '#334155', margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{proj.desc}</p>
                  </div>
                ))}
              </section>
            );

          case 'achievements':
            if (!data.achievements?.length) return null;
            return (
              <section key={id} style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <h2 style={{ fontSize: '13px', fontWeight: 800, color: '#334155', textTransform: 'uppercase', margin: 0, letterSpacing: '0.08em' }}>Achievements</h2>
                  <div style={{ flex: 1, height: '1px', background: '#cbd5e1' }} />
                </div>
                <ul style={{ paddingLeft: '18px', margin: 0 }}>
                  {data.achievements.map((ach, i) => (
                    ach && <li key={i} style={{ fontSize: '12px', color: '#334155', marginBottom: '4px' }}>{ach}</li>
                  ))}
                </ul>
              </section>
            );

          case 'certifications':
            if (!data.certifications?.length) return null;
            return (
              <section key={id} style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <h2 style={{ fontSize: '13px', fontWeight: 800, color: '#334155', textTransform: 'uppercase', margin: 0, letterSpacing: '0.08em' }}>Certifications</h2>
                  <div style={{ flex: 1, height: '1px', background: '#cbd5e1' }} />
                </div>
                <ul style={{ paddingLeft: '18px', margin: 0 }}>
                  {data.certifications.map((cert, i) => (
                    cert && <li key={i} style={{ fontSize: '12px', color: '#334155', marginBottom: '4px' }}>{cert}</li>
                  ))}
                </ul>
              </section>
            );

          case 'languages':
            if (!data.languages?.length) return null;
            return (
              <section key={id} style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <h2 style={{ fontSize: '13px', fontWeight: 800, color: '#334155', textTransform: 'uppercase', margin: 0, letterSpacing: '0.08em' }}>Languages</h2>
                  <div style={{ flex: 1, height: '1px', background: '#cbd5e1' }} />
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', fontSize: '12px', color: '#334155' }}>
                  {data.languages.map((lang, i) => lang && <span key={i}>• {lang}</span>)}
                </div>
              </section>
            );
          
          default:
            return null;
        }
      })}
    </div>
  );
};

// ─── 6. SAHARA CONTRAST TEMPLATE ───────────────────────────────────────────
export const SaharaContrastTemplate = ({ data }) => {
  const { personalInfo: info = {}, sectionOrder = [] } = data || {};
  const primaryColor = data?.customStyles?.primaryColor || '#b45309';

  const defaultOrder = ['experience', 'education', 'skills', 'projects', 'achievements', 'certifications', 'languages'];
  const order = sectionOrder.length ? sectionOrder.filter(id => defaultOrder.includes(id)) : defaultOrder;

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", color: '#27272a', padding: '35px', lineHeight: 1.5, background: '#fdfbf7', minHeight: '100%' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: `2px solid ${primaryColor}`, paddingBottom: '15px', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '30px', fontWeight: 800, margin: 0, color: '#18181b', letterSpacing: '-0.02em' }}>{info.name || 'Your Name'}</h1>
          <div style={{ fontSize: '15px', color: primaryColor, fontWeight: 700, marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{info.title}</div>
        </div>
        <div style={{ textAlign: 'right', fontSize: '11px', color: '#52525b', display: 'flex', flexDirection: 'column', gap: '3px' }}>
          {info.email && <div>{info.email}</div>}
          {info.phone && <div>{info.phone}</div>}
          {info.location && <div>{info.location}</div>}
          {info.linkedin && <div>{info.linkedin}</div>}
        </div>
      </header>

      {info.summary && (
        <section style={{ marginBottom: '20px' }}>
          <h2 style={{ fontSize: '12px', fontWeight: 800, color: primaryColor, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>Summary</h2>
          <p style={{ fontSize: '12px', color: '#3f3f46', margin: 0, lineHeight: 1.6 }}>{info.summary}</p>
        </section>
      )}

      {order.map(id => {
        switch(id) {
          case 'skills':
            if (!data.skills?.length) return null;
            return (
              <section key={id} style={{ marginBottom: '20px' }}>
                <h2 style={{ fontSize: '12px', fontWeight: 800, color: primaryColor, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>Skills & Expertise</h2>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {data.skills.map((s, i) => (
                    <span key={i} style={{
                      background: 'rgba(180, 83, 9, 0.06)', color: primaryColor,
                      padding: '3px 9px', borderRadius: '6px', fontSize: '11px', fontWeight: 600,
                      border: `1px solid rgba(180, 83, 9, 0.15)`
                    }}>{s}</span>
                  ))}
                </div>
              </section>
            );

          case 'experience':
            if (!data.experiences?.length || (data.experiences.length === 1 && !data.experiences[0].title)) return null;
            return (
              <section key={id} style={{ marginBottom: '20px' }}>
                <h2 style={{ fontSize: '12px', fontWeight: 800, color: primaryColor, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '10px' }}>Professional Experience</h2>
                {data.experiences.map((exp, i) => (
                  <div key={i} style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '13px', color: '#18181b' }}>
                      <span>{exp.title}</span>
                      <span style={{ color: '#71717a', fontSize: '11px', fontWeight: 500 }}>{exp.period}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#52525b', fontWeight: 600, marginBottom: '4px' }}>
                      <span style={{ color: primaryColor }}>{exp.company}</span>
                      {exp.location && <span style={{ color: '#71717a', fontWeight: 400 }}>{exp.location}</span>}
                    </div>
                    <p style={{ fontSize: '12px', color: '#3f3f46', margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{exp.desc}</p>
                  </div>
                ))}
              </section>
            );

          case 'education':
            if (!data.education?.length || (data.education.length === 1 && !data.education[0].degree)) return null;
            return (
              <section key={id} style={{ marginBottom: '20px' }}>
                <h2 style={{ fontSize: '12px', fontWeight: 800, color: primaryColor, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>Education</h2>
                {data.education.map((edu, i) => (
                  <div key={i} style={{ marginBottom: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '12.5px', color: '#18181b' }}>
                      <span>{edu.degree}</span>
                      <span style={{ color: '#71717a', fontSize: '11px', fontWeight: 500 }}>{edu.year}</span>
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#52525b', fontWeight: 500 }}>{edu.institution}</div>
                  </div>
                ))}
              </section>
            );

          case 'projects':
            if (!data.projects?.length) return null;
            return (
              <section key={id} style={{ marginBottom: '20px' }}>
                <h2 style={{ fontSize: '12px', fontWeight: 800, color: primaryColor, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>Projects</h2>
                {data.projects.map((proj, i) => (
                  <div key={i} style={{ marginBottom: '10px' }}>
                    <ProjectTitleLink name={proj.name} link={proj.link} github={proj.github} color={primaryColor} fontSize="12.5px" />
                    <div style={{ color: primaryColor, fontSize: '11px', fontWeight: 600, marginBottom: '2px' }}>{proj.tech}</div>
                    <p style={{ fontSize: '11.5px', color: '#3f3f46', margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{proj.desc}</p>
                  </div>
                ))}
              </section>
            );

          case 'achievements':
            if (!data.achievements?.length) return null;
            return (
              <section key={id} style={{ marginBottom: '20px' }}>
                <h2 style={{ fontSize: '12px', fontWeight: 800, color: primaryColor, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>Key Achievements</h2>
                <ul style={{ paddingLeft: '18px', margin: 0 }}>
                  {data.achievements.map((ach, i) => (
                    ach && <li key={i} style={{ fontSize: '12px', color: '#3f3f46', marginBottom: '4px' }}>{ach}</li>
                  ))}
                </ul>
              </section>
            );

          case 'certifications':
            if (!data.certifications?.length) return null;
            return (
              <section key={id} style={{ marginBottom: '20px' }}>
                <h2 style={{ fontSize: '12px', fontWeight: 800, color: primaryColor, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>Certifications</h2>
                <ul style={{ paddingLeft: '18px', margin: 0 }}>
                  {data.certifications.map((cert, i) => (
                    cert && <li key={i} style={{ fontSize: '12px', color: '#3f3f46', marginBottom: '4px' }}>{cert}</li>
                  ))}
                </ul>
              </section>
            );

          case 'languages':
            if (!data.languages?.length) return null;
            return (
              <section key={id} style={{ marginBottom: '20px' }}>
                <h2 style={{ fontSize: '12px', fontWeight: 800, color: primaryColor, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>Languages</h2>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '12px', color: '#3f3f46' }}>
                  {data.languages.map((lang, i) => lang && <span key={i}>• {lang}</span>)}
                </div>
              </section>
            );
          
          default:
            return null;
        }
      })}
    </div>
  );
};

// ─── 7. GLACIER CHILL TEMPLATE ─────────────────────────────────────────────
export const GlacierChillTemplate = ({ data }) => {
  const { personalInfo: info = {}, sectionOrder = [] } = data || {};
  const primaryColor = data?.customStyles?.primaryColor || '#0f172a';

  const leftSections = ['experience', 'education', 'projects'];
  const rightSections = ['skills', 'achievements', 'certifications', 'languages'];

  const leftOrder = sectionOrder.length ? sectionOrder.filter(id => leftSections.includes(id)) : leftSections;
  const rightOrder = sectionOrder.length ? sectionOrder.filter(id => rightSections.includes(id)) : rightSections;

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", color: '#334155', minHeight: '100%', background: '#ffffff', display: 'flex', flexDirection: 'column' }}>
      <header style={{ background: primaryColor, color: '#ffffff', padding: '30px 40px', borderBottom: '4px solid rgba(255,255,255,0.1)' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 800, margin: 0, color: '#ffffff', letterSpacing: '-0.02em' }}>{info.name || 'Your Name'}</h1>
        <div style={{ fontSize: '15px', color: 'rgba(255, 255, 255, 0.85)', fontWeight: 600, marginTop: '4px' }}>{info.title}</div>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', marginTop: '15px', fontSize: '12px', color: 'rgba(255, 255, 255, 0.75)' }}>
          {info.email && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>✉ {info.email}</span>}
          {info.phone && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>✆ {info.phone}</span>}
          {info.location && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>⌖ {info.location}</span>}
          {info.linkedin && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>in {info.linkedin}</span>}
        </div>
      </header>

      {info.summary && (
        <div style={{ background: '#f8fafc', padding: '18px 40px', borderBottom: '1px solid #e2e8f0' }}>
          <p style={{ fontSize: '12px', color: '#475569', margin: 0, lineHeight: 1.6, fontStyle: 'italic' }}>{info.summary}</p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 0.7fr', gap: '30px', padding: '30px 40px', flex: 1 }}>
        <div>
          {leftOrder.map(id => {
            switch(id) {
              case 'experience':
                if (!data.experiences?.length || (data.experiences.length === 1 && !data.experiences[0].title)) return null;
                return (
                  <section key={id} style={{ marginBottom: '25px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: primaryColor, textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: `2px solid ${primaryColor}20`, paddingBottom: '4px', marginBottom: '12px' }}>Experience</div>
                    {data.experiences.map((exp, i) => (
                      <div key={i} style={{ marginBottom: '15px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '13px', color: '#1e293b' }}>
                          <span>{exp.title}</span>
                          <span style={{ color: '#64748b', fontSize: '11px', fontWeight: 500 }}>{exp.period}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: primaryColor, fontWeight: 600, marginBottom: '4px' }}>
                          <span>{exp.company}</span>
                          {exp.location && <span style={{ color: '#64748b', fontWeight: 400 }}>{exp.location}</span>}
                        </div>
                        <p style={{ fontSize: '12px', color: '#475569', margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{exp.desc}</p>
                      </div>
                    ))}
                  </section>
                );

              case 'education':
                if (!data.education?.length || (data.education.length === 1 && !data.education[0].degree)) return null;
                return (
                  <section key={id} style={{ marginBottom: '25px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: primaryColor, textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: `2px solid ${primaryColor}20`, paddingBottom: '4px', marginBottom: '12px' }}>Education</div>
                    {data.education.map((edu, i) => (
                      <div key={i} style={{ marginBottom: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '12.5px', color: '#1e293b' }}>
                          <span>{edu.degree}</span>
                          <span style={{ color: '#64748b', fontSize: '11px', fontWeight: 500 }}>{edu.year}</span>
                        </div>
                        <div style={{ fontSize: '11.5px', color: '#475569', fontWeight: 500 }}>{edu.institution}</div>
                      </div>
                    ))}
                  </section>
                );

              case 'projects':
                if (!data.projects?.length) return null;
                return (
                  <section key={id} style={{ marginBottom: '25px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: primaryColor, textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: `2px solid ${primaryColor}20`, paddingBottom: '4px', marginBottom: '12px' }}>Projects</div>
                    {data.projects.map((proj, i) => (
                      <div key={i} style={{ marginBottom: '12px' }}>
                        <ProjectTitleLink name={proj.name} link={proj.link} github={proj.github} color={primaryColor} fontSize="12.5px" />
                        <div style={{ color: primaryColor, fontSize: '11px', fontWeight: 600, marginBottom: '2px' }}>{proj.tech}</div>
                        <p style={{ fontSize: '11.5px', color: '#475569', margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{proj.desc}</p>
                      </div>
                    ))}
                  </section>
                );

              default:
                return null;
            }
          })}
        </div>

        <div>
          {rightOrder.map(id => {
            switch(id) {
              case 'skills':
                if (!data.skills?.length) return null;
                return (
                  <section key={id} style={{ marginBottom: '25px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: primaryColor, textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: `2px solid ${primaryColor}20`, paddingBottom: '4px', marginBottom: '12px' }}>Skills</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {data.skills.map((s, i) => (
                        <span key={i} style={{
                          background: '#f1f5f9', color: '#1e293b',
                          padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600,
                          border: '1px solid #cbd5e1'
                        }}>{s}</span>
                      ))}
                    </div>
                  </section>
                );

              case 'achievements':
                if (!data.achievements?.length) return null;
                return (
                  <section key={id} style={{ marginBottom: '25px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: primaryColor, textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: `2px solid ${primaryColor}20`, paddingBottom: '4px', marginBottom: '12px' }}>Achievements</div>
                    <ul style={{ paddingLeft: '18px', margin: 0 }}>
                      {data.achievements.map((ach, i) => (
                        ach && <li key={i} style={{ fontSize: '11.5px', color: '#475569', marginBottom: '4px' }}>{ach}</li>
                      ))}
                    </ul>
                  </section>
                );

              case 'certifications':
                if (!data.certifications?.length) return null;
                return (
                  <section key={id} style={{ marginBottom: '25px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: primaryColor, textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: `2px solid ${primaryColor}20`, paddingBottom: '4px', marginBottom: '12px' }}>Certifications</div>
                    <ul style={{ paddingLeft: '18px', margin: 0 }}>
                      {data.certifications.map((cert, i) => (
                        cert && <li key={i} style={{ fontSize: '11.5px', color: '#475569', marginBottom: '4px' }}>{cert}</li>
                      ))}
                    </ul>
                  </section>
                );

              case 'languages':
                if (!data.languages?.length) return null;
                return (
                  <section key={id} style={{ marginBottom: '25px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: primaryColor, textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: `2px solid ${primaryColor}20`, paddingBottom: '4px', marginBottom: '12px' }}>Languages</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11.5px', color: '#475569' }}>
                      {data.languages.map((lang, i) => lang && <span key={i}>• {lang}</span>)}
                    </div>
                  </section>
                );

              default:
                return null;
            }
          })}
        </div>
      </div>
    </div>
  );
};


// ─── 8. IVORY PRESTIGE TEMPLATE ─────────────────────────────────────────────
export const IvoryPrestigeTemplate = ({ data }) => {
  const { personalInfo: info = {}, sectionOrder = [] } = data || {};
  const primaryColor = data?.customStyles?.primaryColor || '#a27b5c';

  const defaultOrder = ['experience', 'education', 'skills', 'projects', 'achievements', 'certifications', 'languages'];
  const order = sectionOrder.length ? sectionOrder.filter(id => defaultOrder.includes(id)) : defaultOrder;

  return (
    <div style={{ fontFamily: "'Georgia', serif", color: '#1c1917', padding: '40px 45px', lineHeight: 1.6, background: '#faf8f5', minHeight: '100%', boxSizing: 'border-box' }}>
      <header style={{ textAlign: 'center', marginBottom: '25px', borderBottom: `2px double ${primaryColor}`, paddingBottom: '20px' }}>
        <h1 style={{ fontSize: '30px', fontWeight: 'normal', fontStyle: 'italic', margin: '0 0 6px 0', color: '#1c1917', letterSpacing: '0.02em' }}>{info.name || 'Your Name'}</h1>
        <div style={{ fontSize: '14px', color: primaryColor, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '12px' }}>{info.title}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '15px', fontSize: '11px', color: '#57534e', fontFamily: "'Inter', sans-serif" }}>
          {info.email && <span>{info.email}</span>}
          {info.email && (info.phone || info.location || info.linkedin) && <span style={{ color: primaryColor }}>•</span>}
          {info.phone && <span>{info.phone}</span>}
          {info.phone && (info.location || info.linkedin) && <span style={{ color: primaryColor }}>•</span>}
          {info.location && <span>{info.location}</span>}
          {info.location && info.linkedin && <span style={{ color: primaryColor }}>•</span>}
          {info.linkedin && <span>{info.linkedin}</span>}
        </div>
      </header>

      {info.summary && (
        <section style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: primaryColor, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px', textAlign: 'center' }}>Professional Narrative</div>
          <p style={{ fontSize: '12px', color: '#44403c', margin: 0, textAlign: 'justify', lineHeight: 1.7, fontStyle: 'italic', padding: '0 10px' }}>{info.summary}</p>
        </section>
      )}

      {order.map(id => {
        switch(id) {
          case 'skills':
            if (!data.skills?.length) return null;
            return (
              <section key={id} style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: primaryColor, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px', borderBottom: `1px solid ${primaryColor}40`, paddingBottom: '3px' }}>Expertise Areas</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', fontFamily: "'Inter', sans-serif" }}>
                  {data.skills.map((s, i) => (
                    <span key={i} style={{
                      background: '#f5f2eb', color: '#1c1917',
                      padding: '3px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: 500,
                      border: `1px solid ${primaryColor}25`
                    }}>{s}</span>
                  ))}
                </div>
              </section>
            );

          case 'experience':
            if (!data.experiences?.length || (data.experiences.length === 1 && !data.experiences[0].title)) return null;
            return (
              <section key={id} style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: primaryColor, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '10px', borderBottom: `1px solid ${primaryColor}40`, paddingBottom: '3px' }}>Professional Tenure</div>
                {data.experiences.map((exp, i) => (
                  <div key={i} style={{ marginBottom: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '13px', color: '#1c1917' }}>
                      <span>{exp.title}</span>
                      <span style={{ color: '#78716c', fontSize: '11px', fontWeight: 'normal', fontFamily: "'Inter', sans-serif" }}>{exp.period}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: primaryColor, fontStyle: 'italic', marginBottom: '4px' }}>
                      <span>{exp.company}</span>
                      {exp.location && <span style={{ color: '#78716c', fontWeight: 'normal', fontStyle: 'normal', fontSize: '11px', fontFamily: "'Inter', sans-serif" }}>{exp.location}</span>}
                    </div>
                    <p style={{ fontSize: '12px', color: '#44403c', margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.6, textAlign: 'justify' }}>{exp.desc}</p>
                  </div>
                ))}
              </section>
            );

          case 'education':
            if (!data.education?.length || (data.education.length === 1 && !data.education[0].degree)) return null;
            return (
              <section key={id} style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: primaryColor, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px', borderBottom: `1px solid ${primaryColor}40`, paddingBottom: '3px' }}>Academic Background</div>
                {data.education.map((edu, i) => (
                  <div key={i} style={{ marginBottom: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '12.5px', color: '#1c1917' }}>
                      <span>{edu.degree}</span>
                      <span style={{ color: '#78716c', fontSize: '11px', fontWeight: 'normal', fontFamily: "'Inter', sans-serif" }}>{edu.year}</span>
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#57534e', fontStyle: 'italic' }}>{edu.institution}</div>
                  </div>
                ))}
              </section>
            );

          case 'projects':
            if (!data.projects?.length) return null;
            return (
              <section key={id} style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: primaryColor, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px', borderBottom: `1px solid ${primaryColor}40`, paddingBottom: '3px' }}>Selected Undertakings</div>
                {data.projects.map((proj, i) => (
                  <div key={i} style={{ marginBottom: '10px' }}>
                    <ProjectTitleLink name={proj.name} link={proj.link} github={proj.github} color={primaryColor} fontSize="12.5px" />
                    <div style={{ color: primaryColor, fontSize: '11px', fontStyle: 'italic', marginBottom: '2px' }}>{proj.tech}</div>
                    <p style={{ fontSize: '11.5px', color: '#44403c', margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{proj.desc}</p>
                  </div>
                ))}
              </section>
            );

          case 'achievements':
            if (!data.achievements?.length) return null;
            return (
              <section key={id} style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: primaryColor, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px', borderBottom: `1px solid ${primaryColor}40`, paddingBottom: '3px' }}>Distinctions</div>
                <ul style={{ paddingLeft: '18px', margin: 0 }}>
                  {data.achievements.map((ach, i) => (
                    ach && <li key={i} style={{ fontSize: '12px', color: '#44403c', marginBottom: '4px' }}>{ach}</li>
                  ))}
                </ul>
              </section>
            );

          case 'certifications':
            if (!data.certifications?.length) return null;
            return (
              <section key={id} style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: primaryColor, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px', borderBottom: `1px solid ${primaryColor}40`, paddingBottom: '3px' }}>Credentials & Licensure</div>
                <ul style={{ paddingLeft: '18px', margin: 0 }}>
                  {data.certifications.map((cert, i) => (
                    cert && <li key={i} style={{ fontSize: '12px', color: '#44403c', marginBottom: '4px' }}>{cert}</li>
                  ))}
                </ul>
              </section>
            );

          case 'languages':
            if (!data.languages?.length) return null;
            return (
              <section key={id} style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: primaryColor, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px', borderBottom: `1px solid ${primaryColor}40`, paddingBottom: '3px' }}>Languages</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '12px', color: '#44403c' }}>
                  {data.languages.map((lang, i) => lang && <span key={i}>• {lang}</span>)}
                </div>
              </section>
            );
          
          default:
            return null;
        }
      })}
    </div>
  );
};


// ─── 9. ROYAL ESSENCE TEMPLATE ──────────────────────────────────────────────
export const RoyalEssenceTemplate = ({ data }) => {
  const { personalInfo: info = {}, sectionOrder = [] } = data || {};
  const primaryColor = data?.customStyles?.primaryColor || '#0f2963';
  const accentColor = '#e2b13c'; // Warm gold

  const leftSections = ['experience', 'education', 'projects'];
  const rightSections = ['skills', 'achievements', 'certifications', 'languages'];

  const leftOrder = sectionOrder.length ? sectionOrder.filter(id => leftSections.includes(id)) : leftSections;
  const rightOrder = sectionOrder.length ? sectionOrder.filter(id => rightSections.includes(id)) : rightSections;

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", color: '#1e293b', minHeight: '100%', background: '#ffffff', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
      <header style={{ background: `linear-gradient(135deg, ${primaryColor} 0%, #17387a 100%)`, color: '#ffffff', padding: '35px 40px', position: 'relative', overflow: 'hidden' }}>
        {/* Subtle decorative gold strip at the bottom of header */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '4px', background: accentColor }} />
        
        <h1 style={{ fontSize: '32px', fontWeight: 800, margin: 0, color: '#ffffff', letterSpacing: '-0.02em', textTransform: 'uppercase' }}>{info.name || 'Your Name'}</h1>
        <div style={{ fontSize: '15px', color: accentColor, fontWeight: 700, marginTop: '4px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{info.title}</div>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', marginTop: '15px', fontSize: '12px', color: 'rgba(255, 255, 255, 0.8)' }}>
          {info.email && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>✉ {info.email}</span>}
          {info.phone && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>✆ {info.phone}</span>}
          {info.location && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>⌖ {info.location}</span>}
          {info.linkedin && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>in {info.linkedin}</span>}
        </div>
      </header>

      {info.summary && (
        <div style={{ background: '#f8fafc', padding: '20px 40px', borderBottom: '1px solid #e2e8f0' }}>
          <p style={{ fontSize: '12.5px', color: '#334155', margin: 0, lineHeight: 1.6, fontWeight: 500 }}>{info.summary}</p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 0.75fr', gap: '35px', padding: '30px 40px', flex: 1 }}>
        {/* Left column */}
        <div>
          {leftOrder.map(id => {
            switch(id) {
              case 'experience':
                if (!data.experiences?.length || (data.experiences.length === 1 && !data.experiences[0].title)) return null;
                return (
                  <section key={id} style={{ marginBottom: '25px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: primaryColor, textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: `2px solid ${primaryColor}`, paddingBottom: '4px', marginBottom: '14px' }}>Experience</div>
                    {data.experiences.map((exp, i) => (
                      <div key={i} style={{ marginBottom: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '13.5px', color: '#0f172a' }}>
                          <span>{exp.title}</span>
                          <span style={{ color: '#64748b', fontSize: '11px', fontWeight: 500 }}>{exp.period}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: primaryColor, fontWeight: 600, marginBottom: '4px' }}>
                          <span>{exp.company}</span>
                          {exp.location && <span style={{ color: '#64748b', fontWeight: 400 }}>{exp.location}</span>}
                        </div>
                        <p style={{ fontSize: '12px', color: '#475569', margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{exp.desc}</p>
                      </div>
                    ))}
                  </section>
                );

              case 'education':
                if (!data.education?.length || (data.education.length === 1 && !data.education[0].degree)) return null;
                return (
                  <section key={id} style={{ marginBottom: '25px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: primaryColor, textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: `2px solid ${primaryColor}`, paddingBottom: '4px', marginBottom: '14px' }}>Education</div>
                    {data.education.map((edu, i) => (
                      <div key={i} style={{ marginBottom: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '13px', color: '#0f172a' }}>
                          <span>{edu.degree}</span>
                          <span style={{ color: '#64748b', fontSize: '11px', fontWeight: 500 }}>{edu.year}</span>
                        </div>
                        <div style={{ fontSize: '12px', color: '#475569', fontWeight: 500 }}>{edu.institution}</div>
                      </div>
                    ))}
                  </section>
                );

              case 'projects':
                if (!data.projects?.length) return null;
                return (
                  <section key={id} style={{ marginBottom: '25px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: primaryColor, textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: `2px solid ${primaryColor}`, paddingBottom: '4px', marginBottom: '14px' }}>Key Projects</div>
                    {data.projects.map((proj, i) => (
                      <div key={i} style={{ marginBottom: '12px' }}>
                        <ProjectTitleLink name={proj.name} link={proj.link} github={proj.github} color={primaryColor} fontSize="13px" />
                        <div style={{ color: primaryColor, fontSize: '11px', fontWeight: 600, marginBottom: '2px' }}>{proj.tech}</div>
                        <p style={{ fontSize: '12px', color: '#475569', margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{proj.desc}</p>
                      </div>
                    ))}
                  </section>
                );

              default:
                return null;
            }
          })}
        </div>

        {/* Right column */}
        <div>
          {rightOrder.map(id => {
            switch(id) {
              case 'skills':
                if (!data.skills?.length) return null;
                return (
                  <section key={id} style={{ marginBottom: '25px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: primaryColor, textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: `2px solid ${primaryColor}`, paddingBottom: '4px', marginBottom: '12px' }}>Skills</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {data.skills.map((s, i) => (
                        <span key={i} style={{
                          background: 'rgba(15, 41, 99, 0.05)', color: primaryColor,
                          padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600,
                          border: `1px solid rgba(15, 41, 99, 0.12)`
                        }}>{s}</span>
                      ))}
                    </div>
                  </section>
                );

              case 'achievements':
                if (!data.achievements?.length) return null;
                return (
                  <section key={id} style={{ marginBottom: '25px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: primaryColor, textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: `2px solid ${primaryColor}`, paddingBottom: '4px', marginBottom: '12px' }}>Achievements</div>
                    <ul style={{ paddingLeft: '18px', margin: 0 }}>
                      {data.achievements.map((ach, i) => (
                        ach && <li key={i} style={{ fontSize: '12px', color: '#475569', marginBottom: '4px' }}>{ach}</li>
                      ))}
                    </ul>
                  </section>
                );

              case 'certifications':
                if (!data.certifications?.length) return null;
                return (
                  <section key={id} style={{ marginBottom: '25px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: primaryColor, textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: `2px solid ${primaryColor}`, paddingBottom: '4px', marginBottom: '12px' }}>Certifications</div>
                    <ul style={{ paddingLeft: '18px', margin: 0 }}>
                      {data.certifications.map((cert, i) => (
                        cert && <li key={i} style={{ fontSize: '12px', color: '#475569', marginBottom: '4px' }}>{cert}</li>
                      ))}
                    </ul>
                  </section>
                );

              case 'languages':
                if (!data.languages?.length) return null;
                return (
                  <section key={id} style={{ marginBottom: '25px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: primaryColor, textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: `2px solid ${primaryColor}`, paddingBottom: '4px', marginBottom: '12px' }}>Languages</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', color: '#475569' }}>
                      {data.languages.map((lang, i) => lang && <span key={i}>• {lang}</span>)}
                    </div>
                  </section>
                );

              default:
                return null;
            }
          })}
        </div>
      </div>
    </div>
  );
};


// ─── 10. EXECUTIVE EDGE TEMPLATE ────────────────────────────────────────────
export const ExecutiveEdgeTemplate = ({ data }) => {
  const { personalInfo: info = {}, sectionOrder = [] } = data || {};
  const primaryColor = data?.customStyles?.primaryColor || '#0f766e'; // Steel Teal

  const defaultOrder = ['experience', 'skills', 'education', 'projects', 'achievements', 'certifications', 'languages'];
  const order = sectionOrder.length ? sectionOrder.filter(id => defaultOrder.includes(id)) : defaultOrder;

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", color: '#1e293b', padding: '35px 40px', lineHeight: 1.5, background: '#f8fafc', minHeight: '100%', boxSizing: 'border-box' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderLeft: `6px solid ${primaryColor}`, paddingLeft: '20px', marginBottom: '25px' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 800, margin: 0, color: '#0f172a', letterSpacing: '-0.03em' }}>{info.name || 'Your Name'}</h1>
          <div style={{ fontSize: '15px', color: primaryColor, fontWeight: 700, marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{info.title}</div>
        </div>
        <div style={{ textAlign: 'right', fontSize: '11.5px', color: '#475569', display: 'flex', flexDirection: 'column', gap: '4px', fontFamily: 'monospace' }}>
          {info.email && <div>{info.email}</div>}
          {info.phone && <div>{info.phone}</div>}
          {info.location && <div>{info.location}</div>}
          {info.linkedin && <div>{info.linkedin}</div>}
        </div>
      </header>

      {info.summary && (
        <section style={{ marginBottom: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <h2 style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', margin: 0, letterSpacing: '0.08em' }}>Executive Statement</h2>
            <div style={{ flex: 1, height: '1px', background: '#cbd5e1' }} />
          </div>
          <p style={{ fontSize: '12px', color: '#334155', margin: 0, lineHeight: 1.6 }}>{info.summary}</p>
        </section>
      )}

      {order.map(id => {
        switch(id) {
          case 'skills':
            if (!data.skills?.length) return null;
            return (
              <section key={id} style={{ marginBottom: '22px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <h2 style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', margin: 0, letterSpacing: '0.08em' }}>Core Competencies</h2>
                  <div style={{ flex: 1, height: '1px', background: '#cbd5e1' }} />
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {data.skills.map((s, i) => (
                    <span key={i} style={{
                      background: 'rgba(15, 118, 110, 0.08)', color: primaryColor,
                      padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600,
                      border: `1px solid rgba(15, 118, 110, 0.15)`
                    }}>{s}</span>
                  ))}
                </div>
              </section>
            );

          case 'experience':
            if (!data.experiences?.length || (data.experiences.length === 1 && !data.experiences[0].title)) return null;
            return (
              <section key={id} style={{ marginBottom: '22px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                  <h2 style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', margin: 0, letterSpacing: '0.08em' }}>Professional Chronology</h2>
                  <div style={{ flex: 1, height: '1px', background: '#cbd5e1' }} />
                </div>
                {data.experiences.map((exp, i) => (
                  <div key={i} style={{ marginBottom: '14px', paddingLeft: '15px', borderLeft: `2px solid ${primaryColor}40` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '13px', color: '#0f172a' }}>
                      <span>{exp.title}</span>
                      <span style={{ color: '#64748b', fontSize: '11.5px', fontWeight: 500 }}>{exp.period}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: primaryColor, fontWeight: 600, marginBottom: '4px' }}>
                      <span>{exp.company}</span>
                      {exp.location && <span style={{ color: '#64748b', fontWeight: 400 }}>{exp.location}</span>}
                    </div>
                    <p style={{ fontSize: '12px', color: '#334155', margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{exp.desc}</p>
                  </div>
                ))}
              </section>
            );

          case 'education':
            if (!data.education?.length || (data.education.length === 1 && !data.education[0].degree)) return null;
            return (
              <section key={id} style={{ marginBottom: '22px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <h2 style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', margin: 0, letterSpacing: '0.08em' }}>Education</h2>
                  <div style={{ flex: 1, height: '1px', background: '#cbd5e1' }} />
                </div>
                {data.education.map((edu, i) => (
                  <div key={i} style={{ marginBottom: '8px', paddingLeft: '15px', borderLeft: `2px solid ${primaryColor}40` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '12.5px', color: '#0f172a' }}>
                      <span>{edu.degree}</span>
                      <span style={{ color: '#64748b', fontSize: '11.5px', fontWeight: 500 }}>{edu.year}</span>
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#475569', fontWeight: 500 }}>{edu.institution}</div>
                  </div>
                ))}
              </section>
            );

          case 'projects':
            if (!data.projects?.length) return null;
            return (
              <section key={id} style={{ marginBottom: '22px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <h2 style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', margin: 0, letterSpacing: '0.08em' }}>Key Projects</h2>
                  <div style={{ flex: 1, height: '1px', background: '#cbd5e1' }} />
                </div>
                {data.projects.map((proj, i) => (
                  <div key={i} style={{ marginBottom: '12px', paddingLeft: '15px', borderLeft: `2px solid ${primaryColor}40` }}>
                    <ProjectTitleLink name={proj.name} link={proj.link} github={proj.github} color={primaryColor} fontSize="12.5px" />
                    <div style={{ color: primaryColor, fontSize: '11px', fontWeight: 600, marginBottom: '2px' }}>{proj.tech}</div>
                    <p style={{ fontSize: '11.5px', color: '#334155', margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{proj.desc}</p>
                  </div>
                ))}
              </section>
            );

          case 'achievements':
            if (!data.achievements?.length) return null;
            return (
              <section key={id} style={{ marginBottom: '22px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                  <h2 style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', margin: 0, letterSpacing: '0.08em' }}>Achievements</h2>
                  <div style={{ flex: 1, height: '1px', background: '#cbd5e1' }} />
                </div>
                <ul style={{ paddingLeft: '18px', margin: 0 }}>
                  {data.achievements.map((ach, i) => (
                    ach && <li key={i} style={{ fontSize: '12px', color: '#334155', marginBottom: '4px' }}>{ach}</li>
                  ))}
                </ul>
              </section>
            );

          case 'certifications':
            if (!data.certifications?.length) return null;
            return (
              <section key={id} style={{ marginBottom: '22px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                  <h2 style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', margin: 0, letterSpacing: '0.08em' }}>Certifications</h2>
                  <div style={{ flex: 1, height: '1px', background: '#cbd5e1' }} />
                </div>
                <ul style={{ paddingLeft: '18px', margin: 0 }}>
                  {data.certifications.map((cert, i) => (
                    cert && <li key={i} style={{ fontSize: '12px', color: '#334155', marginBottom: '4px' }}>{cert}</li>
                  ))}
                </ul>
              </section>
            );

          case 'languages':
            if (!data.languages?.length) return null;
            return (
              <section key={id} style={{ marginBottom: '22px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                  <h2 style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', margin: 0, letterSpacing: '0.08em' }}>Languages</h2>
                  <div style={{ flex: 1, height: '1px', background: '#cbd5e1' }} />
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '12px', color: '#334155' }}>
                  {data.languages.map((lang, i) => lang && <span key={i}>• {lang}</span>)}
                </div>
              </section>
            );
          
          default:
            return null;
        }
      })}
    </div>
  );
};

