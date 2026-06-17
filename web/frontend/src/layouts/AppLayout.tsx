import { Outlet, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function AppLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <main className="flex-1 w-full max-w-max-width mx-auto px-lg md:px-xl lg:px-2xl pt-[calc(var(--spacing-navbar-h)+24px)] pb-2xl animate-fade-in">
      <Outlet />
    </main>
  );
}
