import { Link, useLocation } from 'react-router-dom';
import type { SummaryData } from '../types';
import { useI18n } from '../i18n';

interface AuthorsListPageProps {
  summary: SummaryData | null;
}

export function AuthorsListPage({ summary }: AuthorsListPageProps) {
  const location = useLocation();
  const { t } = useI18n();

  if (!summary?.byArtist) {
    return (
      <section className="authors-page" aria-labelledby="authors-title">
        <header className="authors-header">
          <h1 id="authors-title">{t('authors.title')}</h1>
          <p className="authors-intro">{t('authors.loading')}</p>
        </header>
      </section>
    );
  }

  // Trier les auteurs par nombre d'icônes (décroissant)
  const sortedAuthors = Object.entries(summary.byArtist)
    .sort(([, a], [, b]) => (b as number) - (a as number));

  const totalIcons = summary.total || 0;
  const totalAuthors = sortedAuthors.length;

  return (
    <section className="authors-page" aria-labelledby="authors-title">
      <header className="authors-header">
        <h1 id="authors-title">{t('authors.title')}</h1>
        <p className="authors-intro">
          {t('authors.intro', { count: totalAuthors, total: totalIcons })}
        </p>
      </header>

      <div className="authors-grid" role="list">
        {sortedAuthors.map(([artist, count]) => {
          const countNum = count as number;
          const isActive = location.pathname === `/authors/${encodeURIComponent(artist)}`;

          return (
            <article
              key={artist}
              className={`author-card ${isActive ? 'is-active' : ''}`}
              role="listitem"
            >
              <Link
                to={`/authors/${encodeURIComponent(artist)}`}
                className="author-link"
                aria-current={isActive ? 'page' : undefined}
              >
                <div className="author-avatar" aria-hidden="true">
                  {artist.charAt(0).toUpperCase()}
                </div>
                <div className="author-info">
                  <h2 className="author-name">{artist}</h2>
                  <span className="author-count" aria-label={t('common.iconsCount', { count: countNum })}>
                    {countNum.toLocaleString('fr-FR')} icône{countNum > 1 ? 's' : ''}
                  </span>
                </div>
                <svg className="author-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </article>
          );
        })}
      </div>

      {sortedAuthors.length === 0 && (
        <div className="authors-empty">
          <p>{t('authors.empty')}</p>
        </div>
      )}
    </section>
  );
}