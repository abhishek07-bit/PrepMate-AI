import { Link } from 'react-router-dom';
import { Layers } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="w-full border-t border-outline-variant py-xl px-lg md:px-container-padding mt-auto">
      <div className="max-w-max-width mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-lg">
        {/* Brand */}
        <div className="flex items-center gap-sm">
          <Layers size={20} className="text-primary" strokeWidth={1.5} />
          <span className="font-label-bold text-label-bold text-primary">PrepMate AI</span>
        </div>

        {/* Main Links */}
        <div className="flex flex-wrap gap-lg font-label-sm text-label-sm text-secondary">
          <Link to="/dashboard" className="hover:text-primary transition-colors">Dashboard</Link>
          <Link to="/interview/setup" className="hover:text-primary transition-colors">Practice</Link>
          <Link to="/analytics" className="hover:text-primary transition-colors">Analytics</Link>
          <Link to="/resume" className="hover:text-primary transition-colors">Resume</Link>
          <Link to="/settings" className="hover:text-primary transition-colors">Settings</Link>
        </div>

        {/* Legal */}
        <div className="flex gap-lg font-label-sm text-label-sm text-secondary">
          <span>© {new Date().getFullYear()} PrepMate AI</span>
          <a className="hover:text-primary transition-colors" href="#">Privacy</a>
          <a className="hover:text-primary transition-colors" href="#">Terms</a>
        </div>
      </div>
    </footer>
  );
}
