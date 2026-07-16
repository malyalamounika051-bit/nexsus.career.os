import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { CheckCircle2, XCircle, TrendingUp, BookOpen, ArrowLeft, Award, AlertCircle, MessageSquare, ShieldAlert, Sparkles } from 'lucide-react';

export default function InterviewReport() {
  const location = useLocation();
  const navigate = useNavigate();
  const { interview } = location.state || {};

  if (!interview) {
    return (
      <div className="app-shell flex items-center justify-center min-h-screen">
        <div className="glass-card p-12 text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-4">No report found</h2>
          <p className="text-slate-400 mb-6">We couldn't find the interview data you are looking for.</p>
          <button onClick={() => navigate('/mock-interview/setup')} className="btn-primary w-full">
            Return to Setup
          </button>
        </div>
      </div>
    );
  }

  const { scores, feedback, transcript } = interview;

  const radarData = [
    { subject: 'Technical', A: scores.technical || 0 },
    { subject: 'Communication', A: scores.communication || 0 },
    { subject: 'Confidence', A: scores.confidence || 0 },
    { subject: 'Fluency', A: scores.fluency || 0 },
    { subject: 'Problem Solving', A: scores.problemSolving || 0 },
    { subject: 'Behavioral', A: scores.behavioral || 0 },
    { subject: 'Leadership', A: scores.leadership || 0 },
    { subject: 'Overall Readiness', A: scores.readiness || 0 }
  ];

  return (
    <div className="app-shell min-h-screen" style={{ background: 'var(--color-bg)', color: 'var(--color-text)', display: 'flex', flexDirection: 'column' }}>
      <div className="w-full max-w-7xl mx-auto p-6 md:p-10 space-y-16">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-10 mb-4">
          <div>
            <button onClick={() => navigate('/dashboard')} className="text-slate-400 hover:text-white flex items-center gap-2 mb-8 transition-colors text-sm font-medium" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
              <ArrowLeft className="w-4 h-4" /> Back to Command Center
            </button>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-amber-500 flex items-center justify-center shadow-lg shrink-0">
                <Award className="text-white w-7 h-7" />
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight font-display">
                Performance Evaluation
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-3 ml-2 mt-4">
              <span className="text-indigo-200 font-semibold bg-indigo-500/10 px-5 py-2 rounded-full border border-indigo-500/20 text-sm tracking-wide">{interview.jobRole}</span>
              <span className="text-emerald-200 font-semibold bg-emerald-500/10 px-5 py-2 rounded-full border border-emerald-500/20 text-sm tracking-wide capitalize">{interview.difficulty}</span>
              <span className="text-amber-200 font-semibold bg-amber-500/10 px-5 py-2 rounded-full border border-amber-500/20 text-sm tracking-wide capitalize">{interview.track} Track</span>
            </div>
          </div>
          
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-card flex flex-col items-center justify-center px-12 py-10 shrink-0 w-full md:w-auto border-t-4 border-t-indigo-500 relative overflow-hidden shadow-xl"
          >
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none"></div>
            <div className="text-xs text-indigo-300 font-bold uppercase tracking-[0.2em] mb-6">Overall Score</div>
            <div className="relative flex items-center justify-center w-40 h-40 drop-shadow-xl">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                <circle cx="50" cy="50" r="45" fill="none" stroke="url(#scoreGrad)" strokeWidth="8" strokeLinecap="round" strokeDasharray="282.7" strokeDashoffset={282.7 - (282.7 * (scores.overall || 0)) / 100} style={{ transition: 'stroke-dashoffset 1.5s ease-in-out' }} />
                <defs>
                  <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#0ea5e9" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">{scores.overall || 0}</span>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="grid lg:grid-cols-3 gap-12 items-start">
          {/* Radar Chart */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-8 lg:p-10 lg:col-span-1 flex flex-col border border-slate-700/60 shadow-xl h-full"
          >
            <div className="flex items-center gap-4 mb-10 pb-4 border-b border-slate-800">
              <div className="neon-dot neon-dot-blue shrink-0"></div>
              <h3 className="text-2xl font-bold text-white tracking-tight">8-Dimensional Analysis</h3>
            </div>
            <div className="h-[300px] w-full flex-grow relative mb-10">
              <div className="absolute inset-0 bg-blue-500/5 blur-3xl rounded-full" />
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                  <PolarGrid stroke="rgba(148, 163, 184, 0.15)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#e2e8f0', fontSize: 10, fontWeight: 600 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar
                    name="Score"
                    dataKey="A"
                    stroke="#8b5cf6"
                    strokeWidth={3}
                    fill="url(#colorUv)"
                    fillOpacity={0.65}
                  />
                  <defs>
                    <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.9}/>
                      <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0.2}/>
                    </linearGradient>
                  </defs>
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-auto grid grid-cols-2 gap-4">
               {radarData.slice(0, 4).map(stat => (
                 <div key={stat.subject} className="bg-gradient-to-b from-slate-800/80 to-slate-900/80 rounded-2xl p-4 text-center border border-slate-700/50 shadow-md">
                    <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1 leading-tight line-clamp-1">{stat.subject}</div>
                    <div className="text-2xl font-black text-white">{stat.A}%</div>
                 </div>
               ))}
            </div>
          </motion.div>

          {/* Feedback Section */}
          <div className="lg:col-span-2 flex flex-col gap-12">
            
            {/* Mistakes warning callout */}
            {feedback?.mistakes && feedback.mistakes.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-6 border border-amber-500/20 bg-amber-500/5 shadow-md flex gap-4"
              >
                <ShieldAlert className="text-amber-500 w-8 h-8 shrink-0" />
                <div>
                  <h4 className="text-amber-400 font-bold text-lg mb-1">Crucial Technical Corrections</h4>
                  <ul className="list-disc pl-5 text-sm text-slate-300 space-y-1">
                    {feedback.mistakes.map((m, i) => <li key={i}>{m}</li>)}
                  </ul>
                </div>
              </motion.div>
            )}

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-8 lg:p-10 border border-slate-700/60 shadow-xl"
            >
              <div className="flex items-center gap-4 mb-10 pb-5 border-b border-slate-800">
                <div className="p-3 rounded-xl bg-emerald-500/10 shrink-0">
                  <CheckCircle2 className="text-emerald-400 w-7 h-7" />
                </div>
                <h3 className="text-2xl font-bold text-white tracking-tight">Key Strengths</h3>
              </div>
              <ul className="space-y-4">
                {feedback?.strengths?.map((item, i) => (
                  <li key={i} className="flex gap-4 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/15 hover:border-emerald-500/35 transition-all text-sm text-slate-200">
                    <span className="text-emerald-400 font-bold">{i + 1}.</span>
                    <p className="margin-0">{item}</p>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-8 lg:p-10 border border-slate-700/60 shadow-xl"
            >
              <div className="flex items-center gap-4 mb-10 pb-5 border-b border-slate-800">
                <div className="p-3 rounded-xl bg-indigo-500/10 shrink-0">
                  <XCircle className="text-indigo-400 w-7 h-7" />
                </div>
                <h3 className="text-2xl font-bold text-white tracking-tight">Areas for Development</h3>
              </div>
              <ul className="space-y-4">
                {feedback?.weaknesses?.map((item, i) => (
                  <li key={i} className="flex gap-4 p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/15 hover:border-indigo-500/35 transition-all text-sm text-slate-200">
                    <span className="text-indigo-400 font-bold">{i + 1}.</span>
                    <p className="margin-0">{item}</p>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>

        {/* Roadmap & Resources */}
        <div className="grid lg:grid-cols-2 gap-12 items-start">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-8 lg:p-10 border border-slate-700/60 shadow-xl"
            >
              <div className="flex items-center gap-4 mb-12 pb-5 border-b border-slate-800">
                <div className="p-3 rounded-xl bg-blue-500/10 shrink-0">
                  <TrendingUp className="text-blue-400 w-7 h-7" />
                </div>
                <h3 className="text-2xl font-bold text-white tracking-tight">Structured Growth Path</h3>
              </div>
              <div className="roadmap-timeline ml-4 mt-6">
                {feedback?.learningRoadmap?.map((item, i) => (
                   <div key={i} className="relative mb-12 last:mb-0" style={{ paddingLeft: '1.5rem', borderLeft: '2px solid rgba(59, 130, 246, 0.3)' }}>
                     <div className="roadmap-phase-dot mt-1 bg-slate-900 border-blue-400 shadow-md" style={{ position: 'absolute', left: '-6px', top: '4px', width: '10px', height: '10px', borderRadius: '50%', border: '2px solid #3b82f6' }}></div>
                     <div className="p-5 rounded-2xl border border-slate-700/50 bg-gradient-to-r from-slate-800/80 to-transparent text-sm text-slate-200 leading-relaxed shadow-sm hover:border-blue-500/40 transition-colors">
                       {item}
                     </div>
                   </div>
                ))}
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-8 lg:p-10 border border-slate-700/60 shadow-xl"
            >
              <div className="flex items-center gap-4 mb-12 pb-5 border-b border-slate-800">
                <div className="p-3 rounded-xl bg-yellow-500/10 shrink-0">
                  <BookOpen className="text-yellow-400 w-7 h-7" />
                </div>
                <h3 className="text-2xl font-bold text-white tracking-tight">Actionable Resource Sync</h3>
              </div>
              <div className="grid gap-6">
                {feedback?.recommendedResources?.map((item, i) => (
                  <div key={i} className="group p-5 rounded-2xl bg-slate-800/60 border border-slate-700/50 hover:border-yellow-500/40 transition-all flex gap-4 items-center shadow-sm">
                    <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center shrink-0">
                      <span className="text-yellow-400 text-xl">✦</span>
                    </div>
                    <p className="text-slate-100 text-sm font-medium">{item}</p>
                  </div>
                ))}
              </div>
            </motion.div>
        </div>

        {/* Transcript Log */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-8 md:p-12 border border-slate-700/60 shadow-xl"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-14 pb-8 border-b border-slate-800">
            <div className="flex items-center gap-6">
               <div className="p-5 rounded-2xl bg-indigo-500/10 shrink-0">
                 <MessageSquare className="w-10 h-10 text-indigo-400" />
               </div>
               <div>
                 <h3 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-2">Detailed Transcript</h3>
                 <p className="text-slate-400 text-[16px] font-medium mt-2">Review speech metrics and follow-up evaluation sets</p>
               </div>
            </div>
            <div className="tag tag-purple px-6 py-3 text-[16px] font-bold shadow-sm">
              {transcript?.length || 0} Questions Evaluated
            </div>
          </div>
          
          <div className="space-y-16 mt-8">
            {transcript?.map((q, i) => (
              <div key={i} className="relative pl-10 md:pl-16 pb-6">
                {/* Timeline Line */}
                <div className="absolute left-0 top-0 bottom-[-5rem] w-[2px] bg-slate-700/50 last:hidden"></div>
                
                <div className="mb-6 relative">
                  <div className="absolute -left-[45px] md:-left-[69px] top-2 w-5 h-5 rounded-full bg-indigo-500 ring-[6px] ring-[#0a1128] shadow-md"></div>
                  <span className="text-[14px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-2 block">Question {i+1}</span>
                  <p className="text-white text-xl md:text-2xl font-bold leading-relaxed">{q.question}</p>
                </div>
                
                <div className="grid gap-6 mt-6">
                  {/* User Answer */}
                  <div className="bg-gradient-to-r from-slate-800/90 to-slate-900/90 rounded-2xl p-6 border border-slate-700/50 shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-2 h-full bg-slate-600" />
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                      <span className="text-xs font-black uppercase tracking-widest text-slate-400 bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700">You (Candidate)</span>
                      
                      {/* Speech Analytics Info */}
                      {q.analytics && (
                        <div className="flex flex-wrap items-center gap-3">
                          {q.analytics.speakingSpeed > 0 && (
                            <span className="text-[10px] font-bold text-slate-300 bg-slate-800 border border-slate-700 px-2 py-0.5 rounded">
                              Speed: <span className="font-mono text-cyan-400">{q.analytics.speakingSpeed} WPM</span>
                            </span>
                          )}
                          <span className="text-[10px] font-bold text-slate-300 bg-slate-800 border border-slate-700 px-2 py-0.5 rounded">
                            Filler words: <span className="font-mono text-amber-400">{q.analytics.fillerWordCount || 0}</span>
                          </span>
                        </div>
                      )}
                    </div>
                    <p className="text-slate-100 text-[16px] leading-relaxed font-medium italic opacity-95">"{q.userAnswer}"</p>
                    
                    {q.analytics && q.analytics.fillerWords && q.analytics.fillerWords.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-slate-800/60 text-[11px] text-amber-300/80 font-medium">
                        ✦ Fillers used: <span className="italic text-slate-300">{q.analytics.fillerWords.join(', ')}</span>.
                      </div>
                    )}
                  </div>
                  
                  {/* AI Feedback */}
                  <div className="bg-gradient-to-r from-indigo-900/50 to-purple-900/30 rounded-2xl p-6 border border-indigo-500/40 relative shadow-lg">
                    <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-indigo-500 to-purple-500" />
                    <div className="flex items-center gap-4 mb-4">
                      <span className="text-xs font-black uppercase tracking-widest text-indigo-200 bg-indigo-900/50 px-3 py-1.5 rounded-full border border-indigo-500/30 flex items-center gap-2">
                        <Award className="w-4 h-4" /> Feedback
                      </span>
                    </div>
                    <p className="text-indigo-50 text-[16px] leading-relaxed font-medium">
                      {q.aiFeedback}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <div className="flex justify-center">
          <button onClick={() => navigate('/mock-interview/setup')} className="btn-primary" style={{ padding: '0.85rem 2rem', borderRadius: '12px', fontWeight: 800 }}>
            Setup Another Mock
          </button>
        </div>

      </div>
    </div>
  );
}
