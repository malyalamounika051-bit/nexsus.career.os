import { motion } from 'framer-motion';

const ScoreGauge = ({ value = 0, size = 140, label = '', sublabel = '' }) => {
  const clampedValue = Math.min(Math.max(value, 0), 100);
  const strokeWidth = 10;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = Math.PI * radius; // half circle
  const offset = circumference - (clampedValue / 100) * circumference;

  // Color based on value
  const getColor = (v) => {
    if (v >= 75) return '#10b981';
    if (v >= 50) return '#0ea5e9';
    if (v >= 25) return '#f59e0b';
    return '#ef4444';
  };

  const color = getColor(clampedValue);

  return (
    <div style={{ textAlign: 'center', width: size }}>
      <div style={{ position: 'relative', width: size, height: size * 0.6 }}>
        <svg width={size} height={size * 0.6} viewBox={`0 0 ${size} ${size * 0.6}`}>
          <defs>
            <linearGradient id={`gauge-grad-${label}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--color-primary)" />
              <stop offset="100%" stopColor="var(--color-accent)" />
            </linearGradient>
          </defs>
          {/* Background arc */}
          <path
            d={`M ${strokeWidth} ${size * 0.55} A ${radius} ${radius} 0 0 1 ${size - strokeWidth} ${size * 0.55}`}
            fill="none"
            stroke="var(--color-border)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          {/* Filled arc */}
          <motion.path
            d={`M ${strokeWidth} ${size * 0.55} A ${radius} ${radius} 0 0 1 ${size - strokeWidth} ${size * 0.55}`}
            fill="none"
            stroke={`url(#gauge-grad-${label})`}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.8, ease: 'easeOut', delay: 0.3 }}
          />
        </svg>
        {/* Center score */}
        <div style={{
          position: 'absolute',
          bottom: 0, left: '50%', transform: 'translateX(-50%)',
          textAlign: 'center',
        }}>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            style={{
              fontSize: size * 0.22,
              fontWeight: 800,
              fontFamily: "'Space Grotesk', sans-serif",
              color: 'var(--color-text)',
              lineHeight: 1,
            }}
          >
            {Math.round(clampedValue)}
          </motion.div>
          <div style={{ fontSize: size * 0.08, color: 'var(--color-text-muted)', marginTop: 2 }}>
            / 100
          </div>
        </div>
      </div>
      {label && (
        <div style={{ marginTop: 8, fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text)' }}>
          {label}
        </div>
      )}
      {sublabel && (
        <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
          {sublabel}
        </div>
      )}
    </div>
  );
};

export default ScoreGauge;
