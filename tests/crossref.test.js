/* Catalog cross-references must not contradict each other.

   The blank directory holds one authoritative row per keyway. Vehicle records
   name the keyway and the Ilco blank; Silca and JMA live only on the blank row,
   because when both files carried them they disagreed 25 times and there was no
   way to tell from inside the file which side was right.

   Three rules, because the three fields number different things:
   - Silca references a PROFILE, roughly one per keyway, so two blank rows
     giving different Silca refs for the same keyway is a contradiction.
   - Ilco numbers a BLANK and a keyway carries many (CY24 covers Y159 to Y170),
     so only a different alpha family is an error.
   - Vehicles must not reintroduce a duplicated Silca or JMA. */
const { SEED_VEHICLES: V, SEED_BLANKS: B } = require('../assets/js/data.js');
const STOP = require('./stopwords.js');

let fail = 0;
const check = (name, ok, detail) => {
  if (ok) return console.log('  ok  ' + name);
  console.log('FAIL ' + name + (detail ? '\n     ' + detail : ''));
  fail++;
};

const words = (s) => String(s || '').replace(/\(.*?\)/g, ' ').toUpperCase()
  .split(/[^A-Z0-9]+/).filter(w => w && !STOP.has(w));
const norm = (s) => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '')
  .replace(/P2$/, '').replace(/PT$/, '').replace(/P$/, '');
const parts = (s) => String(s || '').split(/[\/,]/).map(norm).filter(x => x && x !== '—');
const fam = (s) => (String(s || '').match(/^[A-Z]+/) || [''])[0];

/* ---- vehicles keep no second copy ---- */
const dupField = V.filter(v => (v.blanks || {}).silca || (v.blanks || {}).jma);
check('vehicles carry no duplicated Silca or JMA', !dupField.length,
  dupField.slice(0, 5).map(v => v.id).join(', '));

/* ---- one Silca per keyway across the blank directory ---- */
const bySilca = new Map();
B.forEach(b => {
  if (!b.silca || b.silca === '—') return;
  words(b.keyway).forEach(w => {
    if (!bySilca.has(w)) bySilca.set(w, new Map());
    bySilca.get(w).set(b.id, b.silca);
  });
});
/* HD106 and HD91 are genuinely two keyways sharing a name — a Honda car profile
   and a Harley one — so they are excluded rather than papered over. */
const NAMESPACE_COLLISIONS = new Set(['HD106', 'HD91', 'YM15']);
const silcaClash = [...bySilca.entries()]
  .filter(([w, m]) => !NAMESPACE_COLLISIONS.has(w) && new Set([...m.values()].map(norm)).size > 1)
  .map(([w, m]) => `${w}: ` + [...m.entries()].map(([id, v]) => `${id}=${v}`).join('  '));
check('one Silca reference per keyway in the blank directory', !silcaClash.length,
  silcaClash.join('\n     '));

/* ---- a vehicle's Ilco belongs to a family the blank row knows ---- */
const byWord = new Map();
B.forEach(b => words(b.keyway).forEach(w => {
  if (!byWord.has(w)) byWord.set(w, []);
  byWord.get(w).push(b);
}));
const ilcoClash = [];
V.forEach(v => {
  const vb = v.blanks || {};
  const mine = parts(vb.ilco);
  if (!mine.length) return;
  const cands = [...new Set(words(vb.keyway).flatMap(w => byWord.get(w) || []))];
  if (!cands.length) return;
  const ok = cands.some(b => {
    const theirs = parts(b.ilco);
    if (!theirs.length) return true;
    return theirs.some(t => mine.includes(t))
      || mine.map(fam).some(f => theirs.map(fam).includes(f));
  });
  if (!ok) ilcoClash.push(`${v.id}: ${vb.keyway} -> ${vb.ilco} vs `
    + cands.map(b => b.ilco || '-').join('/'));
});
check('vehicle Ilco numbers match the blank row family', !ilcoClash.length,
  ilcoClash.slice(0, 6).join('\n     '));

console.log(fail ? `\n${fail} FAILED` : `\nall cross-reference checks passed  (${V.length} vehicles, ${B.length} blanks)`);
process.exit(fail ? 1 : 0);
