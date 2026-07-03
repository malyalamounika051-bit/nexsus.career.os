import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Video, Mic, Briefcase, Settings, ArrowRight, Loader2, User, Sparkles, ShieldAlert, Laptop } from 'lucide-react';
import api from '../services/api';

export default function MockInterviewSetup() {
  const navigate = useNavigate();
  const [jobRole, setJobRole] = useState('');
  const [difficulty, setDifficulty] = useState('Intermediate'); // Beginner, Intermediate, Advanced
  const [track, setTrack] = useState('Technical'); // Technical, Behavioral, System Design, Company-Specific
  const [company, setCompany] = useState('');
  const [avatar, setAvatar] = useState('female'); // female (Jessica), male (Marcus)
  const [loading, setLoading] = useState(false);

  const handleStart = async (e) => {
    e.preventDefault();
    if (!jobRole) return;
    
    setLoading(true);
    try {
      const response = await api.post('/interview/start', { jobRole, difficulty, track, company });
      if (response.data.success) {
        navigate('/mock-interview/room', { 
          state: { 
            interviewId: response.data.data._id,
            jobRole,
            difficulty,
            track,
            company,
            avatar,
            questions: response.data.data.questions || [
              `Tell me about a challenging project you built in your target role of ${jobRole}.`,
              `How do you optimize system latency and handle scale?`,
              `Describe a situation where you had a conflict with a team member. How did you resolve it?`
            ]
          } 
        });
      }
    } catch (error) {
      console.error('Error starting interview:', error);
      // Fallback local start if API fails
      navigate('/mock-interview/room', { 
        state: { 
          interviewId: `fallback-${Date.now()}`,
          jobRole,
          difficulty,
          track,
          company,
          avatar,
          questions: [
            `Tell me about a challenging project you built in your target role of ${jobRole}.`,
            `How do you optimize system performance and handle scale?`,
            `Describe a situation where you had a conflict with a teammate. How did you resolve it?`
          ]
        } 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-shell" style={{ display: 'flex', minHeight: '100vh', width: '100vw', background: 'var(--color-bg)' }}>
      <Sidebar />
      <main className="app-main" style={{ marginLeft: 'var(--sidebar-width)', padding: '3rem 2rem', flex: 1, overflowY: 'auto' }}>
        
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          
          {/* Header */}
          <div style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '2rem' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'var(--color-primary-glow)', padding: '0.5rem 1.25rem', borderRadius: '99px', marginBottom: '1rem' }}>
              <Video size={16} color="var(--color-primary)" />
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-primary)' }}>WhisperFlow Realtime Engine</span>
            </div>
            <h1 style={{ fontSize: '2.25rem', fontWeight: 900, color: 'var(--color-text)', margin: 0 }}>AI Mock Interview Room</h1>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '1rem', marginTop: '0.5rem', lineHeight: 1.6 }}>
              Practice interviews in a high-fidelity video meeting interface. WhisperFlow noise-cancellation and speech-recognition engines will transcribe your responses with high accuracy.
            </p>
          </div>

          <form onSubmit={handleStart} style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '2.5rem' }}>
            
            {/* Left Options Form */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              
              {/* Target Job Role */}
              <div className="glass-card" style={{ padding: '1.75rem', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-text)' }}>1. Profile & Role Target</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Target Job Role</label>
                  <input
                    type="text"
                    value={jobRole}
                    onChange={(e) => setJobRole(e.target.value)}
                    placeholder="e.g. Senior Frontend Engineer, Product Manager"
                    style={{ width: '100%', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)', padding: '0.85rem 1.15rem', borderRadius: '12px', fontSize: '1.1rem', outline: 'none' }}
                    required
                  />
                </div>
              </div>

              {/* Tracks & Difficulty */}
              <div className="glass-card" style={{ padding: '1.75rem', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-text)' }}>2. Settings & Difficulty</h3>
                
                {/* Track */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Interview Track</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    {['Technical', 'Behavioral', 'System Design', 'Company-Specific'].map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTrack(t)}
                        style={{
                          padding: '0.75rem', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
                          background: track === t ? 'var(--color-primary-glow)' : 'var(--color-surface-2)',
                          border: track === t ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                          color: track === t ? 'var(--color-primary)' : 'var(--color-text)'
                        }}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Company Name */}
                {track === 'Company-Specific' && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Company Name</label>
                    <input
                      type="text"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder="e.g. Google, Amazon, Stripe"
                      style={{ width: '100%', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)', padding: '0.75rem 1rem', borderRadius: '10px', fontSize: '0.95rem', outline: 'none' }}
                    />
                  </motion.div>
                )}

                {/* Difficulty */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Difficulty Level</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                    {['Beginner', 'Intermediate', 'Advanced'].map(d => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setDifficulty(d)}
                        style={{
                          padding: '0.75rem', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
                          background: difficulty === d ? 'var(--color-primary-glow)' : 'var(--color-surface-2)',
                          border: difficulty === d ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                          color: difficulty === d ? 'var(--color-primary)' : 'var(--color-text)'
                        }}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

              </div>

              {/* Persona Selection */}
              <div className="glass-card" style={{ padding: '1.75rem', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-text)' }}>3. Interviewer Persona</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                  <button
                    type="button"
                    onClick={() => setAvatar('female')}
                    style={{
                      padding: '1.25rem', borderRadius: '16px', border: `2px solid ${avatar === 'female' ? 'var(--color-primary)' : 'var(--color-border)'}`,
                      background: avatar === 'female' ? 'var(--color-primary-glow)' : 'var(--color-surface-2)', cursor: 'pointer', transition: 'all 0.2s',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem'
                    }}
                  >
                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Jessica&backgroundColor=b6e3f4" alt="Jessica" style={{ width: '64px', height: '64px', borderRadius: '50%' }} />
                    <span style={{ fontWeight: 800, color: 'var(--color-text)' }}>Jessica (HR Executive)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAvatar('male')}
                    style={{
                      padding: '1.25rem', borderRadius: '16px', border: `2px solid ${avatar === 'male' ? 'var(--color-primary)' : 'var(--color-border)'}`,
                      background: avatar === 'male' ? 'var(--color-primary-glow)' : 'var(--color-surface-2)', cursor: 'pointer', transition: 'all 0.2s',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem'
                    }}
                  >
                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus&backgroundColor=c0aede" alt="Marcus" style={{ width: '64px', height: '64px', borderRadius: '50%' }} />
                    <span style={{ fontWeight: 800, color: 'var(--color-text)' }}>Marcus (Tech Architect)</span>
                  </button>
                </div>
              </div>

            </div>

            {/* Right Instructions / Audio Audit Panel */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              
              <div className="glass-card" style={{ padding: '2rem', border: '1px solid var(--color-border)', background: 'var(--color-surface-2)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-text)' }}>Equipment Verification</h3>
                
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div style={{ padding: '0.5rem', background: 'var(--color-primary-glow)', borderRadius: '8px', color: 'var(--color-primary)' }}><Mic size={18} /></div>
                  <div>
                    <h5 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-text)' }}>WhisperFlow Voice Filter</h5>
                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: 'var(--color-text-muted)', lineHeight: 1.4 }}>Live ambient noise-cancellation is enabled. Practice in a quiet room to reduce feedback.</p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div style={{ padding: '0.5rem', background: 'var(--color-primary-glow)', borderRadius: '8px', color: 'var(--color-primary)' }}><Laptop size={18} /></div>
                  <div>
                    <h5 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-text)' }}>Immersive Interviewer</h5>
                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: 'var(--color-text-muted)', lineHeight: 1.4 }}>The room renders facial animations, real-time eyetracking indicators, and lip-sync waves.</p>
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={loading || !jobRole} 
                  className="btn-primary" 
                  style={{ width: '100%', padding: '1rem', fontSize: '0.95rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', borderRadius: '12px', marginTop: '1rem' }}
                >
                  {loading ? <><Loader2 size={16} className="animate-spin" /> Preparing Room...</> : <><ArrowRight size={16} /> Enter Meeting Room</>}
                </button>
              </div>

            </div>

          </form>

        </div>
        
      </main>
    </div>
  );
}
