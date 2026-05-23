import { Link, NavLink } from 'react-router';

import logoLight from '../../../shared/assets/logos/logo-light.png';
import logoDark from '../../../shared/assets/logos/logo-dark.png';

import { navLinks } from '../model/navLinks';
import { ThemeSwitcher } from './ThemeSwitcher';

import { BurgerMenu } from './BurgerMenu';

export function NavBar() {
  return (
    <header className="select-none fixed left-0 right-0 top-0 z-50 px-4 pt-6 md:px-8">
      <div className="mx-auto grid h-[72px] max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-4 rounded-[28px] border border-[var(--color-border)] bg-[var(--navbar-bg)] px-4 shadow-xl shadow-[var(--color-shadow)] backdrop-blur-2xl md:px-8">
        <Link
          to="/"
          className="flex items-center gap-3 rounded-full pr-2 transition hover:opacity-90"
        >
          <span className="flex h-12 w-32 items-center justify-center overflow-hidden rounded-2xl">
            <img
              src={logoLight}
              alt="Окогид"
              className="navbar-logo-image navbar-logo-image--light h-full w-full object-contain"
            />

            <img
              src={logoDark}
              alt="Окогид"
              className="navbar-logo-image navbar-logo-image--dark h-full w-full object-contain"
            />
          </span>
        </Link>

        <nav className="hidden h-full justify-center xl:flex">
          <div className="flex h-full items-center gap-8">
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                className={({ isActive }) =>
                  [
                    'relative flex h-full items-center whitespace-nowrap text-[14px] font-inter font-medium uppercase transition',
                    'after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[3px] after:rounded-t-full after:bg-[var(--color-primary)] after:transition-opacity',
                    isActive
                      ? 'text-[var(--color-primary)] after:opacity-100'
                      : 'text-[var(--color-text-primary] after:opacity-0 hover:text-[var(--color-primary)]',
                  ].join(' ')
                }
              >
                {link.label}
              </NavLink>
            ))}
          </div>
        </nav>

        <div className="flex items-center justify-end gap-2">
          <div className="hidden sm:block">
            <ThemeSwitcher />
          </div>

          <Link
            to="/login"
            className="hidden rounded-full px-5 py-2.5 text-sm font-inter font-bold text-[var(--button-primary-text)] border border-[var(--color-border)] transition hover:scale-[1.03] xl:flex hover:text-[var(--color-primary)]"
          >
            Войти
          </Link>

          <BurgerMenu />
        </div>
      </div>
    </header>
  );
}