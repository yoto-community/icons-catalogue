/**
 * Taxonomie canonique (catégories et sous-catégories) partagée par les scrapers.
 *
 * Historique : chacun des trois scrapers dupliquait ses propres
 * `inferCategory` / `inferSubcategory`, avec des listes divergentes et des
 * valeurs non documentées :
 *   - yotoicons émettait la catégorie accentuée `émotions` (absente des
 *     libellés de l'UI → catégorie sans nom) ;
 *   - yotopixels classait les véhicules dans `objets` ;
 *   - yoto-official utilisait des sous-catégories tantôt accentuées tantôt non.
 * Une seule implémentation, alignée sur `CATEGORY_LABELS` (UI) et sur le
 * README, garantit qu'un même titre produit la même classification, quelle
 * que soit la source.
 *
 * La correspondance se fait par MOT ENTIER (via `tokenize`, comme `inferTags`),
 * ce qui évite les faux positifs par sous-chaîne (« Scarface » ⊅ « car »).
 *
 * Les valeurs sont des slugs ASCII (sans accent) : sûrs pour les URL
 * (`/categories/:category`) et les noms de fichiers de `dist/`.
 */

import { tokenize } from './inferTags.js';

/** Catégorie par défaut quand aucune règle ne correspond. */
export const DEFAULT_CATEGORY = 'objets';

/** Sous-catégorie par défaut quand aucune règle ne correspond. */
export const DEFAULT_SUBCATEGORY = 'autre';

/**
 * Catégories canoniques. Doit rester synchronisé avec `CATEGORY_LABELS`
 * (`site/src/constants/categories.ts`).
 */
export const CATEGORIES = [
  'objets',
  'nature',
  'animaux',
  'musique',
  'personnages',
  'fetes',
  'transport',
  'activites',
  'emotions',
  'nourriture',
  'batiments',
  'formes',
];

/** Sous-catégories canoniques (slugs ASCII, sans accent). */
export const SUBCATEGORIES = [
  'lune',
  'soleil',
  'etoile',
  'coeur',
  'plante',
  'chat',
  'chien',
  'oiseau',
  'fleche',
  'animal',
  'vehicule',
  'batiment',
  'nourriture',
  'musique',
  'noel',
  'halloween',
  'anniversaire',
  'autre',
];

/**
 * Règles de catégorie, testées DANS L'ORDRE : la première qui correspond gagne.
 * L'ordre est significatif (« police car » → `personnages` car `police`,
 * « cake » de Noël → `nourriture` car `nourriture` avant `fetes`).
 */
const CATEGORY_RULES = [
  [
    'personnages',
    [
      'people', 'personnes', 'human', 'humain', 'person', 'personne', 'man', 'homme',
      'woman', 'femme', 'boy', 'garcon', 'girl', 'fille', 'child', 'enfant', 'baby',
      'bebe', 'family', 'famille', 'mother', 'mere', 'father', 'pere', 'sister', 'soeur',
      'brother', 'frere', 'grandmother', 'grandfather', 'doctor', 'docteur', 'nurse',
      'infirmiere', 'teacher', 'professeur', 'police', 'policier', 'firefighter',
      'pompier', 'astronaut', 'astronaute', 'knight', 'chevalier', 'king', 'roi', 'queen',
      'reine', 'prince', 'princesse', 'pirate', 'detective', 'superhero', 'heros',
      'villain', 'mechant', 'clown', 'magician', 'magicien', 'dancer', 'danseur',
      'singer', 'chanteur', 'musician', 'musicien', 'artist', 'artiste', 'painter',
      'peintre', 'writer', 'ecrivain', 'chef', 'cuisinier', 'pilot', 'pilote', 'driver',
      'conducteur', 'farmer', 'fermier', 'builder', 'constructeur', 'worker', 'ouvrier',
      'engineer', 'ingenieur', 'scientist', 'scientifique', 'fairy', 'fee', 'witch',
      'sorciere', 'wizard', 'elf', 'elfe', 'dwarf', 'nain', 'giant', 'geant', 'angel',
      'ange', 'devil', 'diable', 'ghost', 'fantome', 'vampire', 'zombie', 'mummy',
      'momie', 'alien', 'extraterrestre', 'robot', 'cyborg', 'android',
    ],
  ],
  [
    'animaux',
    [
      'lion', 'tiger', 'tigre', 'bear', 'ours', 'elephant', 'giraffe', 'girafe', 'zebra',
      'zebre', 'monkey', 'singe', 'penguin', 'manchot', 'whale', 'baleine', 'dolphin',
      'dauphin', 'shark', 'requin', 'fish', 'poisson', 'cat', 'chat', 'dog', 'chien',
      'bird', 'oiseau', 'eagle', 'aigle', 'owl', 'hibou', 'chouette', 'parrot',
      'perroquet', 'crow', 'corbeau', 'sparrow', 'moineau', 'duck', 'canard', 'goose',
      'oie', 'swan', 'cygne', 'chicken', 'poule', 'rooster', 'coq', 'chick', 'poussin',
      'cow', 'vache', 'bull', 'taureau', 'horse', 'cheval', 'pony', 'poney', 'donkey',
      'ane', 'sheep', 'mouton', 'goat', 'chevre', 'pig', 'cochon', 'piglet', 'goret',
      'rabbit', 'lapin', 'hare', 'lievre', 'mouse', 'souris', 'rat', 'hamster', 'guinea',
      'ferret', 'furet', 'hedgehog', 'herisson', 'bat', 'fox', 'renard', 'wolf', 'loup',
      'deer', 'cerf', 'moose', 'antelope', 'antilope', 'kangaroo', 'kangourou', 'koala',
      'panda', 'sloth', 'paresseux', 'raccoon', 'skunk', 'moufette', 'badger', 'blaireau',
      'otter', 'loutre', 'seal', 'phoque', 'walrus', 'morse', 'beaver', 'castor',
      'squirrel', 'ecureuil', 'chipmunk', 'tamia', 'marmot', 'marmotte', 'platypus',
      'ornithorynque', 'wallaby', 'wombat', 'crocodile', 'alligator', 'turtle', 'tortue',
      'snake', 'serpent', 'lizard', 'lezard', 'gecko', 'chameleon', 'cameleon', 'iguana',
      'iguan', 'komodo', 'dragon', 'frog', 'grenouille', 'toad', 'crapaud', 'salamander',
      'salamandre', 'newt', 'triton', 'octopus', 'pieuvre', 'squid', 'calamar',
      'jellyfish', 'meduse', 'starfish', 'crab', 'crabe', 'lobster', 'homard', 'shrimp',
      'crevette', 'clam', 'palourde', 'oyster', 'huitre', 'mussel', 'moule', 'snail',
      'escargot', 'slug', 'limace', 'worm', 'ver', 'spider', 'araignee', 'scorpion',
      'ant', 'fourmi', 'bee', 'abeille', 'wasp', 'guepe', 'hornet', 'frelon', 'butterfly',
      'papillon', 'moth', 'phalene', 'dragonfly', 'libellule', 'fly', 'mouche',
      'mosquito', 'moustique', 'beetle', 'coleoptere', 'cricket', 'grillon', 'grasshopper',
      'criquet', 'mantis', 'mante', 'roach', 'cafard', 'termite', 'flea', 'puce', 'tick',
      'tique', 'louse', 'pou', 'bedbug', 'punaise', 'animal', 'animaux',
    ],
  ],
  [
    'nature',
    [
      'nature', 'moon', 'lune', 'night', 'nuit', 'star', 'stars', 'etoile', 'étoile',
      'sun', 'soleil', 'sunny', 'cloud', 'cloudy', 'nuage', 'rain', 'rainy', 'pluie',
      'rainbow', 'earth', 'terre', 'planet', 'planete', 'flower', 'fleur', 'plant',
      'plante', 'leaf', 'feuille', 'tree', 'arbre', 'grass', 'herbe', 'snow', 'snowy',
      'neige', 'ice', 'glace', 'water', 'eau', 'ocean', 'sea', 'mer', 'river', 'riviere',
      'lake', 'lac', 'mountain', 'montagne', 'hill', 'colline', 'valley', 'vallee',
      'forest', 'foret', 'desert', 'beach', 'plage', 'island', 'ile', 'volcano', 'volcan',
      'cave', 'grotte', 'storm', 'stormy', 'orage', 'weather', 'crescent',
    ],
  ],
  [
    'nourriture',
    [
      'food', 'nourriture', 'pizza', 'burger', 'sandwich', 'sushi', 'cake', 'gateau',
      'gâteau', 'cookie', 'biscuit', 'candy', 'bonbon', 'chocolate', 'chocolat', 'fruit',
      'fruits', 'apple', 'pomme', 'banana', 'banane', 'strawberry', 'fraise', 'orange',
      'lemon', 'citron', 'watermelon', 'bread', 'pain', 'cheese', 'fromage', 'donut',
      'pancake', 'crepe', 'milk', 'lait', 'egg', 'oeuf', 'meat', 'viande', 'vegetable',
      'legume', 'carrot', 'carotte', 'broccoli', 'brocoli', 'corn', 'mais', 'pepper',
      'poivron', 'tomato', 'tomate', 'cucumber', 'concombre',
    ],
  ],
  [
    'transport',
    [
      'vehicle', 'vehicule', 'véhicule', 'car', 'voiture', 'bus', 'truck', 'camion',
      'plane', 'avion', 'helicopter', 'helicoptere', 'rocket', 'fusee', 'boat', 'bateau',
      'ship', 'navire', 'train', 'bicycle', 'velo', 'vélo', 'bike', 'motorcycle', 'moto',
      'scooter', 'taxi', 'ambulance', 'tractor', 'tracteur', 'van', 'camionnette',
      'subway', 'metro', 'tram', 'tramway', 'transport',
    ],
  ],
  [
    'batiments',
    [
      'building', 'batiment', 'bâtiment', 'house', 'home', 'maison', 'castle', 'chateau',
      'church', 'eglise', 'school', 'ecole', 'hospital', 'hopital', 'hotel', 'office',
      'bureau', 'factory', 'usine', 'farm', 'ferme', 'shop', 'magasin', 'store',
      'restaurant', 'cafe', 'bank', 'banque', 'library', 'bibliotheque', 'museum', 'musee',
      'theater', 'theatre', 'cinema', 'stadium', 'stade', 'airport', 'aeroport', 'station',
      'gare', 'bridge', 'pont', 'tower', 'tour', 'skyscraper', 'hut', 'cabane', 'tent',
      'tente', 'cabin', 'igloo', 'yurt', 'yourte',
    ],
  ],
  [
    'musique',
    [
      'music', 'musique', 'note', 'notes', 'sound', 'son', 'audio', 'song', 'chanson',
      'melody', 'melodie', 'rhythm', 'rythme', 'beat', 'instrument', 'guitar', 'guitare',
      'piano', 'drum', 'batterie', 'violin', 'violon', 'flute', 'flûte', 'microphone',
      'micro', 'speaker', 'headphones', 'ecouteurs', 'cassette', 'vinyl', 'record',
    ],
  ],
  [
    'objets',
    [
      'object', 'objet', 'book', 'livre', 'pen', 'stylo', 'pencil', 'crayon', 'phone',
      'telephone', 'computer', 'ordinateur', 'tablet', 'tablette', 'camera', 'photo',
      'watch', 'montre', 'clock', 'horloge', 'time', 'key', 'cle', 'keys', 'door',
      'porte', 'window', 'fenetre', 'chair', 'chaise', 'table', 'bed', 'lit', 'lamp',
      'lampe', 'light', 'lumiere', 'candle', 'bougie', 'mirror', 'miroir', 'glass',
      'verre', 'cup', 'tasse', 'mug', 'bowl', 'plate', 'assiette', 'fork', 'fourchette',
      'knife', 'couteau', 'spoon', 'cuillere', 'bottle', 'bouteille', 'can', 'canette',
      'box', 'boite', 'bag', 'sac', 'backpack', 'wallet', 'portefeuille', 'purse',
      'umbrella', 'parapluie', 'hat', 'chapeau', 'cap', 'casquette', 'glasses', 'lunettes',
      'sunglasses', 'jewelry', 'bijoux', 'ring', 'bague', 'necklace', 'collier',
      'bracelet', 'earrings', 'tech', 'ui', 'mail', 'email', 'message',
      'shopping', 'cart', 'panier', 'media', 'play', 'pause', 'stop', 'volume', 'video',
      'screen', 'ecran', 'menu', 'settings', 'search', 'close', 'check', 'calendar',
      'date', 'envelope', 'enveloppe', 'buy', 'shop',
    ],
  ],
  [
    'activites',
    [
      'activity', 'activite', 'sport', 'football', 'soccer', 'basketball', 'basket',
      'tennis', 'golf', 'swimming', 'natation', 'running', 'course', 'cycling', 'dancing',
      'danse', 'singing', 'chant', 'painting', 'peinture', 'drawing', 'dessin', 'reading',
      'lecture', 'writing', 'ecriture', 'gaming', 'game', 'jeu', 'cooking', 'cuisine',
      'baking', 'gardening', 'jardinage', 'hiking', 'randonnee', 'camping', 'fishing',
      'peche', 'hunting', 'chasse', 'travel', 'voyage', 'photography', 'photographie',
    ],
  ],
  [
    'emotions',
    [
      'emotion', 'emotions', 'happy', 'heureux', 'joy', 'joie', 'sad', 'triste', 'angry',
      'fache', 'colere', 'surprise', 'surpris', 'scared', 'peur', 'fear', 'love', 'amour',
      'heart', 'coeur', 'cœur', 'like', 'aime', 'hate', 'deteste', 'laugh', 'rire', 'cry',
      'pleure', 'smile', 'sourire', 'wink', 'blush', 'rougit', 'shy', 'timide', 'proud',
      'fier', 'excited', 'bored', 'ennuye', 'tired', 'fatigue', 'sleepy', 'endormi',
      'dream', 'reve', 'nightmare', 'cauchemar', 'thought', 'pensee', 'question', 'answer',
      'reponse', 'exclamation',
    ],
  ],
  [
    'formes',
    [
      'shape', 'forme', 'circle', 'cercle', 'square', 'carre', 'triangle', 'rectangle',
      'star', 'stars', 'etoile', 'étoile', 'heart', 'coeur', 'cœur', 'diamond', 'diamant',
      'hexagon', 'hexagone', 'pentagon', 'pentagone', 'octagon', 'octogone', 'spiral',
      'spirale', 'wave', 'vague', 'zigzag', 'dot', 'point', 'line', 'ligne', 'arrow',
      'fleche', 'flèche', 'cross', 'croix', 'check', 'tick', 'plus', 'minus', 'moins',
      'equal', 'egal', 'infinity', 'infini', 'percent', 'pourcentage', 'hash', 'diese',
      'dollar', 'euro', 'pound', 'livre', 'yen', 'yuan', 'bitcoin', 'crypto', 'copyright',
      'trademark', 'registered',
    ],
  ],
  [
    'fetes',
    [
      'christmas', 'noel', 'noël', 'santa', 'snowman', 'snowflake', 'flocon', 'halloween',
      'citrouille', 'pumpkin', 'ghost', 'fantome', 'witch', 'sorciere', 'vampire',
      'skeleton', 'squelette', 'birthday', 'anniversaire', 'cake', 'gateau', 'gâteau',
      'candle', 'bougie', 'present', 'cadeau', 'balloon', 'ballon', 'easter', 'paques',
      'valentine',
    ],
  ],
];

/**
 * Règles de sous-catégorie, testées DANS L'ORDRE. Les sous-catégories
 * spécifiques (`chat`, `chien`, `oiseau`, `plante`, `fleche`) précèdent les
 * génériques (`animal`) pour rester informatives.
 */
const SUBCATEGORY_RULES = [
  ['lune', ['moon', 'lune', 'crescent', 'croissant', 'night', 'nuit']],
  ['soleil', ['sun', 'soleil', 'sunny']],
  ['etoile', ['star', 'stars', 'etoile', 'étoile']],
  ['coeur', ['heart', 'coeur', 'cœur', 'love', 'amour']],
  [
    'plante',
    ['plant', 'plante', 'leaf', 'feuille', 'flower', 'fleur', 'sprout', 'pousse', 'tree', 'arbre'],
  ],
  ['chat', ['cat', 'chat']],
  ['chien', ['dog', 'chien']],
  ['oiseau', ['bird', 'oiseau']],
  ['fleche', ['arrow', 'fleche', 'flèche']],
  ['animal', ['animal', 'animaux', 'fish', 'poisson']],
  [
    'vehicule',
    [
      'vehicle', 'vehicule', 'véhicule', 'car', 'voiture', 'bus', 'truck', 'camion',
      'plane', 'avion', 'train', 'bicycle', 'velo', 'bike', 'boat', 'bateau', 'ship',
      'navire', 'rocket', 'fusee',
    ],
  ],
  ['batiment', ['building', 'batiment', 'bâtiment', 'house', 'home', 'maison', 'castle', 'chateau']],
  ['nourriture', ['food', 'nourriture', 'pizza', 'burger', 'cake', 'gateau', 'gâteau', 'glace', 'fruit']],
  ['musique', ['music', 'musique', 'note', 'song', 'chanson', 'sound', 'son']],
  [
    'noel',
    ['christmas', 'noel', 'noël', 'santa', 'snowman', 'snowflake', 'flocon', 'snow', 'neige'],
  ],
  [
    'halloween',
    ['halloween', 'citrouille', 'pumpkin', 'ghost', 'fantome', 'witch', 'sorciere', 'vampire', 'skeleton', 'squelette'],
  ],
  [
    'anniversaire',
    ['birthday', 'anniversaire', 'balloon', 'ballon', 'candle', 'bougie', 'present', 'cadeau'],
  ],
];

/**
 * Construit l'ensemble des jetons normalisés d'un titre et de ses tags.
 * @param {string} title
 * @param {string[]|undefined} tags
 * @returns {Set<string>}
 */
function collectTokens(title, tags) {
  const tokens = new Set(tokenize(title));
  for (const tag of tags ?? []) {
    for (const token of tokenize(tag)) tokens.add(token);
  }
  return tokens;
}

/**
 * Vrai si l'un des mots-clés apparaît comme mot entier dans les jetons.
 * @param {Set<string>} tokens
 * @param {string[]} keywords
 * @returns {boolean}
 */
function matchesAny(tokens, keywords) {
  return keywords.some((keyword) => tokens.has(keyword));
}

/**
 * Infère la catégorie canonique d'une icône.
 * @param {string} title - Titre de l'icône.
 * @param {string[]} [tags] - Tags connus (influencent aussi la catégorie).
 * @returns {string} Une valeur de {@link CATEGORIES}.
 */
export function inferCategory(title, tags = []) {
  const tokens = collectTokens(title, tags);
  for (const [category, keywords] of CATEGORY_RULES) {
    if (matchesAny(tokens, keywords)) return category;
  }
  return DEFAULT_CATEGORY;
}

/**
 * Infère la sous-catégorie canonique d'une icône.
 * @param {string} title - Titre de l'icône.
 * @param {string[]} [tags] - Tags connus.
 * @returns {string} Une valeur de {@link SUBCATEGORIES}.
 */
export function inferSubcategory(title, tags = []) {
  const tokens = collectTokens(title, tags);
  for (const [subcategory, keywords] of SUBCATEGORY_RULES) {
    if (matchesAny(tokens, keywords)) return subcategory;
  }
  return DEFAULT_SUBCATEGORY;
}
