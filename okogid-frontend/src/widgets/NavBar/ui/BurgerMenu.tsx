import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router';

import { navLinks } from '../model/navLinks';
import { ThemeSwitcher } from './ThemeSwitcher';

export function BurgerMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  return (
    <div className="xl:hidden">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={isOpen ? 'Закрыть меню' : 'Открыть меню'}
        aria-expanded={isOpen}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-text-primary)] transition hover:scale-[1.03] hover:text-[var(--color-primary)]"
      >
        <span className="relative h-4 w-5">
          <span
            className={[
              'absolute left-0 top-0 h-[2px] w-5 rounded-full bg-current transition',
              isOpen ? 'translate-y-[7px] rotate-45' : '',
            ].join(' ')}
          />

          <span
            className={[
              'absolute left-0 top-[7px] h-[2px] w-5 rounded-full bg-current transition',
              isOpen ? 'opacity-0' : 'opacity-100',
            ].join(' ')}
          />

          <span
            className={[
              'absolute left-0 top-[14px] h-[2px] w-5 rounded-full bg-current transition',
              isOpen ? '-translate-y-[7px] -rotate-45' : '',
            ].join(' ')}
          />
        </span>
      </button>

      <div
        className={[
          'fixed left-4 right-4 top-[106px] z-40 rounded-[28px]',
          'border border-[var(--color-border)] bg-[var(--navbar-bg)] shadow-xl shadow-[var(--color-shadow)] backdrop-blur-2xl',
          'transition duration-200',
          isOpen
            ? 'pointer-events-auto translate-y-0 opacity-100'
            : 'pointer-events-none -translate-y-3 opacity-0',
        ].join(' ')}
      >
        <div className="flex flex-col gap-1 p-3">
          {navLinks.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              className={({ isActive }) =>
                [
                  'rounded-2xl px-4 py-3 text-sm font-semibold uppercase transition',
                  isActive
                    ? 'text-[var(--color-primary)] border'
                    : 'text-[var(--color-text-primary)] hover:bg-[var(--color-bg-soft)] hover:text-[var(--color-primary)]',
                ].join(' ')
              }
            >
              {link.label}
            </NavLink>
          ))}

          <div className="my-2 h-px bg-[var(--color-border)]" />

          <div className="flex items-center justify-between gap-3 px-1 py-1 sm:hidden">
            <span className="text-sm font-medium text-[var(--color-text-secondary)]">
              Тема
            </span>

            <ThemeSwitcher />
          </div>

          <Link
            to="/login"
            className="mt-2 rounded-2xl border border-[var(--color-border)] px-4 py-3 text-center text-sm font-bold text-[var(--button-primary-text)] transition hover:scale-[1.01] hover:text-[var(--color-primary)]"
          >
            Войти
          </Link>
        </div>
      </div>
    </div>
  );
}