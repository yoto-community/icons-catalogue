/**
 * Surface de dessin accessible de l'éditeur 16×16 (L2).
 *
 * C'est un **DOM `role="grid"`**, pas un `<canvas>` (cf. étude §7.2/§7.3) :
 * 16 lignes × 16 `gridcell`, roving tabindex, flèches avec bouclage, Entrée /
 * Espace pour peindre. Le `<canvas>` n'intervient que pour l'aperçu/export
 * (`EditorPreview`). Chaque cellule est libellée par ses **coordonnées et sa
 * couleur** afin que l'information ne dépende pas de la seule couleur
 * (WCAG 1.4.1).
 */

import { useRef, useState } from 'react';
import { GRID_SIZE } from '../../constants/editor';
import { useI18n } from '../../i18n';
import {
  getPixel,
  rgbaToHex,
  type EditorTool,
  type PixelGrid,
  type Rgba,
} from '../../utils/pixelEditor';
import { isActivationKey, moveFocus, type FocusPosition } from '../../utils/editorKeyboard';

interface PixelGridEditorProps {
  /** Grille RGBA projetée (source de vérité côté état). */
  grid: PixelGrid;
  /** Outil actif (pilote le curseur de la souris via `data-tool`). */
  tool: EditorTool;
  /** Applique l'outil actif au pixel `(x, y)`. */
  onPaint: (x: number, y: number) => void;
}

/** Couleur de remplissage CSS d'un pixel RGBA. */
function cssColor(pixel: Rgba): string {
  return `rgba(${pixel[0]}, ${pixel[1]}, ${pixel[2]}, ${pixel[3] / 255})`;
}

export function PixelGridEditor({ grid, tool, onPaint }: PixelGridEditorProps) {
  const { t } = useI18n();
  const [focus, setFocus] = useState<FocusPosition>({ x: 0, y: 0 });
  // Suit un tracé au pointeur : peint tant que le bouton reste enfoncé.
  const paintingRef = useRef(false);
  const cellsRef = useRef<(HTMLDivElement | null)[]>([]);

  function handleKeyDown(event: React.KeyboardEvent, x: number, y: number) {
    if (isActivationKey(event.key)) {
      event.preventDefault();
      onPaint(x, y);
      return;
    }

    const current = { x, y };
    const next = moveFocus(current, event.key);
    if (next === current) return; // touche non gérée : on laisse remonter l'événement.

    event.preventDefault();
    setFocus(next);
    cellsRef.current[next.y * GRID_SIZE + next.x]?.focus();
  }

  function stopPainting() {
    paintingRef.current = false;
  }

  return (
    <div
      className="pixel-grid"
      role="grid"
      aria-label={t('editor.grid.ariaLabel')}
      aria-rowcount={GRID_SIZE}
      aria-colcount={GRID_SIZE}
      data-tool={tool}
      onPointerUp={stopPainting}
      onPointerLeave={stopPainting}
    >
      {Array.from({ length: GRID_SIZE }, (_, y) => (
        <div key={y} className="pixel-grid-row" role="row" aria-rowindex={y + 1}>
          {Array.from({ length: GRID_SIZE }, (_, x) => {
            const pixel = getPixel(grid, x, y) as Rgba;
            const index = y * GRID_SIZE + x;
            const isFocused = focus.x === x && focus.y === y;
            const colorLabel = pixel[3] === 0 ? t('editor.color.empty') : rgbaToHex(pixel);

            return (
              <div
                key={x}
                ref={(element) => {
                  cellsRef.current[index] = element;
                }}
                role="gridcell"
                aria-colindex={x + 1}
                aria-label={t('editor.grid.cellAria', {
                  row: y + 1,
                  col: x + 1,
                  color: colorLabel,
                })}
                tabIndex={isFocused ? 0 : -1}
                className="pixel-grid-cell"
                style={{ backgroundColor: cssColor(pixel) }}
                onPointerDown={(event) => {
                  event.preventDefault();
                  paintingRef.current = true;
                  onPaint(x, y);
                }}
                onPointerOver={() => {
                  if (paintingRef.current) onPaint(x, y);
                }}
                onKeyDown={(event) => handleKeyDown(event, x, y)}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}
