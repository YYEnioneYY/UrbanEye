import { useState } from 'react';
import type { InputHTMLAttributes } from 'react';

type AuthPasswordInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type'
>;

function LockIcon() {
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
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 1 1 8 0v3" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m3 3 18 18" />
      <path d="M10.58 10.58A2 2 0 0 0 12 14a2 2 0 0 0 1.42-.58" />
      <path d="M9.88 5.24A10.7 10.7 0 0 1 12 5c6.5 0 10 7 10 7a13.2 13.2 0 0 1-2.05 2.91" />
      <path d="M6.61 6.61C3.7 8.6 2 12 2 12s3.5 7 10 7a10.8 10.8 0 0 0 5.39-1.61" />
    </svg>
  );
}

export function AuthPasswordInput(props: AuthPasswordInputProps) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  return (
    <label className="flex h-13 items-center gap-3 rounded-[18px] border border-[var(--color-auth-input-border)] bg-[var(--color-auth-input-bg)] px-4 transition focus-within:border-[var(--color-auth-input-border-hover)]">
      <span className="shrink-0 text-[var(--color-auth-input-text)]">
        <LockIcon />
      </span>

      <input
        {...props}
        type={isPasswordVisible ? 'text' : 'password'}
        className="w-full border-none bg-transparent text-[12px] text-semibold text-[var(--color-auth-input-text)] outline-none placeholder:text-[var(--color-auth-input-text)]"
      />

      <button
        type="button"
        onClick={() => setIsPasswordVisible((prev) => !prev)}
        className="shrink-0 text-[var(--color-auth-input-text)] transition hover:text-[var(--color-primary)]"
        aria-label={isPasswordVisible ? 'Скрыть пароль' : 'Показать пароль'}
      >
        {isPasswordVisible ? <EyeOffIcon /> : <EyeIcon />}
      </button>
    </label>
  );
}