import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, Variants } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';
import { useInterviewStore } from '../../store/interviewStore';
import NeuralLoader from '../../components/common/NeuralLoader';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const { sessions, fetchSessions, loading } = useInterviewStore();

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const firstName = user?.firstName || 'there';
  const totalSessions = sessions.length;
  const avgScore = totalSessions > 0
    ? Math.round(sessions.reduce((sum, s) => sum + (s.score || 0), 0) / totalSessions)
    : 0;

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="w-full flex flex-col gap-lg md:gap-xl"
    >
      {/* Breadcrumb + Greeting */}
      <motion.section variants={itemVariants} className="flex flex-col gap-xs">
        <div className="flex items-center gap-xs mb-xs">
          <Link to="/" className="flex items-center gap-xs text-[11px] font-label-bold text-secondary hover:text-primary transition-colors uppercase tracking-widest">
            <span className="material-symbols-outlined text-[14px]">home</span>
            Home
          </Link>
          <span className="material-symbols-outlined text-[14px] text-secondary">chevron_right</span>
          <span className="text-[11px] font-label-bold text-primary uppercase tracking-widest">Dashboard</span>
        </div>
        <h1 className="font-display text-headline-lg md:text-display text-primary leading-none tracking-tighter">Welcome back, {firstName}</h1>
        <p className="font-body-md md:text-body-lg text-secondary">Here is an overview of your interview preparation progress and recent activity.</p>
      </motion.section>

      {/* Main Stacked Pebble Cards */}
      <div className="flex flex-col gap-sm md:gap-md">
        
        {/* Readiness Score Pebble */}
        <motion.article variants={itemVariants} className="bg-surface-container-low border border-outline-variant rounded-pebble p-lg md:p-lg md:p-xl lg:p-container-padding flex flex-col gap-md md:gap-lg group hover:border-primary transition-colors min-h-[220px] md:min-h-[280px]">
          <div className="flex justify-between items-start">
            <h2 className="font-headline-sm md:text-headline-md text-primary">Your Overall Score</h2>
            <span className="material-symbols-outlined text-[20px] md:text-[24px] text-secondary group-hover:text-primary transition-colors">trending_up</span>
          </div>
          <div className="flex items-end gap-sm">
            <span className="font-display text-[56px] md:text-[72px] text-primary font-bold tracking-tighter leading-none">{loading ? '—' : avgScore}</span>
            <span className="font-headline-sm md:text-headline-md text-secondary leading-none pb-1 md:pb-2">%</span>
          </div>
          <p className="font-body-sm md:text-body-md text-secondary leading-relaxed">
            This is your average score across all your practice sessions. Based on your last {totalSessions} practice interviews, you are performing at an {avgScore >= 80 ? 'excellent' : avgScore >= 60 ? 'good' : 'developing'} level.
          </p>
        </motion.article>

        {/* Action Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-sm md:gap-md">
          <motion.div variants={itemVariants}>
            <Link to="/interview/setup" className="h-full bg-primary text-on-primary rounded-pebble p-lg md:p-lg md:p-xl lg:p-container-padding flex flex-col gap-md md:gap-lg group active:scale-[0.98] transition-transform">
              <div className="flex justify-between items-start">
                <div className="flex flex-col gap-xs">
                  <span className="font-label-bold text-label-sm text-on-primary/60 uppercase tracking-widest">Quick Start</span>
                  <h2 className="font-headline-sm md:text-headline-md">Practice Interview</h2>
                </div>
                <span className="material-symbols-outlined text-[20px] md:text-[24px] opacity-60">track_changes</span>
              </div>
              <p className="font-body-sm md:text-body-md opacity-80 flex-grow">Start a new practice session with realistic interview questions tailored to your target role and company.</p>
              <button className="mt-sm w-full bg-surface-container-lowest text-primary font-label-bold text-label-bold py-sm md:py-md px-lg rounded-pebble flex items-center justify-center gap-sm transition-all group-hover:shadow-lg">
                <span>Start Practice</span>
                <span className="material-symbols-outlined text-[16px] md:text-[18px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </button>
            </Link>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Link to="/resume" className="h-full bg-surface-container-low border border-outline-variant rounded-pebble p-lg md:p-lg md:p-xl lg:p-container-padding flex flex-col gap-md md:gap-lg group hover:border-primary transition-all active:scale-[0.98]">
              <div className="flex justify-between items-start">
                <div className="flex flex-col gap-xs">
                  <span className="font-label-bold text-label-sm text-secondary uppercase tracking-widest">Tools</span>
                  <h2 className="font-headline-sm md:text-headline-md text-primary">Resume Review</h2>
                </div>
                <span className="material-symbols-outlined text-[20px] md:text-[24px] text-secondary group-hover:text-primary transition-colors">history</span>
              </div>
              <p className="font-body-sm md:text-body-md text-secondary flex-grow">Upload your resume to get detailed feedback on how to improve it for your job applications.</p>
              <button className="mt-sm w-full bg-surface-container-lowest text-primary font-label-bold text-label-bold py-sm md:py-md px-lg rounded-pebble flex items-center justify-center gap-sm border border-outline-variant transition-all group-hover:bg-primary group-hover:text-on-primary">
                <span>Upload Resume</span>
                <span className="material-symbols-outlined text-[16px] md:text-[18px] group-hover:translate-x-1 transition-transform">chevron_right</span>
              </button>
            </Link>
          </motion.div>
        </div>

        {/* History Section */}
        <motion.section variants={itemVariants} className="mt-md md:mt-lg">
          <div className="flex items-center justify-between border-b border-outline-variant pb-sm md:pb-md mb-md md:mb-lg">
            <h2 className="font-headline-sm md:text-headline-md text-primary">Recent Operations</h2>
            <Link to="/analytics" className="font-label-bold text-[10px] text-secondary hover:text-primary uppercase tracking-widest transition-colors">View All</Link>
          </div>

          {loading ? (
            <div className="py-lg md:py-xl">
              <NeuralLoader message="Synchronizing Profile..." />
            </div>
          ) : totalSessions === 0 ? (
            <div className="py-12 md:py-24 text-center border-2 border-dashed border-outline-variant rounded-pebble">
              <p className="font-body-sm md:text-body-md text-secondary">No historical data found in your neural profile.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-sm md:gap-md">
              {sessions.slice(0, 3).map((session) => (
                <Link key={session.id} to={`/feedback/${session.id}`} className="bg-surface-container-low border border-outline-variant rounded-pebble p-md md:p-lg hover:border-primary transition-all active:scale-[0.98]">
                  <div className="flex justify-between items-start mb-sm md:mb-lg">
                    <div className="p-2 rounded-pebble bg-surface-container-lowest border border-outline-variant text-primary">
                      <span className="material-symbols-outlined text-[12px] text-success">verified_user</span>
                    </div>
                    <span className="font-display text-[24px] md:text-[28px] tracking-tighter font-bold text-primary leading-none">{session.score}%</span>
                  </div>
                  <h4 className="font-label-bold text-label-sm md:text-sm text-primary mb-1 truncate">{session.role}</h4>
                  <p className="font-label-bold text-[9px] md:text-[10px] text-secondary uppercase tracking-widest truncate">{session.company}</p>
                </Link>
              ))}
            </div>
          )}
        </motion.section>
      </div>
    </motion.div>
  );
}
