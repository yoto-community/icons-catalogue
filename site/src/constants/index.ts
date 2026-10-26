export const ICONS_PER_PAGE = 48;
export const DEBOUNCE_MS = 80;

/**
 * Base publique du catalogue. Source unique de vérité, alignée sur le `base`
 * de `vite.config.ts` : tous les chemins d'API en découlent (évite les URL en
 * dur qui divergent, ex. `/icons-catalogue/dist/...`).
 */
export const CATALOGUE_BASE = '/icons-catalogue';
/** Manifeste publié (`index.json`) : sources, compteurs, catalogVersion. */
export const MANIFEST_URL = `${CATALOGUE_BASE}/index.json`;
/** URL du shard JSON d'une source publiée. */
export function sourceShardUrl(source: string): string {
  return `${CATALOGUE_BASE}/icons-by-source/${source}.json`;
}

export * from './categories';
export * from './editor';
export * from './filters';
