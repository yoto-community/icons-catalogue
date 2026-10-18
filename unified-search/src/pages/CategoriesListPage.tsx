import { Link, useLocation } from 'react-router-dom';
import type { SummaryData } from '../types';

interface CategoriesListPageProps {
  summary: SummaryData | null;
}

const CATEGORY_LABELS: Record<string, string> = {
  objets: 'Objets',
  nature: 'Nature',
  animaux: 'Animaux',
  musique: 'Musique',
  personnages: 'Personnages',
  fetes: 'Fêtes',
  transport: 'Transport',
  activites: 'Activités',
  emotions: 'Émotions',
  nourriture: 'Nourriture',
  batiments: 'Bâtiments',
  formes: 'Formes',
};

const CATEGORY_ICONS: Record<string, string> = {
  objets: '📦',
  nature: '🌿',
  animaux: '🐾',
  musique: '🎵',
  personnages: '👤',
  fetes: '🎉',
  transport: '🚌',
  activites: '⚽',
  emotions: '😊',
  nourriture: '🍎',
  batiments: '🏠',
  formes: '🔷',
};

export function CategoriesListPage({ summary }: CategoriesListPageProps) {
  const location = useLocation();

  if (!summary?.byCategory) {
    return (
      <section className="categories-page" aria-labelledby="categories-title">
        <header className="categories-header">
          <h1 id="categories-title">Catégories</h1>
          <p className="categories-intro">Chargement des catégories…</p>
        </header>
      </section>
    );
  }

  // Trier les catégories par nombre d'icônes (décroissant)
  const sortedCategories = Object.entries(summary.byCategory)
    .sort(([, a], [, b]) => b - a);

  const totalIcons = summary.total || 0;
  const totalCategories = sortedCategories.length;

  return (
    <section className="categories-page" aria-labelledby="categories-title">
      <header className="categories-header">
        <h1 id="categories-title">Catégories</h1>
        <p className="categories-intro">
          {totalCategories} catégor{totalCategories > 1 ? 'ies' : 'ie'} — {totalIcons.toLocaleString('fr-FR')} icône{totalIcons > 1 ? 's' : ''} au total
        </p>
      </header>

      <div className="categories-grid" role="list">
        {sortedCategories.map(([category, count]) => {
          const label = CATEGORY_LABELS[category] || category.charAt(0).toUpperCase() + category.slice(1);
          const icon = CATEGORY_ICONS[category] || '📁';
          const isActive = location.pathname === `/categories/${category}`;

          return (
            <article
              key={category}
              className={`category-card ${isActive ? 'is-active' : ''}`}
              role="listitem"
            >
              <Link
                to={`/categories/${category}`}
                className="category-link"
                aria-current={isActive ? 'page' : undefined}
              >
                <div className="category-icon" aria-hidden="true">{icon}</div>
                <div className="category-info">
                  <h2 className="category-name">{label}</h2>
                  <span className="category-count" aria-label={`${count} icônes`}>
                    {count.toLocaleString('fr-FR')} icône{count > 1 ? 's' : ''}
                  </span>
                </div>
                <svg className="category-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </article>
          );
        })}
      </div>

      {sortedCategories.length === 0 && (
        <div className="categories-empty">
          <p>Aucune catégorie disponible pour le moment.</p>
        </div>
      )}
    </section>
  );
}