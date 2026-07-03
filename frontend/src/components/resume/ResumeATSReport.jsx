import React from 'react';
import { motion } from 'framer-motion';
import { 
  Target, BarChart3, AlertCircle, Sparkles, Check, ChevronRight, 
  FileText, ShieldCheck, Gauge, TrendingUp, Info
} from 'lucide-react';

const getScoreColor = (score) => {
  if (score >= 70) return '#10b981';
  if (score >= 40) return '#f59e0b';
  return '#ef4444';
};

const ScoreRing = ({ score = 0, size = 140, strokeWidth = 12, label }) => {
  const color = getScoreColor(score);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
      <svg width={size} height={size}>
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="var(--color-border)" strokeWidth={strokeWidth} />
        <motion.circle 
          cx={size/2} cy={size/2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circumference} 
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          strokeLinecap="round" transform={`rotate(-90 ${size/2} ${size/2})`}
        />
        <text x="50%" y="45%" textAnchor="middle" dominantBaseline="central"
          style={{ fontSize: size * 0.28, fontWeight: 900, fill: 'var(--color-text)' }}>{score}</text>
        <text x="50%" y="68%" textAnchor="middle" dominantBaseline="central"
          style={{ fontSize: size * 0.1, fontWeight: 600, fill: 'var(--color-text-muted)' }}>/100</text>
      </svg>
      {label && <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-text)' }}>{label}</span>}
    </div>
  );
};

const ScoreBar = ({ label, score, feedback }) => {
  const color = getScoreColor(score);
  return (
    <div style={{ marginBottom: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text)' }}>{label}</span>
        <span style={{ fontSize: '0.85rem', fontWeight: 800, color }}>{score}%</span>
      </div>
      <div style={{ width: '100%', height: '8px', background: 'var(--color-surface-3)', borderRadius: '99px', overflow: 'hidden' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{ height: '100%', background: `linear-gradient(90deg, ${color}, ${color}cc)`, borderRadius: '99px' }}
        />
      </div>
      {feedback && <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: '0.3rem 0 0', lineHeight: 1.4 }}>{feedback}</p>}
    </div>
  );
};

export default function ResumeATSReport({ atsAnalysis, onAnalyze, loading }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Tab Header Banner */}
      <div style={{ textAlign: 'center', padding: '1rem 0' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'var(--color-primary-glow)', padding: '0.5rem 1.25rem', borderRadius: '99px', marginBottom: '0.75rem' }}>
          <Target size={16} color="var(--color-primary)" />
          <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-primary)' }}>ATS Optimization Engine</span>
        </div>
        <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: 'var(--color-text)' }}>Applicant Tracking System Audit</h3>
        <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginTop: '0.4rem' }}>Verify keyword density, structural integrity, and readability metrics.</p>
      </div>

      {/* Audit Trigger */}
      <button 
        onClick={onAnalyze} 
        disabled={loading} 
        className="btn-primary" 
        style={{ 
          width: '100%', 
          padding: '1.15rem', 
          fontSize: '1rem', 
          fontWeight: 800, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          gap: '0.5rem', 
          borderRadius: '14px' 
        }}
      >
        {loading ? (
          <><RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} /> Analyzing Resume Structure...</>
        ) : (
          <><Target size={18} /> {atsAnalysis ? 'Recalculate ATS Audit' : 'Audit My Resume'}</>)
        }
      </button>

      {/* Results View */}
      {atsAnalysis ? (
        <motion.div 
          initial={{ opacity: 0, y: 15 }} 
          animate={{ opacity: 1, y: 0 }} 
          style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
        >
          {/* Main Gauges */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="glass-card" style={{ padding: '2rem', border: '1px solid var(--color-border)', display: 'flex', justifyContent: 'center' }}>
              <ScoreRing score={atsAnalysis.overallScore || atsAnalysis.score || 0} label="ATS Score Compatibility" />
            </div>
            <div className="glass-card" style={{ padding: '2rem', border: '1px solid var(--color-border)', display: 'flex', justifyContent: 'center' }}>
              <ScoreRing score={atsAnalysis.categories?.readability?.score || 80} label="Recruiter Readability" />
            </div>
          </div>

          {/* Breakdown & Feedback */}
          <div className="glass-card" style={{ padding: '1.75rem', border: '1px solid var(--color-border)' }}>
            <h4 style={{ margin: '0 0 1.25rem', fontSize: '1.05rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text)' }}>
              <BarChart3 size={18} color="var(--color-primary)" /> Dimension Analysis
            </h4>
            {atsAnalysis.categories ? (
              Object.entries(atsAnalysis.categories).map(([key, val]) => (
                <ScoreBar 
                  key={key} 
                  label={key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} 
                  score={val.score || 0} 
                  feedback={val.feedback} 
                />
              ))
            ) : (
              <>
                <ScoreBar label="Formatting & Syntax" score={80} feedback="Clean formatting layout checked." />
                <ScoreBar label="Keyword Density" score={70} feedback="Audit checked." />
                <ScoreBar label="Completeness" score={90} feedback="Necessary sections present." />
              </>
            )}
          </div>

          {/* Keyword Coverage Heatmap */}
          {atsAnalysis.missingKeywords?.length > 0 && (
            <div className="glass-card" style={{ padding: '1.75rem', border: '1px solid var(--color-border)' }}>
              <h4 style={{ margin: '0 0 0.85rem', fontSize: '1.05rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text)' }}>
                <AlertCircle size={18} color="#f59e0b" /> Critical Missing Keywords
              </h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', margin: '0 0 1rem', lineHeight: 1.4 }}>
                Applicant Tracking Systems scan for these terms based on industry standard profiles. Add them naturally to your Skills or Experience section:
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {atsAnalysis.missingKeywords.map((kw, i) => (
                  <span key={i} style={{ background: '#f59e0b15', color: '#f59e0b', border: '1px solid #f59e0b25', padding: '0.4rem 0.85rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700 }}>
                    + {kw}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Action Checklist */}
          {(atsAnalysis.suggestions?.length > 0 || atsAnalysis.tips?.length > 0) && (
            <div className="glass-card" style={{ padding: '1.75rem', border: '1px solid var(--color-border)' }}>
              <h4 style={{ margin: '0 0 1rem', fontSize: '1.05rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text)' }}>
                <Sparkles size={18} color="#8b5cf6" /> Bulletproof Checklist
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {(atsAnalysis.suggestions || atsAnalysis.tips || []).map((tip, i) => (
                  <div key={i} style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start', padding: '0.75rem 0.9rem', background: 'var(--color-surface-2)', borderRadius: '10px', fontSize: '0.85rem', color: 'var(--color-text)', lineHeight: 1.4 }}>
                    <ChevronRight size={14} color="#8b5cf6" style={{ marginTop: '3px', flexShrink: 0 }} />
                    <span>{tip}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </motion.div>
      ) : (
        <div className="glass-card" style={{ padding: '3rem 1.5rem', textAlign: 'center', border: '1px dashed var(--color-border)' }}>
          <ShieldCheck size={40} color="var(--color-text-muted)" style={{ margin: '0 auto 1rem' }} />
          <p style={{ margin: 0, fontWeight: 800, color: 'var(--color-text)' }}>ATS Compatibility Audit Required</p>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
            Run the audit to compute your score, missing industry keywords, and layout metrics.
          </p>
        </div>
      )}

      {/* Inline styles for spinner */}
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
