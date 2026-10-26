/**
 * Nuancier de l'éditeur (L2).
 *
 * Chaque pastille est un bouton nommé par son **code hexadécimal** (l'état ne
 * doit pas reposer sur la seule couleur, WCAG 1.4.1) et marqué `aria-pressed`
 * quand il est actif. Un sélecteur de couleur personnalisée complète la palette.
 */

import { EDITOR_PALETTE } from '../../constants/editor';
import { useI18n } from '../../i18n';
import { hexToRgba, rgbaToHex, type Rgba } from '../../utils/pixelEditor';
import { EditorColorCurrent } from './EditorColorCurrent';

interface EditorPaletteProps {
  /** Couleur active. */
  color: Rgba;
  /** Sélection d'une nouvelle couleur. */
  onSelect: (color: Rgba) => void;
}

/** Représente une couleur opaque au format `#rrggbb` attendu par `<input type="color">`. */
function opaqueHex(color: Rgba): string {
  return rgbaToHex([color[0], color[1], color[2], 255]);
}

export function EditorPalette({ color, onSelect }: EditorPaletteProps) {
  const { t } = useI18n();
  // L'activation d'une pastille dépend de la teinte seule : l'opacité (canal
  // alpha) est réglée séparément par le curseur et ne doit pas la faire varier.
  const activeHex = rgbaToHex([color[0], color[1], color[2], 255]);

  /** Applique la teinte choisie en conservant l'opacité courante. */
  const withCurrentAlpha = (rgb: Rgba): Rgba => [rgb[0], rgb[1], rgb[2], color[3]];

  return (
    <div className="editor-palette" role="group" aria-label={t('editor.palette.ariaLabel')}>
      <EditorColorCurrent color={color} onSelect={onSelect} />
      <div className="editor-palette-swatches">
        {EDITOR_PALETTE.map((hex) => {
          const selected = hex === activeHex;
          return (
            <button
              key={hex}
              type="button"
              className={`editor-swatch ${selected ? 'is-active' : ''}`}
              style={{ backgroundColor: hex }}
              aria-label={hex}
              aria-pressed={selected}
              onClick={() => {
                const parsed = hexToRgba(hex);
                if (parsed) onSelect(withCurrentAlpha(parsed));
              }}
            />
          );
        })}
      </div>
      <label className="editor-custom-color">
        <span>{t('editor.palette.customLabel')}</span>
        <input
          type="color"
          value={opaqueHex(color)}
          onChange={(event) => {
            const parsed = hexToRgba(event.target.value);
            if (parsed) onSelect(withCurrentAlpha(parsed));
          }}
        />
      </label>
    </div>
  );
}
