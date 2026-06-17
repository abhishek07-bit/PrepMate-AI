import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, Variants } from 'framer-motion';
import ProgressBar from '../../components/common/ProgressBar';
import { useInterviewStore } from '../../store/interviewStore';
import { interviewAPI } from '../../api/client';
import { useVoice } from '../../hooks/useVoice';
import { useSpeechToText } from '../../hooks/useSpeechToText';
import NeuralLoader from '../../components/common/NeuralLoader';
import { safeId } from '../../utils/safeId';

type Phase = 'question' | 'evaluating' | 'feedback';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.2 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

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

  const lastSpokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (currentQuestion && phase === 'question') {
      setQuestionVisible(false);
      const timeoutId = setTimeout(() => setQuestionVisible(true), 50);
      return () => clearTimeout(timeoutId);
    }
  }, [currentQuestionIndex, currentQuestion, phase]);

  useEffect(() => {
    if (currentQuestion && phase === 'question' && isEnabled) {
      const key = `${currentQuestionIndex}-${currentQuestion.id}`;
      if (lastSpokenRef.current !== key) {
        lastSpokenRef.current = key;
        const fullText = currentQuestion.subPrompt 
          ? `${currentQuestion.text}. ${currentQuestion.subPrompt}`
          : currentQuestion.text;
        speak(fullText);
      }
    }
  }, [currentQuestionIndex, currentQuestion, phase, isEnabled, speak]);

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
        id: safeId(),
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
        speak(`Rating: ${fb.score}. ${fb.feedback}`);
      }
    } catch (error) {
      console.error('Failed to submit answer:', error);
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
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="flex-1 flex flex-col max-w-max-width mx-auto w-full px-lg md:px-xl pt-[96px] pb-lg min-h-screen min-h-[100dvh] overflow-hidden"
    >
      
      {/* HUD */}
      <motion.header variants={itemVariants} className="flex flex-col gap-xs">
        <div className="flex items-center justify-between flex-wrap gap-sm">
          <div className="flex items-center gap-sm relative">
            <span className="w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_8px_rgba(var(--color-primary-rgb),0.4)]" />
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary">
              {currentQuestion.category || 'Question'}
            </span>
            <div className="absolute -bottom-1 left-0 w-8 h-[1px] bg-gradient-to-r from-primary to-transparent opacity-40" />
          </div>
          <div className="flex items-center gap-md">
            <button
              onClick={toggle}
              className={`flex items-center gap-sm px-md py-sm rounded-pebble border transition-all ${
                isEnabled ? 'bg-primary text-on-primary border-primary' : 'bg-surface text-secondary border-outline-variant'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">{isEnabled ? 'volume_up' : 'volume_off'}</span>
              <span className="font-label-bold text-[10px] uppercase tracking-widest">{isEnabled ? 'Voice On' : 'Voice Off'}</span>
            </button>
          </div>
        </div>
        <ProgressBar value={((currentQuestionIndex + 1) / questions.length) * 100} height="2px" />
      </motion.header>

      {/* Main Content Area */}
      <motion.main variants={itemVariants} className="flex-1 flex flex-col relative bg-surface-container-low border border-outline-variant rounded-pebble overflow-hidden">
        
        {/* EVALUATING OVERLAY */}
        {phase === 'evaluating' && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-surface/80 backdrop-blur-sm flex items-center justify-center"
          >
            <NeuralLoader message="Analyzing performance..." />
          </motion.div>
        )}

        {/* FEEDBACK OVERLAY */}
        {phase === 'feedback' && currentFeedback && (
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="absolute inset-0 z-40 bg-surface flex flex-col items-center justify-center px-lg py-xl text-center gap-xl"
          >
            <div className="flex flex-col items-center gap-md">
              <div className="relative w-24 h-24 flex items-center justify-center">
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
                  <span className="font-display text-[32px] font-bold text-primary leading-none">{currentFeedback.score}</span>
                  <span className="text-[8px] font-bold text-secondary uppercase tracking-widest mt-1">Rating</span>
                </div>
              </div>
              <h3 className="font-label-bold text-label-sm text-secondary uppercase tracking-widest flex items-center gap-sm">
                <span className="material-symbols-outlined text-[14px]">chat_bubble</span> Performance Insight
              </h3>
            </div>
            
            <p className="font-body-lg text-body-lg text-primary leading-relaxed max-w-xl italic">
              "{currentFeedback.feedback}"
            </p>

            <button
              onClick={moveToNext}
              className="bg-primary text-on-primary px-xl py-lg rounded-pebble font-label-bold text-label-bold hover:shadow-lg transition-all flex items-center gap-md group"
            >
              {isLastQuestion ? 'Finish Session' : 'Next Question'}
              <span className="material-symbols-outlined text-[20px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </button>
          </motion.div>
        )}

        {/* QUESTION PHASE */}
        {phase === 'question' && (
          <div className="flex-1 flex flex-col p-lg md:p-xl lg:p-container-padding gap-xl">
            {/* Question Stage */}
            <div className={`flex-1 flex flex-col justify-center items-center gap-lg transition-all duration-500 ${questionVisible ? 'opacity-100' : 'opacity-0 translate-y-4'}`}>
              <div className="flex flex-col items-center gap-md text-center max-w-2xl">
                {(isSpeaking || isListening) && (
                  <div className="flex items-center gap-sm relative animate-fade-in">
                    <div className="flex gap-1 h-3 items-end mr-1">
                      {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="w-1 bg-primary rounded-full animate-voice-bar" style={{ animationDelay: `${i * 0.1}s` }} />
                      ))}
                    </div>
                    <span className="text-[9px] font-bold text-primary uppercase tracking-[0.3em]">
                      {isListening ? 'Listening' : 'Speaking'}
                    </span>
                    <div className="absolute -bottom-1 left-0 w-full h-[1px] bg-gradient-to-r from-primary to-transparent opacity-40" />
                  </div>
                )}
                <h1 className="font-display text-headline-md text-primary leading-tight tracking-tight">
                  {currentQuestion.text}
                </h1>
                {currentQuestion.subPrompt && (
                  <div className="bg-surface-container-lowest p-md rounded-pebble border border-outline-variant flex gap-md items-start text-left max-w-lg">
                    <span className="material-symbols-outlined text-primary text-[16px] shrink-0 mt-1">bolt</span>
                    <p className="text-body-sm text-secondary leading-relaxed italic">
                      <span className="font-bold text-primary not-italic">Hint:</span> {currentQuestion.subPrompt}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Response Area */}
            <div className="flex flex-col gap-lg" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
              <div className="flex justify-center gap-sm">
                {(['low', 'medium', 'high'] as const).map((level) => (
                  <button
                    key={level}
                    onClick={() => setConfidence(level)}
                    className={`px-md py-xs rounded-full text-[9px] font-bold uppercase tracking-widest border transition-all ${
                      confidence === level
                        ? 'bg-primary text-on-primary border-primary'
                        : 'bg-surface-container-lowest text-secondary border-outline-variant hover:border-primary hover:text-primary'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>

              <div className="bg-surface-container-lowest border border-outline-variant rounded-pebble p-lg flex flex-col gap-lg relative">
                {isListening && (
                  <div className="absolute top-md right-md flex items-center gap-sm group cursor-default">
                    <div className="flex items-center gap-xs relative">
                      <span className="w-1.5 h-1.5 bg-error rounded-full animate-pulse shadow-[0_0_8px_rgba(211,47,47,0.4)]" />
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-error">Rec</span>
                    </div>
                  </div>
                )}

                <textarea
                  ref={textareaRef}
                  className="w-full h-20 md:h-24 bg-transparent border-none outline-none resize-none font-body-md text-body-md text-primary placeholder:text-secondary/50 p-0 leading-relaxed custom-scrollbar focus:ring-0"
                  placeholder={isListening ? "Listening..." : "Provide your response..."}
                  value={answerText}
                  onChange={(e) => setAnswerText(e.target.value)}
                />
                
                <div className="flex items-center justify-between pt-md border-t border-outline-variant">
                  <div className="flex items-center gap-md">
                    {isSpeechSupported && (
                      <button
                        onClick={handleMicToggle}
                        className={`w-10 h-10 rounded-pebble flex items-center justify-center transition-all ${
                          isListening 
                            ? 'bg-error text-on-error shadow-lg' 
                            : 'bg-surface-container text-primary hover:bg-primary hover:text-on-primary'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[18px]">{isListening ? 'mic_off' : 'mic'}</span>
                      </button>
                    )}
                    <div className="flex flex-col gap-0">
                      <span className="text-[9px] font-bold text-secondary uppercase tracking-widest flex items-center gap-xs">
                        <span className="material-symbols-outlined text-[12px] text-success">verified_user</span> Secure Channel
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-md">
                    <button 
                      onClick={() => {
                        stop();
                        stopListening();
                        setAnswerText('');
                        setTimer(0);
                        if (isLastQuestion) {
                          endSession(0);
                          navigate(`/feedback/${sessionId}`);
                        } else {
                          nextQuestion();
                        }
                      }}
                      className="text-secondary font-label-bold text-label-sm uppercase tracking-widest hover:text-primary transition-colors px-md"
                    >
                      Skip
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={loading || !answerText.trim()}
                      className="bg-primary text-on-primary px-lg py-md rounded-pebble font-label-bold text-label-bold hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-sm"
                    >
                      {loading ? <span className="material-symbols-outlined animate-spin text-[16px]">sync</span> : <span className="material-symbols-outlined text-[16px]">gavel</span>}
                      {isLastQuestion ? 'Finalize' : 'Submit'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </motion.main>
    </motion.div>
  );
}
