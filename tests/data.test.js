/* Data integrity, checked without a browser. These are the mistakes that are
   easy to make by hand and impossible to see by eye in a 300 KB seed file. */
const { SEED_VEHICLES: V, SEED_BLANKS: B, SEED_LISHI: L, SEED_SAFE: S, SAFE_GROUPS: SG } = require('../assets/js/data.js');

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
const CURRENT_GAP_ROWS = [
  'ford-mustang-2024-2026', 'ford-ranger-2024-2026', 'ford-expedition-2024-2026',
  'toyota-tacoma-2024-2026', 'toyota-4runner-2025-2026', 'toyota-camry-2025-2026',
  'subaru-forester-2019-2024', 'subaru-forester-2025-2026', 'nissan-kicks-2025-2026',
  'chevy-equinox-2025-2026', 'chevy-traverse-2018-2024', 'chevy-traverse-2025-2026',
  'gmc-terrain-2025-2026', 'gmc-acadia-2025-2026',
  'lincoln-navigator-2018-2024', 'lincoln-navigator-2025-2026'
];
const currentGapMissing = CURRENT_GAP_ROWS.filter(id => !V.some(v => v.id === id));
check('current-generation gap audit rows stay present', !currentGapMissing.length, currentGapMissing.join(', '));
check('every blank has a keyway and a category',
  B.every(b => b.keyway && b.cat));

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
/* A single character is never evidence that two keyways are related. Without
   this, the S and the G in "S&G" matched the S in Can-Am's "D.E.S.S." and put a
   safe lock on a Sea-Doo. */
const words = (s) => String(s || '').replace(/\(.*?\)/g, ' ').toUpperCase()
  .split(/[^A-Z0-9]+/).filter(w => w.length > 1 && !STOP.has(w));
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

console.log(fail ? `\n${fail} FAILED` : `\nall data checks passed  (${V.length} vehicles, ${B.length} blanks)`);
process.exit(fail ? 1 : 0);
