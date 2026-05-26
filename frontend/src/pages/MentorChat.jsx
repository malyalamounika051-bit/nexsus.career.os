import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../services/api';
import Sidebar from '../components/Sidebar';
import { Send, Bot, User as UserIcon, Sparkles, Loader2, AlertCircle, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function MentorChat() {
  const { user } = useAuth();
  const location = useLocation();
  const initialProcessed = useRef(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const GREETING = {
    role: 'model',
    content: `Hello ${user?.name?.split(' ')[0] || 'there'}! 👋 I'm Sara, your personal Career Mentor. Ask me about **anything** — a place, a hobby, a movie, a sport — and I'll connect it to exciting career opportunities for you! What's on your mind today?`
  };

  const [messages, setMessages] = useState([GREETING]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  // Load chat history from DB on mount
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const { data } = await api.get('/mentor/history');
        if (data.success && data.data.length > 0) {
          // Mark as from DB so we can handle them correctly in subsequent sends
          const dbMessages = data.data.map(m => ({ ...m, isFromDB: true }));
          setMessages([GREETING, ...dbMessages]);
        }
      } catch (err) {
        console.error('Could not load chat history:', err);
      } finally {
        setHistoryLoaded(true);
      }
    };
    loadHistory();
  }, []);

  // Handle initial message passed via router state (e.g., from Dashboard)
  useEffect(() => {
    if (!historyLoaded) return;
    if (location.state?.initialMessage && !initialProcessed.current) {
      initialProcessed.current = true;
      const userMsg = { role: 'user', content: location.state.initialMessage };
      setMessages(prev => [...prev, userMsg]);

      const getResponse = async () => {
        setIsLoading(true);
        try {
          const { data } = await api.post('/mentor/chat', {
            message: userMsg.content,
            history: [GREETING]
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
  }, [historyLoaded, location.state]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

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

  const handleClearChat = async () => {
    if (!confirm('Clear your entire chat history with Sara? This cannot be undone.')) return;
    setIsClearing(true);
    try {
      await api.delete('/mentor/history');
      setMessages([GREETING]);
    } catch (err) {
      console.error('Failed to clear chat:', err);
    } finally {
      setIsClearing(false);
    }
  };

  // Format markdown-lite (bold, bullets, numbered lists, headings)
  const formatText = (text) => {
    return text.split('\n').map((line, i) => {
      let formattedLine = line
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>');

      if (formattedLine.trim().startsWith('### ')) {
        return <h4 key={i} style={{ fontWeight: 700, marginBottom: '0.25rem', marginTop: '0.5rem', fontSize: '0.95rem', color: 'var(--color-primary-light)' }} dangerouslySetInnerHTML={{ __html: formattedLine.replace('### ', '') }} />;
      }
      if (formattedLine.trim().startsWith('## ')) {
        return <h3 key={i} style={{ fontWeight: 700, marginBottom: '0.35rem', marginTop: '0.5rem', fontSize: '1rem' }} dangerouslySetInnerHTML={{ __html: formattedLine.replace('## ', '') }} />;
      }
      if (formattedLine.trim().startsWith('* ') || formattedLine.trim().startsWith('- ')) {
        return <li key={i} style={{ marginLeft: '1.5rem', marginBottom: '0.25rem' }} dangerouslySetInnerHTML={{ __html: formattedLine.substring(2) }} />;
      }
      if (formattedLine.trim().match(/^[0-9]+\.\s/)) {
        return <li key={i} style={{ marginLeft: '1.5rem', marginBottom: '0.25rem', listStyleType: 'decimal' }} dangerouslySetInnerHTML={{ __html: formattedLine.replace(/^[0-9]+\.\s/, '') }} />;
      }
      if (formattedLine.trim() === '') return <br key={i} />;

      return <p key={i} style={{ marginBottom: '0.4rem' }} dangerouslySetInnerHTML={{ __html: formattedLine }} />;
    });
  };

  return (
    <div className="app-shell">
      <Sidebar collapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(c => !c)} />
      <main className={`app-main ${sidebarCollapsed ? 'sidebar-is-collapsed' : ''}`} style={{ padding: '0', display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>

        {/* Header */}
        <header style={{ padding: '1rem 2rem', background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(59, 130, 246, 0.3)' }}>
              <Bot size={24} color="white" />
            </div>
            <div>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                Sara AI <span className="tag" style={{ fontSize: '0.65rem' }}><Sparkles size={10} /> Career Mentor</span>
              </h1>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', marginTop: '0.1rem' }}>
                Ask me anything — I'll connect it to your career journey
              </p>
            </div>
          </div>

          {/* Clear Chat Button */}
          {messages.length > 1 && (
            <button
              onClick={handleClearChat}
              disabled={isClearing}
              title="Clear chat history"
              style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                color: '#fca5a5', borderRadius: '10px', padding: '0.5rem 1rem',
                fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.18)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
            >
              <Trash2 size={14} />
              {isClearing ? 'Clearing...' : 'Clear Chat'}
            </button>
          )}
        </header>

        {/* Chat Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', background: 'var(--color-bg)' }}>

          {/* History loading indicator */}
          {!historyLoaded && (
            <div style={{ alignSelf: 'center', color: 'var(--color-text-muted)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
              Loading your chat history...
            </div>
          )}

          {messages.map((msg, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                display: 'flex', gap: '1rem',
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
                <Loader2 size={16} color="var(--color-primary-light)" style={{ animation: 'spin 1s linear infinite' }} />
                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Sara is thinking...</span>
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
              {[
                'I love cricket — what careers suit me?',
                'Tell me about Taj Mahal careers',
                'Should I choose AI or Web Dev?',
                'Help me prepare for interviews'
              ].map(chip => (
                <button
                  key={chip}
                  onClick={() => setInput(chip)}
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
              placeholder="Ask about anything — I'll connect it to your career!"
              disabled={isLoading}
              style={{
                flex: 1, background: 'var(--color-bg)', border: '1px solid var(--color-border)',
                color: 'var(--color-text)', padding: '1rem 1.25rem', borderRadius: '12px',
                fontSize: '0.95rem', outline: 'none', transition: 'border-color 0.2s',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--color-primary)'}
              onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
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
            Sara connects <strong>any topic</strong> to career opportunities. Your chat history is saved automatically.
          </div>
        </div>

      </main>
      <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
