import { Outlet } from 'react-router';

import { Footer } from '../../../Footer/ui/Footer';
import { NavBar } from '../../../NavBar/ui/NavBar';

export function MainLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-bg)] text-[var(--color-text-primary)] transition-colors">
      <NavBar />

      <main className="flex-1 pt-28">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}