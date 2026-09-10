/* KeyPro Field — access classifier.
   ---------------------------------------------------------------------------
   Answers one question about a vehicle record: can you do this job, or do you
   refer it out? The answer is derived from the two fields the record already
   carries — programming.obd and programming.allKeysLost — so this file holds no
   list of vehicles and cannot drift out of agreement with the catalog. Add a
   record and it classifies itself.

   Notes are deliberately NOT read. They are prose, they mention tooling in
   passing, and including them flagged an ordinary Silverado as a dealer job.

   Pure functions, no DOM, so tests/dealer.test.js can drive it directly. */

const DEALER_TIERS = [
  { tier: 1, name: 'Dealer only',
    sub: 'No aftermarket path. Say so on the phone rather than driving out.' },
  { tier: 2, name: 'Bench or module work',
    sub: 'Doable with the kit or a partner, but never at the roadside.' },
  { tier: 3, name: 'Needs the OEM master key',
    sub: 'Ask the owner for it before you go. No master key, no job.' },
  { tier: 4, name: 'Gateway-gated',
    sub: 'Aftermarket tools work, but only with authorization.' },
  { tier: 5, name: 'All-keys-lost only',
    sub: 'Adding a key is fine. Losing every key is the expensive one.' },
  { tier: 6, name: 'Too new to promise',
    sub: 'Confirm your tool covers the exact year before you quote.' }
];

/* A plain "Dealer" or "Tesla service" closes the door. */
const A_HARD_DEALER = /\b(dealer|factory)\b|tesla service|rivian service|lucid service|not a locksmith job/i;
/* "Dealer on most", "dealer where fitted", "dealer on fob trims" do not — those
   are some-trims-yes, and filing them as dealer-only loses you the job. */
const A_CONDITIONAL = /dealer (on|where|for|in practice on)\b|;\s*(cut by code|dealer)|on (fob|immobilized|smart)\b|where (the )?(immobilizer|fitted)/i;
const A_SPECIAL   = /\bspecialist\b/i;
const A_BENCH     = /\bbench\b|module read|module access|\beis\b|\besl\b|cas\d|\bcas\b|fem|bdc|ews|immo data|cluster|password calc|key file|\bkvm\b|component protection|ecu (work|write|replacement|job)|\bisn\b|cim module|cem access|immobilizer box work/i;
const A_GATED     = /autoauth|security gateway|gateway (access|bypass)|rf hub|pin from the dealer/i;
const A_MASTERKEY = /red (master )?key|master key|code card/i;
const A_CONFIRM   = /confirm (tool )?coverage|confirm coverage|verify before|these are new|for the exact year|if the tool covers/i;

/* An affirmative OBD answer. "Usually bench" starts with "usually" and is the
   opposite of affirmative, so the bench words veto it — that mistake put a
   BMW F30 in the same tier as a Camry. */
function obdAffirmative(s) {
  const t = String(s || '').trim();
  return /^(yes|limited|tool-dependent|current tool|through the security gateway)/i.test(t)
      && !/bench|\beis\b|\besl\b|module/i.test(t);
}

/* Returns { tier, obd, akl } or null when the record needs no warning. */
function classifyAccess(v) {
  const p = (v && v.programming) || {};
  const obd = String(p.obd || '').trim();
  const akl = String(p.allKeysLost || '').trim();
  if (!obd && !akl) return null;
  const pair = obd + ' | ' + akl;

  const obdClosed = /^no\b/i.test(obd)
    || (A_HARD_DEALER.test(obd) && !A_CONDITIONAL.test(obd))
    || (A_SPECIAL.test(obd) && !obdAffirmative(obd));
  const aklClosed = (A_HARD_DEALER.test(akl) && !A_CONDITIONAL.test(akl))
    || (A_SPECIAL.test(akl) && !/cut by code|impression/i.test(akl));
  const works = obdAffirmative(obd);

  let tier = null;
  if (obdClosed && aklClosed) tier = 1;
  else if (A_MASTERKEY.test(akl)) tier = 3;
  else if (A_GATED.test(pair)) tier = 4;
  else if (A_BENCH.test(pair)) tier = works ? 5 : 2;
  else if (aklClosed || A_HARD_DEALER.test(akl) || A_SPECIAL.test(akl)) tier = 5;
  else if (A_CONFIRM.test(pair)) tier = 6;
  if (tier === null) return null;
  return { tier, obd, akl };
}

if (typeof module !== 'undefined') module.exports = { DEALER_TIERS, classifyAccess, obdAffirmative };
