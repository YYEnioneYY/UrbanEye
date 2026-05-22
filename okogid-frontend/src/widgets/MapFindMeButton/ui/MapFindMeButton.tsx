import { useEffect, useState } from 'react';

import { MAP_EVENTS } from '../../../shared/config/mapEvents';

export function MapFindMeButton() {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const handleStart = () => setIsLoading(true);
    const handleEnd = () => setIsLoading(false);

    window.addEventListener(MAP_EVENTS.findMeStart, handleStart);
    window.addEventListener(MAP_EVENTS.findMeSuccess, handleEnd);
    window.addEventListener(MAP_EVENTS.findMeError, handleEnd);

    return () => {
      window.removeEventListener(MAP_EVENTS.findMeStart, handleStart);
      window.removeEventListener(MAP_EVENTS.findMeSuccess, handleEnd);
      window.removeEventListener(MAP_EVENTS.findMeError, handleEnd);
    };
  }, []);

  const handleClick = () => {
    window.dispatchEvent(new Event(MAP_EVENTS.findMe));
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isLoading}
      className="pointer-events-auto flex h-12 items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--navbar-bg)] px-4 text-sm font-bold text-[var(--color-text-primary)] shadow-xl shadow-[var(--color-shadow)] backdrop-blur-2xl transition hover:scale-105 hover:text-[var(--color-primary)] disabled:cursor-wait disabled:opacity-70"
    >
      <span className="relative flex h-4 w-4 items-center justify-center">
        <span className="absolute h-4 w-4 rounded-full border-2 border-current" />
        <span className="h-1.5 w-1.5 rounded-full bg-current" />
      </span>

      <span className="hidden sm:inline">
        {isLoading ? 'Ищем...' : 'Найти меня'}
      </span>
    </button>
  );
}