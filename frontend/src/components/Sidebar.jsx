import { useState, useEffect, useCallback } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Dna, Map, MessageSquare, TrendingUp,
  FileSearch, Play, User, LogOut, Zap, Menu, X,
  ChevronLeft, ChevronRight, Flame, Briefcase, FileText, Mic, Compass
} from 'lucide-react';

const navItems = [
  { to: '/dashboard',          icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/career-dna',         icon: Dna,             label: 'Career DNA' },
  { to: '/roadmaps',           icon: Map,             label: 'AI Roadmaps' },
  { to: '/jobs',               icon: Briefcase,       label: 'Job Search' },
  { to: '/resume-builder',     icon: FileText,        label: 'Resume Builder' },
  { to: '/mentor',             icon: MessageSquare,    label: 'AI Mentor' },
  { to: '/mock-interview/setup', icon: Mic,              label: 'Mock Interview' },
  { to: '/skill-gap',          icon: FileSearch,       label: 'Skill Gap' },
  { to: '/career-simulator',   icon: Play,             label: 'Simulator' },
  { to: '/profile',            icon: User,             label: 'Profile' },
];

const mobileNavItems = [
  { to: '/dashboard',          icon: LayoutDashboard, label: 'Home' },
  { to: '/career-dna',         icon: Dna,             label: 'DNA' },
  { to: '/mentor',             icon: MessageSquare,    label: 'Mentor' },
  { to: '/profile',            icon: User,             label: 'Profile' },
];

const Sidebar = ({ collapsed, onToggleCollapse }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') setSidebarOpen(false); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleLogout = useCallback(() => { logout(); navigate('/'); }, [logout, navigate]);

  const SidebarContent = ({ isCollapsed = false }) => (
    <>
      {/* Logo */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: isCollapsed ? 0 : '0.75rem',
        marginBottom: '1.75rem', padding: '0.25rem',
        justifyContent: isCollapsed ? 'center' : 'flex-start',
      }}>
        <div style={{
          width: 38, height: 38, borderRadius: 12,
          background: 'var(--gradient-primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
          boxShadow: '0 0 20px rgba(14,165,233,0.3)',
        }}>
          <Zap size={18} color="white" />
        </div>
        {!isCollapsed && (
          <div>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '1.05rem', color: 'var(--color-text)' }}>Nexus</div>
            <div style={{ fontSize: '0.62rem', color: 'var(--color-text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Career OS</div>
          </div>
        )}
        <button
          onClick={() => setSidebarOpen(false)}
          className="show-mobile hamburger-btn"
          style={{ marginLeft: 'auto' }}
        >
          <X size={18} />
        </button>
      </div>

      {/* User info */}
      {user && !isCollapsed && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          padding: '0.75rem', borderRadius: 12,
          background: 'var(--color-primary-glow)',
          border: '1px solid rgba(14,165,233,0.12)',
          marginBottom: '1.5rem',
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'var(--gradient-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: '0.9rem', color: 'white', flexShrink: 0,
            boxShadow: '0 0 12px rgba(14,165,233,0.3)',
          }}>
            {user.avatar
              ? <img src={user.avatar} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
              : user.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.68rem', color: 'var(--color-text-muted)' }}>
              <span>Level {Math.floor((user.xp || 0) / 200) + 1}</span>
              {(user.streak || 0) > 0 && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 2, color: '#f59e0b' }}>
                  <Flame size={10} /> {user.streak}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Collapsed user avatar */}
      {user && isCollapsed && (
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'var(--gradient-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: '0.9rem', color: 'white',
            boxShadow: '0 0 12px rgba(14,165,233,0.3)',
          }}>
            {user.name?.[0]?.toUpperCase() || 'U'}
          </div>
        </div>
      )}

      {/* Nav links */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
        {!isCollapsed && (
          <div style={{ fontSize: '0.62rem', fontWeight: 600, color: 'var(--color-text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase', padding: '0 0.875rem', marginBottom: '0.5rem' }}>
            Navigation
          </div>
        )}
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            title={isCollapsed ? label : undefined}
            style={isCollapsed ? { justifyContent: 'center', padding: '0.7rem' } : undefined}
          >
            <Icon size={18} />
            {!isCollapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Collapse toggle (desktop only) */}
      {onToggleCollapse && (
        <button
          onClick={onToggleCollapse}
          className="hide-mobile"
          style={{
            background: 'var(--color-surface-2)', border: '1px solid var(--color-border)',
            borderRadius: 8, padding: '0.5rem', cursor: 'pointer',
            color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', marginTop: '0.75rem', width: '100%',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.color = 'var(--color-primary-light)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text-muted)'; }}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      )}

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="sidebar-link"
        style={{
          marginTop: '0.5rem', width: '100%', textAlign: 'left',
          background: 'none', border: '1px solid transparent',
          ...(isCollapsed ? { justifyContent: 'center', padding: '0.7rem' } : {}),
        }}
        title={isCollapsed ? 'Logout' : undefined}
      >
        <LogOut size={18} />
        {!isCollapsed && <span>Logout</span>}
      </button>
    </>
  );

  return (
    <>
      {/* ── DESKTOP SIDEBAR ─────────────────────────────── */}
      <motion.aside
        initial={{ x: -280 }}
        animate={{ x: 0, width: collapsed ? 72 : 260 }}
        transition={{ type: 'spring', stiffness: 200, damping: 25 }}
        className="sidebar"
        style={{
          minHeight: '100vh',
          background: 'var(--color-surface)',
          borderRight: '1px solid var(--color-border)',
          display: 'flex',
          flexDirection: 'column',
          padding: collapsed ? '1.25rem 0.6rem' : '1.25rem 0.875rem',
          position: 'fixed',
          left: 0, top: 0, bottom: 0,
          zIndex: 200,
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        <SidebarContent isCollapsed={collapsed} />
      </motion.aside>

      {/* ── MOBILE HEADER ────────────────────────────────── */}
      <header className="mobile-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'var(--gradient-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 12px rgba(14,165,233,0.3)',
          }}>
            <Zap size={16} color="white" />
          </div>
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '1rem' }}>Nexus</span>
          <span style={{ fontSize: '0.6rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Career OS</span>
        </div>
        <button className="hamburger-btn" onClick={() => setSidebarOpen(true)}>
          <Menu size={20} />
        </button>
      </header>

      {/* ── MOBILE SIDEBAR DRAWER ───────────────────────── */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <div className="sidebar-overlay open" onClick={() => setSidebarOpen(false)} />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              style={{
                position: 'fixed',
                left: 0, top: 0, bottom: 0,
                width: 260,
                background: 'var(--color-surface)',
                borderRight: '1px solid var(--color-border)',
                display: 'flex',
                flexDirection: 'column',
                padding: '1.25rem 0.875rem',
                zIndex: 300,
                overflowY: 'auto',
              }}
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── MOBILE BOTTOM NAV ───────────────────────────── */}
      <nav className="mobile-nav">
        {mobileNavItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
          >
            <Icon size={19} />
            {label}
          </NavLink>
        ))}
      </nav>
    </>
  );
};

export default Sidebar;
