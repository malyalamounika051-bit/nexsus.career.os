const SkeletonLoader = ({ width = '100%', height = 20, borderRadius = 8, style = {} }) => (
  <div
    className="skeleton"
    style={{
      width,
      height,
      borderRadius,
      ...style,
    }}
  />
);

export const SkeletonCard = ({ height = 160 }) => (
  <div style={{
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-lg)',
    padding: '1.25rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      <SkeletonLoader width={40} height={40} borderRadius={12} />
      <div style={{ flex: 1 }}>
        <SkeletonLoader width="60%" height={14} style={{ marginBottom: 6 }} />
        <SkeletonLoader width="40%" height={10} />
      </div>
    </div>
    <SkeletonLoader width="100%" height={height - 100} />
    <SkeletonLoader width="80%" height={12} />
  </div>
);

export const SkeletonText = ({ lines = 3, style = {} }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, ...style }}>
    {Array.from({ length: lines }).map((_, i) => (
      <SkeletonLoader
        key={i}
        width={i === lines - 1 ? '60%' : '100%'}
        height={12}
      />
    ))}
  </div>
);

export default SkeletonLoader;
