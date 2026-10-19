import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { FavoritesProvider } from './context/FavoritesContext';
import { I18nProvider } from './i18n';
import App from './App';
import './styles.css';

// Use Vite's BASE_URL which is automatically set from vite.config.ts base option
// In dev: "/" (Vite serves at root), in prod: "/icons-catalogue/" (from base config)
const BASENAME = import.meta.env.BASE_URL || '/';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter basename={BASENAME}>
      <I18nProvider defaultLocale="fr">
        <FavoritesProvider>
          <App />
        </FavoritesProvider>
      </I18nProvider>
    </BrowserRouter>
  </React.StrictMode>
);