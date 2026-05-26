import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';

import '@fontsource/manrope/400.css';
import '@fontsource/manrope/500.css';
import '@fontsource/manrope/600.css';
import '@fontsource/manrope/700.css';
import '@fontsource/manrope/800.css';

import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/inter/800.css';

import { AppRouter } from './app/providers/AppRouter';
import { AuthSessionProvider } from './app/providers/AuthSessionProvider';
import { ThemeProvider } from './app/providers/ThemeProvider';
import './app/styles/index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AuthSessionProvider>
          <AppRouter />
        </AuthSessionProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
);