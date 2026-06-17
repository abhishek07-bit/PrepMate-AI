import { useState, useEffect } from 'react';
import { safeGetItem, safeSetItem } from '../../utils/safeStorage';

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = safeGetItem('cookieConsent');
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    safeSetItem('cookieConsent', 'true');
    setIsVisible(false);
  };

  const handleDecline = () => {
    safeSetItem('cookieConsent', 'false');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 w-full bg-surface-container-high border-t border-outline-variant p-md md:p-lg z-[100] flex flex-col md:flex-row items-center justify-between gap-md animate-slide-up shadow-2xl">
      <div className="flex flex-col gap-xs max-w-3xl">
        <h3 className="font-label-bold text-label-lg text-primary tracking-widest uppercase">Cookie Policy</h3>
        <p className="font-body-sm text-body-sm text-secondary">
          We use cookies to improve your experience and securely maintain your session. By continuing to use this platform, you consent to our use of essential and performance cookies as detailed in our <a href="/cookie-policy" className="text-primary underline">Cookie Policy</a>.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-sm shrink-0 w-full md:w-auto">
        <button
          onClick={handleDecline}
          className="px-lg py-sm rounded-pebble border border-outline-variant font-label-bold text-label-sm text-secondary hover:bg-surface-container-low transition-colors flex-1 md:flex-none text-center"
        >
          Decline Non-Essential
        </button>
        <button
          onClick={handleAccept}
          className="px-lg py-sm rounded-pebble bg-primary text-on-primary font-label-bold text-label-sm hover:shadow-md transition-all active:scale-95 flex-1 md:flex-none text-center"
        >
          Accept All
        </button>
      </div>
    </div>
  );
}
