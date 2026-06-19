import { motion } from 'framer-motion';
import { X } from 'lucide-react';

const variantStyles = {
  success: {
    bg: 'var(--color-success-glow)',
    border: 'var(--color-success)',
    color: 'var(--color-success)',
    hoverBg: 'rgba(22, 163, 74, 0.12)',
  },
  danger: {
    bg: 'var(--color-danger-glow)',
    border: 'var(--color-danger)',
    color: 'var(--color-danger)',
    hoverBg: 'rgba(220, 38, 38, 0.12)',
  },
  info: {
    bg: 'var(--color-surface-2)',
    border: 'var(--color-border)',
    color: 'var(--color-text-secondary)',
    hoverBg: 'var(--color-surface-3)',
  },
  warning: {
    bg: 'var(--color-warning-glow)',
    border: 'var(--color-warning)',
    color: 'var(--color-warning)',
    hoverBg: 'rgba(217, 119, 6, 0.12)',
  },
  purple: {
    bg: 'var(--color-surface-2)',
    border: 'var(--color-border-glow)',
    color: 'var(--color-text)',
    hoverBg: 'var(--color-surface-3)',
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
