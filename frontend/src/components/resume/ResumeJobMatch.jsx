import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, Check, AlertCircle, Sparkles, RefreshCw, ChevronRight, 
  ExternalLink, Briefcase, Award, GraduationCap, MapPin, DollarSign
} from 'lucide-react';

const ScoreRing = ({ score = 0, size = 120, strokeWidth = 10, label }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
      <svg width={size} height={size}>
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="var(--color-border)" strokeWidth={strokeWidth} />
        <circle 
          cx={size/2} cy={size/2} r={radius} fill="none" stroke="#10b981" strokeWidth={strokeWidth}
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" transform={`rotate(-90 ${size/2} ${size/2})`}
        />
        <text x="50%" y="45%" textAnchor="middle" dominantBaseline="central"
          style={{ fontSize: size * 0.28, fontWeight: 900, fill: 'var(--color-text)' }}>{score}</text>
        <text x="50%" y="68%" textAnchor="middle" dominantBaseline="central"
          style={{ fontSize: size * 0.1, fontWeight: 600, fill: 'var(--color-text-muted)' }}>/100</text>
      </svg>
      {label && <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-text)' }}>{label}</span>}
    </div>
  );
};

export default function ResumeJobMatch({ 
  jobDescription, 
  setJobDescription, 
  jobAnalysis, 
  onAnalyze, 
  onTailor, 
  jobLoading, 
  tailorLoading 
}) {
  const [activeTab, setActiveTab] = useState('optimizer'); // optimizer, matches

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Sub Tabs */}
      <div style={{ display: 'flex', background: 'var(--color-surface-2)', padding: '0.25rem', borderRadius: '10px', width: 'fit-content', margin: '0 auto' }}>
        {[
          { id: 'optimizer', label: 'JD Match & Tailoring' },
          { id: 'matches', label: 'Recommended Jobs' }
        ].map(t => (
          <button 
            key={t.id} 
            onClick={() => setActiveTab(t.id)}
            style={{
              padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', fontSize: '0.8rem', fontWeight: 700,
              background: activeTab === t.id ? 'var(--color-surface-3)' : 'transparent',
              color: activeTab === t.id ? 'var(--color-primary-light)' : 'var(--color-text-muted)',
              cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'optimizer' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Header */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'var(--color-primary-glow)', padding: '0.5rem 1.25rem', borderRadius: '99px', marginBottom: '0.75rem' }}>
              <Search size={16} color="var(--color-primary)" />
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-primary)' }}>Job Description Optimizer</span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: 0 }}>Paste target job description to match skills and auto-tailor statements.</p>
          </div>

          {/* Paste Area */}
          <div className="glass-card" style={{ padding: '1.5rem', border: '1px solid var(--color-border)' }}>
            <textarea 
              value={jobDescription} 
              onChange={e => setJobDescription(e.target.value)}
              rows={6} 
              placeholder="Paste the target Job Description (JD) here..."
              style={{ width: '100%', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)', padding: '1rem', borderRadius: '12px', fontSize: '0.9rem', outline: 'none', resize: 'vertical', fontFamily: 'inherit' }}
            />
            <button onClick={onAnalyze} disabled={jobLoading || !jobDescription.trim()} className="btn-primary"
              style={{ width: '100%', padding: '0.85rem', fontSize: '0.9rem', fontWeight: 800, marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', borderRadius: '12px' }}>
              {jobLoading ? <><RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> Comparing Skills...</> : <><Search size={16} /> Compute Target Match %</>}
            </button>
          </div>

          {/* Report */}
          {jobAnalysis && (
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Match Score */}
              <div className="glass-card" style={{ padding: '2.25rem 1.5rem', border: '1px solid var(--color-border)', display: 'flex', justifyContent: 'center' }}>
                <ScoreRing score={jobAnalysis.matchPercentage || 0} label="Job Match Score Compatibility" />
              </div>

              {/* Matched Keywords */}
              {jobAnalysis.matchedKeywords?.length > 0 && (
                <div className="glass-card" style={{ padding: '1.5rem', border: '1px solid var(--color-border)' }}>
                  <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.95rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981' }}>
                    <Check size={16} /> Matched Skills ({jobAnalysis.matchedKeywords.length})
                  </h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    {jobAnalysis.matchedKeywords.map((kw, i) => (
                      <span key={i} style={{ background: '#10b98115', color: '#10b981', border: '1px solid #10b98125', padding: '0.35rem 0.75rem', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 700 }}>
                        ✓ {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Missing Keywords */}
              {jobAnalysis.missingKeywords?.length > 0 && (
                <div className="glass-card" style={{ padding: '1.5rem', border: '1px solid var(--color-border)' }}>
                  <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.95rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444' }}>
                    <AlertCircle size={16} /> Missing Keywords ({jobAnalysis.missingKeywords.length})
                  </h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    {jobAnalysis.missingKeywords.map((kw, i) => (
                      <span key={i} style={{ background: '#ef444415', color: '#ef4444', border: '1px solid #ef444425', padding: '0.35rem 0.75rem', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 700 }}>
                        ✗ {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggestions */}
              {jobAnalysis.suggestions?.length > 0 && (
                <div className="glass-card" style={{ padding: '1.5rem', border: '1px solid var(--color-border)' }}>
                  <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.95rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Sparkles size={16} color="#8b5cf6" /> Recommendations
                  </h4>
                  {jobAnalysis.suggestions.map((s, i) => (
                    <div key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', padding: '0.6rem 0.8rem', background: 'var(--color-surface-2)', borderRadius: '10px', fontSize: '0.8rem', color: 'var(--color-text)', marginBottom: '0.4rem', lineHeight: 1.4 }}>
                      <ChevronRight size={14} color="#8b5cf6" style={{ marginTop: '2px', flexShrink: 0 }} /> {s}
                    </div>
                  ))}
                </div>
              )}

              {/* AI Tailoring Action */}
              <button 
                onClick={onTailor} 
                disabled={tailorLoading} 
                className="btn-primary"
                style={{ 
                  width: '100%', 
                  padding: '1.15rem', 
                  fontSize: '0.95rem', 
                  fontWeight: 800, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '0.5rem', 
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, #8b5cf6, #6366f1)' 
                }}
              >
                {tailorLoading ? (
                  <><RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} /> Tailoring Content...</>
                ) : (
                  <><Sparkles size={18} /> Rewrite Resume Sections for This JD</>
                )}
              </button>

            </motion.div>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-text)' }}>Recommended Jobs</h4>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)', lineHeight: 1.4 }}>
            Based on the skills parsed from your active resume document, we recommend the following target roles:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              { title: 'Software Engineer', company: 'Google', matchScore: 92, location: 'Bangalore', salary: '12 - 18 LPA', type: 'Full-time' },
              { title: 'Full Stack Engineer', company: 'Microsoft', matchScore: 88, location: 'Hyderabad', salary: '15 - 22 LPA', type: 'Full-time' },
              { title: 'Frontend Developer', company: 'Netflix', matchScore: 85, location: 'Remote', salary: '18 - 25 LPA', type: 'Remote' }
            ].map((j, idx) => (
              <div key={idx} className="glass-card" style={{ padding: '1.25rem', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h5 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: 'var(--color-text)' }}>{j.title}</h5>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{j.company}</span>
                  </div>
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#10b981', background: '#10b98115', padding: '0.25rem 0.5rem', borderRadius: '6px' }}>
                    {j.matchScore}% Match
                  </span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><MapPin size={12} /> {j.location}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><DollarSign size={12} /> {j.salary}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Briefcase size={12} /> {j.type}</span>
                </div>
                <button className="btn-ghost" style={{ width: '100%', fontSize: '0.8rem', padding: '0.5rem', marginTop: '0.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
                  Apply on Portal <ExternalLink size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
