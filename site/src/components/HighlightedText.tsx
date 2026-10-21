import { splitHighlight } from '../utils/highlight';

/**
 * Affiche un texte en surlignant (<mark>) les termes recherchés (P3.5).
 * Rendu sans `dangerouslySetInnerHTML` : les fragments sont des nœuds React.
 */
export function HighlightedText({ text, query }: { text: string; query?: string }) {
  if (!query) return <>{text}</>;

  return (
    <>
      {splitHighlight(text, query).map((part, index) =>
        part.match ? (
          <mark key={index} className="highlight">
            {part.text}
          </mark>
        ) : (
          part.text
        )
      )}
    </>
  );
}
