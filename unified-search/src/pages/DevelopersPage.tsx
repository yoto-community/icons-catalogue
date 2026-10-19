import { useI18n } from '../i18n';

/**
 * Développeurs — Documentation de l'API et des endpoints.
 *
 * Cette page documente les points d'entrée de données, les schémas de réponse,
 * les exemples de code et les bonnes pratiques pour utiliser les icônes
 * du catalogue Yoto dans vos applications.
 */
export function DevelopersPage() {
  const { t } = useI18n();

  return (
    <section className="dev-page" aria-labelledby="dev-title">
      <header className="dev-header">
        <h1 id="dev-title">{t('dev.title')}</h1>
        <p className="dev-description">
          {t('dev.description')}
        </p>
      </header>

      <section className="dev__section">
        <h2>{t('dev.quickstartTitle')}</h2>
        <p>{t('dev.quickstartContent')}</p>
      </section>

      <section className="dev__section">
        <h2>{t('dev.endpointsTitle')}</h2>
        <p>{t('dev.endpointsIntro')}</p>
        <ul>
          <li>
            <strong>GET /summary.json</strong> - {t('dev.endpointSummaryFilesDesc')}
          </li>
          <li>
            <strong>GET /search-index.json</strong> - {t('dev.endpointSearchIndexDesc')}
          </li>
          <li>
            <strong>GET /icons.json</strong> - {t('dev.endpointCombinedDesc')}
          </li>
        </ul>
        <p className="note">
          {t('dev.corsNote')}
          {t('dev.methodsNote')}
        </p>
      </section>

      <section className="dev__section">
        <h2>{t('dev.schemasTitle')}</h2>
        <p>{t('dev.schemaIconDesc')}</p>
        <p>{t('dev.schemaSummaryDesc')}</p>
      </section>

      <section className="dev__section">
        <h2>{t('dev.codeExamplesTitle')}</h2>
        <p>{t('dev.codeExamplesContent')}</p>
      </section>

      <section className="dev__section">
        <h2>{t('dev.performanceTitle')}</h2>
        <p>{t('dev.performanceContent')}</p>
      </section>

      <section className="dev__section">
        <h2>{t('dev.versioningTitle')}</h2>
        <p>{t('dev.versioningContent')}</p>
        <p>{t('dev.stabilityContent')}</p>
      </section>

      <section className="dev__section">
        <h2>{t('dev.licenceTitle')}</h2>
        <p>{t('dev.licenceContent')}</p>
        <p><strong>{t('dev.attributionLabel')}:</strong> {t('dev.attributionContent')}</p>
        <p><strong>{t('dev.contentsLabel')}:</strong> {t('dev.contentsContent')}</p>
      </section>

      <section className="dev__section">
        <h2>{t('dev.resourcesTitle')}</h2>
        <ul>
          <li>
            <a href="https://github.com/yoto-community/icons-catalogue/tree/main/unified-search/src/pages/api">
              {t('dev.resourceApiSource')}
            </a>
            &mdash; {t('dev.resourceApiSourceDesc')}
          </li>
          <li>
            <a href="https://github.com/yoto-community/icons-catalogue/blob/main/unified-search/src/types/index.ts">
              {t('dev.resourceTypes')}
            </a>
            &mdash; {t('dev.resourceTypesDesc')}
          </li>
          <li>
            <a href="https://github.com/yoto-community/icons-catalogue/issues">
              {t('dev.resourceReportBug')}
            </a>
            &mdash; {t('dev.resourceReportBugDesc')}
          </li>
          <li>
            <a href="/icons-catalogue/dist/summary.json">
              {t('dev.resourceLiveManifest')}
            </a>
          </li>
          <li>
            <a href="/icons-catalogue/dist/search-index.json">
              {t('dev.resourceLiveSearchIndex')}
            </a>
          </li>
        </ul>
      </section>
    </section>
  );
}