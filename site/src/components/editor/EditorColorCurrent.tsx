/**
 * Couleur courante de l'éditeur (palette).
 *
 * Rend visible la couleur active sur un **damier** (l'alpha reste perceptible)
 * et permet de régler son **opacité** (0–100 %) avec un curseur. Le pourcentage
 * est reporté dans la valeur accessible (`aria-valuetext`) pour être annoncé
 * correctement par les lecteurs d'écran.
 */

import { useI18n } from '../../i18n';
import type { Rgba } from '../../utils/pixelEditor';

interface EditorColorCurrentProps {
  /** Couleur active. */
  color: Rgba;
  /** Sélection d'une couleur modifiée (alpha compris). */
  onSelect: (color: Rgba) => void;
}

/** Convertit un canal alpha (0–255) en pourcentage d'opacité (0–100). */
function alphaToPercent(alpha: number): number {
  return Math.round((alpha / 255) * 100);
}

export function EditorColorCurrent({ color, onSelect }: EditorColorCurrentProps) {
  const { t } = useI18n();
  const percent = alphaToPercent(color[3]);
  const fill = `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${color[3] / 255})`;

  return (
    <div className="editor-color-current" role="group" aria-label={t('editor.palette.current')}>
      <div className="editor-color-preview">
        <span className="editor-color-well" aria-hidden="true">
          <span className="editor-color-well-fill" style={{ backgroundColor: fill }} />
        </span>
        <span className="editor-color-opacity-value">{`${percent} %`}</span>
      </div>

      <label className="editor-color-opacity">
        <span>{t('editor.palette.opacity')}</span>
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={percent}
          aria-valuetext={`${percent} %`}
          onChange={(event) => {
            const next = Math.round((Number(event.target.value) / 100) * 255);
            onSelect([color[0], color[1], color[2], next]);
          }}
        />
      </label>
    </div>
  );
}
