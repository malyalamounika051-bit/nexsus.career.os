import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Zap, Brain, ArrowRight, CheckCircle2, Star, Dna, Map, MessageSquare, FileSearch, Play, Shield, Mic } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const features = [
  { icon: Dna, title: 'Career DNA Engine', desc: 'Discover your career identity through AI-powered personality and skill profiling.', color: '#0ea5e9' },
  { icon: Map, title: 'AI Roadmap Generator', desc: 'Dynamic learning paths with resources, projects, and certifications for any career.', color: '#a855f7' },
  { icon: MessageSquare, title: 'AI Mentor Chat', desc: 'Personal career advisor that knows your profile, history, and market trends.', color: '#10b981' },
  { icon: Mic, title: 'AI Mock Interviewer', desc: 'Real-time mock interviews with an AI avatar, speech-to-text, and detailed feedback reports.', color: '#f59e0b' },
  { icon: FileSearch, title: 'Skill Gap Analyzer', desc: 'Upload your resume and compare skills against real market requirements.', color: '#06b6d4' },
  { icon: Play, title: 'Career Simulator', desc: 'Experience "A Day in the Life" for any career with immersive simulations.', color: '#ec4899' },
];

const stats = [
  { value: '50K+', label: 'Career Assessments' },
  { value: '6', label: 'Career Domains' },
  { value: '95%', label: 'Accuracy Rate' },
  { value: '10K+', label: 'Community Members' },
];

const LandingPage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', overflowX: 'hidden' }}>
      {/* Background orbs */}
      <div className="orb" style={{ width: 600, height: 600, background: '#3b82f6', top: -200, left: -200 }} />
      <div className="orb" style={{ width: 500, height: 500, background: '#8b5cf6', top: 100, right: -200, animationDelay: '3s' }} />
      <div className="orb" style={{ width: 400, height: 400, background: '#10b981', bottom: 100, left: '30%', animationDelay: '6s' }} />

      {/* Header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--color-border)',
        padding: '0.875rem 1.5rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(8,12,20,0.8)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={18} color="white" />
          </div>
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '1.1rem', color: 'var(--color-text)' }}>Nexus Career OS</span>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {isAuthenticated ? (
            <button className="btn-primary" onClick={() => navigate('/dashboard')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
              Dashboard <ArrowRight size={16} />
            </button>
          ) : (
            <>
              <button className="btn-ghost" onClick={() => navigate('/login')} style={{ fontSize: '0.9rem' }}>Login</button>
              <button className="btn-primary" onClick={() => navigate('/signup')} style={{ fontSize: '0.9rem' }}>Get Started</button>
            </>
          )}
        </div>
      </header>

      {/* Hero */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '6rem 2rem 4rem', textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 1rem', borderRadius: 99, background: 'var(--color-primary-glow)', border: '1px solid #3b82f640', marginBottom: '1.5rem' }}>
            <Star size={14} color="var(--color-primary-light)" />
            <span style={{ fontSize: '0.8rem', color: 'var(--color-primary-light)', fontWeight: 500 }}>AI-Powered Career Intelligence Platform</span>
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }}
          style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: 900, lineHeight: 1.1, marginBottom: '1.5rem', fontFamily: "'Space Grotesk', sans-serif" }}
        >
           Discover Your <span className="gradient-text">Perfect Career</span><br />With AI Intelligence
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 }}
          style={{ fontSize: '1.2rem', color: 'var(--color-text-muted)', maxWidth: 600, margin: '0 auto 2.5rem', lineHeight: 1.7 }}
        >
          Answer 8 intelligent questions and unlock your Career DNA — personalized career matches, roadmap generation, and skill gap analysis.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.3 }}
          className="hero-btns"
          style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}
        >
          <button
            className="btn-primary"
            onClick={() => navigate(isAuthenticated ? '/career-dna' : '/signup')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem 2rem', fontSize: '1rem' }}
          >
            <Dna size={20} /> Discover Career DNA <ArrowRight size={18} />
          </button>
          <button
            className="btn-ghost"
            onClick={() => navigate(isAuthenticated ? '/mock-interview/setup' : '/login')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem 2rem', fontSize: '1rem' }}
          >
            <Mic size={18} /> Practice Mock Interview
          </button>
        </motion.div>
      </section>

      {/* Stats bar */}
      <motion.section
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
        style={{ maxWidth: 1000, margin: '0 auto 5rem', padding: '0 2rem', position: 'relative', zIndex: 1 }}
      >
        <div className="stats-grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1px', background: 'var(--color-border)', borderRadius: 16, overflow: 'hidden', border: '1px solid var(--color-border)' }}>
          {stats.map((s, i) => (
            <div key={i} style={{ background: 'var(--color-surface)', padding: '1.5rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-text)' }} className="gradient-text">{s.value}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Features */}
      <section style={{ maxWidth: 1200, margin: '0 auto 6rem', padding: '0 2rem', position: 'relative', zIndex: 1 }}>
        <motion.h2
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          style={{ textAlign: 'center', fontSize: '2rem', fontWeight: 800, marginBottom: '3rem', fontFamily: "'Space Grotesk', sans-serif" }}
        >
          Everything you need to <span className="gradient-text">own your career</span>
        </motion.h2>
        <div className="features-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass-card"
              style={{ padding: '2rem' }}
            >
              <div style={{ width: 52, height: 52, borderRadius: 14, background: `${f.color}20`, border: `1px solid ${f.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                <f.icon size={24} color={f.color} />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--color-text)' }}>{f.title}</h3>
              <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.6, fontSize: '0.9rem' }}>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ maxWidth: 700, margin: '0 auto 6rem', padding: '0 2rem', position: 'relative', zIndex: 1 }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.7 }}
          className="glass-card"
          style={{ padding: '3rem', textAlign: 'center', background: 'linear-gradient(135deg, #3b82f610, #8b5cf610)' }}
        >
          <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '1rem', fontFamily: "'Space Grotesk', sans-serif" }}>Ready to find your path?</h2>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>Join thousands who found their dream career with Nexus.</p>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            {['Free to use', 'No credit card', 'Instant results'].map(t => (
              <div key={t} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--color-text-dim)' }}>
                <CheckCircle2 size={14} color="var(--color-success)" /> {t}
              </div>
            ))}
          </div>
          <button className="btn-primary" onClick={() => navigate('/signup')} style={{ padding: '1rem 2.5rem', fontSize: '1rem' }}>
            Start Free Assessment →
          </button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--color-border)', padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
        © 2024 Nexus Career OS. Built with ❤️ for aspiring professionals.
      </footer>
    </div>
  );
};

export default LandingPage;
