/**
 * Barre d'outils de dessin de l'éditeur (L2) : crayon, gomme, remplissage, pipette.
 *
 * L'outil actif est marqué `aria-pressed` (état exposé autrement que par la
 * couleur). Les actions d'historique (annuler/rétablir/effacer) vivent dans
 * `EditorHistoryBar`, en haut de page.
 */

import { useI18n } from '../../i18n';
import type { EditorTool } from '../../utils/pixelEditor';

interface EditorToolbarProps {
  /** Outil actif. */
  tool: EditorTool;
  onToolChange: (tool: EditorTool) => void;
}

const TOOLS: { tool: EditorTool; labelKey: string; icon: string }[] = [
  { tool: 'pencil', labelKey: 'editor.tools.pencil', icon: '✏️' },
  { tool: 'eraser', labelKey: 'editor.tools.eraser', icon: '🧽' },
  { tool: 'fill', labelKey: 'editor.tools.fill', icon: '🪣' },
  { tool: 'picker', labelKey: 'editor.tools.picker', icon: '💧' },
];

export function EditorToolbar({ tool, onToolChange }: EditorToolbarProps) {
  const { t } = useI18n();

  return (
    <div className="editor-toolbar" role="toolbar" aria-label={t('editor.tools.ariaLabel')}>
      {TOOLS.map(({ tool: value, labelKey, icon }) => (
        <button
          key={value}
          type="button"
          className={`editor-tool ${tool === value ? 'is-active' : ''}`}
          aria-pressed={tool === value}
          onClick={() => onToolChange(value)}
        >
          <span aria-hidden="true">{icon}</span>
          <span className="editor-tool-label">{t(labelKey)}</span>
        </button>
      ))}
    </div>
  );
}
