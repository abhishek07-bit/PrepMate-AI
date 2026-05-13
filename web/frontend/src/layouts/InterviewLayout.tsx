import { Outlet } from 'react-router-dom';

export default function InterviewLayout() {
  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col font-body-md text-body-md antialiased">
      <Outlet />
    </div>
  );
}
