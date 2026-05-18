import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { adviceService } from '../services/adviceService';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import { Heart, Trash2, Send, Users, Filter, PlusCircle } from 'lucide-react';

const TAGS = ['All', 'Career Switch', 'Networking', 'Interviews', 'Skills', 'Salary', 'Remote Work', 'Freelance', 'Startup'];

const PeerAdvicePage = () => {
  const { user, isAuthenticated } = useAuth();
  const [advice, setAdvice] = useState([]);
  const [tag, setTag] = useState('All');
  const [content, setContent] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');

  const fetchAdvice = async (filterTag) => {
    setLoading(true);
    try {
      const params = filterTag !== 'All' ? { tag: filterTag } : {};
      const { data } = await adviceService.getAll(params);
      setAdvice(data.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAdvice(tag); }, [tag]);

  const handlePost = async () => {
    if (!content.trim()) return setError('Please write some advice!');
    if (content.length < 10) return setError('Content too short.');
    setPosting(true);
    setError('');
    try {
      const { data } = await adviceService.create({ content, tags: selectedTags });
      setAdvice(prev => [data.data, ...prev]);
      setContent('');
      setSelectedTags([]);
      setShowForm(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to post advice.');
    } finally {
      setPosting(false);
    }
  };

  const handleLike = async (id) => {
    if (!isAuthenticated) return;
    try {
      const { data } = await adviceService.toggleLike(id);
      setAdvice(prev => prev.map(a => a._id === id ? { ...a, likes: data.likes, likedBy: data.liked ? [...(a.likedBy || []), user.id] : (a.likedBy || []).filter(x => x !== user.id) } : a));
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id) => {
    try {
      await adviceService.delete(id);
      setAdvice(prev => prev.filter(a => a._id !== id));
    } catch (e) { console.error(e); }
  };

  const toggleTag = (t) => setSelectedTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);

  const timeAgo = (date) => {
    const s = Math.floor((new Date() - new Date(date)) / 1000);
    if (s < 60) return `${s}s ago`;
    const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="app-main">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: "'Space Grotesk', sans-serif" }}>
              Peer <span className="gradient-text">Advice</span>
            </h1>
            <p style={{ color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>Share and discover career wisdom from the community</p>
          </div>
          {isAuthenticated && (
            <button className="btn-primary" onClick={() => setShowForm(!showForm)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
              <PlusCircle size={16} /> {showForm ? 'Cancel' : 'Share Advice'}
            </button>
          )}
        </motion.div>

        {/* Post form */}
        <AnimatePresence>
          {showForm && isAuthenticated && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="glass-card"
              style={{ padding: '1.75rem', marginBottom: '1.5rem', overflow: 'hidden' }}
            >
              <h3 style={{ fontWeight: 700, marginBottom: '1rem', fontSize: '1rem' }}>Share Your Career Advice</h3>
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Share your career insights, tips, or experiences..."
                maxLength={1000}
                rows={4}
                className="input"
                style={{ resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6, marginBottom: '1rem' }}
              />
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem', textAlign: 'right' }}>{content.length}/1000</div>

              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>Add Tags (optional)</div>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  {TAGS.slice(1).map(t => (
                    <button key={t} onClick={() => toggleTag(t)} style={{ padding: '0.25rem 0.75rem', borderRadius: 99, fontSize: '0.75rem', fontWeight: 500, cursor: 'pointer', background: selectedTags.includes(t) ? 'var(--color-primary-glow)' : 'var(--color-surface-2)', border: `1px solid ${selectedTags.includes(t) ? '#3b82f640' : 'var(--color-border)'}`, color: selectedTags.includes(t) ? 'var(--color-primary-light)' : 'var(--color-text-muted)', transition: 'all 0.2s' }}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {error && <div style={{ color: '#fca5a5', fontSize: '0.85rem', marginBottom: '0.75rem' }}>{error}</div>}

              <button id="post-advice" className="btn-primary" onClick={handlePost} disabled={posting} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: posting ? 0.7 : 1 }}>
                <Send size={16} /> {posting ? 'Posting...' : 'Post Advice'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tag filter */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem', alignItems: 'center' }}>
          <Filter size={14} color="var(--color-text-muted)" />
          {TAGS.map(t => (
            <button key={t} onClick={() => setTag(t)} style={{ padding: '0.35rem 0.85rem', borderRadius: 99, fontSize: '0.8rem', fontWeight: 500, cursor: 'pointer', background: tag === t ? 'var(--color-primary-glow)' : 'transparent', border: `1px solid ${tag === t ? '#3b82f640' : 'var(--color-border)'}`, color: tag === t ? 'var(--color-primary-light)' : 'var(--color-text-muted)', transition: 'all 0.2s' }}>
              {t}
            </button>
          ))}
        </div>

        {/* Advice list */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--color-text-muted)' }}>Loading advice...</div>
        ) : advice.length === 0 ? (
          <div className="glass-card" style={{ padding: '4rem', textAlign: 'center' }}>
            <Users size={48} color="var(--color-text-muted)" style={{ margin: '0 auto 1rem', display: 'block' }} />
            <p style={{ color: 'var(--color-text-muted)' }}>No advice posts yet. Be the first to share!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {advice.map((a, i) => {
              const liked = user && a.likedBy?.includes(user.id);
              return (
                <motion.div
                  key={a._id}
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="glass-card"
                  style={{ padding: '1.5rem' }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.9rem', color: 'white', flexShrink: 0 }}>
                        {a.author?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{a.author}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{timeAgo(a.createdAt)}</div>
                      </div>
                    </div>
                    {user && a.userId === user.id && (
                      <button onClick={() => handleDelete(a._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: '0.25rem' }}>
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>

                  <p style={{ color: 'var(--color-text)', lineHeight: 1.7, marginBottom: '1rem', fontSize: '0.925rem' }}>{a.content}</p>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      {a.tags?.map(t => <span key={t} className="tag" style={{ fontSize: '0.7rem' }}>{t}</span>)}
                    </div>
                    <button
                      onClick={() => handleLike(a._id)}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: liked ? '#ef444420' : 'transparent', border: `1px solid ${liked ? '#ef444440' : 'var(--color-border)'}`, color: liked ? '#fca5a5' : 'var(--color-text-muted)', padding: '0.35rem 0.85rem', borderRadius: 99, cursor: 'pointer', fontSize: '0.82rem', fontWeight: 500, transition: 'all 0.2s' }}
                    >
                      <Heart size={14} fill={liked ? '#fca5a5' : 'none'} /> {a.likes || 0}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default PeerAdvicePage;
