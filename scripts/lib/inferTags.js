/**
 * Inférence de tags partagée par les scrapers.
 *
 * Historique : chaque scraper dupliquait sa propre map de mots-clés, avec une
 * correspondance par sous-chaîne qui produisait des faux positifs :
 *   - « Train »      → weather  (car « train » contient « rain »)
 *   - « Scarface »   → transport, people  (« scarf » ⊃ « car », « face »)
 *   - « Playing Card » → transport, media  (« card » ⊃ « car », « play »)
 * Ici la correspondance se fait par MOT ENTIER, ce qui élimine ces erreurs.
 * Un tag faux est pire qu'un tag manquant pour la pertinence de recherche.
 */

/**
 * Map tag → mots-clés déclencheurs.
 * Les mots-clés multi-mots sont comparés comme phrases consécutives.
 */
const TAG_KEYWORDS = {
  moon: ['moon', 'lune', 'night', 'nuit', 'crescent'],
  sun: ['sun', 'soleil', 'sunny'],
  star: ['star', 'étoile', 'stars'],
  heart: ['heart', 'cœur', 'love', 'amour'],
  plant: ['plant', 'plante', 'leaf', 'feuille', 'flower', 'fleur', 'sprout', 'pousse'],
  animal: ['cat', 'chat', 'dog', 'chien', 'bird', 'oiseau', 'fish', 'poisson', 'animal'],
  arrow: ['arrow', 'flèche', 'direction'],
  home: ['home', 'maison', 'house'],
  music: ['music', 'musique', 'note'],
  weather: [
    'cloud',
    'cloudy',
    'nuage',
    'rain',
    'rainy',
    'pluie',
    'snow',
    'snowy',
    'neige',
    'storm',
    'stormy',
    'orage',
    'thunderstorm',
  ],
  food: ['food', 'nourriture', 'apple', 'pomme', 'pizza', 'burger', 'cake', 'gâteau'],
  tech: ['phone', 'téléphone', 'computer', 'ordinateur', 'screen', 'écran', 'wifi', 'bluetooth'],
  transport: ['car', 'voiture', 'bus', 'plane', 'avion', 'bike', 'vélo', 'train'],
  people: ['person', 'personne', 'people', 'gens', 'user', 'utilisateur', 'face', 'visage'],
  shape: ['circle', 'cercle', 'square', 'carré', 'triangle', 'diamond', 'losange'],
  ui: [
    'menu',
    'settings',
    'paramètres',
    'search',
    'recherche',
    'close',
    'fermer',
    'check',
    'valider',
  ],
  time: ['clock', 'horloge', 'time', 'temps', 'calendar', 'calendrier', 'date'],
  mail: ['mail', 'email', 'message', 'envelope', 'enveloppe'],
  shopping: ['cart', 'panier', 'bag', 'sac', 'shop', 'magasin', 'buy', 'acheter'],
  media: ['play', 'pause', 'stop', 'volume', 'video', 'vidéo', 'photo', 'camera', 'caméra'],
};

/**
 * Découpe un titre en jetons normalisés (minuscules, sans ponctuation).
 * Gère les mots accentués en conservant l'accent (« cœur » reste « cœur »).
 * @param {string} text
 * @returns {string[]}
 */
export function tokenize(text) {
  return String(text)
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);
}

/**
 * Infère des tags depuis un titre, en respectant les mots déjà fournis.
 *
 * @param {string} title - Titre de l'icône.
 * @param {string[]} [existingTags] - Tags déjà connus (conservés tels quels).
 * @returns {string[]} Tags déduits par MOT ENTIER, ou ['icon'] si aucun.
 *
 * @example
 * inferTags('Train')            // ['transport']  (pas de 'weather')
 * inferTags('Scarface')         // ['icon']       (pas de 'transport'/'people')
 * inferTags('crescent moon')    // ['moon']
 * inferTags('sunset', ['custom']) // ['custom', 'sun']
 */
export function inferTags(title, existingTags = []) {
  const tokens = tokenize(title);
  const tags = new Set(existingTags.filter(Boolean));

  for (const [tag, keywords] of Object.entries(TAG_KEYWORDS)) {
    for (const keyword of keywords) {
      const kwTokens = tokenize(keyword);
      if (kwTokens.length === 0) continue;

      // Mot entier (un jeton) ou phrase consécutifs (mots-clés multi-mots).
      const matched =
        kwTokens.length === 1
          ? tokens.includes(kwTokens[0])
          : hasConsecutiveSubsequence(tokens, kwTokens);

      if (matched) {
        tags.add(tag);
        break; // un match par tag suffit
      }
    }
  }

  return tags.size > 0 ? [...tags] : ['icon'];
}

/**
 * Vérifie si `needle` apparaît comme sous-séquence consécutive de `haystack`.
 * @param {string[]} haystack
 * @param {string[]} needle
 * @returns {boolean}
 */
function hasConsecutiveSubsequence(haystack, needle) {
  const n = needle.length;
  for (let i = 0; i + n <= haystack.length; i++) {
    let ok = true;
    for (let j = 0; j < n; j++) {
      if (haystack[i + j] !== needle[j]) {
        ok = false;
        break;
      }
    }
    if (ok) return true;
  }
  return false;
}
