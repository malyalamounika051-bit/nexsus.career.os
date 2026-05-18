import { motion } from 'framer-motion';

const ProgressRing = ({ value = 0, size = 80, strokeWidth = 6, color = 'url(#gradient)', label, sublabel }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(value, 100) / 100) * circumference;

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <defs>
          <linearGradient id="ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0ea5e9" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
          <filter id="ring-glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {/* Background ring */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none"
          stroke="var(--color-surface-3)"
          strokeWidth={strokeWidth}
        />
        {/* Progress ring */}
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none"
          stroke={color === 'url(#gradient)' ? 'url(#ring-gradient)' : color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: 'easeOut', delay: 0.2 }}
          filter="url(#ring-glow)"
        />
      </svg>
      {/* Center content */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <motion.span
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          style={{
            fontSize: size * 0.25,
            fontWeight: 800,
            fontFamily: "'Space Grotesk', sans-serif",
            color: 'var(--color-text)',
            lineHeight: 1,
          }}
        >
          {label ?? `${Math.round(value)}%`}
        </motion.span>
        {sublabel && (
          <span style={{ fontSize: size * 0.1, color: 'var(--color-text-muted)', marginTop: 2 }}>
            {sublabel}
          </span>
        )}
      </div>
    </div>
  );
};

export default ProgressRing;
