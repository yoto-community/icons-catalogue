import { useLocation } from 'react-router-dom';
import { PixelEditor } from '../components/editor';

/** État de navigation accepté par la route `/editor` (option B). */
interface EditorLocationState {
  /** URL d'une icône officielle à ouvrir directement dans l'éditeur. */
  initialImageUrl?: string;
}

/**
 * Page « Éditeur d'icônes » (L3).
 *
 * Chargée **paresseusement** (`React.lazy` dans `App`) : le code de l'éditeur
 * n'alourdit pas le bundle initial du catalogue. La page est un simple
 * habillage ; toute la logique vit dans `components/editor`.
 *
 * Le bouton « Retoucher dans l'éditeur » d'une icône officielle (option B)
 * passe l'URL de l'image via `location.state` ; elle est transmise telle quelle.
 */
export function EditorPage() {
  const location = useLocation();
  const state = location.state as EditorLocationState | null;

  return <PixelEditor initialImageUrl={state?.initialImageUrl} />;
}
