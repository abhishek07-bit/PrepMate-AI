import { Outlet } from 'react-router-dom';
import Navbar from '../components/common/Navbar';

export default function AuthLayout() {
  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col font-body-md text-body-md antialiased">
      <Navbar />
      <main className="flex-1 flex items-center justify-center p-lg">
        <Outlet />
      </main>
    </div>
  );
}
