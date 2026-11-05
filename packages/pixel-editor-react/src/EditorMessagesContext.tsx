import { createContext, useContext, type ReactNode } from 'react';
import { defaultTranslate, type Translate } from './messages';

/**
 * Contexte interne de traduction de l'éditeur.
 *
 * Il évite toute dépendance au système i18n de l'hôte : `PixelEditor` y injecte
 * soit la prop `t`, soit un traducteur construit à partir de `messages`, soit
 * le traducteur du contexte parent.
 */
const EditorTContext = createContext<Translate | null>(null);

export function EditorMessagesProvider({ t, children }: { t: Translate; children: ReactNode }) {
  return <EditorTContext.Provider value={t}>{children}</EditorTContext.Provider>;
}

/**
 * Traducteur de l'éditeur. Hors `PixelEditor` (rendu d'un composant isolé),
 * on retombe sur l'anglais embarqué du paquet.
 */
export function useEditorT(): Translate {
  return useContext(EditorTContext) ?? defaultTranslate;
}
