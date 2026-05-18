import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Video, Mic, Briefcase, Settings, ArrowRight, Loader2, User } from 'lucide-react';
import api from '../services/api';

const MockInterviewSetup = () => {
  const navigate = useNavigate();
  const [jobRole, setJobRole] = useState('');
  const [difficulty, setDifficulty] = useState('Medium');
  const [avatar, setAvatar] = useState('female');
  const [loading, setLoading] = useState(false);

  const handleStart = async (e) => {
    e.preventDefault();
    if (!jobRole) return;
    
    setLoading(true);
    try {
      const response = await api.post('/interview/start', { jobRole, difficulty });
      if (response.data.success) {
        navigate('/mock-interview/room', { 
          state: { 
            interviewId: response.data.data._id,
            jobRole,
            difficulty,
            avatar,
            questions: response.data.data.questions
          } 
        });
      }
    } catch (error) {
      console.error('Error starting interview:', error);
      alert('Failed to start interview. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-shell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', width: '100vw', background: 'var(--color-bg)' }}>
      {/* Background orbs */}
      <div className="orb" style={{ width: 600, height: 600, background: '#3b82f6', top: -200, left: -200 }} />
      <div className="orb" style={{ width: 500, height: 500, background: '#a855f7', bottom: -200, right: -200, animationDelay: '3s' }} />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card glow-blue"
        style={{ maxWidth: '900px', width: '100%', margin: '2rem', padding: '3rem', zIndex: 10 }}
      >

        <div className="text-center" style={{ marginBottom: '3rem' }}>
          <h1 className="page-title text-hero gradient-text font-display" style={{ fontSize: '3rem', marginBottom: '1rem' }}>AI Voice Mock Interview</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto', lineHeight: 1.6 }}>
            Practice for your next role in a realistic online meeting environment. Our AI interviewer will ask contextual questions and analyze your responses in real-time.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12">
          {/* Form Side */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Briefcase size={16} color="var(--color-primary)" />
                Target Job Role
              </label>
              <input
                type="text"
                value={jobRole}
                onChange={(e) => setJobRole(e.target.value)}
                placeholder="e.g. Frontend Developer, Product Manager"
                className="input"
                required
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Settings size={16} color="var(--color-accent)" />
                Difficulty Level
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                {['Basic', 'Medium', 'Tough'].map(level => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setDifficulty(level)}
                    className={difficulty === level ? 'btn-primary' : 'btn-ghost'}
                    style={{ padding: '0.75rem', fontSize: '0.9rem' }}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <User size={16} color="var(--color-info)" />
                Interviewer Avatar
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setAvatar('female')}
                  className={avatar === 'female' ? 'glass-card glow-blue' : 'glass-card'}
                  style={{ padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', borderColor: avatar === 'female' ? 'var(--color-primary)' : '' }}
                >
                  <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--color-surface-2)', overflow: 'hidden' }}>
                     <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Jessica&backgroundColor=b6e3f4" alt="Female AI" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text)' }}>Jessica (HR)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAvatar('male')}
                  className={avatar === 'male' ? 'glass-card glow-purple' : 'glass-card'}
                  style={{ padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', borderColor: avatar === 'male' ? 'var(--color-accent)' : '' }}
                >
                  <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--color-surface-2)', overflow: 'hidden' }}>
                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus&backgroundColor=c0aede" alt="Male AI" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text)' }}>Marcus (Tech)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Guidelines Side */}
          <div className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: 'var(--color-surface-2)' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: '1.5rem', fontFamily: "'Space Grotesk', sans-serif" }}>Equipment Check</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', padding: '1.25rem', borderRadius: '12px', background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                  <div style={{ padding: '0.5rem', background: 'var(--color-primary-glow)', borderRadius: '8px', color: 'var(--color-primary)' }}>
                    <Video size={20} />
                  </div>
                  <div>
                    <h4 style={{ color: 'var(--color-text)', fontWeight: 600, fontSize: '0.95rem' }}>Camera Access</h4>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginTop: '0.25rem', lineHeight: 1.5 }}>Please ensure your camera is positioned at eye level and the room is well lit.</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', padding: '1.25rem', borderRadius: '12px', background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                  <div style={{ padding: '0.5rem', background: 'var(--color-accent-glow)', borderRadius: '8px', color: 'var(--color-accent)' }}>
                    <Mic size={20} />
                  </div>
                  <div>
                    <h4 style={{ color: 'var(--color-text)', fontWeight: 600, fontSize: '0.95rem' }}>Microphone Access</h4>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginTop: '0.25rem', lineHeight: 1.5 }}>Use a headset or ensure you are in a quiet room to allow the AI to hear you clearly.</p>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handleStart}
              disabled={!jobRole || loading}
              className="btn-primary"
              style={{ width: '100%', marginTop: '2rem', padding: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '1.1rem', opacity: (!jobRole || loading) ? 0.5 : 1, cursor: (!jobRole || loading) ? 'not-allowed' : 'pointer' }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating Questions...
                </>
              ) : (
                <>
                  Enter Interview Room
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default MockInterviewSetup;
