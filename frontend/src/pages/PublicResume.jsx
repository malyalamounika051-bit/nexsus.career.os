import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { resumeService } from '../services/resumeService';
import { 
  ModernTemplate, 
  ProfessionalTemplate, 
  CreativeTemplate, 
  MinimalistTemplate 
} from '../components/ResumeTemplates';
import { Download, Printer, Globe, Share2 } from 'lucide-react';
import html2pdf from 'html2pdf.js';

const TEMPLATES = {
  modern: ModernTemplate,
  professional: ProfessionalTemplate,
  creative: CreativeTemplate,
  minimalist: MinimalistTemplate
};

export default function PublicResume() {
  const { token } = useParams();
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const printRef = useRef();

  useEffect(() => {
    const fetchResume = async () => {
      try {
        setLoading(true);
        const { data } = await resumeService.getPublic(token);
        setResume(data.data);
      } catch (err) {
        setError("Resume not found or is no longer public.");
      } finally {
        setLoading(false);
      }
    };
    fetchResume();
  }, [token]);

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
      <div className="animate-spin" style={{ width: '40px', height: '40px', border: '4px solid var(--color-primary)', borderTopColor: 'transparent', borderRadius: '50%' }}></div>
    </div>
  );

  if (error) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', color: '#1e293b', padding: '2rem' }}>
       <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '1rem' }}>404</h1>
       <p>{error}</p>
       <a href="/" className="btn-primary" style={{ marginTop: '2rem', textDecoration: 'none' }}>Go Home</a>
    </div>
  );

  const TemplateComponent = TEMPLATES[resume.templateId] || ModernTemplate;

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9', padding: '4rem 2rem' }}>
      {/* Floating Action Bar */}
      <div style={{ position: 'fixed', top: '2rem', left: '50%', transform: 'translateX(-50%)', background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)', padding: '0.75rem 1.5rem', borderRadius: '99px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', display: 'flex', gap: '1rem', zIndex: 100, border: '1px solid #e2e8f0' }}>
         <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', borderRight: '1px solid #e2e8f0', paddingRight: '1rem' }}>
            <div style={{ width: '32px', height: '32px', background: 'var(--gradient-primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '0.8rem' }}>N</div>
            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e293b' }}>{resume.personalInfo.name}'s Resume</span>
         </div>
         <button onClick={() => html2pdf().from(printRef.current).save(`${resume.personalInfo.name}_Resume.pdf`)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', color: '#475569', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}>
           <Download size={16} /> Download PDF
         </button>
         <button onClick={() => window.print()} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', color: '#475569', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}>
           <Printer size={16} /> Print
         </button>
      </div>

      <div style={{ maxWidth: '850px', margin: '0 auto', background: 'white', boxShadow: '0 40px 100px -20px rgba(0,0,0,0.15)', borderRadius: '8px' }}>
        <div ref={printRef}>
          <TemplateComponent data={resume} />
        </div>
      </div>

      <footer style={{ marginTop: '4rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
        <p>Built with <span style={{ fontWeight: 700, color: '#64748b' }}>Nexus AI Career Mentor</span></p>
      </footer>
    </div>
  );
}
