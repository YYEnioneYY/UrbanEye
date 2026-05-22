import { Outlet } from 'react-router';

import { MapBurgerMenu } from '../../../MapBurgerMenu/ui/MapBurgerMenu';
import { MapFindMeButton } from '../../../MapFindMeButton/ui/MapFindMeButton';

export function MapLayout() {
  return (
    <div className="relative h-screen overflow-hidden bg-[var(--color-bg)] text-[var(--color-text-primary)]">
      <header className="pointer-events-none absolute left-0 right-0 top-0 z-50 p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <MapBurgerMenu />
            <MapFindMeButton />
          </div>
        </div>
      </header>

      <main className="h-screen">
        <Outlet />
      </main>
    </div>
  );
}