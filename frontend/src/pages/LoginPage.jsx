import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import {
  Zap, Mail, Lock, Eye, EyeOff, AlertCircle,
  Sparkles, X, Settings, CheckCircle2
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



const Divider = ({ label }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '1.5rem 0' }}>
    <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 500, whiteSpace: 'nowrap' }}>{label}</span>
    <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
  </div>
);

/* ── OAuth "Not Configured" Modal ───────────────────────────────── */
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
              <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', margin: 0 }}>One-time configuration needed</p>
            </div>
          </div>

          <p style={{ color: 'var(--color-text-dim)', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '1.25rem' }}>
            To enable {provider} login, you need to add API credentials to your <code style={{ background: 'var(--color-surface-2)', padding: '1px 6px', borderRadius: 4, fontSize: '0.8rem' }}>backend/.env</code> file.
          </p>

          {provider === 'Google' && (
            <ol style={{ color: 'var(--color-text-dim)', fontSize: '0.83rem', lineHeight: 2, margin: '0 0 1.25rem', paddingLeft: '1.25rem' }}>
              <li>Go to <a href="https://console.cloud.google.com" target="_blank" rel="noreferrer" style={{ color: '#93c5fd' }}>console.cloud.google.com</a></li>
              <li>Create a project → Enable <strong style={{ color: 'var(--color-text)' }}>Google+ API</strong></li>
              <li>Create <strong style={{ color: 'var(--color-text)' }}>OAuth 2.0 Credentials</strong></li>
              <li>Set redirect URI: <code style={{ background: 'var(--color-surface-2)', padding: '1px 5px', borderRadius: 3, fontSize: '0.76rem' }}>http://localhost:5000/api/auth/google/callback</code></li>
              <li>Add to <code style={{ background: 'var(--color-surface-2)', padding: '1px 5px', borderRadius: 3, fontSize: '0.76rem' }}>backend/.env</code>:<br/>
                <code style={{ background: 'var(--color-surface-2)', padding: '4px 8px', borderRadius: 4, display: 'block', marginTop: 4, fontSize: '0.75rem', color: '#86efac' }}>
                  GOOGLE_CLIENT_ID=your_id<br/>
                  GOOGLE_CLIENT_SECRET=your_secret
                </code>
              </li>
            </ol>
          )}

          <div style={{ background: '#10b98115', border: '1px solid #10b98140', borderRadius: 12, padding: '1rem', marginBottom: '1.25rem' }}>
            <p style={{ fontSize: '0.83rem', color: '#6ee7b7', margin: 0, fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle2 size={15} /> Use the Demo Account instead — it works right now!
            </p>
          </div>

          <button
            onClick={onClose}
            className="btn-primary"
            style={{ width: '100%', padding: '0.75rem' }}
          >
            Got it — I'll use Demo or Email
          </button>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

/* ── Main Login Page ────────────────────────────────────────────── */
const LoginPage = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [error, setError] = useState('');
  const [oauthModal, setOauthModal] = useState(null); // 'Google' | null
  const [searchParams] = useSearchParams();
  const { login, googleLogin, updateUser } = useAuth();
  const navigate = useNavigate();

  const oauthError = searchParams.get('error');

  const handleChange = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      console.error('Firebase Login Error:', err.code, err.message);
      // Requirement: If credentials are incorrect, show "Email or password is incorrect"
      setError('Email or password is incorrect');
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
      setError('Demo login failed. Please make sure the backend server is running.');
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <>
      <OAuthModal provider={oauthModal} onClose={() => setOauthModal(null)} />

      <div style={{ minHeight: '100vh', background: 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div className="orb" style={{ width: 500, height: 500, background: '#3b82f6', top: -100, left: -150, opacity: 0.1 }} />
        <div className="orb" style={{ width: 400, height: 400, background: '#8b5cf6', bottom: -100, right: -150, opacity: 0.1 }} />

        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5 }}
          style={{ width: '100%', maxWidth: 440, position: 'relative', zIndex: 1 }}
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
              Welcome back
            </h1>
            <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', marginBottom: '1.75rem', fontSize: '0.875rem' }}>
              Sign in to continue your career journey
            </p>

            {/* ── DEMO LOGIN ── */}
            <motion.button
              id="demo-login"
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={handleDemo}
              disabled={demoLoading}
              style={{
                width: '100%', padding: '0.9rem', borderRadius: 12, cursor: demoLoading ? 'not-allowed' : 'pointer',
                background: 'linear-gradient(135deg, #8b5cf625, #3b82f625)',
                border: '1px solid #8b5cf650',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
                fontWeight: 700, fontSize: '0.95rem', color: '#c4b5fd',
                marginBottom: '0.75rem', transition: 'all 0.2s',
                opacity: demoLoading ? 0.7 : 1,
              }}
            >
              <Sparkles size={17} />
              {demoLoading ? 'Signing in...' : 'Try Demo Account — No signup needed'}
            </motion.button>

            {/* ── GOOGLE ── */}
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={async () => {
                try {
                  await googleLogin();
                  navigate('/dashboard');
                } catch (err) {
                  console.error('Google Login Error:', err);
                  setError('Google sign-in failed. Please try again.');
                }
              }}
              style={{
                width: '100%', padding: '0.875rem', borderRadius: 12, cursor: 'pointer',
                background: 'var(--color-surface-2)', border: '1px solid var(--color-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
                fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-text)',
                marginBottom: '0.75rem', transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#4285F4'; e.currentTarget.style.background = '#4285F408'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.background = 'var(--color-surface-2)'; }}
            >
              <GoogleIcon />
              Continue with Google
            </motion.button>


            <Divider label="or sign in with email" />

            {/* Errors */}
            <AnimatePresence>
              {(error || oauthError) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', padding: '0.75rem 1rem', background: '#ef444420', border: '1px solid #ef444440', borderRadius: 10, marginBottom: '1.25rem', color: '#fca5a5', fontSize: '0.875rem' }}
                >
                  <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                  <span>{error || 'Sign-in failed. Please try again.'}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-text-dim)', marginBottom: '0.5rem' }}>
                  Email address
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', pointerEvents: 'none' }} />
                  <input
                    id="login-email"
                    className="input"
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                    style={{ paddingLeft: '2.5rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-text-dim)', marginBottom: '0.5rem' }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', pointerEvents: 'none' }} />
                  <input
                    id="login-password"
                    className="input"
                    type={showPass ? 'text' : 'password'}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                    style={{ paddingLeft: '2.5rem', paddingRight: '2.75rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex', padding: 4 }}
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <motion.button
                id="login-submit"
                type="submit"
                className="btn-primary"
                whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                disabled={loading}
                style={{ width: '100%', padding: '0.9rem', fontSize: '1rem', opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
              >
                {loading ? 'Signing in...' : 'Sign In →'}
              </motion.button>
            </form>

            <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', marginTop: '1.5rem', fontSize: '0.875rem' }}>
              No account yet?{' '}
              <Link to="/signup" style={{ color: 'var(--color-primary-light)', fontWeight: 600, textDecoration: 'none' }}>
                Create one free →
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default LoginPage;
