import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import {
  Zap, Mail, Lock, User, Eye, EyeOff,
  AlertCircle, CheckCircle2, Sparkles, X, Settings
} from 'lucide-react';

/* ── SVG Icons ─────────────────────────────────────────────────── */
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908C16.658 14.013 17.64 11.705 17.64 9.2z" fill="#4285F4"/>
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
    <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
  </svg>
);

const LinkedInIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="#0A66C2">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);

const Divider = ({ label }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '1.25rem 0' }}>
    <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 500, whiteSpace: 'nowrap' }}>{label}</span>
    <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
  </div>
);

/* ── OAuth Modal ─────────────────────────────────────────────────── */
const OAuthModal = ({ provider, onClose }) => (
  <AnimatePresence>
    {provider && (
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: '#00000080', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          onClick={e => e.stopPropagation()}
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 20, padding: '2rem', maxWidth: 420, width: '100%', position: 'relative' }}
        >
          <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'var(--color-surface-2)', border: 'none', borderRadius: 8, padding: '6px', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex' }}>
            <X size={16} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: '#f59e0b15', border: '1px solid #f59e0b40', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Settings size={22} color="#f59e0b" />
            </div>
            <div>
              <h3 style={{ fontWeight: 700, fontSize: '1rem', margin: 0 }}>{provider} OAuth — Setup Required</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', margin: 0 }}>One-time API credentials needed</p>
            </div>
          </div>
          <p style={{ color: 'var(--color-text-dim)', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '1.25rem' }}>
            {provider} login requires API credentials added to <code style={{ background: 'var(--color-surface-2)', padding: '1px 6px', borderRadius: 4, fontSize: '0.8rem' }}>backend/.env</code>.
            {provider === 'Google' && ' Get them at console.cloud.google.com'}
          </p>
          <div style={{ background: '#10b98115', border: '1px solid #10b98140', borderRadius: 12, padding: '1rem', marginBottom: '1.25rem' }}>
            <p style={{ fontSize: '0.83rem', color: '#6ee7b7', margin: 0, fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle2 size={15} /> Use Demo Account or Email signup instead — works right now!
            </p>
          </div>
          <button onClick={onClose} className="btn-primary" style={{ width: '100%', padding: '0.75rem' }}>
            OK, I'll use email or demo
          </button>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

/* ── Password Strength ───────────────────────────────────────────── */
const getStrength = p => {
  if (!p) return { level: 0, label: '', color: '' };
  if (p.length < 6) return { level: 1, label: 'Too short', color: '#ef4444' };
  if (p.length < 8) return { level: 2, label: 'Weak', color: '#f59e0b' };
  if (/[A-Z]/.test(p) && /[0-9]/.test(p)) return { level: 4, label: 'Strong', color: '#10b981' };
  return { level: 3, label: 'Good', color: '#3b82f6' };
};

/* ── Main Signup Page ────────────────────────────────────────────── */
const SignupPage = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [error, setError] = useState('');
  const [oauthModal, setOauthModal] = useState(null);
  const { register, googleLogin, updateUser } = useAuth();
  const navigate = useNavigate();

  const strength = getStrength(form.password);
  const handleChange = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) return setError('Passwords do not match.');
    if (form.password.length < 6) return setError('Password must be at least 6 characters.');
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      console.error('Firebase Signup Error:', err.code, err.message);
      if (err.code === 'auth/email-already-in-use') {
        setError('User already exists. Please sign in');
      } else {
        setError('Signup failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async () => {
    setDemoLoading(true);
    setError('');
    try {
      const { data } = await authService.demoLogin();
      localStorage.setItem('nexus_token', data.token);
      localStorage.setItem('nexus_user', JSON.stringify(data.user));
      updateUser(data.user);
      navigate('/dashboard');
    } catch {
      setError('Demo login failed. Make sure the backend is running.');
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <>
      <OAuthModal provider={oauthModal} onClose={() => setOauthModal(null)} />

      <div style={{ minHeight: '100vh', background: 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div className="orb" style={{ width: 500, height: 500, background: '#8b5cf6', top: -100, right: -150, opacity: 0.1 }} />
        <div className="orb" style={{ width: 400, height: 400, background: '#3b82f6', bottom: -100, left: -150, opacity: 0.1 }} />

        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5 }}
          style={{ width: '100%', maxWidth: 460, position: 'relative', zIndex: 1 }}
        >
          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Zap size={24} color="white" />
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '1.2rem', color: 'var(--color-text)' }}>Nexus</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Career OS</div>
              </div>
            </Link>
          </div>

          <div className="glass-card" style={{ padding: '2.5rem' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, textAlign: 'center', marginBottom: '0.4rem', fontFamily: "'Space Grotesk', sans-serif" }}>
              Create your account
            </h1>
            <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
              Start your career journey — free forever
            </p>

            {/* ── DEMO ── */}
            <motion.button
              id="demo-signup"
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={handleDemo}
              disabled={demoLoading}
              style={{
                width: '100%', padding: '0.9rem', borderRadius: 12,
                cursor: demoLoading ? 'not-allowed' : 'pointer',
                background: 'linear-gradient(135deg, #8b5cf625, #3b82f625)',
                border: '1px solid #8b5cf650',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
                fontWeight: 700, fontSize: '0.9rem', color: '#c4b5fd',
                marginBottom: '0.75rem', transition: 'all 0.2s',
                opacity: demoLoading ? 0.7 : 1,
              }}
            >
              <Sparkles size={17} />
              {demoLoading ? 'Loading...' : 'Try Demo — No signup needed'}
            </motion.button>

            {/* ── GOOGLE ── */}
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={async () => {
                try {
                  await googleLogin();
                  navigate('/dashboard');
                } catch (err) {
                  console.error('Google Signup Error:', err);
                  setError('Google signup failed. Please try again.');
                }
              }}
              style={{
                width: '100%', padding: '0.875rem', borderRadius: 12, cursor: 'pointer',
                background: 'var(--color-surface-2)', border: '1px solid var(--color-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
                fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-text)',
                marginBottom: '0.75rem', transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#4285F4'; e.currentTarget.style.background = '#4285F408'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.background = 'var(--color-surface-2)'; }}
            >
              <GoogleIcon /> Continue with Google
            </motion.button>

            {/* ── LINKEDIN ── */}
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => setOauthModal('LinkedIn')}
              style={{
                width: '100%', padding: '0.875rem', borderRadius: 12, cursor: 'pointer',
                background: 'var(--color-surface-2)', border: '1px solid var(--color-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
                fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-text)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#0A66C2'; e.currentTarget.style.background = '#0A66C208'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.background = 'var(--color-surface-2)'; }}
            >
              <LinkedInIcon /> Continue with LinkedIn
            </motion.button>

            <Divider label="or create account with email" />

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', padding: '0.75rem 1rem', background: '#ef444420', border: '1px solid #ef444440', borderRadius: 10, marginBottom: '1rem', color: '#fca5a5', fontSize: '0.875rem' }}
                >
                  <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Name */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-text-dim)', marginBottom: '0.5rem' }}>Full Name</label>
                <div style={{ position: 'relative' }}>
                  <User size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', pointerEvents: 'none' }} />
                  <input
                    id="signup-name" className="input" type="text" name="name"
                    value={form.name} onChange={handleChange}
                    placeholder="John Doe" autoComplete="name" required
                    style={{ paddingLeft: '2.5rem' }}
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-text-dim)', marginBottom: '0.5rem' }}>Email address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', pointerEvents: 'none' }} />
                  <input
                    id="signup-email" className="input" type="email" name="email"
                    value={form.email} onChange={handleChange}
                    placeholder="you@example.com" autoComplete="email" required
                    style={{ paddingLeft: '2.5rem' }}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-text-dim)', marginBottom: '0.5rem' }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', pointerEvents: 'none' }} />
                  <input
                    id="signup-password" className="input"
                    type={showPass ? 'text' : 'password'}
                    name="password" value={form.password} onChange={handleChange}
                    placeholder="Min. 6 characters" autoComplete="new-password" required
                    style={{ paddingLeft: '2.5rem', paddingRight: '2.75rem' }}
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex', padding: 4 }}>
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {form.password && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                      {[1,2,3,4].map(i => (
                        <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= strength.level ? strength.color : 'var(--color-border)', transition: 'background 0.3s' }} />
                      ))}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: strength.color }}>{strength.label}</span>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-text-dim)', marginBottom: '0.5rem' }}>Confirm Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', pointerEvents: 'none' }} />
                  <input
                    id="signup-confirm" className="input" type="password" name="confirm"
                    value={form.confirm} onChange={handleChange}
                    placeholder="••••••••" autoComplete="new-password" required
                    style={{ paddingLeft: '2.5rem', paddingRight: '2.75rem' }}
                  />
                  {form.confirm && (
                    <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: form.password === form.confirm ? '#10b981' : '#ef4444' }}>
                      <CheckCircle2 size={16} />
                    </div>
                  )}
                </div>
              </div>

              <motion.button
                id="signup-submit"
                type="submit"
                className="btn-primary"
                whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                disabled={loading}
                style={{ width: '100%', padding: '0.9rem', fontSize: '1rem', marginTop: '0.25rem', opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
              >
                {loading ? 'Creating account...' : 'Create Account →'}
              </motion.button>
            </form>

            <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', marginTop: '1.5rem', fontSize: '0.875rem' }}>
              Already have an account?{' '}
              <Link to="/login" style={{ color: 'var(--color-primary-light)', fontWeight: 600, textDecoration: 'none' }}>
                Sign in →
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default SignupPage;
