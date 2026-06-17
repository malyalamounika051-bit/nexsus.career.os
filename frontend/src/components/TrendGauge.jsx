import { useEffect, useState, useRef } from 'react';

const TrendGauge = ({
  value = 0,
  max = 100,
  size = 140,
  label = '',
  sublabel = '',
  colorFrom = '#0ea5e9',
  colorTo = '#a855f7',
  duration = 1200,
}) => {
  const [animatedValue, setAnimatedValue] = useState(0);
  const animRef = useRef(null);

  useEffect(() => {
    const start = performance.now();
    const animate = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedValue(eased * value);
      if (progress < 1) animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [value, duration]);

  const percent = Math.min(animatedValue / max, 1);
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const viewBox = `0 0 ${size} ${size * 0.65}`;

  // Semi-circle arc
  const startAngle = Math.PI;
  const endAngle = 0;
  const totalArc = Math.PI;

  const bgArcPath = describeArc(size / 2, radius + strokeWidth / 2, radius, startAngle, endAngle);
  const progressAngle = startAngle - totalArc * percent;
  const progressArcPath = describeArc(size / 2, radius + strokeWidth / 2, radius, startAngle, progressAngle);

  const gradientId = `gauge-grad-${size}-${value}`;

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ position: 'relative' }}>
        <svg width={size} height={size * 0.6} viewBox={viewBox}>
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={colorFrom} />
              <stop offset="100%" stopColor={colorTo} />
            </linearGradient>
          </defs>
          {/* Background arc */}
          <path d={bgArcPath} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={strokeWidth} strokeLinecap="round" />
          {/* Progress arc */}
          <path d={progressArcPath} fill="none" stroke={`url(#${gradientId})`} strokeWidth={strokeWidth} strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 6px ${colorFrom}40)` }}
          />
        </svg>
        {/* Center value */}
        <div style={{
          position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)',
          textAlign: 'center',
        }}>
          <div style={{
            fontSize: size * 0.2,
            fontWeight: 800,
            fontFamily: "'Space Grotesk', sans-serif",
            background: `linear-gradient(135deg, ${colorFrom}, ${colorTo})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            lineHeight: 1,
          }}>
            {Math.round(animatedValue)}
          </div>
        </div>
      </div>
      {label && (
        <div style={{
          fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text-dim)',
          marginTop: '0.25rem', textAlign: 'center',
        }}>
          {label}
        </div>
      )}
      {sublabel && (
        <div style={{
          fontSize: '0.68rem', color: 'var(--color-text-muted)',
          marginTop: '0.1rem', textAlign: 'center',
        }}>
          {sublabel}
        </div>
      )}
    </div>
  );
};

function describeArc(cx, cy, r, startAngle, endAngle) {
  const x1 = cx + r * Math.cos(startAngle);
  const y1 = cy - r * Math.sin(startAngle);
  const x2 = cx + r * Math.cos(endAngle);
  const y2 = cy - r * Math.sin(endAngle);
  const largeArc = Math.abs(startAngle - endAngle) > Math.PI ? 1 : 0;
  const sweep = startAngle > endAngle ? 0 : 1;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} ${sweep} ${x2} ${y2}`;
}

export default TrendGauge;
