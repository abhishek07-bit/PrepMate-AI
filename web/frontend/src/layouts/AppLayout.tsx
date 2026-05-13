import { Outlet } from 'react-router-dom';
import { Navbar, Footer } from '../components/common';

export default function AppLayout() {
  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col font-body-md text-body-md antialiased">
      <Navbar />
      <main className="flex-1 px-lg md:px-container-padding py-lg max-w-max-width mx-auto w-full">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
