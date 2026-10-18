import { useFavorites } from '../context/FavoritesContext';
import { Link, useLocation } from 'react-router-dom';

interface NavItem {
  path: string;
  label: string;
  count?: number;
}

export function Header() {
  const { favorites } = useFavorites();
  const location = useLocation();

  const navItems: NavItem[] = [
    { path: '/', label: 'Catalogue' },
    { path: '/favorites', label: 'Favoris', count: favorites.size },
  ];

  return (
    <header className="header">
      <div className="header-content">
        <nav className="header-nav" aria-label="Navigation principale">
          <ul className="nav-list">
            {navItems.map(item => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`nav-link ${location.pathname === item.path ? 'is-active' : ''}`}
                  aria-current={location.pathname === item.path ? 'page' : undefined}
                >
                  {item.label}
                  {item.count !== undefined && item.count > 0 && (
                    <span className="nav-count" aria-label={`${item.count} favori${item.count > 1 ? 's' : ''}`}>
                      {item.count}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="header-brand">
          <h1 className="logo">
            <span className="logo-icon" aria-hidden="true">🔍</span>
            Yoto Icons Catalogue
          </h1>
          <p className="subtitle">Recherche unifiée dans yotopixels + yotoicons</p>
        </div>
      </div>
    </header>
  );
}