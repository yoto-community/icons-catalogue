/**
 * Messages de l'éditeur (fr/en) et traduction minimale, **sans dépendance**
 * au système i18n du catalogue.
 *
 * Les dictionnaires sont des copies **plates** de la section `editor` des
 * locales du site : chaque clé est préfixée par `editor.` et l'interpolation
 * utilise des accolades simples (`{row}`). Un hôte peut fournir ses propres
 * messages via la prop `messages`, ou un traducteur complet via `t`.
 */

export type Translate = (key: string, vars?: Record<string, string | number>) => string;

/** Dictionnaire plat de messages de l'éditeur (`editor.*`). */
export type EditorMessages = Record<string, string>;

/**
 * Expression conditionnelle simple utilisée par les pluriels :
 * `{count > 1 ? 's' : ''}`. Évaluée pour les comparaisons numériques usuelles.
 */
const CONDITIONAL_RE = /\{(\w+)\s*([><]=?|===?|!==?)\s*(-?\d+)\s*\?\s*'([^']*)'\s*:\s*'([^']*)'\}/g;

/** Traduit une expression conditionnelle à partir des variables fournies. */
function evalConditional(
  name: string,
  operator: string,
  raw: string,
  yes: string,
  no: string,
  vars: Record<string, string | number>
): string | null {
  if (!(name in vars)) return null;
  const value = Number(vars[name]);
  const target = Number(raw);
  if (Number.isNaN(value) || Number.isNaN(target)) return null;

  switch (operator) {
    case '>':
      return value > target ? yes : no;
    case '>=':
      return value >= target ? yes : no;
    case '<':
      return value < target ? yes : no;
    case '<=':
      return value <= target ? yes : no;
    case '===':
    case '==':
      return value === target ? yes : no;
    default:
      return value !== target ? yes : no;
  }
}

/**
 * Crée un traducteur à partir d'un dictionnaire plat. Une clé absente est
 * renvoyée telle quelle (signe visible qu'il manque un message).
 */
export function createTranslator(messages: EditorMessages): Translate {
  return (key, vars = {}) => {
    const template = messages[key] ?? key;
    const withConditionals = template.replace(
      CONDITIONAL_RE,
      (match, name, operator, raw, yes, no) =>
        evalConditional(name, operator, raw, yes, no, vars) ?? match
    );
    return withConditionals.replace(/\{(\w+)\}/g, (_, name) => String(vars[name] ?? `{${name}}`));
  };
}

export const en: EditorMessages = {
  'editor.title': 'Icon editor',
  'editor.subtitle': 'Draw a 16×16 icon for the Yoto Player, then download it as a PNG.',
  'editor.panel.ariaLabel': 'Tools panel',
  'editor.tools.ariaLabel': 'Drawing tools',
  'editor.tools.pencil': 'Pencil',
  'editor.tools.eraser': 'Eraser',
  'editor.tools.fill': 'Fill',
  'editor.tools.picker': 'Colour picker',
  'editor.tools.undo': 'Undo',
  'editor.tools.redo': 'Redo',
  'editor.tools.clear': 'Clear all',
  'editor.palette.ariaLabel': 'Colour palette',
  'editor.palette.customLabel': 'Custom colour',
  'editor.palette.current': 'Current colour',
  'editor.palette.opacity': 'Opacity',
  'editor.grid.ariaLabel': 'Drawing grid 16 × 16',
  'editor.grid.cellAria': 'Row {row}, column {col}, {color}',
  'editor.color.empty': 'empty',
  'editor.preview.ariaLabel': 'Icon preview',
  'editor.preview.title': 'Preview',
  'editor.status.ariaLabel': 'Icon status',
  'editor.status.colors': "{count} colour{count > 1 ? 's' : ''}",
  'editor.status.empty': 'Empty icon: no pixel drawn.',
  'editor.status.pureBlack': 'Pure black detected: invisible on the Player’s black background.',
  'editor.status.tooManyColors': 'More than {count} colours: rendering may be less legible.',
  'editor.actions.download': 'Download PNG',
  'editor.actions.newIcon': 'New icon',
  'editor.draft.restored': 'Draft restored.',
  'editor.draft.discard': 'Start over',
  'editor.import.ariaLabel': 'Start from an icon',
  'editor.import.fileLabel': 'Image file',
  'editor.import.fileHint': 'PNG, JPEG… automatically converted to 16×16.',
  'editor.import.loading': 'Importing…',
  'editor.import.errorDecode': 'Unreadable image. Try another file.',
  'editor.import.errorFetch': 'Download failed (the source site does not allow it).',
  'editor.history.ariaLabel': 'History',
};

export const fr: EditorMessages = {
  'editor.title': 'Éditeur d’icônes',
  'editor.subtitle': 'Dessinez une icône 16×16 pour le Yoto Player, puis téléchargez-la en PNG.',
  'editor.panel.ariaLabel': 'Panneau des outils',
  'editor.tools.ariaLabel': 'Outils de dessin',
  'editor.tools.pencil': 'Crayon',
  'editor.tools.eraser': 'Gomme',
  'editor.tools.fill': 'Remplissage',
  'editor.tools.picker': 'Pipette',
  'editor.tools.undo': 'Annuler',
  'editor.tools.redo': 'Rétablir',
  'editor.tools.clear': 'Effacer tout',
  'editor.palette.ariaLabel': 'Palette de couleurs',
  'editor.palette.customLabel': 'Couleur personnalisée',
  'editor.palette.current': 'Couleur courante',
  'editor.palette.opacity': 'Opacité',
  'editor.grid.ariaLabel': 'Grille de dessin 16 × 16',
  'editor.grid.cellAria': 'Ligne {row}, colonne {col}, {color}',
  'editor.color.empty': 'vide',
  'editor.preview.ariaLabel': 'Aperçu de l’icône',
  'editor.preview.title': 'Aperçu',
  'editor.status.ariaLabel': 'État de l’icône',
  'editor.status.colors': "{count} couleur{count > 1 ? 's' : ''}",
  'editor.status.empty': 'Icône vide : aucun pixel dessiné.',
  'editor.status.pureBlack': 'Noir pur détecté : invisible sur le fond noir du Player.',
  'editor.status.tooManyColors': 'Plus de {count} couleurs : le rendu peut manquer de lisibilité.',
  'editor.actions.download': 'Télécharger le PNG',
  'editor.actions.newIcon': 'Nouvelle icône',
  'editor.draft.restored': 'Brouillon restauré.',
  'editor.draft.discard': 'Repartir de zéro',
  'editor.import.ariaLabel': 'Partir d’une icône',
  'editor.import.fileLabel': 'Fichier image',
  'editor.import.fileHint': 'PNG, JPEG… converti automatiquement en 16×16.',
  'editor.import.loading': 'Import en cours…',
  'editor.import.errorDecode': 'Image illisible. Essaie un autre fichier.',
  'editor.import.errorFetch': 'Téléchargement impossible (le site source ne l’autorise pas).',
  'editor.history.ariaLabel': 'Historique',
};

/** Traducteur par défaut du paquet : anglais. */
export const defaultTranslate: Translate = createTranslator(en);
