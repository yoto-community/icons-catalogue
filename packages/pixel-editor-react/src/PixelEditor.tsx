/**
 * Composeur de l'éditeur d'icônes 16×16 (L2).
 *
 * Assemble les briques pures (L1) et les composants d'interface :
 * - l'état vit dans `usePixelEditor` (réducteur pur `editorReducer`) ;
 * - le brouillon est auto-sauvegardé par `useEditorDraft` (exigence E5) ;
 * - les raccourcis clavier globaux (outils, couleurs 1–9, Ctrl+Z) sont captés
 *   sur le conteneur, **sauf** depuis un champ de saisie ;
 * - l'export se fait par un lien `download` sur une data URL PNG, sans serveur.
 *
 * Le composant est **autonome** vis-à-vis de l'hôte : la langue vient de `t` ou
 * de `messages` (aucun couplage au système i18n du catalogue), la clé de
 * brouillon est injectable, et le mode `compact` masque les actions globales.
 */

import { useEffect, useMemo, useRef } from 'react';
import {
  DRAFT_STORAGE_KEY,
  EDITOR_EXPORT_FILENAME,
  EDITOR_PALETTE,
  createGrid,
  encodePngDataUrl,
  hexToRgba,
  isEmpty,
  paletteIndexForShortcut,
  toolForShortcut,
  type PixelGrid,
} from '@yoto-community/pixel-editor-core';
import { EditorMessagesProvider, useEditorT } from './EditorMessagesContext';
import { createTranslator, type EditorMessages, type Translate } from './messages';
import { useEditorDraft } from './useEditorDraft';
import { useImageImport } from './useImageImport';
import { usePixelEditor } from './usePixelEditor';
import { EditorImportPanel } from './EditorImportPanel';
import { EditorHistoryBar } from './EditorHistoryBar';
import { EditorPalette } from './EditorPalette';
import { EditorPreview } from './EditorPreview';
import { EditorStatus } from './EditorStatus';
import { EditorToolbar } from './EditorToolbar';
import { PixelGridEditor } from './PixelGridEditor';

export interface PixelEditorProps {
  /** Grille de départ (ex. reprise d'une icône du catalogue). Vide par défaut. */
  initialGrid?: PixelGrid;
  /**
   * URL d'image à importer au montage (option B : « Retoucher dans l'éditeur »
   * depuis une icône officielle). Importée une seule fois, sans bloquer le rendu.
   */
  initialImageUrl?: string;
  /** Dictionnaire de messages de l'éditeur (`en`/`fr` fournis par le paquet). */
  messages?: EditorMessages;
  /** Traducteur complet de l'hôte ; prioritaire sur `messages`. */
  t?: Translate;
  /** Clé `localStorage` du brouillon (`yoto-icons-editor-draft` par défaut). */
  storageKey?: string;
  /** Mode compact : masque les actions « Télécharger le PNG » / « Nouvelle icône ». */
  compact?: boolean;
  /** Masque explicitement les actions globales (`false`). Ignoré si `compact`. */
  showActions?: boolean;
  /** Notifié à chaque modification de la grille (pas au montage). */
  onChange?: (grid: PixelGrid) => void;
  /** Remplace le téléchargement intégré : reçoit la data URL PNG. */
  onExport?: (dataUrl: string) => void;
}

export function PixelEditor({
  initialGrid,
  initialImageUrl,
  messages,
  t: providedT,
  storageKey = DRAFT_STORAGE_KEY,
  compact = false,
  showActions = true,
  onChange,
  onExport,
}: PixelEditorProps) {
  const contextT = useEditorT();
  const t = useMemo(
    () => providedT ?? (messages ? createTranslator(messages) : contextT),
    [providedT, messages, contextT]
  );

  const { state, dispatch, canUndo, canRedo } = usePixelEditor(initialGrid);
  const { restoredDraft, hasDraft, clear } = useEditorDraft(state.grid, undefined, storageKey);
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

  // Notifie l'hôte des changements réels (le montage ne déclenche rien).
  const notifiedGridRef = useRef(state.grid);
  useEffect(() => {
    if (notifiedGridRef.current === state.grid) return;
    notifiedGridRef.current = state.grid;
    onChange?.(state.grid);
  }, [state.grid, onChange]);

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
    const dataUrl = encodePngDataUrl(state.grid);
    if (onExport) {
      onExport(dataUrl);
      return;
    }
    const anchor = document.createElement('a');
    anchor.href = dataUrl;
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

  const actionsVisible = showActions && !compact;

  return (
    <EditorMessagesProvider t={t}>
      <div
        className="pixel-editor"
        data-compact={compact ? 'true' : undefined}
        onKeyDown={handleKeyDown}
      >
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

            {actionsVisible && (
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
            )}
          </aside>
        </div>
      </div>
    </EditorMessagesProvider>
  );
}
