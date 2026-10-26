/**
 * État de l'icône (L2) : nombre de couleurs, avertissements de lisibilité.
 *
 * Zone `aria-live="polite"` (étude §7.4) : les changements sont annoncés sans
 * interrompre l'utilisateur. Les messages sont explicites (pas de simple code
 * couleur) : icône vide, noir pur (invisible sur le fond du Player), excès de
 * couleurs.
 */

import { COLOR_COUNT_WARN } from '../../constants/editor';
import { useI18n } from '../../i18n';
import { countColors, hasPureBlack, isEmpty, type PixelGrid } from '../../utils/pixelEditor';

interface EditorStatusProps {
  grid: PixelGrid;
}

export function EditorStatus({ grid }: EditorStatusProps) {
  const { t } = useI18n();
  const empty = isEmpty(grid);
  const colors = countColors(grid);
  const warnsBlack = !empty && hasPureBlack(grid);
  const warnsMany = colors > COLOR_COUNT_WARN;

  return (
    <p
      className="editor-status"
      role="status"
      aria-live="polite"
      aria-label={t('editor.status.ariaLabel')}
    >
      <span className="editor-status-part">
        {empty ? t('editor.status.empty') : t('editor.status.colors', { count: colors })}
      </span>
      {warnsBlack && (
        <span className="editor-status-part editor-status-warning">
          {t('editor.status.pureBlack')}
        </span>
      )}
      {warnsMany && (
        <span className="editor-status-part editor-status-warning">
          {t('editor.status.tooManyColors', { count: COLOR_COUNT_WARN })}
        </span>
      )}
    </p>
  );
}
