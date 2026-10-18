import { useFavorites } from '../context/FavoritesContext';
import { Link, useLocation } from 'react-router-dom';
import { useI18n } from '../i18n';
import { LanguageSwitcher } from './LanguageSwitcher';

interface NavItem {
  path: string;
  labelKey: string;
  count?: number;
}

export function Header() {
  const { favorites } = useFavorites();
  const location = useLocation();
  const { t } = useI18n();

  const navItems: NavItem[] = [
    { path: '/', labelKey: 'header.navCatalogue' },
    { path: '/categories', labelKey: 'header.navCategories' },
    { path: '/authors', labelKey: 'header.navAuthors' },
    { path: '/favorites', labelKey: 'header.navFavorites', count: favorites.size },
  ];

  return (
    <header className="header">
      <div className="header-content">
        <div className="header-brand">
          <h1 className="logo">
            <span className="logo-icon" aria-hidden="true">🔍</span>
            {t('header.appName')}
          </h1>
        </div>
        <div className="header-actions">
          <nav className="header-nav" aria-label={t('common.search')}>
            <ul className="nav-list">
              {navItems.map(item => (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`nav-link ${location.pathname === item.path ? 'is-active' : ''}`}
                    aria-current={location.pathname === item.path ? 'page' : undefined}
                  >
                    {t(item.labelKey)}
                    {item.count !== undefined && item.count > 0 && (
                      <span className="nav-count" aria-label={t('header.favoritesCount', { count: item.count })}>
                        {item.count}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}