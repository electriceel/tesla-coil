/* Master keying — the pin math, with no DOM in it so it can be tested directly.

   The whole thing rests on one physical fact: a deeper cut lets the pin stack
   sit lower, so the chamber needs more material below the shear line. Pin a
   chamber for two different depths and the bottom pin is sized to the SHALLOWEST
   cut — that key holds the stack highest, and its bottom pin tops out exactly at
   shear. Every deeper cut then needs a master pin on top to make up the
   difference. Sort the depths, take the differences, and that is the chamber.

   Everything here is arithmetic. Nothing is looked up, so nothing is guessed —
   but the SYSTEM parameters (depth range, MACS) are published manufacturer specs
   and the user can override every one of them. */

const MK_SYSTEMS = {
  schlage: {
    id: 'schlage', name: 'Schlage', keyway: 'SC1 / SC4',
    chambers: 6, min: 0, max: 9, macs: 7, step: 2, increment: '.015 in',
    note: 'Depths 0-9, 0 shallowest. SC1 is the 5-pin, SC4 the 6-pin — set chambers to match the cylinder in your hand.'
  },
  kwikset: {
    id: 'kwikset', name: 'Kwikset', keyway: 'KW1 / KW10',
    chambers: 5, min: 1, max: 6, macs: 4, step: 2, increment: '.023 in',
    note: 'Depths 1-6, 1 shallowest. KW1 is the 5-pin, KW10 the 6-pin. SmartKey cylinders do not pin conventionally — this tool is for standard Kwikset plugs.'
  }
};

/* "1-4-6-2-3", "14623" or [1,4,6,2,3] -> [1,4,6,2,3]. Depths are single digits
   in both systems, so a bare string of digits is unambiguous. */
function parseBitting(input) {
  if (Array.isArray(input)) return input.map(Number);
  const s = String(input == null ? '' : input).trim();
  if (!s) return [];
  const parts = s.includes('-') || s.includes(' ') || s.includes(',')
    ? s.split(/[-,\s]+/).filter(Boolean)
    : s.split('');
  return parts.map(Number);
}

const formatBitting = (b) => b.join('-');

/* Adjacent cuts closer together than MACS, or the mill leaves no wall between
   them and the key breaks a chamber. */
function macsViolations(bitting, macs) {
  const bad = [];
  for (let i = 1; i < bitting.length; i++) {
    if (Math.abs(bitting[i] - bitting[i - 1]) > macs) bad.push(i);
  }
  return bad;
}
const macsOk = (bitting, macs) => macsViolations(bitting, macs).length === 0;

function validateBitting(bitting, sys) {
  const errs = [];
  if (bitting.length !== sys.chambers) {
    errs.push(`Needs ${sys.chambers} cuts, got ${bitting.length}.`);
  }
  bitting.forEach((d, i) => {
    if (!Number.isInteger(d)) errs.push(`Cut ${i + 1} is not a number.`);
    else if (d < sys.min || d > sys.max) errs.push(`Cut ${i + 1} (${d}) is outside ${sys.min}-${sys.max}.`);
  });
  const bad = macsViolations(bitting, sys.macs);
  bad.forEach(i => errs.push(`Cuts ${i} and ${i + 1} break MACS ${sys.macs}.`));
  return errs;
}

/* Depths a position may progress to: same parity as the master's cut so every
   master pin lands at least `step` increments tall. A one-increment master pin
   is fragile and picks easily, which is the whole reason for two-step. */
function candidateDepths(tmkDepth, sys) {
  const out = [];
  for (let d = sys.min; d <= sys.max; d++) {
    if (d === tmkDepth) continue;
    if ((d - tmkDepth) % sys.step === 0) out.push(d);
  }
  return out;
}

/* Cartesian product, walked lazily enough that a wide system does not build
   millions of arrays before we cap it. */
function* product(lists) {
  const n = lists.length;
  if (!n || lists.some(l => !l.length)) return;
  const idx = new Array(n).fill(0);
  for (;;) {
    yield lists.map((l, i) => l[idx[i]]);
    let k = n - 1;
    while (k >= 0 && ++idx[k] >= lists[k].length) { idx[k] = 0; k--; }
    if (k < 0) return;
  }
}

/* Total position progression: every chamber progresses. Most changes per
   system, and the widest incidental exposure. */
function progressTPP(tmk, sys, limit) {
  const lists = tmk.map(d => candidateDepths(d, sys));
  const out = [];
  for (const key of product(lists)) {
    if (macsOk(key, sys.macs)) out.push({ bitting: key, constant: null });
    if (out.length >= limit) break;
  }
  return out;
}

/* Rotating constant: one chamber is held at the master's depth and the rest
   progress, with the held chamber rotating through the system. Fewer changes,
   but a change key can never turn into an unintended master. */
function progressRC(tmk, sys, limit) {
  const out = [];
  for (let c = 0; c < tmk.length && out.length < limit; c++) {
    const lists = tmk.map((d, i) => (i === c ? [d] : candidateDepths(d, sys)));
    for (const key of product(lists)) {
      if (macsOk(key, sys.macs)) out.push({ bitting: key, constant: c });
      if (out.length >= limit) break;
    }
  }
  return out;
}

function progression(tmk, sys, method, limit) {
  const cap = Math.max(1, Math.min(limit || 50, 500));
  return method === 'rc' ? progressRC(tmk, sys, cap) : progressTPP(tmk, sys, cap);
}

/* How many changes the system could yield if you asked for all of them —
   reported separately from what we generated, so "50 shown" never reads as
   "50 available". */
function capacity(tmk, sys, method) {
  const sizes = tmk.map(d => candidateDepths(d, sys).length);
  if (method === 'rc') {
    return sizes.reduce((sum, _, c) =>
      sum + sizes.reduce((p, s, i) => p * (i === c ? 1 : s), 1), 0);
  }
  return sizes.reduce((p, s) => p * s, 1);
}

/* One lock, pinned to pass the master and one change key.
   Bottom pin = shallowest cut; master pins = the gaps up to each deeper cut. */
function pinChamber(depths) {
  const uniq = Array.from(new Set(depths)).sort((a, b) => a - b);
  const bottom = uniq[0];
  const masters = [];
  for (let i = 1; i < uniq.length; i++) masters.push(uniq[i] - uniq[i - 1]);
  return { depths: uniq, bottom, masters, deepest: uniq[uniq.length - 1] };
}

function pinChart(tmk, changeKey) {
  return tmk.map((d, i) => pinChamber([d, changeKey[i]]));
}

/* Every bitting this pinning also passes. Two depths in a chamber means either
   works, so a lock pinned for a master and one change key opens to 2^n
   combinations — the two you meant and the rest you did not. This is inherent
   to master keying, not a flaw in the progression, but it is the number that
   decides whether a system belongs on a door that matters. */
function incidentalCount(chart) {
  const total = chart.reduce((p, c) => p * c.depths.length, 1);
  return Math.max(0, total - 2);
}

/* Master pins thinner than the step are pickable and shear under load. */
function chartWarnings(chart, sys) {
  const w = [];
  chart.forEach((c, i) => {
    c.masters.forEach(m => {
      if (m < sys.step) w.push(`Chamber ${i + 1}: master pin of ${m} is under the ${sys.step}-increment minimum.`);
    });
  });
  return w;
}

/* One call from the UI: validate, progress, and chart each lock. */
function buildSystem(opts) {
  const sys = opts.system;
  const tmk = parseBitting(opts.tmk);
  const errors = validateBitting(tmk, sys);
  if (errors.length) return { ok: false, errors, tmk };

  const keys = progression(tmk, sys, opts.method, opts.count).map((k, n) => {
    const chart = pinChart(tmk, k.bitting);
    return {
      n: n + 1,
      bitting: k.bitting,
      constant: k.constant,
      chart,
      incidental: incidentalCount(chart),
      warnings: chartWarnings(chart, sys)
    };
  });

  return {
    ok: true, errors: [], tmk, system: sys, method: opts.method,
    keys, capacity: capacity(tmk, sys, opts.method)
  };
}

if (typeof module !== 'undefined') module.exports = {
  MK_SYSTEMS, parseBitting, formatBitting, macsOk, macsViolations, validateBitting,
  candidateDepths, progression, capacity, pinChamber, pinChart, incidentalCount,
  chartWarnings, buildSystem
};
