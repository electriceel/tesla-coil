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

const squash = (x) => String(x == null ? '' : x).toLowerCase().replace(/[^a-z0-9]+/g, '');
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

console.log(fail ? `\n${fail} FAILED` : `\nall data checks passed  (${V.length} vehicles, ${B.length} blanks)`);
process.exit(fail ? 1 : 0);
