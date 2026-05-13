import { Brain, Code, Globe, Clock, Play, ArrowRight, Target } from 'lucide-react';

export default function CompanyPrepPage() {
  return (
    <>
      {/* Hero Section */}
      <header className="mb-[80px] mt-[40px]">
        <div className="inline-flex items-center gap-sm px-4 py-2 bg-surface-container-low border border-outline-variant rounded-full mb-lg">
          <Target size={16} className="text-secondary" strokeWidth={1.5} />
          <span className="font-label-bold text-label-bold text-secondary uppercase tracking-wider text-[11px]">Target Path Active</span>
        </div>
        <h1 className="font-display text-display text-primary mb-md">Google Preparation Path</h1>
        <p className="font-body-lg text-body-lg text-secondary max-w-2xl">
          A calibrated curriculum designed specifically for the rigid demands of Mountain View. Focus shifts heavily toward algorithmic efficiency at scale, systemic design thinking, and demonstrable 'Googliness' under pressure.
        </p>
      </header>

      {/* Bento Grid: Core Philosophy */}
      <section className="grid grid-cols-1 md:grid-cols-12 gap-lg mb-[120px]">
        {[
          { icon: Brain, title: 'Typical Behavioral Patterns', desc: 'Expect rigorous probing into your navigation of ambiguity. Questions will demand strict adherence to the STAR method, focusing heavily on cross-functional conflict resolution and leadership without authority.' },
          { icon: Code, title: 'Coding Style Preferences', desc: 'Brute force is unacceptable. Optimal Big O complexity is the baseline. You must demonstrate exhaustive edge-case identification and defensively structure your logic before writing a single line.' },
          { icon: Globe, title: 'Culture Fit', desc: 'Intellectual humility is paramount. You are expected to exhibit a bias for action while simultaneously maintaining an unwavering focus on scaling solutions for a global user base.' },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className="md:col-span-4 bg-surface-container-low border border-outline-variant rounded-pebble p-xl flex flex-col justify-between h-full group hover:border-primary transition-colors duration-300">
              <div>
                <div className="w-12 h-12 rounded-full border border-outline-variant bg-surface flex items-center justify-center mb-lg">
                  <Icon size={24} className="text-primary" strokeWidth={1.5} />
                </div>
                <h3 className="font-headline-md text-headline-md text-primary mb-sm">{card.title}</h3>
                <p className="font-body-md text-body-md text-secondary">{card.desc}</p>
              </div>
            </div>
          );
        })}
      </section>

      {/* Question Bank */}
      <section>
        <div className="flex items-end justify-between mb-lg">
          <h2 className="font-headline-lg text-headline-lg text-primary">Targeted Scenarios</h2>
          <button className="font-label-bold text-label-bold text-primary flex items-center gap-xs hover:text-secondary transition-colors">
            View All <ArrowRight size={18} strokeWidth={1.5} />
          </button>
        </div>
        <div className="flex flex-col gap-md">
          {[
            { category: 'System Design', time: '45 mins', title: 'Design a globally distributed rate limiter for a public API.', desc: 'Focus on synchronization strategies across data centers and latency minimization.' },
            { category: 'Algorithms', time: '20 mins', title: 'Find the longest valid obstacle course at each position.', desc: 'Requires dynamic programming or segment tree optimizations to achieve O(N log N).' },
            { category: 'Behavioral', time: '15 mins', title: 'Tell me about a time you had to pivot a major project due to a lack of data.', desc: 'Assess framing of ambiguity, risk assessment, and eventual decision validation.' },
          ].map((question) => (
            <div key={question.title} className="bg-surface border border-outline-variant rounded-pebble p-lg flex flex-col md:flex-row md:items-center justify-between gap-lg hover:border-primary transition-all duration-200 cursor-pointer">
              <div className="flex-1">
                <div className="flex items-center gap-sm mb-sm">
                  <span className="px-3 py-1 bg-surface-container-high rounded-full font-label-sm text-label-sm text-primary border border-outline-variant">
                    {question.category}
                  </span>
                  <span className="font-label-sm text-label-sm text-secondary flex items-center gap-xs">
                    <Clock size={14} strokeWidth={1.5} /> {question.time}
                  </span>
                </div>
                <h4 className="font-headline-md text-[20px] text-primary mb-xs">{question.title}</h4>
                <p className="font-body-md text-body-md text-secondary line-clamp-1">{question.desc}</p>
              </div>
              <div className="shrink-0 flex items-center gap-md">
                <div className="h-10 w-10 rounded-full border border-outline-variant flex items-center justify-center text-primary hover:bg-primary hover:text-on-primary transition-colors">
                  <Play size={20} strokeWidth={1.5} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
