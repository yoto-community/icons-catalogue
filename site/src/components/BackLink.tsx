import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';

interface BackLinkProps {
  /** Destination du retour (ex. « /categories »). */
  to: string;
  children: ReactNode;
}

/**
 * Lien de retour avec chevron, partagé par les pages catégorie et auteur
 * (le balisage SVG était dupliqué à l'identique dans chaque page).
 *
 * Le nom accessible est le texte visible : on n'ajoute volontairement pas
 * d'`aria-label` qui le masquerait (règle WCAG 2.5.3 « Label in Name »).
 */
export function BackLink({ to, children }: BackLinkProps) {
  return (
    <Link to={to} className="back-link">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M19 12H5M12 19l-7-7 7-7" />
      </svg>
      {children}
    </Link>
  );
}
