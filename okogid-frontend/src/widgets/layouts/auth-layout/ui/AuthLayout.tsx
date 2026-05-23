import { Outlet } from 'react-router';

import authBgLight from '../../../../shared/assets/auth/auth-bg-light.png';
import authBgDark from '../../../../shared/assets/auth/auth-bg-dark.png';

export function AuthLayout() {
  return (
    <div className="relative flex min-h-screen max-h-screen items-center justify-center overflow-hidden bg-[var(--color-bg)] px-4 py-10">
      <img
        src={authBgLight}
        alt=""
        aria-hidden="true"
        className="auth-bg-image auth-bg-image--light"
      />

      <img
        src={authBgDark}
        alt=""
        aria-hidden="true"
        className="auth-bg-image auth-bg-image--dark"
      />

      <div className="auth-bg-overlay" />

      <div className="relative z-10 w-full max-w-[460px]">
        <Outlet />
      </div>
    </div>
  );
}