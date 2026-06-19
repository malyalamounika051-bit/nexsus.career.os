import { useEffect, useState, useRef } from 'react';

const ProgressRing = ({
  value = 0,
  size = 160,
  strokeWidth = 10,
  label = '',
  sublabel = '',
  gradientFrom = 'var(--color-primary)',
  gradientTo = 'var(--color-accent)',
  bgStroke = 'var(--color-border)',
  duration = 1500,
  fontSize,
  showGlow = false,
}) => {
  const [animatedValue, setAnimatedValue] = useState(0);
  const animRef = useRef(null);
  const startTime = useRef(null);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  useEffect(() => {
    startTime.current = performance.now();
    const animate = (now) => {
      const elapsed = now - startTime.current;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutExpo for premium feel
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setAnimatedValue(Math.round(eased * value));
      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      }
    };
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [value, duration]);

  const offset = circumference - (animatedValue / 100) * circumference;
  const gradientId = `ring-grad-${size}-${value}`;
  const glowId = `ring-glow-${size}-${value}`;
  const computedFontSize = fontSize || size * 0.22;

  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={gradientFrom} />
            <stop offset="100%" stopColor={gradientTo} />
          </linearGradient>
          {showGlow && (
            <filter id={glowId}>
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          )}
        </defs>
        {/* Background track */}
        <circle
          cx={center} cy={center} r={radius}
          fill="none" stroke={bgStroke} strokeWidth={strokeWidth}
        />
        {/* Animated progress arc */}
        <circle
          cx={center} cy={center} r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${center} ${center})`}
          style={{ transition: 'stroke-dashoffset 0.1s ease-out' }}
          filter={showGlow ? `url(#${glowId})` : undefined}
        />
        {/* Dot at the end of the progress arc */}
        {animatedValue > 2 && (
          <circle
            cx={center + radius * Math.cos(((animatedValue / 100) * 360 - 90) * Math.PI / 180)}
            cy={center + radius * Math.sin(((animatedValue / 100) * 360 - 90) * Math.PI / 180)}
            r={strokeWidth / 2 + 1}
            fill={gradientTo}
            style={{ filter: showGlow ? `drop-shadow(0 0 4px ${gradientTo})` : undefined }}
          />
        )}
      </svg>
      {/* Center content */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        pointerEvents: 'none',
      }}>
        <span style={{
          fontSize: computedFontSize,
          fontWeight: 800,
          fontFamily: "'Space Grotesk', sans-serif",
          background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          lineHeight: 1.1,
        }}>
          {animatedValue}%
        </span>
        {label && (
          <span style={{
            fontSize: computedFontSize * 0.36,
            fontWeight: 600,
            color: 'var(--color-text-dim)',
            marginTop: '0.15rem',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}>
            {label}
          </span>
        )}
        {sublabel && (
          <span style={{
            fontSize: computedFontSize * 0.3,
            color: 'var(--color-text-muted)',
            marginTop: '0.1rem',
          }}>
            {sublabel}
          </span>
        )}
      </div>
    </div>
  );
};

export default ProgressRing;
