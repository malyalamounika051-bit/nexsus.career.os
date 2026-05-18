import { ResponsiveContainer, RadarChart as RechartsRadar, PolarGrid, PolarAngleAxis, Radar } from 'recharts';

const RadarChart = ({ data = [], size = 250 }) => {
  // data should be: [{ trait: 'Technical', value: 12, fullMark: 15 }, ...]
  return (
    <div style={{ width: '100%', maxWidth: size, height: size, margin: '0 auto' }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsRadar cx="50%" cy="50%" outerRadius="75%" data={data}>
          <PolarGrid
            stroke="var(--color-border)"
            strokeOpacity={0.5}
          />
          <PolarAngleAxis
            dataKey="trait"
            tick={{ fill: 'var(--color-text-dim)', fontSize: 11, fontWeight: 500 }}
          />
          <Radar
            name="Score"
            dataKey="value"
            stroke="#0ea5e9"
            fill="url(#radarGradient)"
            fillOpacity={0.25}
            strokeWidth={2}
            dot={{ r: 4, fill: '#0ea5e9', stroke: '#0ea5e9', strokeWidth: 1 }}
            animationDuration={1200}
            animationEasing="ease-out"
          />
          <defs>
            <linearGradient id="radarGradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#a855f7" stopOpacity={0.4} />
            </linearGradient>
          </defs>
        </RechartsRadar>
      </ResponsiveContainer>
    </div>
  );
};

export default RadarChart;
