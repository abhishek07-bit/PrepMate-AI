import { Link } from 'react-router-dom';
import { PlusCircle, ArrowUp, Check, Target, Lightbulb, ArrowRight } from 'lucide-react';

export default function FeedbackPage() {
  return (
    <div className="max-w-max-width mx-auto w-full flex-1 flex flex-col gap-xl pb-xl">
      {/* Header Section */}
      <section className="mt-xl">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-lg mb-lg">
          <div>
            <p className="font-label-bold text-label-bold text-secondary mb-xs uppercase tracking-widest">Session Analysis</p>
            <h2 className="font-display text-display text-primary">Performance Feedback</h2>
          </div>
          <div className="flex gap-sm">
            <button className="bg-surface-container-lowest text-primary border border-outline-variant font-label-bold text-label-bold py-sm px-lg rounded-DEFAULT hover:border-primary transition-colors">
              Export Report
            </button>
            <Link
              to="/interview/setup"
              className="bg-primary text-on-primary font-label-bold text-label-bold py-sm px-lg rounded-DEFAULT hover:opacity-90 transition-opacity"
            >
              New Session
            </Link>
          </div>
        </div>
        <div className="w-full h-px bg-outline-variant" />
      </section>

      {/* Overall Score Pebble */}
      <section>
        <div className="bg-[var(--color-card-bg)] border border-[var(--color-card-border)] rounded-pebble p-[40px] flex flex-col md:flex-row items-center justify-between gap-xl relative overflow-hidden">
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-surface-container-lowest/40 rounded-full blur-3xl pointer-events-none" />
          <div className="flex-1">
            <h3 className="font-headline-lg text-headline-lg text-primary mb-md">Overall Assessment</h3>
            <p className="font-body-lg text-body-lg text-secondary max-w-2xl">
              Your responses demonstrated strong technical foundation, but exhibited moments of hesitation during complex problem-solving scenarios. Pacing was excellent.
            </p>
          </div>
          <div className="flex flex-col items-center justify-center shrink-0">
            <div className="relative w-32 h-32 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-outline-variant"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  className="text-primary"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeDasharray="82, 100"
                  strokeWidth="2"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-display text-[32px] font-bold text-primary leading-none">82</span>
                <span className="font-label-sm text-label-sm text-secondary">/ 100</span>
              </div>
            </div>
            <span className="font-label-bold text-label-bold text-primary mt-sm bg-surface-container-low px-md py-xs rounded-full">Proficient</span>
          </div>
        </div>
      </section>

      {/* Strengths & Improvements */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-lg">
        {/* Strengths */}
        <div className="bg-[var(--color-card-bg)] border border-[var(--color-card-border)] rounded-pebble p-[32px] flex flex-col h-full">
          <div className="flex items-center gap-sm mb-lg border-b border-[var(--color-card-border)] pb-md">
            <PlusCircle size={24} className="text-primary" strokeWidth={1.5} />
            <h4 className="font-headline-md text-headline-md text-primary">Strengths</h4>
          </div>
          <ul className="flex flex-col gap-md flex-1">
            {[
              { title: 'Technical Vocabulary', desc: 'Used precise industry terminology naturally throughout the system design portion.' },
              { title: 'Structure (STAR Method)', desc: 'Behavioral answers were perfectly structured, establishing context before diving into action.' },
              { title: 'Vocal Clarity', desc: 'Maintained an even, calm tone even when presented with curveball technical questions.' },
            ].map((item, i) => (
              <li key={item.title}>
                {i > 0 && <div className="w-full h-px bg-outline-variant mb-md" />}
                <div className="flex items-start gap-md">
                  <Check size={20} className="text-secondary mt-1" strokeWidth={1.5} />
                  <div>
                    <p className="font-label-bold text-label-bold text-primary">{item.title}</p>
                    <p className="font-body-md text-body-md text-secondary mt-xs">{item.desc}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Areas for Improvement */}
        <div className="bg-[var(--color-card-bg)] border border-[var(--color-card-border)] rounded-pebble p-[32px] flex flex-col h-full">
          <div className="flex items-center gap-sm mb-lg border-b border-[var(--color-card-border)] pb-md">
            <ArrowUp size={24} className="text-primary" strokeWidth={1.5} />
            <h4 className="font-headline-md text-headline-md text-primary">Areas to Refine</h4>
          </div>
          <ul className="flex flex-col gap-md flex-1">
            {[
              { title: 'Conciseness in Technical Explanations', desc: "Question 3's explanation drifted into tangential details. Keep focus on the primary architecture." },
              { title: 'Filler Words', desc: 'Detected 14 instances of "um" or "like" during the opening introduction. Pausing in silence is preferable.' },
              { title: 'Eye Contact Simulation', desc: 'Gaze drifted downward frequently when thinking. Practice looking directly at the camera lens.' },
            ].map((item, i) => (
              <li key={item.title}>
                {i > 0 && <div className="w-full h-px bg-outline-variant mb-md" />}
                <div className="flex items-start gap-md">
                  <Target size={20} className="text-secondary mt-1" strokeWidth={1.5} />
                  <div>
                    <p className="font-label-bold text-label-bold text-primary">{item.title}</p>
                    <p className="font-body-md text-body-md text-secondary mt-xs">{item.desc}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Confidence Chart & Follow Up */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
        {/* Chart Area */}
        <div className="lg:col-span-2 bg-[var(--color-card-bg-alt)] border border-[var(--color-card-border)] rounded-pebble p-[32px] flex flex-col">
          <div className="mb-lg">
            <h4 className="font-headline-md text-headline-md text-primary">Vocal Confidence Timeline</h4>
            <p className="font-body-md text-body-md text-secondary">Analyzed via volume stability, pace, and pitch variance.</p>
          </div>
          <div className="relative w-full h-[200px] mt-auto border-b border-l border-outline-variant flex items-end pt-md">
            <div className="absolute -left-8 top-0 h-full flex flex-col justify-between text-label-sm text-secondary py-2">
              <span>High</span>
              <span>Med</span>
              <span>Low</span>
            </div>
            <svg className="w-full h-full text-primary" preserveAspectRatio="none" viewBox="0 0 100 100">
              <path
                d="M0,50 C10,40 20,60 30,30 C40,10 50,20 60,40 C70,60 80,50 90,20 L100,10"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
              />
              <circle cx="30" cy="30" fill="currentColor" r="3" />
              <circle cx="60" cy="40" fill="currentColor" r="3" />
              <circle cx="90" cy="20" fill="currentColor" r="3" />
            </svg>
            <div className="absolute -bottom-8 left-0 w-full flex justify-between text-label-sm text-secondary">
              <span>Intro</span>
              <span>Technical Q1</span>
              <span>Behavioral</span>
              <span>System Design</span>
              <span>Closing</span>
            </div>
          </div>
        </div>

        {/* Follow Up Suggestions */}
        <div className="bg-primary text-on-primary rounded-pebble p-[32px] flex flex-col">
          <Lightbulb size={32} className="mb-md" strokeWidth={1.5} />
          <h4 className="font-headline-md text-headline-md mb-xs">Recommended Action</h4>
          <p className="font-body-md text-body-md text-outline-variant mb-xl">
            Based on your hesitation during the System Design question, we suggest reviewing the following concepts before your next mock interview.
          </p>
          <div className="flex flex-col gap-sm mt-auto">
            {['Microservices vs Monoliths', 'Database Sharding Strategies'].map((topic) => (
              <a
                key={topic}
                className="bg-inverse-surface hover:opacity-80 border border-outline-variant rounded-btn p-md flex items-center justify-between transition-colors group"
                href="#"
              >
                <span className="font-label-bold text-label-bold">{topic}</span>
                <ArrowRight size={20} className="text-secondary group-hover:text-on-primary transition-colors" strokeWidth={1.5} />
              </a>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
