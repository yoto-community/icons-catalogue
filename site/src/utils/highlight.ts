export interface HighlightPart {
  text: string;
  /** `true` si le fragment correspond à un terme recherché. */
  match: boolean;
}

/** Échappe les caractères spéciaux d'une expression régulière. */
function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Découpe un texte selon les termes de la recherche, en marquant les
 * correspondances (P3.5). Insensible à la casse, multi-termes, et sûr vis-à-vis
 * des caractères spéciaux (`+`, `.`, `(`…). Le texte original est préservé
 * (la casse affichée reste celle du titre).
 */
export function splitHighlight(text: string, query: string): HighlightPart[] {
  const terms = query
    .trim()
    .split(/\s+/)
    .filter((term) => term.length > 0);

  if (!text) return [{ text, match: false }];
  if (terms.length === 0) return [{ text, match: false }];

  const pattern = new RegExp(`(${terms.map(escapeRegExp).join('|')})`, 'gi');
  const parts: HighlightPart[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(pattern)) {
    const index = match.index ?? 0;
    if (index > lastIndex) {
      parts.push({ text: text.slice(lastIndex, index), match: false });
    }
    parts.push({ text: match[0], match: true });
    lastIndex = index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push({ text: text.slice(lastIndex), match: false });
  }

  return parts.length > 0 ? parts : [{ text, match: false }];
}
