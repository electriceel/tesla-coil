/* Local persistence. Everything lives in this device's localStorage — there is
   no server, no account, no sync. Export from Settings if you want a backup. */

const NS = 'keypro:';
const K = {
  vehicles: NS + 'vehicles',   // user-added / user-edited vehicle records
  jobs:     NS + 'jobs',       // job log
  bcm:      NS + 'bcm',        // Nissan BCM -> PIN lookup rows the user imports
  prefs:    NS + 'prefs'
};

function read(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
  catch (e) { console.warn('read failed', key, e); return fallback; }
}
function write(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); return true; }
  catch (e) { console.warn('write failed', key, e); return false; }
}

const Store = {
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

  /* ---- prefs ---- */
  prefs() { return read(K.prefs, { shop: '', phone: '', rate: '' }); },
  setPrefs(p) { return write(K.prefs, p); },

  /* ---- backup ---- */
  exportAll() {
    return {
      app: 'keypro-field', schema: 1, exportedAt: new Date().toISOString(),
      vehicles: Store.overrides(), jobs: Store.jobs(), bcm: Store.bcmRows(), prefs: Store.prefs()
    };
  },
  importAll(obj, mode) {
    if (!obj || obj.app !== 'keypro-field') throw new Error('Not a KeyPro backup file.');
    if (mode === 'replace') {
      write(K.vehicles, obj.vehicles || {});
      write(K.jobs, obj.jobs || []);
      write(K.bcm, obj.bcm || []);
    } else {
      write(K.vehicles, { ...Store.overrides(), ...(obj.vehicles || {}) });
      const seen = new Set(Store.jobs().map(j => j.id));
      write(K.jobs, Store.jobs().concat((obj.jobs || []).filter(j => !seen.has(j.id))));
      const key = r => `${r.bcm}`.toUpperCase();
      const have = new Set(Store.bcmRows().map(key));
      write(K.bcm, Store.bcmRows().concat((obj.bcm || []).filter(r => !have.has(key(r)))));
    }
    if (obj.prefs) Store.setPrefs({ ...Store.prefs(), ...obj.prefs });
  }
};
