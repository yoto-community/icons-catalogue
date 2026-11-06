import { describe, expect, it } from 'vitest';
import {
  PREFS_KEY,
  PREFS_VERSION,
  TOOLKIT_KEY,
  TOOLKIT_VERSION,
  parsePrefs,
  parseToolkit,
  readIconFavorites,
  readPrefs,
  readToolkitWithLegacy,
  resolveTheme,
  syncIconFavorites,
  writePrefs,
  type SharedStorage,
} from './sharedStorage';

const DATE = '2026-11-06';

function memoryStorage(initial: Record<string, string> = {}): SharedStorage & {
  values: Map<string, string>;
} {
  const values = new Map(Object.entries(initial));
  return {
    values,
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value);
    },
  };
}

describe('preferences', () => {
  it('parses a valid shared object and ignores unknown fields', () => {
    expect(parsePrefs(JSON.stringify({ version: 1, theme: 'dark', locale: 'fr' }))).toEqual({
      version: PREFS_VERSION,
      theme: 'dark',
      locale: 'fr',
    });
    expect(parsePrefs(JSON.stringify({ version: 1, theme: 'sepia', locale: 'fr' }))).toEqual({
      version: PREFS_VERSION,
      locale: 'fr',
    });
  });

  it('falls back to the historical icon keys', () => {
    const storage = memoryStorage({ 'yoto-icons-theme': 'dark', locale: 'en' });
    expect(readPrefs(storage)).toEqual({ version: 1, theme: 'dark', locale: 'en' });
  });

  it('writes a merged shared preference without losing the other field', () => {
    const storage = memoryStorage({
      [PREFS_KEY]: JSON.stringify({ version: 1, theme: 'dark', locale: 'fr' }),
    });

    expect(writePrefs({ locale: 'en' }, storage)).toBe(true);
    expect(JSON.parse(storage.values.get(PREFS_KEY) ?? '{}')).toEqual({
      version: 1,
      theme: 'dark',
      locale: 'en',
    });
  });

  it('resolves system, light and dark', () => {
    expect(resolveTheme('system', true)).toBe('dark');
    expect(resolveTheme('system', false)).toBe('light');
    expect(resolveTheme('light', true)).toBe('light');
    expect(resolveTheme('dark', false)).toBe('dark');
  });
});

describe('toolkit', () => {
  it('mirrors historical favourites until the new key exists', () => {
    const storage = memoryStorage({
      'yoto-icons-favorites': JSON.stringify(['icon-a']),
      'yoto-favorites': JSON.stringify(['podcast-a']),
    });

    expect(readToolkitWithLegacy(storage, DATE).items).toEqual([
      { type: 'icon', id: 'icon-a', title: 'icon-a', addedAt: DATE },
      { type: 'podcast', id: 'podcast-a', title: 'podcast-a', addedAt: DATE },
    ]);
  });

  it('uses the new key as the only source once it exists', () => {
    const storage = memoryStorage({
      [TOOLKIT_KEY]: JSON.stringify({
        version: TOOLKIT_VERSION,
        items: [{ type: 'icon', id: 'toolkit-icon', title: 'Toolkit', addedAt: DATE }],
      }),
      'yoto-icons-favorites': JSON.stringify(['legacy-icon']),
    });

    expect(readToolkitWithLegacy(storage, DATE).items).toEqual([
      { type: 'icon', id: 'toolkit-icon', title: 'Toolkit', addedAt: DATE },
    ]);
  });

  it('uses the toolkit as the source of truth once it exists', () => {
    const storage = memoryStorage({
      [TOOLKIT_KEY]: JSON.stringify({
        version: 1,
        items: [{ type: 'icon', id: 'icon-b', title: 'B', addedAt: DATE }],
      }),
      'yoto-icons-favorites': JSON.stringify(['icon-a']),
    });

    expect(readIconFavorites(storage)).toEqual(['icon-b']);
  });

  it('falls back to the historical key before the toolkit exists', () => {
    const storage = memoryStorage({
      'yoto-icons-favorites': JSON.stringify(['icon-a']),
    });

    expect(readIconFavorites(storage)).toEqual(['icon-a']);
  });

  it('replaces icon items with titled favourites and preserves other types', () => {
    const storage = memoryStorage({
      [TOOLKIT_KEY]: JSON.stringify({
        version: 1,
        items: [
          { type: 'icon', id: 'icon-a', title: 'Real A', addedAt: '2026-01-01' },
          { type: 'podcast', id: 'podcast-a', title: 'Podcast', addedAt: DATE },
        ],
      }),
    });

    expect(syncIconFavorites(['icon-a', 'icon-b'], { 'icon-b': 'Real B' }, storage, DATE)).toBe(
      true
    );

    expect(parseToolkit(storage.values.get(TOOLKIT_KEY) ?? null, DATE).items).toEqual([
      { type: 'podcast', id: 'podcast-a', title: 'Podcast', addedAt: DATE },
      { type: 'icon', id: 'icon-a', title: 'Real A', addedAt: '2026-01-01' },
      { type: 'icon', id: 'icon-b', title: 'Real B', addedAt: DATE },
    ]);
  });

  it('keeps historical keys untouched when syncing the toolkit', () => {
    const storage = memoryStorage({
      'yoto-icons-favorites': JSON.stringify(['icon-a']),
      'yoto-favorites': JSON.stringify(['podcast-a']),
    });

    syncIconFavorites(['icon-b'], { 'icon-b': 'B' }, storage, DATE);

    expect(storage.values.get('yoto-icons-favorites')).toBe(JSON.stringify(['icon-a']));
    expect(storage.values.get('yoto-favorites')).toBe(JSON.stringify(['podcast-a']));
  });

  it('never throws when storage is blocked', () => {
    expect(
      syncIconFavorites(
        ['icon-a'],
        {},
        {
          getItem: () => {
            throw new Error('blocked');
          },
          setItem: () => {
            throw new Error('blocked');
          },
        }
      )
    ).toBe(false);
  });
});
