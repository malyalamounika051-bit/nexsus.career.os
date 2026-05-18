import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-python';
import 'prismjs/themes/prism-tomorrow.css';
import api from '../services/api';
import Sidebar from '../components/Sidebar';
import { 
  Terminal, Play, Bug, Info, Save, FileCode, ChevronDown, 
  Sparkles, Loader2, RotateCcw, Copy
} from 'lucide-react';

const LANGUAGE_CONFIG = {
  python: { language: 'python', version: '3.10.0', defaultCode: '# Python Playground\ndef greet(name):\n    return f"Hello, {name}!"\n\nprint(greet("World"))\nprint([x**2 for x in range(1, 6)])' },
  javascript: { language: 'javascript', version: '18.15.0', defaultCode: '// JavaScript Playground\nfunction greet(name) {\n  return `Hello, ${name}!`;\n}\n\nconsole.log(greet("World"));\nconsole.log([1, 2, 3, 4, 5].map(x => x ** 2));' },
};

const Playground = () => {
  const [lang, setLang] = useState('python');
  const [code, setCode] = useState(LANGUAGE_CONFIG.python.defaultCode);
  const [output, setOutput] = useState([]);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const terminalEndRef = useRef(null);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [output]);

  const runCode = async () => {
    setLoading(true);
    setOutput(prev => [...prev, { type: 'system', content: `> Running ${lang} code...` }]);
    try {
      const { data } = await api.post('/playground/run', {
        language: LANGUAGE_CONFIG[lang].language,
        version: LANGUAGE_CONFIG[lang].version,
        content: code
      });

      if (data.success) {
        const result = data.data.run;
        if (result.stdout) {
          setOutput(prev => [...prev, { type: 'stdout', content: result.stdout }]);
        }
        if (result.stderr) {
          setOutput(prev => [...prev, { type: 'stderr', content: result.stderr }]);
        }
        if (!result.stdout && !result.stderr) {
          setOutput(prev => [...prev, { type: 'system', content: '> Program finished with no output.' }]);
        }
      }
    } catch (err) {
      setOutput(prev => [...prev, { type: 'error', content: `Error: ${err.response?.data?.message || err.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  const handleAiAssist = async (task) => {
    setAiLoading(true);
    setOutput(prev => [...prev, { type: 'ai-sys', content: `✨ Sara is ${task === 'debug' ? 'debugging' : 'analyzing'} your code...` }]);
    try {
      const { data } = await api.post('/playground/assist', {
        content: code,
        task: task || aiInput
      });

      if (data.success) {
        setOutput(prev => [...prev, { type: 'ai', content: data.data.response }]);
      }
    } catch (err) {
      setOutput(prev => [...prev, { type: 'error', content: 'Sara: Sorry, I encountered an error while assisting.' }]);
    } finally {
      setAiLoading(false);
      setAiInput('');
    }
  };

  const clearTerminal = () => setOutput([]);

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="app-main">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Terminal size={18} color="white" />
              </div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: "'Space Grotesk', sans-serif" }}>Coding Playground</h1>
            </div>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Write, run, and debug code with AI assistance</p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <div className="select-wrapper" style={{ position: 'relative' }}>
              <select 
                value={lang} 
                onChange={(e) => { setLang(e.target.value); setCode(LANGUAGE_CONFIG[e.target.value].defaultCode); }}
                style={{ 
                  background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)',
                  padding: '0.5rem 2rem 0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', appearance: 'none'
                }}
              >
                <option value="python">Python</option>
                <option value="javascript">JavaScript</option>
              </select>
              <ChevronDown size={14} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            </div>
            
            <button onClick={runCode} disabled={loading} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1.25rem' }}>
              {loading ? <Loader2 size={16} className="spinner" /> : <Play size={16} />} Run
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '1.5rem', height: 'calc(100vh - 200px)' }}>
          {/* Sidebar */}
          <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>Files</h3>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ padding: '0.6rem 0.75rem', borderRadius: '8px', background: 'var(--color-primary-glow)', border: '1px solid var(--color-border-glow)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--color-text)' }}>
                <FileCode size={16} color="var(--color-primary)" /> main.{lang === 'python' ? 'py' : 'js'}
              </div>
              <div style={{ padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid transparent', color: 'var(--color-text-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>
                No saved files
              </div>
            </div>
            <button className="btn-ghost" style={{ width: '100%', justifyContent: 'center', fontSize: '0.8rem', gap: '0.5rem' }}>
              <Save size={14} /> Save Code
            </button>
          </div>

          {/* Main Content: Editor + Terminal */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Editor Wrapper */}
            <div className="glass-card" style={{ flex: 3, padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', border: '1px solid var(--color-border)' }}>
              <div style={{ padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f56' }} />
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ffbd2e' }} />
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#27c93f' }} />
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button onClick={() => handleAiAssist('debug')} className="icon-btn-hover" title="Debug with AI">
                    <Bug size={16} />
                  </button>
                  <button onClick={() => handleAiAssist('explain')} className="icon-btn-hover" title="Explain with AI">
                    <Info size={16} />
                  </button>
                  <button onClick={() => { navigator.clipboard.writeText(code) }} className="icon-btn-hover" title="Copy Code">
                    <Copy size={16} />
                  </button>
                </div>
              </div>
              
              <div style={{ flex: 1, overflowY: 'auto', background: '#0d1117' }}>
                <Editor
                  value={code}
                  onValueChange={setCode}
                  highlight={code => code}
                  padding={20}
                  style={{
                    fontFamily: '"Fira Code", "Fira Mono", monospace',
                    fontSize: 14,
                    minHeight: '100%',
                    background: 'transparent'
                  }}
                  textareaClassName="editor-textarea"
                  preClassName="editor-pre"
                />
              </div>
            </div>

            {/* Terminal */}
            <div className="glass-card" style={{ flex: 2, padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', background: '#010409', border: '1px solid var(--color-border)' }}>
              <div style={{ padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>
                  <Terminal size={14} /> TERMINAL
                </div>
                <button onClick={clearTerminal} className="icon-btn-hover">
                  <RotateCcw size={14} />
                </button>
              </div>

              <div style={{ flex: 1, padding: '1rem', overflowY: 'auto', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                {output.length === 0 ? (
                  <div style={{ color: 'var(--color-text-muted)' }}>Nexus Terminal v1.0 — AI-powered execution environment<br/>Press ▶ Run to execute your code</div>
                ) : (
                  output.map((line, i) => (
                    <div key={i} style={{ 
                      marginBottom: '0.4rem', 
                      color: line.type === 'stdout' ? '#e6edf3' : 
                             line.type === 'stderr' || line.type === 'error' ? '#ff7b72' : 
                             line.type === 'ai' ? '#79c0ff' : 
                             line.type === 'ai-sys' ? 'var(--color-primary)' :
                             '#8b949e',
                      whiteSpace: 'pre-wrap',
                      lineHeight: 1.5
                    }}>
                      {line.content}
                    </div>
                  ))
                )}
                <div ref={terminalEndRef} />
              </div>

              {/* AI Input Console */}
              <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ color: 'var(--color-primary)' }}><Sparkles size={16} /></div>
                <input 
                  type="text" 
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAiAssist()}
                  placeholder="Type a command or ask AI (try: help, run, debug, explain)..."
                  style={{ flex: 1, background: 'transparent', border: 'none', color: '#e6edf3', fontSize: '0.85rem', outline: 'none' }}
                />
                {aiLoading && <Loader2 size={16} className="spinner" />}
              </div>
            </div>
          </div>
        </div>
      </main>

      <style>{`
        .editor-textarea { outline: none !important; }
        .editor-pre { pointer-events: none; }
        .icon-btn-hover { 
          background: none; border: none; color: var(--color-text-muted); cursor: pointer; transition: color 0.2s; padding: 4px; display: flex; align-items: center; justify-content: center;
        }
        .icon-btn-hover:hover { color: var(--color-primary); }
        .btn-ghost { display: flex; align-items: center; gap: 0.5rem; background: none; border: 1px solid var(--color-border); color: var(--color-text-muted); border-radius: 8px; padding: 0.5rem 1rem; cursor: pointer; transition: all 0.2s; }
        .btn-ghost:hover { border-color: var(--color-primary); color: var(--color-primary); }
      `}</style>
    </div>
  );
};

export default Playground;
