import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { interviewAPI } from '../../api/client';
import { FeedbackReport } from '../../types';

export default function FeedbackPage() {
  const { id: sessionId } = useParams<{ id: string }>();
  const [feedback, setFeedback] = useState<FeedbackReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchFeedback() {
      if (!sessionId) return;
      try {
        const { data } = await interviewAPI.getFeedback(sessionId);
        setFeedback(data);
      } catch (err) {
        console.error('Failed to load feedback:', err);
        setError('Failed to load feedback. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    fetchFeedback();
  }, [sessionId]);

  const handleExport = () => {
    if (!feedback) return;
    const lines = [
      '═══ PREPMATE AI PERFORMANCE REPORT ═══',
      '',
      `Session ID: ${sessionId}`,
      `Overall Score: ${feedback.overallScore}/100`,
      `Status: ${feedback.overallScore >= 80 ? 'Excellent' : feedback.overallScore >= 60 ? 'Good' : 'Developing'}`,
      '',
      '── OVERALL ASSESSMENT ──',
      feedback.overallAssessment,
      '',
      '── STRENGTHS ──',
      ...(feedback.strengths || []).map((s, i) => `${i + 1}. ${s.title}: ${s.description}`),
      '',
      '── AREAS FOR GROWTH ──',
      ...(feedback.improvements || []).map((s, i) => `${i + 1}. ${s.title}: ${s.description}`),
      '',
      `Generated: ${new Date().toLocaleString()}`,
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prepmate-analysis-${sessionId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] animate-fade-in gap-lg">
        <span className="material-symbols-outlined text-[48px] text-primary animate-spin">sync</span>
        <div className="flex flex-col items-center gap-xs text-center">
          <h2 className="font-headline-md text-headline-md text-primary">Neural Synthesis</h2>
          <p className="font-body-md text-secondary">Generating high-fidelity performance metrics...</p>
        </div>
      </div>
    );
  }

  if (error || !feedback) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] text-center px-lg gap-lg">
        <div className="bg-error/10 text-error p-lg rounded-pebble border border-error/20">
          <p className="font-label-bold text-label-bold uppercase tracking-widest">{error || 'Data packet not found.'}</p>
        </div>
        <Link
          to="/dashboard"
          className="bg-primary text-on-primary px-xl py-lg rounded-pebble font-label-bold text-label-bold transition-all active:scale-95"
        >
          Return to Command
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full pb-xl animate-fade-in flex flex-col gap-xl">
      
      {/* Header */}
      <header className="flex flex-col gap-sm md:gap-md mb-lg md:mb-xl">
        <div className="flex items-center gap-sm">
          <div className="flex items-center gap-sm relative">
            <span className="w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_8px_rgba(var(--color-primary-rgb),0.4)]" />
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary">
              Session Complete
            </span>
            <div className="absolute -bottom-1 left-0 w-8 h-[1px] bg-gradient-to-r from-primary to-transparent opacity-40" />
          </div>
        </div>
        <h1 className="font-display text-display text-primary leading-none tracking-tighter">Session Results</h1>
        <p className="font-body-lg text-body-lg text-secondary">Here is a detailed breakdown of your interview performance.</p>
        <div className="flex gap-md">
          <button 
            onClick={handleExport}
            className="flex items-center gap-sm bg-surface-container-high text-primary px-lg py-md rounded-pebble font-label-bold text-label-bold transition-all hover:bg-surface-container-highest"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            Export Results
          </button>
          <Link
            to="/interview/setup"
            className="flex items-center gap-sm bg-primary text-on-primary px-lg py-md rounded-pebble font-label-bold text-label-bold transition-all active:scale-95 shadow-lg"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            New Practice
          </Link>
        </div>
      </header>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg items-start">
        
        {/* Left Column */}
        <div className="lg:col-span-8 flex flex-col gap-lg">
          
          {/* Summary Card */}
          <article className="bg-surface-container-low border border-outline-variant rounded-pebble p-lg md:p-xl lg:p-container-padding flex flex-col md:flex-row items-center gap-xl relative overflow-hidden">
            <div className="relative w-40 h-40 flex items-center justify-center shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <circle className="text-outline-variant" cx="18" cy="18" r="16" fill="none" stroke="currentColor" strokeWidth="2" />
                <circle 
                  className="text-primary transition-all duration-1500 ease-out" 
                  cx="18" cy="18" r="16" fill="none" stroke="currentColor" strokeWidth="2"
                  strokeDasharray={`${feedback.overallScore}, 100`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-display text-2xl font-bold text-primary">{feedback.overallScore}</span>
              </div>
            </div>

            <div className="flex-1 min-w-0 flex flex-col gap-md">
              <div className="flex flex-col gap-xs">
                <h3 className="font-headline-md text-headline-md text-primary">Overall Score</h3>
                <p className="font-body-md text-body-md text-secondary leading-relaxed">{feedback.overallAssessment}</p>
              </div>
              <div className="flex gap-md">
                <div className="flex items-center gap-sm relative">
                  <span className="w-1.5 h-1.5 bg-secondary rounded-full opacity-50" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-secondary">
                    Session Complete
                  </span>
                  <div className="absolute -bottom-1 left-0 w-8 h-[1px] bg-gradient-to-r from-secondary to-transparent opacity-20" />
                </div>
              </div>
            </div>
          </article>

          {/* Strengths & Weaknesses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
            {/* Strengths */}
            <article className="bg-surface-container-low border border-outline-variant rounded-pebble p-lg md:p-xl lg:p-container-padding flex flex-col gap-lg">
              <div className="flex justify-between items-start border-b border-outline-variant pb-md">
                <h3 className="font-headline-md text-headline-sm text-primary">Strengths</h3>
                <span className="material-symbols-outlined text-[24px] text-success">check_circle</span>
              </div>
              <div className="flex flex-col gap-lg">
                {feedback.strengths?.map((s, i) => (
                  <div key={i} className="flex flex-col gap-xs">
                    <h4 className="font-label-bold text-sm text-primary">{s.title}</h4>
                    <p className="text-body-sm text-secondary leading-relaxed">{s.description}</p>
                  </div>
                ))}
              </div>
            </article>

            {/* Growth */}
            <article className="bg-surface-container-low border border-outline-variant rounded-pebble p-lg md:p-xl lg:p-container-padding flex flex-col gap-lg">
              <div className="flex justify-between items-start border-b border-outline-variant pb-md">
                <h3 className="font-headline-md text-headline-sm text-primary">Growth</h3>
                <span className="material-symbols-outlined text-[24px] text-primary">track_changes</span>
              </div>
              <div className="flex flex-col gap-lg">
                {feedback.improvements?.map((s, i) => (
                  <div key={i} className="flex flex-col gap-xs">
                    <h4 className="font-label-bold text-sm text-primary">{s.title}</h4>
                    <p className="text-body-sm text-secondary leading-relaxed">{s.description}</p>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-4 flex flex-col gap-lg">
          
          {/* Intelligence Card */}
          <article className="bg-primary text-on-primary rounded-pebble p-lg md:p-xl lg:p-container-padding flex flex-col gap-lg shadow-lg">
            <span className="material-symbols-outlined text-[32px] opacity-50">verified_user</span>
            <h3 className="font-headline-md text-headline-md">Performance Summary</h3>
            <p className="font-body-md text-on-primary/80 leading-relaxed">
              Your answers showed good understanding and communication. Keep practicing to improve further.
            </p>
            <div className="flex flex-col gap-md pt-md border-t border-on-primary/10">
              {(feedback.vocalConfidenceData && feedback.vocalConfidenceData.length > 0
                ? feedback.vocalConfidenceData.slice(0, 2)
                : [{ label: 'Logic Depth', value: 0 }, { label: 'Tone Stability', value: 0 }]
              ).map((item, idx) => (
                <div key={idx} className="flex flex-col gap-xs">
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-on-primary/60">
                    <span>{item.label}</span>
                    <span>{item.value}%</span>
                  </div>
                  <div className="h-1 bg-on-primary/20 rounded-full">
                    <div className="h-full bg-on-primary rounded-full transition-all duration-1000" style={{ width: `${item.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </article>

          {/* Next Steps */}
          <article className="bg-surface-container-low border border-outline-variant rounded-pebble p-lg md:p-xl lg:p-container-padding flex flex-col gap-lg">
            <div className="flex items-center gap-md text-primary">
              <span className="material-symbols-outlined text-[24px]">lightbulb</span>
              <h3 className="font-headline-md text-headline-sm">What to Do Next</h3>
            </div>
            <div className="flex flex-col gap-sm">
              {feedback.recommendedActions?.map((action, i) => (
                <a
                  key={i}
                  href={action.link}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-surface-container-lowest border border-outline-variant p-md rounded-pebble flex items-center justify-between transition-all hover:border-primary group"
                >
                  <span className="font-label-bold text-sm text-primary">{action.title}</span>
                  <span className="material-symbols-outlined text-[18px] text-secondary group-hover:text-primary transition-transform group-hover:translate-x-1">arrow_forward</span>
                </a>
              ))}
            </div>
          </article>

        </div>
      </div>
    </div>
  );
}
