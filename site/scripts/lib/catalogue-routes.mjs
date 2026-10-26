/**
 * Construction de la liste des routes « découvrables » du catalogue
 * (sitemap + prerender des coquilles HTML par route).
 *
 * Module **pur** (aucune E/S) partagé par `generate-sitemap.mjs` et
 * `prerender-routes.mjs` : une seule source de vérité pour les URL, titres,
 * descriptions, priorités et données structurées JSON-LD.
 *
 * Les libellés de catégories proviennent de `src/i18n/locales/fr.json`
 * (`categoryLabels`), comme le front — pas de duplication de la taxonomie.
 */

/** Base publiée (GitHub Pages du dépôt yoto-community/icons-catalogue). */
export const BASE_URL = 'https://yoto-community.github.io/icons-catalogue';

/** URL absolue d'une route (chemin sans slash initial). */
export function urlFor(path) {
  return path ? `${BASE_URL}/${path}` : `${BASE_URL}/`;
}

function webSite() {
  return { '@type': 'WebSite', name: 'Yoto Icons Catalogue', url: `${BASE_URL}/` };
}

function breadcrumb(items) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: urlFor(item.path),
    })),
  };
}

/**
 * Construit la liste des routes.
 *
 * @param {object} params
 * @param {object} params.summary        `summary.json` (compteurs).
 * @param {Record<string,string>} params.categoryLabels Libellés fr par slug.
 * @returns {Array<{path:string,title:string,description:string,priority:string,changefreq:string,jsonLd:object}>}
 */
export function buildCatalogueRoutes({ summary, categoryLabels = {} }) {
  const total = summary.total ?? 0;
  const byCategory = summary.counts?.byCategory ?? {};
  const byArtist = summary.counts?.byArtist ?? {};
  const categoryIds = Object.keys(byCategory).sort();

  const label = (id) => categoryLabels[id] ?? id;

  const routes = [
    {
      path: 'categories',
      title: 'Catégories d’icônes Yoto',
      description: `Parcourez les ${categoryIds.length} catégories d’icônes 16×16 pour Yoto Player (${total} icônes).`,
      priority: '0.8',
      changefreq: 'weekly',
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'Catégories d’icônes Yoto',
        url: urlFor('categories'),
        isPartOf: webSite(),
        breadcrumb: breadcrumb([{ name: 'Catalogue', path: '' }]),
      },
    },
    {
      path: 'authors',
      title: 'Artistes',
      description: `${Object.keys(byArtist).length} artistes ayant publié des icônes 16×16 pour Yoto Player.`,
      priority: '0.6',
      changefreq: 'weekly',
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'Artistes',
        url: urlFor('authors'),
        isPartOf: webSite(),
      },
    },
    {
      path: 'sources',
      title: 'Sources & licences',
      description:
        'Provenance, licences et attribution des icônes (yotopixels, yotoicons, yoto-official).',
      priority: '0.5',
      changefreq: 'monthly',
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: 'Sources & licences',
        url: urlFor('sources'),
        isPartOf: webSite(),
      },
    },
    {
      path: 'developers',
      title: 'API statique',
      description: 'Endpoints JSON statiques du catalogue d’icônes Yoto (manifeste, shards).',
      priority: '0.4',
      changefreq: 'monthly',
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: 'API statique',
        url: urlFor('developers'),
        isPartOf: webSite(),
      },
    },
  ];

  for (const id of categoryIds) {
    const name = label(id);
    const count = byCategory[id] ?? 0;
    routes.push({
      path: `categories/${id}`,
      title: `${name} — icônes Yoto 16×16`,
      description: `${count} icônes 16×16 « ${name} » pour Yoto Player : recherche, aperçu et téléchargement.`,
      priority: '0.6',
      changefreq: 'weekly',
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: `${name} — icônes Yoto`,
        description: `${count} icônes 16×16 de la catégorie ${name}.`,
        url: urlFor(`categories/${id}`),
        isPartOf: webSite(),
        breadcrumb: breadcrumb([
          { name: 'Catalogue', path: '' },
          { name: 'Catégories', path: 'categories' },
        ]),
      },
    });
  }

  for (const [artist, count] of Object.entries(byArtist)) {
    if (typeof artist !== 'string' || artist.trim() === '') continue;
    const segment = encodeURIComponent(artist);
    // Segment non représentable de façon fiable comme dossier statique : on
    // l'omet (les liens internes restent fonctionnels via le repli SPA).
    if (segment === '.' || segment === '..' || segment.includes('%2F') || segment.includes('%5C')) {
      continue;
    }
    routes.push({
      path: `authors/${segment}`,
      title: `${artist} — icônes Yoto 16×16`,
      description: `${count} icônes 16×16 de ${artist} pour Yoto Player.`,
      priority: '0.4',
      changefreq: 'weekly',
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'ProfilePage',
        name: `${artist} — icônes Yoto`,
        url: urlFor(`authors/${segment}`),
        isPartOf: webSite(),
        mainEntity: { '@type': 'Person', name: artist },
      },
    });
  }

  return routes;
}
