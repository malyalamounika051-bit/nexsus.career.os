import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import Sidebar from '../components/Sidebar';
import { User, Mail, Calendar, Brain, Edit3, Save, X, CheckCircle2 } from 'lucide-react';

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: user?.name || '', bio: user?.bio || '' });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const { data } = await authService.updateProfile(form);
      updateUser(data.user);
      setEditing(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setForm({ name: user?.name || '', bio: user?.bio || '' });
    setEditing(false);
    setError('');
  };

  return (
    <div className="app-shell">
      <Sidebar collapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(c => !c)} />
      <main className={`app-main ${sidebarCollapsed ? 'sidebar-is-collapsed' : ''}`}>
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: "'Space Grotesk', sans-serif" }}>
            Your <span className="gradient-text">Profile</span>
          </h1>
          <p style={{ color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>Manage your account settings and view your stats</p>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.5rem' }}>
          {/* Main profile card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card" style={{ padding: '2rem' }}>
            {/* Avatar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 700, color: 'white', flexShrink: 0, boxShadow: '0 0 30px #3b82f640' }}>
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div>
                <h2 style={{ fontWeight: 800, fontSize: '1.4rem', fontFamily: "'Space Grotesk', sans-serif" }}>{user?.name}</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.3rem' }}>
                  <span style={{ padding: '0.2rem 0.6rem', borderRadius: 99, background: user?.role === 'admin' ? '#8b5cf620' : 'var(--color-primary-glow)', border: `1px solid ${user?.role === 'admin' ? '#8b5cf640' : '#3b82f640'}`, fontSize: '0.72rem', fontWeight: 600, color: user?.role === 'admin' ? '#c4b5fd' : 'var(--color-primary-light)' }}>
                    {user?.role === 'admin' ? '👑 Admin' : '🚀 Explorer'}
                  </span>
                </div>
              </div>
            </div>

            {/* Success */}
            {success && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', background: '#10b98120', border: '1px solid #10b98140', borderRadius: 10, marginBottom: '1.25rem', color: '#6ee7b7', fontSize: '0.875rem' }}>
                <CheckCircle2 size={16} /> Profile updated successfully!
              </motion.div>
            )}
            {error && (
              <div style={{ color: '#fca5a5', fontSize: '0.875rem', marginBottom: '1rem' }}>{error}</div>
            )}

            {/* Form */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-text-dim)', marginBottom: '0.5rem' }}>Full Name</label>
                {editing ? (
                  <input className="input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
                ) : (
                  <div style={{ padding: '0.75rem 1rem', borderRadius: 10, background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)', fontSize: '0.95rem' }}>{user?.name}</div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-text-dim)', marginBottom: '0.5rem' }}>Email</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', borderRadius: 10, background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
                  <Mail size={15} /> {user?.email}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-text-dim)', marginBottom: '0.5rem' }}>Bio</label>
                {editing ? (
                  <textarea className="input" value={form.bio} onChange={e => setForm(p => ({ ...p, bio: e.target.value }))} placeholder="Tell the community about yourself..." rows={3} style={{ resize: 'vertical', fontFamily: 'inherit' }} />
                ) : (
                  <div style={{ padding: '0.75rem 1rem', borderRadius: 10, background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: user?.bio ? 'var(--color-text)' : 'var(--color-text-muted)', fontSize: '0.95rem', minHeight: 80, lineHeight: 1.6 }}>
                    {user?.bio || 'No bio added yet.'}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                {editing ? (
                  <>
                    <button className="btn-primary" onClick={handleSave} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: saving ? 0.7 : 1 }}>
                      <Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button className="btn-ghost" onClick={handleCancel} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <X size={16} /> Cancel
                    </button>
                  </>
                ) : (
                  <button className="btn-ghost" onClick={() => setEditing(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Edit3 size={16} /> Edit Profile
                  </button>
                )}
              </div>
            </div>
          </motion.div>

          {/* Right: Stats */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              { icon: Brain, label: 'Assessments Taken', value: user?.assessmentCount || 0, color: '#3b82f6' },
              { icon: Calendar, label: 'Member Since', value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—', color: '#8b5cf6' },
              { icon: User, label: 'Account Role', value: user?.role === 'admin' ? 'Administrator' : 'Explorer', color: '#10b981' },
            ].map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.1 }} className="stat-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: `${s.color}20`, border: `1px solid ${s.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <s.icon size={20} color={s.color} />
                </div>
                <div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginBottom: '0.2rem' }}>{s.label}</div>
                  <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{s.value}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProfilePage;
