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

/* ---- one Silca per keyway across the blank directory ----
   Only the rows that name a confirmed keyway are indexed by keyway word. A
   kwUnknown label is a maker, a catalog number and, on the Blue Dog import, the
   supplier's product type -- so "AGA2 Silca - Cylinder" would register SILCA
   and CYLINDER as keyways and every row sharing the word would clash with every
   other. The app does not treat those labels as keyways either; this is the
   same rule. */
const KEYWAY_ROWS = B.filter(b => !b.kwUnknown);
const bySilca = new Map();
KEYWAY_ROWS.forEach(b => {
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

/* ---- one question, one answer ----
   Two records naming the same model over the same years with different
   keyways means the app answers "what blank for a 1992 F-150" twice and
   differently, which is worse than a long answer. Nine of these arrived with
   the supplier import: its table gives adjacent spans that share a boundary
   year, and folding only the spans wholly inside another left 1992 claimed by
   an H51 record and an H54 one. Overlapping spans are merged now.

   Aliases are not compared -- "lariat", "z71" and "trd" are trim names that
   legitimately sit on several records. The model field is the claim. */
const modelNames = (r) => r.model.split(/[\/(),]/).map(norm).filter(Boolean);
/* Two left that this app cannot settle on its own. They are named so they
   stay visible and so a new one still fails the run. */
const KNOWN_DOUBLE_ANSWERS = [
  /* Which blank the 2022-2024 RDX takes: the TLX/RDX record says HON66 and the
     MDX/RDX record says HO05. Both records now say so on their face. */
  'Acura|RDX',
  /* The older Aston record covers 1994-2021 with a keyway that is openly a
     hedge; the newer one is specific from 2016. "Vantage" is in both because
     Aston reused the name. */
  'Aston Martin|VANTAGE',
];
const doubled = [];
const byMakeRec = {};
V.filter(v => v.body !== 'moto').forEach(v => { (byMakeRec[v.make] = byMakeRec[v.make] || []).push(v); });
Object.entries(byMakeRec).forEach(([mk, recs]) => {
  for (let i = 0; i < recs.length; i++) for (let j = i + 1; j < recs.length; j++) {
    const a = recs[i], b = recs[j];
    if (a.yearEnd < b.yearStart || b.yearEnd < a.yearStart) continue;
    const shared = modelNames(a).filter(n => modelNames(b).includes(n) && n.length >= 3);
    if (!shared.length) continue;
    const ka = (a.blanks.keyway || '').trim(), kb = (b.blanks.keyway || '').trim();
    if (!ka || !kb || ka === kb) continue;
    if (KNOWN_DOUBLE_ANSWERS.includes(mk + '|' + shared[0])) continue;
    doubled.push(`${mk} ${shared[0]} ${Math.max(a.yearStart, b.yearStart)}-${Math.min(a.yearEnd, b.yearEnd)}: `
      + `"${ka}" (${a.id}) vs "${kb}" (${b.id})`);
  }
});
check('no model is answered twice, differently, for the same years', !doubled.length,
  doubled.slice(0, 6).join('\n     '));
/* A recorded disagreement has to be visible on the records themselves. */
KNOWN_DOUBLE_ANSWERS.forEach(k => {
  const [mk, md] = k.split('|');
  const recs = (byMakeRec[mk] || []).filter(v => modelNames(v).includes(md));
  check(`the ${mk} ${md} disagreement is still two records`, recs.length >= 2,
    recs.map(v => v.id).join(', '));
});
check('and the Acura pair says so on both records',
  (byMakeRec['Acura'] || []).filter(v => /TWO RECORDS DISAGREE/.test(v.notes || '')).length === 2);

/* ---- a vehicle's Ilco belongs to a family the blank row knows ---- */
const byWord = new Map();
KEYWAY_ROWS.forEach(b => words(b.keyway).forEach(w => {
  if (!byWord.has(w)) byWord.set(w, []);
  byWord.get(w).push(b);
}));
/* One real disagreement between two sources, recorded rather than resolved --
   the same call as the S22 row, which keeps the edition 13 number and says so.
   The directory's Mazda row puts MAZ12 and MZ13 on one blank; UHS's fitment
   table gives the 1991-94 Mercury Capri, an Australian-built Mazda 323
   underneath, as MAZ12 with Ilco X178. Both cannot be the same blank. Nothing
   here can tell which is wrong, and guessing picks the wrong key half the
   time, so the record keeps what its source said and this names the conflict
   so a new one still fails the run. */
const KNOWN_SOURCE_CONFLICTS = ['uhs-mercury-capri-1991-1994'];
const ilcoClash = [];
V.forEach(v => {
  if (KNOWN_SOURCE_CONFLICTS.includes(v.id)) return;
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
/* And a recorded conflict has to say so on the record itself, or the reader
   sees a number with nothing telling them it is disputed. */
KNOWN_SOURCE_CONFLICTS.forEach(id => {
  const v = V.find(x => x.id === id);
  check(`${id} still exists and says its sources disagree`,
    !!v && /SOURCES DISAGREE/.test(v.notes || ''), v && (v.notes || '').slice(0, 80));
});

console.log(fail ? `\n${fail} FAILED` : `\nall cross-reference checks passed  (${V.length} vehicles, ${B.length} blanks)`);
process.exit(fail ? 1 : 0);
