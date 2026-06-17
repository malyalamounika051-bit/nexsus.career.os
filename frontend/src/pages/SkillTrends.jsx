import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../components/Sidebar';
import SkillGraph from '../components/SkillGraph';
import TrendGauge from '../components/TrendGauge';
import SkillTag from '../components/SkillTag';
import api from '../services/api';
import {
  TrendingUp, Search, Sparkles, Briefcase, Award,
  DollarSign, BarChart2, BookOpen, HelpCircle, Flame,
  Zap, ArrowUpRight, ChevronRight, Brain, Layers
} from 'lucide-react';

const CATEGORIES = ['All', 'AI/ML', 'Cloud', 'Frontend', 'Backend', 'DevOps', 'Data'];

export default function SkillTrends() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('All');
  const [trendingSkills, setTrendingSkills] = useState([]);
  const [trendingLoading, setTrendingLoading] = useState(true);
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [deepDiveData, setDeepDiveData] = useState(null);
  const [deepDiveLoading, setDeepDiveLoading] = useState(false);
  const [graphData, setGraphData] = useState(null);
  const [graphLoading, setGraphLoading] = useState(false);
  const [salaryData, setSalaryData] = useState(null);
  const [learnNextData, setLearnNextData] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');

  // Fetch trending skills on mount
  useEffect(() => {
    const fetchTrending = async () => {
      setTrendingLoading(true);
      try {
        const { data } = await api.get('/skill-intelligence/trending');
        if (data.success && data.data?.skills && Array.isArray(data.data.skills) && data.data.skills.length > 0) {
          setTrendingSkills(data.data.skills);
        } else {
          throw new Error('API returned empty or invalid skills array');
        }
      } catch (err) {
        console.warn('Failed to fetch trending skills, using fallback data:', err);
        // Fallback trending data
        setTrendingSkills([
          { rank: 1, name: 'AI Agents', trendScore: 97, futureRelevance: 'Very High', marketGrowth: '+180%', avgSalaryLpa: 25, category: 'ai', description: 'Building autonomous AI systems and multi-agent frameworks' },
          { rank: 2, name: 'RAG Systems', trendScore: 94, futureRelevance: 'Very High', marketGrowth: '+160%', avgSalaryLpa: 22, category: 'ai', description: 'Retrieval-Augmented Generation for enterprise AI' },
          { rank: 3, name: 'Kubernetes', trendScore: 91, futureRelevance: 'High', marketGrowth: '+85%', avgSalaryLpa: 20, category: 'devops', description: 'Container orchestration at scale' },
          { rank: 4, name: 'Next.js', trendScore: 89, futureRelevance: 'High', marketGrowth: '+95%', avgSalaryLpa: 18, category: 'frontend', description: 'Full-stack React framework for production' },
          { rank: 5, name: 'LangChain', trendScore: 88, futureRelevance: 'Very High', marketGrowth: '+200%', avgSalaryLpa: 24, category: 'ai', description: 'LLM application development framework' },
          { rank: 6, name: 'Rust', trendScore: 86, futureRelevance: 'High', marketGrowth: '+120%', avgSalaryLpa: 22, category: 'backend', description: 'High-performance systems programming' },
          { rank: 7, name: 'Terraform', trendScore: 84, futureRelevance: 'High', marketGrowth: '+75%', avgSalaryLpa: 19, category: 'devops', description: 'Infrastructure as Code for cloud' },
          { rank: 8, name: 'GraphQL', trendScore: 82, futureRelevance: 'High', marketGrowth: '+65%', avgSalaryLpa: 17, category: 'backend', description: 'Efficient API query language' },
          { rank: 9, name: 'Apache Kafka', trendScore: 80, futureRelevance: 'High', marketGrowth: '+55%', avgSalaryLpa: 21, category: 'data', description: 'Event streaming platform for real-time data' },
          { rank: 10, name: 'Edge Computing', trendScore: 78, futureRelevance: 'Very High', marketGrowth: '+140%', avgSalaryLpa: 20, category: 'cloud', description: 'Processing data at network edge' },
          { rank: 11, name: 'Cybersecurity AI', trendScore: 77, futureRelevance: 'Very High', marketGrowth: '+130%', avgSalaryLpa: 23, category: 'ai', description: 'AI-powered threat detection and response' },
          { rank: 12, name: 'Flutter', trendScore: 75, futureRelevance: 'High', marketGrowth: '+70%', avgSalaryLpa: 15, category: 'frontend', description: 'Cross-platform mobile development' },
        ]);
      } finally {
        setTrendingLoading(false);
      }
    };
    fetchTrending();
  }, []);

  const handleSelectSkill = async (skill) => {
    setSelectedSkill(skill);
    setDeepDiveLoading(true);
    setError('');

    // Fetch correlation data
    try {
      const { data } = await api.get(`/careers/skill-correlation?skill=${encodeURIComponent(skill.name)}`);
      if (data.success) setDeepDiveData(data.data);
    } catch {
      setDeepDiveData(null);
    }

    // Fetch salary data
    try {
      const { data } = await api.get(`/skill-intelligence/salary/${encodeURIComponent(skill.name)}`);
      if (data.success) setSalaryData(data.data);
    } catch {
      setSalaryData({
        skill: skill.name, entrySalary: '₹4-8 LPA', midSalary: '₹12-22 LPA',
        seniorSalary: '₹25-45 LPA', avgSalary: '₹18 LPA',
        topCompanies: ['Google', 'Microsoft', 'Amazon', 'Flipkart', 'Razorpay'],
        demandLevel: 'High', growthRate: '+35%',
      });
    }

    // Fetch learn-next
    try {
      const { data } = await api.post('/skill-intelligence/learn-next', { currentSkills: [skill.name] });
      if (data.success) setLearnNextData(data.data);
    } catch {
      setLearnNextData({
        recommendations: [
          { skill: 'TypeScript', reason: 'Type safety for large projects', difficulty: 'Medium', timeToLearn: '2-3 months', salaryBoost: '+18%', demandScore: 90, category: 'frontend' },
          { skill: 'Docker', reason: 'Essential for modern deployment', difficulty: 'Medium', timeToLearn: '1-2 months', salaryBoost: '+22%', demandScore: 88, category: 'devops' },
          { skill: 'System Design', reason: 'Required for senior roles', difficulty: 'Hard', timeToLearn: '3-4 months', salaryBoost: '+30%', demandScore: 92, category: 'backend' },
        ],
      });
    }

    // Fetch skill graph
    setGraphLoading(true);
    try {
      const { data } = await api.post('/skill-intelligence/graph', { skills: [skill.name] });
      if (data.success) setGraphData(data.data);
    } catch {
      setGraphData({
        nodes: [
          { id: skill.name.toLowerCase(), label: skill.name, category: skill.category || 'frontend', size: 5 },
          { id: 'typescript', label: 'TypeScript', category: 'frontend', size: 3 },
          { id: 'node.js', label: 'Node.js', category: 'backend', size: 3 },
          { id: 'docker', label: 'Docker', category: 'devops', size: 2 },
          { id: 'aws', label: 'AWS', category: 'devops', size: 3 },
          { id: 'mongodb', label: 'MongoDB', category: 'data', size: 2 },
          { id: 'graphql', label: 'GraphQL', category: 'backend', size: 2 },
        ],
        edges: [
          { source: skill.name.toLowerCase(), target: 'typescript', strength: 0.85 },
          { source: skill.name.toLowerCase(), target: 'node.js', strength: 0.8 },
          { source: skill.name.toLowerCase(), target: 'docker', strength: 0.5 },
          { source: 'node.js', target: 'mongodb', strength: 0.75 },
          { source: 'node.js', target: 'aws', strength: 0.6 },
          { source: 'typescript', target: 'graphql', strength: 0.55 },
        ],
      });
    } finally {
      setGraphLoading(false);
      setDeepDiveLoading(false);
    }
  };

  const getRankClass = (rank) => rank === 1 ? 'gold' : rank === 2 ? 'silver' : rank === 3 ? 'bronze' : 'default';

  const categoryMap = {
    'All': null, 'AI/ML': 'ai', 'Cloud': 'cloud', 'Frontend': 'frontend',
    'Backend': 'backend', 'DevOps': 'devops', 'Data': 'data',
  };

  const filteredSkills = trendingSkills.filter(s => {
    const catMatch = activeTab === 'All' || s.category === categoryMap[activeTab];
    const searchMatch = !searchQuery || s.name.toLowerCase().includes(searchQuery.toLowerCase());
    return catMatch && searchMatch;
  });

  // Skeleton for trending list
  const TrendingSkeleton = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="skel-pulse" style={{ height: 56, borderRadius: 12 }} />
      ))}
    </div>
  );

  return (
    <div className="app-shell">
      <Sidebar collapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(c => !c)} />
      <main className={`app-main ${sidebarCollapsed ? 'sidebar-is-collapsed' : ''}`}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(14,165,233,0.3)' }}>
              <TrendingUp size={22} color="white" />
            </div>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: "'Space Grotesk', sans-serif" }}>
                Market Skill <span className="gradient-text">Trends Engine</span>
              </h1>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                Discover trending skills, salary insights, and your next learning path
              </p>
            </div>
          </div>
        </motion.div>

        {/* Search + Category Tabs */}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: '1 1 280px', maxWidth: 360 }}>
            <Search size={16} color="var(--color-text-muted)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input className="input" style={{ paddingLeft: '2.5rem', height: 42 }}
              placeholder="Search skills..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </div>
        </div>
        <div className="cat-tabs">
          {CATEGORIES.map(cat => (
            <button key={cat} className={`cat-tab ${activeTab === cat ? 'active' : ''}`}
              onClick={() => setActiveTab(cat)}>{cat}</button>
          ))}
        </div>

        {/* Main Layout: Leaderboard + Deep Dive */}
        <div style={{ display: 'grid', gridTemplateColumns: selectedSkill ? '340px 1fr' : '1fr', gap: '1.5rem' }}>

          {/* ═══ TRENDING LEADERBOARD ═══ */}
          <div>
            <div className="hub-section-title"><Flame size={18} color="#f59e0b" /> Trending Skills Leaderboard</div>

            {trendingLoading ? <TrendingSkeleton /> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <AnimatePresence>
                  {filteredSkills.map((skill, i) => (
                    <motion.div key={skill.name}
                      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className={`trend-lb-item ${selectedSkill?.name === skill.name ? 'active' : ''}`}
                      onClick={() => handleSelectSkill(skill)}
                      style={selectedSkill?.name === skill.name ? { borderColor: 'var(--color-primary)', background: 'rgba(14,165,233,0.08)' } : {}}
                    >
                      <div className={`trend-lb-rank ${getRankClass(skill.rank)}`}>{skill.rank}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--color-text)' }}>{skill.name}</span>
                          {skill.trendScore >= 90 && <Flame size={13} color="#f59e0b" />}
                        </div>
                        <div className="trend-lb-bar">
                          <div className="trend-lb-bar-fill" style={{ width: `${skill.trendScore}%` }} />
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: '0.88rem', fontWeight: 800, fontFamily: "'Space Grotesk', sans-serif", color: skill.marketGrowth?.startsWith('+') && parseInt(skill.marketGrowth) > 100 ? '#10b981' : 'var(--color-primary-light)' }}>
                          {skill.marketGrowth}
                        </div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>growth</div>
                      </div>
                      <ChevronRight size={16} color="var(--color-text-muted)" />
                    </motion.div>
                  ))}
                </AnimatePresence>
                {filteredSkills.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                    No skills match your filter
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ═══ DEEP DIVE PANEL ═══ */}
          {selectedSkill && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
              {deepDiveLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {[120, 200, 180, 150].map((h, i) => (
                    <div key={i} className="skel-pulse" style={{ height: h, borderRadius: 16 }} />
                  ))}
                </div>
              ) : (
                <>
                  {/* Skill Header Card */}
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="glass-card anim-glow-pulse" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                      <div>
                        <h2 style={{ fontSize: '1.35rem', fontWeight: 800, fontFamily: "'Space Grotesk', sans-serif" }}>
                          {selectedSkill.name}
                          {selectedSkill.trendScore >= 90 && <Flame size={18} color="#f59e0b" style={{ marginLeft: 6 }} />}
                        </h2>
                        <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', maxWidth: 400, marginTop: '0.25rem' }}>
                          {selectedSkill.description}
                        </p>
                      </div>
                      <TrendGauge value={selectedSkill.trendScore} size={110} label="Trend Score" />
                    </div>

                    {/* Metric row */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                      {[
                        { label: 'Future Demand', value: selectedSkill.futureRelevance, color: selectedSkill.futureRelevance === 'Very High' ? '#10b981' : '#0ea5e9', icon: ArrowUpRight },
                        { label: 'Market Growth', value: selectedSkill.marketGrowth, color: '#10b981', icon: TrendingUp },
                        { label: 'Avg Salary', value: `₹${selectedSkill.avgSalaryLpa} LPA`, color: '#f59e0b', icon: DollarSign },
                        { label: 'Career Paths', value: deepDiveData?.count ? `${deepDiveData.count} roles` : 'N/A', color: '#a855f7', icon: Briefcase },
                      ].map((m, i) => (
                        <div key={i} style={{ textAlign: 'center', padding: '0.75rem', borderRadius: 12, background: 'var(--color-surface-2)' }}>
                          <m.icon size={16} color={m.color} style={{ marginBottom: '0.3rem' }} />
                          <div style={{ fontSize: '1rem', fontWeight: 800, fontFamily: "'Space Grotesk', sans-serif", color: m.color }}>{m.value}</div>
                          <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>{m.label}</div>
                        </div>
                      ))}
                    </div>
                  </motion.div>

                  {/* Interactive Skill Graph */}
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                    <div className="hub-section-title"><Layers size={18} color="var(--color-primary-light)" /> Skill Relationship Graph</div>
                    {graphLoading ? (
                      <div className="skel-pulse" style={{ height: 350, borderRadius: 16 }} />
                    ) : graphData ? (
                      <SkillGraph
                        nodes={graphData.nodes || []}
                        edges={graphData.edges || []}
                        width={Math.min(700, window.innerWidth - 500)}
                        height={380}
                        selectedNodeId={selectedSkill.name.toLowerCase()}
                      />
                    ) : (
                      <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}>
                        Graph data unavailable
                      </div>
                    )}
                  </motion.div>

                  {/* Salary Intelligence + Co-occurring Skills */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
                    {/* Salary Intelligence */}
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                      className="glass-card" style={{ padding: '1.5rem' }}>
                      <div className="hub-section-title"><DollarSign size={18} color="#10b981" /> Salary Intelligence</div>
                      {salaryData && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          {[
                            { level: 'Entry Level', salary: salaryData.entrySalary, color: '#38bdf8' },
                            { level: 'Mid Level', salary: salaryData.midSalary, color: '#10b981' },
                            { level: 'Senior Level', salary: salaryData.seniorSalary, color: '#f59e0b' },
                          ].map((item, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', borderRadius: 10, background: 'var(--color-surface-2)' }}>
                              <span style={{ fontSize: '0.82rem', color: 'var(--color-text-dim)' }}>{item.level}</span>
                              <span style={{ fontSize: '0.95rem', fontWeight: 800, fontFamily: "'Space Grotesk', sans-serif", color: item.color }}>{item.salary}</span>
                            </div>
                          ))}
                          {salaryData.topCompanies && (
                            <div style={{ marginTop: '0.5rem' }}>
                              <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase' }}>Top Hiring Companies</div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                                {salaryData.topCompanies.map(c => (
                                  <SkillTag key={c} label={c} variant="neutral" size="sm" animated={false} />
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </motion.div>

                    {/* Co-occurring Skills */}
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                      className="glass-card" style={{ padding: '1.5rem' }}>
                      <div className="hub-section-title"><Sparkles size={18} color="var(--color-primary-light)" /> Often Paired With</div>
                      {deepDiveData?.correlations?.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          {deepDiveData.correlations.slice(0, 6).map((item, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0' }}>
                              <span style={{ fontSize: '0.85rem', fontWeight: 600, flex: 1 }}>{item.skill}</span>
                              <div style={{ width: 80, height: 5, borderRadius: 99, background: 'rgba(255,255,255,0.04)', overflow: 'hidden' }}>
                                <div style={{ height: '100%', borderRadius: 99, width: `${item.probability}%`, background: 'var(--gradient-primary)' }} />
                              </div>
                              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-primary-light)', fontFamily: "'JetBrains Mono', monospace", minWidth: 36, textAlign: 'right' }}>{item.probability}%</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                          Generate more career roadmaps to build correlation data
                        </div>
                      )}
                    </motion.div>
                  </div>

                  {/* Learn Next Recommendations */}
                  {learnNextData?.recommendations && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                      className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                      <div className="hub-section-title"><Brain size={18} color="#a855f7" /> Learn Next</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem' }}>
                        {learnNextData.recommendations.map((rec, i) => (
                          <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 + i * 0.06 }}
                            style={{ padding: '1rem', borderRadius: 12, background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', transition: 'border-color 0.2s' }}
                            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-accent)'}
                            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                              <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{rec.skill}</span>
                              <span className={`difficulty-badge ${rec.difficulty?.toLowerCase() === 'hard' ? 'hard' : rec.difficulty?.toLowerCase() === 'medium' ? 'medium' : 'easy'}`}>
                                {rec.difficulty}
                              </span>
                            </div>
                            <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginBottom: '0.6rem', lineHeight: 1.4 }}>{rec.reason}</p>
                            <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.72rem' }}>
                              <span style={{ color: '#10b981' }}>💰 {rec.salaryBoost}</span>
                              <span style={{ color: '#0ea5e9' }}>⏱ {rec.timeToLearn}</span>
                              <span style={{ color: '#f59e0b' }}>📊 {rec.demandScore}/100</span>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Career Paths */}
                  {deepDiveData?.matchingCareers?.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                      className="glass-card" style={{ padding: '1.5rem' }}>
                      <div className="hub-section-title"><Briefcase size={18} color="#ef4444" /> Career Paths Using {selectedSkill.name}</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {deepDiveData.matchingCareers.map((c, i) => (
                          <SkillTag key={i} label={`${c.domain} — ₹${c.avgSalaryLpa} LPA`} variant="danger" size="md" delay={0.3 + i * 0.05} />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </>
              )}
            </motion.div>
          )}

          {/* Empty state when no skill selected */}
          {!selectedSkill && !trendingLoading && (
            <div style={{
              display: 'none',
            }} />
          )}
        </div>
      </main>
    </div>
  );
}
