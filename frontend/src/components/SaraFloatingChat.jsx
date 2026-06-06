import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, Bot, User as UserIcon, Sparkles, Loader2, Minimize2, Maximize2, Trash2, Copy, Check, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const SARA_AVATAR = '/sara-avatar.png';

export default function SaraFloatingChat() {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const messagesEndRef = useRef(null);

  const getPageContext = () => {
    const path = location.pathname;
    const contextMap = {
      '/dashboard': 'User is on the Command Center dashboard',
      '/career-dna': 'User is taking the Career DNA assessment',
      '/results': 'User is viewing Career DNA results',
      '/roadmaps': 'User is viewing/generating career roadmaps',
      '/jobs': 'User is searching for jobs',
      '/resume-builder': 'User is building their resume',
      '/mock-interview/setup': 'User is setting up a mock interview',
      '/mock-interview/room': 'User is in a live mock interview',
      '/mock-interview/report': 'User is reviewing interview results',
      '/skill-gap': 'User is analyzing skill gaps',
      '/mentor': 'User is in the full Sara AI mentor chat',
      '/career-simulator': 'User is exploring career simulations',
      '/profile': 'User is viewing their profile',
    };
    return contextMap[path] || `User is on page: ${path}`;
  };
  const inputRef = useRef(null);

  // Don't show on MentorChat page (it already has full Sara), login, signup, or landing
  const hiddenPaths = ['/', '/login', '/signup', '/mentor', '/oauth-callback'];
  const shouldHide = hiddenPaths.includes(location.pathname);

  const GREETING = {
    role: 'model',
    content: `Hi ${user?.name?.split(' ')[0] || 'there'}! 👋 I'm Sara, your AI Career Mentor. Ask me anything while you work — I'm always here to help!`
  };

  // Load chat history
  useEffect(() => {
    if (!isAuthenticated) return;
    const loadHistory = async () => {
      try {
        const { data } = await api.get('/mentor/history');
        if (data.success && data.data.length > 0) {
          setMessages([GREETING, ...data.data]);
        } else {
          setMessages([GREETING]);
        }
      } catch (err) {
        console.error('Sara widget: Could not load history:', err);
        setMessages([GREETING]);
      } finally {
        setHistoryLoaded(true);
      }
    };
    loadHistory();
  }, [isAuthenticated]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && historyLoaded) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen, historyLoaded]);

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', content: input.trim() };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const { data } = await api.post('/mentor/chat', {
        message: userMessage.content,
        pageContext: getPageContext(),
        currentRoute: location.pathname
      });

      if (data.success) {
        setMessages(prev => [...prev, { role: 'model', content: data.data.response }]);
        if (!isOpen) {
          setUnreadCount(prev => prev + 1);
        }
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, {
        role: 'model',
        content: "Sorry, I couldn't process that right now. Please try again! 🔄"
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = async () => {
    if (!confirm('Clear your entire chat history with Sara?')) return;
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

  const handleOpen = () => {
    setIsOpen(true);
    setUnreadCount(0);
  };

  const handleChipClick = (chip) => {
    setInput(chip);
    setTimeout(() => inputRef.current?.focus(), 50);
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
      return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch { return ''; }
  };

  // Format markdown-lite
  const formatText = (text) => {
    return text.split('\n').map((line, i) => {
      let formattedLine = line
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>');

      if (formattedLine.trim().startsWith('### ')) {
        return <h4 key={i} style={{ fontWeight: 700, marginBottom: '0.15rem', marginTop: '0.35rem', fontSize: '0.82rem', color: 'var(--color-primary-light)' }} dangerouslySetInnerHTML={{ __html: formattedLine.replace('### ', '') }} />;
      }
      if (formattedLine.trim().startsWith('## ')) {
        return <h3 key={i} style={{ fontWeight: 700, marginBottom: '0.2rem', marginTop: '0.35rem', fontSize: '0.88rem' }} dangerouslySetInnerHTML={{ __html: formattedLine.replace('## ', '') }} />;
      }
      if (formattedLine.trim().startsWith('* ') || formattedLine.trim().startsWith('- ')) {
        return <li key={i} style={{ marginLeft: '1.2rem', marginBottom: '0.15rem', fontSize: '0.82rem' }} dangerouslySetInnerHTML={{ __html: formattedLine.substring(2) }} />;
      }
      if (formattedLine.trim().match(/^[0-9]+\.\s/)) {
        return <li key={i} style={{ marginLeft: '1.2rem', marginBottom: '0.15rem', listStyleType: 'decimal', fontSize: '0.82rem' }} dangerouslySetInnerHTML={{ __html: formattedLine.replace(/^[0-9]+\.\s/, '') }} />;
      }
      if (formattedLine.trim() === '') return <br key={i} />;

      return <p key={i} style={{ marginBottom: '0.25rem', fontSize: '0.82rem' }} dangerouslySetInnerHTML={{ __html: formattedLine }} />;
    });
  };

  if (!isAuthenticated || shouldHide) return null;

  const suggestions = [
    'What careers match my interests?',
    'Help me with interview prep',
    'Review my career strategy',
    'Trending tech careers 2025'
  ];

  return (
    <>
      {/* ── FLOATING BUTTON ────────────────────────────────── */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            onClick={handleOpen}
            className="sara-fab"
            aria-label="Open Sara AI Mentor"
            title="Chat with Sara — AI Career Mentor"
          >
            <div className="sara-fab-avatar">
              <img src={SARA_AVATAR} alt="Sara AI" />
            </div>
            <div className="sara-fab-badge">
              <Sparkles size={10} />
              <span>AI Mentor</span>
            </div>
            {unreadCount > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="sara-fab-unread"
              >
                {unreadCount}
              </motion.div>
            )}
            <div className="sara-fab-ring" />
            <div className="sara-fab-ring sara-fab-ring-2" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── CHAT PANEL ──────────────────────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className={`sara-chat-panel ${isExpanded ? 'sara-chat-expanded' : ''}`}
          >
            {/* Header */}
            <div className="sara-chat-header">
              <div className="sara-chat-header-left">
                <div className="sara-chat-header-avatar">
                  <img src={SARA_AVATAR} alt="Sara AI" />
                  <div className="sara-online-dot" />
                </div>
                <div>
                  <div className="sara-chat-header-name">
                    Sara AI
                    <span className="sara-chat-header-tag">
                      <Sparkles size={8} /> Mentor
                    </span>
                  </div>
                  <div className="sara-chat-header-status">Always here to help</div>
                </div>
              </div>
              <div className="sara-chat-header-actions">
                {messages.length > 1 && (
                  <button
                    onClick={handleClearChat}
                    disabled={isClearing}
                    className="sara-header-btn sara-header-btn-danger"
                    title="Clear chat"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
                <button
                  onClick={() => setIsExpanded(e => !e)}
                  className="sara-header-btn"
                  title={isExpanded ? 'Minimize' : 'Expand'}
                >
                  {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="sara-header-btn"
                  title="Close"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="sara-chat-messages">
              {!historyLoaded && (
                <div className="sara-chat-loading">
                  <Loader2 size={14} className="animate-spin" />
                  Loading history...
                </div>
              )}

              {messages.map((msg, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index < 2 ? index * 0.1 : 0 }}
                  className={`sara-msg ${msg.role === 'user' ? 'sara-msg-user' : 'sara-msg-bot'}`}
                >
                  {msg.role === 'model' && (
                    <div className="sara-msg-avatar">
                      <img src={SARA_AVATAR} alt="Sara" />
                    </div>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div className={`sara-msg-bubble ${msg.role === 'user' ? 'sara-msg-bubble-user' : 'sara-msg-bubble-bot'}`}>
                      {formatText(msg.content)}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                      {msg.timestamp && (
                        <span style={{ fontSize: '0.6rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.15rem' }}>
                          <Clock size={8} /> {formatTime(msg.timestamp)}
                        </span>
                      )}
                      {msg.role === 'model' && index > 0 && (
                        <button
                          onClick={() => handleCopy(msg.content, index)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: copiedIndex === index ? '#22c55e' : 'var(--color-text-muted)', padding: '1px', display: 'flex', alignItems: 'center', gap: '0.15rem', fontSize: '0.6rem' }}
                          title="Copy"
                        >
                          {copiedIndex === index ? <><Check size={8} /> Copied</> : <><Copy size={8} /></>}
                        </button>
                      )}
                    </div>
                  </div>
                  {msg.role === 'user' && (
                    <div className="sara-msg-avatar-user">
                      <UserIcon size={14} />
                    </div>
                  )}
                </motion.div>
              ))}

              {/* Loading */}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="sara-msg sara-msg-bot"
                >
                  <div className="sara-msg-avatar">
                    <img src={SARA_AVATAR} alt="Sara" />
                  </div>
                  <div className="sara-msg-bubble sara-msg-bubble-bot sara-typing">
                    <div className="sara-typing-dots">
                      <span /><span /><span />
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Sara is thinking...</span>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Suggestion Chips */}
            {messages.length <= 1 && (
              <div className="sara-chat-suggestions">
                {suggestions.map(chip => (
                  <button
                    key={chip}
                    onClick={() => handleChipClick(chip)}
                    className="sara-suggestion-chip"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            )}

            {/* Input Area */}
            <form onSubmit={handleSend} className="sara-chat-input-area">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask Sara anything..."
                disabled={isLoading}
                className="sara-chat-input"
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className={`sara-chat-send ${input.trim() && !isLoading ? 'sara-chat-send-active' : ''}`}
              >
                <Send size={16} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
