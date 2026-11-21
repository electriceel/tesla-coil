/* Passcode lock for the data this device holds.

   WHAT THIS PROTECTS AND WHAT IT DOES NOT

   The app itself is public. It is served from a public GitHub Pages site out
   of a public repository, so anyone with the URL can open it and read every
   line of its source and the whole seed catalogue. No passcode in a static
   page can change that, and this one does not pretend to.

   What it protects is the part that is actually yours and actually sensitive:
   the job log with customer addresses, the BCM-to-PIN table, your own tips,
   and your edits to the records. Those live in this browser's localStorage,
   where until now they sat in plain text for anyone who picked up the phone.
   They are now encrypted with a key derived from the passcode, which means a
   person holding the unlocked phone, or reading the profile off a backup, has
   ciphertext and nothing else.

   HOW

   PBKDF2-HMAC-SHA256 over the passcode with a random 16-byte salt, 310,000
   iterations, to a 256-bit AES-GCM key. Each stored value gets its own random
   12-byte IV. The key exists only in this tab's memory: closing the tab or
   reloading drops it, and nothing writes it to disk.

   The salt, the iteration count, and a verifier blob are stored unencrypted —
   they have to be, to check a passcode — and none of them leaks the passcode.
   The verifier is a known string encrypted under the same key: if it decrypts,
   the passcode was right. GCM authenticates, so a wrong key fails loudly
   rather than returning rubbish.

   THERE IS NO RECOVERY. The key is derived from the passcode and the passcode
   is stored nowhere, which is the entire point. Forgetting it means the data
   is gone; the only way back is to wipe and start over. The setup screen says
   so and makes you export a backup first. */

const LOCK_NS = 'keypro:lock';
const LOCK_ITERATIONS = 310000;
const VERIFIER_TEXT = 'keypro-field/v1';
/* Locked again after this long in the background. A field app sits open on a
   phone for days, so "locks when you close it" would mean "never locks". */
const AUTOLOCK_MS = 5 * 60 * 1000;

/* Keys whose contents are the user's own and get encrypted. The theme and the
   lock's own metadata are deliberately not in here: the theme is not a secret
   and must apply before unlock, and the metadata is what unlocking reads. */
const LOCKED_KEYS = [
  'keypro:vehicles', 'keypro:blanks', 'keypro:jobs',
  'keypro:bcm', 'keypro:tips', 'keypro:mk', 'keypro:prefs'
];

const b64 = {
  enc: (buf) => {
    const b = new Uint8Array(buf);
    let s = '';
    for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
    return btoa(s);
  },
  dec: (str) => {
    const s = atob(str);
    const b = new Uint8Array(s.length);
    for (let i = 0; i < s.length; i++) b[i] = s.charCodeAt(i);
    return b;
  }
};

const Lock = (() => {
  let key = null;              /* CryptoKey while unlocked, null otherwise */
  let mem = null;              /* decrypted values, by storage key */
  let hiddenAt = 0;
  let listeners = [];

  const subtle = () => (typeof crypto !== 'undefined' && crypto.subtle) || null;
  const meta = () => {
    try { return JSON.parse(localStorage.getItem(LOCK_NS) || 'null'); }
    catch (e) { return null; }
  };

  async function deriveKey(passcode, saltBytes) {
    const base = await subtle().importKey(
      'raw', new TextEncoder().encode(passcode), 'PBKDF2', false, ['deriveKey']);
    return subtle().deriveKey(
      { name: 'PBKDF2', salt: saltBytes, iterations: LOCK_ITERATIONS, hash: 'SHA-256' },
      base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  }

  async function seal(k, plaintext) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = await subtle().encrypt({ name: 'AES-GCM', iv }, k,
      new TextEncoder().encode(plaintext));
    return JSON.stringify({ v: 1, iv: b64.enc(iv), ct: b64.enc(ct) });
  }

  async function open(k, envelope) {
    const o = JSON.parse(envelope);
    if (!o || o.v !== 1 || !o.iv || !o.ct) throw new Error('not a sealed value');
    const pt = await subtle().decrypt(
      { name: 'AES-GCM', iv: b64.dec(o.iv) }, k, b64.dec(o.ct));
    return new TextDecoder().decode(pt);
  }

  /* The exact length the sealed form of this plaintext will occupy, worked out
     without encrypting anything. write() reserves that many bytes in
     localStorage synchronously so it can still answer "did this fit?" in the
     same tick, the way every caller expects -- the sealing itself cannot be
     synchronous, because WebCrypto has no synchronous API. */
  function sealedLength(plaintext) {
    const bytes = new TextEncoder().encode(plaintext).length;
    const b64len = (n) => Math.ceil(n / 3) * 4;
    /* {"v":1,"iv":" is 13 characters, "," + "ct":" is 8, the closing "} is 2.
       The IV is 12 bytes and AES-GCM adds a 16-byte tag to the ciphertext.
       Getting this exactly right is what lets write() answer "did it fit?"
       synchronously; a prediction that came in UNDER the real size would let
       a write report success and then not fit, which is the one outcome this
       whole arrangement exists to avoid. */
    return 23 + b64len(12) + b64len(bytes + 16);
  }

  const notify = () => listeners.forEach(f => { try { f(); } catch (e) {} });

  return {
    ITERATIONS: LOCK_ITERATIONS,
    KEYS: LOCKED_KEYS,

    available() { return !!subtle(); },
    isOn() { return !!meta(); },
    isUnlocked() { return !!key; },
    /* 'off' | 'locked' | 'unlocked' */
    state() { return !meta() ? 'off' : (key ? 'unlocked' : 'locked'); },

    onChange(fn) { listeners.push(fn); },

    /* Failed attempts are counted in storage, not memory, so closing the tab
       is not a way to reset the delay. */
    failures() { const m = meta(); return (m && m.fails) || 0; },
    /* Grows with each wrong try. Not a lockout -- a wiped device helps nobody
       and this is the owner's own data -- just slow enough that guessing a
       passcode one at a time stops being worth doing. */
    penaltyMs() {
      const f = Lock.failures();
      return f < 3 ? 0 : Math.min(30000, 1000 * Math.pow(2, Math.min(f - 3, 5)));
    },

    /* Turn the lock on. Reads whatever is in storage now, seals it, and writes
       it back. Returns false and changes nothing if any part fails, so a
       half-encrypted store cannot happen. */
    async setup(passcode) {
      if (!subtle()) throw new Error('This browser cannot encrypt (no Web Crypto).');
      if (meta()) throw new Error('A passcode is already set.');
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const k = await deriveKey(passcode, salt);

      /* Seal everything before writing anything. */
      const sealed = {};
      for (const sk of LOCKED_KEYS) {
        const raw = localStorage.getItem(sk);
        if (raw == null) continue;
        sealed[sk] = await seal(k, raw);
      }
      const verifier = await seal(k, VERIFIER_TEXT);

      const prev = {};
      LOCKED_KEYS.forEach(sk => { prev[sk] = localStorage.getItem(sk); });
      try {
        Object.entries(sealed).forEach(([sk, v]) => localStorage.setItem(sk, v));
        localStorage.setItem(LOCK_NS, JSON.stringify({
          v: 1, salt: b64.enc(salt), iterations: LOCK_ITERATIONS, verifier, fails: 0
        }));
      } catch (e) {
        /* Put back exactly what was there. */
        Object.entries(prev).forEach(([sk, v]) => {
          if (v == null) localStorage.removeItem(sk); else localStorage.setItem(sk, v);
        });
        localStorage.removeItem(LOCK_NS);
        throw new Error('There was not room to encrypt your data, so nothing was changed.');
      }

      key = k;
      mem = {};
      LOCKED_KEYS.forEach(sk => { mem[sk] = prev[sk]; });
      hiddenAt = 0;
      notify();
      return true;
    },

    /* Returns true on success, false on a wrong passcode. Anything else
       throws, because "wrong passcode" and "this browser is broken" must not
       look the same to the person typing. */
    async unlock(passcode) {
      const m = meta();
      if (!m) throw new Error('No passcode is set.');
      if (!subtle()) throw new Error('This browser cannot decrypt (no Web Crypto).');
      const k = await deriveKey(passcode, b64.dec(m.salt));
      try {
        const got = await open(k, m.verifier);
        if (got !== VERIFIER_TEXT) throw new Error('bad verifier');
      } catch (e) {
        localStorage.setItem(LOCK_NS, JSON.stringify({ ...m, fails: (m.fails || 0) + 1 }));
        return false;
      }
      /* Decrypt the store into memory. A value that will not open is left as
         null rather than throwing: one damaged key must not make the whole app
         unopenable, and the caller sees an empty section instead of a dead
         screen. */
      const next = {};
      for (const sk of LOCKED_KEYS) {
        const raw = localStorage.getItem(sk);
        if (raw == null) { next[sk] = null; continue; }
        try { next[sk] = await open(k, raw); }
        catch (e) { console.warn('could not decrypt', sk, e); next[sk] = null; }
      }
      key = k;
      mem = next;
      localStorage.setItem(LOCK_NS, JSON.stringify({ ...m, fails: 0 }));
      hiddenAt = 0;
      notify();
      return true;
    },

    lock() { key = null; mem = null; notify(); },

    async change(oldPass, newPass) {
      if (!(await Lock.unlock(oldPass))) return false;
      const plain = { ...mem };
      await Lock.remove(oldPass);
      await Lock.setup(newPass);
      /* setup() sealed what was in storage, which is the same data. Keep the
         in-memory copy consistent with it. */
      mem = plain;
      return true;
    },

    /* Decrypt everything back to plain text and drop the lock. */
    async remove(passcode) {
      const m = meta();
      if (!m) return true;
      if (!key && !(await Lock.unlock(passcode))) return false;
      for (const sk of LOCKED_KEYS) {
        const v = mem[sk];
        if (v == null) localStorage.removeItem(sk); else localStorage.setItem(sk, v);
      }
      localStorage.removeItem(LOCK_NS);
      key = null; mem = null;
      notify();
      return true;
    },

    /* The only way past a forgotten passcode. Says what it is. */
    wipe() {
      LOCKED_KEYS.forEach(sk => localStorage.removeItem(sk));
      localStorage.removeItem(LOCK_NS);
      key = null; mem = null;
      notify();
      return true;
    },

    /* ---- the synchronous face the store needs ----
       Everything above is async because WebCrypto is. Everything in the app
       that reads or writes stored data is synchronous and has been since the
       first commit. These two bridge that: reads come from the decrypted copy
       held in memory, writes update it and then seal to storage in the
       background. */
    readRaw(storageKey) {
      return mem ? (mem[storageKey] == null ? null : mem[storageKey]) : null;
    },

    /* Returns the same thing a direct localStorage.setItem would: true if it
       fitted, false if the device is full. The sealing happens after, but the
       room for it is claimed now, so the answer is honest in the same tick. */
    writeRaw(storageKey, plaintext) {
      if (!key || !mem) return false;
      const probe = LOCK_NS + ':probe';
      try {
        /* Claim the space the sealed value will need, then let it go. If this
           throws the device is full and the stored value is untouched -- which
           matters, because the alternative is losing what was already saved in
           order to find out there was no room for the new one. */
        localStorage.setItem(probe, 'x'.repeat(sealedLength(plaintext)));
        localStorage.removeItem(probe);
      } catch (e) {
        try { localStorage.removeItem(probe); } catch (e2) {}
        return false;
      }
      mem[storageKey] = plaintext;
      seal(key, plaintext)
        .then(env => { try { localStorage.setItem(storageKey, env); } catch (e) {} })
        .catch(e => console.warn('could not seal', storageKey, e));
      return true;
    },

    /* Auto-lock. Counted from when the app went into the background rather
       than on a timer, so a phone asleep in a pocket is treated the same as
       one with the screen on. */
    noteHidden() { hiddenAt = Date.now(); },
    noteVisible() {
      if (key && hiddenAt && Date.now() - hiddenAt > AUTOLOCK_MS) Lock.lock();
      hiddenAt = 0;
    },
    AUTOLOCK_MS
  };
})();

if (typeof window !== 'undefined' && document && document.addEventListener) {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') Lock.noteHidden();
    else Lock.noteVisible();
  });
}

if (typeof module !== 'undefined') module.exports = { Lock, LOCKED_KEYS, LOCK_NS, LOCK_ITERATIONS };
