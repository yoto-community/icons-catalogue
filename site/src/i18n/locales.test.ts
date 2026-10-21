import { describe, it, expect } from 'vitest';
import fr from './locales/fr.json';
import en from './locales/en.json';

/**
 * Garde-fou de cohérence des traductions embarquées (source unique de vérité).
 *
 * Ces tests ne couvrent que ce qui est vérifiable sans lire le disque :
 * parité des clés et absence de valeur vide. Le contrôle « toute clé
 * `t('…')` utilisée existe » est fait par `scripts/check-i18n-keys.mjs`
 * (`pnpm run check:i18n`), qui scanne les sources en Node.
 */

type Tree = { [key: string]: string | Tree };

function flatten(obj: Tree, prefix = '', out: Record<string, string> = {}): Record<string, string> {
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object') {
      flatten(value, fullKey, out);
    } else {
      out[fullKey] = value as string;
    }
  }
  return out;
}

const frStrings = flatten(fr as Tree);
const enStrings = flatten(en as Tree);

describe('i18n — cohérence des fichiers de traduction', () => {
  it('fr et en exposent exactement les mêmes clés', () => {
    expect(Object.keys(frStrings).sort()).toEqual(Object.keys(enStrings).sort());
  });

  it('aucune valeur de traduction vide', () => {
    for (const [key, value] of Object.entries({ ...frStrings, ...enStrings })) {
      expect(value.trim(), `valeur vide pour ${key}`).not.toBe('');
    }
  });
});
