/* Whole-app integrity: the flaws that no single module's test would catch,
   because each one lives in the seam between two files.

   Every check here was written after the flaw it guards was found in the
   shipped app and fixed, not before. */
const fs = require('fs');
const path = require('path');
const read = (f) => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');

const { SEED_VEHICLES: V } = require('../assets/js/data.js');
const app = read('assets/js/app.js');
const store = read('assets/js/store.js');
const sw = read('sw.js');
const html = read('index.html');

let fail = 0;
const check = (name, ok, detail) => {
  if (ok) { console.log('  ok  ' + name); return; }
  console.log('FAIL ' + name + (detail ? '\n     ' + detail : ''));
  fail++;
};

/* ============ the shell has to be cached, or there is no offline ============
   caches.addAll() rejects as a unit. One missing path and the install fails,
   nothing is cached at all, and the failure is invisible until someone opens
   the app in a parking garage -- the one place it exists for. */
const assets = (sw.match(/const ASSETS = \[([\s\S]*?)\];/)[1].match(/'([^']+)'/g) || [])
  .map(s => s.slice(1, -1));
check('the service worker precaches a plausible number of files', assets.length >= 20,
  assets.length + ' entries');
const missing = assets.map(a => a.replace(/^\.\//, '')).filter(a => a && !fs.existsSync(
  path.join(__dirname, '..', a)));
check('every precached path exists on disk', !missing.length,
  missing.join(', ') + ' -- addAll rejects as a unit, so this kills offline entirely');

const scripts = [...html.matchAll(/<script src="([^"]+)"/g)].map(m => m[1]);
const uncached = scripts.filter(src => !sw.includes("'./" + src + "'"));
check('every script index.html loads is precached', !uncached.length, uncached.join(', '));

/* ============ a save that did not happen must not read as one ============
   localStorage fills up. Before this, write() caught the quota error, logged
   to the console and returned false -- and every caller ignored it, two of
   them printing "Saved." A job logged in a driveway vanished with a
   confirmation on screen. */
check('write() reports why it failed, not just that it did',
  /lastError\s*=/.test(store) && /QuotaExceededError/.test(store));
check('Store exposes the reason to the UI', /get lastError\(\)/.test(store));

/* Every Store method whose job is to persist has to hand the boolean back. A
   method that calls write() and returns undefined cannot be checked by anyone. */
const swallowed = [];
store.split('\n').forEach((line, i) => {
  const m = line.match(/^\s*(?:ok = )?write\(K\.\w+/);
  if (m && !/return |ok = /.test(line)) swallowed.push((i + 1) + ': ' + line.trim());
});
check('no Store method throws away the result of write()', !swallowed.length,
  swallowed.join('\n     '));

/* And every save the UI performs has to be wrapped, or the next one added
   quietly reintroduces the bug. */
const SAVERS = ['saveVehicle', 'saveBlank', 'saveJob', 'saveMkSystem', 'addTip',
                'setPrefs', 'setBcmRows'];
const unwrapped = [];
app.split('\n').forEach((line, i) => {
  SAVERS.forEach(fn => {
    if (!line.includes('Store.' + fn + '(')) return;
    if (!/persisted\(/.test(line)) unwrapped.push((i + 1) + ': ' + line.trim().slice(0, 90));
  });
});
check('every Store save in the UI goes through persisted()', !unwrapped.length,
  unwrapped.join('\n     '));
check('persisted() actually tells the user', /function persisted\(ok\)[\s\S]{0,220}alert\(/.test(app));

/* ============ the money screen ============
   The rate pref reaches the quote builder as a number. The field is
   type=number, but importAll merges whatever a backup file carries, and "$85"
   in there turned every quote into "$NaN" in front of the customer. */
check('prefs() coerces the stored rate to a number', /parseFloat\(String\(p\.rate/.test(store));
check('the quote builder has a NaN-proof reader', /const money = \(v, dflt\)/.test(app)
  && /Number\.isFinite\(n\) \? n :/.test(app));
check('quote figures cannot go negative', /Math\.max\(0, money\(/.test(app));
['qBase', 'qTrip', 'qPer', 'qProg', 'setRate'].forEach(id => check(
  `#${id} refuses negative input in the markup too`,
  new RegExp('id="' + id + '"[^>]*min="0"').test(html)));
check('#qKeys is bounded at both ends', /id="qKeys"[^>]*min="0"[^>]*max="99"/.test(html));

/* ============ hex / decimal ============
   parseInt stops at the first character it dislikes and returns what it read,
   so "0x1A" came back as decimal 0 and "1A" as decimal 1 -- both displayed as
   real answers. And 20 hex digits, an ordinary transponder length, overflowed
   into 1.2089258196146292e+24 with a binary string rounded past 2^53. */
check('the converter demands a wholly valid value', /const HEX_RE = /.test(app)
  && /const DEC_RE = /.test(app));
check('and converts with BigInt, which is exact at any length',
  /BigInt\('0x' \+ h\)/.test(app) && /BigInt\(raw\)/.test(app));
check('parseInt is no longer used for the conversion',
  !/parseInt\(v\.replace\(\/\^0x\/i/.test(app));

/* ============ the BCM table ============
   The lookup strips spaces from the code; the import deduplicated on the raw
   string. A file carrying "AB12,1234" and "AB 12,9999" stored both, and the
   second -- a different PIN for the same module -- could never be reached.
   An unreachable PIN is not harmless in the one table whose job is to stop you
   burning an attempt. */
check('import and lookup normalise the code the same way', /const bcmKey = /.test(app));
check('and a duplicate code with a different PIN is reported, not swallowed',
  /conflicts/.test(app) && /DIFFERENT PIN/.test(app));

/* ============ ids that contradict their own data ============
   A vehicle id is an opaque key -- renaming one would orphan the tips, jobs
   and overrides stored against it, so these stay. But an id that says
   2014-2023 on a record running to 2024 is a trap for the next edit, and it
   caught me once already. The existing ones are listed; new ones are not
   allowed. */
const ID_YEAR_DIVERGENCE = [
  'ram-promaster-2014-2023', 'bmw-3series-2012-2019', 'chevy-uplander-2005-2009',
  'ford-thunderbird-2002-2005', 'chrysler-lh-1998-2004', 'acura-rl-integra-1994-2012',
  'kia-amanti-cadenza-2004-2020', 'mercury-sable-cougar-1996-2011',
  'pontiac-fiero-sunbird-1981-1998', 'pontiac-g3-2009-2010', 'cadillac-xlr-elr-2004-2017',
  'mazda-bseries-2-5-1994-2021', 'nissan-z-ariya-2023-2024', 'olds-firenza-1981-1996',
  'dodge-kcar-1981-1995', 'datsun-1970-1986'
];
const diverged = V.filter(v => {
  const m = v.id.match(/(\d{4})-(\d{4})$/);
  return m && (+m[1] !== v.yearStart || +m[2] !== v.yearEnd);
}).map(v => v.id);
const newDiv = diverged.filter(id => !ID_YEAR_DIVERGENCE.includes(id));
check('no new id contradicts the years on its own record', !newDiv.length,
  newDiv.join(', '));
const healed = ID_YEAR_DIVERGENCE.filter(id => !diverged.includes(id));
check('the divergence list carries no entries that are already fixed', !healed.length,
  healed.join(', ') + ' -- drop them from the list');

/* ============ basic record sanity ============ */
const ids = new Set();
const dupes = V.filter(v => (ids.has(v.id) ? true : (ids.add(v.id), false))).map(v => v.id);
check('no duplicate vehicle id', !dupes.length, dupes.join(', '));
const badYears = V.filter(v => !(v.yearStart <= v.yearEnd) || v.yearStart < 1900 || v.yearEnd > 2027)
  .map(v => `${v.id} ${v.yearStart}-${v.yearEnd}`);
check('every year range is ordered and plausible', !badYears.length, badYears.join(', '));

console.log(fail ? `\n${fail} FAILED`
  : `\nall integrity checks passed  (${assets.length} precached files, ${V.length} vehicles)`);
process.exit(fail ? 1 : 0);
