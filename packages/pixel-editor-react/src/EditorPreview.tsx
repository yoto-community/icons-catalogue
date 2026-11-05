/**
 * Aperçu de l'icône en cours (L2).
 *
 * Le rendu se fait via une **data URL PNG** produite par l'encodeur maison
 * (`@yoto-community/pixel-editor-core`) : pas de `<canvas>` ni d'`URL.createObjectURL`, ce qui
 * le rend fonctionnel en jsdom et sans fuite de ressource.
 */

import { useMemo } from 'react';
import { useEditorT } from './EditorMessagesContext';
import { encodePngDataUrl } from '@yoto-community/pixel-editor-core';
import type { PixelGrid } from '@yoto-community/pixel-editor-core';

interface EditorPreviewProps {
  grid: PixelGrid;
}

export function EditorPreview({ grid }: EditorPreviewProps) {
  const t = useEditorT();
  const src = useMemo(() => encodePngDataUrl(grid), [grid]);

  return (
    <section className="editor-preview" aria-label={t('editor.preview.ariaLabel')}>
      <h3 className="editor-preview-title">{t('editor.preview.title')}</h3>
      <div className="editor-preview-frame">
        <img src={src} alt={t('editor.preview.title')} width={128} height={128} decoding="async" />
      </div>
    </section>
  );
}
