import { useLocation } from 'react-router-dom';
import { PixelEditor, en, fr } from '@yoto-community/pixel-editor-react';
import '@yoto-community/pixel-editor-react/styles.css';
import { useI18n } from '../i18n';
import '../styles/editor-theme.css';

/** État de navigation accepté par la route `/editor` (option B). */
interface EditorLocationState {
  /** URL d'une icône officielle à ouvrir directement dans l'éditeur. */
  initialImageUrl?: string;
}

/** Messages de l'éditeur fournis par le paquet (source unique de vérité). */
const EDITOR_MESSAGES = { fr, en };

/**
 * Page « Éditeur d'icônes » (L3).
 *
 * Chargée **paresseusement** (`React.lazy` dans `App`) : le code de l'éditeur
 * (grille DOM, palette, export PNG) ne pèse pas sur le bundle initial du
 * catalogue.
 *
 * La page est un simple habillage : tout l'éditeur vient de
 * `@yoto-community/pixel-editor-react`. Elle traduit la locale du catalogue en
 * messages du paquet, applique le thème du site via `pe-theme-yoto` et
 * conserve la clé de brouillon historique.
 *
 * Le bouton « Retoucher dans l'éditeur » d'une icône officielle (option B)
 * passe l'URL de l'image via `location.state` ; elle est transmise telle quelle.
 */
export function EditorPage() {
  const location = useLocation();
  const state = location.state as EditorLocationState | null;
  const { locale } = useI18n();

  return (
    <div className="pe-theme-yoto">
      <PixelEditor
        initialImageUrl={state?.initialImageUrl}
        messages={EDITOR_MESSAGES[locale]}
        storageKey="yoto-icons-editor-draft"
      />
    </div>
  );
}
