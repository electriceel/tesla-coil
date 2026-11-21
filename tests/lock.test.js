/* The passcode lock, checked at the level a node test can reach: the crypto
   itself, and the wiring that the browser tests exercise but no one would
   notice rotting.

   The end-to-end behaviour — set, unlock, change, remove, wipe, auto-lock,
   the quota guarantee, offline unlock — is driven in a real browser, because
   localStorage and the lock screen are not things this file can honestly
   fake. What is here is what survives without one. */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');

const read = (f) => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const lockSrc = read('assets/js/lock.js');
const storeSrc = read('assets/js/store.js');
const appSrc = read('assets/js/app.js');
const html = read('index.html');
const sw = read('sw.js');

let fail = 0;
const check = (name, ok, detail) => {
  if (ok) { console.log('  ok  ' + name); return; }
  console.log('FAIL ' + name + (detail ? '\n     ' + detail : ''));
  fail++;
};

/* ---- load lock.js for real, against node's WebCrypto ---- */
const store = new Map();
const ctx = {
  console,
  crypto: crypto.webcrypto,
  TextEncoder, TextDecoder,
  btoa: (s) => Buffer.from(s, 'binary').toString('base64'),
  atob: (s) => Buffer.from(s, 'base64').toString('binary'),
  localStorage: {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => { store.set(k, String(v)); },
    removeItem: (k) => { store.delete(k); }
  },
  module: { exports: {} }
};
ctx.window = undefined;        /* skip the visibilitychange wiring */
ctx.document = undefined;
vm.createContext(ctx);
vm.runInContext(lockSrc, ctx, { filename: 'lock.js' });
const Lock = ctx.module.exports.Lock;

check('lock.js loads and exports a Lock', !!Lock && typeof Lock.setup === 'function');

(async () => {
  /* ---- the crypto does what it says ---- */
  store.clear();
  store.set('keypro:jobs', JSON.stringify([{ id: 'j1', note: '123 Elm St' }]));
  store.set('keypro:bcm', JSON.stringify([{ bcm: 'AB12', pin: '4471' }]));

  await Lock.setup('correct horse');
  const sealedJobs = store.get('keypro:jobs');
  check('setup replaces the stored value with a sealed envelope',
    /"v":1/.test(sealedJobs) && /"iv":/.test(sealedJobs) && /"ct":/.test(sealedJobs),
    sealedJobs.slice(0, 70));
  check('the plain text is gone from storage',
    !/Elm St/.test(sealedJobs) && !/4471/.test(store.get('keypro:bcm')));

  /* The salt and iteration count are stored, because checking a passcode
     needs them. Neither tells you the passcode. The passcode itself must not
     appear anywhere, in any form. */
  const all = [...store.entries()].map(([k, v]) => k + '=' + v).join('\n');
  check('nothing in storage contains the passcode', !/correct horse/.test(all));
  const meta = JSON.parse(store.get('keypro:lock'));
  check('the salt is stored', typeof meta.salt === 'string' && meta.salt.length >= 20);
  check('the iteration count is stored and is high',
    meta.iterations >= 200000, String(meta.iterations));
  check('a verifier is stored rather than a hash of the passcode',
    typeof meta.verifier === 'string' && /"ct":/.test(meta.verifier));

  /* ---- unlocking ---- */
  Lock.lock();
  check('locking drops the key', Lock.state() === 'locked');
  check('and the store reads nothing while locked', Lock.readRaw('keypro:jobs') === null);

  check('a wrong passcode is refused', (await Lock.unlock('wrong horse')) === false);
  check('and the failure is counted in storage, not memory',
    JSON.parse(store.get('keypro:lock')).fails === 1);

  check('the right passcode opens it', (await Lock.unlock('correct horse')) === true);
  check('and the data comes back exactly',
    JSON.parse(Lock.readRaw('keypro:jobs'))[0].note === '123 Elm St');
  check('the failure count resets on success',
    JSON.parse(store.get('keypro:lock')).fails === 0);

  /* ---- tampering must fail loudly, not quietly return rubbish ---- */
  const env = JSON.parse(store.get('keypro:jobs'));
  const ct = Buffer.from(env.ct, 'base64');
  ct[0] ^= 0xff;
  store.set('keypro:jobs', JSON.stringify({ ...env, ct: ct.toString('base64') }));
  Lock.lock();
  await Lock.unlock('correct horse');
  check('a tampered value does not decrypt to anything (GCM authenticates)',
    Lock.readRaw('keypro:jobs') === null);
  check('and one damaged value does not take the rest down with it',
    JSON.parse(Lock.readRaw('keypro:bcm'))[0].pin === '4471');

  /* ---- the delay after repeated wrong guesses actually grows ---- */
  store.set('keypro:lock', JSON.stringify({ ...JSON.parse(store.get('keypro:lock')), fails: 0 }));
  const delays = [0, 3, 5, 8].map(f => {
    store.set('keypro:lock', JSON.stringify({ ...JSON.parse(store.get('keypro:lock')), fails: f }));
    return Lock.penaltyMs();
  });
  check('the first couple of wrong tries are not slowed', delays[0] === 0);
  check('the delay grows after that and then stops growing',
    delays[1] > 0 && delays[2] > delays[1] && delays[3] <= 30000,
    JSON.stringify(delays));

  /* ---- the sealed size is predicted exactly, which is what lets a write
     still answer "did this fit?" in the same tick ---- */
  let worstOff = 0;
  for (const len of [0, 1, 2, 3, 17, 100, 1024, 50000]) {
    const plain = 'x'.repeat(len);
    const before = store.get('keypro:jobs');
    Lock.writeRaw('keypro:jobs', plain);
    await new Promise(r => setTimeout(r, 0));
    const got = store.get('keypro:jobs').length;
    /* writeRaw seals asynchronously; wait for it to land */
    for (let i = 0; i < 50 && store.get('keypro:jobs') === before; i++) {
      await new Promise(r => setTimeout(r, 2));
    }
    const actual = store.get('keypro:jobs').length;
    const predicted = vm.runInContext(
      '(' + /function sealedLength[\s\S]*?\n  }/.exec(lockSrc)[0] + ')', ctx)(plain);
    worstOff = Math.max(worstOff, Math.abs(actual - predicted));
  }
  check('the predicted sealed length matches the real one', worstOff === 0,
    'off by up to ' + worstOff + ' bytes');

  /* ---- wiring that the browser proves, and that would rot silently ---- */
  check('lock.js is loaded before store.js',
    html.indexOf('assets/js/lock.js') < html.indexOf('assets/js/store.js')
      && html.includes('assets/js/lock.js'));
  check('lock.js is precached by the service worker', /lock\.js/.test(sw));
  check('the store reads and writes through the lock',
    /Lock\.readRaw\(/.test(storeSrc) && /Lock\.writeRaw\(/.test(storeSrc));

  /* The one that actually bit: vehicles() and blanks() cache against rev, and
     unlocking changes every answer without going through write(). */
  check('unlocking invalidates the derived caches',
    /Lock\.onChange\(\(\)\s*=>\s*\{\s*rev\+\+/.test(storeSrc),
    'store.js must bump rev when the lock state changes');

  /* The other one: showing the screen on lock but never hiding it. */
  const watch = /function watchLock\(\)[\s\S]*?\n\}/.exec(appSrc);
  check('the lock screen is hidden as well as shown',
    watch && /showLock\(locked\)/.test(watch[0]),
    'watchLock must drive the overlay in both directions');

  /* Erasing everything has to take the lock metadata with it, or the app
     comes back asking for a passcode to decrypt nothing. */
  check('"erase everything" clears the lock too', /Lock\.isOn\(\)\s*\)\s*Lock\.wipe\(\)/.test(appSrc));

  /* The keys the lock covers must be the keys the store uses. */
  const storeKeys = [...storeSrc.matchAll(/^\s{2}(\w+):\s*NS \+ '(\w+)'/gm)].map(m => 'keypro:' + m[2]);
  const covered = ctx.module.exports.LOCKED_KEYS;
  const missed = storeKeys.filter(k => !covered.includes(k));
  check('every key the store writes is covered by the lock', !missed.length,
    missed.join(', ') + ' — a new store key defaults to plain text');

  console.log(fail ? `\n${fail} FAILED` : '\nall lock checks passed');
  process.exit(fail ? 1 : 0);
})();
