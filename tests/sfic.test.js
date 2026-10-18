/* SFIC — BEST small format interchangeable core.

   The anchor of this file is that BEST publishes two fully worked pinning
   examples, one A2 and one A4, in their own A2 & A4 key system training
   material. Both are reproduced here barrel for barrel and segment for
   segment. If the arithmetic in sfic.js ever drifts, it stops matching a
   chart BEST themselves printed, and that is a far better test than anything
   I could reason out from the physics.

   The rest of the file guards the things that are easy to get subtly wrong:
   that the control code never collides with an operating cut, that the
   control key is never silently invented, and that a break at the control
   shear line is not counted as a way to turn the plug. */
const S = require('../assets/js/sfic.js');
const M = require('../assets/js/master.js');

let fail = 0;
const check = (name, ok, detail) => {
  if (ok) { console.log('  ok  ' + name); return; }
  console.log('FAIL ' + name + (detail ? '\n     ' + detail : ''));
  fail++;
};
const eq = (name, got, want) => {
  const g = JSON.stringify(got), w = JSON.stringify(want);
  check(name, g === w, g === w ? '' : 'got  ' + g + '\n     want ' + w);
};

const A27 = S.SFIC_SYSTEMS['a2-7'];
const A47 = S.SFIC_SYSTEMS['a4-7'];
const marks = (core) => core.barrels.map(b => b.pins.map(p => p.mark).join(' '));

/* ===================== BEST's own A2 worked example =====================
   Code page: CONTROL 4189250, GRAND MASTER 8301836, OPERATING KEY 6783058.
   Total stack 23, control lug 10 increments. */
const a2 = S.buildSFIC({ system: A27, control: '4189250', master: '8301836',
                         operating: ['6783058'] });
check('A2 example builds', a2.ok, (a2.errors || []).join('; '));

eq('A2 example — every barrel, segment for segment', marks(a2.cores[0]), [
  '6A 2B 6B 9B',
  '3A 4B 4B 12B',
  '0A 8B 10B 5B',
  '1A 2B 16B 4B',
  '0A 8B 4B 11B',
  '3A 2B 10B 8B',
  '6A 2B 2B 13B'
]);

eq('A2 example — the control codes are the control cuts plus the lug',
   a2.cores[0].barrels.map(b => b.controlCode), [14, 11, 18, 19, 12, 15, 10]);

check('A2 example — every barrel totals the stack height',
  a2.cores[0].barrels.every(b => b.total === 23),
  a2.cores[0].barrels.map(b => b.total).join(' '));

/* BEST's code page carries a master and a submaster between the grand master
   and the operating key, and states that they need not be entered because
   they work automatically. That is a property of clean position allocation
   rather than a BEST convenience, and it is worth holding to: if entering
   them changed the pinning, the claim would be false for this system. */
const a2full = S.sficCore([
  { symbol: 'GM', bitting: M.parseBitting('8301836') },
  { symbol: 'B',  bitting: M.parseBitting('6701836') },
  { symbol: 'BA', bitting: M.parseBitting('6783836') },
  { symbol: 'BA1', bitting: M.parseBitting('6783058') }
], M.parseBitting('4189250'), A27, {});
eq('A2 example — the intermediate masters change nothing, as BEST states',
   marks(a2full), marks(a2.cores[0]));

/* ===================== BEST's own A4 worked example =====================
   CONTROL 3254012, GRAND MASTER 2031544, OPERATING 4513021.
   Total stack 14, control lug 6 increments, depths 0-5, single step. */
const a4 = S.buildSFIC({ system: A47, control: '3254012', master: '2031544',
                         operating: ['4513021'] });
check('A4 example builds', a4.ok, (a4.errors || []).join('; '));
eq('A4 example — every barrel, segment for segment', marks(a4.cores[0]), [
  '2A 2B 5B 5B',
  '0A 5B 3B 6B',
  '1A 2B 8B 3B',
  '1A 2B 7B 4B',
  '0A 5B 1B 8B',
  '2A 2B 3B 7B',
  '1A 3B 4B 6B'
]);
check('A4 example — every barrel totals 14',
  a4.cores[0].barrels.every(b => b.total === 14),
  a4.cores[0].barrels.map(b => b.total).join(' '));

/* ===================== the invariant that makes a core safe =====================
   The control lug is thicker than the depth range spans, in every system
   shipped. That is not decoration: it is the reason the smallest control code
   a legal key can produce lands above the deepest legal operating cut, so no
   operating key, however it is cut, can reach the control shear line and pull
   a core. Ship a system where it does not hold and that guarantee is gone. */
Object.values(S.SFIC_SYSTEMS).forEach(sys => {
  check(`${sys.id}: the control lug clears the depth range`,
    sys.min + sys.controlAdd > sys.max,
    `min ${sys.min} + lug ${sys.controlAdd} must exceed max ${sys.max}`);
  check(`${sys.id}: a legal control key always leaves a real top pin`,
    sys.totalStack - (sys.max + sys.controlAdd) >= 1,
    `stack ${sys.totalStack} - (max ${sys.max} + lug ${sys.controlAdd})`);
  check(`${sys.id}: a legal control key always leaves a real control pin`,
    (sys.min + sys.controlAdd) - sys.max >= 1);
  check(`${sys.id} carries a barrel count, a stack and a lug`,
    sys.chambers >= 5 && sys.totalStack > 0 && sys.controlAdd > 0);
});

check('the audit reports that no operating key can pull a core',
  a2.audit.canPull === false && a4.audit.canPull === false);

/* ===================== the control key is never invented quietly ===================== */
const noCtl = S.buildSFIC({ system: A27, master: '2468024', count: 2 });
check('with no control key, one is proposed', !!noCtl.proposedControl);
check('a proposed control key is flagged as proposed, not reported as given',
  noCtl.control === null && noCtl.effectiveControl === noCtl.proposedControl);
check('and the gap is stated in words',
  noCtl.read.unknown.some(u => /cannot be worked out/i.test(u)),
  JSON.stringify(noCtl.read.unknown));
check('a given control key is never overwritten by a proposal',
  a2.proposedControl === null && a2.control.join('') === '4189250');

/* A proposed control key has to be a key you could actually cut, and it has
   to leave pins you could actually load. */
check('the proposed control key is in range and the right length',
  noCtl.proposedControl.length === A27.chambers
  && noCtl.proposedControl.every(d => d >= A27.min && d <= A27.max),
  JSON.stringify(noCtl.proposedControl));
check('the proposed control key leaves no thin pin',
  noCtl.cores.every(c => !c.warnings.length),
  JSON.stringify(noCtl.cores.map(c => c.warnings)));
check('the proposed control key is not one digit repeated',
  new Set(noCtl.proposedControl).size > 1, JSON.stringify(noCtl.proposedControl));

/* ===================== what the three keys can and cannot say ===================== */
const combos = [
  ['control only',        { control: '4189250' }],
  ['master only',         { master: '8301836', count: 3 }],
  ['operating only',      { operating: ['6783058'], count: 3 }],
  ['control + master',    { control: '4189250', master: '8301836', count: 3 }],
  ['control + operating', { control: '4189250', operating: ['6783058'] }],
  ['master + operating',  { master: '8301836', operating: ['6783058'] }],
  ['all three',           { control: '4189250', master: '8301836', operating: ['6783058'], count: 2 }]
];
combos.forEach(([name, opts]) => {
  const r = S.buildSFIC({ system: A27, ...opts });
  check(`${name} is accepted`, r.ok, (r.errors || []).join('; '));
  check(`${name} says either what it knows or what it cannot`,
    r.read.known.length + r.read.unknown.length > 0);
});

check('no key at all is refused, and the refusal says what to supply',
  (() => { const r = S.buildSFIC({ system: A27 });
           return !r.ok && /at least one key/i.test(r.errors.join(' ')); })());

/* The one refusal that matters most: with operating keys but no master there
   is no way to tell a held barrel from one that merely matches, so new change
   keys are not generated. A tool that guessed here would hand somebody a key
   that opens a neighbour's door. */
const noMaster = S.buildSFIC({ system: A27, control: '4189250',
                               operating: ['6783058'], count: 6 });
check('no master means no new change keys are generated',
  noMaster.cores.length === 1 && noMaster.cores.every(c => c.source === 'given'),
  noMaster.cores.map(c => c.symbol + ':' + c.source).join(' '));
check('and the reason is given rather than silently obeyed',
  noMaster.read.unknown.some(u => /No master/.test(u)));

const withMaster = S.buildSFIC({ system: A27, control: '4189250', master: '8301836',
                                 operating: ['6783058'], count: 6 });
check('with a master, new change keys are generated',
  withMaster.cores.filter(c => c.source === 'new').length === 6,
  withMaster.cores.map(c => c.source).join(' '));

/* ===================== two shear lines, counted separately ===================== */
/* A core pinned for a master and one change key passes 2^n operating
   combinations. The control code adds a break in every barrel, but at the
   OTHER shear line -- counting it here would double the reported exposure of
   every core in the app. */
const two = S.buildSFIC({ system: A27, control: '4189250', master: '2222222',
                          operating: ['4444444'] });
eq('the control code is not counted as an operating combination',
   two.cores[0].incidental, Math.pow(2, 7) - 2);

const noCtlCore = S.sficCore([{ symbol: 'MK', bitting: M.parseBitting('2222222') },
                              { symbol: 'CK', bitting: M.parseBitting('4444444') }],
                             null, A27, {});
eq('a core with no control key has the same operating exposure',
   noCtlCore.incidental, two.cores[0].incidental);
check('a core with no control key has no control or top pin, and says so',
  noCtlCore.barrels.every(b => b.control === null && b.top === null && !b.complete));

/* ===================== cross-keying, and the control key that also opens doors ===================== */
const clash = S.buildSFIC({ system: A27, control: '4189250', master: '2222222',
                            operating: ['4422222', '4222222'] });
check('a change key that opens another core is caught',
  clash.audit.violations.length === 1 && clash.audit.violations[0].key === 'CK02',
  JSON.stringify(clash.audit.violations));
check('a clean set reports no violation', !two.audit.violations.length);

const dual = S.buildSFIC({ system: A27, control: '2222222', master: '2222222',
                           operating: ['4444444'] });
eq('a control key whose cuts are all operating depths is flagged',
   dual.audit.controlAlsoOperates, ['CK01']);
eq('an ordinary control key is not', two.audit.controlAlsoOperates, []);

/* ===================== top pins belong to the control key ===================== */
const many = S.buildSFIC({ system: A27, control: '4189250', master: '8301836', count: 5 });
const tops = many.cores.map(c => c.barrels.map(b => b.top).join(' '));
check('every core on one control key takes the same top pins',
  new Set(tops).size === 1, tops.join(' | '));
eq('and the reported row agrees with the charts',
   many.topPins.join(' '), tops[0]);

/* ===================== warnings fire on thin segments ===================== */
const thin = S.buildSFIC({ system: A27, control: '0000000', master: '9999999' });
check('a control key cut far shallower than the operating keys is warned about',
  thin.cores[0].warnings.length === A27.chambers
  && /control pin of 1/.test(thin.cores[0].warnings[0]),
  JSON.stringify(thin.cores[0].warnings.slice(0, 1)));
check('the thin core still totals the stack height — it assembles, which is the problem',
  thin.cores[0].barrels.every(b => b.total === A27.totalStack));

/* ===================== bad input is refused with the key named ===================== */
const bad = S.buildSFIC({ system: A27, control: '41892', master: '8301836' });
check('a control key with the wrong number of cuts is refused',
  !bad.ok && /Control/.test(bad.errors.join(' ')), JSON.stringify(bad.errors));
const badDepth = S.buildSFIC({ system: A47, master: '9999999' });
check('a cut outside the system depth range is refused',
  !badDepth.ok && /outside 0-5/.test(badDepth.errors.join(' ')), JSON.stringify(badDepth.errors));

/* ===================== the parity read ===================== */
eq('an A2 key reads the depths its barrel can use',
   S.parityRead([4, 5], A27), [[0, 2, 4, 6, 8], [1, 3, 5, 7, 9]]);
check('A2 reports the parity read', !!a2.parity);
check('A4 reports no parity read — single step has no pattern to read',
  a4.parity === null);
check('and says so in words',
  a4.read.unknown.some(u => /single step/i.test(u)), JSON.stringify(a4.read.unknown));

/* ===================== nothing here duplicates master.js ===================== */
const src = require('fs').readFileSync(require('path').join(__dirname, '../assets/js/sfic.js'), 'utf8');
check('sfic.js does not re-implement the pin stack math',
  !/function pinChamber/.test(src) && /SFIC_MK\.pinChamber/.test(src));
check('sfic.js does not re-implement bitting validation',
  !/function validateBitting/.test(src) && /SFIC_MK\.validateBitting/.test(src));
check('sfic.js does not re-implement the cross-key progression',
  !/function extendSystem/.test(src) && /SFIC_MK\.extendSystem/.test(src));

/* ===================== the app loads it ===================== */
const html = require('fs').readFileSync(require('path').join(__dirname, '../index.html'), 'utf8');
const appjs = require('fs').readFileSync(require('path').join(__dirname, '../assets/js/app.js'), 'utf8');
check('index.html loads sfic.js', /assets\/js\/sfic\.js/.test(html));
check('and loads it after master.js, which it reads its pin math from',
  html.indexOf('assets/js/master.js') < html.indexOf('assets/js/sfic.js'));
check('the master view offers the SFIC mode', /data-mkmode="sfic"/.test(appjs));
check('and routes it to buildSFIC', /buildSFIC\(\{/.test(appjs));
['mkSficFormHtml', 'mkSficResultHtml', 'mkSficText', 'sficSys', 'sficOpLines']
  .forEach(fn => check(`app.js defines ${fn}`, new RegExp('function ' + fn + '\\b').test(appjs)));

/* ===================== the shell has to be cached, or it is not offline =====================
   This one is not really about SFIC. Adding a script to index.html and
   forgetting it in the service worker's precache list produces an app that
   works perfectly on the bench and throws on a job with no bars, which is the
   single condition the whole thing exists for. sfic.js was shipped that way
   for about twenty minutes. Check all of them, so the next one cannot be. */
const sw = require('fs').readFileSync(require('path').join(__dirname, '../sw.js'), 'utf8');
const scripts = [...html.matchAll(/<script src="([^"]+)"/g)].map(m => m[1]);
check('index.html loads some scripts to check', scripts.length >= 8, scripts.join(' '));
const uncached = scripts.filter(src => !sw.includes("'./" + src + "'"));
check('every script index.html loads is in the service worker precache list',
  !uncached.length, uncached.join(', ') + ' — the app would throw offline');
check('the stylesheet is cached too',
  [...html.matchAll(/<link[^>]+href="(assets\/[^"]+\.css)"/g)]
    .every(m => sw.includes("'./" + m[1] + "'")));

console.log(fail ? `\n${fail} FAILED` : '\nall SFIC checks passed'
  + `  (${Object.keys(S.SFIC_SYSTEMS).length} core systems, both BEST worked examples reproduced)`);
process.exit(fail ? 1 : 0);
