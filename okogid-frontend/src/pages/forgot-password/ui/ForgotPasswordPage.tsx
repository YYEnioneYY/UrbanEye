import { Link } from 'react-router';

import { AuthInput } from '../../../widgets/Auth/ui/AuthInput';

function MailIcon() {
  return (
    <svg
      className="h-6 w-6"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}

function ArrowLeftIcon() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M19 12H5" />
      <path d="m12 19-7-7 7-7" />
    </svg>
  );
}

export function ForgotPasswordPage() {
  return (
    <div className="rounded-[30px] border border-[var(--color-border)] bg-[var(--color-auth-card-bg)] p-6 shadow-[0_24px_80px_rgba(15,19,24,0.12)] backdrop-blur-2xl sm:p-8">
      <Link
        to="/login"
        className="inline-flex items-center gap-2 text-[12px] font-medium text-[var(--color-primary)] transition hover:opacity-80"
      >
        <ArrowLeftIcon />
        Вернуться ко входу
      </Link>

      <div className="px-2 pb-2 pt-10 text-center">
        <h1 className="text-[20px] font-bold leading-tight text-[var(--color-text-primary)] sm:text-[26px]">
          Восстановление
          <br />
          <span className="text-[var(--color-primary)]">пароля</span>
        </h1>

        <p className="mx-auto mt-4 max-w-[320px] font-inter text-[13px] leading-5 text-[var(--color-text-secondary)]">
          Введите email, который вы использовали при регистрации. Мы отправим
          ссылку для восстановления пароля.
        </p>
      </div>

      <form className="mt-8 space-y-5">
        <AuthInput
          icon={<MailIcon />}
          type="email"
          placeholder="Введите email"
        />

        <button
          type="submit"
          className="mt-2 h-13 w-full rounded-[18px] bg-[var(--button-third-bg)] text-[16px] font-semibold text-[var(--button-third-text)] shadow-sm transition hover:scale-[1.01] hover:bg-[var(--button-third-hover)]"
        >
          Отправить ссылку
        </button>
      </form>

      <div className="mt-8 text-center font-inter text-[12px] text-[var(--color-text-primary)]">
        Вспомнили пароль?{' '}
        <Link
          to="/login"
          className="font-medium text-[var(--color-primary)] underline underline-offset-2"
        >
          Войти
        </Link>
      </div>
    </div>
  );
}