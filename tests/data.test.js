/* Data integrity, checked without a browser. These are the mistakes that are
   easy to make by hand and impossible to see by eye in a 300 KB seed file. */
const { SEED_VEHICLES: V, SEED_BLANKS: B } = require('../assets/js/data.js');

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

/* ---- categories ---- */
const CATS = ['Automotive', 'Powersports', 'Fleet & equipment', 'Residential', 'Commercial'];
const badCat = B.filter(b => !CATS.includes(b.cat));
check('every blank sits in a known category', !badCat.length,
  badCat.map(b => b.id + ':' + b.cat).join(', '));

/* ---- cross-category linking ----
   The blank detail page lists "vehicles in your database that take this blank"
   by matching keyway words. A residential or commercial keyway must never match
   a car: those matches are always a generic English word two descriptions
   happen to share, and they read as data. This is the check that caught a
   warehouse roll-up door claiming an Isuzu box truck. */
const STOP = require('./stopwords.js');
const words = (s) => String(s || '').replace(/\(.*?\)/g, ' ').toUpperCase()
  .split(/[^A-Z0-9]+/).filter(w => w && !STOP.has(w));
const bare = (s) => String(s || '').split(/[\/,]/)
  .map(t => t.replace(/\(.*?\)/g, '').replace(/[^A-Za-z0-9]/g, '').toUpperCase()).filter(Boolean);

const crossLinks = [];
B.filter(b => b.cat === 'Residential' || b.cat === 'Commercial').forEach(b => {
  const keys = new Set(words(b.keyway));
  const cats = new Set([b.ilco, b.ilcoChip].flatMap(bare));
  V.forEach(v => {
    const vb = v.blanks || {};
    const hit = words(vb.keyway).some(w => keys.has(w))
      || (cats.size && bare(vb.ilco).some(c => cats.has(c)));
    if (hit) crossLinks.push(`${b.id} -> ${v.make} ${v.model}`);
  });
});
check('no residential or commercial blank matches a vehicle', !crossLinks.length,
  crossLinks.slice(0, 6).join('\n     '));

console.log(fail ? `\n${fail} FAILED` : `\nall data checks passed  (${V.length} vehicles, ${B.length} blanks)`);
process.exit(fail ? 1 : 0);
