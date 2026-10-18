import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { FavoritesProvider } from './context/FavoritesContext';
import { I18nProvider } from './i18n';
import App from './App';
import './styles.css';

// Base path from vite.config.ts
const BASENAME = '/icons-catalogue/';

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