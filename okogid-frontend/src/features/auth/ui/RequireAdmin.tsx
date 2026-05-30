import { Navigate, Outlet } from 'react-router';

import { AccessDeniedPage } from '../../../pages/access-denied/ui/AccessDeniedPage';
import { useAuthStore } from '../model/authStore';

export function RequireAdmin() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isSessionLoading = useAuthStore((state) => state.isSessionLoading);

  if (isSessionLoading) {
    return (
      <section className="min-h-[70vh] px-4 py-20 md:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-[36px] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-2xl shadow-[var(--color-shadow)] backdrop-blur-2xl">
            <p className="font-inter text-sm text-[var(--color-text-secondary)]">
              Проверяем права доступа...
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== 'admin') {
    return <AccessDeniedPage />;
  }

  return <Outlet />;
}