import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import Sidebar from '../components/Sidebar';
import api from '../services/api';
import {
  TrendingUp, Search, Sparkles, Briefcase, Award,
  DollarSign, BarChart2, BookOpen, HelpCircle
} from 'lucide-react';

export default function SkillTrends() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [skillsList, setSkillsList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Fetch all unique skills on mount
  useEffect(() => {
    const fetchSkills = async () => {
      try {
        const { data } = await api.get('/careers/skill-correlation');
        if (data.success && data.skills) {
          setSkillsList(data.skills);
        }
      } catch (err) {
        console.error('Error fetching skills:', err);
      }
    };
    fetchSkills();
  }, []);

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectSkill = async (skillName) => {
    setSelectedSkill(skillName);
    setSearchQuery(skillName);
    setShowDropdown(false);
    setLoading(true);
    setError('');
    
    try {
      const { data } = await api.get(`/careers/skill-correlation?skill=${encodeURIComponent(skillName)}`);
      if (data.success) {
        setData(data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load correlation data.');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const filteredSkills = skillsList.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 10);

  // Custom tooltips for Recharts
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          padding: '0.75rem 1rem',
          borderRadius: '8px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.5)'
        }}>
          <p style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--color-text)' }}>{payload[0].payload.skill}</p>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-primary-light)' }}>
            Association Strength: {payload[0].value}%
          </p>
          <p style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
            Probability of appearing together
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="app-shell">
      <Sidebar collapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(c => !c)} />
      <main className={`app-main ${sidebarCollapsed ? 'sidebar-is-collapsed' : ''}`}>
        
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <div style={{
              width: 44, height: 44, borderRadius: 14,
              background: 'var(--gradient-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 20px rgba(14,165,233,0.3)'
            }}>
              <TrendingUp size={22} color="white" />
            </div>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: "'Space Grotesk', sans-serif" }}>
                Skill Correlation <span className="gradient-text">Analyser</span>
              </h1>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                Statistical co-occurrence and salary analytics mapping industry skill clusters
              </p>
            </div>
          </div>
        </motion.div>

        {/* Autocomplete Search Dropdown */}
        <div ref={dropdownRef} style={{ position: 'relative', maxWidth: '550px', marginBottom: '2rem', zIndex: 100 }}>
          <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
            <Search size={18} color="var(--color-text-muted)" style={{ position: 'absolute', left: '1rem' }} />
            <input
              type="text"
              className="input"
              style={{ paddingLeft: '2.75rem', width: '100%', height: '48px', borderRadius: '12px' }}
              placeholder="Search a skill (e.g. React, Node.js, Python, Docker...)"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
            />
            {loading && (
              <div style={{ position: 'absolute', right: '1rem' }} className="spinner-small" />
            )}
          </div>

          <AnimatePresence>
            {showDropdown && filteredSkills.length > 0 && (
              <motion.ul
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                style={{
                  position: 'absolute', top: '105%', left: 0, right: 0,
                  background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                  borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                  listStyle: 'none', margin: 0, padding: '0.5rem',
                  maxHeight: '300px', overflowY: 'auto', zIndex: 101
                }}
              >
                {filteredSkills.map(skill => (
                  <li
                    key={skill.id}
                    onClick={() => handleSelectSkill(skill.name)}
                    style={{
                      padding: '0.75rem 1rem', borderRadius: '8px', cursor: 'pointer',
                      fontSize: '0.88rem', color: 'var(--color-text-dim)',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      transition: 'background 0.2s'
                    }}
                    className="dropdown-item"
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-surface-2)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                  >
                    <span>{skill.name}</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                      found in {skill.count} paths
                    </span>
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>

        {error && (
          <div className="glass-card" style={{ padding: '1rem', color: '#fca5a5', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
            <HelpCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Dashboard Area */}
        {data ? (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            
            {/* Stats Cards Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
              <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(59,130,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60a5fa' }}>
                  <Award size={24} />
                </div>
                <div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: "'Space Grotesk', sans-serif" }} className="gradient-text">
                    {data.count}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Career Paths Requiring This</div>
                </div>
              </div>

              <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34d399' }}>
                  <DollarSign size={24} />
                </div>
                <div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: "'Space Grotesk', sans-serif" }} className="gradient-text">
                    ₹{data.avgSalaryLpa} LPA
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Average Salary Index</div>
                </div>
              </div>

              <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fbbf24' }}>
                  <BarChart2 size={24} />
                </div>
                <div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: "'Space Grotesk', sans-serif" }} className="gradient-text">
                    {data.avgDemandScore}%
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Market Demand Score</div>
                </div>
              </div>
            </div>

            {/* Split Screen Layout */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
              
              {/* Correlation Map Chart */}
              <div className="glass-card" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif', sans-serif", marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Sparkles size={18} color="var(--color-primary-light)" /> Skill Co-occurrence Strengths
                </h3>
                
                {data.correlations.length > 0 ? (
                  <div style={{ width: '100%', height: 350 }}>
                    <ResponsiveContainer>
                      <BarChart
                        data={data.correlations}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <XAxis type="number" domain={[0, 100]} stroke="var(--color-text-muted)" fontSize={11} tickFormatter={(v) => `${v}%`} />
                        <YAxis dataKey="skill" type="category" stroke="var(--color-text-muted)" fontSize={11} width={80} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                        <Bar dataKey="probability" radius={[0, 6, 6, 0]} barSize={16}>
                          {data.correlations.map((entry, index) => {
                            // Render gradient color based on association strength
                            const colors = ['#0ea5e9', '#38bdf8', '#7dd3fc', '#a5f3fc'];
                            const colorIndex = Math.min(Math.floor(index / 3), colors.length - 1);
                            return <Cell key={`cell-${index}`} fill={colors[colorIndex]} />;
                          })}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div style={{ display: 'flex', height: '300px', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                    No other co-occurring skills found in the current datasets.
                  </div>
                )}
              </div>

              {/* Data Science Insights & Domain Distribution */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                
                {/* Insights Panel */}
                <div className="glass-card" style={{ padding: '1.5rem', flex: 1 }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <BookOpen size={18} color="#10b981" /> Data Science Insights
                  </h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {data.correlations.slice(0, 3).map((item, idx) => (
                      <div key={idx} style={{ padding: '1rem', borderRadius: '12px', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.85rem' }}>
                          <span style={{ fontWeight: 600 }}>{data.skill} + {item.skill} Cluster</span>
                          <span style={{ color: 'var(--color-primary-light)', fontWeight: 700 }}>{item.probability}% co-occurrence</span>
                        </div>
                        <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
                          Careers requiring <strong>{data.skill}</strong> have a {item.probability}% probability of listing <strong>{item.skill}</strong> as a core competency. Combining these two skills strongly improves profile matching for these job clusters.
                        </p>
                      </div>
                    ))}
                    
                    {data.correlations.length === 0 && (
                      <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                        Add more generated career roadmaps in the platform to enrich the correlation data science clusters!
                      </p>
                    )}
                  </div>
                </div>

                {/* Common Domains */}
                <div className="glass-card" style={{ padding: '1.5rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Briefcase size={18} color="#ef4444" /> Top Career Distributions
                  </h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
                    {data.matchingCareers.map((c, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: '0.5rem 1rem', borderRadius: '20px',
                          background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)',
                          fontSize: '0.8rem', color: '#fca5a5', display: 'flex', alignItems: 'center', gap: '0.4rem'
                        }}
                      >
                        <span style={{ fontWeight: 600 }}>{c.domain}</span>
                        <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>({c.avgSalaryLpa} LPA)</span>
                      </div>
                    ))}
                    {data.matchingCareers.length === 0 && (
                      <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>No distribution matches.</span>
                    )}
                  </div>
                </div>

              </div>

            </div>

          </motion.div>
        ) : (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            height: '400px', background: 'var(--color-surface-2)', border: '1px dashed var(--color-border)',
            borderRadius: '16px', padding: '2rem', textAlign: 'center'
          }}>
            <TrendingUp size={48} color="var(--color-text-muted)" style={{ marginBottom: '1rem', opacity: 0.5 }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>Select a Skill to Analyze</h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', maxWidth: '400px', lineHeight: 1.5 }}>
              Use the search bar above to select a technical skill. Our engine will crunch co-occurrence probabilities and market metrics across all roles.
            </p>
          </div>
        )}

      </main>
    </div>
  );
}
