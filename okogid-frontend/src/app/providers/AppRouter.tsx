import { Route, Routes } from 'react-router';

import { HomePage } from '../../pages/home/ui/HomePage';
import { MapPage } from '../../pages/map/ui/MapPage';
import { LoginPage } from '../../pages/login/ui/LoginPage';
import { RegisterPage } from '../../pages/register/ui/RegisterPage';
import { ForgotPasswordPage } from '../../pages/forgot-password/ui/ForgotPasswordPage';
import { FourZeroFourPage } from '../../pages/404/ui/404Page'

import { MainLayout } from '../../widgets/layouts/main-layout/ui/MainLayout';
import { MapLayout } from '../../widgets/layouts/map-layout/ui/MapLayout'
import { AuthLayout } from '../../widgets/layouts/auth-layout/ui/AuthLayout';

export function AppRouter() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
      </Route>

      <Route element={<MapLayout />}>
        <Route path="/map" element={<MapPage />} />
      </Route>

      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      </Route>

      <Route path="*" element={<FourZeroFourPage />} />
    </Routes>
  );
}