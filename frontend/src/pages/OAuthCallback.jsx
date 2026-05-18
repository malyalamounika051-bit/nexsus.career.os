import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Zap } from 'lucide-react';

// This page receives the OAuth token redirect from the backend
// Route: /oauth-callback?token=...&name=...&email=...&id=...&role=...
const OAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { updateUser } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    const name = searchParams.get('name');
    const email = searchParams.get('email');
    const id = searchParams.get('id');
    const role = searchParams.get('role');
    const error = searchParams.get('error');

    if (error || !token) {
      navigate('/login?error=oauth_failed');
      return;
    }

    // Store JWT
    localStorage.setItem('nexus_token', token);
    const user = { id, name, email, role, assessmentCount: 0 };
    localStorage.setItem('nexus_user', JSON.stringify(user));
    updateUser(user);

    navigate('/dashboard');
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.5rem' }}>
      <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Zap size={28} color="white" />
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 36, height: 36, border: '3px solid var(--color-border)', borderTop: '3px solid var(--color-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Completing sign in...</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default OAuthCallback;
