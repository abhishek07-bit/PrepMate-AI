import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

export default function LandingPage() {
  const { user } = useAuthStore();

  return (
    <div className="bg-background text-on-background antialiased min-h-screen flex flex-col">
      <main className="flex-grow flex flex-col pt-[var(--spacing-navbar-h)]">
        {/* Hero Section */}
        <section className="w-full max-w-max-width mx-auto px-lg md:px-xl lg:px-2xl py-16 md:py-24 lg:py-[120px] flex flex-col items-center justify-center text-center">
          <div className="inline-flex items-center gap-md mb-xl group cursor-default">
            <div className="flex items-center gap-sm relative">
              <div className="absolute -inset-x-6 -inset-y-3 bg-primary/5 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <span className="w-2 h-2 bg-primary rounded-full animate-pulse shadow-[0_0_12px_rgba(var(--color-primary-rgb),0.4)]" />
              <span className="font-label-sm text-label-sm text-primary uppercase tracking-[0.3em] font-bold transition-all duration-300 group-hover:tracking-[0.35em]">Interview Preparation Platform</span>
              <div className="absolute -bottom-2 left-0 w-12 h-[1px] bg-gradient-to-r from-primary to-transparent opacity-50" />
            </div>
          </div>
          <h1 className="font-display text-[36px] sm:text-[48px] md:text-[64px] lg:text-[80px] text-primary max-w-4xl mb-lg leading-none tracking-tighter">
            Practice Makes Perfect. Get Ready for Your Next Interview.
          </h1>
          <p className="font-body-lg text-body-lg text-secondary max-w-2xl mb-xl">
            A simple and effective way to prepare for job interviews. Upload your resume, pick your target company and role, and practice with realistic interview questions tailored to your experience.
          </p>
          <div className="flex gap-md flex-wrap justify-center">
            {user ? (
              <Link
                to="/dashboard"
                className="bg-primary text-on-primary font-label-bold text-label-bold px-xl py-md rounded-pebble hover:opacity-90 transition-all duration-300 flex items-center gap-sm"
              >
                Go to Dashboard <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </Link>
            ) : (
              <>
                <Link
                  to="/signup"
                  className="bg-primary text-on-primary font-label-bold text-label-bold px-xl py-md rounded-pebble hover:opacity-90 transition-all duration-300 flex items-center gap-sm"
                >
                  Get Started Free <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </Link>
                <Link
                  to="/login"
                  className="bg-surface-container-lowest text-primary border border-outline-variant font-label-bold text-label-bold px-xl py-md rounded-pebble hover:bg-surface-container-low transition-all duration-300"
                >
                  Sign In
                </Link>
              </>
            )}
          </div>
        </section>

        {/* How It Works */}
        <section className="w-full max-w-max-width mx-auto px-lg md:px-xl lg:px-2xl py-12 md:py-16 lg:py-[80px]">
          <h2 className="font-headline-lg text-[28px] md:text-[36px] lg:text-[40px] text-primary text-center mb-xl tracking-tighter">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
            {[
              { icon: 'upload_file', step: '01', title: 'Upload Your Resume', desc: 'Upload your resume and our system will analyze your skills, work experience, and strengths to create personalized interview questions just for you.' },
              { icon: 'track_changes', step: '02', title: 'Practice Interviews', desc: 'Select the job role and company you are applying for. You will get realistic interview questions that match what you will face in real interviews.' },
              { icon: 'electric_bolt', step: '03', title: 'Get Detailed Feedback', desc: 'After each practice session, you will receive a score, analysis of your strengths and weaknesses, and specific suggestions on how to improve your answers.' },
            ].map((card) => {
              return (
                <div key={card.title} className="bg-surface-container-low border border-outline-variant rounded-pebble p-lg md:p-xl lg:p-container-padding flex flex-col group hover:border-primary transition-all duration-300">
                  <div className="w-12 h-12 rounded-pebble bg-surface-container-lowest border border-outline-variant text-primary flex items-center justify-center mb-lg">
                    <span className="material-symbols-outlined text-[24px]">{card.icon}</span>
                  </div>
                  <span className="font-label-sm text-label-sm text-secondary uppercase tracking-widest mb-sm">Step {card.step}</span>
                  <h3 className="font-headline-md text-headline-md text-primary mb-md">{card.title}</h3>
                  <p className="font-body-md text-body-md text-secondary flex-grow">{card.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Features */}
        <section className="w-full bg-surface-container-low py-16 md:py-24 lg:py-[120px] border-y border-outline-variant">
          <div className="max-w-max-width mx-auto px-lg md:px-xl lg:px-2xl">
            <h2 className="font-headline-lg text-[28px] md:text-[36px] lg:text-[40px] text-primary text-center mb-xl tracking-tighter">Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-xl max-w-4xl mx-auto">
              {[
                { title: 'Personalized Questions Based on Your Resume', desc: 'The system reads your resume and creates interview questions that are specific to your experience, skills, and the type of jobs you are applying for.' },
                { title: 'Real-Time Feedback and Scoring', desc: 'Each of your answers is evaluated on clarity, depth, structure, and relevance. You get specific feedback on what you did well and how to improve.' },
                { title: 'Practice for Any Company and Role', desc: 'Whether you are applying to a big tech company or a startup, you can practice with questions tailored to that company and the specific role you want.' },
                { title: 'Track Your Progress Over Time', desc: 'Keep track of all your practice sessions, see your scores improve, and identify areas where you need more work. Your progress history helps you prepare more effectively.' },
              ].map((feature) => (
                <div key={feature.title} className="flex gap-md items-start">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 shrink-0" />
                  <div className="flex flex-col gap-xs">
                    <h3 className="font-label-bold text-sm text-primary mb-xs">{feature.title}</h3>
                    <p className="font-body-md text-body-md text-secondary">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="w-full bg-primary text-on-primary py-16 md:py-24 lg:py-[120px] px-lg md:px-xl lg:px-2xl text-center">
          <div className="max-w-3xl mx-auto flex flex-col items-center">
            <h2 className="font-display text-[32px] sm:text-[40px] md:text-[56px] mb-lg tracking-tighter leading-none">Start Practicing Today</h2>
            <p className="font-body-lg text-body-lg text-outline-variant mb-xl max-w-xl">
              Practice interviews are the best way to prepare. Start now and feel more confident for your next job interview.
            </p>
            <Link
              to="/signup"
              className="bg-surface-container-lowest text-primary font-label-bold text-label-bold px-xl py-lg rounded-pebble hover:bg-surface-container-low transition-colors duration-300 flex items-center gap-sm"
            >
              Get Started Free <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
