import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Video, Mic, Briefcase, Settings, ArrowRight, Loader2, User, Sparkles, ShieldAlert, Laptop, Clock, Globe } from 'lucide-react';
import api from '../services/api';
import Sidebar from '../components/Sidebar';

export default function MockInterviewSetup() {
  const navigate = useNavigate();
  const [jobRole, setJobRole] = useState('');
  const [difficulty, setDifficulty] = useState('Medium'); // Basic, Medium, Tough
  const [track, setTrack] = useState('Technical');
  const [company, setCompany] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('Entry'); // Intern, Entry, Mid, Senior
  const [durationLimit, setDurationLimit] = useState(15);
  const [avatar, setAvatar] = useState('female'); // female (Jessica), male (Marcus)
  const [loading, setLoading] = useState(false);

  const tracks = [
    'Technical', 'HR', 'Behavioral', 'System Design', 'Coding',
    'Managerial', 'Case Study', 'Product', 'Leadership', 'Company-Specific'
  ];

  const companies = [
    'Google', 'Microsoft', 'Amazon', 'Meta', 'Apple', 'Netflix',
    'OpenAI', 'NVIDIA', 'Adobe', 'Salesforce', 'TCS', 'Deloitte'
  ];

  const handleStart = async (e) => {
    e.preventDefault();
    if (!jobRole) return;
    
    setLoading(true);
    try {
      const response = await api.post('/interview/start', { 
        jobRole, 
        difficulty, 
        track, 
        company: track === 'Company-Specific' ? company : '',
        experienceLevel,
        durationLimit,
        language: 'en'
      });
      if (response.data.success) {
        navigate('/mock-interview/room', { 
          state: { 
            interviewId: response.data.data._id,
            jobRole,
            difficulty,
            track,
            company,
            experienceLevel,
            durationLimit,
            avatar,
            questions: response.data.data.questions.map(q => q.text) || []
          } 
        });
      }
    } catch (error) {
      console.error('Error starting interview:', error);
      // Fallback
      navigate('/mock-interview/room', { 
        state: { 
          interviewId: `fallback-${Date.now()}`,
          jobRole,
          difficulty,
          track,
          company,
          experienceLevel,
          durationLimit,
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
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(139, 92, 246, 0.1)', padding: '0.5rem 1.25rem', borderRadius: '99px', marginBottom: '1rem', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
              <Sparkles size={16} color="#8b5cf6" />
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#8b5cf6' }}>Premium AI Recruiter Simulation</span>
            </div>
            <h1 style={{ fontSize: '2.25rem', fontWeight: 900, color: 'var(--color-text)', margin: 0 }}>Setup AI Mock Session</h1>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '1rem', marginTop: '0.5rem', lineHeight: 1.6 }}>
              Tailor a dynamic, conversational interview simulation. The AI recruiter automatically extracts details from your Smart Profile to evaluate matching expertise, STAR behavioral metrics, and communication fluency.
            </p>
          </div>

          <form onSubmit={handleStart} style={{ display: 'grid', gridTemplateColumns: '1.20fr 0.8fr', gap: '2.5rem' }}>
            
            {/* Left Options Form */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              
              {/* Target Job Role */}
              <div className="glass-card" style={{ padding: '1.75rem', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-text)' }}>1. Profile & Target Role</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Target Job Role</label>
                  <input
                    type="text"
                    value={jobRole}
                    onChange={(e) => setJobRole(e.target.value)}
                    placeholder="e.g. Frontend Engineer, Product Architect, HR Manager"
                    style={{ width: '100%', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)', padding: '0.85rem 1.15rem', borderRadius: '12px', fontSize: '1.05rem', outline: 'none' }}
                    required
                  />
                </div>
              </div>

              {/* Tracks & Settings */}
              <div className="glass-card" style={{ padding: '1.75rem', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-text)' }}>2. Settings & Difficulty</h3>
                
                {/* Track */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Interview Track</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                    {tracks.map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTrack(t)}
                        style={{
                          padding: '0.75rem', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
                          background: track === t ? 'rgba(139, 92, 246, 0.15)' : 'var(--color-surface-2)',
                          border: track === t ? '2px solid #8b5cf6' : '1px solid var(--color-border)',
                          color: track === t ? '#8b5cf6' : 'var(--color-text)'
                        }}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Company Name */}
                {track === 'Company-Specific' && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Target Company</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      {companies.map(c => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setCompany(c)}
                          style={{
                            padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                            background: company === c ? 'rgba(6, 182, 212, 0.15)' : 'var(--color-surface-2)',
                            border: company === c ? '1px solid #06b6d4' : '1px solid var(--color-border)',
                            color: company === c ? '#06b6d4' : 'var(--color-text-muted)'
                          }}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder="Or enter any custom company (e.g. Stripe, Airbnb)"
                      style={{ width: '100%', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)', padding: '0.75rem 1rem', borderRadius: '10px', fontSize: '0.95rem', outline: 'none' }}
                    />
                  </motion.div>
                )}

                {/* Experience Level */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Target Experience Level</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
                    {['Intern', 'Entry', 'Mid', 'Senior'].map(lvl => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setExperienceLevel(lvl)}
                        style={{
                          padding: '0.75rem', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
                          background: experienceLevel === lvl ? 'rgba(245, 158, 11, 0.15)' : 'var(--color-surface-2)',
                          border: experienceLevel === lvl ? '2px solid #f59e0b' : '1px solid var(--color-border)',
                          color: experienceLevel === lvl ? '#f59e0b' : 'var(--color-text)'
                        }}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Difficulty */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Difficulty Level</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                    {[
                      { value: 'Basic', label: 'Basic' },
                      { value: 'Medium', label: 'Medium' },
                      { value: 'Tough', label: 'Tough' }
                    ].map(d => (
                      <button
                        key={d.value}
                        type="button"
                        onClick={() => setDifficulty(d.value)}
                        style={{
                          padding: '0.75rem', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
                          background: difficulty === d.value ? 'rgba(6, 182, 212, 0.15)' : 'var(--color-surface-2)',
                          border: difficulty === d.value ? '2px solid #06b6d4' : '1px solid var(--color-border)',
                          color: difficulty === d.value ? '#06b6d4' : 'var(--color-text)'
                        }}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>

              </div>

              {/* Persona Selection */}
              <div className="glass-card" style={{ padding: '1.75rem', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-text)' }}>3. AI Recruiter Persona</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                  <button
                    type="button"
                    onClick={() => setAvatar('female')}
                    style={{
                      padding: '1.25rem', borderRadius: '16px', border: `2px solid ${avatar === 'female' ? '#8b5cf6' : 'var(--color-border)'}`,
                      background: avatar === 'female' ? 'rgba(139, 92, 246, 0.05)' : 'var(--color-surface-2)', cursor: 'pointer', transition: 'all 0.2s',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem'
                    }}
                  >
                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Jessica&backgroundColor=b6e3f4" alt="Jessica" style={{ width: '64px', height: '64px', borderRadius: '50%' }} />
                    <span style={{ fontWeight: 800, color: 'var(--color-text)' }}>Jessica (HR Lead)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAvatar('male')}
                    style={{
                      padding: '1.25rem', borderRadius: '16px', border: `2px solid ${avatar === 'male' ? '#8b5cf6' : 'var(--color-border)'}`,
                      background: avatar === 'male' ? 'rgba(139, 92, 246, 0.05)' : 'var(--color-surface-2)', cursor: 'pointer', transition: 'all 0.2s',
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
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-text)' }}>Audio & Video Audit</h3>
                
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div style={{ padding: '0.5rem', background: 'rgba(6, 182, 212, 0.1)', borderRadius: '8px', color: '#06b6d4' }}><Mic size={18} /></div>
                  <div>
                    <h5 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-text)' }}>High-Accuracy ASR Engine</h5>
                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: 'var(--color-text-muted)', lineHeight: 1.4 }}>Integrated Web Speech API translates your voice. Speak clearly near your mic.</p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div style={{ padding: '0.5rem', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '8px', color: '#f59e0b' }}><Clock size={18} /></div>
                  <div>
                    <h5 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-text)' }}>Interview Time Limits</h5>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem' }}>
                      {[10, 15, 20].map(mins => (
                        <button
                          key={mins}
                          type="button"
                          onClick={() => setDurationLimit(mins)}
                          style={{
                            padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer',
                            background: durationLimit === mins ? '#f59e0b' : 'var(--color-surface-2)',
                            color: durationLimit === mins ? '#000' : 'var(--color-text-muted)',
                            border: '1px solid var(--color-border)'
                          }}
                        >
                          {mins} Min
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div style={{ padding: '0.5rem', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '8px', color: '#8b5cf6' }}><Globe size={18} /></div>
                  <div>
                    <h5 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-text)' }}>Grounding Engine</h5>
                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: 'var(--color-text-muted)', lineHeight: 1.4 }}>Auto-grounding matches your profile skills (React, Node, Python) to personalize questions.</p>
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={loading || !jobRole} 
                  className="btn-primary" 
                  style={{ width: '100%', padding: '1rem', fontSize: '0.95rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifycontent: 'center', gap: '0.5rem', borderRadius: '12px', marginTop: '1rem', justifyContent: 'center' }}
                >
                  {loading ? <><Loader2 size={16} className="animate-spin" /> Grounding Profile...</> : <><ArrowRight size={16} /> Start Session</>}
                </button>
              </div>

            </div>

          </form>

        </div>
        
      </main>
    </div>
  );
}
