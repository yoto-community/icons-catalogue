import { Link } from 'react-router-dom';
import type { SummaryData } from '../types';
import { useI18n } from '../i18n';
import { SOURCE_META } from '../constants/sources';
import { getSourceLabel, getLicenseLabel } from '../constants/filters';

interface SourcesPageProps {
  summary: SummaryData | null;
}

/**
 * Sources — page « à propos des données » : provenance, licence et attribution
 * des icônes. Destinée au public utilisateur, elle se distingue de
 * `/developers` (usage de l'API) auquel elle renvoie.
 *
 * Aucun fetch : les compteurs proviennent du `summary` déjà chargé par
 * `IconsDataContext` (même contrat de props que `DevelopersPage`).
 */
export function SourcesPage({ summary }: SourcesPageProps) {
  const { t, tRich, locale } = useI18n();
  const numberLocale = locale === 'fr' ? 'fr-FR' : 'en-US';

  const bySource = summary?.counts.bySource ?? {};
  const updatedAt = summary
    ? new Date(summary.updatedAt).toLocaleString(numberLocale, {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : null;

  return (
    <section className="sources-page" aria-labelledby="sources-title">
      <header className="sources-header">
        <h1 id="sources-title">{t('sourcesPage.title')}</h1>
        <p className="sources-description">{t('sourcesPage.description')}</p>
      </header>

      <section className="sources__section" aria-labelledby="sources-list-title">
        <h2 id="sources-list-title">{t('sourcesPage.listTitle')}</h2>
        <ul className="sources-list">
          {SOURCE_META.map((source) => (
            <li key={source.id} className="source-card" data-source={source.id}>
              <div className="source-card__head">
                <h3 className="source-card__name">
                  <a href={source.url} target="_blank" rel="noopener noreferrer">
                    {getSourceLabel(source.id, t)}
                    <span className="source-card__external" aria-hidden="true">
                      {' '}
                      ↗
                    </span>
                  </a>
                </h3>
                <span className="source-card__license">{getLicenseLabel(source.license, t)}</span>
              </div>
              <p className="source-card__desc">{t(`sourcesPage.descriptions.${source.id}`)}</p>
              <p className="source-card__conditions">
                {t(`sourcesPage.conditionNotes.${source.id}`)}
                {source.termsUrl && (
                  <>
                    {' '}
                    <a
                      className="source-card__terms"
                      href={source.termsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {t('sourcesPage.termsLink')}
                      <span aria-hidden="true"> ↗</span>
                    </a>
                  </>
                )}
              </p>
              <dl className="source-card__meta">
                <div className="source-card__stat">
                  <dt>{t('sourcesPage.iconsLabel')}</dt>
                  <dd>{summary ? (bySource[source.id] ?? 0).toLocaleString(numberLocale) : '—'}</dd>
                </div>
                <div className="source-card__stat">
                  <dt>{t('sourcesPage.natureLabel')}</dt>
                  <dd>{t(`sourcesPage.natures.${source.id}`)}</dd>
                </div>
              </dl>
            </li>
          ))}
        </ul>
        <p className="note">{t('sourcesPage.countsNote')}</p>
        <p className="note sources-disclaimer" role="note">
          {t('sourcesPage.rightsDisclaimer')}
        </p>
      </section>

      <section className="sources__section" aria-labelledby="sources-reuse-title">
        <h2 id="sources-reuse-title">{t('sourcesPage.reuseTitle')}</h2>
        <p>{tRich('sourcesPage.reuseContent')}</p>
      </section>

      <section className="sources__section" aria-labelledby="sources-duplicates-title">
        <h2 id="sources-duplicates-title">{t('sourcesPage.duplicatesTitle')}</h2>
        <p>{tRich('sourcesPage.duplicatesContent')}</p>
      </section>

      <section className="sources__section" aria-labelledby="sources-more-title">
        <h2 id="sources-more-title">{t('sourcesPage.moreTitle')}</h2>
        {updatedAt && <p>{t('sourcesPage.updatedAt', { date: updatedAt })}</p>}
        <p>{t('sourcesPage.updatedWeekly')}</p>
        <ul className="sources-links">
          <li>
            <Link to="/developers">{t('sourcesPage.devLink')}</Link>
          </li>
          <li>
            <a
              href="https://github.com/yoto-community/icons-catalogue/tree/main/scripts"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('sourcesPage.repoLink')}
            </a>
          </li>
        </ul>
      </section>
    </section>
  );
}
