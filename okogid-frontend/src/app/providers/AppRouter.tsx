import { Route, Routes } from 'react-router';

import { HomePage } from '../../pages/home/ui/HomePage';
import { MapPage } from '../../pages/map/ui/MapPage';
import { FourZeroFourPage } from '../../pages/404/ui/404Page'

import { MainLayout } from '../../widgets/layouts/main-layout/ui/MainLayout';
import { MapLayout } from '../../widgets/layouts/map-layout/ui/MapLayout'

export function AppRouter() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
      </Route>

      <Route element={<MapLayout />}>
        <Route path="/map" element={<MapPage />} />
      </Route>

      <Route path="*" element={<FourZeroFourPage />} />
    </Routes>
  );
}