import type { InputHTMLAttributes, ReactNode } from 'react';

type AuthInputProps = InputHTMLAttributes<HTMLInputElement> & {
  icon: ReactNode;
};

export function AuthInput({ icon, ...props }: AuthInputProps) {
  return (
    <label className="flex h-13 items-center gap-3 rounded-[18px] border border-[var(--color-auth-input-border)] bg-[var(--color-auth-input-bg)] px-4 transition focus-within:border-[var(--color-auth-input-border-hover)]">
      <span className="shrink-0 text-[var(--color-auth-input-text)]">{icon}</span>

      <input
        {...props}
        className="w-full border-none bg-transparent text-[12px] text-semibold text-[var(--color-auth-input-text)] outline-none placeholder:text-[var(--color-auth-input-text)]"
      />
    </label>
  );
}