import { useUIStore } from '../../store/uiStore';

export default function ToastContainer() {
  const { toasts, removeToast } = useUIStore();

  return (
    <div className="fixed bottom-4 right-4 md:bottom-8 md:right-8 z-[100] flex flex-col gap-3 pointer-events-none max-w-[calc(100vw-2rem)]">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto animate-slide-up"
        >
          <div className="bg-surface border border-outline-variant rounded-pebble p-4 pr-12 min-w-[260px] md:min-w-[300px] max-w-[400px] shadow-premium relative border-l-4 overflow-hidden"
            style={{ 
              borderLeftColor: 
                toast.type === 'success' ? 'var(--color-primary)' : 
                toast.type === 'error' ? 'var(--color-error)' : 
                toast.type === 'neural' ? 'var(--color-primary)' : 'var(--color-secondary)' 
            }}
          >
            <div className="flex gap-3 items-center">
              <div className={`p-2 rounded-pebble ${
                toast.type === 'success' ? 'bg-primary/10 text-primary' : 
                toast.type === 'error' ? 'bg-error/10 text-error' : 
                toast.type === 'neural' ? 'bg-primary/10 text-primary' : 'bg-secondary/10 text-secondary'
              }`}>
                {toast.type === 'success' && <span className="material-symbols-outlined text-[18px]">check_circle</span>}
                {toast.type === 'error' && <span className="material-symbols-outlined text-[18px]">warning</span>}
                {toast.type === 'neural' && <span className="material-symbols-outlined text-[18px]">bolt</span>}
                {toast.type === 'info' && <span className="material-symbols-outlined text-[18px]">info</span>}
              </div>
              <p className="font-label-bold text-xs text-primary uppercase tracking-wider">{toast.message}</p>
            </div>
            
            <button
              onClick={() => removeToast(toast.id)}
              className="absolute top-4 right-4 text-outline hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
            
            {/* Neural progress bar at bottom of toast */}
            <div className="absolute bottom-0 left-0 h-1 bg-primary/10 w-full overflow-hidden">
              <div className="h-full bg-primary/30 animate-[neural-pulse_5s_linear_infinite]" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
