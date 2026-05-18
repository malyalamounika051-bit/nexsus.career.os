import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../services/api';
import Sidebar from '../components/Sidebar';
import { Send, Bot, User as UserIcon, Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function MentorChat() {
  const { user } = useAuth();
  const location = useLocation();
  const initialProcessed = useRef(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  const [messages, setMessages] = useState([
    {
      role: 'model',
      content: `Hello ${user?.name?.split(' ')[0] || 'there'}! 👋 I'm Sara, your personal Career Mentor. I can help you prepare for interviews, analyze your skills, or answer any questions about your career path. What would you like to focus on today?`
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  // Handle initial message from location state
  useEffect(() => {
    if (location.state?.initialMessage && !initialProcessed.current) {
      initialProcessed.current = true;
      const userMsg = { role: 'user', content: location.state.initialMessage };
      setMessages(prev => [...prev, userMsg]);
      
      // Auto-trigger response
      const getResponse = async () => {
        setIsLoading(true);
        try {
          const { data } = await api.post('/mentor/chat', {
            message: userMsg.content,
            history: messages // just the intro
          });
          if (data.success) {
            setMessages(prev => [...prev, { role: 'model', content: data.data.response }]);
          }
        } catch (err) {
          console.error(err);
          setError('Failed to get an automated response. Please try typing your question again.');
        } finally {
          setIsLoading(false);
        }
      };
      getResponse();
    }
  }, [location.state]);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  useEffect(() => scrollToBottom(), [messages, isLoading]);

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', content: input.trim() };
    const chatHistory = [...messages];
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const { data } = await api.post('/mentor/chat', {
        message: userMessage.content,
        history: chatHistory
      });

      if (data.success) {
        setMessages(prev => [...prev, { role: 'model', content: data.data.response }]);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to connect to the AI Mentor. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to format simple markdown (bold and bullet points)
  const formatText = (text) => {
    return text.split('\n').map((line, i) => {
      // Bold text handling **text**
      let formattedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      
      // Simple list handling
      if (formattedLine.trim().startsWith('* ')) {
        return <li key={i} style={{ marginLeft: '1.5rem', marginBottom: '0.25rem' }} dangerouslySetInnerHTML={{ __html: formattedLine.substring(2) }} />;
      }
      if (formattedLine.trim().match(/^[0-9]+\.\s/)) {
        return <li key={i} style={{ marginLeft: '1.5rem', marginBottom: '0.25rem', listStyleType: 'decimal' }} dangerouslySetInnerHTML={{ __html: formattedLine.replace(/^[0-9]+\.\s/, '') }} />;
      }
      
      return <p key={i} style={{ marginBottom: '0.5rem' }} dangerouslySetInnerHTML={{ __html: formattedLine }} />;
    });
  };

  return (
    <div className="app-shell">
      <Sidebar collapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(c => !c)} />
      <main className={`app-main ${sidebarCollapsed ? 'sidebar-is-collapsed' : ''}`} style={{ padding: '0', display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        
        {/* Header */}
        <header style={{ padding: '1.5rem 2rem', background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '1rem', zIndex: 10 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(59, 130, 246, 0.3)' }}>
            <Bot size={24} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Sara AI <span className="tag" style={{ fontSize: '0.65rem' }}><Sparkles size={10} /> Career Mentor</span>
            </h1>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginTop: '0.1rem' }}>Ask me for guidance, career advice, or interview tips</p>
          </div>
        </header>

        {/* Chat Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', background: 'var(--color-bg)' }}>
          {messages.map((msg, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                display: 'flex',
                gap: '1rem',
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
                flexDirection: msg.role === 'user' ? 'row-reverse' : 'row'
              }}
            >
              {/* Avatar */}
              <div style={{
                width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                background: msg.role === 'user' ? 'var(--color-surface-2)' : 'var(--gradient-primary)',
                border: msg.role === 'user' ? '1px solid var(--color-border)' : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {msg.role === 'user' ? <UserIcon size={18} color="var(--color-text-muted)" /> : <Bot size={18} color="white" />}
              </div>

              {/* Message Bubble */}
              <div style={{
                background: msg.role === 'user' ? 'var(--color-primary-glow)' : 'var(--color-surface)',
                border: `1px solid ${msg.role === 'user' ? '#3b82f640' : 'var(--color-border)'}`,
                padding: '1rem 1.25rem',
                borderRadius: '16px',
                borderTopRightRadius: msg.role === 'user' ? '4px' : '16px',
                borderTopLeftRadius: msg.role === 'model' ? '4px' : '16px',
                color: 'var(--color-text)',
                fontSize: '0.95rem',
                lineHeight: 1.6,
                boxShadow: msg.role === 'user' ? '0 4px 20px rgba(59,130,246,0.1)' : 'none'
              }}>
                {formatText(msg.content)}
              </div>
            </motion.div>
          ))}

          {/* Loading Indicator */}
          {isLoading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', gap: '1rem', alignSelf: 'flex-start' }}>
               <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Bot size={18} color="white" />
               </div>
               <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', padding: '1rem 1.25rem', borderRadius: '16px', borderTopLeftRadius: '4px', display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                 <Loader2 size={16} className="spinner" color="var(--color-primary-light)" style={{ animation: 'spin 1s linear infinite' }} />
                 <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>AI is thinking...</span>
               </div>
            </motion.div>
          )}

          {/* Error Message */}
          {error && (
            <div style={{ alignSelf: 'center', background: '#ef444420', border: '1px solid #ef444440', color: '#fca5a5', padding: '0.75rem 1.25rem', borderRadius: 8, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '1rem 0' }}>
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div style={{ padding: '1rem 2rem 1.25rem', background: 'var(--color-surface)', borderTop: '1px solid var(--color-border)' }}>
          {/* Suggestion chips */}
          {messages.length <= 1 && (
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
              {['Should I choose AI or Web Dev?', 'What should I learn next?', 'Help me prepare for interviews', 'Remote job tips'].map(chip => (
                <button
                  key={chip}
                  onClick={() => { setInput(chip); }}
                  style={{
                    padding: '0.4rem 0.75rem', borderRadius: 99, fontSize: '0.75rem', fontWeight: 500,
                    background: 'var(--color-surface-2)', border: '1px solid var(--color-border)',
                    color: 'var(--color-text-dim)', cursor: 'pointer', transition: 'all 0.2s',
                    whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.color = 'var(--color-primary-light)'; e.currentTarget.style.background = 'var(--color-primary-glow)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text-dim)'; e.currentTarget.style.background = 'var(--color-surface-2)'; }}
                >
                  {chip}
                </button>
              ))}
            </div>
          )}
          <form onSubmit={handleSend} style={{ display: 'flex', gap: '0.75rem', position: 'relative' }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about careers, skill gaps, or interview prep..."
              disabled={isLoading}
              style={{
                flex: 1, background: 'var(--color-bg)', border: '1px solid var(--color-border)',
                color: 'var(--color-text)', padding: '1rem 1.25rem', borderRadius: '12px',
                fontSize: '0.95rem', outline: 'none', transition: 'border-color 0.2s',
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--color-border)'}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              style={{
                background: input.trim() && !isLoading ? 'var(--gradient-primary)' : 'var(--color-surface-2)',
                color: input.trim() && !isLoading ? 'white' : 'var(--color-text-muted)',
                border: 'none', borderRadius: '12px', padding: '0 1.5rem', display: 'flex', alignItems: 'center',
                justifyContent: 'center', cursor: input.trim() && !isLoading ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s', boxShadow: input.trim() && !isLoading ? '0 4px 15px rgba(59,130,246,0.3)' : 'none'
              }}
            >
              <Send size={20} />
            </button>
          </form>
          <div style={{ textAlign: 'center', marginTop: '0.75rem', fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
            AI can make mistakes. Verify important career advice.
          </div>
        </div>

      </main>
      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
