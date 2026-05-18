import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { assessmentService } from '../services/assessmentService';
import Sidebar from '../components/Sidebar';
import { Dna, ChevronRight, ChevronLeft, CheckCircle2, Zap, Sparkles } from 'lucide-react';

const questions = [
  {
    id: 1, question: 'What energizes you the most in your work?',
    options: [
      { label: '🔧 Building and creating things', value: 'building_creating' },
      { label: '📊 Analyzing data and finding patterns', value: 'analyzing_data' },
      { label: '🧑‍💼 Leading and managing teams', value: 'leading_teams' },
      { label: '🤝 Helping and connecting with people', value: 'helping_people' },
      { label: '🎨 Designing beautiful experiences', value: 'designing_experiences' },
    ],
  },
  {
    id: 2, question: 'How would you describe your ideal work style?',
    options: [
      { label: '💻 Highly technical and logical', value: 'highly_technical' },
      { label: '✨ Creative and innovative', value: 'creative_innovative' },
      { label: '🗺️ Strategic and planning-focused', value: 'strategic_planning' },
      { label: '👥 Collaborative and people-focused', value: 'people_focused' },
    ],
  },
  {
    id: 3, question: 'How comfortable are you with coding and technology?',
    options: [
      { label: '🚀 Very comfortable — I love it', value: 'very_comfortable' },
      { label: '👍 Somewhat comfortable', value: 'somewhat_comfortable' },
      { label: '🙅 I prefer non-technical work', value: 'prefer_no_coding' },
      { label: '📚 Open to learning it', value: 'open_to_learning' },
    ],
  },
  {
    id: 4, question: 'What is your biggest career priority right now?',
    options: [
      { label: '📈 Fast career growth', value: 'fast_growth' },
      { label: '💰 High income potential', value: 'high_income' },
      { label: '🎭 Creative freedom', value: 'creative_freedom' },
      { label: '🌍 Social impact', value: 'social_impact' },
      { label: '⚖️ Work-life balance', value: 'work_life_balance' },
    ],
  },
  {
    id: 5, question: 'What kind of projects do you enjoy most?',
    options: [
      { label: '🛠️ Building practical products', value: 'practical_projects' },
      { label: '🔬 Deep research and analysis', value: 'research_study' },
      { label: '🤝 Team collaboration projects', value: 'team_collaboration' },
      { label: '💡 Solo innovation and experiments', value: 'solo_innovation' },
    ],
  },
  {
    id: 6, question: 'What is your current education level?',
    options: [
      { label: '🏫 High School', value: 'high_school' },
      { label: '🎓 Undergraduate (pursuing or completed)', value: 'undergraduate' },
      { label: '📜 Graduate / Post-Graduate', value: 'graduate' },
      { label: '🖥️ Self-taught / Bootcamp', value: 'self_taught' },
    ],
  },
  {
    id: 7, question: 'How do you learn best?',
    options: [
      { label: '🎬 Video tutorials and courses', value: 'videos_courses' },
      { label: '📖 Books and articles', value: 'books_articles' },
      { label: '⚒️ Hands-on projects', value: 'hands_on' },
      { label: '👨‍🏫 Mentorship and collaboration', value: 'mentorship' },
    ],
  },
  {
    id: 8, question: 'Which domain excites you the most?',
    options: [
      { label: '🤖 Technology / AI / Engineering', value: 'tech_ai' },
      { label: '🎨 Design / UX / Creative', value: 'design_ux' },
      { label: '📋 Business / Management / Strategy', value: 'business_management' },
      { label: '🏥 Healthcare / Sciences', value: 'healthcare' },
      { label: '📚 Education / Social Work', value: 'education' },
      { label: '💹 Finance / Economics', value: 'finance' },
    ],
  },
];

const CareerDNA = () => {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const navigate = useNavigate();

  const q = questions[current];
  const progress = ((current) / questions.length) * 100;

  const handleSelect = (value) => {
    setSelected(value);
    setAnswers(prev => ({
      ...prev,
      [q.id]: { questionId: q.id, question: q.question, value, selectedOption: q.options.find(o => o.value === value)?.label || '' },
    }));
  };

  const handleNext = () => {
    if (!answers[q.id]) return;
    if (current < questions.length - 1) {
      setCurrent(prev => prev + 1);
      setSelected(answers[questions[current + 1]?.id]?.value || null);
    }
  };

  const handleBack = () => {
    if (current > 0) {
      setCurrent(prev => prev - 1);
      setSelected(answers[questions[current - 1]?.id]?.value || null);
    }
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length < questions.length) {
      setError('Please answer all questions before submitting.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const answersArray = Object.values(answers);
      const { data } = await assessmentService.submit(answersArray);
      navigate(`/results?id=${data.data._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="app-shell">
      <Sidebar collapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(c => !c)} />
      <main className={`app-main ${sidebarCollapsed ? 'sidebar-is-collapsed' : ''}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: 680 }}>
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '2rem', textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14,
                background: 'var(--gradient-primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 25px rgba(14,165,233,0.3), 0 0 60px rgba(168,85,247,0.15)',
              }}>
                <Dna size={24} color="white" />
              </div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: "'Space Grotesk', sans-serif" }}>
                Career <span className="gradient-text">DNA</span>
              </h1>
            </div>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
              Answer 8 questions to discover your unique career identity
            </p>
          </motion.div>

          {/* Progress */}
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Question {current + 1} of {questions.length}</span>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-primary-light)' }}>{Math.round(progress)}% complete</span>
            </div>
            <div className="progress-bar">
              <motion.div className="progress-bar-fill" initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.5 }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem' }}>
              {questions.map((_, i) => (
                <div key={i} style={{
                  width: i === current ? 24 : 8, height: 8, borderRadius: 4,
                  background: i < current ? 'var(--color-primary)' : i === current ? 'var(--color-primary-light)' : 'var(--color-border)',
                  transition: 'all 0.3s',
                  boxShadow: i === current ? '0 0 8px var(--color-primary)' : 'none',
                }} />
              ))}
            </div>
          </div>

          {/* Question card */}
          <AnimatePresence mode="wait">
            <motion.div
              key={q.id}
              initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3 }}
              className="glass-card"
              style={{ padding: '2rem', marginBottom: '1.5rem' }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '1.75rem' }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 10,
                  background: 'var(--color-primary-glow)', border: '1px solid rgba(14,165,233,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-primary-light)',
                }}>
                  {current + 1}
                </div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 700, lineHeight: 1.4, fontFamily: "'Space Grotesk', sans-serif" }}>{q.question}</h2>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {q.options.map((opt) => {
                  const isSelected = (answers[q.id]?.value || selected) === opt.value;
                  return (
                    <motion.button
                      key={opt.value}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => handleSelect(opt.value)}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '0.95rem 1.25rem', borderRadius: 12, cursor: 'pointer',
                        border: `1px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-border)'}`,
                        background: isSelected ? 'var(--color-primary-glow)' : 'var(--color-surface-2)',
                        color: isSelected ? 'var(--color-primary-light)' : 'var(--color-text)',
                        textAlign: 'left', fontWeight: 500, fontSize: '0.9rem', transition: 'all 0.25s',
                        boxShadow: isSelected ? '0 0 15px rgba(14,165,233,0.15)' : 'none',
                      }}
                    >
                      <span>{opt.label}</span>
                      {isSelected && <CheckCircle2 size={18} color="var(--color-primary-light)" />}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          </AnimatePresence>

          {error && (
            <div style={{ color: '#fca5a5', fontSize: '0.875rem', textAlign: 'center', marginBottom: '1rem' }}>{error}</div>
          )}

          {/* Navigation */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              className="btn-ghost"
              onClick={handleBack}
              disabled={current === 0}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: current === 0 ? 0.4 : 1 }}
            >
              <ChevronLeft size={18} /> Previous
            </button>

            {current < questions.length - 1 ? (
              <button
                className="btn-primary"
                onClick={handleNext}
                disabled={!answers[q.id]}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: !answers[q.id] ? 0.5 : 1 }}
              >
                Next <ChevronRight size={18} />
              </button>
            ) : (
              <button
                id="submit-assessment"
                className="btn-primary"
                onClick={handleSubmit}
                disabled={loading || !answers[q.id]}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  opacity: loading || !answers[q.id] ? 0.7 : 1,
                  boxShadow: !loading && answers[q.id] ? '0 0 25px rgba(14,165,233,0.3), 0 0 60px rgba(168,85,247,0.15)' : 'none',
                }}
              >
                {loading ? (
                  <>
                    <Sparkles size={18} className="animate-spin" /> Analyzing DNA...
                  </>
                ) : (
                  <>
                    <Zap size={18} /> Reveal Career DNA
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default CareerDNA;
