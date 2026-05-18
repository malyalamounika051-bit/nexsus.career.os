import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { CheckCircle2, XCircle, TrendingUp, BookOpen, ArrowLeft, Award, AlertCircle, MessageSquare } from 'lucide-react';

const InterviewReport = () => {
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
    { subject: 'Technical', A: scores.technical || 0, fullMark: 100 },
    { subject: 'Communication', A: scores.communication || 0, fullMark: 100 },
    { subject: 'Confidence', A: scores.confidence || 0, fullMark: 100 },
    { subject: 'Overall', A: scores.overall || 0, fullMark: 100 },
  ];

  return (
    <div className="app-shell min-h-screen">
      <div className="w-full max-w-7xl mx-auto p-6 md:p-10 space-y-16">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-10 mb-4">
          <div>
            <button onClick={() => navigate('/dashboard')} className="text-slate-400 hover:text-white flex items-center gap-2 mb-8 transition-colors text-sm font-medium">
              <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </button>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20 shrink-0">
                <Award className="text-white w-7 h-7" />
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight font-display drop-shadow-sm">
                Performance Report
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-3 ml-2 mt-4">
              <span className="text-indigo-200 font-semibold bg-indigo-500/10 px-5 py-2 rounded-full border border-indigo-500/20 text-sm tracking-wide">{interview.jobRole}</span>
              <span className="w-2 h-2 rounded-full bg-slate-600 mx-2"></span>
              <span className="text-emerald-200 font-semibold bg-emerald-500/10 px-5 py-2 rounded-full border border-emerald-500/20 text-sm tracking-wide capitalize">{interview.difficulty}</span>
            </div>
          </div>
          
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-card flex flex-col items-center justify-center px-12 py-10 shrink-0 w-full md:w-auto border-t-4 border-t-indigo-500 relative overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.4)] mt-6 md:mt-0"
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
                    <stop offset="100%" stopColor="#a855f7" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">{scores.overall || 0}</span>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="grid lg:grid-cols-3 gap-12 items-start">
          {/* Radar Chart */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-8 lg:p-10 lg:col-span-1 flex flex-col border border-slate-700/60 shadow-xl h-full"
          >
            <div className="flex items-center gap-4 mb-10 pb-4 border-b border-slate-800">
              <div className="neon-dot neon-dot-blue shrink-0"></div>
              <h3 className="text-2xl font-bold text-white tracking-tight">Skill Analysis</h3>
            </div>
            <div className="h-[300px] w-full flex-grow relative mb-10">
              <div className="absolute inset-0 bg-blue-500/5 blur-3xl rounded-full" />
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                  <PolarGrid stroke="rgba(148, 163, 184, 0.15)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#e2e8f0', fontSize: 13, fontWeight: 600 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar
                    name="Score"
                    dataKey="A"
                    stroke="#0ea5e9"
                    strokeWidth={3}
                    fill="url(#colorUv)"
                    fillOpacity={0.65}
                  />
                  <defs>
                    <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.9}/>
                      <stop offset="100%" stopColor="#a855f7" stopOpacity={0.2}/>
                    </linearGradient>
                  </defs>
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-auto grid grid-cols-3 gap-5">
               {radarData.slice(0,3).map(stat => (
                 <div key={stat.subject} className="bg-gradient-to-b from-slate-800/80 to-slate-900/80 rounded-2xl p-5 text-center border border-slate-700/50 shadow-md hover:border-indigo-500/40 transition-colors group flex flex-col justify-center min-h-[100px]">
                    <div className="text-[11px] text-slate-400 uppercase tracking-widest font-bold mb-3 group-hover:text-indigo-300 transition-colors leading-tight line-clamp-1 break-all">{stat.subject}</div>
                    <div className="text-3xl font-black text-white drop-shadow-sm">{stat.A}</div>
                 </div>
               ))}
            </div>
          </motion.div>

          {/* Feedback Section */}
          <div className="lg:col-span-2 flex flex-col gap-12">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-card p-8 lg:p-10 border border-slate-700/60 shadow-xl h-full"
            >
              <div className="flex items-center gap-4 mb-10 pb-5 border-b border-slate-800">
                <div className="p-3 rounded-xl bg-emerald-500/10 shrink-0">
                  <CheckCircle2 className="text-emerald-400 w-7 h-7" />
                </div>
                <h3 className="text-2xl font-bold text-white tracking-tight">Key Strengths</h3>
              </div>
              <ul className="space-y-6">
                {feedback?.strengths?.map((item, i) => (
                  <li key={i} className="flex items-center gap-6 p-6 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-transparent border border-emerald-500/20 hover:border-emerald-500/40 transition-all hover:translate-x-1 mb-4">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                      <span className="text-emerald-400 text-lg font-black">{i + 1}</span>
                    </div>
                    <p className="text-slate-100 leading-relaxed text-[17px] font-medium">{item}</p>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-card p-8 lg:p-10 border border-slate-700/60 shadow-xl h-full"
            >
              <div className="flex items-center gap-4 mb-10 pb-5 border-b border-slate-800">
                <div className="p-3 rounded-xl bg-red-500/10 shrink-0">
                  <XCircle className="text-red-400 w-7 h-7" />
                </div>
                <h3 className="text-2xl font-bold text-white tracking-tight">Areas for Improvement</h3>
              </div>
              <ul className="space-y-6">
                {feedback?.weaknesses?.concat(feedback?.mistakes || [])?.map((item, i) => (
                  <li key={i} className="flex items-center gap-6 p-6 rounded-2xl bg-gradient-to-r from-red-500/10 to-transparent border border-red-500/20 hover:border-red-500/40 transition-all hover:translate-x-1 mb-4">
                    <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                      <span className="text-red-400 text-lg font-black">{i + 1}</span>
                    </div>
                    <p className="text-slate-100 leading-relaxed text-[17px] font-medium">{item}</p>
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
              transition={{ delay: 0.4 }}
              className="glass-card p-8 lg:p-10 border border-slate-700/60 shadow-xl h-full"
            >
              <div className="flex items-center gap-4 mb-12 pb-5 border-b border-slate-800">
                <div className="p-3 rounded-xl bg-blue-500/10 shrink-0">
                  <TrendingUp className="text-blue-400 w-7 h-7" />
                </div>
                <h3 className="text-2xl font-bold text-white tracking-tight">Actionable Roadmap</h3>
              </div>
              <div className="roadmap-timeline ml-4 mt-6">
                {feedback?.learningRoadmap?.map((item, i) => (
                   <div key={i} className="relative mb-12 last:mb-0">
                     <div className="roadmap-phase-dot mt-1 bg-slate-900 border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div>
                     <div className="p-7 rounded-2xl border border-slate-700/50 bg-gradient-to-r from-slate-800/80 to-transparent text-[17px] text-slate-200 leading-relaxed shadow-md hover:border-blue-500/40 transition-colors font-medium">
                       {item}
                     </div>
                   </div>
                ))}
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="glass-card p-8 lg:p-10 border border-slate-700/60 shadow-xl h-full"
            >
              <div className="flex items-center gap-4 mb-12 pb-5 border-b border-slate-800">
                <div className="p-3 rounded-xl bg-yellow-500/10 shrink-0">
                  <BookOpen className="text-yellow-400 w-7 h-7" />
                </div>
                <h3 className="text-2xl font-bold text-white tracking-tight">Recommended Resources</h3>
              </div>
              <div className="grid gap-6">
                {feedback?.recommendedResources?.map((item, i) => (
                  <div key={i} className="group p-7 rounded-2xl bg-slate-800/60 border border-slate-700/50 hover:border-yellow-500/40 transition-all flex gap-6 items-center shadow-sm hover:shadow-md hover:bg-slate-800/80">
                    <div className="w-14 h-14 rounded-2xl bg-yellow-500/10 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:bg-yellow-500/20 transition-all">
                      <span className="text-yellow-400 text-3xl">✦</span>
                    </div>
                    <p className="text-slate-100 text-[17px] leading-relaxed font-medium">{item}</p>
                  </div>
                ))}
              </div>
            </motion.div>
        </div>

        {/* Transcript Log */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="glass-card p-8 md:p-14 border border-slate-700/60 shadow-xl"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-14 pb-8 border-b border-slate-800">
            <div className="flex items-center gap-6">
               <div className="p-5 rounded-2xl bg-indigo-500/10 shrink-0">
                 <MessageSquare className="w-10 h-10 text-indigo-400" />
               </div>
               <div>
                 <h3 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-2">Detailed Transcript</h3>
                 <p className="text-slate-400 text-[16px] font-medium mt-2">Review your exact answers and specific AI feedback</p>
               </div>
            </div>
            <div className="tag tag-purple px-6 py-3 text-[16px] font-bold shadow-sm">
              {transcript?.length || 0} Questions Answered
            </div>
          </div>
          
          <div className="space-y-24 mt-8">
            {transcript?.map((q, i) => (
              <div key={i} className="relative pl-10 md:pl-16 pb-6">
                {/* Timeline Line */}
                <div className="absolute left-0 top-0 bottom-[-5rem] w-[2px] bg-slate-700/50 last:hidden"></div>
                
                <div className="mb-10 relative">
                  <div className="absolute -left-[45px] md:-left-[69px] top-2 w-5 h-5 rounded-full bg-indigo-500 ring-[6px] ring-[#0a1128] shadow-[0_0_20px_rgba(99,102,241,0.6)]"></div>
                  <span className="text-[15px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-4 block">Question {i+1}</span>
                  <p className="text-white text-2xl md:text-3xl font-bold leading-relaxed tracking-tight">{q.question}</p>
                </div>
                
                <div className="grid gap-8 mt-10 ml-2">
                  {/* User Answer */}
                  <div className="bg-gradient-to-r from-slate-800/90 to-slate-900/90 rounded-3xl p-10 border border-slate-700/50 shadow-lg relative overflow-hidden group hover:border-blue-500/40 transition-colors">
                    <div className="absolute top-0 left-0 w-2.5 h-full bg-slate-600 group-hover:bg-blue-500 transition-colors" />
                    <div className="flex items-center gap-4 mb-5">
                      <span className="text-sm font-black uppercase tracking-widest text-slate-400 bg-slate-800 px-4 py-1.5 rounded-full border border-slate-700 shadow-sm">You (Candidate)</span>
                    </div>
                    <p className="text-slate-100 text-[18px] leading-relaxed font-medium italic opacity-95">"{q.userAnswer}"</p>
                  </div>
                  
                  {/* AI Feedback */}
                  <div className="bg-gradient-to-r from-indigo-900/50 to-purple-900/30 rounded-3xl p-10 border border-indigo-500/40 relative shadow-lg hover:border-indigo-400/60 transition-colors">
                    <div className="absolute top-0 left-0 w-2.5 h-full bg-gradient-to-b from-indigo-500 to-purple-500" />
                    <div className="flex items-center gap-4 mb-5">
                      <span className="text-sm font-black uppercase tracking-widest text-indigo-200 bg-indigo-900/50 px-4 py-1.5 rounded-full border border-indigo-500/30 flex items-center gap-3 shadow-sm">
                        <Award className="w-5 h-5" /> Evaluator Feedback
                      </span>
                    </div>
                    <p className="text-indigo-50 text-[18px] leading-relaxed font-medium">
                      {q.aiFeedback}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            
            {transcript?.length === 0 && (
              <div className="text-center py-20 text-slate-400 font-medium text-xl bg-slate-800/30 rounded-3xl border border-slate-700/30">
                No transcript data available for this interview.
              </div>
            )}
          </div>
        </motion.div>

      </div>
    </div>
  );
};

export default InterviewReport;
