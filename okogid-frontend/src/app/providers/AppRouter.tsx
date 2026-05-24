import { Route, Routes } from 'react-router';

import { HomePage } from '../../pages/home/ui/HomePage';
import { AboutPage } from '../../pages/about/ui/AboutPage';

import { MapPage } from '../../pages/map/ui/MapPage';
import { CameraViewPage } from '../../pages/camera-view/ui/CameraViewPage';

import { LoginPage } from '../../pages/login/ui/LoginPage';
import { RegisterPage } from '../../pages/register/ui/RegisterPage';
import { ForgotPasswordPage } from '../../pages/forgot-password/ui/ForgotPasswordPage';

import { NotFoundPage } from '../../pages/not-found/ui/NotFoundPage';

import { MainLayout } from '../../widgets/layouts/main-layout/ui/MainLayout';
import { MapLayout } from '../../widgets/layouts/map-layout/ui/MapLayout'
import { CameraViewLayout } from '../../widgets/layouts/camera-view-layout/ui/CameraViewLayout';
import { AuthLayout } from '../../widgets/layouts/auth-layout/ui/AuthLayout';

export function AppRouter() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />

        
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

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}