import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Timer, Brain, ArrowRight, Loader2, Volume2, VolumeX, MessageSquare, Mic, ShieldCheck, MicOff } from 'lucide-react';
import ProgressBar from '../../components/common/ProgressBar';
import { useInterviewStore } from '../../store/interviewStore';
import { interviewAPI } from '../../api/client';
import { useVoice } from '../../hooks/useVoice';
import { useSpeechToText } from '../../hooks/useSpeechToText';

type Phase = 'question' | 'evaluating' | 'feedback';

export default function MockInterviewPage() {
  const navigate = useNavigate();
  const { 
    sessionId, 
    questions, 
    currentQuestionIndex, 
    nextQuestion, 
    addAnswer,
    endSession 
  } = useInterviewStore();

  const { speak, stop, isSpeaking, isEnabled, toggle } = useVoice({ rate: 0.95, pitch: 1.0 });

  const { 
    isListening, 
    transcript, 
    startListening, 
    stopListening,
    isSupported: isSpeechSupported 
  } = useSpeechToText({
    onResult: (text) => {
      setAnswerText(prev => prev + (prev ? ' ' : '') + text);
    }
  });

  const [confidence, setConfidence] = useState<'low' | 'medium' | 'high'>('medium');
  const [answerText, setAnswerText] = useState('');
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  const [phase, setPhase] = useState<Phase>('question');
  const [currentFeedback, setCurrentFeedback] = useState<{ score: number; feedback: string } | null>(null);
  const [questionVisible, setQuestionVisible] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  useEffect(() => {
    if (!sessionId || questions.length === 0) {
      navigate('/interview/setup');
    }
  }, [sessionId, questions, navigate]);

  useEffect(() => {
    if (currentQuestion && phase === 'question') {
      setQuestionVisible(false);
      setTimeout(() => setQuestionVisible(true), 50);
      
      if (isEnabled) {
        const fullText = currentQuestion.subPrompt 
          ? `${currentQuestion.text}. ${currentQuestion.subPrompt}`
          : currentQuestion.text;
        speak(fullText);
      }
    }
  }, [currentQuestionIndex, currentQuestion, phase]);

  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (phase !== 'question') {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setTimer((prev) => prev + 1);
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentQuestionIndex, phase]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const moveToNext = useCallback(() => {
    stop();
    stopListening();
    const lastScore = currentFeedback?.score || 0;
    setCurrentFeedback(null);
    setPhase('question');
    if (isLastQuestion) {
      endSession(lastScore);
      navigate(`/feedback/${sessionId}`);
    } else {
      setAnswerText('');
      setTimer(0);
      nextQuestion();
    }
  }, [isLastQuestion, stop, stopListening, nextQuestion, endSession, navigate, sessionId, currentFeedback]);

  const handleSubmit = useCallback(async () => {
    if (!currentQuestion || !answerText.trim()) return;
    stop();
    stopListening();
    setPhase('evaluating');
    setLoading(true);

    try {
      const { data } = await interviewAPI.submitAnswer(currentQuestion.id, {
        text: answerText,
        confidence,
        duration: timer,
      });

      addAnswer({
        id: crypto.randomUUID(),
        questionId: currentQuestion.id,
        text: answerText,
        confidence,
        duration: timer,
        score: data.score,
        feedback: data.feedback,
      });

      const fb = { score: data.score, feedback: data.feedback };
      setCurrentFeedback(fb);
      setPhase('feedback');

      if (isEnabled && fb.feedback) {
        speak(`Score: ${fb.score}. ${fb.feedback}`);
      }
    } catch (error) {
      console.error('Failed to submit answer:', error);
      alert('AI evaluation failed. Please try again.');
      setPhase('question');
    } finally {
      setLoading(false);
    }
  }, [currentQuestion, answerText, confidence, timer, addAnswer, stop, isEnabled, speak, stopListening]);

  const handleMicToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  if (!currentQuestion) return null;

  return (
    <main className="flex-1 flex flex-col max-w-6xl mx-auto w-full px-6 relative h-[calc(100vh-80px)] overflow-hidden">
      {/* HUD Header */}
      <header className="w-full pt-8 flex flex-col gap-4 animate-fade-in">
        <div className="flex justify-between items-center text-[10px] font-label-bold text-secondary uppercase tracking-[0.2em]">
          <div className="flex items-center gap-4">
            <span className="bg-surface-container-low px-3 py-1 rounded-full border border-outline-variant">
              Section: {currentQuestion.category || 'Core Assessment'}
            </span>
            <span className="flex items-center gap-1.5">
              <Timer size={12} className="text-primary" />
              {formatTime(timer)}
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={toggle}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-500 ${
                isEnabled ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-surface-container-low border-outline-variant text-outline'
              }`}
            >
              {isEnabled ? <Volume2 size={12} /> : <VolumeX size={12} />}
              {isEnabled ? 'Neural Voice Active' : 'Voice Disabled'}
            </button>
            <div className="w-px h-3 bg-outline-variant" />
            <span>Question {currentQuestionIndex + 1} / {questions.length}</span>
          </div>
        </div>
        <ProgressBar value={((currentQuestionIndex + 1) / questions.length) * 100} height="2px" />
      </header>

      {/* Main Stage */}
      <div className="flex-1 flex flex-col relative overflow-hidden mt-8">
        
        {/* PHASE: EVALUATING */}
        {phase === 'evaluating' && (
          <section className="absolute inset-0 flex flex-col justify-center items-center text-center animate-fade-in z-20 bg-background/80 backdrop-blur-sm">
            <div className="relative mb-8">
              <div className="w-20 h-20 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
              <Brain className="absolute inset-0 m-auto text-primary animate-pulse" size={32} />
            </div>
            <h2 className="font-display text-2xl font-bold text-primary mb-2">Analyzing Response</h2>
            <p className="font-body-md text-secondary">Processing linguistics and technical accuracy...</p>
          </section>
        )}

        {/* PHASE: FEEDBACK */}
        {phase === 'feedback' && currentFeedback && (
          <section className="absolute inset-0 flex flex-col justify-center items-center text-center max-w-3xl mx-auto w-full px-6 animate-scale-in z-10">
            <div className="bg-surface-container-low border border-outline-variant rounded-[40px] p-10 w-full shadow-2xl relative overflow-hidden">
              {/* Score Indicator */}
              <div className="flex justify-center mb-8">
                <div className="relative w-32 h-32 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <circle className="text-outline-variant" cx="18" cy="18" r="16" fill="none" stroke="currentColor" strokeWidth="2" />
                    <circle 
                      className="text-primary transition-all duration-1000 ease-out" 
                      cx="18" cy="18" r="16" fill="none" stroke="currentColor" strokeWidth="2"
                      strokeDasharray={`${currentFeedback.score}, 100`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="font-display text-4xl font-bold text-primary">{currentFeedback.score}</span>
                    <span className="text-[10px] font-label-bold text-secondary uppercase">Rating</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 text-primary mb-6">
                <MessageSquare size={18} />
                <h3 className="font-label-bold text-sm uppercase tracking-widest">AI Performance Insight</h3>
              </div>
              
              <p className="font-body-lg text-lg text-on-background leading-relaxed mb-10 italic">
                "{currentFeedback.feedback}"
              </p>

              <button
                onClick={moveToNext}
                className="w-full py-4 rounded-2xl bg-primary text-on-primary font-display font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2 group"
              >
                {isLastQuestion ? 'Proceed to Final Report' : 'Next Challenge'}
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </section>
        )}

        {/* PHASE: QUESTION */}
        {phase === 'question' && (
          <div className="flex-1 flex flex-col">
            <section className={`flex-1 flex flex-col justify-center items-center text-center max-w-4xl mx-auto w-full px-6 transition-all duration-700 ${questionVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              
              {(isSpeaking || isListening) && (
                <div className="flex items-center gap-3 mb-8 px-4 py-2 rounded-full bg-primary/5 border border-primary/10 animate-fade-in">
                  <div className="flex gap-1 h-3 items-end">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="w-1 bg-primary rounded-full animate-voice-bar" style={{ animationDelay: `${i * 0.1}s` }} />
                    ))}
                  </div>
                  <span className="text-[10px] font-label-bold text-primary uppercase tracking-widest">
                    {isListening ? 'Neural Listening Active' : 'AI Synchronizing...'}
                  </span>
                </div>
              )}

              <h1 className="font-display text-4xl md:text-5xl font-bold text-on-background leading-tight mb-8">
                {currentQuestion.text}
              </h1>
              
              {currentQuestion.subPrompt && (
                <div className="flex items-start gap-3 text-left bg-surface-container-low/50 border border-outline-variant p-4 rounded-2xl max-w-xl">
                  <Mic size={18} className="text-primary mt-1 shrink-0" />
                  <p className="font-body-md text-secondary leading-relaxed italic">
                    Interviewer Insight: {currentQuestion.subPrompt}
                  </p>
                </div>
              )}
            </section>

            {/* Response Deck */}
            <section className="w-full max-w-4xl mx-auto pb-12 animate-slide-up">
              <div className="flex justify-center gap-2 mb-6">
                {(['low', 'medium', 'high'] as const).map((level) => (
                  <button
                    key={level}
                    onClick={() => setConfidence(level)}
                    className={`px-6 py-2 rounded-full text-xs font-label-bold transition-all border ${
                      confidence === level
                        ? 'bg-primary text-on-primary border-primary shadow-lg shadow-primary/20'
                        : 'bg-surface-container-low text-secondary border-outline-variant hover:border-primary/30'
                    }`}
                  >
                    {level.toUpperCase()} CONFIDENCE
                  </button>
                ))}
              </div>

              <div className="relative group">
                <div className="absolute inset-0 bg-primary/5 rounded-[32px] blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
                <div className="relative bg-surface-container-low border border-outline-variant rounded-[32px] p-8 focus-within:border-primary transition-all shadow-sm">
                  {isListening && (
                    <div className="absolute top-4 right-4 flex items-center gap-2 animate-pulse">
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                      <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Recording</span>
                    </div>
                  )}
                  <textarea
                    ref={textareaRef}
                    className="w-full h-32 bg-transparent border-none outline-none resize-none font-body-lg text-lg text-on-surface placeholder:text-outline/50 focus:ring-0 p-0"
                    placeholder={isListening ? "Listening to your response..." : "Speak or type your strategic response..."}
                    value={answerText}
                    onChange={(e) => setAnswerText(e.target.value)}
                  />
                  
                  <div className="flex justify-between items-center mt-6 pt-6 border-t border-outline-variant">
                    <div className="flex items-center gap-4">
                      {isSpeechSupported && (
                        <button
                          onClick={handleMicToggle}
                          className={`p-3 rounded-full transition-all duration-300 ${
                            isListening 
                              ? 'bg-red-500 text-white shadow-lg shadow-red-500/20 scale-110' 
                              : 'bg-primary/10 text-primary hover:bg-primary hover:text-white'
                          }`}
                          title={isListening ? 'Stop Listening' : 'Start Speaking'}
                        >
                          {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                        </button>
                      )}
                      <div className="flex items-center gap-2 text-secondary font-label-bold text-[10px] uppercase">
                        <ShieldCheck size={14} className="text-primary" />
                        Neural Assessment Ready
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => { stop(); stopListening(); setAnswerText(''); setTimer(0); nextQuestion(); }}
                        className="text-secondary font-label-bold text-xs hover:text-primary transition-colors"
                      >
                        Skip Question
                      </button>
                      <button
                        onClick={handleSubmit}
                        disabled={loading || !answerText.trim()}
                        className="px-10 py-4 rounded-2xl bg-primary text-on-primary font-display font-bold hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 flex items-center gap-2"
                      >
                        {loading && <Loader2 className="animate-spin" size={18} />}
                        {isLastQuestion ? 'Finalize Interview' : 'Submit Response'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
