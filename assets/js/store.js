/* Local persistence. Everything lives in this device's localStorage — there is
   no server, no account, no sync. Export from Settings if you want a backup. */

const NS = 'keypro:';
const K = {
  vehicles: NS + 'vehicles',   // user-added / user-edited vehicle records
  blanks:   NS + 'blanks',     // user-added / user-edited blank records
  jobs:     NS + 'jobs',       // job log
  bcm:      NS + 'bcm',        // Nissan BCM -> PIN lookup rows the user imports
  tips:     NS + 'tips',       // your own tips & tricks, per vehicle per category
  mk:       NS + 'mk',         // saved master-key systems
  prefs:    NS + 'prefs'
};

/* JSON.parse turns a "__proto__" key into a real own property, and code that
   then does obj[k] || (obj[k] = {}) walks straight onto Object.prototype. The
   reviver drops it at the boundary so nothing downstream has to remember. */
const RESERVED = ['__proto__', 'constructor', 'prototype'];
const dropProto = (k, v) => (RESERVED.includes(k) ? undefined : v);

function read(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v, dropProto) : fallback; }
  catch (e) { console.warn('read failed', key, e); return fallback; }
}

/* Any id used as an object key gets checked here. Tips are keyed by vehicle
   id, which arrives from the route, so "__proto__" reached
   all[vehId] || (all[vehId] = {}) and wrote the category onto
   Object.prototype -- giving every object in the app a stray property. No
   real record uses these names, so refusing them costs nothing. */
const safeKey = (k) => {
  const s = String(k == null ? '' : k);
  return (s && !RESERVED.includes(s)) ? s : '';
};
const hasOwn = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
/* Returns false when the write did not happen -- which on a phone means the
   storage quota is full, and which used to be reported to nobody. Every caller
   said "Saved." regardless, so a job logged in a customer's driveway could
   vanish with a confirmation on screen. The boolean is now carried all the way
   out to the UI, and lastError says what to tell the person. */
let lastError = '';
function write(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); lastError = ''; return true; }
  catch (e) {
    const full = e && (e.name === 'QuotaExceededError'
      || e.name === 'NS_ERROR_DOM_QUOTA_REACHED' || e.code === 22 || e.code === 1014);
    lastError = full
      ? "This device's storage is full, so nothing was saved. Export a backup from "
        + 'Settings, then delete old jobs or the BCM table to make room.'
      : 'This device refused to save (' + ((e && e.name) || 'unknown') + '). If you are in '
        + 'a private window, the app cannot store anything.';
    console.warn('write failed', key, e);
    return false;
  }
}

const Store = {
  /* Why the last write failed, for the UI to show. Empty when the last one
     worked. */
  get lastError() { return lastError; },

  /* ---- vehicles ---- */
  overrides() { return read(K.vehicles, {}); },
  /* Seed records merged with user edits. A user record with the same id wins
     outright; a user record with a new id is appended. */
  vehicles() {
    const ov = Store.overrides();
    const merged = SEED_VEHICLES.map(v => (ov[v.id] ? { ...v, ...ov[v.id], id: v.id, custom: true } : v));
    const seedIds = new Set(SEED_VEHICLES.map(v => v.id));
    Object.keys(ov).forEach(id => { if (!seedIds.has(id)) merged.push({ ...ov[id], id, custom: true }); });
    return merged;
  },
  saveVehicle(rec) {
    const ov = Store.overrides();
    ov[rec.id] = rec;
    return write(K.vehicles, ov);
  },
  deleteVehicle(id) {
    const ov = Store.overrides();
    delete ov[id];
    return write(K.vehicles, ov);
  },

  /* ---- blanks ---- */
  blankOverrides() { return read(K.blanks, {}); },
  blanks() {
    const ov = Store.blankOverrides();
    const merged = SEED_BLANKS.map(b => (ov[b.id] ? { ...b, ...ov[b.id], id: b.id, custom: true } : b));
    const seedIds = new Set(SEED_BLANKS.map(b => b.id));
    Object.keys(ov).forEach(id => { if (!seedIds.has(id)) merged.push({ ...ov[id], id, custom: true }); });
    return merged;
  },
  saveBlank(rec) {
    const ov = Store.blankOverrides();
    ov[rec.id] = rec;
    return write(K.blanks, ov);
  },
  deleteBlank(id) {
    const ov = Store.blankOverrides();
    delete ov[id];
    return write(K.blanks, ov);
  },

  /* ---- jobs ---- */
  jobs() { return read(K.jobs, []); },
  saveJob(job) {
    const all = Store.jobs();
    const i = all.findIndex(j => j.id === job.id);
    if (i >= 0) all[i] = job; else all.unshift(job);
    return write(K.jobs, all);
  },
  deleteJob(id) { return write(K.jobs, Store.jobs().filter(j => j.id !== id)); },

  /* ---- Nissan BCM rows ---- */
  bcmRows() { return read(K.bcm, []); },
  setBcmRows(rows) { return write(K.bcm, rows); },

  /* ---- tips & tricks ----
     Shaped { vehicleId: { category: [ {id, text, at} ] } }. These are your notes
     from your own jobs, on this device — nothing is submitted anywhere. */
  allTips() { return read(K.tips, {}); },
  tipsFor(vehId) {
    const all = Store.allTips();
    const id = safeKey(vehId);
    return (id && hasOwn(all, id)) ? all[id] : {};
  },
  addTip(vehId, cat, text) {
    const id = safeKey(vehId), c = safeKey(cat);
    if (!id || !c) return false;
    const all = Store.allTips();
    const veh = hasOwn(all, id) ? all[id] : (all[id] = {});
    const list = hasOwn(veh, c) ? veh[c] : (veh[c] = []);
    list.push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
                text: String(text || '').trim(), at: new Date().toISOString() });
    return write(K.tips, all);
  },
  deleteTip(vehId, cat, tipId) {
    const all = Store.allTips();
    const id = safeKey(vehId), c = safeKey(cat);
    if (!id || !c || !hasOwn(all, id) || !hasOwn(all[id], c)) return false;
    all[id][c] = all[id][c].filter(t => t.id !== tipId);
    if (!all[id][c].length) delete all[id][c];
    if (!Object.keys(all[id]).length) delete all[id];
    return write(K.tips, all);
  },
  /* Counts only what is actually a list. The import refuses a malformed tips
     block now, but this number is read straight off storage, which a person
     can also edit by hand. */
  tipCount() {
    return Object.values(Store.allTips()).reduce((n, veh) =>
      n + (veh && typeof veh === 'object'
        ? Object.values(veh).reduce((m, list) => m + (Array.isArray(list) ? list.length : 0), 0)
        : 0), 0);
  },

  /* ---- master-key systems ----
     A saved system is the inputs, not the output — the schedule regenerates
     from them, so a stored system can never drift from the math. */
  mkSystems() { return read(K.mk, []); },
  saveMkSystem(rec) {
    const all = Store.mkSystems();
    const i = all.findIndex(x => x.id === rec.id);
    if (i >= 0) all[i] = rec; else all.unshift(rec);
    return write(K.mk, all);
  },
  deleteMkSystem(id) { return write(K.mk, Store.mkSystems().filter(x => x.id !== id)); },

  /* ---- prefs ---- */
  /* rate reaches the quote builder as a number. The field is type=number so it
     cannot be typed wrong, but importAll merges whatever a backup file carries,
     and "$85" in there turned every quote into "$NaN" -- on the one screen the
     customer is looking at. Cleaned on the way out, so a bad stored value
     cannot reach the arithmetic however it got there. */
  prefs() {
    const p = read(K.prefs, {}) || {};
    const rate = parseFloat(String(p.rate == null ? '' : p.rate).replace(/[^0-9.\-]/g, ''));
    return { shop: String(p.shop || ''), phone: String(p.phone || ''),
             rate: Number.isFinite(rate) ? String(rate) : '' };
  },
  setPrefs(p) { return write(K.prefs, p); },

  /* ---- backup ---- */
  exportAll() {
    return {
      app: 'keypro-field', schema: 1, exportedAt: new Date().toISOString(),
      vehicles: Store.overrides(), blanks: Store.blankOverrides(),
      jobs: Store.jobs(), bcm: Store.bcmRows(), tips: Store.allTips(),
      mk: Store.mkSystems(), prefs: Store.prefs()
    };
  },
  /* Returns false if any part of the restore did not fit. A half-restored
     backup reported as a success is the worst of both. */
  importAll(obj, mode) {
    if (!obj || obj.app !== 'keypro-field') throw new Error('Not a KeyPro backup file.');
    /* Check the shape of every section before touching storage. In replace
       mode the writes are destructive, so a truncated or hand-edited backup
       used to wipe what was there and report success -- on the only backup
       mechanism the app has. A string where the vehicle map should be was
       spread into numbered keys and counted as a record. */
    const isPlain = (v) => v && typeof v === 'object' && !Array.isArray(v);
    const shape = { vehicles: isPlain, blanks: isPlain, tips: isPlain, prefs: isPlain,
                    jobs: Array.isArray, bcm: Array.isArray, mk: Array.isArray };
    const wrong = Object.keys(shape)
      .filter(k => obj[k] != null && !shape[k](obj[k]));
    /* tips nests two levels deep, so the top-level check does not reach the
       lists. A category holding a string instead of an array counted its
       characters as tips. */
    if (isPlain(obj.tips) && Object.values(obj.tips).some(
          cats => !isPlain(cats) || Object.values(cats).some(l => !Array.isArray(l)))) {
      wrong.push('tips');
    }
    if (wrong.length) {
      throw new Error('That backup is damaged — ' + wrong.join(', ')
        + (wrong.length === 1 ? ' is' : ' are') + ' not the right shape. Nothing was changed.');
    }
    let ok = true;
    if (mode === 'replace') {
      ok = write(K.vehicles, obj.vehicles || {}) && ok;
      ok = write(K.blanks, obj.blanks || {}) && ok;
      ok = write(K.jobs, obj.jobs || []) && ok;
      ok = write(K.bcm, obj.bcm || []) && ok;
      ok = write(K.tips, obj.tips || {}) && ok;
      ok = write(K.mk, obj.mk || []) && ok;
    } else {
      ok = write(K.vehicles, { ...Store.overrides(), ...(obj.vehicles || {}) }) && ok;
      ok = write(K.blanks, { ...Store.blankOverrides(), ...(obj.blanks || {}) }) && ok;
      const seen = new Set(Store.jobs().map(j => j.id));
      ok = write(K.jobs, Store.jobs().concat((obj.jobs || []).filter(j => !seen.has(j.id)))) && ok;
      const key = r => `${r.bcm}`.toUpperCase();
      const have = new Set(Store.bcmRows().map(key));
      ok = write(K.bcm, Store.bcmRows().concat((obj.bcm || []).filter(r => !have.has(key(r))))) && ok;
      /* Tips merge per vehicle per category, skipping ids already present. */
      const tips = Store.allTips();
      Object.entries(obj.tips || {}).forEach(([vid, cats]) => {
        const id = safeKey(vid);
        if (!id) return;
        const mine = hasOwn(tips, id) ? tips[id] : (tips[id] = {});
        Object.entries(cats).forEach(([cat, list]) => {
          const c = safeKey(cat);
          if (!c || !Array.isArray(list)) return;
          const seenIds = new Set((mine[c] || []).map(t => t.id));
          mine[c] = (mine[c] || []).concat(list.filter(t => t && !seenIds.has(t.id)));
        });
      });
      ok = write(K.tips, tips) && ok;
      const haveMk = new Set(Store.mkSystems().map(m => m.id));
      ok = write(K.mk, Store.mkSystems().concat((obj.mk || []).filter(m => !haveMk.has(m.id)))) && ok;
    }
    if (obj.prefs) ok = Store.setPrefs({ ...Store.prefs(), ...obj.prefs }) && ok;
    return ok;
  }
};
