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

/** Liens propres au catalogue d'icônes. */
const communityNavItems: NavItem[] = [
  { path: '/authors', labelKey: 'header.navAuthors' },
  { path: '/sources', labelKey: 'header.navSources' },
  { path: '/developers', labelKey: 'header.navDevelopers' },
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
  const { t, locale } = useI18n();
  const [isCommunityOpen, setIsCommunityOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const portalUrl =
    locale === 'fr' ? 'https://yoto-community.github.io/fr/' : 'https://yoto-community.github.io/';
  const podcastsUrl =
    locale === 'fr'
      ? 'https://yoto-community.github.io/podcast-catalogue/fr/'
      : 'https://yoto-community.github.io/podcast-catalogue/en/';

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

  const renderMobileCommunityItem = (item: NavItem) => (
    <li key={item.path}>
      {item.external ? (
        <a
          href={item.path}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => setIsMenuOpen(false)}
        >
          {t(item.labelKey)}
          <span className="nav-dropdown-external" aria-hidden="true">
            {' '}
            ↗{' '}
          </span>
          <span className="sr-only">{t('header.externalLink')}</span>
        </a>
      ) : (
        <Link
          to={item.path}
          aria-current={location.pathname === item.path ? 'page' : undefined}
          onClick={() => setIsMenuOpen(false)}
        >
          {t(item.labelKey)}
        </Link>
      )}
    </li>
  );

  return (
    <header className="yc-header">
      <div className="yc-header__inner">
        <a className="yc-brand" href={portalUrl}>
          <svg width="28" height="28" viewBox="0 0 34 34" aria-hidden="true">
            <rect x="2" y="2" width="30" height="30" rx="10" fill="var(--color-primary)" />
            <path
              d="M10 12v10M14 9v16M18 13v8M22 10v14M26 14v6"
              stroke="var(--color-background)"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          </svg>
          <span>Yoto Community</span>
        </a>

        <nav className="yc-nav" aria-label={t('header.navCommunitySites')}>
          <a href={portalUrl}>{t('header.navPortal')}</a>
          <Link to="/" aria-current="page">
            {t('header.navIcons')}
          </Link>
          <a href={podcastsUrl}>{t('header.navPodcasts')}</a>
        </nav>

        <span className="yc-divider" aria-hidden="true" />

        <nav className="app-nav desktop-nav" aria-label={t('header.navMain')}>
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
                <li className="nav-dropdown-separator" role="separator" aria-hidden="true" />
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

        <div className="yc-actions">
          <SettingsMenu />
        </div>

        <button
          type="button"
          className="mobile-menu-toggle"
          aria-expanded={isMenuOpen}
          aria-controls="mobile-nav"
          onClick={() => setIsMenuOpen((open) => !open)}
        >
          Menu
        </button>

        {isMenuOpen && (
          <div className="mobile-menu-panel" id="mobile-nav">
            <nav aria-label={t('header.navMain')}>
              <div className="mobile-group mobile-group--ecosystem">
                <span className="mobile-group__label">{t('header.navCommunitySites')}</span>
                <ul>
                  <li>
                    <a href={portalUrl} onClick={() => setIsMenuOpen(false)}>
                      {t('header.navPortal')}
                    </a>
                  </li>
                  <li>
                    <Link to="/" aria-current="page" onClick={() => setIsMenuOpen(false)}>
                      {t('header.navIcons')}
                    </Link>
                  </li>
                  <li>
                    <a href={podcastsUrl} onClick={() => setIsMenuOpen(false)}>
                      {t('header.navPodcasts')}
                    </a>
                  </li>
                </ul>
              </div>
              <ul className="mobile-nav-list">
                {mainNavItems.map((item) => (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      aria-current={location.pathname === item.path ? 'page' : undefined}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {t(item.labelKey)}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link
                    to={favoritesNavItem.path}
                    aria-current={location.pathname === favoritesNavItem.path ? 'page' : undefined}
                    onClick={() => setIsMenuOpen(false)}
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
              <div className="mobile-group">
                <span className="mobile-group__label">{t('header.navCommunity')}</span>
                <ul>
                  {communityNavItems.map(renderMobileCommunityItem)}
                  {projectNavItems.map(renderMobileCommunityItem)}
                </ul>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
