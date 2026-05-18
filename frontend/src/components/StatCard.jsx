import { motion } from 'framer-motion';

const StatCard = ({ icon: Icon, label, value, sub, color = '#0ea5e9', delay = 0, glow = false }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: 'easeOut' }}
      className="stat-card"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        ...(glow ? { boxShadow: `0 0 25px ${color}20, 0 0 60px ${color}08` } : {}),
      }}
    >
      <div style={{
        width: 44, height: 44,
        borderRadius: 12,
        background: `${color}12`,
        border: `1px solid ${color}25`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        transition: 'all 0.3s',
      }}>
        <Icon size={20} color={color} />
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{
          fontSize: '0.72rem',
          fontWeight: 500,
          color: 'var(--color-text-muted)',
          marginBottom: '0.2rem',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}>
          {label}
        </div>
        <div style={{
          fontWeight: 700,
          fontSize: '1.25rem',
          color: 'var(--color-text)',
          fontFamily: "'Space Grotesk', sans-serif",
          lineHeight: 1.2,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {value}
        </div>
        {sub && (
          <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: '0.15rem' }}>
            {sub}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default StatCard;
