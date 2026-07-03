import React from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, Eye, Target, Search, Sparkles, CheckCircle2, 
  TrendingUp, Calendar, Plus, Copy, Trash2, ArrowRight
} from 'lucide-react';

export default function ResumeDashboard({ 
  savedResumes, 
  currentResumeId, 
  onLoadResume, 
  onDuplicate, 
  onDelete, 
  onCreateNew,
  atsAnalysis
}) {
  const totalResumes = savedResumes.length;
  
  // Calculate aggregate stats
  const averageScore = totalResumes > 0 
    ? Math.round(savedResumes.reduce((acc, r) => acc + (r.analysis?.score || 0), 0) / totalResumes) 
    : 0;

  const averageAtsScore = totalResumes > 0 
    ? Math.round(savedResumes.reduce((acc, r) => acc + (r.analysis?.atsScore || 0), 0) / totalResumes) 
    : 0;

  // Visual helper for completion percentages
  const getCompletionPercent = (res) => {
    let fields = 0;
    let filled = 0;
    if (res.personalInfo) {
      fields += 5;
      if (res.personalInfo.name) filled++;
      if (res.personalInfo.email) filled++;
      if (res.personalInfo.phone) filled++;
      if (res.personalInfo.location) filled++;
      if (res.personalInfo.summary) filled++;
    }
    fields += 4;
    if (res.skills?.length) filled++;
    if (res.experiences?.length) filled++;
    if (res.education?.length) filled++;
    if (res.projects?.length) filled++;
    return Math.round((filled / fields) * 100);
  };

  const getScoreColor = (score) => {
    if (score >= 70) return '#10b981';
    if (score >= 40) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', padding: '1rem 0' }}>
      
      {/* Welcome Banner */}
      <div className="glass-card" style={{ padding: '2rem', background: 'linear-gradient(135deg, var(--color-primary-glow), transparent)', border: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 900, margin: 0, color: 'var(--color-text)' }}>AI Resume Hub</h2>
          <p style={{ margin: '0.5rem 0 0', fontSize: '0.95rem', color: 'var(--color-text-muted)' }}>Build, optimize, and match your resumes against top target roles.</p>
        </div>
        <button onClick={onCreateNew} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.85rem 1.5rem', borderRadius: '12px' }}>
          <Plus size={18} /> Create Resume
        </button>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
        {[
          { label: 'Saved Resumes', value: totalResumes, desc: 'Active resume versions', icon: FileText, color: 'var(--color-primary)' },
          { label: 'Avg Profile Score', value: `${averageScore}%`, desc: 'Completeness & quality', icon: Sparkles, color: '#8b5cf6' },
          { label: 'Avg ATS Score', value: `${averageAtsScore}%`, desc: 'ATS compatibility rating', icon: Target, color: '#10b981' },
          { label: 'Resume Views', value: totalResumes * 4, desc: 'Shared link traffic tracking', icon: Eye, color: '#06b6d4' }
        ].map((stat, i) => (
          <motion.div 
            key={i} 
            initial={{ opacity: 0, y: 15 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: i * 0.05 }}
            className="glass-card" 
            style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', border: '1px solid var(--color-border)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-text-muted)' }}>{stat.label}</span>
              <div style={{ width: '32px', height: '32px', background: `${stat.color}15`, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: stat.color }}>
                <stat.icon size={16} />
              </div>
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--color-text)' }}>{stat.value}</div>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{stat.desc}</span>
          </motion.div>
        ))}
      </div>

      {/* Main Section Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '2.5rem' }}>
        
        {/* Left Column: My Resumes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-text)' }}>My Saved Resumes</h3>
          
          {totalResumes === 0 ? (
            <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', border: '1px dashed var(--color-border)' }}>
              <FileText size={48} color="var(--color-text-muted)" style={{ margin: '0 auto 1rem' }} />
              <p style={{ margin: 0, fontWeight: 700, color: 'var(--color-text)' }}>No Resumes Yet</p>
              <p style={{ margin: '0.25rem 0 1.5rem', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Create your first ATS-friendly resume using our AI editor.</p>
              <button onClick={onCreateNew} className="btn-primary" style={{ padding: '0.6rem 1.25rem' }}>Get Started</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {savedResumes.map((res) => {
                const completion = getCompletionPercent(res);
                const isActive = currentResumeId === res._id;
                return (
                  <div 
                    key={res._id} 
                    className="glass-card" 
                    style={{ 
                      padding: '1.25rem 1.5rem', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      gap: '1rem',
                      border: isActive ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                      background: isActive ? 'var(--color-surface)' : 'var(--color-surface-2)',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--color-text)' }}>{res.resumeTitle}</h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.25rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                          <span>Updated {new Date(res.updatedAt).toLocaleDateString()}</span>
                          <span>•</span>
                          <span>{res.templateId?.toUpperCase()} Layout</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={() => onDuplicate(res._id)} className="btn-ghost" style={{ padding: '0.35rem' }} title="Duplicate Version">
                          <Copy size={14} />
                        </button>
                        <button onClick={() => onDelete(res._id)} className="btn-ghost" style={{ padding: '0.35rem', color: 'var(--color-danger)' }} title="Delete">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '1.5rem', alignItems: 'center' }}>
                      {/* Completion bar */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                          <span style={{ fontWeight: 700, color: 'var(--color-text-muted)' }}>Completeness</span>
                          <span style={{ fontWeight: 800, color: 'var(--color-primary)' }}>{completion}%</span>
                        </div>
                        <div style={{ width: '100%', height: '6px', background: 'var(--color-surface-3)', borderRadius: '99px', overflow: 'hidden' }}>
                          <div style={{ width: `${completion}%`, height: '100%', background: 'var(--color-primary)', borderRadius: '99px' }} />
                        </div>
                      </div>

                      {/* Analysis scores */}
                      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                        {res.analysis?.score > 0 && (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontWeight: 700 }}>PROFILE</span>
                            <span style={{ fontSize: '0.9rem', fontWeight: 800, color: getScoreColor(res.analysis.score) }}>{res.analysis.score}%</span>
                          </div>
                        )}
                        {res.analysis?.atsScore > 0 && (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontWeight: 700 }}>ATS</span>
                            <span style={{ fontSize: '0.9rem', fontWeight: 800, color: getScoreColor(res.analysis.atsScore) }}>{res.analysis.atsScore}%</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem', borderTop: '1px solid var(--color-border-subtle)' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                        {res.isPublic ? '🌐 Public share link active' : '🔒 Private document'}
                      </span>
                      <button onClick={() => onLoadResume(res)} className="btn-ghost" style={{ padding: '0.4rem 0.85rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--color-primary-light)' }}>
                        Open in Editor <ArrowRight size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: AI Suggestions Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-text)' }}>AI Recommendations</h3>
          
          <div className="glass-card" style={{ padding: '1.5rem', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {atsAnalysis?.tips?.length > 0 ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary)', fontWeight: 800, fontSize: '0.9rem' }}>
                  <Sparkles size={16} />
                  <span>Resume Insights</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {atsAnalysis.tips.slice(0, 4).map((tip, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', padding: '0.6rem 0.8rem', background: 'var(--color-surface-3)', borderRadius: '10px', fontSize: '0.85rem', color: 'var(--color-text)' }}>
                      <CheckCircle2 size={14} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
                      <span>{tip}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                <Sparkles size={32} color="var(--color-text-muted)" style={{ margin: '0 auto 0.75rem' }} />
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                  Open a resume and run the ATS analyzer to receive custom AI tips.
                </p>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
