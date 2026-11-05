import { describe, it, expect } from 'vitest';
import { createTranslator, en, fr } from '../src/messages';

describe('createTranslator', () => {
  it('interpole les variables à accolades simples', () => {
    const t = createTranslator({ 'editor.grid.cellAria': 'Row {row}, column {col}, {color}' });

    expect(t('editor.grid.cellAria', { row: 3, col: 4, color: 'vide' })).toBe(
      'Row 3, column 4, vide'
    );
  });

  it('évalue les pluriels conditionnels', () => {
    const t = createTranslator(fr);

    expect(t('editor.status.colors', { count: 1 })).toBe('1 couleur');
    expect(t('editor.status.colors', { count: 2 })).toBe('2 couleurs');
  });

  it('accorde les pluriels anglais', () => {
    const t = createTranslator(en);

    expect(t('editor.status.colors', { count: 1 })).toBe('1 colour');
    expect(t('editor.status.colors', { count: 3 })).toBe('3 colours');
  });

  it('renvoie la clé (et garde les variables visibles) si le message manque', () => {
    const t = createTranslator({});

    expect(t('editor.inconnu', { count: 2 })).toBe('editor.inconnu');
    expect(t('editor.grid.cellAria', { row: 1 })).toBe('editor.grid.cellAria');
  });

  it('laisse une variable non fournie visible', () => {
    const t = createTranslator({ greets: 'Bonjour {name}!' });

    expect(t('greets')).toBe('Bonjour {name}!');
  });

  it('expose les mêmes clés en français et en anglais', () => {
    expect(Object.keys(fr).sort()).toEqual(Object.keys(en).sort());
  });

  it('couvre toutes les clés utilisées par les composants', () => {
    const used = [
      'editor.title',
      'editor.subtitle',
      'editor.panel.ariaLabel',
      'editor.tools.ariaLabel',
      'editor.tools.pencil',
      'editor.tools.eraser',
      'editor.tools.fill',
      'editor.tools.picker',
      'editor.tools.undo',
      'editor.tools.redo',
      'editor.tools.clear',
      'editor.palette.ariaLabel',
      'editor.palette.customLabel',
      'editor.palette.current',
      'editor.palette.opacity',
      'editor.grid.ariaLabel',
      'editor.grid.cellAria',
      'editor.color.empty',
      'editor.preview.ariaLabel',
      'editor.preview.title',
      'editor.status.ariaLabel',
      'editor.status.colors',
      'editor.status.empty',
      'editor.status.pureBlack',
      'editor.status.tooManyColors',
      'editor.actions.download',
      'editor.actions.newIcon',
      'editor.draft.restored',
      'editor.draft.discard',
      'editor.import.ariaLabel',
      'editor.import.fileLabel',
      'editor.import.fileHint',
      'editor.import.loading',
      'editor.import.errorDecode',
      'editor.import.errorFetch',
      'editor.history.ariaLabel',
    ];

    for (const key of used) {
      expect(en).toHaveProperty(key);
      expect(fr).toHaveProperty(key);
    }
  });
});
