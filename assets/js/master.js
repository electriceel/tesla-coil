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

/* Same set as candidateDepths, ordered the way a schedule should actually be
   cut: nearest the parent first, and on a tie the deeper one. Ascending order
   would walk every level down to the shallowest depth, so the first change key
   of a 6-pin system came out 0-0-0-0-0-0 — legal, and not a key anyone wants to
   hand a tenant. Nearest-first also means the early locks take the minimum
   2-increment master pin, which is what you want in the plug. */
function orderedCandidates(parent, sys) {
  return candidateDepths(parent, sys).sort((a, b) =>
    Math.abs(a - parent) - Math.abs(b - parent) || b - a);
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
  const lists = tmk.map(d => orderedCandidates(d, sys));
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
    const lists = tmk.map((d, i) => (i === c ? [d] : orderedCandidates(d, sys)));
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

/* ==================== multi-level systems ====================
   A full system is GGM over GM over MK over CK. The method is position
   allocation: each level owns a set of chambers and progresses only those,
   leaving every other chamber at its parent's depth. That is what keeps the
   levels from colliding — a master and a change key never fight over the same
   chamber, so no change key can reach a door above it.

   A lock is pinned for the whole chain that must open it, root to leaf, so a
   chamber can end up holding three or four depths and a stack of master pins.
   pinChamber already takes any number of depths, which is why it was written
   that way. */

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const letterAt = (i) => LETTERS[i % 26] + (i >= 26 ? String(Math.floor(i / 26)) : '');

/* Standard key symbols. Two levels: A over AA, AB. Three: A over AA, AB over
   AA1, AA2. Four: GGM over A, B over AA, AB over AA1, AA2. */
function topSymbol(levels) { return levels >= 4 ? 'GGM' : 'A'; }
function childSymbol(parent, depth, idx, levels) {
  const d = depth - (levels >= 4 ? 1 : 0);
  if (d === 0) return letterAt(idx);
  return d % 2 === 1 ? parent + letterAt(idx) : parent + (idx + 1);
}

const LEVEL_NAMES = {
  2: ['Master key', 'Change key'],
  3: ['Grand master', 'Master key', 'Change key'],
  4: ['Great grand master', 'Grand master', 'Master key', 'Change key']
};

/* Chambers split across the progressing levels, deepest level taking the
   remainder — change keys need the most room because there are the most of
   them. */
function defaultAllocation(chambers, levels) {
  const groups = levels - 1;
  const all = Array.from({ length: chambers }, (_, i) => i);
  const per = Math.floor(chambers / groups);
  const out = [];
  let at = 0;
  for (let g = 0; g < groups; g++) {
    const take = g === groups - 1 ? all.length - at : per;
    out.push(all.slice(at, at + take));
    at += take;
  }
  return out;
}

function validateAllocation(alloc, chambers, sys) {
  const errs = [];
  const seen = new Map();
  alloc.forEach((positions, g) => {
    if (!positions.length) errs.push(`Level ${g + 1} has no chambers to progress.`);
    positions.forEach(p => {
      if (p < 0 || p >= chambers) errs.push(`Chamber ${p + 1} is not on this key.`);
      else if (seen.has(p)) errs.push(`Chamber ${p + 1} is claimed by two levels — each chamber belongs to one.`);
      else seen.set(p, g);
    });
  });
  return errs;
}

/* Every bitting one level can reach from its parent: the allocated chambers
   progress, everything else holds. */
function levelVariants(parent, positions, sys, limit) {
  const lists = parent.map((d, i) => (positions.includes(i) ? orderedCandidates(d, sys) : [d]));
  const out = [];
  for (const b of product(lists)) {
    if (macsOk(b, sys.macs)) out.push(b);
    if (out.length >= limit) break;
  }
  return out;
}

function levelCapacity(parent, positions, sys) {
  return positions.reduce((p, i) => p * candidateDepths(parent[i], sys).length, 1);
}

/* Walk the tree, giving every key its symbol and its chain back to the top. */
function growTree(node, depth, alloc, counts, sys, levels, out) {
  out.push(node);
  if (depth >= alloc.length) return node;   // a leaf is still a node
  const variants = levelVariants(node.bitting, alloc[depth], sys, counts[depth]);
  node.children = variants.map((bitting, i) => growTree({
    symbol: childSymbol(node.symbol, depth + 1, i, levels),
    bitting, depth: depth + 1,
    chain: node.chain.concat([node]),
    children: []
  }, depth + 1, alloc, counts, sys, levels, out));
  return node;
}

const opensLock = (bitting, chart) => chart.every((c, i) => c.depths.includes(bitting[i]));

/* The check that makes the schedule worth cutting: try every key in the system
   against every lock in it, and report any that opens a door it has no business
   opening. With clean position allocation there should be none — but "should"
   is not the same as "checked". */
function auditSystem(keys, locks) {
  const violations = [];
  let checked = 0;
  locks.forEach(lock => {
    const allowed = new Set(lock.chain.concat([lock.symbol]));
    keys.forEach(k => {
      checked++;
      if (allowed.has(k.symbol)) return;
      if (opensLock(k.bitting, lock.chart)) {
        violations.push({ key: k.symbol, keyBitting: k.bitting, lock: lock.symbol, lockBitting: lock.bitting });
      }
    });
  });
  return { checked, violations };
}

function buildFullSystem(opts) {
  const sys = opts.system;
  const levels = Math.max(2, Math.min(4, opts.levels || 2));
  const top = parseBitting(opts.tmk);

  const errors = validateBitting(top, sys);
  const alloc = opts.alloc || defaultAllocation(sys.chambers, levels);
  errors.push(...validateAllocation(alloc, sys.chambers, sys));
  if (alloc.length !== levels - 1) errors.push(`A ${levels}-level system needs ${levels - 1} chamber groups.`);
  if (errors.length) return { ok: false, errors, levels };

  const counts = (opts.counts || []).slice(0, levels - 1);
  while (counts.length < levels - 1) counts.push(4);

  const all = [];
  const root = { symbol: topSymbol(levels), bitting: top, depth: 0, chain: [], children: [] };
  growTree(root, 0, alloc, counts.map(c => Math.max(1, Math.min(c, 60))), sys, levels, all);

  /* A lock exists for each key at the bottom level; it is pinned for its whole
     chain, so every key above it turns it. */
  const locks = all.filter(k => k.depth === levels - 1).map(leaf => {
    const chain = leaf.chain.map(n => n.symbol);
    const bittings = leaf.chain.map(n => n.bitting).concat([leaf.bitting]);
    const chart = top.map((_, i) => pinChamber(bittings.map(b => b[i])));
    const total = chart.reduce((p, c) => p * c.depths.length, 1);
    return {
      symbol: leaf.symbol, bitting: leaf.bitting, chain, chart,
      keysThatOpen: bittings.length,
      incidental: Math.max(0, total - bittings.length),
      warnings: chartWarnings(chart, sys)
    };
  });

  const flat = all.map(k => ({ symbol: k.symbol, bitting: k.bitting, depth: k.depth,
                               chain: k.chain.map(n => n.symbol) }));

  return {
    ok: true, errors: [], levels, system: sys, top, alloc, counts,
    names: LEVEL_NAMES[levels],
    root, keys: flat, locks,
    capacity: alloc.map((positions, g) => levelCapacity(top, positions, sys)),
    audit: auditSystem(flat, locks)
  };
}

if (typeof module !== 'undefined') module.exports = {
  MK_SYSTEMS, parseBitting, formatBitting, macsOk, macsViolations, validateBitting,
  candidateDepths, orderedCandidates, progression, capacity, pinChamber, pinChart, incidentalCount,
  chartWarnings, buildSystem,
  LEVEL_NAMES, topSymbol, childSymbol, defaultAllocation, validateAllocation,
  levelVariants, levelCapacity, opensLock, auditSystem, buildFullSystem
};
