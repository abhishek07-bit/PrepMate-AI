import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Timer, Brain, Mic, ArrowRight, Loader2 } from 'lucide-react';
import ProgressBar from '../../components/common/ProgressBar';
import { useInterviewStore } from '../../store/interviewStore';
import { interviewAPI } from '../../api/client';

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

  const [confidence, setConfidence] = useState<'low' | 'medium' | 'high'>('medium');
  const [answerText, setAnswerText] = useState('');
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  useEffect(() => {
    if (!sessionId || questions.length === 0) {
      navigate('/interview/setup');
    }
  }, [sessionId, questions, navigate]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [currentQuestionIndex]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = useCallback(async () => {
    if (!currentQuestion || !answerText.trim()) return;

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

      if (isLastQuestion) {
        // Calculate total score or let backend do it
        endSession(85); // placeholder score
        navigate(`/feedback/${sessionId}`);
      } else {
        setAnswerText('');
        setTimer(0);
        nextQuestion();
      }
    } catch (error) {
      console.error('Failed to submit answer:', error);
      // Fallback
      if (isLastQuestion) {
        navigate(`/feedback/${sessionId}`);
      } else {
        nextQuestion();
      }
    } finally {
      setLoading(false);
    }
  }, [currentQuestion, answerText, confidence, timer, addAnswer, isLastQuestion, nextQuestion, navigate, sessionId, endSession]);

  if (!currentQuestion) return null;

  return (
    <main className="flex-1 flex flex-col max-w-max-width mx-auto w-full px-container-padding relative h-screen">
      {/* Top: Minimal Timer & Progress */}
      <header className="w-full pt-xl max-w-4xl mx-auto flex flex-col gap-sm">
        <div className="flex justify-between items-end font-label-sm text-label-sm text-secondary uppercase tracking-widest">
          <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
          <span className="flex items-center gap-xs">
            <Timer size={16} strokeWidth={1.5} />
            {formatTime(timer)}
          </span>
        </div>
        <ProgressBar value={((currentQuestionIndex + 1) / questions.length) * 100} height="2px" />
      </header>

      {/* Center: The Interview Question */}
      <section className="flex-1 flex flex-col justify-center items-center text-center max-w-3xl mx-auto w-full px-lg my-xl">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-surface-container-low border border-outline-variant font-label-sm text-label-sm text-secondary mb-xl">
          <Brain size={16} strokeWidth={1.5} />
          {currentQuestion.category || 'General'}
        </div>
        <h1 className="font-display text-display text-on-background max-w-2xl">
          {currentQuestion.text}
        </h1>
        {currentQuestion.subPrompt && (
          <p className="font-body-lg text-body-lg text-secondary mt-lg max-w-xl">
            {currentQuestion.subPrompt}
          </p>
        )}
      </section>

      {/* Bottom: Interaction Area */}
      <section className="w-full max-w-4xl mx-auto pb-xl flex flex-col gap-xl">
        {/* Confidence Selector */}
        <div className="flex flex-col items-center gap-md">
          <span className="font-label-sm text-label-sm text-secondary uppercase tracking-widest">Pre-Answer Confidence</span>
          <div className="flex gap-md">
            {(['low', 'medium', 'high'] as const).map((level) => (
              <button
                key={level}
                onClick={() => setConfidence(level)}
                className={
                  confidence === level
                    ? 'px-6 py-3 rounded-full bg-primary text-on-primary font-label-bold text-label-bold border border-primary'
                    : 'px-6 py-3 rounded-full border border-outline-variant bg-surface-container-lowest text-on-surface font-label-bold text-label-bold hover:bg-surface-container-low transition-colors'
                }
              >
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Answer Input */}
        <div className="relative w-full rounded-[32px] border border-outline-variant bg-surface-container-low p-container-padding flex flex-col gap-md">
          <textarea
            className="w-full h-32 bg-transparent border-none outline-none resize-none font-body-lg text-body-lg text-on-surface placeholder:text-outline focus:ring-0 p-0"
            placeholder="Start speaking, or type your response here..."
            value={answerText}
            onChange={(e) => setAnswerText(e.target.value)}
          />
          <div className="flex justify-between items-center mt-md pt-md border-t border-outline-variant/50">
            {/* Speaking Indicator */}
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-error-container text-on-error-container animate-pulse">
                <Mic size={20} strokeWidth={2} />
              </div>
              <span className="font-label-bold text-label-bold text-on-surface-variant">Listening...</span>
              {/* Audio Waveform */}
              <div className="flex items-end gap-1 h-4 ml-2">
                <div className="w-1 bg-on-surface-variant rounded-full h-full animate-pulse" />
                <div className="w-1 bg-on-surface-variant rounded-full h-2/3 animate-pulse" style={{ animationDelay: '0.2s' }} />
                <div className="w-1 bg-on-surface-variant rounded-full h-4/5 animate-pulse" style={{ animationDelay: '0.4s' }} />
                <div className="w-1 bg-on-surface-variant rounded-full h-1/2 animate-pulse" style={{ animationDelay: '0.1s' }} />
              </div>
            </div>
            {/* Actions */}
            <div className="flex items-center gap-md">
              <button 
                onClick={() => nextQuestion()}
                className="px-6 py-3 rounded-full bg-transparent text-primary font-label-bold text-label-bold hover:bg-surface-container-high transition-colors"
              >
                Skip
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || !answerText.trim()}
                className="px-8 py-3 rounded-full bg-primary text-on-primary font-label-bold text-label-bold flex items-center gap-2 hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : null}
                {isLastQuestion ? 'Finish Interview' : 'Next Question'}
                {!loading && <ArrowRight size={18} strokeWidth={1.5} />}
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
