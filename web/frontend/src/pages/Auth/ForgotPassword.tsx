import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const sendPasswordReset = useAuthStore((s) => s.sendPasswordReset);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    
    setLoading(true);
    const { error: resetError } = await sendPasswordReset(email);
    setLoading(false);

    if (resetError) {
      setError(resetError);
    } else {
      setSubmitted(true);
    }
  };

  return (
    <div className="flex-grow flex items-center justify-center px-lg py-xl animate-fade-in">
      <article className="bg-surface-container-low border border-outline-variant rounded-pebble p-lg md:p-xl lg:p-container-padding w-full max-w-[440px] flex flex-col gap-lg">
        
        <div className="flex flex-col gap-xs border-b border-outline-variant pb-md">
          <h1 className="font-display text-headline-lg text-primary leading-none tracking-tighter">Reset Password</h1>
          <p className="font-body-md text-body-md text-secondary">Enter your email and we will send you a password reset link.</p>
        </div>

        {submitted ? (
          <div className="flex flex-col gap-lg items-center text-center py-lg">
            <div className="w-16 h-16 rounded-full bg-success/10 text-success flex items-center justify-center">
              <span className="material-symbols-outlined text-[32px]">mail</span>
            </div>
            <div className="flex flex-col gap-xs">
              <h2 className="font-headline-md text-headline-md text-primary">Instructions Sent</h2>
              <p className="font-body-md text-body-md text-secondary">Check your inbox for a password reset link. If it does not arrive within a few minutes, check your spam folder.</p>
            </div>
            <Link to="/login" className="bg-primary text-on-primary px-xl py-md rounded-pebble font-label-bold text-label-bold transition-all active:scale-95">
              Return to Sign In
            </Link>
          </div>
        ) : (
          <form className="flex flex-col gap-lg" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-xs">
              <label className="font-label-bold text-label-sm text-primary uppercase tracking-widest pl-1" htmlFor="resetEmail">Email</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-pebble py-md px-lg font-body-md text-body-md text-primary outline-none focus:border-primary transition-colors"
                id="resetEmail"
                placeholder="you@email.com"
                type="email"
                disabled={loading}
              />
              {error && <span className="text-error font-label-bold text-[10px] pl-1">{error}</span>}
            </div>

            <button
              className="w-full bg-primary text-on-primary rounded-pebble py-lg font-label-bold text-label-bold hover:shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-sm disabled:opacity-50 disabled:active:scale-100"
              type="submit"
              disabled={loading}
            >
              <span className="material-symbols-outlined text-[18px]">
                {loading ? 'hourglass_empty' : 'send'}
              </span>
              <span>{loading ? 'Sending...' : 'Send Reset Link'}</span>
            </button>

            <div className="text-center">
              <Link to="/login" className="text-[12px] font-label-bold text-secondary hover:text-primary transition-colors uppercase tracking-widest">Back to Sign In</Link>
            </div>
          </form>
        )}
      </article>
    </div>
  );
}
