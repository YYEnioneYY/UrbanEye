import { Link } from 'react-router';

import logoLight from '../../../shared/assets/logos/logo-light.png';
import logoDark from '../../../shared/assets/logos/logo-dark.png';

import { footerColumns } from '../model/footerLinks';

function MailIcon() {
  return (
    <svg
      className="h-5 w-5 shrink-0 text-[var(--color-primary)]"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 6h16v12H4z" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg
      className="h-5 w-5 shrink-0 text-[var(--color-primary)]"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 21s7-4.5 7-11a7 7 0 1 0-14 0c0 6.5 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

export function Footer() {
  return (
    <footer className="bg-[var(--color-bg)] px-4 pb-6 pt-14 text-[var(--color-text-secondary)] md:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 border-b border-[var(--color-border-strong)] pb-8 md:grid-cols-[1.7fr_1fr_1fr_1fr_1.2fr] md:gap-8">
          <div>
            <Link to="/" className="inline-flex transition hover:opacity-90">
              <span className="relative flex h-16 w-48 items-center overflow-hidden">
                <img
                  src={logoLight}
                  alt="Окогид"
                  className="footer-logo-image footer-logo-image--light h-full w-full object-contain object-left"
                />

                <img
                  src={logoDark}
                  alt="Окогид"
                  className="footer-logo-image footer-logo-image--dark h-full w-full object-contain object-left"
                />
              </span>
            </Link>

            <p className="mt-5 max-w-[320px] text-base font-inter leading-5 text-[var(--color-text-secondary)]">
              Открывайте города по-новому с живыми камерами на интерактивной
              карте. Смотрите мир в реальном времени.
            </p>
          </div>

          {footerColumns.map((column) => (
            <div key={column.title}>
              <h3 className="text-base font-extrabold text-[var(--color-text-primary)]">
                {column.title}
              </h3>

              <nav className="mt-3 flex flex-col gap-2">
                {column.links.map((link) => (
                  <Link
                    key={`${column.title}-${link.label}`}
                    to={link.path}
                    className="text-base font-inter leading-5 transition hover:text-[var(--color-primary)]"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>
          ))}

          <div>
            <h3 className="text-base font-extrabold text-[var(--color-text-primary)]">
              Контакты
            </h3>

            <div className="mt-3 flex flex-col gap-3">
              <a
                href="mailto:info@okogid.ru"
                className="flex items-center gap-2 text-base font-inter leading-5 transition hover:text-[var(--color-primary)]"
              >
                <MailIcon />
                <span>info@okogid.ru</span>
              </a>

              <div className="flex items-start gap-2 text-base font-inter leading-5">
                <LocationIcon />
                <span>
                  Санкт-Петербург,
                  <br />
                  Россия
                </span>
              </div>
            </div>
          </div>
        </div>

        <p className="pt-4 text-center text-sm font-inter text-[var(--color-text-secondary)]">
          ©2026 ОКОГИД. Все права защищены.
        </p>
      </div>
    </footer>
  );
}