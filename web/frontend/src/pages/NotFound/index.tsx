import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

export default function NotFoundPage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return (
    <div className="flex-grow flex items-center justify-center px-lg py-xl animate-fade-in min-h-[60vh]">
      <div className="flex flex-col items-center text-center gap-xl max-w-lg">
        
        <div className="relative">
          <div className="font-display text-[120px] leading-none text-primary/5 select-none">404</div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="material-symbols-outlined text-[48px] text-secondary opacity-30">help_center</span>
          </div>
        </div>

        <div className="flex flex-col gap-xs">
          <h1 className="font-display text-headline-lg text-primary leading-none tracking-tighter">Signal Lost</h1>
          <p className="font-body-lg text-body-lg text-secondary max-w-md">The coordinate you requested does not exist in our neural network. It may have been relocated or removed.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-md w-full sm:w-auto">
          <Link 
            to={isAuthenticated ? '/dashboard' : '/'} 
            className="bg-primary text-on-primary px-xl py-md rounded-pebble font-label-bold text-label-bold transition-all active:scale-95 flex items-center justify-center gap-sm"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            {isAuthenticated ? 'Return to Dashboard' : 'Return Home'}
          </Link>
          <button 
            onClick={() => window.history.back()}
            className="bg-surface-container-high text-primary border border-outline-variant px-xl py-md rounded-pebble font-label-bold text-label-bold transition-all hover:bg-surface-container-highest flex items-center justify-center gap-sm"
          >
            <span className="material-symbols-outlined text-[18px]">undo</span>
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
