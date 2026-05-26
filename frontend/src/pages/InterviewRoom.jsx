import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Video, VideoOff, PhoneMissed, Loader2 } from 'lucide-react';
import api from '../services/api';

const InterviewRoom = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { interviewId, jobRole, difficulty, avatar, questions } = location.state || {};

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isMuted, setIsMuted] = useState(true); // default true until AI finishes speaking
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [subtitles, setSubtitles] = useState('');
  const [processing, setProcessing] = useState(false);

  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);

  const isMutedRef = useRef(isMuted);
  const isAiSpeakingRef = useRef(isAiSpeaking);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  useEffect(() => {
    isAiSpeakingRef.current = isAiSpeaking;
  }, [isAiSpeaking]);

  useEffect(() => {
    if (!interviewId) {
      navigate('/mock-interview/setup');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        let finalTranscriptChunk = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscriptChunk += event.results[i][0].transcript + ' ';
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        
        if (finalTranscriptChunk) {
          setTranscript(prev => (prev + ' ' + finalTranscriptChunk).trim());
        }
        setSubtitles(interimTranscript || finalTranscriptChunk);
        setIsUserSpeaking(true);
        clearTimeout(window.speakingTimeout);
        window.speakingTimeout = setTimeout(() => setIsUserSpeaking(false), 1500);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        if (event.error === 'not-allowed') {
          alert('Microphone access denied. Please allow microphone access to use the mock interview.');
        }
      };

      recognitionRef.current.onend = () => {
        if (!isMutedRef.current && !isAiSpeakingRef.current) {
          try {
            recognitionRef.current.start();
          } catch (e) {
            console.log('Error auto-restarting speech recognition:', e);
          }
        }
      };
    } else {
      console.error('Speech Recognition API not supported in this browser.');
    }

    // Start first question after short delay
    setTimeout(() => {
      speakText(`Welcome to your mock interview for the ${jobRole} position. Let's start with the first question. ${questions[0].text}`);
    }, 1500);

    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
      if (synthRef.current) synthRef.current.cancel();
    };
  }, []);

  const speakText = (text) => {
    if (!synthRef.current) return;
    
    setIsAiSpeaking(true);
    setSubtitles(text);
    setIsMuted(true);
    if (recognitionRef.current) recognitionRef.current.stop();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Try to find a good voice
    const voices = synthRef.current.getVoices();
    const preferredVoice = voices.find(v => avatar === 'female' ? (v.name.includes('Female') || v.name.includes('Samantha') || v.name.includes('Google US English')) : (v.name.includes('Male') || v.name.includes('Daniel') || v.name.includes('Google UK English Male')));
    if (preferredVoice) utterance.voice = preferredVoice;

    utterance.rate = 0.95;
    utterance.pitch = avatar === 'female' ? 1.1 : 0.9;

    utterance.onend = () => {
      setIsAiSpeaking(false);
      setSubtitles('Listening...');
      setIsMuted(false);
      if (recognitionRef.current) {
        try { recognitionRef.current.start(); } catch (e) {}
      }
    };

    synthRef.current.speak(utterance);
  };

  const handleFinishAnswering = async () => {
    if (!transcript.trim()) return;

    if (recognitionRef.current) recognitionRef.current.stop();
    setIsMuted(true);
    setProcessing(true);
    setSubtitles('Evaluating answer...');

    try {
      const response = await api.post('/interview/evaluate', {
        interviewId,
        question: questions[currentQuestionIndex].text,
        userAnswer: transcript
      });

      setTranscript(''); // Clear for next answer
      
      const { feedback, isFollowUpNeeded, followUpQuestion } = response.data.data;

      if (isFollowUpNeeded && followUpQuestion) {
        speakText(`${feedback}. ${followUpQuestion}`);
      } else {
        if (currentQuestionIndex < questions.length - 1) {
          const nextIndex = currentQuestionIndex + 1;
          setCurrentQuestionIndex(nextIndex);
          speakText(`${feedback}. Next question: ${questions[nextIndex].text}`);
        } else {
          speakText(`${feedback}. That concludes our interview. Thank you for your time. I am now generating your final report.`);
          await finalizeInterview();
        }
      }
    } catch (error) {
      console.error('Error evaluating:', error);
      speakText('Sorry, I had trouble processing that. Could you please repeat your answer?');
    } finally {
      setProcessing(false);
    }
  };

  const finalizeInterview = async () => {
    try {
      setSubtitles('Generating final report... Please wait.');
      const response = await api.post('/interview/finalize', { interviewId });
      navigate('/mock-interview/report', { state: { interview: response.data.data } });
    } catch (error) {
      console.error('Finalize error:', error);
      alert('Failed to generate report.');
    }
  };

  const toggleMute = () => {
    if (isMuted) {
      if (recognitionRef.current) try { recognitionRef.current.start(); } catch(e){}
    } else {
      if (recognitionRef.current) recognitionRef.current.stop();
    }
    setIsMuted(!isMuted);
  };

  const endCall = () => {
    if (window.confirm("Are you sure you want to end the interview early?")) {
      finalizeInterview();
    }
  };

  const avatarImg = avatar === 'female' 
    ? "https://api.dicebear.com/7.x/avataaars/svg?seed=Jessica&backgroundColor=b6e3f4"
    : "https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus&backgroundColor=c0aede";

  return (
    <div className="app-shell" style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', background: 'var(--color-bg)', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ height: '64px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1.5rem', background: 'var(--color-surface)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div className="neon-dot neon-dot-purple" style={{ animation: 'neonPulse 2s infinite' }} />
          <span style={{ fontWeight: 600, color: 'var(--color-text)', fontFamily: "'Space Grotesk', sans-serif" }}>Live Interview Session</span>
          <span className="tag" style={{ marginLeft: '0.5rem' }}>{jobRole} ({difficulty})</span>
        </div>
        <div style={{ color: 'var(--color-text-muted)', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.85rem' }}>
          Question {currentQuestionIndex + 1} of {questions?.length}
        </div>
      </div>

      {/* Main Grid */}
      <div style={{ flex: 1, padding: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', position: 'relative' }}>
        
        {/* AI Avatar Panel */}
        <div className="glass-card" style={{ position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', top: '1rem', left: '1rem', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)', color: 'white', padding: '0.3rem 0.75rem', borderRadius: '8px', fontSize: '0.85rem', zIndex: 10, display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid var(--color-border)' }}>
            {avatar === 'female' ? 'Jessica (Interviewer)' : 'Marcus (Interviewer)'}
            {processing && <Loader2 size={14} className="animate-spin" />}
          </div>

          <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* Pulsing ring when speaking */}
            <AnimatePresence>
              {isAiSpeaking && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: avatar === 'female' ? 'var(--color-primary)' : 'var(--color-accent)', filter: 'blur(40px)', zIndex: -1 }}
                />
              )}
            </AnimatePresence>
            
            <motion.div 
              animate={{ 
                y: isAiSpeaking ? [0, -5, 0] : 0 
              }}
              transition={{ duration: 0.5, repeat: isAiSpeaking ? Infinity : 0 }}
              style={{ width: '200px', height: '200px', borderRadius: '50%', overflow: 'hidden', border: `4px solid ${isAiSpeaking ? (avatar === 'female' ? 'var(--color-primary)' : 'var(--color-accent)') : 'var(--color-border)'}`, boxShadow: isAiSpeaking ? (avatar === 'female' ? 'var(--shadow-glow-blue)' : 'var(--shadow-glow-purple)') : 'none', transition: 'all 0.3s', background: 'var(--color-surface-2)' }}
            >
              <img src={avatarImg} alt="AI Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </motion.div>
          </div>
          
          {/* Audio Visualizer Waves */}
          {isAiSpeaking && (
             <div style={{ position: 'absolute', bottom: '2rem', left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'flex-end', gap: '4px', height: '32px' }}>
               {[...Array(5)].map((_, i) => (
                 <motion.div
                   key={i}
                   animate={{ height: ['20%', '100%', '20%'] }}
                   transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                   style={{ width: '6px', background: avatar === 'female' ? 'var(--color-primary-light)' : 'var(--color-accent-light)', borderRadius: '99px' }}
                 />
               ))}
             </div>
          )}
        </div>

        {/* User Video Panel */}
        <div className="glass-card" style={{ position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: isUserSpeaking ? '2px solid var(--color-primary)' : '' }}>
          <div style={{ position: 'absolute', top: '1rem', left: '1rem', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)', color: 'white', padding: '0.3rem 0.75rem', borderRadius: '8px', fontSize: '0.85rem', zIndex: 10, display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid var(--color-border)' }}>
            You (Candidate)
            {isMuted && <MicOff size={14} color="var(--color-danger)" />}
          </div>

          {isVideoOn ? (
            <Webcam
              audio={false}
              mirrored={true}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: 'var(--color-surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <VideoOff size={48} color="var(--color-text-muted)" />
            </div>
          )}
          
          {/* Live User Response Input/Editor */}
          {!isAiSpeaking && (
            <div style={{ position: 'absolute', bottom: '1rem', left: '1rem', right: '1rem', zIndex: 20, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', background: 'rgba(0,0,0,0.6)', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  Your Answer (Type or edit below)
                </span>
                {isMuted && (
                  <span style={{ fontSize: '0.7rem', color: '#fbbf24', background: 'rgba(0,0,0,0.6)', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(245,158,11,0.2)' }}>
                    Mic Muted - Keyboard Mode
                  </span>
                )}
              </div>
              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder={isMuted ? "Type your answer here..." : "Listening... Speak now, or type/edit your answer here..."}
                style={{
                  width: '100%',
                  height: '90px',
                  background: 'rgba(15, 23, 42, 0.75)',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '12px',
                  color: '#f8fafc',
                  padding: '0.75rem',
                  fontSize: '0.88rem',
                  fontFamily: 'inherit',
                  resize: 'none',
                  outline: 'none',
                  boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--color-border)'}
              />
            </div>
          )}
        </div>

        {/* Floating Subtitles */}
        <div style={{ position: 'absolute', top: '2rem', left: '50%', transform: 'translateX(-50%)', maxWidth: '800px', width: '100%', textAlign: 'center', zIndex: 50, pointerEvents: 'none', padding: '0 1rem' }}>
          <AnimatePresence>
            {subtitles && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                style={{ background: 'rgba(10,17,40,0.85)', backdropFilter: 'blur(16px)', color: 'white', padding: '1rem 1.5rem', borderRadius: '16px', border: '1px solid var(--color-border-glow)', display: 'inline-block', fontSize: '1.1rem', boxShadow: 'var(--shadow-lg)' }}
              >
                {subtitles}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>

      {/* Control Bar */}
      <div style={{ height: '96px', background: 'var(--color-surface)', borderTop: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', padding: '0 1.5rem', flexShrink: 0 }}>
        <button
          onClick={toggleMute}
          disabled={isAiSpeaking}
          style={{ padding: '1rem', borderRadius: '50%', border: 'none', cursor: isAiSpeaking ? 'not-allowed' : 'pointer', background: isMuted || isAiSpeaking ? 'var(--color-surface-3)' : 'var(--color-primary-glow)', color: isMuted || isAiSpeaking ? 'var(--color-text-muted)' : 'var(--color-primary)', transition: 'all 0.2s', border: isMuted || isAiSpeaking ? '1px solid transparent' : '1px solid var(--color-primary-glow-strong)' }}
        >
          {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
        </button>
        
        <button
          onClick={() => setIsVideoOn(!isVideoOn)}
          style={{ padding: '1rem', borderRadius: '50%', border: 'none', cursor: 'pointer', background: !isVideoOn ? 'var(--color-danger-glow)' : 'var(--color-surface-3)', color: !isVideoOn ? 'var(--color-danger)' : 'var(--color-text)', transition: 'all 0.2s', border: !isVideoOn ? '1px solid var(--color-danger)' : '1px solid transparent' }}
        >
          {isVideoOn ? <Video size={24} /> : <VideoOff size={24} />}
        </button>

        <button
          onClick={handleFinishAnswering}
          disabled={isAiSpeaking || processing || !transcript.trim()}
          className="btn-primary"
          style={{ padding: '1rem 2.5rem', borderRadius: '99px', opacity: (isAiSpeaking || processing || !transcript.trim()) ? 0.5 : 1, cursor: (isAiSpeaking || processing || !transcript.trim()) ? 'not-allowed' : 'pointer' }}
        >
          {processing ? 'Processing...' : 'Done Answering'}
        </button>

        <button
          onClick={endCall}
          style={{ padding: '1rem', borderRadius: '50%', border: 'none', cursor: 'pointer', background: 'var(--color-danger)', color: 'white', transition: 'all 0.2s', boxShadow: '0 0 20px rgba(239, 68, 68, 0.4)' }}
        >
          <PhoneMissed size={24} />
        </button>
      </div>
    </div>
  );
};

export default InterviewRoom;
