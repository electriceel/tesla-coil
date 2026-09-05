/* Local persistence. Everything lives in this device's localStorage — there is
   no server, no account, no sync. Export from Settings if you want a backup. */

const NS = 'keypro:';
const K = {
  vehicles: NS + 'vehicles',   // user-added / user-edited vehicle records
  blanks:   NS + 'blanks',     // user-added / user-edited blank records
  jobs:     NS + 'jobs',       // job log
  bcm:      NS + 'bcm',        // Nissan BCM -> PIN lookup rows the user imports
  tips:     NS + 'tips',       // your own tips & tricks, per vehicle per category
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
  tipsFor(vehId) { return Store.allTips()[vehId] || {}; },
  addTip(vehId, cat, text) {
    const all = Store.allTips();
    const veh = all[vehId] || (all[vehId] = {});
    const list = veh[cat] || (veh[cat] = []);
    list.push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
                text: String(text || '').trim(), at: new Date().toISOString() });
    write(K.tips, all);
  },
  deleteTip(vehId, cat, tipId) {
    const all = Store.allTips();
    if (!all[vehId] || !all[vehId][cat]) return;
    all[vehId][cat] = all[vehId][cat].filter(t => t.id !== tipId);
    if (!all[vehId][cat].length) delete all[vehId][cat];
    if (!Object.keys(all[vehId]).length) delete all[vehId];
    write(K.tips, all);
  },
  tipCount() {
    return Object.values(Store.allTips())
      .reduce((n, veh) => n + Object.values(veh).reduce((m, list) => m + list.length, 0), 0);
  },

  /* ---- prefs ---- */
  prefs() { return read(K.prefs, { shop: '', phone: '', rate: '' }); },
  setPrefs(p) { return write(K.prefs, p); },

  /* ---- backup ---- */
  exportAll() {
    return {
      app: 'keypro-field', schema: 1, exportedAt: new Date().toISOString(),
      vehicles: Store.overrides(), blanks: Store.blankOverrides(),
      jobs: Store.jobs(), bcm: Store.bcmRows(), tips: Store.allTips(), prefs: Store.prefs()
    };
  },
  importAll(obj, mode) {
    if (!obj || obj.app !== 'keypro-field') throw new Error('Not a KeyPro backup file.');
    if (mode === 'replace') {
      write(K.vehicles, obj.vehicles || {});
      write(K.blanks, obj.blanks || {});
      write(K.jobs, obj.jobs || []);
      write(K.bcm, obj.bcm || []);
      write(K.tips, obj.tips || {});
    } else {
      write(K.vehicles, { ...Store.overrides(), ...(obj.vehicles || {}) });
      write(K.blanks, { ...Store.blankOverrides(), ...(obj.blanks || {}) });
      const seen = new Set(Store.jobs().map(j => j.id));
      write(K.jobs, Store.jobs().concat((obj.jobs || []).filter(j => !seen.has(j.id))));
      const key = r => `${r.bcm}`.toUpperCase();
      const have = new Set(Store.bcmRows().map(key));
      write(K.bcm, Store.bcmRows().concat((obj.bcm || []).filter(r => !have.has(key(r)))));
      /* Tips merge per vehicle per category, skipping ids already present. */
      const tips = Store.allTips();
      Object.entries(obj.tips || {}).forEach(([vid, cats]) => {
        const mine = tips[vid] || (tips[vid] = {});
        Object.entries(cats).forEach(([cat, list]) => {
          const seenIds = new Set((mine[cat] || []).map(t => t.id));
          mine[cat] = (mine[cat] || []).concat(list.filter(t => !seenIds.has(t.id)));
        });
      });
      write(K.tips, tips);
    }
    if (obj.prefs) Store.setPrefs({ ...Store.prefs(), ...obj.prefs });
  }
};
