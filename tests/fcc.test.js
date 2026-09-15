/* Every FCC ID the app shows has to be a real grant.

   A wrong FCC ID is not a cosmetic error: it is the number you read out at the
   parts counter, and it either buys nothing or buys the wrong fob. The seed
   already carried two that would have done exactly that -- LGQ25LR, which is a
   PAX payment terminal on 13.56 MHz and cannot be a 1999 Silverado fob, and
   YG0G21TB2, which is YGOG21TB2 with the letter O typed as a zero.

   So the rule is: an FCC ID in the seed must appear in assets/js/fcc.js, and
   entries there are only added after checking the public grant record. There
   is no way to add an unchecked ID and still have the suite pass. */
const { SEED_VEHICLES: V } = require('../assets/js/data.js');
const { FCC_GRANTS: G } = require('../assets/js/fcc.js');

let fail = 0;
const check = (name, ok, detail) => {
  if (ok) { console.log('  ok  ' + name); return; }
  console.log('FAIL ' + name + (detail ? '\n     ' + detail : ''));
  fail++;
};

/* A field may name more than one fob: "CWTWB1U331 / CWTWB1U345". */
const idsIn = (s) => String(s || '').split(/[\/,]| or /)
  .map(x => x.trim()).filter(x => x && x !== '—');

const used = new Map();
V.forEach(v => (v.remotes || []).forEach(r => idsIn(r.fcc)
  .forEach(f => { if (!used.has(f)) used.set(f, []); used.get(f).push(v.id); })));

const unverified = [...used.keys()].filter(f => !G[f]);
check('every FCC ID in the seed has a verified grant record', !unverified.length,
  unverified.map(f => `${f} on ${used.get(f).join(', ')}`).join('\n     '));

check('no FCC ID is the literal word "varies" or a placeholder',
  ![...used.keys()].some(f => /^(varies|n\/?a|tbd|unknown|\?+)$/i.test(f)),
  [...used.keys()].filter(f => /^(varies|n\/?a|tbd|unknown|\?+)$/i.test(f)).join(', '));

/* Shape: a grantee code is 3-5 characters and a product code follows it. This
   will not catch a plausible wrong ID -- only the grant record does that -- but
   it catches a mangled one before the lookup is even worth running. */
const malformed = [...used.keys()].filter(f => !/^[A-Z0-9][A-Z0-9.\-]{2,26}$/i.test(f));
check('FCC IDs are shaped like FCC IDs', !malformed.length, malformed.join(', '));

check('every grant record carries a holder and a grant date',
  Object.entries(G).every(([, g]) => g.mfr && g.granted),
  Object.entries(G).filter(([, g]) => !g.mfr || !g.granted).map(([k]) => k).join(', '));

check('every grant date is a real past date',
  Object.entries(G).every(([, g]) => /^\d{4}-\d{2}-\d{2}$/.test(g.granted)
    && new Date(g.granted) <= new Date()),
  Object.entries(G).filter(([, g]) => !/^\d{4}-\d{2}-\d{2}$/.test(g.granted)).map(([k]) => k).join(', '));

/* A fob certified after the model stopped being built cannot be its fob. This
   is the sharp version of the date check and it allows no exceptions: unlike a
   gap at the start of a range, there is no reading under which it is fine.

   Comparing against the ORIGINAL grant matters here. Against the latest filing
   this check reported two impossibilities that were not -- GQ43VT20T reads 2012
   as a permissive change but was granted in 2002, so the 2004-2010 Sienna and
   2007-2011 Camry are ordinary. Both are clean against the real date. */
const byId = {};
V.forEach(v => { byId[v.id] = v; });
const grantYear = (f) => parseInt(String((G[f] || {}).granted || '').slice(0, 4), 10);

const afterEnd = [];
used.forEach((vehicles, f) => {
  const gy = grantYear(f);
  if (!gy) return;
  vehicles.forEach(id => {
    const v = byId[id];
    if (v && gy > v.yearEnd) {
      afterEnd.push(`${f} granted ${G[f].granted} but ${v.make} ${v.model} ends ${v.yearEnd} [${id}]`);
    }
  });
});
check('no fob is certified after the car it belongs to stopped being built',
  !afterEnd.length, afterEnd.join('\n     '));

/* A record whose first year is far older than its fob's grant is naming one fob
   for a span that had several: a 2004-2023 Maxima does not use a 2018 fob in
   2004. That is a gap in coverage, not a wrong number, so it is listed rather
   than guessed -- deciding which years take which fob needs the bench. New ones
   should show up here rather than pass silently. */
const WIDE_SPANS = [
  'KR5S180144014 nissan-murano-2003-2020',
  'KR5TXN7 infiniti-qx80-2011-2025',
  'KR5TXN7 nissan-armada-2004-2024',
  'KR5TXN7 nissan-maxima-2004-2023',
];
const wide = [];
used.forEach((vehicles, f) => {
  const gy = grantYear(f);
  if (!gy) return;
  vehicles.forEach(id => {
    const v = byId[id];
    if (v && gy <= v.yearEnd && v.yearStart < gy - 5) wide.push(`${f} ${id}`);
  });
});
const newWide = wide.filter(w => !WIDE_SPANS.includes(w));
check('no new record names one fob for a span that had several', !newWide.length,
  newWide.join('\n     '));

console.log(fail ? `\n${fail} FAILED`
  : `\nall FCC checks passed  (${used.size} IDs in use, ${Object.keys(G).length} verified grants)`);
process.exit(fail ? 1 : 0);
