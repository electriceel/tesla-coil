/* The access classifier decides whether a job gets referred out, so a
   misclassification costs a job or a wasted drive. These are the cases that
   actually went wrong while it was being written, plus the boundaries.

   Run: node tests/dealer.test.js */
const { classifyAccess, obdAffirmative, DEALER_TIERS } = require('../assets/js/dealer.js');
const { SEED_VEHICLES: V } = require('../assets/js/data.js');

let fail = 0;
const check = (name, ok, detail) => {
  if (ok) return console.log('  ok  ' + name);
  console.log('FAIL ' + name + (detail ? '\n     ' + detail : ''));
  fail++;
};
const rec = (obd, akl) => ({ programming: { obd, allKeysLost: akl } });
const tierOf = (obd, akl) => { const r = classifyAccess(rec(obd, akl)); return r && r.tier; };

/* ---- the regression that started this ----
   "Usually bench — FEM/BDC module work" begins with "usually" and an early
   version read that as an affirmative, filing a BMW F30 alongside a Camry. */
check('"Usually bench" is not an affirmative OBD answer', !obdAffirmative('Usually bench — FEM/BDC module work'));
check('"Yes with a current tool" is', obdAffirmative('Yes with a current tool'));
check('"No — EIS/ESL work" is not', !obdAffirmative('No — EIS/ESL work'));
check('an affirmative that mentions the bench is still vetoed',
  !obdAffirmative('Yes, but usually on the bench'));

check('bench work with no OBD path is tier 2',
  tierOf('Usually bench — FEM/BDC module work', 'FEM/BDC read, ISN required') === 2);
check('bench work with a working OBD path is tier 5',
  tierOf('Yes on CAS3 with the right tool', 'FEM/BDC usually needs the module on the bench') === 5);

/* ---- dealer-only versus dealer-sometimes ----
   Filing "Dealer on most" as dealer-only turns down work you can do. */
check('a flat dealer answer on both fields is tier 1',
  tierOf('Dealer', 'Dealer') === 1);
check('"Dealer on most" is not dealer-only',
  tierOf('Triumph dealer tool', 'Dealer on most') !== 1);
check('"Dealer where the immobilizer is fitted" is not dealer-only',
  tierOf('KTM dealer tool', 'Dealer where the immobilizer is fitted') !== 1);
check('"cut by code on keyed machines; dealer on D.E.S.S." is not dealer-only',
  tierOf('BRP BUDS dealer tool', 'Cut by code on keyed machines; dealer on D.E.S.S.') !== 1);
check('Tesla service is tier 1', tierOf('No standard OBD-II', 'Tesla service') === 1);

/* ---- the other tiers ---- */
check('a red master key outranks the bench wording',
  tierOf('Honda-capable tool', 'No red master key means ECU work') === 3);
check('a code card counts as a master key',
  tierOf('Ducati diagnostic tool', 'Dealer without the red key and the card') === 3);
check('AutoAuth is tier 4',
  tierOf('Through the security gateway with an AutoAuth-capable tool', 'Gateway access required') === 4);
check('a dealer PIN source is tier 4',
  tierOf('Yes with a PIN', 'PIN from the dealer or read the RF Hub') === 4);
check('specialist AKL with a working OBD path is tier 5',
  tierOf('Yes with an MQB-capable tool', 'MQB AKL — specialist job') === 5);
check('too-new wording is tier 6',
  tierOf('Yes with a current tool', 'Confirm tool coverage before you commit') === 6);

/* ---- what must NOT be flagged ----
   An ordinary OBD job is the common case and a warning on it is noise that
   teaches you to ignore the screen. An early version read programming.notes
   and flagged a Silverado because its note said "confirm your tool covers it". */
check('an ordinary OBD job is not flagged', classifyAccess(rec('Yes', 'OBD')) === null);
check('a timed-access Ford is not flagged',
  classifyAccess(rec('Yes', 'OBD + 10-min security access')) === null);
check('a relearn is not flagged', classifyAccess(rec('Limited', '30-min x3 relearn')) === null);
check('a record with nothing recorded is not flagged', classifyAccess(rec('', '')) === null);
/* "some need a reset via the immobilizer box" is an ordinary job with a
   caveat; a looser pattern read it as specialist work and flagged a Camry. */
check('a passing mention of a module is not specialist work',
  classifyAccess(rec('Yes', 'OBD; some need a reset via the immobilizer box')) === null);
check('but actual module work still counts',
  (classifyAccess(rec('Limited', 'Immobilizer box work; often dealer')) || {}).tier === 5);

check('notes are not read at all', classifyAccess({
  programming: { obd: 'Yes', allKeysLost: 'OBD', notes: 'Dealer only, confirm coverage, bench work' } }) === null);

/* ---- shape of the result over the real catalog ---- */
const seen = V.map(classifyAccess).filter(Boolean);
const tiers = new Set(seen.map(r => r.tier));
check('every tier the classifier emits has a heading',
  [...tiers].every(t => DEALER_TIERS.some(d => d.tier === t)),
  [...tiers].join(','));
check('every flagged record carries the evidence it was judged on',
  seen.every(r => r.obd || r.akl));
/* Most of the catalog is ordinary work. If this ever flags half the book the
   rules have gone loose and the screen has stopped meaning anything. */
const share = seen.length / V.length;
check('the warning stays selective', share > 0.05 && share < 0.35,
  `${seen.length} of ${V.length} (${(share * 100).toFixed(1)}%)`);
check('Tesla is dealer-only', V.filter(v => v.make === 'Tesla')
  .every(v => (classifyAccess(v) || {}).tier === 1));

console.log(fail ? `\n${fail} FAILED` : `\nall access-classifier checks passed  (${seen.length} of ${V.length} flagged)`);
process.exit(fail ? 1 : 0);
