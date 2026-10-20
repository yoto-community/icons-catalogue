/**
 * Helper typé pour les CustomEvent sur `window`.
 *
 * Centralise l'unique cast DOM nécessaire (le type system ne peut pas typer
 * les noms d'événements personnalisés) afin d'éviter les casts `as EventListener`
 * répétés sur chaque `addEventListener` / `removeEventListener`.
 */
export type WindowEventListener<T> = (event: CustomEvent<T>) => void;

/**
 * Abonne un handler typé à un CustomEvent de fenêtre.
 * Retourne la fonction de désabonnement.
 */
export function onWindowCustomEvent<T>(type: string, handler: WindowEventListener<T>): () => void {
  const listener = (event: Event) => handler(event as CustomEvent<T>);
  window.addEventListener(type, listener);
  return () => window.removeEventListener(type, listener);
}

/**
 * Publie un CustomEvent typé sur la fenêtre.
 */
export function emitWindowCustomEvent<T>(type: string, detail: T): void {
  window.dispatchEvent(new CustomEvent<T>(type, { detail }));
}
