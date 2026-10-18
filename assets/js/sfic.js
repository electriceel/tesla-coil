/* SFIC — BEST small format interchangeable core.

   A conventional cylinder has one shear line. A figure-8 core has two, and
   that is the whole difference. The OPERATING shear line, between plug and
   sleeve, is the one an ordinary key lifts the stack to; the CONTROL shear
   line, between sleeve and shell, sits a fixed distance above it, and a key
   that reaches it rotates the sleeve, retracts the control lug and pulls the
   core out of the housing. One lock, two jobs, two keys that have nothing to
   do with each other.

   So the pinning chart grows two rows. Below the operating shear line it is
   the chart master.js already builds — bottom pin sized to the shallowest
   cut, a master pin for each step up to a deeper one. Above it come two more
   segments: the CONTROL pin, which spans from the deepest operating cut up to
   the control shear line, and the TOP pin, which fills what is left to a
   constant stack height.

   BEST's own method, which is what this file implements:

     1. Write the total stack at the top of each barrel's column.
     2. Add the control-lug thickness to each cut of the control key and write
        that below it.  (A2 adds 10. Forgetting this step is, in BEST's own
        words, "the cause of many combinating problems.")
     3. Write every operating key's cut for that barrel below that.
     4. Sort the column ascending and take the differences. The smallest code
        is the bottom pin; every difference above it is another segment.

   Which means the SFIC chart IS the conventional chart with two more codes
   stacked on the column, and pinChamber already sorts a column of codes and
   differences it. Nothing here re-derives that.

   SOURCES. The numbers below are BEST's published system specifications, not
   anything inferred: the A2 total stack of 23 and control-lug thickness of 10,
   and the A4 total stack of 14 and thickness of 6, all come from BEST's A2 &
   A4 key system training material, which also gives A2 depths 0-9 and A4
   depths 0-5. The tests reproduce both of that document's worked examples
   barrel for barrel, segment for segment.

   WHAT IS NOT HERE. BEST's A3 system. The trade literature gives its control
   offset as 7 and its total stack as 16, but nothing citable states its depth
   range, and a pinning chart built on a guessed depth range is a chart that
   is confidently and uniformly wrong. A3 is also the one Best themselves
   called mechanically impractical, so the gap costs little. Supply an A3
   depth range from a BEST code page and it drops straight into SFIC_SYSTEMS
   with no other change. */

/* master.js is loaded first, so in the browser its functions are already
   globals; in node they come through require. Either way those are THE
   implementations of the pin math — a second copy here would drift, and the
   drift would be silent, because both copies would still produce a chart. */
const SFIC_MK = (typeof module !== 'undefined' && typeof require === 'function')
  ? require('./master.js')
  : {
      pinChamber, parseBitting, formatBitting, validateBitting, macsOk,
      candidateDepths, levelVariants, extendSystem
    };

/* controlAdd is the control lug's thickness measured in depth increments, and
   it is not a free parameter: in both shipped systems it is exactly one more
   than the depth range spans. That is what makes a figure-8 core safe — the
   smallest control code a legal key can produce (min + controlAdd) always
   lands above the deepest legal operating cut, so no operating key, however
   it is cut, can ever reach the control shear line and pull a core. The test
   suite asserts the relationship rather than trusting it. */
const SFIC_SYSTEMS = {
  'a2-7': {
    id: 'a2-7', family: 'A2', name: 'BEST A2 — 7-pin', keyway: 'A2 figure-8 core',
    chambers: 7, min: 0, max: 9, step: 2, macs: 9,
    controlAdd: 10, totalStack: 23, increment: '.0125 in', codes: '16,384',
    note: 'Depths 0-9, two-step: every barrel progresses in twos, so each barrel keeps the '
        + 'odd/even pattern its top master set. Total stack 23. Add 10 to every control key cut.'
  },
  'a2-6': {
    id: 'a2-6', family: 'A2', name: 'BEST A2 — 6-pin', keyway: 'A2 figure-8 core',
    chambers: 6, min: 0, max: 9, step: 2, macs: 9,
    controlAdd: 10, totalStack: 23, increment: '.0125 in', codes: '4,096',
    note: 'Depths 0-9, two-step. Same stack and same control lug as the 7-pin — only the barrel '
        + 'count differs. Count the barrels in the core, not the cuts on the key you were handed.'
  },
  'a4-7': {
    id: 'a4-7', family: 'A4', name: 'BEST A4 — 7-pin', keyway: 'A4 figure-8 core',
    chambers: 7, min: 0, max: 5, step: 1, macs: 5,
    controlAdd: 6, totalStack: 14, increment: '', codes: '78,125',
    note: 'Depths 0-5, single step and no odd/even pattern — which is why BEST says to scramble '
        + 'A4 codes rather than progress them in order. Total stack 14. Add 6 to every control cut.'
  },
  'a4-6': {
    id: 'a4-6', family: 'A4', name: 'BEST A4 — 6-pin', keyway: 'A4 figure-8 core',
    chambers: 6, min: 0, max: 5, step: 1, macs: 5,
    controlAdd: 6, totalStack: 14, increment: '', codes: '15,625',
    note: 'Depths 0-5, single step, no odd/even pattern. Total stack 14, control lug 6. '
        + 'Arrow and BEST sell A4 mainly to add to A4 systems already in the ground.'
  }
};

/* ==================== one barrel ====================

   Roles matter at the bench, not just on paper: BEST marks the bottom pin of a
   stack with an A and every segment above it with a B, and they are different
   pins — an A pin is shaped to ride the key, a B segment is flat at both ends.
   A chart that says "6, 2, 6, 9" and a chart that says "6A, 2B, 6B, 9B" are
   the same arithmetic and only one of them can be loaded without thinking. */
function sficBarrel(operatingDepths, controlCut, sys) {
  const base = SFIC_MK.pinChamber(operatingDepths);
  const pins = [{ len: base.bottom, role: 'bottom', mark: base.bottom + 'A' }];
  base.masters.forEach(m => pins.push({ len: m, role: 'master', mark: m + 'B' }));

  const out = {
    operating: base.depths,
    deepest: base.deepest,
    bottom: base.bottom,
    masters: base.masters,
    controlCut: null, controlCode: null, control: null, top: null,
    pins, total: pins.reduce((s, p) => s + p.len, 0), complete: false
  };
  if (controlCut == null) return out;      // no control key: the stack stops at the operating line

  const code = controlCut + sys.controlAdd;
  out.controlCut = controlCut;
  out.controlCode = code;
  out.control = code - base.deepest;
  out.top = sys.totalStack - code;
  pins.push({ len: out.control, role: 'control', mark: out.control + 'B' });
  pins.push({ len: out.top, role: 'top', mark: out.top + 'B' });
  out.total = pins.reduce((s, p) => s + p.len, 0);
  out.complete = true;
  return out;
}

/* Every operating combination this core accepts. The control code is NOT in
   this product: it is a break at the other shear line, so it adds a way to
   pull the core, never a way to turn the plug. Getting that wrong would
   overstate the exposure of every core in the app by a factor of two. */
function sficIncidental(barrels, keysMeant) {
  const total = barrels.reduce((p, b) => p * b.operating.length, 1);
  return Math.max(0, total - keysMeant);
}

/* Segments that are real pins but bad ones. Nothing here is a hard error —
   the core will assemble — which is exactly why it has to be said out loud. */
function sficWarnings(barrels, sys) {
  const w = [];
  barrels.forEach((b, i) => {
    b.masters.forEach(m => {
      if (m < sys.step) {
        w.push(`Barrel ${i + 1}: master pin of ${m} is under the ${sys.step}-increment step. `
             + 'Thin master pins pick easily and shear under load.');
      }
    });
    if (b.control != null && b.control < sys.step) {
      w.push(`Barrel ${i + 1}: control pin of ${b.control} is under the ${sys.step}-increment step. `
           + 'The control key is cut far shallower than the operating keys here — a thin control '
           + 'pin is what makes a core drop its sleeve when it should not.');
    }
    if (b.top != null && b.top < sys.step) {
      w.push(`Barrel ${i + 1}: top pin of ${b.top} leaves almost nothing above the control line.`);
    }
  });
  return w;
}

/* ==================== one core ==================== */
function sficCore(keys, control, sys, meta) {
  const barrels = [];
  for (let i = 0; i < sys.chambers; i++) {
    barrels.push(sficBarrel(keys.map(k => k.bitting[i]), control ? control[i] : null, sys));
  }
  return {
    ...(meta || {}),
    keys,
    barrels,
    incidental: sficIncidental(barrels, keys.length),
    warnings: sficWarnings(barrels, sys),
    stackOk: !control || barrels.every(b => b.total === sys.totalStack)
  };
}

/* ==================== choosing a control key ====================

   This is the one thing in the file that is a decision rather than a reading,
   and it is kept separate so it can be labelled that way everywhere it shows.

   A control key cannot be worked out from operating keys. Its cuts are an
   independent bitting; they leave no trace in the operating cuts and the
   operating cuts constrain them only through pin length. Anyone who tells you
   the control key is "the master plus two" is describing one system they once
   saw. The only ways to learn a core's real control key are to be given it or
   to take the core apart and read the stack.

   So when none is supplied this proposes one, by centring both pins it
   governs: the control pin spanning up from the deepest operating cut, and the
   top pin filling down from the stack height. A cut too shallow leaves a thin
   control pin, too deep leaves a thin top pin, and the middle is the widest
   margin on both. */
function proposeControl(sys, deepestPerBarrel, avoid) {
  const score = (d, deep) => Math.min(d + sys.controlAdd - deep, sys.totalStack - sys.controlAdd - d);

  const rank = (deep, awayFrom) => {
    const ds = [];
    for (let d = sys.min; d <= sys.max; d++) ds.push(d);
    return ds.sort((a, b) =>
      score(b, deep) - score(a, deep)
      || Math.abs(b - awayFrom) - Math.abs(a - awayFrom)     // don't echo the operating cut
      || a - b);
  };

  const ranked = deepestPerBarrel.map(deep => rank(deep, deep));
  const bitting = ranked.map(r => r[0]);

  /* A control key every barrel of which scored the same way can come out as
     one digit repeated, which is legal, memorable and a gift to anyone who
     finds it. Walk barrels to their second choice until it is not. */
  for (let i = 1; i < bitting.length && new Set(bitting).size === 1; i++) {
    if (ranked[i][1] != null) bitting[i] = ranked[i][1];
  }

  /* And it must not BE a key that is already in the system. */
  const taken = new Set((avoid || []).map(b => b.join()));
  for (let i = 0; i < bitting.length && taken.has(bitting.join()); i++) {
    if (ranked[i][1] != null) bitting[i] = ranked[i][1];
  }

  /* MACS is unrestricted in both shipped systems, but the form lets it be
     overridden, so the proposal is checked rather than assumed. */
  if (!SFIC_MK.macsOk(bitting, sys.macs)) {
    for (let i = 1; i < bitting.length; i++) {
      for (const alt of ranked[i]) {
        const t = bitting.slice(); t[i] = alt;
        if (SFIC_MK.macsOk(t, sys.macs)) { bitting[i] = alt; break; }
      }
    }
  }
  return bitting;
}

/* ==================== what the keys in hand can and cannot tell you ====================

   The three keys are independent in different directions, and the tool is only
   honest if it says which way each gap runs. */
function sficRead(given, sys) {
  const known = [];
  const unknown = [];

  if (given.control) {
    known.push('Control key given. Every control pin and top pin below is read off it, not chosen.');
  } else {
    unknown.push('No control key. It cannot be worked out from the operating keys — the control '
      + 'cuts are an independent bitting, and the only ways to learn an existing core\'s control '
      + 'key are to be handed it or to pull the core and read the stack. One is proposed below so '
      + 'the chart can be finished, and it is marked as proposed everywhere it appears.');
  }

  if (given.master) {
    known.push('Master given. New change keys progress under it and are checked against it.');
  } else if (given.operating) {
    unknown.push('No master. Which barrels a system holds constant is the master\'s business, so '
      + 'with only operating keys there is no way to tell a held barrel from one that happens to '
      + 'match. The cores you listed are charted exactly as given; no new change key is generated, '
      + 'because any one would be a guess about whether it cross-keys.');
  }

  if (given.operating && sys.step > 1) {
    known.push(`Operating key given. An ${sys.family} system progresses in ${sys.step}s, so each `
      + 'barrel of every key in it shares that barrel\'s odd/even pattern — one key in hand reads '
      + 'the depths the whole system can use at each barrel.');
  } else if (given.operating) {
    unknown.push(`${sys.family} is single step with no odd/even pattern, so an operating key reads `
      + 'nothing about what the other barrels may progress to. That is also why BEST says to '
      + 'scramble A4 codes instead of running them in order.');
  }

  if (!given.operating && !given.master) {
    unknown.push('No operating or master key, so there is nothing for the control key to be '
      + 'charted against. Add either one.');
  }
  return { known, unknown };
}

/* Depths each barrel can reach, read off any key in the system. Valid because
   every key in an A2 system sits an even number of increments from the top
   master at every barrel, so they all share its parity. */
function parityRead(key, sys) {
  return key.map(d => [d].concat(SFIC_MK.candidateDepths(d, sys)).sort((a, b) => a - b));
}

/* ==================== the audit ====================

   Two questions, and they are not the same question.

   Does an operating key open a core it should not? That is ordinary
   cross-keying and it is the one that puts a tenant in someone else's unit.

   Does the control key ALSO turn the plug? It does if, at every barrel, its
   cut happens to be one of the operating depths — then the stack breaks at
   both shear lines and the key that pulls cores opens doors as well. Not a
   fault in the arithmetic, and not rare enough to leave unsaid. */
function sficAudit(cores, control, sys) {
  const violations = [];
  const controlAlsoOperates = [];
  let checked = 0;

  const opens = (bitting, core) =>
    core.barrels.every((b, i) => b.operating.includes(bitting[i]));

  cores.forEach(core => {
    const allowed = new Set(core.keys.map(k => k.symbol));
    cores.forEach(other => {
      other.keys.forEach(k => {
        checked++;
        if (allowed.has(k.symbol)) return;
        if (opens(k.bitting, core)) {
          violations.push({ key: k.symbol, keyBitting: k.bitting, core: core.symbol });
        }
      });
    });
    if (control && opens(control, core)) controlAlsoOperates.push(core.symbol);
  });

  /* An operating key reaching the control shear line would be the serious one:
     a change key that pulls cores. It cannot happen while the lug offset stays
     above the depth range, and this proves it for the system actually in use
     rather than asserting it. */
  const canPull = sys.min + sys.controlAdd <= sys.max;

  return { checked, violations, controlAlsoOperates, canPull };
}

/* ==================== the one call the UI makes ==================== */
function buildSFIC(opts) {
  const sys = opts.system;
  const parse = SFIC_MK.parseBitting;
  const errors = [];

  const control = opts.control && String(opts.control).trim() ? parse(opts.control) : null;
  const master = opts.master && String(opts.master).trim() ? parse(opts.master) : null;
  const operating = (opts.operating || [])
    .map(parse).filter(b => b.length);

  const name = (what, b) => `${what} ${SFIC_MK.formatBitting(b)}`;
  if (control) SFIC_MK.validateBitting(control, sys).forEach(e => errors.push(`${name('Control', control)}: ${e}`));
  if (master) SFIC_MK.validateBitting(master, sys).forEach(e => errors.push(`${name('Master', master)}: ${e}`));
  operating.forEach(b => SFIC_MK.validateBitting(b, sys).forEach(e => errors.push(`${name('Operating', b)}: ${e}`)));

  if (!control && !master && !operating.length) {
    errors.push('Give at least one key — a control, a master or an operating key. '
      + 'With none of the three there is nothing to chart.');
  }
  if (errors.length) return { ok: false, errors, system: sys };

  const given = { control: !!control, master: !!master, operating: operating.length > 0 };
  const read = sficRead(given, sys);

  /* New change keys, but only under a master. extendSystem already knows how
     to read a layout off the keys in the field, progress inside it, and throw
     out any candidate that would cross-key with what is already out there;
     none of that is SFIC-specific and none of it is repeated here. */
  let extend = null;
  const want = Math.max(0, Math.min(opts.count || 0, 60));
  if (master && want) {
    extend = SFIC_MK.extendSystem({ system: sys, master, existing: operating, count: want });
  }
  /* The master check is repeated here rather than left to the statement
     above, because every core built from `fresh` is pinned master-over-change
     and a null master would chart a core against a key that does not exist.
     The guarantee belongs on the line that makes the list. */
  const fresh = master && extend && extend.ok ? extend.keys.map(k => k.bitting) : [];

  /* One core per operating key, each pinned for the chain that must turn it.
     With a master that chain is master-over-change; with no master the core is
     keyed to its one key, which is an ordinary single-key core, not an error. */
  const cores = [];
  const label = (p, n) => p + String(n).padStart(2, '0');

  /* A core is pinned for every key that must turn it. With a master that is
     master over change key; with none it is a core keyed to its one key,
     which is an ordinary single-key core and not an error. */
  const chainFor = (symbol, bitting) => (master
    ? [{ symbol: 'MK', bitting: master }, { symbol, bitting }]
    : [{ symbol, bitting }]);

  const addCore = (b, n, source) => {
    const symbol = label('CK', n);
    cores.push(sficCore(chainFor(symbol, b), control, sys, { symbol, bitting: b, source }));
  };

  operating.forEach((b, i) => addCore(b, i + 1, 'given'));
  fresh.forEach((b, i) => addCore(b, operating.length + i + 1, 'new'));

  /* A master and nothing under it is still a core worth charting: the one on
     the mechanical room door that only the master opens. */
  if (master && !cores.length) {
    cores.push(sficCore([{ symbol: 'MK', bitting: master }], control, sys,
      { symbol: 'MK', bitting: master, source: 'given' }));
  }

  const proposed = !control && cores.length
    ? proposeControl(sys, cores.map(c => c.barrels.map(b => b.deepest))
        .reduce((acc, row) => acc.map((d, i) => Math.max(d, row[i])),
                new Array(sys.chambers).fill(sys.min)),
        [master].concat(operating, fresh).filter(Boolean))
    : null;

  const effective = control || proposed;
  const charted = effective && !control
    ? cores.map(c => sficCore(c.keys, effective, sys,
        { symbol: c.symbol, bitting: c.bitting, source: c.source }))
    : cores;

  return {
    ok: true, errors: [], system: sys, given, read,
    control, proposedControl: proposed, effectiveControl: effective,
    master, operating, cores: charted,
    parity: sys.step > 1 && (master || operating.length)
      ? parityRead(master || operating[0], sys) : null,
    extend,
    audit: sficAudit(charted, effective, sys),
    /* Top pins depend on the control key and nothing else, so every core on
       one control key takes the same ones. Worth knowing before you count out
       a tray of them. */
    topPins: effective ? effective.map(d => sys.totalStack - (d + sys.controlAdd)) : null
  };
}

if (typeof module !== 'undefined') module.exports = {
  SFIC_SYSTEMS, sficBarrel, sficIncidental, sficWarnings, sficCore,
  proposeControl, sficRead, parityRead, sficAudit, buildSFIC
};
