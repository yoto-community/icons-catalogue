import type { SummaryData } from '../types';
import { useI18n } from '../i18n';
import { CATALOGUE_BASE } from '../constants';
import { CodeBlock } from '../components/CodeBlock';

interface DevelopersPageProps {
  summary: SummaryData | null;
}

/**
 * Développeurs — Documentation de l'API statique.
 *
 * Toutes les chaînes contenant du balisage (<code>, <a>) passent par `tRich`
 * (HTML de traduction assaini) ; les chaînes simples par `t`. Les exemples de
 * code utilisent l'origine courante pour rester copiables tels quels, aussi
 * bien en local qu'en production.
 */
export function DevelopersPage({ summary }: DevelopersPageProps) {
  const { t, tRich, locale } = useI18n();

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const baseUrl = `${origin}${CATALOGUE_BASE}`;
  const numberLocale = locale === 'fr' ? 'fr-FR' : 'en-US';

  const curlExample = `# Statistiques du catalogue
curl -s ${baseUrl}/summary.json

# Manifeste (sources et compteurs)
curl -s ${baseUrl}/index.json

# Shard d'une source
curl -O ${baseUrl}/icons-by-source/yotoicons.json`;

  const summaryExample = `const response = await fetch('${CATALOGUE_BASE}/summary.json');
if (!response.ok) throw new Error('Catalogue indisponible');

const summary = await response.json();
console.log(summary.total, 'icônes');
console.log(summary.counts.bySource);`;

  const searchExample = `import lunr from 'lunr';

// Aucun index n'est hébergé : reconstruisez-le depuis le manifeste + les shards.
const manifest = await fetch('${CATALOGUE_BASE}/index.json').then((r) => r.json());

const shards = await Promise.all(
  manifest.sources.map((s) =>
    fetch(\`${CATALOGUE_BASE}/icons-by-source/\${s.id}.json\`).then((r) => r.json())
  )
);
const icons = shards.flat();

const index = lunr(function () {
  this.ref('id');
  this.field('title');
  this.field('tags', { boost: 10 });
  this.field('artist');
  icons.forEach((icon) => this.add(icon));
});

const results = index.search('moon night');
const iconIds = results.map((result) => result.ref);`;

  const sourceCount = summary ? Object.keys(summary.counts.bySource).length : 0;
  const categoryCount = summary ? Object.keys(summary.counts.byCategory).length : 0;

  const updatedAt = summary
    ? new Date(summary.updatedAt).toLocaleString(numberLocale, {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : null;

  return (
    <section className="dev-page" aria-labelledby="dev-title">
      <header className="dev-header">
        <h1 id="dev-title">{t('dev.title')}</h1>
        <p className="dev-description">{t('dev.description')}</p>
      </header>

      <section className="dev__section dev__live" aria-labelledby="dev-live-title">
        <h2 id="dev-live-title">{t('dev.liveTitle')}</h2>
        {summary ? (
          <dl className="dev-stats">
            <div className="dev-stat">
              <dt>{t('dev.statIcons')}</dt>
              <dd>{summary.total.toLocaleString(numberLocale)}</dd>
            </div>
            <div className="dev-stat">
              <dt>{t('dev.statSources')}</dt>
              <dd>{sourceCount}</dd>
            </div>
            <div className="dev-stat">
              <dt>{t('dev.statCategories')}</dt>
              <dd>{categoryCount}</dd>
            </div>
            <div className="dev-stat">
              <dt>{t('dev.statUpdated')}</dt>
              <dd>{updatedAt}</dd>
            </div>
          </dl>
        ) : (
          <p className="dev-live__pending">{t('dev.liveLoading')}</p>
        )}
      </section>

      <section className="dev__section" aria-labelledby="dev-quickstart-title">
        <h2 id="dev-quickstart-title">{t('dev.quickstartTitle')}</h2>
        <p>{tRich('dev.quickstartContent')}</p>
        <p className="dev-base-url">
          <span className="dev-base-url__label">{t('dev.baseUrlLabel')}</span>
          <code>{baseUrl}</code>
        </p>
      </section>

      <section className="dev__section" aria-labelledby="dev-endpoints-title">
        <h2 id="dev-endpoints-title">{t('dev.endpointsTitle')}</h2>
        <p>{t('dev.endpointsIntro')}</p>
        <div className="dev-table-wrapper">
          <table className="dev-table">
            <thead>
              <tr>
                <th scope="col">{t('dev.colMethod')}</th>
                <th scope="col">{t('dev.colEndpoint')}</th>
                <th scope="col">{t('dev.colDescription')}</th>
                <th scope="col">{t('dev.colSize')}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <span className="dev-method">GET</span>
                </td>
                <td>
                  <a
                    className="dev-endpoint"
                    href={`${CATALOGUE_BASE}/summary.json`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {CATALOGUE_BASE}/summary.json
                  </a>
                </td>
                <td>{tRich('dev.endpointSummaryDesc')}</td>
                <td className="dev-table__size">{t('dev.endpointSummarySize')}</td>
              </tr>
              <tr>
                <td>
                  <span className="dev-method">GET</span>
                </td>
                <td>
                  <a
                    className="dev-endpoint"
                    href={`${CATALOGUE_BASE}/index.json`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {CATALOGUE_BASE}/index.json
                  </a>
                </td>
                <td>{tRich('dev.endpointManifestDesc')}</td>
                <td className="dev-table__size">{t('dev.endpointManifestSize')}</td>
              </tr>
              <tr>
                <td>
                  <span className="dev-method">GET</span>
                </td>
                <td>
                  <code className="dev-endpoint">
                    {CATALOGUE_BASE}/icons-by-source/{'{source}'}.json
                  </code>
                </td>
                <td>{tRich('dev.endpointShardsDesc')}</td>
                <td className="dev-table__size">{t('dev.endpointShardsSize')}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="note">{tRich('dev.shardsNote')}</p>
        <p className="note">
          {t('dev.corsNote')}
          {t('dev.methodsNote')}
        </p>
      </section>

      <section className="dev__section" aria-labelledby="dev-schemas-title">
        <h2 id="dev-schemas-title">{t('dev.schemasTitle')}</h2>
        <h3>{t('dev.schemaIconTitle')}</h3>
        <p>{tRich('dev.schemaIconDesc')}</p>
        <h3>{t('dev.schemaSummaryTitle')}</h3>
        <p>{tRich('dev.schemaSummaryDesc')}</p>
      </section>

      <section className="dev__section" aria-labelledby="dev-code-title">
        <h2 id="dev-code-title">{t('dev.codeExamplesTitle')}</h2>
        <p>{tRich('dev.codeExamplesContent')}</p>
        <CodeBlock
          title={t('dev.exampleSummaryTitle')}
          language="javascript"
          code={summaryExample}
        />
        <CodeBlock title={t('dev.exampleSearchTitle')} language="javascript" code={searchExample} />
        <CodeBlock title={t('dev.exampleCurlTitle')} language="bash" code={curlExample} />
      </section>

      <section className="dev__section" aria-labelledby="dev-performance-title">
        <h2 id="dev-performance-title">{t('dev.performanceTitle')}</h2>
        <p>{tRich('dev.performanceContent')}</p>
      </section>

      <section className="dev__section" aria-labelledby="dev-versioning-title">
        <h2 id="dev-versioning-title">{t('dev.versioningTitle')}</h2>
        <p>{tRich('dev.versioningContent')}</p>
        <p>{t('dev.stabilityContent')}</p>
      </section>

      <section className="dev__section" aria-labelledby="dev-licence-title">
        <h2 id="dev-licence-title">{t('dev.licenceTitle')}</h2>
        <p>{tRich('dev.licenceContent')}</p>
        <p>
          <strong>{t('dev.attributionLabel')}:</strong> {t('dev.attributionContent')}
        </p>
        <p>
          <strong>{t('dev.contentsLabel')}:</strong> {t('dev.contentsContent')}
        </p>
      </section>

      <section className="dev__section" aria-labelledby="dev-resources-title">
        <h2 id="dev-resources-title">{t('dev.resourcesTitle')}</h2>
        <ul>
          <li>
            <a href="https://github.com/yoto-community/icons-catalogue/tree/main/scripts">
              {t('dev.resourceApiSource')}
            </a>
            &mdash; {t('dev.resourceApiSourceDesc')}
          </li>
          <li>
            <a href="https://github.com/yoto-community/icons-catalogue/blob/main/site/src/types/index.ts">
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
            <a href={`${CATALOGUE_BASE}/summary.json`}>{t('dev.resourceLiveManifest')}</a>
          </li>
        </ul>
      </section>
    </section>
  );
}
