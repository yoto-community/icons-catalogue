import type { ReactElement } from 'react';
import { render, type RenderResult } from '@testing-library/react';
import { EditorMessagesProvider } from '../src/EditorMessagesContext';
import { createTranslator, fr } from '../src/messages';

const frTranslator = createTranslator(fr);

/** Enveloppe un composant de l'éditeur avec les messages français. */
export function withFr(ui: ReactElement): ReactElement {
  return <EditorMessagesProvider t={frTranslator}>{ui}</EditorMessagesProvider>;
}

/** Rend un composant de l'éditeur en français (comme le catalogue). */
export function renderFr(ui: ReactElement): RenderResult {
  return render(withFr(ui));
}
