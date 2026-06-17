import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Lottie from 'lottie-react';
import logoAnimation from '../../assets/prepmateailogo.json';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';

// Safely handle the Lottie default/named export for different build environments
const LottieComponent = (Lottie as any).default || Lottie;

const navLinks = [
  { label: 'Home', path: '/', icon: 'home' },
  { label: 'Dashboard', path: '/dashboard', icon: 'space_dashboard' },
  { label: 'Practice Interview', path: '/interview/setup', icon: 'settings_voice' },
  { label: 'Company Prep', path: '/company-prep', icon: 'track_changes' },
  { label: 'Progress', path: '/analytics', icon: 'analytics' },
  { label: 'Resume', path: '/resume', icon: 'description' },
];

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const logout = useAuthStore((s) => s.logout);
  const { theme, setTheme } = useSettingsStore();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    if (path === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname.startsWith(path);
  };

  useEffect(() => {
    setMobileMenuOpen(false);
    setProfileMenuOpen(false);
  }, [location.pathname]);

  // Prevent background scrolling when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: PointerEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('pointerdown', handleClickOutside);
    return () => document.removeEventListener('pointerdown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    setMobileMenuOpen(false);
    setProfileMenuOpen(false);
    navigate('/login');
  };

  const cycleTheme = () => {
    if (theme === 'system') setTheme('light');
    else if (theme === 'light') setTheme('dark');
    else setTheme('system');
  };

  const themeIcon = theme === 'system' ? 'monitor' : theme === 'light' ? 'light_mode' : 'dark_mode';

  return (
    <header className={`fixed top-0 left-0 w-full z-50 transition-all duration-200 ${
      scrolled ? 'border-b border-outline-variant bg-surface/85 backdrop-blur-xl' : 'border-b border-transparent bg-surface/60 backdrop-blur-md'
    }`}>
      <div className="w-full max-w-max-width mx-auto h-navbar-h px-lg lg:px-2xl flex justify-between items-center relative">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-sm group shrink-0" onClick={() => setMobileMenuOpen(false)}>
          <div className="w-8 h-8 md:w-10 md:h-10 transition-transform group-hover:scale-110 brightness-0 dark:invert flex items-center justify-center">
            <LottieComponent animationData={logoAnimation} loop={true} autoplay={true} />
          </div>
          <span className="font-aerodome text-primary text-xl md:text-2xl tracking-tight">PrepMate AI</span>
        </Link>

        {/* Desktop Navigation Links - Centered */}
        <nav className="hidden lg:flex items-center gap-xs absolute left-1/2 -translate-x-1/2">
          {isAuthenticated && navLinks.map((link) => {
            const active = isActive(link.path);
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`px-lg py-sm flex items-center gap-xs rounded-full transition-all font-label-bold text-[12px] ${
                  active
                    ? 'bg-primary text-on-primary'
                    : 'text-secondary hover:bg-surface-container-high hover:text-primary'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Side */}
        <div className="flex items-center gap-sm relative shrink-0">
          <button 
            onClick={cycleTheme}
            title={`Theme: ${theme}`}
            aria-label="Toggle theme"
            className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container border border-outline-variant hover:border-primary text-secondary hover:text-primary transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">{themeIcon}</span>
          </button>

          {isAuthenticated ? (
            <>
              {/* Profile Icon (Desktop & Mobile) */}
              <div className="relative" ref={profileMenuRef}>
                <button
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  title="Profile"
                  aria-label="Open profile menu"
                  className={`w-10 h-10 flex items-center justify-center rounded-full border transition-all ${
                    profileMenuOpen 
                      ? 'bg-primary text-on-primary border-primary' 
                      : 'bg-surface-container border-outline-variant hover:border-primary text-secondary hover:text-primary'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">person</span>
                </button>
                
                {profileMenuOpen && (
                  <div className="absolute top-full right-0 mt-sm w-72 bg-surface border border-outline-variant rounded-pebble shadow-elevated overflow-hidden animate-fade-in flex flex-col z-50">
                    <div className="px-lg py-md border-b border-outline-variant flex items-center gap-md">
                      <div className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center font-label-bold text-[14px] shrink-0">
                        {(user?.firstName?.[0] || user?.email?.[0] || '?').toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-label-bold text-sm text-primary truncate">{user?.firstName} {user?.lastName}</p>
                        <p className="text-[11px] text-secondary truncate">{user?.email}</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col p-xs">
                      <Link 
                        to="/dashboard"
                        onClick={() => setProfileMenuOpen(false)}
                        className="flex items-center gap-md px-md py-sm rounded-pebble text-secondary hover:text-primary hover:bg-surface-container transition-colors font-label-bold text-[12px]"
                      >
                        <span className="material-symbols-outlined text-[18px]">space_dashboard</span>
                        Dashboard
                      </Link>
                      <Link 
                        to="/settings"
                        onClick={() => setProfileMenuOpen(false)}
                        className="flex items-center gap-md px-md py-sm rounded-pebble text-secondary hover:text-primary hover:bg-surface-container transition-colors font-label-bold text-[12px]"
                      >
                        <span className="material-symbols-outlined text-[18px]">tune</span>
                        Preferences
                      </Link>
                      <div className="h-px bg-outline-variant my-xs" />
                      <button 
                        onClick={handleLogout}
                        className="flex items-center gap-md px-md py-sm rounded-pebble text-error hover:bg-error/10 transition-colors font-label-bold text-[12px] w-full text-left"
                      >
                        <span className="material-symbols-outlined text-[18px]">logout</span>
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Hamburger */}
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle menu"
                className="lg:hidden w-10 h-10 flex items-center justify-center rounded-full bg-surface-container border border-outline-variant hover:border-primary text-primary transition-all"
              >
                <span className="material-symbols-outlined text-[20px]">{mobileMenuOpen ? 'close' : 'menu'}</span>
              </button>
            </>
          ) : (
            <div className="flex items-center gap-sm ml-sm">
              <Link to="/login" className="text-[13px] font-label-bold text-secondary hover:text-primary transition-colors px-md py-sm hidden sm:block">Sign In</Link>
              <Link to="/signup" className="bg-primary text-on-primary px-lg py-sm rounded-full text-[13px] font-label-bold hover:opacity-90 transition-opacity hidden sm:block">Get Started</Link>
              {/* Mobile hamburger for unauthenticated users */}
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle menu"
                className="sm:hidden w-10 h-10 flex items-center justify-center rounded-full bg-surface-container border border-outline-variant hover:border-primary text-primary transition-all"
              >
                <span className="material-symbols-outlined text-[20px]">{mobileMenuOpen ? 'close' : 'menu'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Drawer */}
      <div 
        className={`lg:hidden absolute top-full left-0 w-full overflow-y-auto transition-all duration-300 ease-in-out bg-surface border-outline-variant shadow-elevated transform-gpu ${
          mobileMenuOpen ? 'opacity-100 border-b' : 'opacity-0 pointer-events-none'
        }`}
        style={{
          maxHeight: mobileMenuOpen ? 'calc(100vh - var(--spacing-navbar-h, 64px))' : '0px',
          transform: mobileMenuOpen ? 'translate3d(0, 0, 0)' : 'translate3d(0, -10px, 0)'
        }}
      >
        <nav className="flex flex-col p-lg gap-xs">
          {isAuthenticated ? (
            <>
              {navLinks.map((link) => {
                const active = isActive(link.path);
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`px-md py-md flex items-center gap-md rounded-pebble transition-all font-label-bold text-[13px] ${
                      active
                        ? 'bg-primary text-on-primary'
                        : 'text-secondary hover:bg-surface-container hover:text-primary'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px]">{link.icon}</span>
                    {link.label}
                  </Link>
                );
              })}
              
              <div className="h-px bg-outline-variant my-sm" />
              
              <div className="px-md pb-sm flex items-center gap-md">
                <div className="w-9 h-9 rounded-full bg-primary text-on-primary flex items-center justify-center font-label-bold text-[12px]">
                  {(user?.firstName?.[0] || user?.email?.[0] || '?').toUpperCase()}
                </div>
                <p className="font-label-bold text-[12px] text-primary truncate">{user?.email}</p>
              </div>

              <Link
                to="/settings"
                className={`px-md py-md flex items-center gap-md rounded-pebble transition-all font-label-bold text-[13px] ${
                  isActive('/settings')
                    ? 'bg-primary text-on-primary'
                    : 'text-secondary hover:bg-surface-container hover:text-primary'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">tune</span>
                Preferences
              </Link>
              
              <button 
                onClick={handleLogout}
                className="px-md py-md flex items-center gap-md rounded-pebble transition-all font-label-bold text-[13px] text-error hover:bg-error/10 mt-xs"
              >
                <span className="material-symbols-outlined text-[20px]">logout</span>
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="px-md py-md flex items-center gap-md rounded-pebble transition-all font-label-bold text-[13px] text-secondary hover:bg-surface-container hover:text-primary">
                Sign In
              </Link>
              <Link to="/signup" className="px-md py-md flex items-center justify-center gap-md rounded-pebble transition-all font-label-bold text-[13px] bg-primary text-on-primary hover:opacity-90">
                Get Started
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
