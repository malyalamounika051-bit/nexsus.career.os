import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle2, AlertCircle, TrendingUp, Sparkles, 
  Link, Globe, Code2, Award, FileText, ArrowRight 
} from 'lucide-react';

export default function ResumeProfileMatch({ info, skills, technicalSkills, softSkills, experiences, projects, certifications, researchPapers }) {
  
  const report = useMemo(() => {
    const missing = [];
    let score = 100;

    // Check personal info & socials
    if (!info.linkedin) {
      missing.push({ id: 'linkedin', text: 'LinkedIn profile link is missing.', category: 'social', severity: 'medium' });
      score -= 8;
    }
    if (!info.github) {
      missing.push({ id: 'github', text: 'GitHub profile link is missing.', category: 'social', severity: 'medium' });
      score -= 8;
    }
    if (!info.portfolio) {
      missing.push({ id: 'portfolio', text: 'Portfolio website link is missing.', category: 'social', severity: 'medium' });
      score -= 7;
    }
    if (!info.leetcode && !info.codeforces) {
      missing.push({ id: 'coding', text: 'No competitive coding profiles linked (LeetCode / Codeforces).', category: 'social', severity: 'low' });
      score -= 5;
    }

    // Check summaries
    if (!info.summary || info.summary.length < 30) {
      missing.push({ id: 'summary', text: 'Professional summary is too short or missing.', category: 'profile', severity: 'high' });
      score -= 15;
    }
    if (!info.objective) {
      missing.push({ id: 'objective', text: 'Career objective is missing.', category: 'profile', severity: 'low' });
      score -= 5;
    }

    // Check skills
    const totalSkillsCount = (skills?.length || 0) + (technicalSkills?.length || 0) + (softSkills?.length || 0);
    if (totalSkillsCount < 5) {
      missing.push({ id: 'skills', text: 'Add at least 5 technical or soft skills to your profile.', category: 'skills', severity: 'high' });
      score -= 15;
    }

    // Check experiences & projects
    if (!experiences || experiences.length === 0 || (experiences.length === 1 && !experiences[0].title)) {
      missing.push({ id: 'experience', text: 'No work experience or internships added.', category: 'experience', severity: 'high' });
      score -= 15;
    } else {
      // Check if experience descriptions have numbers/metrics
      const hasMetrics = experiences.some(exp => /\b\d+(%|\d)\b/.test(exp.desc || ''));
      if (!hasMetrics) {
        missing.push({ id: 'metrics', text: 'Work experiences lack measurable metrics or quantitative achievements.', category: 'experience', severity: 'medium' });
        score -= 7;
      }
    }

    if (!projects || projects.length === 0) {
      missing.push({ id: 'projects', text: 'Add at least one key project or hackathon.', category: 'projects', severity: 'high' });
      score -= 12;
    } else {
      const missingGit = projects.some(p => !p.github);
      if (missingGit) {
        missing.push({ id: 'proj-github', text: 'Some projects are missing GitHub repository links.', category: 'projects', severity: 'medium' });
        score -= 5;
      }
      const missingDemo = projects.some(p => !p.link);
      if (missingDemo) {
        missing.push({ id: 'proj-link', text: 'Some projects are missing Live Demo URLs.', category: 'projects', severity: 'low' });
        score -= 3;
      }
    }

    // Check certifications & publications
    if (!certifications || certifications.length === 0) {
      missing.push({ id: 'certifications', text: 'No professional certifications listed.', category: 'certifications', severity: 'medium' });
      score -= 5;
    }

    return {
      score: Math.max(10, score),
      missing
    };
  }, [info, skills, technicalSkills, softSkills, experiences, projects, certifications, researchPapers]);

  const getScoreColor = (score) => {
    if (score >= 85) return 'var(--color-success)';
    if (score >= 60) return 'var(--color-warning)';
    return 'var(--color-danger)';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Overview Card */}
      <div className="glass-card" style={{ padding: '2rem', border: '1px solid var(--color-border)', display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem', alignItems: 'center' }}>
        
        {/* Visual score gauge */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '110px', height: '110px', borderRadius: '50%', border: `8px solid var(--color-border)`, borderTopColor: getScoreColor(report.score), display: 'flex', alignItems: 'center', justifyContent: 'center', transform: 'rotate(-45deg)' }}>
            <span style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--color-text)', transform: 'rotate(45deg)' }}>
              {report.score}%
            </span>
          </div>
          <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Completion Score</span>
        </div>

        {/* Action Call */}
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'var(--color-primary-glow)', padding: '0.4rem 0.85rem', borderRadius: '99px', marginBottom: '0.75rem' }}>
            <Sparkles size={13} color="var(--color-primary)" />
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-primary)' }}>AI Completeness Audit</span>
          </div>
          <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text)' }}>
            {report.score === 100 ? 'Outstanding! Profile fully complete.' : 'Complete Your Profile'}
          </h3>
          <p style={{ margin: '0.5rem 0 0', fontSize: '0.85rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
            Adding missing social profiles, projects, and measurable achievements will automatically boost your ATS compatibility score by 15-20 points.
          </p>
        </div>
      </div>

      {/* Recommended Improvements Checklist */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--color-text)' }}>Actionable Recommendations</h4>
        
        {report.missing.length === 0 ? (
          <div className="glass-card" style={{ padding: '2rem', textAlign: 'center', border: '1px solid var(--color-border)' }}>
            <CheckCircle2 size={32} color="var(--color-success)" style={{ margin: '0 auto 0.75rem' }} />
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>All checked categories are complete. Ready for target resume generation!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {report.missing.map(item => (
              <div 
                key={item.id} 
                className="glass-card" 
                style={{ 
                  padding: '1.15rem', border: '1px solid var(--color-border)', background: 'var(--color-surface-2)',
                  display: 'flex', alignItems: 'flex-start', gap: '1rem', transition: 'all 0.2s' 
                }}
              >
                <div style={{ padding: '0.4rem', borderRadius: '8px', background: item.severity === 'high' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)', color: item.severity === 'high' ? 'var(--color-danger)' : 'var(--color-warning)', marginTop: '2px' }}>
                  <AlertCircle size={15} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text)' }}>{item.text}</p>
                  <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 700, marginTop: '0.25rem', display: 'inline-block' }}>
                    Category: {item.category} • Severity: {item.severity}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
