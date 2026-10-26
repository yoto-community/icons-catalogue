/**
 * Barre d'historique de l'éditeur (L2) : annuler, rétablir et effacer tout.
 *
 * Rendue **en haut de page**, hors du panneau latéral : ce sont des actions
 * globales, pas des outils de dessin. Les actions indisponibles (annuler/rétablir
 * sans historique) sont `disabled`.
 */

import { useI18n } from '../../i18n';

interface EditorHistoryBarProps {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
}

export function EditorHistoryBar({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onClear,
}: EditorHistoryBarProps) {
  const { t } = useI18n();

  return (
    <div className="editor-history" role="toolbar" aria-label={t('editor.history.ariaLabel')}>
      <button type="button" className="editor-tool" disabled={!canUndo} onClick={onUndo}>
        <span aria-hidden="true">↩️</span>
        <span className="editor-tool-label">{t('editor.tools.undo')}</span>
      </button>
      <button type="button" className="editor-tool" disabled={!canRedo} onClick={onRedo}>
        <span aria-hidden="true">↪️</span>
        <span className="editor-tool-label">{t('editor.tools.redo')}</span>
      </button>
      <button type="button" className="editor-tool editor-tool-danger" onClick={onClear}>
        <span aria-hidden="true">🗑️</span>
        <span className="editor-tool-label">{t('editor.tools.clear')}</span>
      </button>
    </div>
  );
}
