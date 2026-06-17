import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '../../store/authStore';
import { useState } from 'react';

interface SignupFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export default function SignupPage() {
  const navigate = useNavigate();
  const { signUpWithEmail, signInWithGoogle, loading } = useAuthStore();
  const { register, handleSubmit, formState: { errors } } = useForm<SignupFormData>();
  const [error, setError] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);

  const onSubmit = async (data: SignupFormData) => {
    setError('');
    const result = await signUpWithEmail(data.email, data.password, data.firstName, data.lastName);
    if (result.error) {
      setError(result.error);
    } else {
      navigate('/dashboard');
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setGoogleLoading(true);
    const result = await signInWithGoogle();
    setGoogleLoading(false);
    if (result?.error) {
      setError(result.error);
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="flex-grow flex items-center justify-center px-lg py-xl animate-fade-in">
      <article className="bg-surface-container-low border border-outline-variant rounded-pebble p-lg md:p-xl lg:p-container-padding w-full max-w-[500px] flex flex-col gap-lg">
        
        {/* Header */}
        <div className="flex flex-col gap-xs border-b border-outline-variant pb-md">
          <h1 className="font-display text-headline-lg text-primary leading-none tracking-tighter">Create Account</h1>
          <p className="font-body-md text-body-md text-secondary">Create an account to start practicing.</p>
        </div>

        {error && (
          <div className="p-md rounded-pebble bg-error-container border border-error text-error font-label-bold text-label-sm text-center">
            {error}
          </div>
        )}

        {/* Google Sign Up */}
        <button
          onClick={handleGoogleSignIn}
          className="w-full bg-surface-container-highest border border-outline-variant rounded-pebble py-md font-label-bold text-label-bold text-primary flex items-center justify-center gap-md hover:bg-primary hover:text-on-primary transition-all active:scale-[0.98] disabled:opacity-50"
          type="button"
          disabled={loading || googleLoading}
        >
          {googleLoading ? (
            <span className="material-symbols-outlined animate-spin text-[18px]">sync</span>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="currentColor"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="currentColor"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="currentColor"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="currentColor"/>
            </svg>
          )}
          <span>{googleLoading ? 'Connecting...' : 'Continue with Google'}</span>
        </button>

        <div className="relative flex items-center">
          <div className="flex-1 h-px bg-outline-variant" />
          <span className="px-md font-label-bold text-[10px] text-secondary uppercase tracking-widest">or</span>
          <div className="flex-1 h-px bg-outline-variant" />
        </div>

        {/* Email Form */}
        <form className="flex flex-col gap-lg" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
            <div className="flex flex-col gap-xs">
              <label className="font-label-bold text-label-sm text-primary uppercase tracking-widest pl-1" htmlFor="firstName">First Name</label>
              <input
                {...register('firstName', { required: 'Required' })}
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-pebble py-md px-lg font-body-md text-body-md text-primary outline-none focus:border-primary transition-colors"
                id="firstName"
                placeholder="First name"
                type="text"
              />
            </div>
            <div className="flex flex-col gap-xs">
              <label className="font-label-bold text-label-sm text-primary uppercase tracking-widest pl-1" htmlFor="lastName">Last Name</label>
              <input
                {...register('lastName', { required: 'Required' })}
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-pebble py-md px-lg font-body-md text-body-md text-primary outline-none focus:border-primary transition-colors"
                id="lastName"
                placeholder="Last name"
                type="text"
              />
            </div>
          </div>

          <div className="flex flex-col gap-xs">
            <label className="font-label-bold text-label-sm text-primary uppercase tracking-widest pl-1" htmlFor="signupEmail">Email Address</label>
            <input
              {...register('email', { required: 'Email is required' })}
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-pebble py-md px-lg font-body-md text-body-md text-primary outline-none focus:border-primary transition-colors"
              id="signupEmail"
              placeholder="you@email.com"
              type="email"
              autoComplete="email"
            />
          </div>
          
          <div className="flex flex-col gap-xs">
            <label className="font-label-bold text-label-sm text-primary uppercase tracking-widest pl-1" htmlFor="signupPassword">Password</label>
            <input
              {...register('password', { required: 'Required', minLength: { value: 6, message: 'Min 6 characters' } })}
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-pebble py-md px-lg font-body-md text-body-md text-primary outline-none focus:border-primary transition-colors"
              id="signupPassword"
              placeholder="Minimum 6 characters"
              type="password"
              autoComplete="new-password"
            />
            {errors.password && <span className="text-error font-label-bold text-[10px] pl-1">{errors.password.message}</span>}
          </div>

          <button
            className="w-full bg-primary text-on-primary rounded-pebble py-lg font-label-bold text-label-bold hover:shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-sm mt-md"
            type="submit"
            disabled={loading || googleLoading}
          >
            {loading && !googleLoading ? <span className="material-symbols-outlined animate-spin text-[18px]">sync</span> : <span className="material-symbols-outlined text-[18px]">auto_awesome</span>}
            <span>Create Account</span>
          </button>
        </form>

        <div className="pt-md border-t border-outline-variant text-center">
          <p className="font-body-md text-secondary">
            Already have an account?{' '}
            <Link className="text-primary font-label-bold hover:underline inline-flex items-center gap-xs group" to="/login">
              Sign In <span className="material-symbols-outlined text-[14px] group-hover:translate-x-1 transition-transform">chevron_right</span>
            </Link>
          </p>
        </div>
      </article>
    </div>
  );
}
