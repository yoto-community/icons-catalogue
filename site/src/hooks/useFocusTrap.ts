import { useEffect, useRef, type RefObject } from 'react';

/**
 * Éléments susceptibles de recevoir le focus au clavier (heuristique standard).
 * `a[href]` sans href n'est pas focusable et est donc exclu.
 */
const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

function getFocusable(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
}

/**
 * Piège le focus dans un conteneur tant que `active` est vrai : déplace le
 * focus à l'ouverture, boucle Tab/Shift+Tab à l'intérieur, et le restaure sur
 * l'élément précédemment actif à la fermeture (P3.4).
 *
 * Le hook est appelé inconditionnellement (règles des hooks) ; c'est `active`
 * qui pilote le cycle de vie. Dans `IconDetailModal`, le conteneur n'existe
 * dans le DOM que lorsqu'une icône est sélectionnée.
 */
export function useFocusTrap<T extends HTMLElement = HTMLDivElement>(
  active: boolean
): RefObject<T> {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (!active) return;

    const container = ref.current;
    if (!container) return;

    // Mémorisé AVANT le déplacement du focus, restauré au nettoyage.
    // `data-focus-restore` porte une identité stable du déclencheur : si un
    // re-render (ex. chargement progressif du catalogue, P1.3) remplace le nœud
    // pendant que la modale est ouverte, on retrouve l'équivalent au lieu de
    // tenter de focaliser un élément détaché.
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const restoreKey = previouslyFocused?.getAttribute('data-focus-restore') ?? null;

    const findReplaceable = (): HTMLElement | null => {
      if (!restoreKey) return null;
      return (
        Array.from(document.querySelectorAll<HTMLElement>('[data-focus-restore]')).find(
          (element) => element.getAttribute('data-focus-restore') === restoreKey
        ) ?? null
      );
    };

    const focusables = getFocusable(container);
    (focusables[0] ?? container).focus({ preventScroll: true });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      const items = getFocusable(container);
      if (items.length === 0) {
        event.preventDefault();
        container.focus({ preventScroll: true });
        return;
      }

      const first = items[0];
      const last = items[items.length - 1];
      const current = document.activeElement;

      // Sens inverse : sur le premier élément (ou hors du conteneur) → dernier.
      if (event.shiftKey) {
        if (current === first || !container.contains(current)) {
          event.preventDefault();
          last.focus({ preventScroll: true });
        }
        return;
      }

      // Sens direct : sur le dernier élément (ou hors du conteneur) → premier.
      if (current === last || !container.contains(current)) {
        event.preventDefault();
        first.focus({ preventScroll: true });
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      const target = previouslyFocused?.isConnected
        ? previouslyFocused
        : (findReplaceable() ?? previouslyFocused);
      target?.focus?.({ preventScroll: true });
    };
  }, [active]);

  return ref;
}
