/**
 * Panneau « Partir d'une icône » (L4, option A).
 *
 * Import d'un **fichier image local** : le `<input type="file">` remonte le
 * fichier choisi, le décodage étant fait ailleurs (`useImageImport`).
 *
 * L'option B (icône officielle en 1 clic) vit dans `PixelEditor`/la fiche
 * d'icône : elle suppose une URL. Ce panneau reste donc purement présentationnel
 * et sans état, ce qui le rend trivialement testable.
 */

import { useI18n } from '../../i18n';

interface EditorImportPanelProps {
  /** Un import est en cours. */
  isLoading: boolean;
  /** Clé i18n de l'erreur d'import, ou `null`. */
  error: string | null;
  /** Fichier local choisi. */
  onFile: (blob: Blob) => void;
}

export function EditorImportPanel({ isLoading, error, onFile }: EditorImportPanelProps) {
  const { t } = useI18n();

  return (
    <section className="editor-import" aria-label={t('editor.import.ariaLabel')}>
      <label className="editor-import-field">
        <span className="editor-import-label">{t('editor.import.fileLabel')}</span>
        <input
          type="file"
          accept="image/*"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onFile(file);
          }}
        />
      </label>
      <p className="editor-import-hint">{t('editor.import.fileHint')}</p>

      {isLoading && <p className="editor-import-loading">{t('editor.import.loading')}</p>}
      {error && (
        <p className="editor-import-error" role="alert">
          {t(error)}
        </p>
      )}
    </section>
  );
}
