import { useFavorites } from '../context/FavoritesContext';
import { Link, useLocation } from 'react-router-dom';
import { useI18n } from '../i18n';
import { SettingsMenu } from './SettingsMenu';
import { useState } from 'react';

interface NavItem {
  path: string;
  labelKey: string;
  count?: number;
  external?: boolean;
}

const mainNavItems: NavItem[] = [
  { path: '/', labelKey: 'header.navCatalogue' },
  { path: '/categories', labelKey: 'header.navCategories' },
  { path: '/editor', labelKey: 'header.navEditor' },
];

const REPOSITORY_URL = 'https://github.com/yoto-community/icons-catalogue';
const PORTAL_URL = 'https://yoto-community.github.io/';
const PODCASTS_URL = 'https://yoto-community.github.io/podcast-catalogue/';

/** Liens propres au catalogue d'icônes. */
const communityNavItems: NavItem[] = [
  { path: '/authors', labelKey: 'header.navAuthors' },
  { path: '/sources', labelKey: 'header.navSources' },
  { path: '/developers', labelKey: 'header.navDevelopers' },
];

/** Liens vers les autres sites de la communauté Yoto. */
const ecosystemNavItems: NavItem[] = [
  { path: PORTAL_URL, labelKey: 'header.navPortal', external: true },
  { path: PODCASTS_URL, labelKey: 'header.navPodcasts', external: true },
];

/** Contribution et code source, communs à tous les sites. */
const projectNavItems: NavItem[] = [
  {
    path: `${REPOSITORY_URL}/blob/main/CONTRIBUTING.md`,
    labelKey: 'header.navContribute',
    external: true,
  },
  { path: REPOSITORY_URL, labelKey: 'header.navGitHub', external: true },
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

  const renderCommunityItem = (item: NavItem) => (
    <li key={item.path} role="none">
      {item.external ? (
        <a
          href={item.path}
          className="nav-dropdown-item"
          role="menuitem"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => setIsCommunityOpen(false)}
        >
          {t(item.labelKey)}
          <span className="nav-dropdown-external" aria-hidden="true">
            ↗
          </span>
          <span className="sr-only">{t('header.externalLink')}</span>
        </a>
      ) : (
        <Link
          to={item.path}
          className={`nav-dropdown-item ${location.pathname === item.path ? 'is-active' : ''}`}
          role="menuitem"
          aria-current={location.pathname === item.path ? 'page' : undefined}
          onClick={() => setIsCommunityOpen(false)}
        >
          {t(item.labelKey)}
        </Link>
      )}
    </li>
  );

  const communitySeparator = (key: string) => (
    <li key={key} className="nav-dropdown-separator" role="separator" aria-hidden="true" />
  );

  return (
    <header className="header">
      <div className="header-content">
        <div className="header-brand">
          <h1 className="logo">
            <svg
              className="logo-icon"
              width="34"
              height="34"
              viewBox="0 0 34 34"
              aria-hidden="true"
            >
              <rect x="2" y="2" width="30" height="30" rx="10" fill="var(--color-primary)" />
              <g fill="var(--color-background)">
                <rect x="10" y="10" width="6" height="6" rx="1.5" />
                <rect x="18" y="10" width="6" height="6" rx="1.5" />
                <rect x="10" y="18" width="6" height="6" rx="1.5" />
                <rect x="18" y="18" width="6" height="6" rx="1.5" />
              </g>
            </svg>
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
                  {communityNavItems.map(renderCommunityItem)}
                  {communitySeparator('ecosystem-links')}
                  {ecosystemNavItems.map(renderCommunityItem)}
                  {communitySeparator('project-links')}
                  {projectNavItems.map(renderCommunityItem)}
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
