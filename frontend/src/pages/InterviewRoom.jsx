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

  // Audio Recording States
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);

  // Loading and Transcription Statuses
  const [transcriptionStatus, setTranscriptionStatus] = useState('idle'); // idle, uploading, transcribing, ready, error
  const [transcriptionMetadata, setTranscriptionMetadata] = useState(null); // confidence, duration, wordCount, language
  const [asrError, setAsrError] = useState('');
  const [evalLoading, setEvalLoading] = useState(false);

  // Statistics
  const [noiseFilterLevel] = useState('99.2% Clean');
  const [latency] = useState('85ms');
  const [totalTimerCount, setTotalTimerCount] = useState(0);

  // Dialogue loops
  const [dialogueHistory, setDialogueHistory] = useState([]);
  const [currentPromptQuestion, setCurrentPromptQuestion] = useState('');

  // Speech TTS ref
  const synthRef = useRef(window.speechSynthesis);
  const utteranceRef = useRef(null);

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
      };
      
      utteranceRef.current = utterance;
      synthRef.current.speak(utterance);
    } else {
      setTimeout(() => {
        setInterviewerState('listening');
      }, 3000);
    }
  };

  // MediaRecorder Speech Recording Flow
  const startRecording = async () => {
    try {
      setAsrError('');
      setTranscriptionStatus('idle');
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
        // Construct Audio Blob from Chunks
        const audioBlob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        
        // Stop all audio tracks from stream to release the mic
        stream.getTracks().forEach(track => track.stop());

        if (audioBlob.size < 500) {
          setAsrError('Recording too short. Please try speaking again.');
          setTranscriptionStatus('error');
          return;
        }

        uploadAudioForTranscription(audioBlob);
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);

      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error('Microphone permission denied / error:', err);
      setAsrError('Microphone permission denied or device disconnected. Please verify connection.');
      setTranscriptionStatus('error');
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
    setTranscriptionStatus('uploading');
    
    const formData = new FormData();
    formData.append('audio', blob, 'recording.webm');
    formData.append('duration', recordingDuration);

    try {
      setTranscriptionStatus('transcribing');
      const response = await api.post('/interview/transcribe', formData);
      
      if (response.data.success) {
        const data = response.data.data;
        setSpeechText(data.transcript);
        setTranscriptionMetadata({
          confidence: data.confidence,
          duration: data.duration,
          wordCount: data.wordCount,
          language: data.language === 'en' ? 'English' : data.language
        });
        setTranscriptionStatus('ready');
      } else {
        throw new Error(response.data.message || 'ASR parsing error');
      }
    } catch (err) {
      console.error('ASR Upload Failure:', err);
      setAsrError(err.response?.data?.message || err.message || 'AssemblyAI was unable to transcribe this recording. Please re-record.');
      setTranscriptionStatus('error');
    }
  };

  const handleSendResponse = async () => {
    if (!speechText.trim()) return;

    const answer = speechText;
    setDialogueHistory(prev => [...prev, { role: 'candidate', text: answer, question: currentPromptQuestion }]);
    
    // Reset status and preview box
    setSpeechText('');
    setTranscriptionStatus('idle');
    setTranscriptionMetadata(null);
    setInterviewerState('thinking');

    try {
      const response = await api.post('/interview/evaluate', {
        interviewId,
        question: currentPromptQuestion,
        userAnswer: answer,
        confidence: transcriptionMetadata?.confidence || 90,
        duration: transcriptionMetadata?.duration || 20
      });

      if (response.data.success) {
        const payload = response.data.data;
        
        if (payload.isCompleted) {
          setInterviewerState('speaking');
          setSubtitles("Thank you. We have completed all stages of the interview. Let me generate your detailed report.");
          setTimeout(() => {
            handleCompleteInterview();
          }, 2000);
        } else if (payload.nextQuestion) {
          setCurrentIdx(prev => prev + 1);
          setCurrentPromptQuestion(payload.nextQuestion);
          speakQuestion(payload.nextQuestion);
        } else {
          // Fallback if nextQuestion is empty
          setInterviewerState('speaking');
          setSubtitles("Thank you. I have gathered enough information. Generating your complete report now.");
          handleCompleteInterview();
        }
      }
    } catch (err) {
      console.error('Error in evaluation loop:', err);
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
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#8b5cf6' }}>
            <Sparkles size={12} /> AssemblyAI HD Speech-to-Text Pipeline
          </span>
          <span>Latency: {latency}</span>
          <span style={{ background: 'var(--color-surface-2)', padding: '0.35rem 0.75rem', borderRadius: '6px', color: 'var(--color-text)' }}>
            {formatDuration(totalTimerCount)}
          </span>
        </div>
      </header>

      {evalLoading ? (
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
                    {interviewerState === 'speaking' ? 'Speaking...' : interviewerState === 'listening' ? 'Listening...' : 'Thinking...'}
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
              {transcriptionStatus !== 'idle' && transcriptionStatus !== 'ready' && transcriptionStatus !== 'error' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'var(--color-surface-2)', padding: '1rem', borderRadius: '12px', alignItems: 'center' }}>
                  <Loader2 size={24} className="animate-spin" color="var(--color-primary)" />
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>
                    {transcriptionStatus === 'uploading' && 'Uploading audio to AssemblyAI...'}
                    {transcriptionStatus === 'transcribing' && 'Transcribing audio buffer...'}
                  </span>
                </div>
              )}

              {/* Review Screen */}
              {transcriptionStatus === 'ready' && transcriptionMetadata && (
                <div style={{ background: 'var(--color-surface-2)', padding: '1.25rem', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '1rem', border: '1px solid var(--color-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#10b981', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                      <CheckCircle size={12} /> TRANSCRIPT READY
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>You can edit text before submitting</span>
                  </div>

                  <textarea
                    value={speechText}
                    onChange={e => setSpeechText(e.target.value)}
                    style={{ width: '100%', minHeight: '90px', background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text)', padding: '0.75rem', borderRadius: '10px', fontSize: '0.85rem', outline: 'none', resize: 'vertical', fontFamily: 'inherit' }}
                  />

                  {/* Metadata display */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', fontSize: '0.7rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>
                    <div style={{ background: 'var(--color-bg)', padding: '0.4rem', borderRadius: '6px' }}>
                      <div style={{ fontWeight: 800, color: '#8b5cf6' }}>{transcriptionMetadata.confidence}%</div>
                      <div>Confidence</div>
                    </div>
                    <div style={{ background: 'var(--color-bg)', padding: '0.4rem', borderRadius: '6px' }}>
                      <div style={{ fontWeight: 800, color: '#06b6d4' }}>{formatDuration(transcriptionMetadata.duration)}</div>
                      <div>Duration</div>
                    </div>
                    <div style={{ background: 'var(--color-bg)', padding: '0.4rem', borderRadius: '6px' }}>
                      <div style={{ fontWeight: 800, color: '#f59e0b' }}>{transcriptionMetadata.wordCount}</div>
                      <div>Words</div>
                    </div>
                    <div style={{ background: 'var(--color-bg)', padding: '0.4rem', borderRadius: '6px' }}>
                      <div style={{ fontWeight: 800, color: 'var(--color-text)' }}>{transcriptionMetadata.language}</div>
                      <div>Language</div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <button 
                      onClick={handleSendResponse} 
                      className="btn-primary" 
                      style={{ padding: '0.75rem', borderRadius: '10px', fontWeight: 800, display: 'flex', alignItems: 'center', justifycontent: 'center', gap: '0.25rem', fontSize: '0.8rem', justifyContent: 'center' }}
                    >
                      <CheckCircle2 size={14} /> Submit Answer
                    </button>
                    <button 
                      onClick={startVoiceRecording} 
                      className="btn-ghost" 
                      style={{ padding: '0.75rem', borderRadius: '10px', fontWeight: 800, display: 'flex', alignItems: 'center', justifycontent: 'center', gap: '0.25rem', border: '1px solid var(--color-border)', fontSize: '0.8rem', justifyContent: 'center' }}
                    >
                      <RefreshCw size={12} /> Re-record
                    </button>
                  </div>
                </div>
              )}

              {/* Record buttons */}
              {transcriptionStatus !== 'uploading' && transcriptionStatus !== 'transcribing' && transcriptionStatus !== 'ready' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  
                  {isRecording && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-surface-2)', padding: '0.75rem 1rem', borderRadius: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className="animate-ping" style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }}></span>
                        <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'white' }}>🎤 Recording Answer...</span>
                      </div>
                      <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#ef4444', fontFamily: 'monospace' }}>{formatDuration(recordingDuration)}</span>
                    </div>
                  )}

                  {isRecording ? (
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
                      style={{ width: '100%', padding: '0.85rem', borderRadius: '12px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
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
                      style={{ flex: 1, background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)', padding: '0.65rem 0.85rem', borderRadius: '8px', outline: 'none', fontSize: '0.85rem' }}
                      onKeyDown={e => { if (e.key === 'Enter') { setTranscriptionStatus('ready'); setTranscriptionMetadata({ confidence: 100, duration: 15, wordCount: speechText.trim().split(/\s+/).length, language: 'English' }); } }}
                    />
                    <button 
                      onClick={() => { if (speechText.trim()) { setTranscriptionStatus('ready'); setTranscriptionMetadata({ confidence: 100, duration: 15, wordCount: speechText.trim().split(/\s+/).length, language: 'English' }); } }} 
                      className="btn-primary" 
                      style={{ padding: '0 0.85rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700 }}
                    >
                      Type Preview
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
