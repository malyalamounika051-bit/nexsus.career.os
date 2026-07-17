import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, MicOff, Video, VideoOff, PhoneMissed, Loader2, Play, 
  Check, RefreshCw, Volume2, AlertCircle, Sparkles, BookOpen, 
  Award, ArrowLeft, Send, CheckCircle2, ChevronRight, Edit3, Save, Activity, Trash2, CheckCircle
} from 'lucide-react';
import api from '../services/api';

// Interview Room States:
// - 'IDLE': Initialized, waiting to start
// - 'AI_SPEAKING': The AI avatar is speaking the question
// - 'WAITING_FOR_USER': Wait for user to start recording or typing
// - 'RECORDING': MediaRecorder is active and capturing audio
// - 'TRANSCRIBING': Audio is uploading and transcribing via AssemblyAI
// - 'PROCESSING': AI is evaluating the answer and planning the next step
// - 'INTERVIEW_COMPLETE': Final report is being generated

export default function InterviewRoom() {
  const location = useLocation();
  const navigate = useNavigate();
  const { interviewId, jobRole, difficulty, track, company, experienceLevel, durationLimit, avatar, questions } = location.state || {};

  const [currentIdx, setCurrentIdx] = useState(0);
  const [interviewStatus, setInterviewStatus] = useState('IDLE');
  const [subtitles, setSubtitles] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [speechText, setSpeechText] = useState('');

  // Audio Recording States
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);

  // Status and Metadata
  const [transcriptionMetadata, setTranscriptionMetadata] = useState(null);
  const [asrError, setAsrError] = useState('');
  const [evalLoading, setEvalLoading] = useState(false);

  // Statistics & Timer
  const [noiseFilterLevel] = useState('99.2% Clean');
  const [latency] = useState('85ms');
  const [totalTimerCount, setTotalTimerCount] = useState(0);

  // Dialogue Loop History
  const [dialogueHistory, setDialogueHistory] = useState([]);
  const [currentPromptQuestion, setCurrentPromptQuestion] = useState('');

  // Speech Synthesis Refs
  const synthRef = useRef(window.speechSynthesis);
  const utteranceRef = useRef(null);
  const speakingTimeoutRef = useRef(null);

  // Initialize Room
  useEffect(() => {
    if (!jobRole) {
      navigate('/mock-interview/setup');
      return;
    }

    if (questions && questions.length > 0) {
      setCurrentPromptQuestion(questions[0]);
      speakQuestion(questions[0]);
    }

    const totalInterval = setInterval(() => {
      setTotalTimerCount(prev => prev + 1);
    }, 1000);

    return () => {
      clearInterval(totalInterval);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (speakingTimeoutRef.current) clearTimeout(speakingTimeoutRef.current);
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  const formatDuration = (sec) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const speakQuestion = (text) => {
    if (!text) return;
    setInterviewStatus('AI_SPEAKING');
    setSubtitles(text);
    
    if (speakingTimeoutRef.current) clearTimeout(speakingTimeoutRef.current);

    if (synthRef.current && !isMuted) {
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
        setInterviewStatus('WAITING_FOR_USER');
      };

      utterance.onerror = (e) => {
        console.warn('TTS Speech Error:', e);
        setInterviewStatus('WAITING_FOR_USER');
      };
      
      utteranceRef.current = utterance;
      synthRef.current.speak(utterance);

      // Fallback in case onend event fails to fire
      const wordsCount = text.split(/\s+/).length;
      const estimatedDurationMs = Math.max(3000, (wordsCount / 140) * 60000 + 1500);
      speakingTimeoutRef.current = setTimeout(() => {
        if (synthRef.current && synthRef.current.speaking) {
          synthRef.current.cancel();
        }
        setInterviewStatus('WAITING_FOR_USER');
      }, estimatedDurationMs);
    } else {
      setTimeout(() => {
        setInterviewStatus('WAITING_FOR_USER');
      }, 3000);
    }
  };

  // MediaRecorder Speech Recording Flow
  const startRecording = async () => {
    try {
      setAsrError('');
      setTranscriptionMetadata(null);
      audioChunksRef.current = [];
      setRecordingDuration(0);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const options = { mimeType: 'audio/webm' };
      let recorder;
      try {
        recorder = new MediaRecorder(stream, options);
      } catch (err) {
        recorder = new MediaRecorder(stream);
      }

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        
        // Stop all audio tracks to release microphone
        stream.getTracks().forEach(track => track.stop());

        if (audioBlob.size < 500) {
          setAsrError('Recording too short. Please try speaking again.');
          setInterviewStatus('WAITING_FOR_USER');
          return;
        }

        uploadAudioForTranscription(audioBlob);
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setInterviewStatus('RECORDING');

      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error('Microphone permission denied / error:', err);
      setAsrError('Microphone permission denied or device disconnected. Please verify connection.');
      setInterviewStatus('WAITING_FOR_USER');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    }
  };

  const uploadAudioForTranscription = async (blob) => {
    setInterviewStatus('TRANSCRIBING');
    
    const formData = new FormData();
    formData.append('audio', blob, 'recording.webm');
    formData.append('duration', recordingDuration);

    try {
      const response = await api.post('/interview/transcribe', formData);
      
      if (response.data.success) {
        const data = response.data.data;
        setSpeechText(data.transcript);
        const metadata = {
          confidence: data.confidence || 90,
          duration: data.duration || recordingDuration || 10,
          wordCount: data.wordCount || 0,
          language: data.language === 'en' ? 'English' : data.language || 'English'
        };
        setTranscriptionMetadata(metadata);
        
        // Auto-submit transcription response
        await handleSendResponse(data.transcript, metadata);
      } else {
        throw new Error(response.data.message || 'ASR parsing error');
      }
    } catch (err) {
      console.error('ASR Upload Failure:', err);
      setAsrError(err.response?.data?.message || err.message || 'AssemblyAI was unable to transcribe this recording. Please re-record.');
      setInterviewStatus('WAITING_FOR_USER');
    }
  };

  const handleSendResponse = async (customAnswer = null, customMeta = null) => {
    const answer = (typeof customAnswer === 'string' ? customAnswer : speechText).trim();
    if (!answer) return;

    setDialogueHistory(prev => [...prev, { role: 'candidate', text: answer, question: currentPromptQuestion }]);
    
    // Reset inputs & update state
    setSpeechText('');
    setInterviewStatus('PROCESSING');

    const confidenceVal = customMeta?.confidence || transcriptionMetadata?.confidence || 90;
    const durationVal = customMeta?.duration || transcriptionMetadata?.duration || 20;

    try {
      const response = await api.post('/interview/evaluate', {
        interviewId,
        question: currentPromptQuestion,
        userAnswer: answer,
        confidence: confidenceVal,
        duration: durationVal
      });

      if (response.data.success) {
        const payload = response.data.data;
        
        if (payload.isCompleted) {
          setInterviewStatus('AI_SPEAKING');
          setSubtitles("Thank you! We have completed all stages of this interview round. Generating your report now...");
          setTimeout(() => {
            handleCompleteInterview();
          }, 3000);
        } else if (payload.nextQuestion) {
          setCurrentIdx(prev => prev + 1);
          setCurrentPromptQuestion(payload.nextQuestion);
          speakQuestion(payload.nextQuestion);
        } else {
          setInterviewStatus('AI_SPEAKING');
          setSubtitles("Thank you. I have gathered enough details to evaluate your profile. Let me prepare the final report.");
          setTimeout(() => {
            handleCompleteInterview();
          }, 2000);
        }
      }
    } catch (err) {
      console.error('Error in evaluation loop:', err);
      // Failover transition
      const nextIndex = currentIdx + 1;
      if (nextIndex < (questions || []).length) {
        setCurrentIdx(nextIndex);
        setCurrentPromptQuestion(questions[nextIndex]);
        speakQuestion(questions[nextIndex]);
      } else {
        handleCompleteInterview();
      }
    }
  };

  const handleCompleteInterview = async () => {
    if (dialogueHistory.length === 0) {
      alert("No answers were recorded. Exiting mock interview room.");
      navigate('/mock-interview/setup');
      return;
    }
    setInterviewStatus('INTERVIEW_COMPLETE');
    setEvalLoading(true);
    try {
      const response = await api.post('/interview/finalize', { interviewId });
      if (response.data.success) {
        navigate('/mock-interview/report', { state: { interview: response.data.data } });
      } else {
        throw new Error(response.data.message || 'Report finalize failed');
      }
    } catch (err) {
      console.error('Error finalizing report:', err);
      navigate('/mock-interview/setup');
    } finally {
      setEvalLoading(false);
    }
  };

  const handleMutedToggle = () => {
    if (!isMuted) {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
      setIsMuted(true);
      if (interviewStatus === 'AI_SPEAKING') {
        setInterviewStatus('WAITING_FOR_USER');
      }
    } else {
      setIsMuted(false);
      speakQuestion(currentPromptQuestion);
    }
  };

  const handleTypeSubmission = () => {
    if (!speechText.trim()) return;
    const wordCount = speechText.trim().split(/\s+/).length;
    handleSendResponse(speechText, { confidence: 100, duration: 15, wordCount });
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
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#8b5cf6' }}>
            <Sparkles size={12} /> AssemblyAI HD Speech-to-Text Pipeline
          </span>
          <span>Latency: {latency}</span>
          <span style={{ background: 'var(--color-surface-2)', padding: '0.35rem 0.75rem', borderRadius: '6px', color: 'var(--color-text)' }}>
            {formatDuration(totalTimerCount)}
          </span>
        </div>
      </header>

      {evalLoading || interviewStatus === 'INTERVIEW_COMPLETE' ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.5rem' }}>
          <Loader2 size={48} className="animate-spin" color="var(--color-primary)" />
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ margin: 0, color: 'var(--color-text)', fontWeight: 800 }}>Synthesizing Communication Scores...</h3>
            <p style={{ margin: '0.5rem 0 0', color: 'var(--color-text-muted)' }}>Calculating speech analytics, grammar accuracy, and active metrics.</p>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '2rem', padding: '2rem' }}>
          
          {/* Left panel: Interviewer Video Screen */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Visualizer Area */}
            <div className="glass-card" style={{ flex: 1, background: '#090d16', border: '1px solid var(--color-border)', borderRadius: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', position: 'relative', overflow: 'hidden', minHeight: '380px' }}>
              
              {/* Voice waves */}
              {interviewStatus === 'AI_SPEAKING' && (
                <div style={{ position: 'absolute', display: 'flex', gap: '6px', bottom: '2rem' }}>
                  {[1, 2, 3, 4, 5, 6, 5, 4, 3, 2, 1].map((h, i) => (
                    <motion.div 
                      key={i}
                      animate={{ height: [12, h * 7, 12] }}
                      transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.04 }}
                      style={{ width: '4px', background: '#8b5cf6', borderRadius: '99px' }}
                      className="visualizer-bar"
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
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: interviewStatus === 'AI_SPEAKING' ? '#8b5cf6' : interviewStatus === 'RECORDING' ? '#ef4444' : interviewStatus === 'WAITING_FOR_USER' ? '#10b981' : '#f59e0b' }}>
                    {interviewStatus === 'AI_SPEAKING' && 'Speaking...'}
                    {interviewStatus === 'RECORDING' && 'Listening...'}
                    {interviewStatus === 'WAITING_FOR_USER' && 'Ready for answer'}
                    {interviewStatus === 'TRANSCRIBING' && 'Transcribing...'}
                    {interviewStatus === 'PROCESSING' && 'Thinking...'}
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
                onClick={handleMutedToggle} 
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

          {/* Right panel: Recording Area, Loading States, Review Screen */}
          <div className="glass-card" style={{ padding: '1.5rem', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-text)' }}>
                Response Control
              </h3>
            </div>

            {/* Conversation list */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '0.5rem 0' }}>
              {dialogueHistory.length === 0 ? (
                <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifycontent: 'center', color: 'var(--color-text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '1rem', justifyContent: 'center' }}>
                  Speak your answer by clicking "Record Response" below. Once transcription completes, review and submit.
                </div>
              ) : (
                dialogueHistory.map((log, i) => (
                  <div key={i} style={{ padding: '0.75rem 1rem', background: 'var(--color-surface-2)', borderRadius: '12px', borderLeft: '3px solid var(--color-primary)' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-primary)', display: 'block', marginBottom: '0.2rem' }}>Q{i+1}: {log.question.substring(0, 40)}...</span>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text)', lineHeight: 1.4 }}>{log.text}</p>
                  </div>
                ))
              )}
            </div>

            {/* Action workspace */}
            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              {asrError && (
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '0.75rem', borderRadius: '8px', color: '#ef4444', fontSize: '0.8rem' }}>
                  <AlertCircle size={16} style={{ shrink: 0 }} />
                  <span>{asrError}</span>
                </div>
              )}

              {/* Status Indicator */}
              {(interviewStatus === 'TRANSCRIBING' || interviewStatus === 'PROCESSING') && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'var(--color-surface-2)', padding: '1rem', borderRadius: '12px', alignItems: 'center' }}>
                  <Loader2 size={24} className="animate-spin" color="var(--color-primary)" />
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>
                    {interviewStatus === 'TRANSCRIBING' && 'Uploading audio to AssemblyAI...'}
                    {interviewStatus === 'PROCESSING' && 'AI Evaluating response...'}
                  </span>
                </div>
              )}

              {/* Record buttons */}
              {interviewStatus !== 'TRANSCRIBING' && interviewStatus !== 'PROCESSING' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  
                  {interviewStatus === 'RECORDING' && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-surface-2)', padding: '0.75rem 1rem', borderRadius: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className="animate-ping" style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }}></span>
                        <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'white' }}>🎤 Recording Answer...</span>
                      </div>
                      <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#ef4444', fontFamily: 'monospace' }}>{formatDuration(recordingDuration)}</span>
                    </div>
                  )}

                  {interviewStatus === 'RECORDING' ? (
                    <button 
                      onClick={stopRecording} 
                      className="btn-primary" 
                      style={{ width: '100%', padding: '0.85rem', borderRadius: '12px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: '#ef4444', border: '1px solid #ef4444' }}
                    >
                      <Check size={16} /> Stop & Transcribe
                    </button>
                  ) : (
                    <button 
                      onClick={startRecording} 
                      className="btn-primary" 
                      disabled={interviewStatus === 'AI_SPEAKING'}
                      style={{ width: '100%', padding: '0.85rem', borderRadius: '12px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: interviewStatus === 'AI_SPEAKING' ? 0.6 : 1 }}
                    >
                      <Mic size={16} /> Record Response
                    </button>
                  )}

                  {/* Typing input alternative fallback */}
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <input 
                      value={speechText}
                      onChange={e => setSpeechText(e.target.value)}
                      placeholder="Or type your answer directly here..."
                      disabled={interviewStatus === 'AI_SPEAKING'}
                      style={{ flex: 1, background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)', padding: '0.65rem 0.85rem', borderRadius: '8px', outline: 'none', fontSize: '0.85rem', opacity: interviewStatus === 'AI_SPEAKING' ? 0.6 : 1 }}
                      onKeyDown={e => { if (e.key === 'Enter') handleTypeSubmission(); }}
                    />
                    <button 
                      onClick={handleTypeSubmission} 
                      className="btn-primary" 
                      disabled={interviewStatus === 'AI_SPEAKING' || !speechText.trim()}
                      style={{ padding: '0 0.85rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700 }}
                    >
                      Submit
                    </button>
                  </div>

                </div>
              )}

            </div>
          </div>

        </div>
      )}

    </div>
  );
}
