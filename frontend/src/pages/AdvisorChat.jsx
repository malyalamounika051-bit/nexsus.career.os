import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../services/api';
import Sidebar from '../components/Sidebar';
import { Send, Bot, User as UserIcon, Sparkles, Loader2, AlertCircle, Compass } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AdvisorChat() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const GREETING = {
    sender: 'bot',
    text: `Hello ${user?.name?.split(' ')[0] || 'there'}! 👋 I'm Sara, your AI Career & Education Advisor. Let's discover your perfect career path and study roadmap in just 2 minutes! 

To start, tell me a bit about what tasks, hobbies, or school subjects excite you most?`
  };

  const [messages, setMessages] = useState([GREETING]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [finalizingStep, setFinalizingStep] = useState('');
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, isFinalizing]);

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!input.trim() || isLoading || isFinalizing) return;

    const userMessage = { sender: 'user', text: input.trim() };
    const newMessages = [...messages, userMessage];

    setMessages(newMessages);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const { data } = await api.post('/advisor/chat', {
        messages: newMessages
      });

      if (data.success) {
        setMessages(prev => [...prev, { sender: 'bot', text: data.text }]);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to connect to the Advisor. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinalize = async () => {
    setIsFinalizing(true);
    setError(null);
    setFinalizingStep('Analyzing your interests & aptitude...');

    try {
      // Step 1: Synthesize and generate assessment and auto roadmap
      const { data } = await api.post('/advisor/finalize', {
        messages: messages
      });

      if (data.success) {
        setFinalizingStep('Building your Career DNA profile...');
        setTimeout(() => {
          setFinalizingStep('Spawning your personalized learning roadmap...');
          setTimeout(() => {
            navigate(`/results?id=${data.data.assessment._id}`);
          }, 1000);
        }, 1000);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to synthesize profile. Please try again.');
      setIsFinalizing(false);
    }
  };

  // Determine if we have collected enough messages to finalize
  const userMessageCount = messages.filter(m => m.sender === 'user').length;
  const showFinalizeButton = userMessageCount >= 3;

  return (
    <div className="app-shell">
      <Sidebar collapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(c => !c)} />
      <main className={`app-main ${sidebarCollapsed ? 'sidebar-is-collapsed' : ''}`} style={{ padding: '0', display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>

        {/* Header */}
        <header style={{ padding: '1rem 2rem', background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(59, 130, 246, 0.3)' }}>
              <Compass size={24} color="white" />
            </div>
            <div>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                One-Step AI Advisor <span className="tag" style={{ fontSize: '0.65rem' }}><Sparkles size={10} /> Powered by Sara</span>
              </h1>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', marginTop: '0.1rem' }}>
                Conversational career match and educational pathway design
              </p>
            </div>
          </div>

          {/* Quick Finalize Option */}
          {showFinalizeButton && !isFinalizing && (
            <motion.button
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              onClick={handleFinalize}
              className="btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 0 15px rgba(59,130,246,0.5)' }}
            >
              <Sparkles size={16} /> Get My Pathway
            </motion.button>
          )}
        </header>

        {/* Chat Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', background: 'var(--color-bg)' }}>

          {messages.map((msg, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                display: 'flex', gap: '1rem',
                alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
                flexDirection: msg.sender === 'user' ? 'row-reverse' : 'row'
              }}
            >
              {/* Avatar */}
              <div style={{
                width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                background: msg.sender === 'user' ? 'var(--color-surface-2)' : 'var(--gradient-primary)',
                border: msg.sender === 'user' ? '1px solid var(--color-border)' : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {msg.sender === 'user' ? <UserIcon size={18} color="var(--color-text-muted)" /> : <Bot size={18} color="white" />}
              </div>

              {/* Message Bubble */}
              <div style={{
                background: msg.sender === 'user' ? 'var(--color-primary-glow)' : 'var(--color-surface)',
                border: `1px solid ${msg.sender === 'user' ? '#3b82f640' : 'var(--color-border)'}`,
                padding: '1rem 1.25rem',
                borderRadius: '16px',
                borderTopRightRadius: msg.sender === 'user' ? '4px' : '16px',
                borderTopLeftRadius: msg.sender === 'bot' ? '4px' : '16px',
                color: 'var(--color-text)',
                fontSize: '0.95rem',
                whiteSpace: 'pre-line',
                lineHeight: 1.6,
                boxShadow: msg.sender === 'user' ? '0 4px 20px rgba(59,130,246,0.1)' : 'none'
              }}>
                {msg.text}
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
                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Sara is matching...</span>
              </div>
            </motion.div>
          )}

          {/* Synthesis Loading State */}
          {isFinalizing && (
            <div style={{ alignSelf: 'center', background: 'var(--color-surface)', border: '1px solid var(--color-primary)', padding: '2rem 3rem', borderRadius: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', width: '100%', maxWidth: 450, margin: '2rem auto' }}>
              <Loader2 size={40} color="var(--color-primary-light)" style={{ animation: 'spin 1.5s linear infinite' }} />
              <div style={{ fontWeight: 700, fontSize: '1.1rem', textAlign: 'center' }}>Building Pathway</div>
              <div style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>{finalizingStep}</div>
            </div>
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
        {!isFinalizing && (
          <div style={{ padding: '1rem 2rem 1.25rem', background: 'var(--color-surface)', borderTop: '1px solid var(--color-border)' }}>
            <form onSubmit={handleSend} style={{ display: 'flex', gap: '0.75rem', position: 'relative' }}>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Talk with Sara about your study interests, coding comfort, or career goals..."
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem', fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
              <span>Chat to profile your traits. Get Matches highlights when ready.</span>
              {showFinalizeButton && (
                <button onClick={handleFinalize} style={{ background: 'none', border: 'none', color: 'var(--color-primary-light)', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}>
                  Skip to Results
                </button>
              )}
            </div>
          </div>
        )}

      </main>
      <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
