import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import Sidebar from '../components/Sidebar';
import { Send, Bot, User as UserIcon, Sparkles, Loader2, AlertCircle, Trash2, Copy, Check, Clock, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function MentorChat() {
  const { user } = useAuth();
  const location = useLocation();
  const initialProcessed = useRef(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);

  const GREETING = {
    role: 'model',
    content: `Hello ${user?.name?.split(' ')[0] || 'there'}! \u{1F44B} I'm Sara, your personal AI Career Mentor.\n\nI can help you with:\n\n1. **Career Exploration** — Discover paths that match your interests\n2. **Resume & Portfolio** — Get expert feedback on your documents\n3. **Interview Prep** — Practice and get tips for your dream role\n4. **Skill Development** — Build a personalized learning roadmap\n5. **Industry Insights** — Stay updated on trends and opportunities\n\nAsk me about **anything** — a place, a hobby, a movie, a sport — and I'll connect it to exciting career opportunities! What's on your mind today?`,
    timestamp: new Date().toISOString()
  };

  const [messages, setMessages] = useState([GREETING]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Load chat history from DB on mount
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const { data } = await api.get('/mentor/history');
        if (data.success && data.data.length > 0) {
          setMessages([GREETING, ...data.data]);
        }
      } catch (err) {
        console.error('Could not load chat history:', err);
      } finally {
        setHistoryLoaded(true);
      }
    };
    loadHistory();
  }, []);

  // Handle initial message passed via router state
  useEffect(() => {
    if (!historyLoaded) return;
    if (location.state?.initialMessage && !initialProcessed.current) {
      initialProcessed.current = true;
      const userMsg = { role: 'user', content: location.state.initialMessage, timestamp: new Date().toISOString() };
      setMessages(prev => [...prev, userMsg]);

      const getResponse = async () => {
        setIsLoading(true);
        try {
          const { data } = await api.post('/mentor/chat', { message: userMsg.content });
          if (data.success) {
            setMessages(prev => [...prev, { role: 'model', content: data.data.response, timestamp: new Date().toISOString() }]);
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

  // Focus input on load
  useEffect(() => {
    if (historyLoaded) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [historyLoaded]);

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', content: input.trim(), timestamp: new Date().toISOString() };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const { data } = await api.post('/mentor/chat', { message: userMessage.content });
      if (data.success) {
        setMessages(prev => [...prev, { role: 'model', content: data.data.response, timestamp: new Date().toISOString() }]);
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

  const handleCopy = async (text, index) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  // Format markdown-lite
  const formatText = (text) => {
    return text.split('\n').map((line, i) => {
      let formattedLine = line
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`([^`]+)`/g, '<code style="background:rgba(59,130,246,0.15);padding:0.1rem 0.35rem;border-radius:4px;font-size:0.85em;font-family:monospace">$1</code>');

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

  const suggestions = [
    '\u{1F3CF} I love cricket — what careers suit me?',
    '\u{1F3DB}\uFE0F Tell me about Taj Mahal careers',
    '\u{1F916} Should I choose AI or Web Dev?',
    '\u{1F3AF} Help me prepare for interviews',
    '\u{1F4C4} Review my resume strategy',
    '\u{1F4CA} What are trending tech careers?',
  ];

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
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', marginTop: '0.1rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
                Online — Powered by AI • Remembers your conversations
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {messages.length > 1 && (
              <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginRight: '0.5rem' }}>
                {messages.length - 1} messages
              </span>
            )}
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
          </div>
        </header>

        {/* Chat Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', background: 'var(--color-bg)' }}>

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
              transition={{ duration: 0.3 }}
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
              <div style={{ position: 'relative' }}>
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
                
                {/* Timestamp & Actions */}
                <div style={{ 
                  display: 'flex', alignItems: 'center', gap: '0.5rem', 
                  marginTop: '0.35rem', 
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  paddingLeft: msg.role === 'model' ? '0.25rem' : 0,
                  paddingRight: msg.role === 'user' ? '0.25rem' : 0,
                }}>
                  {msg.timestamp && (
                    <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                      <Clock size={9} /> {formatTime(msg.timestamp)}
                    </span>
                  )}
                  {msg.role === 'model' && index > 0 && (
                    <button
                      onClick={() => handleCopy(msg.content, index)}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: copiedIndex === index ? '#22c55e' : 'var(--color-text-muted)',
                        padding: '2px', display: 'flex', alignItems: 'center', gap: '0.2rem',
                        fontSize: '0.65rem', transition: 'color 0.2s',
                      }}
                      title="Copy response"
                    >
                      {copiedIndex === index ? <><Check size={10} /> Copied</> : <><Copy size={10} /> Copy</>}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}

          {/* Typing Indicator */}
          <AnimatePresence>
            {isLoading && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -10 }}
                style={{ display: 'flex', gap: '1rem', alignSelf: 'flex-start' }}
              >
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Bot size={18} color="white" />
                </div>
                <div style={{ 
                  background: 'var(--color-surface)', border: '1px solid var(--color-border)', 
                  padding: '1rem 1.5rem', borderRadius: '16px', borderTopLeftRadius: '4px', 
                  display: 'flex', flexDirection: 'column', gap: '0.5rem'
                }}>
                  <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                    <div className="typing-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-primary-light)', animation: 'typingBounce 1.4s ease-in-out infinite' }} />
                    <div className="typing-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-primary-light)', animation: 'typingBounce 1.4s ease-in-out 0.2s infinite' }} />
                    <div className="typing-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-primary-light)', animation: 'typingBounce 1.4s ease-in-out 0.4s infinite' }} />
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Zap size={10} /> Sara is thinking...
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

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
              {suggestions.map(chip => (
                <button
                  key={chip}
                  onClick={() => { setInput(chip.replace(/^[\u{1F000}-\u{1FFFF}]\s?/u, '')); setTimeout(() => inputRef.current?.focus(), 50); }}
                  style={{
                    padding: '0.45rem 0.85rem', borderRadius: 99, fontSize: '0.78rem', fontWeight: 500,
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
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Sara anything — I'll connect it to your career!"
              disabled={isLoading}
              style={{
                flex: 1, background: 'var(--color-bg)', border: '1px solid var(--color-border)',
                color: 'var(--color-text)', padding: '1rem 1.25rem', borderRadius: '12px',
                fontSize: '0.95rem', outline: 'none', transition: 'border-color 0.2s',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--color-primary)'}
              onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
            />
            {input.length > 0 && (
              <span style={{
                position: 'absolute', right: 80, top: '50%', transform: 'translateY(-50%)',
                fontSize: '0.65rem', color: input.length > 500 ? '#ef4444' : 'var(--color-text-muted)',
              }}>
                {input.length}/500
              </span>
            )}
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
          <div style={{ textAlign: 'center', marginTop: '0.75rem', fontSize: '0.7rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <Sparkles size={10} /> Sara remembers your conversations • Powered by OpenRouter AI
          </div>
        </div>

      </main>
      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
        @keyframes typingBounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-6px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
