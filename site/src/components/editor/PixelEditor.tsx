/**
 * Composeur de l'éditeur d'icônes 16×16 (L2).
 *
 * Assemble les briques pures (L1) et les composants d'interface :
 * - l'état vit dans `usePixelEditor` (réducteur pur `editorReducer`) ;
 * - le brouillon est auto-sauvegardé par `useEditorDraft` (exigence E5) ;
 * - les raccourcis clavier globaux (outils, couleurs 1–9, Ctrl+Z) sont captés
 *   sur le conteneur, **sauf** depuis un champ de saisie ;
 * - l'export se fait par un lien `download` sur une data URL PNG, sans serveur.
 */

import { useEffect, useRef } from 'react';
import { EDITOR_EXPORT_FILENAME, EDITOR_PALETTE } from '../../constants/editor';
import { useI18n } from '../../i18n';
import { useEditorDraft } from '../../hooks/useEditorDraft';
import { useImageImport } from '../../hooks/useImageImport';
import { usePixelEditor } from '../../hooks/usePixelEditor';
import { encodePngDataUrl } from '../../utils/pngExport';
import { createGrid, hexToRgba, isEmpty, type PixelGrid } from '../../utils/pixelEditor';
import { paletteIndexForShortcut, toolForShortcut } from '../../utils/editorKeyboard';
import { EditorImportPanel } from './EditorImportPanel';
import { EditorHistoryBar } from './EditorHistoryBar';
import { EditorPalette } from './EditorPalette';
import { EditorPreview } from './EditorPreview';
import { EditorStatus } from './EditorStatus';
import { EditorToolbar } from './EditorToolbar';
import { PixelGridEditor } from './PixelGridEditor';

interface PixelEditorProps {
  /** Grille de départ (ex. reprise d'une icône du catalogue). Vide par défaut. */
  initialGrid?: PixelGrid;
  /**
   * URL d'image à importer au montage (option B : « Retoucher dans l'éditeur »
   * depuis une icône officielle). Importée une seule fois, sans bloquer le rendu.
   */
  initialImageUrl?: string;
}

export function PixelEditor({ initialGrid, initialImageUrl }: PixelEditorProps) {
  const { t } = useI18n();
  const { state, dispatch, canUndo, canRedo } = usePixelEditor(initialGrid);
  const { restoredDraft, hasDraft, clear } = useEditorDraft(state.grid);
  const { isLoading, error, importBlob, importUrl } = useImageImport();

  // Reprise du brouillon : une seule fois, et seulement sans grille imposée.
  const loadedRef = useRef(false);
  useEffect(() => {
    if (loadedRef.current || initialGrid || !restoredDraft) return;
    loadedRef.current = true;
    dispatch({ type: 'load', grid: restoredDraft });
  }, [initialGrid, restoredDraft, dispatch]);

  // Import initial par URL (option B) : une seule tentative, au montage.
  const urlImportedRef = useRef(false);
  useEffect(() => {
    if (urlImportedRef.current || !initialImageUrl) return;
    urlImportedRef.current = true;
    void importUrl(initialImageUrl).then((grid) => {
      if (grid) dispatch({ type: 'load', grid });
    });
  }, [initialImageUrl, importUrl, dispatch]);

  function handleFile(blob: Blob) {
    void importBlob(blob).then((grid) => {
      if (grid) dispatch({ type: 'load', grid });
    });
  }

  function handleKeyDown(event: React.KeyboardEvent) {
    const target = event.target as HTMLElement | null;
    if (target?.closest('input, textarea, select')) return;

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
      event.preventDefault();
      dispatch({ type: event.shiftKey ? 'redo' : 'undo' });
      return;
    }

    const tool = toolForShortcut(event.key);
    if (tool) {
      dispatch({ type: 'setTool', tool });
      return;
    }

    const index = paletteIndexForShortcut(event.key);
    if (index !== null) {
      const hex = EDITOR_PALETTE[index];
      const parsed = hex ? hexToRgba(hex) : null;
      if (parsed) dispatch({ type: 'setColor', color: parsed });
    }
  }

  function handleDownload() {
    const anchor = document.createElement('a');
    anchor.href = encodePngDataUrl(state.grid);
    anchor.download = EDITOR_EXPORT_FILENAME;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  }

  function handleNewIcon() {
    dispatch({ type: 'clear' });
    clear();
  }

  function handleDiscardDraft() {
    dispatch({ type: 'load', grid: createGrid() });
    clear();
  }

  return (
    <div className="pixel-editor" onKeyDown={handleKeyDown}>
      <header className="editor-head">
        <h1 className="editor-title">{t('editor.title')}</h1>
        <p className="editor-subtitle">{t('editor.subtitle')}</p>
      </header>

      {hasDraft && (
        <div className="editor-draft-banner">
          <span>{t('editor.draft.restored')}</span>
          <button type="button" className="editor-button" onClick={handleDiscardDraft}>
            {t('editor.draft.discard')}
          </button>
        </div>
      )}

      <EditorHistoryBar
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={() => dispatch({ type: 'undo' })}
        onRedo={() => dispatch({ type: 'redo' })}
        onClear={() => dispatch({ type: 'clear' })}
      />

      <div className="editor-layout">
        <aside className="editor-panel" aria-label={t('editor.panel.ariaLabel')}>
          <EditorToolbar
            tool={state.tool}
            onToolChange={(tool) => dispatch({ type: 'setTool', tool })}
          />

          <EditorPalette
            color={state.color}
            onSelect={(color) => dispatch({ type: 'setColor', color })}
          />

          <EditorImportPanel isLoading={isLoading} error={error} onFile={handleFile} />
        </aside>

        <div className="editor-workspace">
          <PixelGridEditor
            grid={state.grid}
            tool={state.tool}
            onPaint={(x, y) => dispatch({ type: 'apply', x, y })}
          />

          <EditorStatus grid={state.grid} />
        </div>

        <aside className="editor-sidebar">
          <EditorPreview grid={state.grid} />

          <div className="editor-actions">
            <button
              type="button"
              className="editor-button editor-button-primary"
              disabled={isEmpty(state.grid)}
              onClick={handleDownload}
            >
              {t('editor.actions.download')}
            </button>
            <button type="button" className="editor-button" onClick={handleNewIcon}>
              {t('editor.actions.newIcon')}
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
