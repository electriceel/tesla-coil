/* Data integrity, checked without a browser. These are the mistakes that are
   easy to make by hand and impossible to see by eye in a 300 KB seed file. */
const { SEED_VEHICLES: V, SEED_BLANKS: B, SEED_LISHI: L, SEED_SAFE: S, SAFE_GROUPS: SG } = require('../assets/js/data.js');
const fs = require('fs');
const path = require('path');

let fail = 0;
const check = (name, ok, detail) => {
  if (ok) { console.log('  ok  ' + name); return; }
  console.log('FAIL ' + name + (detail ? '\n     ' + detail : ''));
  fail++;
};
const dupes = (arr) => [...new Set(arr.filter((x, i) => arr.indexOf(x) !== i))];

/* ---- identity ---- */
check('vehicle ids are unique', !dupes(V.map(v => v.id)).length, dupes(V.map(v => v.id)).join(', '));
check('blank ids are unique', !dupes(B.map(b => b.id)).length, dupes(B.map(b => b.id)).join(', '));
check('every vehicle has make, model and years',
  V.every(v => v.make && v.model && v.yearStart && v.yearEnd));
check('vehicle aliases are arrays of non-empty strings',
  V.every(v => Array.isArray(v.aliases) && v.aliases.every(a => typeof a === 'string' && a.trim())));
const CURRENT_GAP_ROWS = {
  'ford-mustang-2024-2026': [2024, 2026], 'ford-ranger-2024-2026': [2024, 2026],
  'ford-expedition-2025-2026': [2025, 2026], 'toyota-tacoma-2024-2026': [2024, 2026],
  'toyota-4runner-2025-2026': [2025, 2026], 'toyota-camry-2025-2026': [2025, 2026],
  'subaru-forester-2019-2024': [2019, 2024], 'subaru-forester-2025-2026': [2025, 2026],
  'nissan-kicks-2025-2026': [2025, 2026], 'nissan-kicks-play-2025': [2025, 2025],
  'chevy-equinox-2025-2026': [2025, 2026], 'chevy-traverse-2018-2023': [2018, 2023],
  'chevy-traverse-limited-2024': [2024, 2024], 'chevy-traverse-2024-2026': [2024, 2026],
  'gmc-terrain-2025-2026': [2025, 2026], 'gmc-acadia-2024-2026': [2024, 2026],
  'lincoln-navigator-2018-2024': [2018, 2024], 'lincoln-navigator-2025-2026': [2025, 2026]
};
const currentGapWrong = Object.entries(CURRENT_GAP_ROWS).filter(([id, years]) => {
  const row = V.find(v => v.id === id);
  return !row || row.yearStart !== years[0] || row.yearEnd !== years[1];
}).map(([id]) => id);
check('current-generation gap audit rows keep exact year ranges', !currentGapWrong.length, currentGapWrong.join(', '));
const redesignedKicks = V.find(v => v.id === 'nissan-kicks-2025-2026');
check('Kicks Play stays separate from the redesigned Kicks',
  redesignedKicks && !redesignedKicks.aliases.includes('Kicks Play'));
check('every blank has a keyway and a category',
  B.every(b => b.keyway && b.cat));
const catalogKeys = B.filter(b => /^(cat-|cat13-)/.test(b.id));
/* These four checks used to assert the row count before the cleanup and the
   exact wording of a citation nobody could verify -- "Ilco Key Blank Directory,
   edition 13, section 2, pages 276-282" on 124 different rows. Asserting that
   text made the pasted page ranges load-bearing: correcting them failed the
   run, which is backwards. What matters is that the rows are still here, that
   every one carries the Ilco number it is indexed by, and that the JMA
   cross-references survived -- not how they were captioned. */
check('the catalog rows are still here', catalogKeys.length >= 860,
  `${catalogKeys.length} catalog rows`);
check('every catalog row carries an Ilco number',
  catalogKeys.every(b => b.ilco && b.ilco !== '—'),
  catalogKeys.filter(b => !b.ilco || b.ilco === '—').map(b => b.id).join(', '));
const jmaCatalogKeys = catalogKeys.filter(b => b.jma && b.jma !== '—');
check('the JMA cross-references are still here', jmaCatalogKeys.length >= 630,
  `${jmaCatalogKeys.length} JMA-mapped catalog rows`);
check('a row that cites a JMA equivalent says where it came from',
  jmaCatalogKeys.every(b => /JMA/.test(b.notes || '')),
  jmaCatalogKeys.filter(b => !/JMA/.test(b.notes || '')).map(b => b.id).slice(0, 6).join(', '));
const picturedKeys = catalogKeys.filter(b => b.image);
check('common service-call blanks retain their reference images', picturedKeys.length >= 15,
  `${picturedKeys.length} pictured catalog rows`);
check('pictured blanks retain accessible local files and JMA attribution',
  picturedKeys.every(b => b.imageAlt && /^https:\/\/ecatalogo\.jma\.es\//.test(b.imageSource || '') &&
    fs.existsSync(path.join(__dirname, '..', b.image))),
  picturedKeys.filter(b => !b.imageAlt || !/^https:\/\/ecatalogo\.jma\.es\//.test(b.imageSource || '') ||
    !fs.existsSync(path.join(__dirname, '..', b.image))).map(b => b.id).join(', '));

/* A make+model+years triple appearing twice means the same record was added
   twice under different ids, which is how the Hummer slipped in. */
const triples = V.map(v => `${v.make}|${v.model}|${v.yearStart}-${v.yearEnd}`);
check('no vehicle is entered twice', !dupes(triples).length, dupes(triples).join(', '));

/* ---- years ---- */
check('no year range runs backwards', V.every(v => v.yearEnd >= v.yearStart),
  V.filter(v => v.yearEnd < v.yearStart).map(v => v.id).join(', '));
const thisYear = new Date().getFullYear();
check('no year is implausible',
  V.every(v => v.yearStart >= 1900 && v.yearEnd <= thisYear + 2),
  V.filter(v => v.yearStart < 1900 || v.yearEnd > thisYear + 2).map(v => v.id).join(', '));

/* ---- text that has to survive being rendered ---- */
const entity = /&(amp|lt|gt|quot|nbsp|mdash|ndash);/;
const withEntities = [...V, ...B].filter(r => entity.test(JSON.stringify(r)));
check('no HTML entities in the data', !withEntities.length,
  withEntities.map(r => r.id).join(', '));

/* The one non-ASCII character this file is allowed is the em dash. Anything
   else has been a typo in a hex colour or a smart quote in a note. */
const src = require('fs').readFileSync(require('path').join(__dirname, '../assets/js/data.js'), 'utf8');
const stray = [...new Set([...src].filter(c => c.charCodeAt(0) > 127 && c !== '—'))];
check('no stray non-ASCII characters', !stray.length,
  stray.map(c => `${c} (U+${c.charCodeAt(0).toString(16).toUpperCase()})`).join(', '));

/* ---- safe reference ----
   The safe section links to blank rows by id, so a typo there is a chip that
   goes nowhere. And the refusals have to keep refusing: a row in the
   not-yours-to-open group whose guidance stopped saying no would be worse than
   no row at all. */
const blankIds = new Set(B.map(b => b.id));
const safeGroups = new Set(SG.map(g => g[0]));
check('safe rows have unique ids', new Set(S.map(r => r.id)).size === S.length);
check('every safe row has a name, an identification and an authorization rule',
  S.every(r => r.name && r.is && r.path && r.auth));
const safeBadGroup = S.filter(r => !safeGroups.has(r.group));
check('every safe row sits in a known group', !safeBadGroup.length,
  safeBadGroup.map(r => r.id + ':' + r.group).join(', '));
const safeDeadLink = S.flatMap(r => (r.bl || []).filter(id => !blankIds.has(id)).map(id => r.id + ' -> ' + id));
check('every safe row links to blank rows that exist', !safeDeadLink.length, safeDeadLink.join(', '));
const safeNoRefusal = S.filter(r => r.stop && !/refer|never|not on a|the bank|the operator|the agent|the board/i.test(r.auth + ' ' + r.path));
check('every refusal actually refuses', !safeNoRefusal.length, safeNoRefusal.map(r => r.id).join(', '));

/* This section exists to route work to the legitimate channel, not to explain
   how to get into a safe. Nothing about defeating one belongs in it, and a
   future edit that drifts that way should fail rather than ship. */
const DEFEAT = /drill point|drill spot|where to drill|scop(e|ing)|manipulat|dial(ing)? the combination|punch the|peel the|pry the door|soft spot|bypass the (lock|relocker)|hard plate at/i;
const safeHowTo = S.filter(r => DEFEAT.test([r.is, r.find, r.path, r.auth].join(' ')));
check('the safe section explains no way into a safe', !safeHowTo.length,
  safeHowTo.map(r => r.id).join(', '));
const safeBlankHowTo = B.filter(b => b.cat === 'Safe & vault' && DEFEAT.test(String(b.notes || '')));
check('nor do the safe blank rows', !safeBlankHowTo.length,
  safeBlankHowTo.map(b => b.id).join(', '));

/* ---- body style ----
   `body` is not decoration any more: it routes a record to the Vehicles tab or
   the Moto tab. A typo here does not look like an error, it looks like a record
   that quietly went missing from both. */
const BODIES = ['car', 'truck', 'suv', 'van', 'bus', 'moto', 'equip'];
const badBody = V.filter(v => !BODIES.includes(v.body));
check('every vehicle has a known body style', !badBody.length,
  badBody.map(v => v.id + ':' + v.body).join(', '));

/* Powersports blanks name the makes they cover. Every one of those makes that
   the seed carries at all has to sit in the Moto tab, or the blank's make chip
   sends you to a tab with nothing in it. */
const psMakes = new Set(B.filter(b => b.cat === 'Powersports')
  .flatMap(b => b.makes || []));
/* A make can legitimately sell both — Honda, BMW and Suzuki build cars too —
   so this only flags a make whose every record is a bike yet is filed as a car. */
const allMotoMakes = [...psMakes].filter(m => {
  const rows = V.filter(v => v.make === m);
  return rows.length && rows.every(v => /motorcycle|atv|scooter|snowmobile|side-by-side|moped/i.test(v.model)
    || v.body === 'moto');
});
const misfiled = allMotoMakes.flatMap(m => V.filter(v => v.make === m && v.body !== 'moto'));
check('powersports-only makes are filed under moto', !misfiled.length,
  misfiled.map(v => v.id + ':' + v.body).join(', '));

/* ---- Lishi guide ----
   The guide credits a tool with a vehicle by finding "Lishi <TOOL>" in the
   record. That only works while the two agree on the spelling, so a tool named
   in a record with no row in the guide is a car you cannot reach from the tool
   you are holding, and a row naming a tool no record mentions is a tool that
   lists nothing. Both are silent failures without this check. */
const lishiIds = new Set(L.map(r => r.id));
check('lishi rows have unique ids', lishiIds.size === L.length);
check('every lishi row has a tool, family, keyway and use',
  L.every(r => r.tool && r.fam && r.kw && r.use));

const NAMED = /\bLishi\s+([A-Z0-9][A-Z0-9.\-]*[A-Z0-9])/g;
const mentioned = new Set();
V.forEach(v => {
  const hay = [(v.lock || {}).decode, v.doorUnlock, (v.programming || {}).notes].join(' ');
  let m; NAMED.lastIndex = 0;
  while ((m = NAMED.exec(hay))) mentioned.add(m[1].toUpperCase());
});
const haveTool = new Set(L.map(r => r.tool.toUpperCase()));
/* A row may cover several tool names sold as one kit (TR47 / TOY40). */
L.forEach(r => String(r.tool).split(/[\/,]/).forEach(t => haveTool.add(t.trim().toUpperCase())));
const unlisted = [...mentioned].filter(t => !haveTool.has(t)).sort();
check('every Lishi tool named in a record is in the guide', !unlisted.length, unlisted.join(', '));
const orphan = L.filter(r => !String(r.tool).split(/[\/,]/)
  .some(t => mentioned.has(t.trim().toUpperCase()))).map(r => r.tool);
check('every guide row is named by at least one record', !orphan.length, orphan.join(', '));

/* ---- categories ---- */
const CATS = ['Automotive', 'Powersports', 'Fleet & equipment', 'Utility', 'Residential', 'Commercial', 'Safe & vault', 'Import & uncommon'];
const badCat = B.filter(b => !CATS.includes(b.cat));
check('every blank sits in a known category', !badCat.length,
  badCat.map(b => b.id + ':' + b.cat).join(', '));

/* ---- cross-category linking ----
   The blank detail page lists "vehicles in your database that take this blank"
   by matching keyway words. A residential, commercial or utility keyway must
   never match a car: those matches are always a generic English word two
   descriptions happen to share, and they read as data. This is the check that
   caught a warehouse roll-up door claiming an Isuzu box truck, and a trailer
   reefer unit claiming an office cam lock. */
const STOP = require('./stopwords.js');
/* A single character is never evidence that two keyways are related: the S and
   the G in "S&G" matched the S in Can-Am's "D.E.S.S." and put a safe lock on a
   Sea-Doo. This used to be a private copy of app.js's tokenizer, which is how
   the app kept shipping without the guard while this file passed. It is the
   app's own function now. */
const words = require('./stopwords.js').keyWords;
const bare = (s) => String(s || '').split(/[\/,]/)
  .map(t => t.replace(/\(.*?\)/g, '').replace(/[^A-Za-z0-9]/g, '').toUpperCase()).filter(Boolean);

const crossLinks = [];
const NON_AUTO = ['Residential', 'Commercial', 'Utility', 'Safe & vault', 'Import & uncommon'];
B.filter(b => NON_AUTO.includes(b.cat)).forEach(b => {
  const keys = new Set(words(b.keyway));
  const cats = new Set([b.ilco, b.ilcoChip].flatMap(bare));
  V.forEach(v => {
    const vb = v.blanks || {};
    const hit = words(vb.keyway).some(w => keys.has(w))
      || (cats.size && bare(vb.ilco).some(c => cats.has(c)));
    if (hit) crossLinks.push(`${b.id} -> ${v.make} ${v.model}`);
  });
});
check('no door, utility or padlock blank matches a vehicle', !crossLinks.length,
  crossLinks.slice(0, 6).join('\n     '));

/* ---- blank-number rows ---- */
/* 854 records arrived with the make and the Ilco number pasted into the keyway
   field -- "Sargent 1007HE" for blank 1007HE -- which runs the cross-reference
   backwards: you read a keyway off a lock and it should hand you a blank
   number, not repeat itself. Those rows keep their verified catalog numbers but
   must declare that the keyway is not confirmed, so nothing in the UI presents
   the label as something to look for on a lock. */
/* Equality is not the tell. HU101, H92 and B111 are real keyway designations
   whose Ilco blank happens to carry the same name, and 34 rows are legitimately
   like that. Nor is a keyway that lists alternatives -- "HD106/HO05" and
   "B1 / 1098" name two ways to ask for the same profile, one of which is the
   blank number. The tell is a manufacturer's name bolted onto the front of the
   number with no alternative offered, which is what turns the keyway field into
   a restatement of the Ilco column. */
const flat = (s) => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
const restates = (b) => {
  const i = flat(b.ilco);
  if (!i || b.ilco === '—') return false;
  const alts = String(b.keyway || '').split(/[\/,]/).map(flat).filter(Boolean);
  if (alts.some(a => a === i)) return false;
  return flat(b.keyway).endsWith(i) && flat(b.keyway).length > i.length;
};
const unflagged = B.filter(b => restates(b) && !b.kwUnknown);
check('a keyway that only restates the Ilco number is flagged kwUnknown',
  !unflagged.length, unflagged.slice(0, 6).map(b => `${b.id} (${b.keyway} = ${b.ilco})`).join('\n     '));
check('every kwUnknown row still carries the Ilco number it is indexed by',
  B.filter(b => b.kwUnknown).every(b => b.ilco && b.ilco !== '—'));

/* 19 distinct page ranges spread across 994 records is a section range pasted
   onto everything in the section, not a citation. Precision that cannot be
   checked is worse than no citation at all, because it invites trust. */
const fakeCite = B.filter(b => /pages? \d/.test(b.notes || ''));
check('no blank record cites a page number', !fakeCite.length,
  fakeCite.slice(0, 4).map(b => b.id).join(', '));

/* One blank is one row. These seven pairs predate the cleanup and each needs a
   call I cannot make from inside the file -- 1054WB is claimed by WK2 and WR3
   at once while cat-wk2 puts WK2 on 1175N, so at least one of the three is
   wrong. Listed so they stay visible and so a new collision fails the run. */
const KNOWN_ILCO_COLLISIONS = {
  '1145': ['sc1', 'schlage-l'], '1176': ['builder-grade', 'kw1'],
  'Y164': ['cy24', 'y164'], 'VW1': ['hu49', 'vw1'], 'TR47': ['toy2', 'tr47'],
  '1054WB': ['cat-wr3', 'we1'], '1A1A1': ['best-sfic', 'cat-best-a2-a'],
};
const byIlco = {};
B.forEach(b => {
  const i = String(b.ilco || '').toUpperCase();
  if (i && i !== '—') (byIlco[i] = byIlco[i] || []).push(b.id);
});
const newCollisions = Object.entries(byIlco).filter(([i, ids]) => ids.length > 1
  && String(KNOWN_ILCO_COLLISIONS[i] || []) !== String(ids.slice().sort()));
check('no new Ilco number lands on two blank records', !newCollisions.length,
  newCollisions.map(([i, ids]) => `${i}: ${ids.join(', ')}`).join('\n     '));

/* ---- how people actually name a car ---- */
/* Nobody says "Chevrolet" and nobody says "Crown Victoria Police Interceptor".
   They say Chevy and P71, and every one of these came back empty before the
   nickname map and the per-record aliases went in. Encoded as the queries
   themselves so a refactor of the haystack cannot quietly break them again. */
const appSrc = fs.readFileSync(path.join(__dirname, '../assets/js/app.js'), 'utf8');
const nickBlock = appSrc.match(/const MAKE_NICKNAMES = \{([\s\S]*?)\n\};/);
check('the make-nickname map is still in app.js', !!nickBlock);
const NICK = {};
if (nickBlock) {
  for (const m of nickBlock[1].matchAll(/'([^']+)':\s*'([^']*)'/g)) NICK[m[1]] = m[2];
}
/* A nickname on a make no record carries is a nickname that does nothing. */
const seedMakes = new Set(V.map(v => v.make));
const deadNicks = Object.keys(NICK).filter(m => !seedMakes.has(m));
check('every nicknamed make exists in the seed', !deadNicks.length, deadNicks.join(', '));

const squash = require('./stopwords.js').squash;   // lifted from app.js, never copied
const hay = (v) => [v.make, NICK[v.make] || '', v.model, (v.aliases || []).join(' '),
  v.blanks.keyway, v.blanks.ilco, v.blanks.silca, v.blanks.jma, v.blanks.oem,
  v.transponder.chip, v.transponder.system,
  (v.remotes || []).map(r => `${r.fcc} ${r.pn}`).join(' ')].join(' ').toLowerCase();
const finds = (q) => V.filter(v => {
  const h = hay(v), hs = squash(h);
  return q.toLowerCase().split(/\s+/).filter(Boolean)
    .every(w => h.includes(w) || hs.includes(squash(w)));
}).length;
const VOCAB = ['chevy', 'bimmer', 'beemer', 'vw', 'benz', 'mopar', 'subie', 'caddy', 'olds',
  'z71', 'denali', 'king ranch', 'tacoma trd', 'hellcat', 'panther', 'p71', 'vette', 'c8',
  'rubicon', 'obs', 'squarebody', 'dually', 'e250', 'escalade esv', 'prius v', 'bronco raptor'];
const silent = VOCAB.filter(q => finds(q) === 0);
check('the words customers actually use all find something', !silent.length, silent.join(', '));

/* ---- bench guidance ---- */
/* The empty case is the dangerous one: a record with no note reads as "nothing
   to know here", when what it usually meant was that nobody had written down
   the ten-minute timed access or the PIN-by-VIN call that decides the quote. */
const noNote = V.filter(v => v.body !== 'moto' && !String(v.programming.notes || '').trim());
check('every car record says what to expect at the bench', !noNote.length,
  `${noNote.length} with no note: ` + noNote.slice(0, 6).map(v => v.id).join(', '));

/* ---- the blank directory has to be searchable the way you talk ---- */
/* This box used to match the whole query as one literal substring, so "horse
   trailer" found nothing on a row called "Horse and livestock trailer" and you
   had to guess the row's exact wording. Terms are matched independently now,
   like the vehicle lookup always did. Asserted against the real haystack
   fields so a change to either the rows or the matcher has to keep these
   working. */
const blankHay = (b) => [b.keyway, b.ilco, b.ilcoChip, b.silca, b.jma, b.strattec,
  b.cut, b.cat, b.notes].concat(b.makes || []).join(' ').toLowerCase();
const flatten = (x) => String(x == null ? '' : x).toLowerCase().replace(/[^a-z0-9]+/g, '');
const blankFinds = (q) => B.filter(b => {
  const h = blankHay(b), f = flatten(h);
  return q.toLowerCase().split(/\s+/).filter(Boolean)
    .every(t => h.includes(t) || f.includes(flatten(t)));
});
const BLANK_QUERIES = ['horse trailer', 'scissor lift', 'well pump', 'cluster box',
  'vineyard', 'marina', 'roof hatch', 'royal enfield', 'hy15', 'toy51',
  'medical cart', 'car wash', 'ranch gate', 'solar inverter', 'parcel locker'];
const blankSilent = BLANK_QUERIES.filter(q => blankFinds(q).length === 0);
check('the blank directory answers multi-word searches', !blankSilent.length,
  blankSilent.join(', '));

/* app.js must actually do it that way -- the data passing this test while the
   shipped matcher stayed substring-only is exactly how the last one hid. */
check('the blanks matcher splits the query into terms',
  /const terms = q\.split\(\/\\s\+\/\)/.test(appSrc)
  && /terms\.every\(/.test(appSrc.slice(appSrc.indexOf('function matchBlanks'),
       appSrc.indexOf('function matchBlanks') + 900)));

/* ---- the directory has to open what you searched for ---- */
/* A search that matches a readable number of rows renders them; one that
   matches most of the file stays collapsed. The budget was 12, sized for a
   directory a third of this one, and it had quietly started hiding ordinary
   searches -- "toyota" matched 14 rows and showed a bare header. Both ends are
   asserted, because raising the limit far enough to fix that would otherwise be
   free to keep rising until a one-letter query renders 1200 rows. */
const budget = appSrc.match(/confirmedHits <= (\d+) && hits\.length <= (\d+)/);
check('the auto-open budget is still in app.js', !!budget);
const [maxConf, maxHits] = budget ? [Number(budget[1]), Number(budget[2])] : [0, 0];
const opens = (q) => {
  const hits = blankFinds(q);
  return hits.filter(b => !b.kwUnknown).length <= maxConf && hits.length <= maxHits;
};
const SHOULD_OPEN = ['dimple', 'toyota', 'ford', 'safe', 'padlock', 'euro',
  'high security', 'schlage', 'lockwood', 'restricted', 'vineyard', 'marina'];
const SHOULD_STAY_SHUT = ['edge', 'key', 'ilco', 'commercial', 'a', 'e'];
const shut = SHOULD_OPEN.filter(q => !opens(q));
check('an ordinary search opens its results', !shut.length,
  shut.map(q => `${q} (${blankFinds(q).filter(b => !b.kwUnknown).length} confirmed)`).join(', '));
const flung = SHOULD_STAY_SHUT.filter(q => opens(q));
check('a search matching most of the file stays collapsed', !flung.length,
  flung.map(q => `${q} would open ${blankFinds(q).length} rows`).join(', '));

/* ---- dimple ---- */
/* It was in the data all along but spread over four categories with nothing
   explaining the method, so one search had to gather it. */
const dimple = blankFinds('dimple');
check('one search gathers the dimple family', dimple.length >= 14, `${dimple.length} rows`);
check('the dimple family includes the method and sourcing rows',
  ['dimple-method', 'dimple-sourcing', 'dimple-euro', 'multlock'].every(id => dimple.some(b => b.id === id)),
  dimple.map(b => b.id).join(', '));
/* Ilco does not make most of these. An invented number here is a parts order. */
check('no dimple row claims an Ilco number',
  B.filter(b => /dimple/i.test(b.cut || '')).every(b => !b.ilco || b.ilco === '—'),
  B.filter(b => /dimple/i.test(b.cut || '') && b.ilco && b.ilco !== '—').map(b => b.id).join(', '));

/* ---- bit and flat steel ---- */
/* Both were in the directory by application -- warded interior doors, antique
   safes, British levers, luggage, boat hatches -- but neither existed as a
   family, so there was nowhere that explained how you pick a bit blank or hold
   a flat key. Flat appeared only as a cut qualifier on ten rows and had no row
   of its own at all. */
const bitFamily = blankFinds('bit key');
check('one search gathers the bit key family', bitFamily.length >= 6, `${bitFamily.length} rows`);
check('the bit family includes the sizing row and the warded row',
  ['bit-sizing', 'warded-bit'].every(id => bitFamily.some(b => b.id === id)),
  bitFamily.map(b => b.id).join(', '));
const flatFamily = blankFinds('flat');
check('one search gathers the flat steel family', flatFamily.length >= 8, `${flatFamily.length} rows`);
check('the flat family includes its own family row',
  flatFamily.some(b => b.id === 'flat-steel-family'), flatFamily.map(b => b.id).join(', '));

/* A bit key is filed to dimensions, so the sizing row is useless unless it
   names all four. This is the row someone reads before driving out. */
const sizing = B.find(b => b.id === 'bit-sizing');
check('the bit sizing row names every measurement you need',
  sizing && ['shank diameter', 'shoulder', 'bit height', 'bit thickness']
    .every(t => new RegExp(t, 'i').test(sizing.notes || '')),
  sizing ? sizing.notes.slice(0, 80) : 'row missing');

/* Customers call a clock winding key a key. It is a socket on an arbor and
   there is no lock in it, and the row has to say so or it misleads. */
const clock = B.find(b => b.id === 'bit-clock-winding');
check('the clock row says a winding key is not a lock key',
  clock && /not a lock key|not lock keys/i.test(clock.notes || ''),
  clock ? clock.notes.slice(0, 80) : 'row missing');

/* Same rule as the dimple rows: Ilco does not number most bit and flat blanks
   by a keyway, and a number here would be a parts order rather than a lookup. */
const bitFlatRows = B.filter(b => /^(bit|flat)-/.test(b.id));
check('no bit or flat row claims an Ilco number',
  bitFlatRows.every(b => !b.ilco || b.ilco === '—'),
  bitFlatRows.filter(b => b.ilco && b.ilco !== '—').map(b => b.id).join(', '));

/* ---- tubular ---- */
/* Two rows already named the Ace pattern and its variants, but neither said how
   you work one: what identifies the key, what machine holds it, how you read a
   code off it. */
const tubular = blankFinds('tubular');
check('one search gathers the tubular family', tubular.length >= 12, `${tubular.length} rows`);
check('the tubular family includes the method row and the naming-clash row',
  ['tubular-method', 'tubular-vs-latch', 'ace-tubular', 'tubular-variants']
    .every(id => tubular.some(b => b.id === id)),
  tubular.map(b => b.id).join(', '));
const tubeMethod = B.find(b => b.id === 'tubular-method');
check('the tubular method row names what identifies the key',
  tubeMethod && [/how many pins/i, /outside diameter/i, /diameter of the post/i, /centred or offset/i]
    .every(r => r.test(tubeMethod.notes || '')),
  tubeMethod ? tubeMethod.notes.slice(0, 80) : 'row missing');
/* "Tubular" names a key and a door prep and they are unrelated. Ordering the
   wrong one is a wasted trip, so the row has to keep saying which is which. */
const clash = B.find(b => b.id === 'tubular-vs-latch');
check('the naming-clash row still explains both meanings',
  clash && /tubular key/i.test(clash.notes || '') && /bore/i.test(clash.notes || '')
    && /edge-cut/i.test(clash.notes || ''),
  clash ? clash.notes.slice(0, 80) : 'row missing');

/* ---- the cut field has to agree with the row's own notes ---- */
/* The cut field is what decides which machine and clamp go in the van, and four
   rows contradicted themselves on it: a vending T-handle whose notes said
   "usually tubular" was filed as Edge, and so were two wafer families and a
   showcase row that names tubular in its own text. A reference that sends you
   out with the wrong clamp is worse than a blank field. */
const CUT_FAMILIES = ['tubular', 'dimple', 'bit', 'warded', 'flat', 'wafer', 'barrel', 'lever'];
const contradictions = [];
B.forEach(b => {
  const cut = String(b.cut || '').toLowerCase();
  const notes = String(b.notes || '').toLowerCase();
  CUT_FAMILIES.forEach(f => {
    const asserts = new RegExp(`(usually|almost always|mostly|nearly always|are) (a |an )?${f}\\b|\\b${f} (and \\w+ )?locks\\b`);
    if (asserts.test(notes) && !cut.includes(f)) {
      contradictions.push(`${b.id}: cut="${b.cut}" but notes say ${f}`);
    }
  });
});
check('no row contradicts its own notes about the cut', !contradictions.length,
  contradictions.join('\n     '));

/* ---- cruciform ---- */
/* One row named the cross key and said the tooling exists. Nothing said how you
   identify one, hold it, or decode it, which is the part that decides the job. */
const cruci = blankFinds('cruciform');
check('one search gathers the cruciform family', cruci.length >= 5, `${cruci.length} rows`);
check('the cruciform family includes the method row and the original',
  ['cruciform', 'cruciform-method', 'cruciform-security', 'cruciform-padlock-bike', 'cruciform-auto']
    .every(id => cruci.some(b => b.id === id)),
  cruci.map(b => b.id).join(', '));
const cm = B.find(b => b.id === 'cruciform-method');
check('the cruciform method row says to count pin rows, not blades',
  cm && /pin ROWS, not the blades/i.test(cm.notes || '') && /guide/i.test(cm.notes || ''),
  cm ? cm.notes.slice(0, 80) : 'row missing');
check('no cruciform row claims an Ilco number',
  B.filter(b => /^cruciform/.test(b.id)).every(b => !b.ilco || b.ilco === '—'),
  B.filter(b => /^cruciform/.test(b.id) && b.ilco && b.ilco !== '—').map(b => b.id).join(', '));

/* "Cross key" is what a customer calls a cruciform, and it used to return 657
   rows -- the word "cross" was buried in a cross-reference note on 637 of them,
   so the term was useless. The notes say catalogue and equivalence now. If
   "cross-reference" creeps back into the bulk notes this goes straight back to
   unusable, so the search itself is the assertion. */
const crossKey = blankFinds('cross key');
check('"cross key" finds the cruciform rows and not the whole catalogue',
  crossKey.length <= 40 && ['cruciform', 'cruciform-method'].every(id => crossKey.some(b => b.id === id)),
  `${crossKey.length} rows: ` + crossKey.slice(0, 8).map(b => b.id).join(', '));
const crossNoise = B.filter(b => /cross-reference/i.test(b.notes || ''));
check('the bulk notes do not bury the word cross', crossNoise.length <= 5,
  `${crossNoise.length} rows still say cross-reference`);

/* ---- safe deposit ---- */
/* The directory said RESTRICTED and stopped, which is right for a box still in
   service and useless for the ex-bank nest someone buys at an auction. Both now
   exist, and the whole value is that they stay told apart: a renter key is never
   yours, a decommissioned box always is. */
const sdFamily = blankFinds('safe deposit');
check('one search gathers the safe deposit family', sdFamily.length >= 5, `${sdFamily.length} rows`);
check('the safe deposit family covers renter, guard, ex-bank and private vault',
  ['safe-deposit', 'sd-renter-key', 'sd-guard-key', 'sd-exbank', 'sd-private-vault']
    .every(id => sdFamily.some(b => b.id === id)),
  sdFamily.map(b => b.id).join(', '));

/* The safety-critical pair. An edit that softened either of these would be the
   dangerous regression, so both directions are asserted: the in-service rows
   must keep saying RESTRICTED, and the out-of-service one must NOT, or it reads
   as refused and the legitimate job gets turned away. */
const IN_SERVICE = ['safe-deposit', 'sd-renter-key', 'sd-guard-key', 'sd-private-vault'];
const unmarked = IN_SERVICE.filter(id => {
  const row = B.find(b => b.id === id);
  return !row || !/RESTRICTED/.test(row.notes || '');
});
check('every in-service safe deposit row still says RESTRICTED', !unmarked.length, unmarked.join(', '));
const exbank = B.find(b => b.id === 'sd-exbank');
check('the out-of-service row is not marked restricted',
  exbank && !/RESTRICTED/.test(exbank.notes || '') && /IS yours/i.test(exbank.notes || ''),
  exbank ? exbank.notes.slice(0, 70) : 'row missing');

/* A bank box is a refusal and has to stay one, in the group that means it. */
const sdSafe = S.find(r => r.id === 'deposit');
check('the bank safe deposit box stays in the refusal group',
  sdSafe && sdSafe.group === 'no' && sdSafe.stop === true && /the bank/i.test(sdSafe.auth || ''),
  sdSafe ? `group=${sdSafe.group} stop=${sdSafe.stop}` : 'row missing');
/* And its legitimate counterpart must demand proof of ownership rather than
   inheriting the refusal or waving the job through. */
const exSafe = S.find(r => r.id === 'exbank');
check('the ex-bank safe row asks for proof of ownership',
  exSafe && !exSafe.stop && /bill of sale|receipt|estate inventory/i.test(exSafe.auth || '')
    && /in-service bank box/i.test(exSafe.auth || ''),
  exSafe ? exSafe.auth.slice(0, 70) : 'row missing');

/* ---- magnetic ---- */
/* One row covered EVVA MCS. The rest of the family was absent, including the
   two that actually cost time: a key that carries a magnet alongside ordinary
   cuts, and the childproof latch whose key is a magnet puck. */
const mag = blankFinds('magnetic');
check('one search gathers the magnetic family', mag.length >= 6, `${mag.length} rows`);
check('the magnetic family covers the method, the assisted key and the latch',
  ['magnetic-key', 'magnetic-method', 'magnetic-assisted', 'magnetic-childproof',
   'magnetic-shutter', 'magnetic-gunsafe'].every(id => mag.some(b => b.id === id)),
  mag.map(b => b.id).join(', '));

/* The clarification the row exists for: three words people use interchangeably
   on the phone are three different jobs. */
const magMethod = B.find(b => b.id === 'magnetic-method');
check('the magnetic method row separates magnet, transponder and fob',
  magMethod && /not a transponder/i.test(magMethod.notes || '')
    && /not an RFID fob|not and RFID|RFID/i.test(magMethod.notes || ''),
  magMethod ? magMethod.notes.slice(0, 80) : 'row missing');

/* The trap: a magnetically assisted key duplicates dimensionally perfectly and
   still will not turn, which reads as a bad cut and is not one. If that
   sentence ever goes, the row has lost its only reason to exist. */
const assisted = B.find(b => b.id === 'magnetic-assisted');
check('the assisted-key row warns that a good copy still will not turn',
  assisted && /enters cleanly, and does nothing/i.test(assisted.notes || '')
    && /reads exactly like a bad cut/i.test(assisted.notes || ''),
  assisted ? assisted.notes.slice(0, 80) : 'row missing');

/* Same standard as every other gun safe row, and no method in it. */
const magGun = B.find(b => b.id === 'magnetic-gunsafe');
check('the magnetic gun safe row keeps the ownership standard',
  magGun && /VERIFY OWNERSHIP IN WRITING/.test(magGun.notes || ''),
  magGun ? magGun.notes.slice(0, 70) : 'row missing');
check('and names no way to open one without its key',
  magGun && !/rare earth|neodymium|hold a magnet|slide a magnet|strong magnet against/i.test(magGun.notes || ''));

check('no magnetic row claims an Ilco number',
  B.filter(b => /^magnetic/.test(b.id)).every(b => !b.ilco || b.ilco === '—'),
  B.filter(b => /^magnetic/.test(b.id) && b.ilco && b.ilco !== '—').map(b => b.id).join(', '));

/* ---- cabinet and furniture locks ----
   The directory already carried ~40 National Cabinet rows and a set of
   casework method rows, so the gap was never "cabinet keys" in general. It
   was the brands genuinely absent -- Lowe & Fletcher above all, which is
   behind most imported office casework and locker banks -- and the job that
   comes up most and had no row at all: there is no key, there is no code,
   and the answer is to measure the cylinder and replace it. */
const byId = Object.fromEntries(B.map(b => [b.id, b]));

check('the Lowe & Fletcher family has a row explaining the LF numbering',
  !!byId['lowe-fletcher'] && /code/i.test(byId['lowe-fletcher'].notes));

const LF = ['lf-3', 'lf-7', 'lf-10', 'lf-12', 'lf-19', 'lf-30r'];
check('every Lowe & Fletcher blank row is present', LF.every(id => byId[id]),
  LF.filter(id => !byId[id]).join(', '));
check('each carries an Ilco number rather than a dash',
  LF.every(id => byId[id] && byId[id].ilco && byId[id].ilco !== '—'));

/* These came off a supplier listing, not the edition 13 catalogue pass. The
   cat- prefix is what that pass is counted by, so wearing it would both
   misstate where the numbers came from and inflate a guarded count. */
check('and none of them claims the catalogue prefix',
  LF.every(id => !/^(cat-|cat13-)/.test(id)));
check('each says on its face that a supplier listing is the source',
  LF.every(id => /CLK Supplies/.test(byId[id].notes)),
  LF.filter(id => !/CLK Supplies/.test(byId[id].notes)).join(', '));

check('the Timberline row was enriched rather than duplicated',
  byId['cat-il11'] && byId['cat-il11'].silca === 'HF1R'
  && /KY-300/.test(byId['cat-il11'].notes));
check('and no second Timberline blank row was added alongside it',
  B.filter(b => /\b1043J\b/.test(String(b.ilco || ''))).length === 1);

check('the cam lock replacement row names what to measure',
  byId['cam-lock-replace']
  && /cylinder length/i.test(byId['cam-lock-replace'].notes)
  && /cam/i.test(byId['cam-lock-replace'].notes));
check('the key-alike row does not oversell a cabinet lock',
  byId['cam-lock-keyalike'] && /privacy device, not security/i.test(byId['cam-lock-keyalike'].notes));
check('the tool chest row is kept apart from the truck toolbox row',
  byId['tool-chest-rolling'] && byId['toolbox-truck']
  && /not truck boxes/i.test(byId['tool-chest-rolling'].notes));
check('the European furniture makers have a row',
  byId['euro-furniture-makers']
  && ['Häfele', 'Huwil', 'Meroni', 'Eurolocks'].every(m =>
       (byId['euro-furniture-makers'].makes || []).includes(m)));

/* A row nobody can find is a row that does not exist. */
const findable = (q) => {
  const terms = q.toLowerCase().split(/\s+/);
  return B.filter(b => {
    const hay = [b.keyway, b.ilco, b.silca, b.jma, b.cut, b.cat, b.notes]
      .concat(b.makes || []).join(' ').toLowerCase();
    return terms.every(t => hay.includes(t));
  });
};
[['lowe fletcher', 7], ['cam lock', 2], ['locker', 2], ['tool chest', 1], ['hafele', 0]]
  .forEach(([q, least]) => check(`searching "${q}" reaches the new material`,
    findable(q).length >= least, `${findable(q).length} rows`));
/* Häfele carries an accent and nobody types an umlaut on a phone at a job.
   app.js squashes punctuation out of both sides of a search; it used to drop
   the accented letter entirely, turning "Häfele" into "hfele", so the row was
   unreachable by its own name. squash() folds accents now, and this checks
   the fold rather than the row -- the next Citroën or Škoda depends on it. */
check('squash folds accents instead of deleting the letter',
  squash('Häfele') === 'hafele' && squash('Citroën') === 'citroen'
  && squash('Škoda') === 'skoda',
  [squash('Häfele'), squash('Citroën'), squash('Škoda')].join(' '));
check('and still squashes punctuation the way it always did',
  squash('F-150') === 'f150' && squash('TOY44H-PT') === 'toy44hpt');
check('so the accented row is reachable by its plain spelling',
  B.some(b => squash([b.keyway, (b.makes || []).join(' ')].join(' ')).includes('hafele')));

/* ---- Best SFIC blanks, and the two numbering systems ----
   The directory carried the same physical Best blank twice: once under the
   Best designation 1A1G1 and once under the Ilco number A1114G, in separate
   rows with nothing connecting them. Searching one number told you nothing
   about the other, which on a counter is the whole question. A CLK Supplies
   listing sells each blank under both numbers on one page, which is what
   established the pairing. */
const BEST_PAIRS = {
  '1A1A1':'A1114A', '1A1B1':'A1114B', '1A1C1':'A1114C', '1A1D1':'A1114D',
  '1A1DD1':'A1114DD', '1A1E1':'A1114E', '1A1F1':'A1114F', '1A1FM1':'A1114FM',
  '1A1G1':'A1114G', '1A1H1':'A1114H', '1A1J1':'A1114J', '1A1K1':'A1114K',
  '1A1L1':'A1114L', '1A1M1':'A1114M', '1A1N1':'A1114N', '1A1Q1':'A1114Q',
  '1A1TA1':'A1114TA', '1A1TB1':'A1114TB', '1A1TD1':'A1114TD', '1A1TE1':'A1114TE',
  '1A1WA1':'A1114WA', '1A1WC1':'A1114WC', '1A1WD1':'A1114WD', '1A1WE1':'A1114WE',
  '1A1WG1':'A1114WG', '1A1WH1':'A1114WH', '1A1WY1':'A1114WY'
};
const blankSearch = (q) => {
  const terms = String(q).toLowerCase().split(/\s+/).filter(Boolean);
  return B.filter(b => {
    const hay = [b.keyway, b.ilco, b.ilcoChip, b.silca, b.jma, b.strattec, b.cut, b.cat, b.notes]
      .concat(b.makes || []).join(' ').toLowerCase();
    const flat = squash(hay);
    return terms.every(t => hay.includes(t) || flat.includes(squash(t)));
  });
};

const unreachable = Object.entries(BEST_PAIRS).filter(([a, b]) =>
  !blankSearch(a).length || !blankSearch(b).length);
check('every Best SFIC keyway is reachable by both of its numbers', !unreachable.length,
  unreachable.map(([a, b]) => a + '/' + b).join(', '));

/* The point is not that both numbers find something -- it is that whichever
   one you have in hand, the row names the other. */
const oneWay = Object.entries(BEST_PAIRS).filter(([a, b]) =>
  !blankSearch(a).some(r => JSON.stringify(r).includes(b))
  || !blankSearch(b).some(r => JSON.stringify(r).includes(a)));
check('and each one names its counterpart, so either number answers the question',
  !oneWay.length, oneWay.map(([a, b]) => a + ' <-> ' + b).join(', '));

/* These came off a supplier listing, so they must not wear the prefix the
   edition 13 catalogue pass is counted by -- the same rule the Lowe &
   Fletcher rows follow. */
const clkRows = B.filter(b => /CLK Supplies/.test(b.notes || ''));
check('the CLK-sourced rows say so on their face', clkRows.length >= 13,
  clkRows.length + ' rows cite CLK');
/* The rule is about where a ROW came from, not whether CLK is mentioned on
   it. An edition 13 row that cites CLK for a supplementary reference -- the
   Ilco EZ number, a second designation for the same blank -- is fine and is
   better than leaving the addition unattributed. What must never happen is a
   row whose own numbers came from the supplier wearing the prefix that marks
   the catalogue pass. Those rows say "not the Ilco edition 13 pass", so that
   is the thing to test. */
const clkSourced = B.filter(b => /not the Ilco edition 13 pass/.test(b.notes || ''));
check('rows sourced from CLK exist and are marked as such', clkSourced.length >= 5,
  clkSourced.length + ' rows');
check('and none of them claims the edition 13 prefix',
  clkSourced.every(b => !/^(cat-|cat13-)/.test(b.id)),
  clkSourced.filter(b => /^(cat-|cat13-)/.test(b.id)).map(b => b.id).join(', '));

/* The golf cart row promised three blanks and named none of them. */
const gc = B.find(b => b.id === 'golfcart');
check('the golf cart row names the blanks it promises',
  gc && /CC1/.test(gc.notes) && /1677/.test(gc.notes) && /1919/.test(gc.notes), gc && gc.notes);
['club car cc1', 'ez-go 1677'].forEach(q =>
  check(`searching "${q}" reaches the cart row`, blankSearch(q).length >= 1));

check('the two Euro blanks are present and findable',
  blankSearch('EU1R').length === 1 && blankSearch('EU-8D').length === 1);

/* ---- Corbin Russwin, Sargent, Yale, Mosler ----
   Same compare as the Best set: CLK pairs the Ilco EZ reference (CO89, RU16,
   S22) with the full Ilco number, and the directory held the full numbers
   from the edition 13 pass without the EZ reference. Adding it is additive;
   the edition 13 values are not touched. */
const EZ_PAIRS = {
  'CO89':'A1001ABM', 'CO91':'A1001AH', 'RU16':'A1011P', 'CO98':'A1001C1',
  'CO92':'A1001FH', 'CO94':'A1001BH', 'CO95':'A1001DH', 'CO33':'1001E',
  'CO102':'A1001C2', 'CO51':'A1001D1', 'CO107':'A1001D1'
};
const ezMissing = Object.entries(EZ_PAIRS).filter(([ez, num]) =>
  !blankSearch(ez).some(r => JSON.stringify(r).toUpperCase().includes(num)));
check('every Ilco EZ reference reaches the blank it names', !ezMissing.length,
  ezMissing.map(([a, b]) => a + ' -> ' + b).join(', '));
check('one Ilco number carrying two EZ references says both',
  ['CO51', 'CO107'].every(ez => blankSearch(ez).some(r => r.id === 'cat13-corbin-a1001d1')));

['L1011PZ', 'R1001EP', 'N1007KMA', '1095A', '1115A'].forEach(d =>
  check(`the absent blank ${d} is now carried`, blankSearch(d).length >= 1));
check('S22 1/2 reaches 1007LA', blankSearch('S22 1/2').some(r => r.id === 'cat13-sargent-1007la'));
check('the Yale section row now names its Ilco numbers',
  blankSearch('998GA').some(r => r.id === 'y4-res'));

/* ---- the conflict that was recorded instead of resolved ----
   CLK sells S22 as O1007LA. The edition 13 pass has O1007CA, and that is the
   value that fits: the whole O1007C series runs SAR-29 to SAR-41 in order,
   while 1007LA is SAR-8 in a different series. Guessing between two sources
   on a blank number is how someone buys the wrong key, so the row keeps the
   edition 13 value and says the sources disagree. */
const s22 = B.find(b => b.id === 'cat-s22');
check('the S22 row keeps its edition 13 number', s22 && s22.ilco === 'O1007CA', s22 && s22.ilco);
check('and says out loud that the sources disagree',
  s22 && /SOURCES DISAGREE/.test(s22.notes) && /O1007LA/.test(s22.notes));

/* The Sargent numbers CLK writes with a leading zero -- 01007LB, 01007RC --
   are ambiguous: Ilco runs both a plain 1007LB and an O-prefixed O1007CB as
   genuinely different blanks, so a leading 0 could be either a letter O or a
   typo for a blank already here. None of them were added. */
const zeroPrefixed = ['O1007LB', 'O1007LC', 'O1007LE', 'O1007RC', 'O1007RL'];
check('no blank was invented from an ambiguous leading zero',
  zeroPrefixed.every(d => !B.some(b => String(b.ilco || '').toUpperCase() === d)),
  zeroPrefixed.filter(d => B.some(b => String(b.ilco || '').toUpperCase() === d)).join(', '));

console.log(fail ? `\n${fail} FAILED` : `\nall data checks passed  (${V.length} vehicles, ${B.length} blanks)`);
process.exit(fail ? 1 : 0);
