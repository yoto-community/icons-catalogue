/**
 * Yoto Official Icons Scraper
 * Extrait les icônes officielles de yoto.dev depuis le bundle JS
 * Source: https://yoto.dev/icons/using-icons/
 */

import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const BUNDLE_URL = 'https://yoto.dev/_astro/Icons.kDw8Dzu-.js';
const BASE_CDN_URL = 'https://card-content.yotoplay.com/yoto/';

async function scrapeYotoOfficial() {
  console.log('📥 Début du scrappage des icônes officielles Yoto...');

  // Récupérer le bundle JS qui contient les données
  const res = await fetch(BUNDLE_URL);
  const jsContent = await res.text();

  // Extraire le JSON embarqué dans le bundle
  const match = jsContent.match(/l=JSON\.parse\(`([^`]*)`\)/);
  if (!match) {
    throw new Error('Impossible de trouver les données d\'icônes dans le bundle JS');
  }

  const jsonStr = match[1];
  const rawIcons = JSON.parse(jsonStr);

  console.log(`✅ ${rawIcons.length} icônes officielles Yoto extraites du bundle`);

  // Convertir au format commun
  const icons = rawIcons.map(icon => {
    const mediaId = icon.mediaId;
    const title = icon.title || 'Sans titre';
    const tags = icon.publicTags || [];
    const imageUrl = icon.url || `${BASE_CDN_URL}${mediaId}`;

    // Générer un ID unique normalisé
    const id = `yo-${mediaId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 50)}`;

    // Inférer une catégorie basée sur les tags et le titre
    const category = inferCategory(title, tags);
    const subcategory = inferSubcategory(title, tags);

    return {
      id,
      source: 'yoto-official',
      tags,
      artist: 'Yoto',
      title,
      preview_image: imageUrl,
      download_url: imageUrl,
      category,
      subcategory,
      downloads: 0, // Pas de données de téléchargement pour les icônes officielles
      date_added: new Date().toISOString(),
      license: 'Yoto Official',
      metadata: {
        media_id: mediaId,
        official: true,
        color_palette: extractColors(imageUrl),
        dominant_colors: getDominantColors(imageUrl)
      }
    };
  });

  console.log(`✅ ${icons.length} icônes converties au format commun`);
  return icons;
}

function inferCategory(title, tags) {
  const text = (title + ' ' + (tags || []).join(' ')).toLowerCase();

  // Personnages/Humains - doit être vérifié EN PREMIER
  if (/\b(people|personnes|human|humain|person|personne|man|homme|woman|femme|boy|garcon|girl|fille|child|enfant|baby|bebe|family|famille|mother|mere|father|pere|sister|soeur|brother|frere|grandmother|grand\.mere|grandfather|grand\.pere|doctor|docteur|nurse|infirmiere|teacher|professeur|police|policier|firefighter|pompier|astronaut|astronaute|knight|chevalier|king|roi|queen|reine|prince|princesse|pirate|detective|superhero|super\.heros|villain|mechant|clown|magician|magicien|dancer|danseur|singer|chanteur|musician|musicien|artist|artiste|painter|peintre|writer|ecrivain|chef|cuisinier|pilot|pilote|driver|conducteur|farmer|fermier|builder|constructeur|worker|ouvrier|engineer|ingenieur|scientist|scientifique|fairy|fee|witch|sorciere|wizard|magicien|elf|elfe|dwarf|nain|giant|geant|angel|ange|devil|diable|ghost|fantome|vampire|zombie|mummy|momie|alien|extraterrestre|robot|cyborg|android)\b/.test(text)) return 'personnages';

  // Animaux - mots-clés spécifiques aux animaux réels (pas humains)
  if (/\b(lion|tiger|tigre|bear|ours|elephant|elephant|giraffe|girafe|zebra|zebre|monkey|singe|penguin|manchot|polar\.bear|ours\.polaire|whale|baleine|dolphin|dauphin|shark|requin|fish|poisson|cat|chat|dog|chien|bird|oiseau|eagle|aigle|owl|hibou|chouette|parrot|perroquet|crow|corbeau|sparrow|moineau|duck|canard|goose|oie|swan|cygne|chicken|poule|rooster|coq|chick|poussin|cow|vache|bull|taureau|horse|cheval|pony|poney|donkey|ane|sheep|mouton|goat|chevre|pig|cochon|piglet|goret|rabbit|lapin|hare|lievre|mouse|souris|rat|hamster|guinea\.pig|cochon\.d\.ind|ferret|furet|hedgehog|herisson|bat|chauve\.souris|fox|renard|wolf|loup|deer|cerf|moose|elan|antelope|antilope|kangaroo|kangourou|koala|panda|sloth|paresseux|raccoon|raton\.laveur|skunk|moufette|badger|blaireau|otter|loutre|seal|phoque|walrus|morse|beaver|castor|squirrel|ecureuil|chipmunk|tamia|marmot|marmotte|platypus|ornithorynque|wallaby|wombat|tasmanian\.devil|diable\.de\.tasmanie|crocodile|alligator|turtle|tortue|snake|serpent|lizard|lezard|gecko|chameleon|cameleon|iguana|iguan|komodo|dragon|frog|grenouille|toad|crapaud|salamander|salamandre|newt|triton|octopus|pieuvre|squid|calamar|jellyfish|meduse|starfish|etoile\.de\.mer|crab|crabe|lobster|homard|shrimp|crevette|clam|palourde|oyster|huitre|mussel|moule|snail|escargot|slug|limace|worm|ver|spider|araignee|scorpion|ant|fourmi|bee|abeille|wasp|guepe|hornet|frelon|butterfly|papillon|moth|phalene|dragonfly|libellule|fly|mouche|mosquito|moustique|beetle|coleoptere|cricket|grillon|grasshopper|criquet|mantis|mante|roach|cafard|termite|flea|puce|tick|tique|louse|pou|bedbug|punaise)\b/.test(text)) return 'animaux';

  // Nature
  if (/\b(nature|moon|lune|night|nuit|star|etoile|sun|soleil|cloud|nuage|rain|pluie|rainbow|arc\.en\.ciel|earth|terre|planet|planete|flower|fleur|plant|plante|tree|arbre|grass|herbe|leaf|feuille|snow|neige|ice|glace|water|eau|ocean|ocean|sea|mer|river|riviere|lake|lac|mountain|montagne|hill|colline|valley|vallee|forest|foret|desert|desert|beach|plage|island|ile|volcano|volcan|cave|grotte)\b/.test(text)) return 'nature';

  // Nourriture
  if (/\b(food|nourriture|pizza|burger|sandwich|sushi|ice\.cream|glace|cake|gateau|cookie|biscuit|candy|bonbon|chocolate|chocolat|fruit|fruits|apple|pomme|banana|banane|strawberry|fraise|orange|lemon|citron|watermelon|pastèque|bread|pain|cheese|fromage|donut|beignets|pancake|crepe|milk|lait|egg|oeuf|meat|viande|fish|poisson|vegetable|legume|carrot|carotte|broccoli|brocoli|corn|mais|pepper|poivron|tomato|tomate|cucumber|concombre)\b/.test(text)) return 'nourriture';

  // Véhicules/Transport
  if (/\b(vehicle|vehicule|car|voiture|bus|truck|camion|plane|avion|helicopter|helicoptere|rocket|fusee|boat|bateau|ship|navire|train|bicycle|velo|motorcycle|moto|scooter|taxi|ambulance|fire\.truck|police\.car|tractor|tracteur|van|camionnette|subway|metro|tram|tramway)\b/.test(text)) return 'transport';

  // Bâtiments
  if (/\b(building|batiment|house|maison|castle|chateau|church|eglise|school|ecole|hospital|hopital|hotel|hotel|office|bureau|factory|usine|farm|ferme|shop|magasin|store|restaurant|cafe|bank|banque|post\.office|poste|police\.station|fire\.station|library|bibliotheque|museum|musee|theater|theatre|cinema|cinema|stadium|stade|airport|aeroport|station|gare|bridge|pont|tower|tour|skyscraper|gratte\.ciel|hut|cabane|tent|tente|cabin|cabane|igloo|yurt|yourte)\b/.test(text)) return 'batiments';

  // Musique/Audio
  if (/\b(music|musique|note|notes|sound|son|audio|song|chanson|melody|melodie|rhythm|rythme|beat|battement|instrument|guitar|guitare|piano|drum|batterie|violin|violon|flute|flute|microphone|micro|speaker|haut\.parleur|headphones|ecouteurs|cassette|vinyl|disque|record|enregistrement)\b/.test(text)) return 'musique';

  // Objets
  if (/\b(object|objet|book|livre|pen|stylo|pencil|crayon|phone|telephone|computer|ordinateur|tablet|tablette|camera|appareil|photo|watch|montre|clock|horloge|key|cle|keys|cles|door|porte|window|fenetre|chair|chaise|table|table|bed|lit|lamp|lampe|light|lumiere|candle|bougie|mirror|miroir|glass|verre|cup|tasse|mug|bol|bowl|plate|assiette|fork|fourchette|knife|couteau|spoon|cuillere|bottle|bouteille|can|canette|box|boite|bag|sac|backpack|sac\.a\.dos|wallet|portefeuille|purse|sac\.a\.main|umbrella|parapluie|hat|chapeau|cap|casquette|glasses|lunettes|sunglasses|lunettes\.de\.soleil|watch|montre|jewelry|bijoux|ring|bague|necklace|collier|bracelet|bracelet|earrings|boucles\.d\.oreilles)\b/.test(text)) return 'objets';

  // Activités
  if (/\b(activity|activite|sport|football|soccer|basketball|basket|tennis|golf|swimming|natation|running|course|cycling|velo|dancing|danse|singing|chant|painting|peinture|drawing|dessin|reading|lecture|writing|ecriture|gaming|jeu|video\.game|jeu\.video|cooking|cuisine|baking|patisserie|gardening|jardinage|hiking|randonnee|camping|fishing|peche|hunting|chasse|shopping|achats|travel|voyage|photography|photographie)\b/.test(text)) return 'activites';

  // Émotions
  if (/\b(emotion|emotion|happy|heureux|joy|joie|sad|triste|angry|fache|colere|surprise|surpris|scared|peur|fear|peur|love|amour|heart|coeur|like|aime|dislike|n\.aime|pas|hate|deteste|laugh|rire|cry|pleure|smile|sourire|wink|clin\.d\.oeil|blush|rougit|shy|timide|proud|fier|excited|excité|bored|ennuye|tired|fatigue|sleepy|endormi|dream|reve|nightmare|cauchemar|idee|idee|thought|pensee|question|question|answer|reponse|exclamation|point\.exclamation)\b/.test(text)) return 'emotions';

  // Formes/Abstrait
  if (/\b(shape|forme|circle|cercle|square|carre|triangle|rectangle|star|etoile|heart|coeur|diamond|diamant|hexagon|hexagone|pentagon|pentagone|octagon|octogone|spiral|spirale|wave|vague|zigzag|zig\.zag|dot|point|line|ligne|arrow|fleche|cross|croix|check|cocher|tick|checkmark|plus|plus|minus|moins|equal|egal|not\.equal|different|greater|superieur|less|inferieur|infinity|infini|percent|pourcentage|hash|diese|at|arobase|dollar|euro|pound|livre|yen|yuan|bitcoin|crypto|copyright|marque|trademark|registered|enregistre)\b/.test(text)) return 'formes';

  // Fêtes/Événements
  if (/\b(christmas|noel|santa|pere\.noel|snowman|bonhomme\.neige|snowflake|flocon|halloween|citrouille|pumpkin|ghost|fantome|witch|sorciere|vampire|skeleton|squelette|birthday|anniversaire|cake|gateau|candle|bougie|present|cadeau|balloon|ballon|easter|paques|valentine|saint\.valentin)\b/.test(text)) return 'fetes';

  return 'objets';
}

function inferSubcategory(title, tags) {
  const text = (title + ' ' + (tags || []).join(' ')).toLowerCase();

  // Sous-catégories spécifiques
  if (/moon|lune|crescent|croissant/.test(text)) return 'lune';
  if (/star|etoile|étoile/.test(text)) return 'etoile';
  if (/sun|soleil/.test(text)) return 'soleil';
  if (/heart|coeur|cœur/.test(text)) return 'coeur';
  if (/music|note|musique/.test(text)) return 'musique';
  if (/animal|animaux/.test(text)) return 'animal';
  if (/vehicle|vehicule|car|voiture|bus|truck|plane|avion/.test(text)) return 'vehicule';
  if (/building|batiment|house|maison|castle|chateau/.test(text)) return 'batiment';
  if (/food|nourriture|pizza|burger|ice\.cream|glace/.test(text)) return 'nourriture';
  if (/christmas|noel|santa|pere\.noel|snowman|bonhomme\.neige|snowflake|flocon/.test(text)) return 'noel';
  if (/halloween|citrouille|pumpkin|ghost|fantome|witch|sorciere|vampire|skeleton|squelette/.test(text)) return 'halloween';
  if (/birthday|anniversaire|cake|gateau|candle|bougie|present|cadeau|balloon|ballon/.test(text)) return 'anniversaire';

  return 'autre';
}

function extractColors(imgUrl) {
  // Palette par défaut pour les icônes Yoto (style pixel art)
  return ['#1a1a2e', '#16213e', '#e94560', '#ffa3a3', '#4a90e2', '#ffffff'];
}

function getDominantColors(imgUrl) {
  return ['#e94560', '#ffa3a3', '#4a90e2', '#1a1a2e'];
}

// Exécution
scrapeYotoOfficial()
  .then(icons => {
    const outputPath = path.join(__dirname, '..', 'data', 'yoto-official-icons.json');
    const dataDir = path.dirname(outputPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, JSON.stringify(icons, null, 2));
    console.log(`📁 Données icônes officielles Yoto sauvegardées vers ${outputPath}`);
    console.log(`📊 Total icônes: ${icons.length}`);

    const summary = { total: icons.length, byCategory: {}, byArtist: {}, byTag: {} };
    icons.forEach(icon => {
      summary.byCategory[icon.category] = (summary.byCategory[icon.category] || 0) + 1;
      summary.byArtist[icon.artist] = (summary.byArtist[icon.artist] || 0) + 1;
      icon.tags.forEach(tag => {
        summary.byTag[tag] = (summary.byTag[tag] || 0) + 1;
      });
    });

    summary.topTags = Object.entries(summary.byTag)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {});

    fs.writeFileSync(
      path.join(__dirname, '..', 'data', 'yoto-official-summary.json'),
      JSON.stringify(summary, null, 2)
    );
    console.log('📈 Résumé statistique icônes officielles généré');
  })
  .catch(err => {
    console.error('❌ Erreur during scrappage icônes officielles:', err.message);
    process.exit(1);
  });