import { useFavorites } from '../context/FavoritesContext';
import { Link, useLocation } from 'react-router-dom';
import { useI18n } from '../i18n';
import { SettingsMenu } from './SettingsMenu';
import { useState } from 'react';

interface NavItem {
  path: string;
  labelKey: string;
  count?: number;
}

const mainNavItems: NavItem[] = [
  { path: '/', labelKey: 'header.navCatalogue' },
  { path: '/categories', labelKey: 'header.navCategories' },
  { path: '/editor', labelKey: 'header.navEditor' },
];

const communityNavItems: NavItem[] = [
  { path: '/authors', labelKey: 'header.navAuthors' },
  { path: '/developers', labelKey: 'header.navDevelopers' },
];

export function Header() {
  const { favorites } = useFavorites();
  const location = useLocation();
  const { t } = useI18n();
  const [isCommunityOpen, setIsCommunityOpen] = useState(false);

  const favoritesNavItem: NavItem = {
    path: '/favorites',
    labelKey: 'header.navFavorites',
    count: favorites.size,
  };

  return (
    <header className="header">
      <div className="header-content">
        <div className="header-brand">
          <h1 className="logo">
            <span className="logo-icon" aria-hidden="true">
              🔍
            </span>
            {t('header.appName')}
          </h1>
        </div>
        <div className="header-actions">
          <nav className="header-nav" aria-label={t('common.search')}>
            <ul className="nav-list">
              {mainNavItems.map((item) => (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`nav-link ${location.pathname === item.path ? 'is-active' : ''}`}
                    aria-current={location.pathname === item.path ? 'page' : undefined}
                  >
                    {t(item.labelKey)}
                  </Link>
                </li>
              ))}
              <li className="nav-dropdown">
                <button
                  type="button"
                  className={`nav-link nav-dropdown-toggle ${isCommunityOpen ? 'is-open' : ''}`}
                  aria-haspopup="true"
                  aria-expanded={isCommunityOpen}
                  aria-label={t('header.navCommunity')}
                  onClick={() => setIsCommunityOpen(!isCommunityOpen)}
                >
                  {t('header.navCommunity')}
                </button>
                <ul className="nav-dropdown-menu" role="menu" aria-label={t('header.navCommunity')}>
                  {communityNavItems.map((item) => (
                    <li key={item.path} role="none">
                      <Link
                        to={item.path}
                        className={`nav-dropdown-item ${location.pathname === item.path ? 'is-active' : ''}`}
                        role="menuitem"
                        aria-current={location.pathname === item.path ? 'page' : undefined}
                        onClick={() => setIsCommunityOpen(false)}
                      >
                        {t(item.labelKey)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
              <li>
                <Link
                  to={favoritesNavItem.path}
                  className={`nav-link ${location.pathname === favoritesNavItem.path ? 'is-active' : ''}`}
                  aria-current={location.pathname === favoritesNavItem.path ? 'page' : undefined}
                >
                  {t(favoritesNavItem.labelKey)}
                  {favoritesNavItem.count !== undefined && favoritesNavItem.count > 0 && (
                    <span
                      className="nav-count"
                      aria-label={t('header.favoritesCount', { count: favoritesNavItem.count })}
                    >
                      {favoritesNavItem.count}
                    </span>
                  )}
                </Link>
              </li>
            </ul>
          </nav>
          <SettingsMenu />
        </div>
      </div>
    </header>
  );
}
