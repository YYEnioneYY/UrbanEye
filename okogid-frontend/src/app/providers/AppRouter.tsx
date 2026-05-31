import { Route, Routes } from 'react-router';

import { HomePage } from '../../pages/home/ui/HomePage';
import { AboutPage } from '../../pages/about/ui/AboutPage';

import { MapPage } from '../../pages/map/ui/MapPage';
import { CameraViewPage } from '../../pages/camera-view/ui/CameraViewPage';

import { LoginPage } from '../../pages/login/ui/LoginPage';
import { RegisterPage } from '../../pages/register/ui/RegisterPage';
import { ForgotPasswordPage } from '../../pages/forgot-password/ui/ForgotPasswordPage';
import { ProfilePage } from '../../pages/profile/ui/ProfilePage';

import { NotFoundPage } from '../../pages/not-found/ui/NotFoundPage';

import { MainLayout } from '../../widgets/layouts/main-layout/ui/MainLayout';
import { MapLayout } from '../../widgets/layouts/map-layout/ui/MapLayout'
import { CameraViewLayout } from '../../widgets/layouts/camera-view-layout/ui/CameraViewLayout';
import { AuthLayout } from '../../widgets/layouts/auth-layout/ui/AuthLayout';
import { ProfileLayout } from '../../widgets/layouts/profile-layout/ui/ProfileLayout';

/* Admin */
import { AdminPage } from '../../pages/admin/ui/AdminPage';
import { RequireAdmin } from '../../features/auth/ui/RequireAdmin';
import { AdminLayout } from '../../widgets/layouts/admin-layout/ui/AdminLayout';
import { AdminUsersPage } from '../../pages/admin-users/ui/AdminUsersPage';
import { AdminServicesPage } from '../../pages/admin-services/ui/AdminServicesPage';
import { AdminPlaceholderPage } from '../../pages/admin/ui/AdminPlaceholderPage';

export function AppRouter() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/excursions" element={<div>Экскурсии</div>} />
        <Route path="/popular-places" element={<div>Популярные места</div>} />
        <Route path="/about" element={<AboutPage />} />
      </Route>

      <Route element={<MapLayout />}>
        <Route path="/map" element={<MapPage />} />
      </Route>

      <Route element={<CameraViewLayout />}>
        <Route path="/cameras/:cameraId" element={<CameraViewPage />} />
      </Route>

      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      </Route>

      <Route element={<ProfileLayout />}>
        <Route path="/profile" element={<ProfilePage />} />
      </Route>

      <Route element={<RequireAdmin />}>
        <Route path="/admin-dashboard" element={<AdminLayout />}>
          <Route index element={<AdminPage />} />

          <Route
            path="cameras-add"
            element={
              <AdminPlaceholderPage
                title="Добавить камеру"
                description="Форма создания новой камеры: название, город, адрес, координаты, категория, статус и stream path."
              />
            }
          />

          <Route
            path="cameras"
            element={
              <AdminPlaceholderPage
                title="Список камер"
                description="Таблица всех камер с возможностью поиска, фильтрации, редактирования и отключения."
              />
            }
          />

          <Route path="users" element={<AdminUsersPage />} />

          <Route
            path="statistics"
            element={
              <AdminPlaceholderPage
                title="Статистика"
                description="Просмотры камер, активность пользователей, популярные места и динамика посещений."
              />
            }
          />

          <Route path="services" element={<AdminServicesPage />} />

          <Route
            path="settings"
            element={
              <AdminPlaceholderPage
                title="Настройки"
                description="Глобальные параметры проекта, лимиты, отображение карты и системные настройки."
              />
            }
          />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}