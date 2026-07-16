import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, MicOff, Video, VideoOff, PhoneMissed, Loader2, Play, 
  Check, RefreshCw, Volume2, AlertCircle, Sparkles, BookOpen, 
  Award, ArrowLeft, Send, CheckCircle2, ChevronRight, Edit3, Save, Activity
} from 'lucide-react';
import api from '../services/api';

export default function InterviewRoom() {
  const location = useLocation();
  const navigate = useNavigate();
  const { interviewId, jobRole, difficulty, track, company, experienceLevel, durationLimit, avatar, questions } = location.state || {};

  const [currentIdx, setCurrentIdx] = useState(0);
  const [interviewerState, setInterviewerState] = useState('speaking'); // speaking, thinking, listening
  const [subtitles, setSubtitles] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [speechText, setSpeechText] = useState('');
  
  // Real-time Web Speech Recognition instances
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState(null);

  // Statistics
  const [noiseFilterLevel, setNoiseFilterLevel] = useState('99.2% Clean');
  const [latency, setLatency] = useState('85ms');
  const [timerCount, setTimerCount] = useState(0);

  // Conversational loops
  const [dialogueHistory, setDialogueHistory] = useState([]);
  const [currentPromptQuestion, setCurrentPromptQuestion] = useState('');
  const [evalLoading, setEvalLoading] = useState(false);

  // Speech TTS ref
  const synthRef = useRef(window.speechSynthesis);
  const utteranceRef = useRef(null);

  // Initialize Speech Recognition
  useEffect(() => {
    if (!jobRole) {
      navigate('/mock-interview/setup');
      return;
    }

    // Set first question
    if (questions && questions.length > 0) {
      setCurrentPromptQuestion(questions[0]);
      speakQuestion(questions[0]);
    }

    // Timer logic
    const interval = setInterval(() => {
      setTimerCount(prev => prev + 1);
    }, 1000);

    // Web Speech API initialization
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onresult = (e) => {
        let transcript = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
          transcript += e.results[i][0].transcript;
        }
        setSpeechText(transcript);
      };

      rec.onerror = (err) => {
        console.error('Speech recognition error:', err);
      };

      rec.onend = () => {
        setIsRecording(false);
      };

      setRecognition(rec);
    }

    return () => {
      clearInterval(interval);
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  const formatTime = (sec) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startVoiceRecording = () => {
    if (!recognition) {
      alert('Speech recognition is not supported in this browser. Please type your answer instead.');
      return;
    }
    if (isRecording) {
      recognition.stop();
      setIsRecording(false);
    } else {
      setSpeechText('');
      recognition.start();
      setIsRecording(true);
    }
  };

  const speakQuestion = (text) => {
    if (!text) return;
    setInterviewerState('speaking');
    setSubtitles(text);
    
    if (synthRef.current) {
      synthRef.current.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      
      const voices = synthRef.current.getVoices();
      if (avatar === 'male') {
        const maleVoice = voices.find(v => v.name.toLowerCase().includes('google uk english male') || v.name.toLowerCase().includes('david') || v.name.toLowerCase().includes('male'));
        if (maleVoice) utterance.voice = maleVoice;
      } else {
        const femaleVoice = voices.find(v => v.name.toLowerCase().includes('google uk english female') || v.name.toLowerCase().includes('zira') || v.name.toLowerCase().includes('female'));
        if (femaleVoice) utterance.voice = femaleVoice;
      }

      utterance.onend = () => {
        setInterviewerState('listening');
        // Auto-start recording for immersive hands-free feeling
        setTimeout(() => {
          if (recognition && !isMuted) {
            try {
              recognition.start();
              setIsRecording(true);
            } catch(e){}
          }
        }, 300);
      };
      
      utteranceRef.current = utterance;
      synthRef.current.speak(utterance);
    } else {
      setTimeout(() => {
        setInterviewerState('listening');
      }, 3000);
    }
  };

  const handleSendResponse = async () => {
    if (!speechText.trim()) return;

    if (recognition && isRecording) {
      recognition.stop();
      setIsRecording(false);
    }

    const answer = speechText;
    setDialogueHistory(prev => [...prev, { role: 'candidate', text: answer, question: currentPromptQuestion }]);
    setSpeechText('');
    setInterviewerState('thinking');

    try {
      // Evaluate answer and check for AI follow-up
      const response = await api.post('/interview/evaluate', {
        interviewId,
        question: currentPromptQuestion,
        userAnswer: answer,
        confidence: 0.90,
        duration: 25 // Simulated elapsed time
      });

      if (response.data.success) {
        const payload = response.data.data;
        
        // If the AI decides a follow-up question is needed to probe deeper
        if (payload.isFollowUpNeeded && payload.followUpQuestion) {
          setCurrentPromptQuestion(payload.followUpQuestion);
          speakQuestion(payload.followUpQuestion);
        } else {
          // Progress to the next structured profile question
          const nextIndex = currentIdx + 1;
          if (nextIndex < questions.length) {
            setCurrentIdx(nextIndex);
            setCurrentPromptQuestion(questions[nextIndex]);
            speakQuestion(questions[nextIndex]);
          } else {
            // Completed all questions
            setInterviewerState('speaking');
            setSubtitles("Thank you. I have gathered enough information. Generating your complete report now.");
            handleCompleteInterview();
          }
        }
      }
    } catch (err) {
      console.error('Error in evaluation loop:', err);
      // Failover progression
      const nextIndex = currentIdx + 1;
      if (nextIndex < questions.length) {
        setCurrentIdx(nextIndex);
        setCurrentPromptQuestion(questions[nextIndex]);
        speakQuestion(questions[nextIndex]);
      } else {
        handleCompleteInterview();
      }
    }
  };

  const handleCompleteInterview = async () => {
    setEvalLoading(true);
    try {
      const response = await api.post('/interview/finalize', { interviewId });
      if (response.data.success) {
        navigate('/mock-interview/report', { state: { interview: response.data.data } });
      }
    } catch (err) {
      console.error('Error finalizing report:', err);
      navigate('/mock-interview/setup');
    } finally {
      setEvalLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', display: 'flex', flexDirection: 'column' }}>
      
      {/* Top navigation */}
      <header style={{ height: '72px', background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2rem', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={() => navigate('/mock-interview/setup')} className="btn-ghost" style={{ padding: '0.5rem' }}>
            <ArrowLeft size={18} />
          </button>
          <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-text)' }}>
            AI Mock Room • {jobRole} ({difficulty})
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 700 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#10b981' }}>
            <Activity size={12} /> Live transcription active
          </span>
          <span>Latency: {latency}</span>
          <span style={{ background: 'var(--color-surface-2)', padding: '0.35rem 0.75rem', borderRadius: '6px', color: 'var(--color-text)' }}>
            {formatTime(timerCount)}
          </span>
        </div>
      </header>

      {evalLoading ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.5rem' }}>
          <Loader2 size={48} className="animate-spin" color="var(--color-primary)" />
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ margin: 0, color: 'var(--color-text)', fontWeight: 800 }}>Synthesizing Communication Scores...</h3>
            <p style={{ margin: '0.5rem 0 0', color: 'var(--color-text-muted)' }}>Calculating filler word density, tech accuracy index, and career GPS roadmaps.</p>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '2rem', padding: '2rem' }}>
          
          {/* Left panel: Interviewer Video Screen */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Visualizer Area */}
            <div className="glass-card" style={{ flex: 1, background: '#090d16', border: '1px solid var(--color-border)', borderRadius: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', position: 'relative', overflow: 'hidden', minHeight: '380px' }}>
              
              {/* Voice waves */}
              {interviewerState === 'speaking' && (
                <div style={{ position: 'absolute', display: 'flex', gap: '6px', bottom: '2rem' }}>
                  {[1, 2, 3, 4, 5, 6, 5, 4, 3, 2, 1].map((h, i) => (
                    <motion.div 
                      key={i}
                      animate={{ height: [12, h * 7, 12] }}
                      transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.04 }}
                      style={{ width: '4px', background: '#8b5cf6', borderRadius: '99px' }}
                    />
                  ))}
                </div>
              )}

              {/* Persona Avatar */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', zIndex: 2 }}>
                <div style={{ width: '130px', height: '130px', borderRadius: '50%', background: 'var(--color-surface-2)', border: '4px solid #8b5cf6', overflow: 'hidden' }}>
                  <img 
                    src={avatar === 'male' 
                      ? "https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus&backgroundColor=c0aede"
                      : "https://api.dicebear.com/7.x/avataaars/svg?seed=Jessica&backgroundColor=b6e3f4"
                    } 
                    alt="AI Interviewer" 
                    style={{ width: '100%', height: '100%' }}
                  />
                </div>
                
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'white' }}>
                  {avatar === 'male' ? 'Marcus (Technical Architect)' : 'Jessica (HR Lead)'}
                </span>

                <div style={{ display: 'flex', gap: '0.5rem', background: '#ffffff10', padding: '0.4rem 1.25rem', borderRadius: '99px' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: interviewerState === 'speaking' ? '#8b5cf6' : interviewerState === 'listening' ? '#10b981' : '#f59e0b' }}>
                    {interviewerState === 'speaking' ? 'Speaking...' : interviewerState === 'listening' ? 'Listening...' : 'Analyzing answer...'}
                  </span>
                </div>
              </div>

              {/* Subtitles Overlay */}
              <div style={{ position: 'absolute', bottom: '5rem', left: '2rem', right: '2rem', textAlign: 'center', color: '#cbd5e1', fontSize: '0.95rem', background: '#000000d0', padding: '0.75rem 1.25rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                {subtitles}
              </div>
            </div>

            {/* Candidate controls */}
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button 
                onClick={() => setIsMuted(!isMuted)} 
                className="btn-ghost" 
                style={{ width: '56px', height: '56px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: isMuted ? '#ef444420' : 'var(--color-surface-2)', color: isMuted ? '#ef4444' : 'var(--color-text)', border: '1px solid var(--color-border)' }}
              >
                {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
              </button>
              <button 
                onClick={() => setIsVideoOn(!isVideoOn)} 
                className="btn-ghost" 
                style={{ width: '56px', height: '56px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: !isVideoOn ? '#ef444420' : 'var(--color-surface-2)', color: !isVideoOn ? '#ef4444' : 'var(--color-text)', border: '1px solid var(--color-border)' }}
              >
                {isVideoOn ? <VideoOff size={20} /> : <Video size={20} />}
              </button>
              <button 
                onClick={handleCompleteInterview} 
                className="btn-ghost" 
                style={{ width: '56px', height: '56px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#ef444420', color: '#ef4444', border: '1px solid var(--color-danger)' }}
              >
                <PhoneMissed size={20} />
              </button>
            </div>

          </div>

          {/* Right panel: Live Transcript Viewer & Editor */}
          <div className="glass-card" style={{ padding: '1.5rem', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-text)' }}>
                Response Transcript
              </h3>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={startVoiceRecording}
                  style={{
                    padding: '0.4rem 0.85rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem',
                    background: isRecording ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                    border: isRecording ? '1px solid #ef4444' : '1px solid #10b981',
                    color: isRecording ? '#ef4444' : '#10b981'
                  }}
                >
                  <Mic size={12} />
                  {isRecording ? 'Listening...' : 'Click to Speak'}
                </button>
              </div>
            </div>

            {/* Dialogue list */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '0.5rem 0' }}>
              {dialogueHistory.length === 0 ? (
                <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '1rem' }}>
                  Speak or type your response below. You can verify and edit the text in the preview box before sending.
                </div>
              ) : (
                dialogueHistory.map((log, i) => (
                  <div key={i} style={{ padding: '0.75rem 1rem', background: 'var(--color-surface-2)', borderRadius: '12px', borderLeft: '3px solid var(--color-primary)' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-primary)', display: 'block', marginBottom: '0.2rem' }}>Candidate Response</span>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text)', lineHeight: 1.4 }}>{log.text}</p>
                  </div>
                ))
              )}
            </div>

            {/* Editable transcript preview panel */}
            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifycontent: 'space-between', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-text-muted)' }}>EDITABLE TRANSCRIPT PREVIEW</span>
                {isRecording && <span className="animate-pulse" style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }}></span>}
              </div>
              <textarea
                value={speechText}
                onChange={e => setSpeechText(e.target.value)}
                placeholder="Transcribing voice input... (or type your response directly here)"
                style={{ width: '100%', minHeight: '80px', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)', padding: '0.75rem 1rem', borderRadius: '12px', outline: 'none', fontSize: '0.9rem', resize: 'vertical', fontFamily: 'inherit' }}
              />
              <button 
                onClick={handleSendResponse} 
                disabled={!speechText.trim()}
                className="btn-primary" 
                style={{ width: '100%', padding: '0.85rem', borderRadius: '12px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                <Send size={16} /> Submit Answer
              </button>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
