import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Sun, Moon, Monitor, User, Menu, X, Layers,
  Home, Mic, BarChart3, Upload, Settings, LogOut, FileText, ChevronDown, Zap
} from 'lucide-react';
import { useSettingsStore, type ThemeMode } from '../../store/settingsStore';
import { useAuthStore } from '../../store/authStore';
import Shuffle from './Shuffle';

const drawerLinks = [
  { label: 'Dashboard', path: '/dashboard', icon: Home },
  { label: 'Practice', path: '/interview/setup', icon: Mic },
  { label: 'Company Prep', path: '/company-prep', icon: FileText },
  { label: 'Analytics', path: '/analytics', icon: BarChart3 },
  { label: 'Resume', path: '/resume', icon: Upload },
  { label: 'Settings', path: '/settings', icon: Settings },
];

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const logout = useAuthStore((s) => s.logout);
  const { theme, setTheme } = useSettingsStore();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const isActive = (path: string) => {
    if (path === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname.startsWith(path);
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    setDrawerOpen(false);
    setProfileOpen(false);
  }, [location.pathname]);

  const cycleTheme = () => {
    const order: ThemeMode[] = ['light', 'dark', 'system'];
    const idx = order.indexOf(theme);
    setTheme(order[(idx + 1) % order.length]);
  };

  const ThemeIcon = theme === 'dark' ? Moon : theme === 'system' ? Monitor : Sun;

  const initials = user
    ? `${(user.firstName || '')[0] || ''}${(user.lastName || '')[0] || ''}`.toUpperCase() || '?'
    : '?';

  const handleLogout = () => {
    logout();
    setProfileOpen(false);
    navigate('/login');
  };

  return (
    <>
      <header className="glass sticky top-0 z-50 px-6 py-4 border-b border-outline-variant/30">
        <div className="flex justify-between items-center max-w-7xl mx-auto w-full">
          {/* Logo */}
          <div className="flex items-center gap-12">
            <Link to={isAuthenticated ? '/dashboard' : '/'} className="flex items-center gap-3 group">
              <div className="bg-primary p-1.5 rounded-lg rotate-3 group-hover:rotate-0 transition-transform">
                <Zap size={20} className="text-on-primary" />
              </div>
              <Shuffle
                text="PrepMate AI"
                className="font-display text-2xl tracking-tighter text-primary font-bold"
                shuffleDirection="down"
                duration={0.4}
                stagger={0.04}
                animationMode="evenodd"
                threshold={0}
                loop={true}
                loopDelay={3}
              />
            </Link>

            {/* Desktop Nav */}
            {isAuthenticated && (
              <nav className="hidden lg:flex items-center gap-8">
                {drawerLinks.slice(0, 4).map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`font-label-bold text-xs uppercase tracking-widest transition-colors ${
                      isActive(link.path) ? 'text-primary' : 'text-secondary hover:text-primary'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            )}
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={cycleTheme}
              className="w-10 h-10 flex items-center justify-center rounded-full text-secondary hover:text-primary hover:bg-surface-container-low transition-all"
            >
              <ThemeIcon size={20} strokeWidth={1.5} />
            </button>

            {isAuthenticated ? (
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-3 pl-3 pr-2 py-1.5 rounded-full bg-surface-container-low border border-outline-variant/30 hover:border-primary/30 transition-all"
                >
                  <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-label-bold text-xs">
                    {initials}
                  </div>
                  <ChevronDown size={14} className={`text-secondary transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 top-12 w-56 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl shadow-premium py-2 z-50 animate-scale-in">
                    <div className="px-4 py-3 border-b border-outline-variant/20 mb-1">
                      <p className="font-label-bold text-sm text-primary truncate">{user?.firstName} {user?.lastName}</p>
                      <p className="font-label-sm text-[10px] text-secondary truncate uppercase tracking-widest">{user?.email}</p>
                    </div>
                    <Link to="/settings" className="flex items-center gap-3 px-4 py-2.5 text-secondary hover:bg-surface-container-low transition-colors font-label-bold text-xs">
                      <Settings size={14} /> Profile Settings
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 px-4 py-2.5 text-red-500 hover:bg-red-50 transition-colors font-label-bold text-xs w-full text-left"
                    >
                      <LogOut size={14} /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="hidden md:flex bg-primary text-on-primary font-display font-bold px-8 py-3 rounded-2xl hover:shadow-lg transition-all"
              >
                Get Started
              </Link>
            )}

            <button
              onClick={() => setDrawerOpen(!drawerOpen)}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container-low text-primary hover:bg-primary hover:text-on-primary transition-all"
            >
              {drawerOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>

      {/* Drawer */}
      <aside
        className={`fixed inset-0 w-full h-screen bg-surface-container-lowest/95 backdrop-blur-2xl z-[60] flex flex-col transform transition-transform duration-500 ease-in-out ${
          drawerOpen ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <div className="w-full max-w-7xl mx-auto px-6 py-6 flex justify-between items-center border-b border-outline-variant/30">
          <div className="flex items-center gap-3">
            <Zap size={24} className="text-primary" />
            <span className="font-display text-2xl text-primary font-bold tracking-tight">PrepMate AI</span>
          </div>
          <button
            onClick={() => setDrawerOpen(false)}
            className="w-12 h-12 flex items-center justify-center rounded-full bg-primary text-on-primary shadow-lg"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center gap-8 px-6">
          {(isAuthenticated ? drawerLinks : [
            { label: 'Sign In', path: '/login', icon: User },
            { label: 'Sign Up', path: '/signup', icon: User },
          ]).map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setDrawerOpen(false)}
              className={`font-display text-4xl md:text-6xl font-bold transition-all hover:scale-105 ${
                isActive(link.path) ? 'text-primary' : 'text-outline hover:text-primary'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="p-12 w-full max-w-md mx-auto">
          <div className="flex w-full bg-surface-container-low border border-outline-variant/30 rounded-3xl p-1.5">
            {([
              { value: 'light' as ThemeMode, icon: Sun },
              { value: 'dark' as ThemeMode, icon: Moon },
              { value: 'system' as ThemeMode, icon: Monitor },
            ]).map(({ value, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setTheme(value)}
                className={`flex-1 flex items-center justify-center py-4 rounded-2xl transition-all ${
                  theme === value ? 'bg-primary text-on-primary shadow-lg' : 'text-secondary hover:text-primary'
                }`}
              >
                <Icon size={20} />
              </button>
            ))}
          </div>
        </div>
      </aside>
    </>
  );
}
