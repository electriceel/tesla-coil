/* Whole-app integrity: the flaws that no single module's test would catch,
   because each one lives in the seam between two files.

   Every check here was written after the flaw it guards was found in the
   shipped app and fixed, not before. */
const fs = require('fs');
const path = require('path');
const read = (f) => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');

const { SEED_VEHICLES: V } = require('../assets/js/data.js');

/* Several checks below assert that a source file does or does not contain a
   construct. Run against the raw text they are nearly worthless: this file is
   heavily commented, every comment quotes the bug it describes, and the first
   negative check written here passed its own prose instead of the code. Match
   against the code with comments and string literals stripped. */
const code = (f) => read(f)
  .replace(/\/\*[\s\S]*?\*\//g, ' ')
  .replace(/(^|[^:])\/\/.*$/gm, '$1')
  .replace(/'(?:[^'\\\n]|\\.)*'/g, "''")
  .replace(/"(?:[^"\\\n]|\\.)*"/g, '""');

const app = code('assets/js/app.js');
const store = code('assets/js/store.js');
const appRaw = read('assets/js/app.js');
const storeRaw = read('assets/js/store.js');
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
  /lastError\s*=/.test(store) && /QuotaExceededError/.test(storeRaw));
check('Store exposes the reason to the UI', /get lastError\(\)/.test(store));

/* Every Store method whose job is to persist has to hand the boolean back. A
   method that calls write() and returns undefined cannot be checked by anyone. */
const swallowed = [];
storeRaw.split('\n').forEach((line, i) => {
  if (/^\s*(\/\/|\*|\/\*)/.test(line)) return;
  const m = line.match(/^\s*(?:ok = )?write\(K\.\w+/);
  if (m && !/return |ok = /.test(line)) swallowed.push((i + 1) + ': ' + line.trim());
});
check('no Store method throws away the result of write()', !swallowed.length,
  swallowed.join('\n     '));

/* And every save the UI performs has to be wrapped, or the next one added
   quietly reintroduces the bug. */
/* A delete is a write. The first pass of this list covered only the save
   paths, so four deletes went on ignoring their result -- and because
   removing a record shrinks the payload, a full device never exposed it. It
   takes storage refused outright (private mode, device policy) to show, and
   then the record stays while the view re-renders as though it had gone. */
const SAVERS = ['saveVehicle', 'saveBlank', 'saveJob', 'saveMkSystem', 'addTip',
                'setPrefs', 'setBcmRows',
                'deleteVehicle', 'deleteBlank', 'deleteJob', 'deleteTip', 'deleteMkSystem'];
const unwrapped = [];
appRaw.split('\n').forEach((line, i) => {
  if (/^\s*(\/\/|\*|\/\*)/.test(line)) return;
  SAVERS.forEach(fn => {
    if (!line.includes('Store.' + fn + '(')) return;
    if (!/persisted\(/.test(line)) unwrapped.push((i + 1) + ': ' + line.trim().slice(0, 90));
  });
});
check('every Store save in the UI goes through persisted()', !unwrapped.length,
  unwrapped.join('\n     '));
check('persisted() actually tells the user', /function persisted\(ok\)[\s\S]{0,220}alert\(/.test(appRaw));

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
  /BigInt\(/.test(app) && /BigInt\('0x' \+ h\)/.test(appRaw) && /BigInt\(raw\)/.test(appRaw));
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
  /conflicts/.test(app) && /DIFFERENT PIN/.test(appRaw));

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

/* ============ store.js, actually run ============
   Grepping the source proves a construct is present, not that it works: the
   first draft of the damaged-backup check passed happily with the rejection
   turned into `if (false)`. store.js has no exports and talks to
   localStorage, so load it with a stub and exercise the real functions. */
function loadStore() {
  const mem = new Map();
  const localStorage = {
    getItem: k => (mem.has(k) ? mem.get(k) : null),
    setItem: (k, v) => { if (mem.__full) { const e = new Error('full'); e.name = 'QuotaExceededError'; throw e; } mem.set(k, String(v)); },
    removeItem: k => mem.delete(k),
    clear: () => mem.clear()
  };
  const src = read('assets/js/store.js') + '\n;return Store;';
  const Store = new Function('localStorage', 'console', src)(localStorage, { warn() {} });
  return { Store, mem };
}

{
  const { Store } = loadStore();
  const before = Object.keys(Object.prototype).length;
  const refused = [
    Store.addTip('__proto__', 'entry', 'x'),
    Store.addTip('constructor', 'entry', 'x'),
    Store.addTip('prototype', 'entry', 'x'),
    Store.addTip('toyota-camry-2002-2006', '__proto__', 'x')
  ];
  check('addTip cannot write onto Object.prototype',
    Object.keys(Object.prototype).length === before,
    'leaked: ' + JSON.stringify(Object.keys(Object.prototype)));
  /* Two separate defences stop this -- the reserved-name screen and the
     hasOwnProperty read -- and either alone keeps Object.prototype clean. So
     check the screen's own contract as well, or it can be removed without
     anything noticing until the day the other layer is refactored. */
  check('a reserved name is refused outright, not quietly stored',
    refused.every(r => r === false) && Store.tipCount() === 0,
    JSON.stringify(refused) + ' tips=' + Store.tipCount());
  check('but an ordinary tip still saves',
    Store.addTip('toyota-camry-2002-2006', 'entry', 'wedge the top corner') !== false
    && Store.tipCount() === 1, String(Store.tipCount()));
}

{
  /* A damaged backup must leave a good one alone. replace mode writes over
     everything, so this is the one import path that can destroy data. */
  const { Store } = loadStore();
  Store.saveJob({ id: 'keep-me', customer: 'Ryan', date: '2026-10-20' });
  const damaged = [
    ['jobs as an object', { app: 'keypro-field', jobs: { a: 1 } }],
    ['vehicles as a string', { app: 'keypro-field', vehicles: 'x' }],
    ['mk not an array', { app: 'keypro-field', mk: 'x' }],
    ['a tip list that is a string', { app: 'keypro-field', tips: { v1: { entry: 'nope' } } }]
  ];
  damaged.forEach(([name, obj]) => {
    let threw = false;
    try { Store.importAll(obj, 'replace'); } catch (e) { threw = /damaged/.test(e.message); }
    check(`a backup with ${name} is refused`, threw);
  });
  check('and the job that was already there survived every attempt',
    Store.jobs().length === 1 && Store.jobs()[0].id === 'keep-me',
    JSON.stringify(Store.jobs()));

  let ok = false;
  try { ok = Store.importAll(Store.exportAll(), 'replace'); } catch (e) { ok = 'threw: ' + e.message; }
  check('a sound backup still restores', ok === true && Store.jobs().length === 1, String(ok));
}

{
  const { Store, mem } = loadStore();
  mem.__full = true;
  check('a save that hits the quota returns false',
    Store.saveJob({ id: 'j', customer: 'x' }) === false);
  check('and says the storage is full', /storage is full/.test(Store.lastError), Store.lastError);
}

{
  const { Store } = loadStore();
  check('a rate of "$85" from a backup is cleaned to a number', (() => {
    Store.importAll({ app: 'keypro-field', prefs: { rate: '$85/hr' } }, 'merge');
    return Store.prefs().rate === '85';
  })(), JSON.stringify(Store.prefs()));
}

/* Dead persistence code is its own bug: Store.deleteMkSystem existed from the
   first commit and nothing called it, so saved master systems accumulated with
   no way to remove one, on the screen where a locksmith saves a record per
   job. Everything Store exposes to delete something needs a way in. */
['deleteVehicle', 'deleteBlank', 'deleteJob', 'deleteTip', 'deleteMkSystem'].forEach(fn =>
  check(`Store.${fn} is reachable from the UI`, app.includes('Store.' + fn + '('),
    'defined but never called -- the records it removes can never be removed'));

/* ============ the one network call in the app ============
   "Needs signal" is not "no signal": one bar gives you a socket that connects
   and never answers, and fetch waits on that forever. The button sat disabled
   reading "Asking NHTSA..." with no way back, in exactly the conditions it
   exists for. */
const vin = code('assets/js/vin.js');
check('the NHTSA lookup is the only network call in the app',
  ['app.js', 'store.js', 'data.js', 'master.js', 'sfic.js', 'fcc.js', 'dealer.js', 'models.js']
    .every(f => !/\bfetch\(|XMLHttpRequest|sendBeacon|new WebSocket/.test(code('assets/js/' + f))));
check('and it gives up rather than hanging', /AbortController/.test(vin)
  && /setTimeout\(\(\) => ctl\.abort\(\)/.test(vin));
check('with a timeout short enough to be useful in the field', (() => {
  const m = read('assets/js/vin.js').match(/VPIC_TIMEOUT_MS = (\d+)/);
  return m && +m[1] > 0 && +m[1] <= 20000;
})(), 'VPIC_TIMEOUT_MS must be set and no more than 20s');
const vinRaw = read('assets/js/vin.js');
check('an abort is reported as a timeout, not a mystery',
  /AbortError/.test(vinRaw) && /no answer in/.test(vinRaw));

/* ============ keys that are not keys ============
   JSON.parse turns "__proto__" into a real own property, and
   all[vehId] || (all[vehId] = {}) then walks onto Object.prototype. Tips are
   keyed by vehicle id, which arrives from the route, so Store.addTip wrote a
   category straight onto Object.prototype and gave every object in the app a
   stray property. Not reachable from the UI as it stood -- a missing vehicle
   renders no tip form -- which is exactly why it needed catching now. */
check('JSON is parsed with a reviver that drops __proto__',
  /const dropProto = /.test(store) && /JSON\.parse\(v, dropProto\)/.test(store));
check('ids used as object keys are screened', /const safeKey = /.test(store));
check('and the tip paths read with hasOwnProperty, not bare indexing',
  /const hasOwn = /.test(store)
  && !/all\[vehId\] \|\| \(all\[vehId\] = \{\}\)/.test(store));

/* ============ a damaged backup must not destroy a good one ============
   replace mode writes over everything. A truncated or hand-edited file used
   to be accepted field by field -- a string where the vehicle map belongs was
   spread into numbered keys and counted as records -- and the only backup
   mechanism the app has reported success. Shape is checked before the first
   write now. */
check('importAll validates every section before writing anything',
  /const shape = \{/.test(store) && /Nothing was changed/.test(storeRaw));
check('and reaches inside tips, which nests two levels',
  /Array\.isArray\(l\)/.test(store));
check('tipCount counts only actual lists',
  /Array\.isArray\(list\) \? list\.length : 0/.test(store));

/* ============ the job log opens in a spreadsheet ============
   Quoting a CSV field does not stop Excel or Sheets evaluating it: a cell
   whose text starts with = + - @ is a formula either way. The everyday
   casualty is not an attack, it is a phone number -- "+18055550123" opens
   broken. Plain numbers are left alone so a price column still sums. */
check('CSV cells that would be read as formulas are escaped',
  /const CSV_FORMULA = /.test(app) && /function csvCell/.test(app));
check('but plain numbers are left as numbers',
  /\^-\?\\d\+\(\\\.\\d\+\)\?\$/.test(app));
check('the job export goes through csvCell', /cols\.map\(c => csvCell\(j\[c\]\)\)/.test(app));

/* ============ every field has a label a screen reader can find ============
   The markup looked labelled -- <label>Trip</label><input id="qTrip"> -- but
   with no for= and no wrapping, nothing associates the two. Eleven fields,
   including the whole quote builder and the VIN box. */
const LABELLED = ['vinInput', 'bcmInput', 'qBase', 'qTrip', 'qKeys', 'qPer', 'qProg',
                  'hexIn', 'setShop', 'setPhone', 'setRate'];
const unlabelled = LABELLED.filter(id => !new RegExp('<label for="' + id + '"').test(html));
check('every standalone input is bound to its label', !unlabelled.length,
  unlabelled.join(', '));
check('and the page does not block pinch zoom',
  !/user-scalable=no|maximum-scale=1/.test(html));

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
