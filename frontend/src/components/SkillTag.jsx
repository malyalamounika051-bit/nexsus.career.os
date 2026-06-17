import { motion } from 'framer-motion';
import { X } from 'lucide-react';

const variantStyles = {
  success: {
    bg: 'rgba(16,185,129,0.1)',
    border: 'rgba(16,185,129,0.25)',
    color: '#6ee7b7',
    hoverBg: 'rgba(16,185,129,0.2)',
  },
  danger: {
    bg: 'rgba(239,68,68,0.1)',
    border: 'rgba(239,68,68,0.25)',
    color: '#fca5a5',
    hoverBg: 'rgba(239,68,68,0.2)',
  },
  info: {
    bg: 'rgba(14,165,233,0.1)',
    border: 'rgba(14,165,233,0.25)',
    color: '#7dd3fc',
    hoverBg: 'rgba(14,165,233,0.2)',
  },
  warning: {
    bg: 'rgba(245,158,11,0.1)',
    border: 'rgba(245,158,11,0.25)',
    color: '#fcd34d',
    hoverBg: 'rgba(245,158,11,0.2)',
  },
  purple: {
    bg: 'rgba(168,85,247,0.1)',
    border: 'rgba(168,85,247,0.25)',
    color: '#c4b5fd',
    hoverBg: 'rgba(168,85,247,0.2)',
  },
  neutral: {
    bg: 'var(--color-surface-2)',
    border: 'var(--color-border)',
    color: 'var(--color-text-dim)',
    hoverBg: 'var(--color-surface-3)',
  },
};

const sizeStyles = {
  sm: { padding: '0.15rem 0.5rem', fontSize: '0.68rem', gap: '0.3rem', iconSize: 10 },
  md: { padding: '0.25rem 0.7rem', fontSize: '0.78rem', gap: '0.4rem', iconSize: 12 },
  lg: { padding: '0.35rem 0.9rem', fontSize: '0.88rem', gap: '0.5rem', iconSize: 14 },
};

const SkillTag = ({
  label,
  variant = 'neutral',
  size = 'md',
  icon: Icon,
  removable = false,
  onRemove,
  onClick,
  animated = true,
  delay = 0,
  glow = false,
  style: customStyle = {},
}) => {
  const v = variantStyles[variant] || variantStyles.neutral;
  const s = sizeStyles[size] || sizeStyles.md;

  const Wrapper = animated ? motion.span : 'span';
  const animProps = animated ? {
    initial: { opacity: 0, scale: 0.85, y: 5 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.85, y: -5 },
    transition: { duration: 0.25, delay },
  } : {};

  return (
    <Wrapper
      {...animProps}
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: s.gap,
        padding: s.padding,
        borderRadius: 99,
        background: v.bg,
        border: `1px solid ${v.border}`,
        color: v.color,
        fontSize: s.fontSize,
        fontWeight: 600,
        fontFamily: "'Inter', sans-serif",
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        whiteSpace: 'nowrap',
        lineHeight: 1.4,
        ...(glow ? { boxShadow: `0 0 12px ${v.border}` } : {}),
        ...customStyle,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = v.hoverBg;
        if (glow) e.currentTarget.style.boxShadow = `0 0 18px ${v.border}`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = v.bg;
        if (glow) e.currentTarget.style.boxShadow = `0 0 12px ${v.border}`;
      }}
    >
      {Icon && <Icon size={s.iconSize} />}
      <span>{label}</span>
      {removable && (
        <button
          onClick={e => { e.stopPropagation(); onRemove?.(); }}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: v.color, opacity: 0.6, padding: 0,
            display: 'flex', alignItems: 'center',
          }}
        >
          <X size={s.iconSize} />
        </button>
      )}
    </Wrapper>
  );
};

export default SkillTag;
