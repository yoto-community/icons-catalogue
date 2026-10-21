/**
 * Manifeste publié (`index.json`) : types, garde de forme et ordre de
 * chargement des shards par source (P1.3).
 */
export interface ManifestSource {
  id: string;
  count: number;
}

export interface CatalogueManifest {
  schemaVersion: number;
  catalogVersion: string;
  counts: { total: number };
  sources: ManifestSource[];
}

function isManifestSource(value: unknown): value is ManifestSource {
  if (typeof value !== 'object' || value === null) return false;
  const source = value as Record<string, unknown>;
  return typeof source.id === 'string' && typeof source.count === 'number';
}

/**
 * Garde de forme minimale du manifeste : ce dont le front a besoin pour charger
 * les shards. On tolère les champs supplémentaires (shards par catégorie,
 * `searchIndex`…) que le manifeste décrit mais qui ne sont pas publiés.
 */
export function isCatalogueManifest(value: unknown): value is CatalogueManifest {
  if (typeof value !== 'object' || value === null) return false;
  const manifest = value as Record<string, unknown>;
  if (typeof manifest.schemaVersion !== 'number') return false;
  const counts = manifest.counts as Record<string, unknown> | undefined;
  if (typeof counts?.total !== 'number') return false;
  if (!Array.isArray(manifest.sources) || manifest.sources.length === 0) return false;
  return manifest.sources.every(isManifestSource);
}

/**
 * Ordre de chargement : effectif croissant (afficher vite les petites sources),
 * départage déterministe par `id`. Ne mute pas l'entrée.
 */
export function planSourceOrder(sources: ManifestSource[]): string[] {
  return [...sources]
    .sort((a, b) => a.count - b.count || a.id.localeCompare(b.id))
    .map((source) => source.id);
}
