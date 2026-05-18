import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import Sidebar from '../components/Sidebar';
import { 
  FileText, Upload, Sparkles, AlertCircle, CheckCircle2, 
  Loader2, ArrowRight, Download, RefreshCcw, FileType
} from 'lucide-react';

const PortfolioCritique = () => {
  const navigate = useNavigate();
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [critique, setCritique] = useState('');
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError('File size exceeds 5MB limit.');
        return;
      }
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text && !file) {
      setError('Please provide your portfolio text or upload a file.');
      return;
    }

    setLoading(true);
    setError(null);
    setCritique('');

    try {
      const formData = new FormData();
      if (file) {
        formData.append('file', file);
      } else {
        formData.append('text', text);
      }

      const { data } = await api.post('/critique', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (data.success) {
        setCritique(data.data.critique);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to analyze your portfolio. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatCritique = (text) => {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('#')) {
        const level = line.match(/^#+/)[0].length;
        const content = line.replace(/^#+\s/, '');
        return <h3 key={i} style={{ fontSize: level === 1 ? '1.5rem' : '1.25rem', fontWeight: 700, margin: '1.5rem 0 0.75rem', color: 'var(--color-primary-light)' }}>{content}</h3>;
      }
      if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
        return <li key={i} style={{ marginLeft: '1.5rem', marginBottom: '0.5rem', listStyleType: 'disc' }}>{line.trim().substring(2)}</li>;
      }
      if (line.match(/^\d+\./)) {
        return <li key={i} style={{ marginLeft: '1.5rem', marginBottom: '0.5rem', listStyleType: 'decimal' }}>{line.replace(/^\d+\.\s/, '')}</li>;
      }
      return <p key={i} style={{ marginBottom: '1rem', lineHeight: 1.6, color: 'var(--color-text-dim)' }}>{line}</p>;
    });
  };

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="app-main">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={20} color="white" />
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: "'Space Grotesk', sans-serif" }}>
              Portfolio <span className="gradient-text">Critique</span>
            </h1>
          </div>
          <p style={{ color: 'var(--color-text-muted)' }}>Get professional AI feedback on your resume or portfolio to stand out to recruiters.</p>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: critique ? '1fr 1fr' : '1fr', gap: '2rem', transition: 'all 0.5s' }}>
          
          {/* Input Section */}
          <motion.div layout>
            <div className="glass-card" style={{ padding: '2rem' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Upload size={18} /> {file ? 'File Selected' : 'Submit Your Content'}
              </h2>

              <form onSubmit={handleSubmit}>
                {!file ? (
                  <>
                    <textarea
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder="Paste your resume text here, or share a link to your online portfolio..."
                      style={{
                        width: '100%', minHeight: '300px', background: 'var(--color-bg)', border: '1px solid var(--color-border)',
                        borderRadius: '12px', padding: '1.25rem', color: 'var(--color-text)', fontSize: '0.9rem',
                        lineHeight: 1.6, outline: 'none', transition: 'all 0.2s', marginBottom: '1.5rem', resize: 'vertical'
                      }}
                      onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                      onBlur={(e) => e.target.style.borderColor = 'var(--color-border)'}
                    />
                    
                    <div style={{ textAlign: 'center', margin: '1rem 0', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>— OR —</div>
                  </>
                ) : (
                  <div style={{ 
                    background: 'var(--color-primary-glow)', border: '2px dashed var(--color-primary)', 
                    borderRadius: '12px', padding: '2rem', textAlign: 'center', marginBottom: '1.5rem',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem'
                  }}>
                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <FileType size={24} color="var(--color-primary)" />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>{file.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                    </div>
                    <button type="button" onClick={() => setFile(null)} className="btn-ghost" style={{ fontSize: '0.8rem' }}>Change File</button>
                  </div>
                )}

                {!file && (
                  <div 
                    onClick={() => fileInputRef.current.click()}
                    style={{
                      border: '2px dashed var(--color-border)', borderRadius: '12px', padding: '2rem',
                      textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s', background: 'var(--color-surface-2)'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--color-primary)'}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--color-border)'}
                  >
                    <Upload size={32} color="var(--color-text-muted)" style={{ margin: '0 auto 1rem', display: 'block' }} />
                    <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Upload PDF or Docx</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Maximum file size: 5MB</div>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileChange} 
                      accept=".pdf,.docx" 
                      style={{ display: 'none' }} 
                    />
                  </div>
                )}

                {error && (
                  <div style={{ color: '#fca5a5', fontSize: '0.875rem', marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertCircle size={16} /> {error}
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={loading || (!text && !file)}
                  className="btn-primary"
                  style={{ width: '100%', marginTop: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '1rem' }}
                >
                  {loading ? (
                    <>
                      <Loader2 size={20} className="spinner" style={{ animation: 'spin 1s linear infinite' }} />
                      Analyzing Your Profile...
                    </>
                  ) : (
                    <>
                      <Sparkles size={20} /> Get Expert Critique
                    </>
                  )}
                </button>
              </form>
            </div>
          </motion.div>

          {/* Results Section */}
          <AnimatePresence>
            {critique && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <div className="glass-card" style={{ padding: '2rem', height: '100%', overflowY: 'auto' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <CheckCircle2 size={18} color="var(--color-success)" /> Sara's Critique
                    </h2>
                    <button onClick={() => setCritique('')} className="btn-ghost" style={{ padding: '0.4rem' }}>
                      <RefreshCcw size={16} />
                    </button>
                  </div>

                  <div className="critique-content">
                    {formatCritique(critique)}
                  </div>

                  <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'var(--color-primary-glow)', borderRadius: '12px', border: '1px solid #3b82f630' }}>
                    <h4 style={{ fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      Next Steps
                    </h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-dim)', marginBottom: '1rem' }}>
                      Would you like Sara to help you rewrite specific sections based on this critique?
                    </p>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <button 
                        className="btn-primary" 
                        style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}
                        onClick={() => navigate('/mentor', { state: { initialMessage: `I just received a portfolio critique and I have some questions about it. Here is the critique I got:\n\n${critique}` } })}
                      >
                        Ask Sara
                      </button>

                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
      
      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
        .critique-content li { color: var(--color-text-dim); font-size: 0.9rem; line-height: 1.6; }
      `}</style>
    </div>
  );
};

export default PortfolioCritique;
