import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

export default function Footer() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return (
    <footer className="w-full bg-surface-container-low border-t border-outline-variant mt-auto transition-all">
      <div className="max-w-max-width mx-auto px-lg md:px-xl lg:px-2xl py-xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-xl">
          {/* Brand Section */}
          <article className="md:col-span-1 flex flex-col gap-lg">
            <Link to="/" className="flex items-center gap-sm group">
              <span className="material-symbols-outlined text-primary text-[24px] group-hover:scale-110 transition-transform duration-300" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
              <span className="font-headline-md tracking-tighter text-primary font-semibold">PrepMate AI</span>
            </Link>
            <p className="font-body-md text-label-sm text-secondary">
              A simple interview preparation platform.
            </p>
          </article>

          {/* Strategic Links - Side by side on mobile */}
          <div className="md:col-span-3">
            <div className="flex flex-wrap gap-lg md:gap-xl">
              {[
                {
                  title: 'MAIN',
                  links: [
                    { label: 'Dashboard', path: '/dashboard' },
                    { label: 'Practice Interview', path: '/interview/setup' },
                    { label: 'Company Prep', path: '/company-prep' },
                    { label: 'Resume Review', path: '/resume' }
                  ]
                },
                {
                  title: 'RESOURCES',
                  links: [
                    { label: 'System Design Guide', path: '/system-design' },
                    { label: 'Behavioral Questions', path: '/behavioral' },
                    { label: 'Blog', path: '/blog' },
                    { label: 'Help', path: '/help' }
                  ]
                },
                {
                  title: 'LEGAL',
                  links: [
                    { label: 'Privacy Policy', path: '/privacy' },
                    { label: 'Terms of Service', path: '/terms' },
                    { label: 'Cookie Policy', path: '/cookie-policy' }
                  ]
                }
              ].map((column) => (
                <div key={column.title} className="flex flex-col gap-md min-w-[120px]">
                  <h4 className="font-label-bold text-[10px] text-primary uppercase tracking-widest">{column.title}</h4>
                  <div className="flex flex-col gap-sm">
                    {column.links.map((link) => (
                      <Link key={link.label} to={link.path} className="font-label-bold text-xs text-secondary hover:text-primary transition-all">
                        {link.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tactical Status Bar */}
        <div className="mt-xl pt-lg border-t border-outline-variant flex flex-col md:flex-row justify-between items-center gap-lg">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-md">
            <p className="font-label-bold text-[9px] text-secondary uppercase tracking-widest">
              © {new Date().getFullYear()} PREPMATE AI. v2.0
            </p>
            <div className="hidden md:block w-px h-3 bg-outline-variant" />
            <Link to="/careers" className="font-label-bold text-[9px] text-secondary hover:text-primary uppercase tracking-widest transition-all">
              Careers
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
