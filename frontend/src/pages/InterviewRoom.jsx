import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Video, VideoOff, PhoneMissed, Loader2, Play, Check, RefreshCw, Volume2, AlertTriangle, AlertCircle, BarChart3, HelpCircle, Edit3, Award } from 'lucide-react';
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

  // ASR Enhancements & Review states
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [asrResults, setAsrResults] = useState(null);
  const [editedTranscript, setEditedTranscript] = useState('');
  
  // Audio Quality Monitor States
  const [audioLevel, setAudioLevel] = useState(0);
  const [micWarning, setMicWarning] = useState('');
  const [noiseScore, setNoiseScore] = useState('Good'); // Good / Medium / High

  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);

  const isMutedRef = useRef(isMuted);
  const isAiSpeakingRef = useRef(isAiSpeaking);
  const answerStartTimeRef = useRef(null);

  // Audio Context for Live Volume & Quality Checking
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const streamRef = useRef(null);
  const levelIntervalRef = useRef(null);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  useEffect(() => {
    isAiSpeakingRef.current = isAiSpeaking;
  }, [isAiSpeaking]);

  // Start Audio Quality Checking
  const startAudioMonitoring = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      let lowVolumeCount = 0;
      let ambientNoiseSum = 0;
      let noiseTicks = 0;

      levelIntervalRef.current = setInterval(() => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        setAudioLevel(average);

        // Noise level tracking (measure baseline noise when user and AI are silent)
        if (isMutedRef.current || isAiSpeakingRef.current) {
          ambientNoiseSum += average;
          noiseTicks++;
          if (noiseTicks > 50) {
            const avgNoise = ambientNoiseSum / noiseTicks;
            if (avgNoise > 25) setNoiseScore('High');
            else if (avgNoise > 8) setNoiseScore('Medium');
            else setNoiseScore('Good');
            ambientNoiseSum = 0;
            noiseTicks = 0;
          }
        }

        // Low volume detection (when candidate is speaking)
        if (!isMutedRef.current && !isAiSpeakingRef.current) {
          if (average < 1.5) {
            lowVolumeCount++;
            if (lowVolumeCount > 40) { // ~4s of speaking silence
              setMicWarning('Low volume detected. Check your mic or speak louder.');
            }
          } else {
            lowVolumeCount = 0;
            setMicWarning('');
          }
        }
      }, 100);
    } catch (err) {
      console.warn('Microphone monitoring failed:', err);
      setMicWarning('Microphone access denied or disconnected.');
    }
  };

  const stopAudioMonitoring = () => {
    if (levelIntervalRef.current) clearInterval(levelIntervalRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
    }
  };

  useEffect(() => {
    if (!interviewId) {
      navigate('/mock-interview/setup');
      return;
    }

    startAudioMonitoring();

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
          setMicWarning('Microphone access denied.');
        }
      };

      recognitionRef.current.onend = () => {
        if (!isMutedRef.current && !isAiSpeakingRef.current && !isReviewMode) {
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
      stopAudioMonitoring();
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
    const preferredVoice = voices.find(v => avatar === 'female' 
      ? (v.name.includes('Female') || v.name.includes('Samantha') || v.name.includes('Google US English')) 
      : (v.name.includes('Male') || v.name.includes('Daniel') || v.name.includes('Google UK English Male'))
    );
    if (preferredVoice) utterance.voice = preferredVoice;

    utterance.rate = 0.95;
    utterance.pitch = avatar === 'female' ? 1.1 : 0.9;

    utterance.onend = () => {
      setIsAiSpeaking(false);
      setSubtitles('Listening...');
      setIsMuted(false);
      setIsReviewMode(false);
      setAsrResults(null);
      answerStartTimeRef.current = Date.now();
      if (recognitionRef.current) {
        try { recognitionRef.current.start(); } catch (e) {}
      }
    };

    synthRef.current.speak(utterance);
  };

  // Triggers ASR enhancement and opens review panel
  const handleReviewAnswer = async () => {
    if (!transcript.trim()) return;

    if (recognitionRef.current) recognitionRef.current.stop();
    setIsMuted(true);
    setProcessing(true);
    setSubtitles('Transcribing speaking...');

    const durationSeconds = answerStartTimeRef.current
      ? (Date.now() - answerStartTimeRef.current) / 1000
      : 15;

    try {
      const response = await api.post('/interview/transcribe', {
        browserTranscript: transcript,
        duration: durationSeconds,
        interviewId
      });

      const data = response.data.data;
      setAsrResults(data);
      setEditedTranscript(data.transcript);
      setIsReviewMode(true);
      setSubtitles('Review & Edit your answer below');
    } catch (error) {
      console.error('Error in transcribing:', error);
      // Fallback local values
      setAsrResults({
        transcript,
        confidence: 0.82,
        language: 'en',
        duration: durationSeconds,
        analytics: {
          wordsSpoken: transcript.split(/\s+/).length,
          speakingSpeed: Math.round((transcript.split(/\s+/).length / (durationSeconds / 60)) * 10) / 10 || 120,
          fillerWords: [],
          fillerWordCount: 0,
          pauseFrequency: 0
        }
      });
      setEditedTranscript(transcript);
      setIsReviewMode(true);
    } finally {
      setProcessing(false);
    }
  };

  const handleRerecord = () => {
    setTranscript('');
    setEditedTranscript('');
    setAsrResults(null);
    setIsReviewMode(false);
    setIsMuted(false);
    setSubtitles('Listening... Speak now.');
    answerStartTimeRef.current = Date.now();
    if (recognitionRef.current) {
      try { recognitionRef.current.start(); } catch (e) {}
    }
  };

  const handleFinalSubmit = async () => {
    const finalAnswerText = editedTranscript.trim() || transcript.trim();
    if (!finalAnswerText) return;

    setProcessing(true);
    setSubtitles('Evaluating answer with AI...');

    try {
      const response = await api.post('/interview/evaluate', {
        interviewId,
        question: questions[currentQuestionIndex].text,
        userAnswer: finalAnswerText,
        confidence: asrResults?.confidence || 0.85,
        duration: asrResults?.duration || 15,
        analytics: asrResults?.analytics || null
      });

      setTranscript(''); // Clear
      setEditedTranscript('');
      setIsReviewMode(false);
      setAsrResults(null);
      
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
      speakText('Sorry, I had trouble processing that. Let us continue with the setup.');
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
      <div style={{ height: '64px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1.5rem', background: 'var(--color-surface)', flexShrink: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div className="neon-dot neon-dot-purple" style={{ animation: 'neonPulse 2s infinite' }} />
          <span style={{ fontWeight: 700, color: 'var(--color-text)', fontFamily: "var(--font-display)", letterSpacing: '-0.02em', fontSize: '1.1rem' }}>Nexus Live Interview Session</span>
          <span className="tag" style={{ marginLeft: '0.5rem', background: 'var(--color-primary-glow)', border: '1px solid rgba(124,58,237,0.2)', color: 'var(--color-primary-light)' }}>{jobRole}</span>
          <span className="tag capitalize" style={{ background: 'var(--color-accent-glow)', border: '1px solid rgba(6,182,212,0.2)', color: 'var(--color-accent-light)' }}>{difficulty}</span>
        </div>
        <div style={{ color: 'var(--color-text-muted)', fontFamily: "var(--font-mono)", fontSize: '0.85rem' }}>
          Question {currentQuestionIndex + 1} of {questions?.length}
        </div>
      </div>

      {/* Main Grid */}
      <div style={{ flex: 1, padding: '1.5rem', display: 'grid', gridTemplateColumns: isReviewMode ? '1fr 1.2fr' : '1fr 1fr', gap: '1.5rem', position: 'relative', overflow: 'hidden' }}>
        
        {/* Left Side Panels: Interviewer & Video */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%', overflow: 'hidden' }}>
          
          {/* AI Avatar Panel */}
          <div className="glass-card" style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-surface-glass-2)', border: '1px solid var(--color-border)' }}>
            <div style={{ position: 'absolute', top: '1rem', left: '1rem', background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(10px)', color: 'white', padding: '0.4rem 0.85rem', borderRadius: '10px', fontSize: '0.8rem', zIndex: 10, display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid rgba(255,255,255,0.08)' }}>
              {avatar === 'female' ? 'Jessica (Interviewer)' : 'Marcus (Interviewer)'}
              {processing && <Loader2 size={14} className="animate-spin text-purple-400" />}
            </div>

            <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {/* Pulsing ring when speaking */}
              <AnimatePresence>
                {isAiSpeaking && (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: [1, 1.25, 1], opacity: [0.2, 0.5, 0.2] }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    style={{ position: 'absolute', inset: -15, borderRadius: '50%', background: avatar === 'female' ? 'var(--color-primary)' : 'var(--color-accent)', filter: 'blur(30px)', zIndex: -1 }}
                  />
                )}
              </AnimatePresence>
              
              <motion.div 
                animate={{ 
                  y: isAiSpeaking ? [0, -6, 0] : 0 
                }}
                transition={{ duration: 0.5, repeat: isAiSpeaking ? Infinity : 0 }}
                style={{ width: '160px', height: '160px', borderRadius: '50%', overflow: 'hidden', border: `3px solid ${isAiSpeaking ? (avatar === 'female' ? 'var(--color-primary)' : 'var(--color-accent)') : 'var(--color-border)'}`, boxShadow: isAiSpeaking ? (avatar === 'female' ? '0 0 25px rgba(124,58,237,0.3)' : '0 0 25px rgba(6,182,212,0.3)') : 'none', transition: 'all 0.3s', background: 'var(--color-bg-secondary)' }}
              >
                <img src={avatarImg} alt="AI Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </motion.div>
            </div>
            
            {/* Audio Visualizer Waves */}
            {isAiSpeaking && (
               <div style={{ position: 'absolute', bottom: '1.5rem', left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'flex-end', gap: '5px', height: '24px' }}>
                 {[...Array(6)].map((_, i) => (
                   <motion.div
                     key={i}
                     animate={{ height: ['25%', '100%', '25%'] }}
                     transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.08 }}
                     style={{ width: '5px', background: avatar === 'female' ? 'var(--color-primary-light)' : 'var(--color-accent-light)', borderRadius: '99px' }}
                   />
                 ))}
               </div>
            )}
          </div>

          {/* User Video Panel */}
          <div className="glass-card" style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: (isUserSpeaking && !isMuted) ? '2px solid var(--color-primary)' : '1px solid var(--color-border)', background: 'var(--color-surface-glass-2)', transition: 'border-color 0.3s' }}>
            <div style={{ position: 'absolute', top: '1rem', left: '1rem', background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(10px)', color: 'white', padding: '0.4rem 0.85rem', borderRadius: '10px', fontSize: '0.8rem', zIndex: 10, display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid rgba(255,255,255,0.08)' }}>
              You (Candidate)
              {isMuted && <MicOff size={14} className="text-red-400" />}
            </div>

            {isVideoOn ? (
              <Webcam
                audio={false}
                mirrored={true}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'var(--color-bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--color-border)' }}>
                <VideoOff size={36} className="text-slate-500" />
              </div>
            )}

            {/* Audio Wave Meter */}
            {!isMuted && !isAiSpeaking && (
              <div style={{ position: 'absolute', bottom: '1rem', right: '1rem', background: 'rgba(0,0,0,0.5)', padding: '6px 12px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '8px', zIndex: 12 }}>
                <div style={{ display: 'flex', gap: '3px', alignItems: 'center', height: '16px' }}>
                  {[...Array(4)].map((_, i) => {
                    const waveHeight = Math.max(10, Math.min(100, (audioLevel / 50) * 100 * (1 - i * 0.15)));
                    return (
                      <div
                        key={i}
                        style={{
                          width: '3px',
                          height: `${waveHeight}%`,
                          background: 'var(--color-accent-light)',
                          borderRadius: '2px',
                          transition: 'height 0.1s ease'
                        }}
                      />
                    );
                  })}
                </div>
                <span style={{ fontSize: '0.7rem', color: '#38bdf8', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>Live Audio</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Side Panel: Review Mode or Normal Speaking/Transcript View */}
        <div style={{ height: '100%', overflow: 'hidden' }}>
          
          <AnimatePresence mode="wait">
            {isReviewMode ? (
              // -------------------------------------------------------------
              // REVIEW & EDIT PANEL
              // -------------------------------------------------------------
              <motion.div 
                key="review"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="glass-card" 
                style={{ height: '100%', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', border: '1px solid var(--color-border)', background: 'var(--color-surface)', overflowY: 'auto' }}
              >
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <BarChart3 className="text-purple-400" size={20} />
                    ASR Transcript & Analytics Review
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                    Verify, correct, and view real-time speech analytics before submitting your answer.
                  </p>
                </div>

                {/* Speech Analytics Dashboard */}
                {asrResults && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                    {/* WPM */}
                    <div style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '0.75rem', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Speaking Speed</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-accent-light)', fontFamily: 'var(--font-mono)', margin: '4px 0' }}>
                        {asrResults.analytics.speakingSpeed} <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>WPM</span>
                      </div>
                      <div style={{ fontSize: '0.65rem', color: asrResults.analytics.speakingSpeed < 100 || asrResults.analytics.speakingSpeed > 160 ? '#fbbf24' : '#10b981', fontWeight: 600 }}>
                        {asrResults.analytics.speakingSpeed < 100 ? 'Too Slow' : asrResults.analytics.speakingSpeed > 160 ? 'Too Fast' : 'Optimal Pace'}
                      </div>
                    </div>
                    {/* Filler Words */}
                    <div style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '0.75rem', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Filler Words</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 800, color: asrResults.analytics.fillerWordCount > 3 ? '#ef4444' : '#10b981', fontFamily: 'var(--font-mono)', margin: '4px 0' }}>
                        {asrResults.analytics.fillerWordCount}
                      </div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                        {asrResults.analytics.fillerWords.length > 0 ? asrResults.analytics.fillerWords.join(', ') : 'None detected!'}
                      </div>
                    </div>
                    {/* ASR Confidence */}
                    <div style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '0.75rem', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>ASR Confidence</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary-light)', fontFamily: 'var(--font-mono)', margin: '4px 0' }}>
                        {Math.round(asrResults.confidence * 100)}%
                      </div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>
                        Language: {asrResults.language.toUpperCase()}
                      </div>
                    </div>
                  </div>
                )}

                {/* Edit Text Box */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                      Review Answer Text
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <Edit3 size={12} /> Editable
                    </span>
                  </div>
                  <textarea
                    value={editedTranscript}
                    onChange={(e) => setEditedTranscript(e.target.value)}
                    placeholder="Type or make changes to your answer here..."
                    style={{
                      width: '100%',
                      flex: 1,
                      minHeight: '120px',
                      background: 'var(--color-bg-secondary)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '12px',
                      color: 'var(--color-text)',
                      padding: '1rem',
                      fontSize: '0.95rem',
                      lineHeight: '1.6',
                      fontFamily: 'var(--font-body)',
                      resize: 'none',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                    onBlur={(e) => e.target.style.borderColor = 'var(--color-border)'}
                  />
                </div>

                {/* Audio Checklist / Alerts */}
                <div style={{ background: 'rgba(124, 58, 237, 0.04)', border: '1px solid rgba(124, 58, 237, 0.15)', borderRadius: '12px', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-primary-light)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Signal Quality Auditing
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Check size={14} className="text-emerald-500" /> Mic Status: Connected
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {noiseScore === 'High' ? (
                        <AlertTriangle size={14} className="text-red-500" />
                      ) : (
                        <Check size={14} className="text-emerald-500" />
                      )}
                      Ambient Noise: {noiseScore}
                    </div>
                  </div>
                </div>

                {/* Review Panel Controls */}
                <div style={{ display: 'flex', gap: '1rem', marginTop: 'auto' }}>
                  <button
                    onClick={handleRerecord}
                    className="btn-muted"
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '0.85rem', borderRadius: '12px', border: '1px solid var(--color-border)', background: 'var(--color-surface-2)', cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text)' }}
                  >
                    <RefreshCw size={16} /> Rerecord Answer
                  </button>
                  <button
                    onClick={handleFinalSubmit}
                    disabled={processing || (!editedTranscript.trim() && !transcript.trim())}
                    className="btn-primary"
                    style={{ flex: 1.2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '0.85rem', borderRadius: '12px', border: 'none', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600 }}
                  >
                    {processing ? (
                      <>
                        <Loader2 size={16} className="animate-spin" /> Submitting...
                      </>
                    ) : (
                      <>
                        <Check size={16} /> Submit Response
                      </>
                    )}
                  </button>
                </div>

              </motion.div>
            ) : (
              // -------------------------------------------------------------
              // SPEAKING MODE / NORMAL MODE
              // -------------------------------------------------------------
              <motion.div 
                key="speaking"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="glass-card" 
                style={{ height: '100%', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', border: '1px solid var(--color-border)', background: 'var(--color-surface)', overflow: 'hidden' }}
              >
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <HelpCircle className="text-purple-400" size={18} />
                    Current Question
                  </h3>
                </div>

                {/* Prompt Display */}
                <div style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: '16px', padding: '1.25rem', position: 'relative' }}>
                  <div style={{ position: 'absolute', top: '-10px', left: '16px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '6px', fontSize: '0.65rem', padding: '2px 8px', fontWeight: 700, color: 'var(--color-primary-light)', textTransform: 'uppercase' }}>
                    Question text
                  </div>
                  <p style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text)', lineHeight: '1.5' }}>
                    {questions?.[currentQuestionIndex]?.text}
                  </p>
                </div>

                {/* Live Transcript View Area */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', overflow: 'hidden' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                    Live Transcript Preview (Web Speech API)
                  </span>
                  
                  <div style={{ flex: 1, background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: '16px', padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                    {transcript ? (
                      <p style={{ fontSize: '0.95rem', color: 'var(--color-text)', lineHeight: '1.6', margin: 0 }}>
                        {transcript}
                      </p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '12px', color: 'var(--color-text-muted)' }}>
                        {isAiSpeaking ? (
                          <>
                            <Volume2 size={32} className="text-purple-400 animate-pulse" />
                            <span style={{ fontSize: '0.85rem', textAlign: 'center' }}>Jessica is speaking. Please listen carefully...</span>
                          </>
                        ) : (
                          <>
                            <Mic size={32} className="text-cyan-400" />
                            <span style={{ fontSize: '0.85rem', textAlign: 'center' }}>
                              {isMuted ? "Microphone is muted. Click Mic button or keyboard mode below to speak." : "Microphone active. Speak your answer now!"}
                            </span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Mic Alerts / Status Messages */}
                {micWarning && (
                  <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '12px', padding: '0.75rem', display: 'flex', alignItems: 'center', gap: '8px', color: '#fca5a5', fontSize: '0.8rem' }}>
                    <AlertCircle size={16} />
                    <span>{micWarning}</span>
                  </div>
                )}

                {/* Done Answering Actions */}
                <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    onClick={handleReviewAnswer}
                    disabled={isAiSpeaking || processing || !transcript.trim()}
                    className="btn-primary"
                    style={{ padding: '0.85rem 2rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', cursor: (isAiSpeaking || processing || !transcript.trim()) ? 'not-allowed' : 'pointer', opacity: (isAiSpeaking || processing || !transcript.trim()) ? 0.5 : 1, width: '100%', justifyContent: 'center', fontWeight: 600 }}
                  >
                    {processing ? (
                      <>
                        <Loader2 size={16} className="animate-spin" /> Analyzing Speech...
                      </>
                    ) : (
                      <>
                        <Check size={16} /> Finish & Review Answer
                      </>
                    )}
                  </button>
                </div>

              </motion.div>
            )}
          </AnimatePresence>

        </div>

      </div>

      {/* Floating Subtitles Overlay */}
      <div style={{ position: 'absolute', bottom: '120px', left: '50%', transform: 'translateX(-50%)', maxWidth: '650px', width: '100%', textAlign: 'center', zIndex: 50, pointerEvents: 'none', padding: '0 1rem' }}>
        <AnimatePresence>
          {subtitles && !isReviewMode && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{ background: 'rgba(15,23,42,0.9)', backdropFilter: 'blur(12px)', color: 'white', padding: '0.85rem 1.25rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', display: 'inline-block', fontSize: '1rem', fontWeight: 500, boxShadow: '0 8px 30px rgba(0,0,0,0.5)' }}
            >
              {subtitles}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Control Bar */}
      <div style={{ height: '96px', background: 'var(--color-surface)', borderTop: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', padding: '0 1.5rem', flexShrink: 0, zIndex: 10 }}>
        <button
          onClick={toggleMute}
          disabled={isAiSpeaking || isReviewMode}
          style={{ padding: '1rem', borderRadius: '50%', border: 'none', cursor: (isAiSpeaking || isReviewMode) ? 'not-allowed' : 'pointer', background: isMuted || isAiSpeaking || isReviewMode ? 'var(--color-surface-3)' : 'var(--color-primary-glow)', color: isMuted || isAiSpeaking || isReviewMode ? 'var(--color-text-muted)' : 'var(--color-primary-light)', transition: 'all 0.2s', border: isMuted || isAiSpeaking || isReviewMode ? '1px solid transparent' : '1px solid rgba(124,58,237,0.3)', width: '56px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
        </button>
        
        <button
          onClick={() => setIsVideoOn(!isVideoOn)}
          disabled={isReviewMode}
          style={{ padding: '1rem', borderRadius: '50%', border: 'none', cursor: isReviewMode ? 'not-allowed' : 'pointer', background: !isVideoOn ? 'rgba(239,68,68,0.1)' : 'var(--color-surface-3)', color: !isVideoOn ? '#ef4444' : 'var(--color-text)', transition: 'all 0.2s', border: !isVideoOn ? '1px solid rgba(239,68,68,0.3)' : '1px solid transparent', width: '56px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          {isVideoOn ? <Video size={24} /> : <VideoOff size={24} />}
        </button>

        <button
          onClick={endCall}
          style={{ padding: '1rem', borderRadius: '50%', border: 'none', cursor: 'pointer', background: '#ef4444', color: 'white', transition: 'all 0.2s', boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)', width: '56px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <PhoneMissed size={24} />
        </button>
      </div>
    </div>
  );
};

export default InterviewRoom;
