import { test } from 'node:test';
import assert from 'node:assert/strict';
import { inferTags } from './inferTags.js';
import {
  YOTOPIXELS_BASE_URL,
  convertJSArrayToJSON,
  extractIconsFromSvelteKitScript,
  extractIconsFromHtml,
  toNormalizedIcon,
  toNormalizedIcons,
} from './yotopixels.js';

// ---------------------------------------------------------------------------
// Fixtures hors-ligne (aucun réseau). `SVELTEKIT_HTML` reproduit la forme réelle
// du script embarqué par SvelteKit : `__sveltekit_<hash>` puis
// `kit.start(app, element, { … data: [{…, data:{icons:[…]}}] …, form: … })`,
// avec clés non citées et « : » à l’intérieur des chaînes (URLs, horodatages).
// ---------------------------------------------------------------------------

const SVELTEKIT_HTML = `<!doctype html><html><body>
<script>
  {
    __sveltekit_mdvi8v = {
      base: new URL(".", location).pathname.slice(0, -1)
    };

    const element = document.currentScript.parentElement;

    Promise.all([
      import("./_app/immutable/entry/start.i0xbbqvi.js")
    ]).then(([kit, app]) => {
      kit.start(app, element, {
        node_ids: [0, 2, 10],
        data: [{type:"data",data:{user:null,session:null},uses:{}},null,{type:"data",data:{icons:[{tags:[],forked_from:null,creator:{id:"w1MXpd5Tfim1uTDp3iBU4FLWj3WqExZP",public_alias:"sylvain"},download_count:0,image_url:"https://yotopixels.com/icons/cb239825-6dd8-402e-b00b-a788ede40b07.png",title:"test",id:"cb239825-6dd8-402e-b00b-a788ede40b07",removed:false,created_at:"2026-10-17T16:51:35.062734Z"},{tags:["angelina ballerina","ballet","mouse"],forked_from:null,creator:{id:"oZTY7BggH5XYegGsz607D5xdkoTVvGAB",public_alias:"CozyFrog9012"},download_count:5,image_url:"https://yotopixels.com/icons/2f8b1c00-1111-2222-3333-444444444444.png",title:"Ballet: mouse",id:"2f8b1c00-1111-2222-3333-444444444444",removed:false,created_at:"2026-10-18T00:00:00.000Z"}]},uses:{}}],
        form: null
      });
    });
  }
</script>
</body></html>`;

/** Repli HTML : ni script SvelteKit exploitable, uniquement les cartes `article`. */
const FALLBACK_HTML = `<!doctype html><html><body>
<article>
  <a href="/icon/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"><img src="/icons/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee.png" alt=""></a>
  <h2>Cool Icon</h2>
  <a download href="/download/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee.png">Télécharger</a>
</article>
</body></html>`;

// ---------------------------------------------------------------------------
// convertJSArrayToJSON
// ---------------------------------------------------------------------------

test('convertJSArrayToJSON : clés non citées, virgules finales et « : » dans les chaînes', () => {
  const js = '{type:"data",data:{icons:[{id:"a",title:"A: B",tags:["x,y","z"],}],},}';
  const parsed = JSON.parse(convertJSArrayToJSON(js));

  assert.equal(parsed.type, 'data');
  assert.equal(parsed.data.icons[0].title, 'A: B');
  assert.deepEqual(parsed.data.icons[0].tags, ['x,y', 'z']);
});

test('convertJSArrayToJSON : un JSON valide reste intact', () => {
  const json = '{"a":1,"b":[2,3]}';
  assert.deepEqual(JSON.parse(convertJSArrayToJSON(json)), { a: 1, b: [2, 3] });
});

// ---------------------------------------------------------------------------
// extractIconsFromSvelteKitScript
// ---------------------------------------------------------------------------

test('extractIconsFromSvelteKitScript : récupère le tableau data.icons réel', () => {
  const script = SVELTEKIT_HTML.split('<script>')[1].split('</script>')[0];
  const icons = extractIconsFromSvelteKitScript(script);

  assert.equal(icons.length, 2);
  assert.equal(icons[0].id, 'cb239825-6dd8-402e-b00b-a788ede40b07');
  assert.equal(icons[0].title, 'test');
  assert.equal(icons[0].creator.public_alias, 'sylvain');
  // Une valeur contenant deux-points doit survivre à la conversion.
  assert.equal(icons[1].title, 'Ballet: mouse');
  assert.equal(icons[1].download_count, 5);
});

test('extractIconsFromSvelteKitScript : renvoie [] quand la forme attendue est absente', () => {
  assert.deepEqual(extractIconsFromSvelteKitScript('const x = 1;'), []);
  assert.deepEqual(extractIconsFromSvelteKitScript(''), []);
  assert.deepEqual(extractIconsFromSvelteKitScript(null), []);
  // Forme `kit.start` présente mais aucune entrée `data.icons`.
  assert.deepEqual(
    extractIconsFromSvelteKitScript(
      'kit.start(app, element, { data: [{ type: "data", data: {} }], form: null });'
    ),
    []
  );
});

test('extractIconsFromSvelteKitScript : renvoie [] si le JSON embarqué est illisible', () => {
  // Guillemet non fermé → JSON.parse échoue, l’exception est absorbée.
  assert.deepEqual(
    extractIconsFromSvelteKitScript(
      'kit.start(app, element, { data: [{ type: "data", data: { icons: [ { id: "x", title: "oops } ] } }], form: null });'
    ),
    []
  );
});

// ---------------------------------------------------------------------------
// extractIconsFromHtml
// ---------------------------------------------------------------------------

test('extractIconsFromHtml : privilégie le script SvelteKit quand il est exploitable', () => {
  const icons = extractIconsFromHtml(SVELTEKIT_HTML);
  assert.equal(icons.length, 2);
  assert.equal(icons[0].title, 'test');
});

test('extractIconsFromHtml : repli sur les cartes article sinon', () => {
  const icons = extractIconsFromHtml(FALLBACK_HTML);

  assert.equal(icons.length, 1);
  assert.equal(icons[0].id, 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee');
  assert.equal(icons[0].title, 'Cool Icon');
  assert.equal(
    icons[0].image_url,
    'https://yotopixels.com/icons/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee.png'
  );
  assert.equal(icons[0].creator.public_alias, 'YotoPixels');
  assert.equal(icons[0].download_count, 0);
});

test('extractIconsFromHtml : ne produit rien sur une page vide', () => {
  assert.deepEqual(extractIconsFromHtml('<html><body></body></html>'), []);
});

// ---------------------------------------------------------------------------
// toNormalizedIcon / toNormalizedIcons
// ---------------------------------------------------------------------------

function rawIcon(overrides = {}) {
  return {
    id: 'cb239825-6dd8-402e-b00b-a788ede40b07',
    title: 'Cute Cat',
    image_url: 'https://yotopixels.com/icons/x.png',
    tags: ['cat'],
    creator: { id: 'creator-1', public_alias: 'sylvain' },
    download_count: 7,
    created_at: '2026-10-17T16:51:35.062Z',
    ...overrides,
  };
}

test('toNormalizedIcon : mappe au schéma commun du catalogue', () => {
  const icon = toNormalizedIcon(rawIcon());

  assert.deepEqual(icon, {
    id: 'yt-cb239825-6dd8-402e-b00b-a788ede40b07',
    source: 'yotopixels',
    tags: ['cat'],
    artist: 'sylvain',
    title: 'Cute Cat',
    preview_image: 'https://yotopixels.com/icons/x.png',
    download_url: 'https://yotopixels.com/icons/x.png',
    category: 'animaux',
    subcategory: 'chat',
    downloads: 7,
    date_added: '2026-10-17T16:51:35.062Z',
    license: 'CC-BY-SA',
    metadata: { original_id: 'cb239825-6dd8-402e-b00b-a788ede40b07', creator_id: 'creator-1' },
  });
});

test('toNormalizedIcon : tags de l’API conservés, sinon inférés depuis le titre', () => {
  assert.deepEqual(toNormalizedIcon(rawIcon({ tags: ['bluey', 'dog'] })).tags, ['bluey', 'dog']);
  assert.deepEqual(toNormalizedIcon(rawIcon({ tags: [] })).tags, inferTags('Cute Cat'));
  assert.deepEqual(toNormalizedIcon(rawIcon({ tags: undefined })).tags, inferTags('Cute Cat'));
});

test('toNormalizedIcon : valeurs de repli (titre, artiste, téléchargements)', () => {
  const icon = toNormalizedIcon(
    rawIcon({ title: '', creator: undefined, download_count: undefined })
  );
  assert.equal(icon.title, 'Sans titre');
  assert.equal(icon.artist, 'anonymous');
  assert.equal(icon.downloads, 0);
  assert.equal(icon.metadata.creator_id, undefined);
});

test('toNormalizedIcon : repli sur l’identifiant du créateur à défaut d’alias', () => {
  const icon = toNormalizedIcon(rawIcon({ creator: { id: 'creator-2' } }));
  assert.equal(icon.artist, 'creator-2');
});

test('toNormalizedIcons : applique le mapping à tout un lot', () => {
  const icons = toNormalizedIcons([rawIcon({ id: 'a' }), rawIcon({ id: 'b' })]);
  assert.equal(icons.length, 2);
  assert.deepEqual(
    icons.map((icon) => icon.id),
    ['yt-a', 'yt-b']
  );
  assert.equal(
    icons.every((icon) => icon.source === 'yotopixels'),
    true
  );
  assert.equal(YOTOPIXELS_BASE_URL, 'https://yotopixels.com');
});
