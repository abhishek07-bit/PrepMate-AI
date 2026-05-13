import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Timer, Brain, Mic, ArrowRight } from 'lucide-react';
import ProgressBar from '../../components/common/ProgressBar';

export default function MockInterviewPage() {
  const [confidence, setConfidence] = useState<'low' | 'medium' | 'high'>('medium');
  const navigate = useNavigate();

  return (
    <main className="flex-1 flex flex-col max-w-max-width mx-auto w-full px-container-padding relative h-screen">
      {/* Top: Minimal Timer & Progress */}
      <header className="w-full pt-xl max-w-4xl mx-auto flex flex-col gap-sm">
        <div className="flex justify-between items-end font-label-sm text-label-sm text-secondary uppercase tracking-widest">
          <span>Question 3 of 10</span>
          <span className="flex items-center gap-xs">
            <Timer size={16} strokeWidth={1.5} />
            04:12
          </span>
        </div>
        <ProgressBar value={30} height="2px" />
      </header>

      {/* Center: The Interview Question */}
      <section className="flex-1 flex flex-col justify-center items-center text-center max-w-3xl mx-auto w-full px-lg my-xl">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-surface-container-low border border-outline-variant font-label-sm text-label-sm text-secondary mb-xl">
          <Brain size={16} strokeWidth={1.5} />
          Behavioral
        </div>
        <h1 className="font-display text-display text-on-background max-w-2xl">
          Describe a time when you had to manage a complex project with competing priorities.
        </h1>
        <p className="font-body-lg text-body-lg text-secondary mt-lg max-w-xl">
          Walk me through your framework for prioritization and how you communicated trade-offs to stakeholders.
        </p>
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
              <button className="px-6 py-3 rounded-full bg-transparent text-primary font-label-bold text-label-bold hover:bg-surface-container-high transition-colors">
                Skip
              </button>
              <button
                onClick={() => navigate('/feedback/1')}
                className="px-8 py-3 rounded-full bg-primary text-on-primary font-label-bold text-label-bold flex items-center gap-2 hover:opacity-90 transition-opacity"
              >
                Finish Answer
                <ArrowRight size={18} strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
