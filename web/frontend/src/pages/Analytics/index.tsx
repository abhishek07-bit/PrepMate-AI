import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, Variants } from 'framer-motion';
import { useInterviewStore } from '../../store/interviewStore';
import { analyticsAPI } from '../../api/client';

interface WeaknessTopic {
  name: string;
  description: string;
  severity: number;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function AnalyticsPage() {
  const sessions = useInterviewStore((s) => s.sessions);
  const fetchSessions = useInterviewStore((s) => s.fetchSessions);
  const [weaknesses, setWeaknesses] = useState<WeaknessTopic[]>([]);

  useEffect(() => {
    fetchSessions();
    analyticsAPI.getWeaknesses()
      .then(({ data }) => {
        if (Array.isArray(data?.topics)) setWeaknesses(data.topics);
      })
      .catch(() => {});
  }, [fetchSessions]);

  const completedSessions = sessions.filter((s) => typeof s.score === 'number');
  const totalSessions = completedSessions.length;
  const avgScore = totalSessions > 0
    ? Math.round(completedSessions.reduce((sum, s) => sum + (s.score || 0), 0) / totalSessions)
    : 0;

  const totalDurationSeconds = completedSessions.reduce((sum, s) => sum + (s.duration || 0), 0);
  const formattedPracticeTime =
    totalDurationSeconds === 0
      ? '0m'
      : totalDurationSeconds < 60
        ? `${totalDurationSeconds}s`
        : `${Math.round(totalDurationSeconds / 60)}m`;

  // Calculate weekly trend
  const thisWeek = completedSessions.filter((s) => {
    const d = new Date(s.createdAt);
    const now = new Date();
    const diffDays = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays <= 7;
  });
  const lastWeek = completedSessions.filter((s) => {
    const d = new Date(s.createdAt);
    const now = new Date();
    const diffDays = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays > 7 && diffDays <= 14;
  });
  const thisWeekAvg = thisWeek.length > 0
    ? Math.round(thisWeek.reduce((sum, s) => sum + (s.score || 0), 0) / thisWeek.length)
    : 0;
  const lastWeekAvg = lastWeek.length > 0
    ? Math.round(lastWeek.reduce((sum, s) => sum + (s.score || 0), 0) / lastWeek.length)
    : 0;
  const trend = lastWeek.length > 0 ? thisWeekAvg - lastWeekAvg : 0;

  // Group completed sessions by topic
  const topicScores: Record<string, number[]> = {};
  completedSessions.forEach((s) => {
    const topic = s.role || 'General Simulation';
    if (!topicScores[topic]) topicScores[topic] = [];
    if (typeof s.score === 'number') topicScores[topic].push(s.score);
  });

  // Chronological oldest -> newest for the last 10 completed sessions
  const chartSessions = completedSessions.slice(0, 10).reverse();
  const getChartX = (idx: number) =>
    chartSessions.length <= 1 ? 500 : (idx / (chartSessions.length - 1)) * 1000;
  const getChartY = (score: number | null) =>
    200 - Math.max(0, Math.min(100, score ?? 0)) * 2;

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="w-full flex flex-col gap-xl pb-xl"
    >
      
      {/* Header */}
      <motion.header variants={itemVariants} className="flex flex-col gap-sm md:gap-md mb-lg md:mb-xl">
        <h1 className="font-display text-display text-primary leading-none tracking-tighter">Your Progress</h1>
        <p className="font-body-lg text-body-lg text-secondary">Track your interview practice progress and see how you are improving over time.</p>
      </motion.header>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-md">
        <motion.article variants={itemVariants} className="bg-surface-container-low border border-outline-variant rounded-pebble p-md flex flex-col gap-xs">
          <div className="flex items-center gap-sm text-secondary">
            <span className="material-symbols-outlined text-[14px]">monitor_heart</span>
            <h3 className="text-[10px] font-bold uppercase tracking-widest">Readiness</h3>
          </div>
          <div className="flex items-baseline gap-sm">
            <span className="font-display text-2xl md:text-3xl font-bold text-primary">{avgScore}%</span>
            {trend !== 0 && (
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${trend > 0 ? 'bg-success-container text-success' : 'bg-error-container text-error'}`}>
                {trend > 0 ? '↑' : '↓'}{Math.abs(trend)}%
              </span>
            )}
          </div>
        </motion.article>

        <motion.article variants={itemVariants} className="bg-surface-container-low border border-outline-variant rounded-pebble p-md flex flex-col gap-xs">
          <div className="flex items-center gap-sm text-secondary">
            <span className="material-symbols-outlined text-[14px]">bolt</span>
            <h3 className="text-[10px] font-bold uppercase tracking-widest">Operations</h3>
          </div>
          <span className="font-display text-2xl md:text-3xl font-bold text-primary">{totalSessions}</span>
        </motion.article>

        <motion.article variants={itemVariants} className="bg-surface-container-low border border-outline-variant rounded-pebble p-md flex flex-col gap-xs">
          <div className="flex items-center gap-sm text-secondary">
            <span className="material-symbols-outlined text-[14px]">schedule</span>
            <h3 className="text-[10px] font-bold uppercase tracking-widest">Practice Time</h3>
          </div>
          <span className="font-display text-2xl md:text-3xl font-bold text-primary">{formattedPracticeTime}</span>
        </motion.article>

        <motion.article variants={itemVariants} className="bg-surface-container-low border border-outline-variant rounded-pebble p-md flex flex-col gap-xs">
          <div className="flex items-center gap-sm text-secondary">
            <span className="material-symbols-outlined text-[14px]">verified_user</span>
            <h3 className="text-[10px] font-bold uppercase tracking-widest">Stability</h3>
          </div>
          <span className="font-display text-2xl md:text-3xl font-bold text-primary">
            {totalSessions > 2 
              ? (Math.abs(trend) < 10 ? 'High' : Math.abs(trend) < 20 ? 'Med' : 'Low')
              : 'N/A'}
          </span>
        </motion.article>
      </div>

      {/* Chart Section */}
      <motion.article variants={itemVariants} className="bg-surface-container-low border border-outline-variant rounded-pebble p-md md:p-xl lg:p-container-padding flex flex-col gap-lg md:gap-xl">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-xs">
            <h3 className="font-headline-sm md:text-headline-sm text-primary">Score Over Time</h3>
            <p className="text-[9px] md:text-[10px] font-bold text-secondary uppercase tracking-widest">Your Progress</p>
          </div>
          <div className="flex items-center gap-sm">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <span className="text-[9px] font-bold text-secondary uppercase tracking-widest">Your Scores</span>
          </div>
        </div>

        <div className="h-32 md:h-48 w-full">
          {chartSessions.length > 1 ? (
            <svg className="w-full h-full" viewBox="0 0 1000 200" preserveAspectRatio="none">
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.1" />
                  <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
                </linearGradient>
              </defs>
              {[0, 50, 100, 150, 200].map(y => (
                <line key={y} x1="0" y1={y} x2="1000" y2={y} stroke="var(--color-outline-variant)" strokeWidth="0.5" strokeDasharray="4,4" />
              ))}
              <path
                d={`M ${getChartX(0)} 200 ${chartSessions.map((s, i) => `L ${getChartX(i)} ${getChartY(s.score)}`).join(' ')} L ${getChartX(chartSessions.length - 1)} 200 Z`}
                fill="url(#chartGradient)"
              />
              <path
                d={chartSessions.map((s, i) => `${i === 0 ? 'M' : 'L'} ${getChartX(i)} ${getChartY(s.score)}`).join(' ')}
                fill="none"
                stroke="var(--color-primary)"
                strokeWidth="2"
              />
              {chartSessions.map((s, i) => (
                <circle
                  key={s.id}
                  cx={getChartX(i)}
                  cy={getChartY(s.score)}
                  r="3"
                  className="fill-surface stroke-primary stroke-2"
                />
              ))}
            </svg>
          ) : (
            <div className="h-full flex flex-col items-center justify-center border border-dashed border-outline-variant rounded-pebble gap-md text-secondary">
              <span className="material-symbols-outlined text-[32px] opacity-20">analytics</span>
              <p className="text-[10px] font-bold uppercase tracking-widest">Insufficient Data</p>
            </div>
          )}
        </div>
      </motion.article>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg items-start">
        
        {/* Topic Matrix */}
        <section className="lg:col-span-8 bg-surface-container-low border border-outline-variant rounded-pebble p-lg md:p-xl lg:p-container-padding flex flex-col gap-xl">
          <div className="flex items-center gap-md text-primary">
            <span className="material-symbols-outlined text-[24px]">track_changes</span>
            <h3 className="font-headline-sm text-headline-sm">Skills by Topic</h3>
          </div>
          
          {Object.keys(topicScores).length > 0 ? (
            <div className="flex flex-col gap-lg">
              {Object.entries(topicScores).map(([topic, scores]) => {
                const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
                return (
                  <div key={topic} className="flex flex-col gap-sm">
                    <div className="flex justify-between items-end">
                      <span className="font-label-bold text-sm text-primary">{topic}</span>
                      <span className="font-display text-lg font-bold text-primary">{avg}%</span>
                    </div>
                    <div className="w-full h-1 bg-surface-container-high rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-1000"
                        style={{ width: `${avg}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-xl text-center gap-lg">
              <div className="w-16 h-16 rounded-full bg-surface border border-outline-variant flex items-center justify-center text-secondary opacity-30">
                <span className="material-symbols-outlined text-[24px]">info</span>
              </div>
              <p className="font-body-md text-secondary max-w-xs">Engage in training to generate intelligence data.</p>
              <Link to="/interview/setup" className="bg-primary text-on-primary font-label-bold text-label-bold px-lg py-md rounded-pebble transition-all active:scale-95">
                Begin Simulation
              </Link>
            </div>
          )}
        </section>

        {/* History List */}
        <aside className="lg:col-span-4 flex flex-col gap-lg">
          <div className="flex items-center gap-md text-primary">
            <span className="material-symbols-outlined text-[20px]">history</span>
            <h3 className="font-headline-sm text-headline-sm">Operations</h3>
          </div>
          
          <div className="flex flex-col gap-sm">
            {completedSessions.length > 0 ? (
              completedSessions.slice(0, 8).map((s) => (
                <Link key={s.id} to={`/feedback/${s.id}`} className="bg-surface-container-low border border-outline-variant rounded-pebble p-md flex items-center justify-between transition-all hover:border-primary group">
                  <div className="min-w-0 flex-1">
                    <h4 className="font-label-bold text-[10px] text-primary truncate uppercase tracking-widest">{s.role}</h4>
                    <p className="text-[9px] text-secondary font-bold">{new Date(s.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-md">
                    <span className="font-display text-lg font-bold text-primary">{s.score ?? 0}%</span>
                    <span className="material-symbols-outlined text-[16px] text-secondary group-hover:text-primary transition-transform group-hover:translate-x-1">arrow_forward</span>
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-[10px] text-secondary text-center py-lg uppercase font-bold tracking-widest">No records found</p>
            )}
          </div>

          {weaknesses.length > 0 && weaknesses[0].name !== 'No Data Yet' && (
            <article className="bg-surface-container-low border border-outline-variant rounded-pebble p-lg flex flex-col gap-sm">
              <h4 className="font-label-bold text-[10px] text-secondary uppercase tracking-widest">Focus Areas</h4>
              {weaknesses.map((w, idx) => (
                <div key={idx} className="flex flex-col gap-xs border-t border-outline-variant pt-sm first:border-t-0 first:pt-0">
                  <span className="font-label-bold text-xs text-primary">{w.name}</span>
                  <p className="text-xs text-secondary">{w.description}</p>
                </div>
              ))}
            </article>
          )}
          
          {sessions.length > 0 && (
            <article className="bg-primary text-on-primary rounded-pebble p-lg md:p-xl lg:p-container-padding flex flex-col gap-md shadow-lg">
              <span className="material-symbols-outlined text-[32px] opacity-30">verified_user</span>
              <h4 className="font-headline-sm text-headline-sm">Keep Practicing</h4>
              <p className="text-[11px] text-on-primary/70 leading-relaxed">
                Consistency is key. Complete 10 practice sessions to unlock more detailed analytics.
              </p>
            </article>
          )}
        </aside>

      </div>
    </motion.div>
  );
}
