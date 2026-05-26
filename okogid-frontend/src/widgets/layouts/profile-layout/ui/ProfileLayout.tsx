import { Outlet } from 'react-router';

import { NavBar } from '../../../NavBar/ui/NavBar';

export function ProfileLayout() {
  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text-primary)] transition-colors">
      <NavBar />

      <main className="pt-28">
        <Outlet />
      </main>
    </div>
  );
}