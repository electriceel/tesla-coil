/* KeyPro Field — UI + routing. No framework, no build step, no network needed. */

const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const nz = (v, alt = '—') => (v && String(v).trim()) ? v : alt;

/* ======================= routing ======================= */
const VIEWS = ['lookup', 'vehicle', 'vin', 'blanks', 'tools', 'jobs', 'settings'];
let current = 'lookup';

function go(view, arg) {
  if (!VIEWS.includes(view)) view = 'lookup';
  current = view;
  $$('.view').forEach(v => v.classList.toggle('active', v.id === 'view-' + view));
  $$('.nav button').forEach(b => b.classList.toggle('on', b.dataset.go === view));
  const r = RENDER[view];
  if (r) r(arg);
  window.scrollTo(0, 0);
  const hash = arg ? `#${view}/${encodeURIComponent(arg)}` : `#${view}`;
  if (location.hash !== hash) history.replaceState(null, '', hash);
}

function routeFromHash() {
  const [v, a] = location.hash.replace(/^#/, '').split('/');
  go(v || 'lookup', a ? decodeURIComponent(a) : undefined);
}

/* ======================= lookup ======================= */
const filter = { make: '', year: '', q: '' };

function allMakes() {
  return Array.from(new Set(Store.vehicles().map(v => v.make))).sort();
}

function matchVehicles() {
  const q = filter.q.trim().toLowerCase();
  const yr = parseInt(filter.year, 10);
  return Store.vehicles().filter(v => {
    if (filter.make && v.make !== filter.make) return false;
    if (yr && !(yr >= v.yearStart && yr <= v.yearEnd)) return false;
    if (q) {
      const hay = [
        v.make, v.model, v.blanks && v.blanks.keyway, v.blanks && v.blanks.ilco,
        v.blanks && v.blanks.oem, v.transponder && v.transponder.chip,
        (v.remotes || []).map(r => `${r.fcc} ${r.pn}`).join(' ')
      ].join(' ').toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  }).sort((a, b) => (a.make + a.model).localeCompare(b.make + b.model) || b.yearStart - a.yearStart);
}

function RENDER_lookup() {
  const years = [];
  const thisYear = new Date().getFullYear() + 1;
  for (let y = thisYear; y >= 1990; y--) years.push(y);

  $('#makeChips').innerHTML = ['<button class="chip' + (filter.make ? '' : ' on') + '" data-make="">All makes</button>']
    .concat(allMakes().map(m => `<button class="chip${filter.make === m ? ' on' : ''}" data-make="${esc(m)}">${esc(m)}</button>`))
    .join('');

  const sel = $('#yearSel');
  if (sel.options.length <= 1) {
    sel.innerHTML = '<option value="">Any year</option>' + years.map(y => `<option value="${y}">${y}</option>`).join('');
  }
  sel.value = filter.year;
  $('#lookupQ').value = filter.q;

  const hits = matchVehicles();
  $('#lookupCount').textContent = hits.length ? `${hits.length} match${hits.length === 1 ? '' : 'es'}` : '';
  $('#lookupResults').innerHTML = hits.length ? hits.map(v => `
    <div class="card tap vres" data-vid="${esc(v.id)}">
      <div style="flex:1;min-width:0">
        <div class="yr">${v.yearStart}${v.yearEnd !== v.yearStart ? '–' + v.yearEnd : ''}${v.custom ? ' &middot; YOURS' : ''}</div>
        <div class="nm">${esc(v.make)} ${esc(v.model)}</div>
        <div class="sub">${esc(nz(v.blanks && v.blanks.keyway))} &middot; ${esc(nz(v.transponder && v.transponder.chip))}</div>
      </div>
      <div class="go">&rsaquo;</div>
    </div>`).join('')
    : `<div class="empty">No match in your database.<br><br>
       <button class="btn btn-sm" data-newveh="1">Add this vehicle</button></div>`;
};

/* ======================= vehicle detail ======================= */
function RENDER_vehicle(id) {
  const v = Store.vehicles().find(x => x.id === id);
  const host = $('#vehicleBody');
  if (!v) { host.innerHTML = '<div class="empty">Vehicle not found.</div>'; return; }

  const r = v.remotes || [];
  const b = v.blanks || {}, t = v.transponder || {}, l = v.lock || {}, p = v.programming || {};

  host.innerHTML = `
    <div class="card">
      <div class="yr tiny muted">${v.yearStart}${v.yearEnd !== v.yearStart ? '&ndash;' + v.yearEnd : ''}</div>
      <div style="font-size:20px;font-weight:700;margin:2px 0 8px">${esc(v.make)} ${esc(v.model)}</div>
      <div class="chips">
        ${v.custom ? '<span class="badge info">Your record</span>' : ''}
        <span class="badge ${v.verified ? 'ok' : 'warn'}">${v.verified ? 'Verified by you' : 'Unverified seed data'}</span>
        ${p.pinRequired && /yes/i.test(p.pinRequired) ? '<span class="badge err">PIN required</span>' : ''}
      </div>
    </div>

    ${v.verified ? '' : `<div class="notice warn"><strong>Verify before you cut.</strong>
      This came with the app as starter data. Confirm the blank and chip against the vehicle or
      your machine's database, then mark it verified in Edit so it stops nagging you.</div>`}

    <h2>Key blank</h2>
    <div class="card"><dl class="spec">
      <dt>Keyway</dt><dd class="mono">${esc(nz(b.keyway))}</dd>
      <dt>Ilco</dt><dd class="mono">${esc(nz(b.ilco))}</dd>
      <dt>Silca</dt><dd class="mono">${esc(nz(b.silca))}</dd>
      <dt>JMA</dt><dd class="mono">${esc(nz(b.jma))}</dd>
      <dt>OEM P/N</dt><dd class="mono">${esc(nz(b.oem))}</dd>
    </dl></div>

    <h2>Transponder</h2>
    <div class="card"><dl class="spec">
      <dt>Chip</dt><dd>${esc(nz(t.chip))}</dd>
      <dt>System</dt><dd>${esc(nz(t.system))}</dd>
      <dt>Cloneable</dt><dd>${esc(nz(t.cloneable))}</dd>
    </dl></div>

    <h2>Remotes / fobs</h2>
    ${r.length ? r.map(x => `<div class="card"><dl class="spec">
      <dt>Type</dt><dd>${esc(nz(x.type))}</dd>
      <dt>FCC ID</dt><dd class="mono">${esc(nz(x.fcc))}</dd>
      <dt>Part no.</dt><dd class="mono">${esc(nz(x.pn))}</dd>
      <dt>Buttons</dt><dd>${esc(nz(x.buttons))}</dd>
    </dl></div>`).join('') : '<div class="card muted tiny">No fob data on file.</div>'}

    <h2>Lock &amp; cutting</h2>
    <div class="card"><dl class="spec">
      <dt>Code series</dt><dd>${esc(nz(l.codeSeries))}</dd>
      <dt>Spaces</dt><dd>${esc(nz(l.spaces))}</dd>
      <dt>Depths</dt><dd>${esc(nz(l.depths))}</dd>
      <dt>Cut type</dt><dd>${esc(nz(l.cutMethod))}</dd>
      <dt>Decode</dt><dd>${esc(nz(l.decode))}</dd>
    </dl></div>

    <h2>Programming</h2>
    <div class="card"><dl class="spec">
      <dt>OBD</dt><dd>${esc(nz(p.obd))}</dd>
      <dt>Onboard</dt><dd>${esc(nz(p.onboard))}</dd>
      <dt>All keys lost</dt><dd>${esc(nz(p.allKeysLost))}</dd>
      <dt>PIN</dt><dd>${esc(nz(p.pinRequired))}</dd>
      ${p.notes ? `<dt>Notes</dt><dd>${esc(p.notes)}</dd>` : ''}
    </dl></div>

    <h2>On the vehicle</h2>
    <div class="card"><dl class="spec">
      <dt>OBD port</dt><dd>${esc(nz(v.obdPort))}</dd>
      <dt>Entry</dt><dd>${esc(nz(v.doorUnlock))}</dd>
      ${v.notes ? `<dt>Notes</dt><dd>${esc(v.notes)}</dd>` : ''}
    </dl></div>

    <div class="stack" style="margin-top:16px">
      <button class="btn" data-editveh="${esc(v.id)}">Edit this record</button>
      <button class="btn" data-jobfrom="${esc(v.id)}">Start a job for this vehicle</button>
      ${v.custom && !SEED_VEHICLES.some(s => s.id === v.id)
        ? `<button class="btn danger" data-delveh="${esc(v.id)}">Delete this record</button>` : ''}
    </div>`;
};

/* ---- vehicle editor (same view, swapped body) ---- */
function editVehicle(id) {
  const blank = {
    id: '', make: '', model: '', yearStart: '', yearEnd: '', body: 'car',
    blanks: {}, transponder: {}, remotes: [{}], lock: {}, programming: {},
    obdPort: '', doorUnlock: '', notes: '', verified: true
  };
  const v = id ? (Store.vehicles().find(x => x.id === id) || blank) : blank;
  const b = v.blanks || {}, t = v.transponder || {}, l = v.lock || {}, p = v.programming || {};
  const r0 = (v.remotes && v.remotes[0]) || {};
  const F = (name, label, val, ph = '') =>
    `<div class="field"><label>${label}</label><input name="${name}" value="${esc(val || '')}" placeholder="${esc(ph)}"></div>`;

  $('#vehicleBody').innerHTML = `
    <div class="notice info">Anything you save here lives on this device only. Export a backup from Settings.</div>
    <form id="vehForm">
      <h2>Vehicle</h2>
      <div class="card">
        <div class="row">${F('make', 'Make', v.make, 'Toyota')}${F('model', 'Model', v.model, 'Camry')}</div>
        <div class="row">${F('yearStart', 'Year from', v.yearStart, '2012')}${F('yearEnd', 'Year to', v.yearEnd, '2017')}</div>
      </div>
      <h2>Key blank</h2>
      <div class="card">
        ${F('keyway', 'Keyway', b.keyway, 'TOY48')}
        <div class="row">${F('ilco', 'Ilco', b.ilco)}${F('silca', 'Silca', b.silca)}</div>
        <div class="row">${F('jma', 'JMA', b.jma)}${F('oem', 'OEM part no.', b.oem)}</div>
      </div>
      <h2>Transponder</h2>
      <div class="card">
        ${F('chip', 'Chip', t.chip, 'ID47 / Hitag3')}
        ${F('system', 'System', t.system)}
        ${F('cloneable', 'Cloneable?', t.cloneable)}
      </div>
      <h2>Remote</h2>
      <div class="card">
        <div class="row">${F('rtype', 'Type', r0.type, 'prox')}${F('rbuttons', 'Buttons', r0.buttons, '4B')}</div>
        <div class="row">${F('rfcc', 'FCC ID', r0.fcc)}${F('rpn', 'Part no.', r0.pn)}</div>
      </div>
      <h2>Lock &amp; cutting</h2>
      <div class="card">
        ${F('codeSeries', 'Code series', l.codeSeries)}
        <div class="row">${F('spaces', 'Spaces', l.spaces)}${F('depths', 'Depths', l.depths)}</div>
        ${F('cutMethod', 'Cut type', l.cutMethod)}
        ${F('decode', 'Decode method', l.decode)}
      </div>
      <h2>Programming</h2>
      <div class="card">
        ${F('obd', 'OBD', p.obd)}
        ${F('onboard', 'Onboard procedure', p.onboard)}
        ${F('allKeysLost', 'All keys lost', p.allKeysLost)}
        ${F('pinRequired', 'PIN required', p.pinRequired)}
        <div class="field"><label>Programming notes</label><textarea name="pnotes">${esc(p.notes || '')}</textarea></div>
      </div>
      <h2>On the vehicle</h2>
      <div class="card">
        ${F('obdPort', 'OBD port location', v.obdPort)}
        <div class="field"><label>Entry / unlock</label><textarea name="doorUnlock">${esc(v.doorUnlock || '')}</textarea></div>
        <div class="field"><label>Your notes</label><textarea name="notes">${esc(v.notes || '')}</textarea></div>
      </div>
      <div class="stack" style="margin-top:16px">
        <button type="submit" class="btn primary">Save record</button>
        <button type="button" class="btn ghost" data-canceledit="${esc(id || '')}">Cancel</button>
      </div>
    </form>`;

  $('#vehForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.target).entries());
    if (!f.make.trim() || !f.model.trim()) { alert('Make and model are required.'); return; }
    const rec = {
      id: id || `${f.make}-${f.model}-${f.yearStart || 'x'}`.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      make: f.make.trim(), model: f.model.trim(),
      yearStart: parseInt(f.yearStart, 10) || 1990,
      yearEnd: parseInt(f.yearEnd, 10) || parseInt(f.yearStart, 10) || new Date().getFullYear(),
      body: v.body || 'car',
      blanks: { keyway: f.keyway, ilco: f.ilco, silca: f.silca, jma: f.jma, oem: f.oem },
      transponder: { chip: f.chip, system: f.system, cloneable: f.cloneable },
      remotes: (f.rfcc || f.rpn || f.rtype || f.rbuttons)
        ? [{ type: f.rtype, fcc: f.rfcc, pn: f.rpn, buttons: f.rbuttons }] : (v.remotes || []),
      lock: { codeSeries: f.codeSeries, spaces: f.spaces, depths: f.depths, cutMethod: f.cutMethod, decode: f.decode },
      programming: { obd: f.obd, onboard: f.onboard, allKeysLost: f.allKeysLost, pinRequired: f.pinRequired, notes: f.pnotes },
      obdPort: f.obdPort, doorUnlock: f.doorUnlock, notes: f.notes,
      verified: true
    };
    Store.saveVehicle(rec);
    go('vehicle', rec.id);
  });
}

/* ======================= VIN ======================= */
function RENDER_vin() { /* static markup; results render on submit */ };

function runVinDecode() {
  const raw = $('#vinInput').value;
  const out = $('#vinOut');
  const d = decodeVin(raw);

  if (d.vin.length !== 17) {
    out.innerHTML = `<div class="notice err">${esc(d.issues[0] || 'Enter a 17-character VIN.')}</div>`;
    return;
  }

  out.innerHTML = `
    ${d.checkDigitOk
      ? '<div class="notice ok"><strong>Check digit passes.</strong> The VIN is internally consistent.</div>'
      : `<div class="notice warn"><strong>Check digit does not match.</strong> ${esc(d.issues.join(' '))}</div>`}
    <div class="card"><dl class="spec">
      <dt>VIN</dt><dd class="mono">${esc(d.vin)}</dd>
      <dt>WMI</dt><dd class="mono">${esc(d.wmi)} &mdash; ${esc(d.manufacturer)}</dd>
      <dt>Model year</dt><dd>${d.modelYear ? esc(d.modelYear) + `<span class="muted tiny"> (or ${esc(d.modelYearAlt)} on a 30-year rollover)</span>` : '&mdash;'}</dd>
      <dt>Plant</dt><dd class="mono">${esc(d.plant)}</dd>
      <dt>Serial</dt><dd class="mono">${esc(d.serial)}</dd>
    </dl></div>
    <button class="btn" id="vinOnline">Look up full spec (NHTSA, needs signal)</button>
    <div id="vinOnlineOut"></div>
    <div id="vinMatches"></div>`;

  $('#vinOnline').addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    btn.disabled = true; btn.textContent = 'Asking NHTSA...';
    try {
      const o = await decodeVinOnline(d.vin);
      $('#vinOnlineOut').innerHTML = `<div class="card"><dl class="spec">
        <dt>Make</dt><dd>${esc(nz(o.make))}</dd>
        <dt>Model</dt><dd>${esc(nz(o.model))}</dd>
        <dt>Year</dt><dd>${esc(nz(o.year))}</dd>
        <dt>Trim</dt><dd>${esc(nz([o.series, o.trim].filter(Boolean).join(' ')))}</dd>
        <dt>Body</dt><dd>${esc(nz(o.bodyClass))}</dd>
        <dt>Engine</dt><dd>${esc(nz(o.engine))}</dd>
        <dt>Keyless</dt><dd>${esc(nz(o.keylessIgnition))}</dd>
        <dt>Built at</dt><dd>${esc(nz(o.plant))}</dd>
      </dl></div>`;
      btn.textContent = 'Refresh from NHTSA';
      showVinMatches(o.make, o.model, parseInt(o.year, 10));
    } catch (err) {
      $('#vinOnlineOut').innerHTML = `<div class="notice warn">No answer from NHTSA (${esc(err.message)}). Offline decode above still stands.</div>`;
      btn.textContent = 'Try again';
    }
    btn.disabled = false;
  });

  if (d.modelYear) showVinMatches(guessMakeFromWmi(d.manufacturer), '', d.modelYear);
};

function guessMakeFromWmi(label) {
  return (label || '').split('(')[0].trim().replace(/ (Truck|SUV|Motorcycle|Commercial|M)$/i, '');
}

function showVinMatches(make, model, year) {
  const host = $('#vinMatches');
  if (!host) return;
  const mk = (make || '').toLowerCase();
  const md = (model || '').toLowerCase();
  const hits = Store.vehicles().filter(v => {
    if (year && !(year >= v.yearStart && year <= v.yearEnd)) return false;
    if (mk && !v.make.toLowerCase().includes(mk) && !mk.includes(v.make.toLowerCase())) return false;
    if (md && !v.model.toLowerCase().includes(md) && !md.includes(v.model.toLowerCase())) return false;
    return true;
  }).slice(0, 12);
  host.innerHTML = hits.length
    ? `<h2>Matches in your database</h2>` + hits.map(v => `
      <div class="card tap vres" data-vid="${esc(v.id)}">
        <div style="flex:1;min-width:0">
          <div class="yr">${v.yearStart}&ndash;${v.yearEnd}</div>
          <div class="nm">${esc(v.make)} ${esc(v.model)}</div>
          <div class="sub">${esc(nz(v.blanks && v.blanks.keyway))} &middot; ${esc(nz(v.transponder && v.transponder.chip))}</div>
        </div><div class="go">&rsaquo;</div>
      </div>`).join('')
    : `<h2>Matches in your database</h2><div class="card muted tiny">Nothing on file for this one yet.</div>`;
}

/* ======================= blank cross-reference ======================= */
function RENDER_blanks() {
  const q = ($('#blankQ').value || '').trim().toLowerCase();
  const rows = SEED_BLANKS.filter(r =>
    !q || [r.keyway, r.ilco, r.silca, r.jma, r.strattec, r.makes].join(' ').toLowerCase().includes(q));
  $('#blankTable').innerHTML = rows.length ? `
    <div class="scroll-x"><table>
      <thead><tr><th>Keyway</th><th>Ilco</th><th>Silca</th><th>JMA</th><th>Strattec</th><th>Cut</th><th>Used on</th></tr></thead>
      <tbody>${rows.map(r => `<tr>
        <td class="mono"><strong>${esc(r.keyway)}</strong></td>
        <td class="mono">${esc(r.ilco)}</td><td class="mono">${esc(r.silca)}</td>
        <td class="mono">${esc(r.jma)}</td><td class="mono">${esc(r.strattec)}</td>
        <td>${esc(r.cut)}</td><td class="muted">${esc(r.makes)}</td></tr>`).join('')}
      </tbody></table></div>`
    : '<div class="empty">No blank matches that.</div>';
};

/* ======================= tools ======================= */
function RENDER_tools() {
  const rows = Store.bcmRows();
  $('#bcmCount').textContent = rows.length
    ? `${rows.length} row${rows.length === 1 ? '' : 's'} loaded`
    : 'No conversion table loaded';
};

function bcmLookup() {
  const code = ($('#bcmInput').value || '').trim().toUpperCase().replace(/\s+/g, '');
  const out = $('#bcmOut');
  if (!code) { out.innerHTML = ''; return; }
  const rows = Store.bcmRows();
  if (!rows.length) {
    out.innerHTML = `<div class="notice warn">No conversion table loaded. Import the BCM&rarr;PIN list your
      code service or supplier gives you (CSV: <span class="mono">bcm,pin</span>) using the button below.
      The app will not invent a PIN for you &mdash; a wrong PIN burns an attempt on the BCM.</div>`;
    return;
  }
  const hit = rows.find(r => String(r.bcm).toUpperCase().replace(/\s+/g, '') === code);
  out.innerHTML = hit
    ? `<div class="notice ok"><div class="tiny">BCM ${esc(code)}</div>
       <div style="font-size:30px;font-weight:700;letter-spacing:5px" class="mono">${esc(hit.pin)}</div>
       ${hit.note ? `<div class="tiny">${esc(hit.note)}</div>` : ''}</div>`
    : `<div class="notice err">BCM code <span class="mono">${esc(code)}</span> is not in your table.
       Check the label on the BCM again &mdash; the code is usually four characters after the dash.</div>`;
}

function importBcmCsv(text, append) {
  const rows = [];
  text.split(/\r?\n/).forEach(line => {
    const t = line.trim();
    if (!t || /^bcm\b/i.test(t)) return;
    const p = t.split(/[,;\t]/).map(s => s.trim());
    if (p.length >= 2 && p[0] && p[1]) rows.push({ bcm: p[0].toUpperCase(), pin: p[1], note: p[2] || '' });
  });
  if (!rows.length) throw new Error('Found no "bcm,pin" rows in that file.');
  const merged = append ? Store.bcmRows().slice() : [];
  const have = new Set(merged.map(r => r.bcm));
  rows.forEach(r => { if (!have.has(r.bcm)) { merged.push(r); have.add(r.bcm); } });
  Store.setBcmRows(merged);
  return rows.length;
}

/* --- small field calculators --- */
function runHexDec() {
  const v = ($('#hexIn').value || '').trim();
  if (!v) { $('#hexOut').innerHTML = ''; return; }
  const asHex = parseInt(v.replace(/^0x/i, ''), 16);
  const asDec = parseInt(v, 10);
  $('#hexOut').innerHTML = `<div class="card"><dl class="spec">
    <dt>As hex</dt><dd class="mono">${Number.isNaN(asHex) ? '&mdash;' : asHex + ' dec'}</dd>
    <dt>As decimal</dt><dd class="mono">${Number.isNaN(asDec) ? '&mdash;' : asDec.toString(16).toUpperCase() + ' hex'}</dd>
    <dt>Binary</dt><dd class="mono">${Number.isNaN(asHex) ? '&mdash;' : asHex.toString(2)}</dd>
  </dl></div>`;
}

function runQuote() {
  const p = Store.prefs();
  const base = parseFloat($('#qBase').value || '0');
  const keys = parseInt($('#qKeys').value || '1', 10);
  const per = parseFloat($('#qPer').value || '0');
  const prog = parseFloat($('#qProg').value || '0');
  const trip = parseFloat($('#qTrip').value || p.rate || '0');
  const total = base + (keys * per) + prog + trip;
  $('#qOut').innerHTML = `<div class="notice ok">
    <div class="tiny">Service ${base.toFixed(2)} + ${keys} key(s) @ ${per.toFixed(2)} + programming ${prog.toFixed(2)} + trip ${trip.toFixed(2)}</div>
    <div style="font-size:30px;font-weight:700">$${total.toFixed(2)}</div></div>`;
}

/* ======================= jobs ======================= */
function RENDER_jobs() {
  const jobs = Store.jobs();
  $('#jobList').innerHTML = jobs.length ? jobs.map(j => `
    <div class="card tap" data-editjob="${esc(j.id)}">
      <div style="display:flex;gap:10px;align-items:baseline">
        <div style="flex:1;min-width:0">
          <div class="tiny muted">${esc(j.date)} &middot; ${esc(nz(j.status, 'open'))}</div>
          <div style="font-weight:700">${esc(nz(j.customer, 'No name'))}</div>
          <div class="tiny muted">${esc(nz(j.vehicle))} &mdash; ${esc(nz(j.service))}</div>
        </div>
        <div class="mono" style="font-weight:700">${j.price ? '$' + Number(j.price).toFixed(2) : ''}</div>
      </div>
    </div>`).join('')
    : '<div class="empty">No jobs logged yet.</div>';

  const total = jobs.filter(j => j.status === 'paid').reduce((s, j) => s + (Number(j.price) || 0), 0);
  $('#jobTotals').textContent = jobs.length ? `${jobs.length} job(s) · $${total.toFixed(2)} collected` : '';
};

function editJob(id, prefillVehicle) {
  const j = id ? (Store.jobs().find(x => x.id === id) || {}) : {};
  const v = prefillVehicle ? Store.vehicles().find(x => x.id === prefillVehicle) : null;
  const vehText = j.vehicle || (v ? `${v.yearStart}-${v.yearEnd} ${v.make} ${v.model}` : '');
  $('#jobEditor').innerHTML = `
    <form id="jobForm" class="card">
      <div class="field"><label>Date</label><input name="date" type="date" value="${esc(j.date || new Date().toISOString().slice(0, 10))}"></div>
      <div class="row">
        <div class="field"><label>Customer</label><input name="customer" value="${esc(j.customer || '')}"></div>
        <div class="field"><label>Phone</label><input name="phone" type="tel" value="${esc(j.phone || '')}"></div>
      </div>
      <div class="field"><label>Vehicle</label><input name="vehicle" value="${esc(vehText)}"></div>
      <div class="field"><label>Service</label><input name="service" value="${esc(j.service || '')}" placeholder="AKL, duplicate, lockout, ignition"></div>
      <div class="row">
        <div class="field"><label>Keys made</label><input name="keys" type="number" inputmode="numeric" value="${esc(j.keys || '')}"></div>
        <div class="field"><label>Price</label><input name="price" type="number" inputmode="decimal" step="0.01" value="${esc(j.price || '')}"></div>
      </div>
      <div class="field"><label>Status</label><select name="status">
        ${['open', 'done', 'paid'].map(s => `<option value="${s}"${j.status === s ? ' selected' : ''}>${s}</option>`).join('')}
      </select></div>
      <div class="field"><label>Notes</label><textarea name="notes">${esc(j.notes || '')}</textarea></div>
      <div class="stack">
        <button type="submit" class="btn primary">Save job</button>
        ${id ? `<button type="button" class="btn danger" data-deljob="${esc(id)}">Delete job</button>` : ''}
        <button type="button" class="btn ghost" data-canceljob="1">Cancel</button>
      </div>
    </form>`;
  $('#jobListWrap').hidden = true;
  $('#jobForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.target).entries());
    Store.saveJob({ id: id || uid(), ...f });
    $('#jobEditor').innerHTML = '';
    $('#jobListWrap').hidden = false;
    RENDER_jobs();
  });
}

function jobsCsv() {
  const cols = ['date', 'customer', 'phone', 'vehicle', 'service', 'keys', 'price', 'status', 'notes'];
  const q = s => `"${String(s == null ? '' : s).replace(/"/g, '""')}"`;
  return [cols.join(',')].concat(Store.jobs().map(j => cols.map(c => q(j[c])).join(','))).join('\n');
}

/* ======================= settings ======================= */
function RENDER_settings() {
  const p = Store.prefs();
  $('#setShop').value = p.shop || '';
  $('#setPhone').value = p.phone || '';
  $('#setRate').value = p.rate || '';
  const ov = Object.keys(Store.overrides()).length;
  $('#setStats').innerHTML = `<dl class="spec">
    <dt>Seed data</dt><dd>${SEED_VEHICLES.length} vehicles &middot; ${SEED_BLANKS.length} blanks &middot; v${esc(SEED_VERSION)}</dd>
    <dt>Your edits</dt><dd>${ov} vehicle record(s)</dd>
    <dt>Jobs</dt><dd>${Store.jobs().length}</dd>
    <dt>BCM rows</dt><dd>${Store.bcmRows().length}</dd>
  </dl>`;
};

function download(name, text, mime) {
  const blob = new Blob([text], { type: mime || 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}

function pickFile(accept) {
  return new Promise((resolve) => {
    const i = document.createElement('input');
    i.type = 'file'; i.accept = accept;
    i.onchange = () => { const f = i.files && i.files[0]; if (f) f.text().then(resolve); };
    i.click();
  });
}

/* ======================= wiring ======================= */
const RENDER = {
  lookup: (...a) => RENDER_lookup(...a),
  vehicle: (...a) => RENDER_vehicle(...a),
  vin: (...a) => RENDER_vin(...a),
  blanks: (...a) => RENDER_blanks(...a),
  tools: (...a) => RENDER_tools(...a),
  jobs: (...a) => RENDER_jobs(...a),
  settings: (...a) => RENDER_settings(...a)
};

document.addEventListener('click', (e) => {
  const t = e.target.closest('[data-go],[data-make],[data-vid],[data-editveh],[data-delveh],[data-canceledit],[data-newveh],[data-jobfrom],[data-editjob],[data-deljob],[data-canceljob],[data-newjob]');
  if (!t) return;

  if (t.dataset.go)        { go(t.dataset.go); return; }
  if (t.dataset.make !== undefined) { filter.make = t.dataset.make; RENDER_lookup(); return; }
  if (t.dataset.vid)       { go('vehicle', t.dataset.vid); return; }
  if (t.dataset.editveh)   { editVehicle(t.dataset.editveh); return; }
  if (t.dataset.newveh)    { go('vehicle'); editVehicle(null); return; }
  if (t.hasAttribute('data-canceledit')) {
    const back = t.dataset.canceledit;
    if (back) go('vehicle', back); else go('lookup');
    return;
  }
  if (t.dataset.delveh) {
    if (confirm('Delete this record for good?')) { Store.deleteVehicle(t.dataset.delveh); go('lookup'); }
    return;
  }
  if (t.dataset.jobfrom)   { go('jobs'); editJob(null, t.dataset.jobfrom); return; }
  if (t.dataset.newjob)    { editJob(null); return; }
  if (t.dataset.editjob)   { editJob(t.dataset.editjob); return; }
  if (t.dataset.deljob) {
    if (confirm('Delete this job?')) { Store.deleteJob(t.dataset.deljob); $('#jobEditor').innerHTML = ''; $('#jobListWrap').hidden = false; RENDER_jobs(); }
    return;
  }
  if (t.dataset.canceljob) { $('#jobEditor').innerHTML = ''; $('#jobListWrap').hidden = false; return; }
});

function boot() {
  /* theme */
  const savedTheme = localStorage.getItem('keypro:theme');
  if (savedTheme) document.documentElement.dataset.theme = savedTheme;
  $('#themeBtn').addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
    document.documentElement.dataset.theme = next;
    localStorage.setItem('keypro:theme', next);
  });
  $('#gearBtn').addEventListener('click', () => go('settings'));

  /* lookup */
  $('#yearSel').addEventListener('change', (e) => { filter.year = e.target.value; RENDER_lookup(); });
  $('#lookupQ').addEventListener('input', (e) => { filter.q = e.target.value; RENDER_lookup(); });
  $('#lookupClear').addEventListener('click', () => { filter.make = ''; filter.year = ''; filter.q = ''; RENDER_lookup(); });
  $('#addVehBtn').addEventListener('click', () => { go('vehicle'); editVehicle(null); });

  /* vin */
  $('#vinForm').addEventListener('submit', (e) => { e.preventDefault(); runVinDecode(); });
  $('#vinInput').addEventListener('input', (e) => {
    e.target.value = normalizeVin(e.target.value).slice(0, 17);
    $('#vinLen').textContent = `${e.target.value.length}/17`;
  });

  /* blanks */
  $('#blankQ').addEventListener('input', RENDER_blanks);

  /* tools */
  $('#bcmForm').addEventListener('submit', (e) => { e.preventDefault(); bcmLookup(); });
  $('#bcmImport').addEventListener('click', async () => {
    try {
      const text = await pickFile('.csv,.txt,text/csv,text/plain');
      const n = importBcmCsv(text, true);
      alert(`Imported ${n} row(s).`);
      RENDER_tools();
    } catch (err) { alert(err.message); }
  });
  $('#bcmClear').addEventListener('click', () => {
    if (confirm('Clear the loaded BCM table?')) { Store.setBcmRows([]); RENDER_tools(); $('#bcmOut').innerHTML = ''; }
  });
  $('#hexIn').addEventListener('input', runHexDec);
  $('#quoteForm').addEventListener('submit', (e) => { e.preventDefault(); runQuote(); });

  /* jobs */
  $('#newJobBtn').addEventListener('click', () => editJob(null));
  $('#jobCsvBtn').addEventListener('click', () => download('keypro-jobs.csv', jobsCsv(), 'text/csv'));

  /* settings */
  $('#setForm').addEventListener('submit', (e) => {
    e.preventDefault();
    Store.setPrefs({ shop: $('#setShop').value, phone: $('#setPhone').value, rate: $('#setRate').value });
    alert('Saved.');
  });
  $('#exportBtn').addEventListener('click', () =>
    download(`keypro-backup-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(Store.exportAll(), null, 2), 'application/json'));
  $('#importBtn').addEventListener('click', async () => {
    try {
      const text = await pickFile('.json,application/json');
      const mode = confirm('OK = merge into what you have.\nCancel = replace everything.') ? 'merge' : 'replace';
      Store.importAll(JSON.parse(text), mode);
      alert('Imported.');
      RENDER_settings();
    } catch (err) { alert('Import failed: ' + err.message); }
  });
  $('#wipeBtn').addEventListener('click', () => {
    if (!confirm('Erase every edit, job and BCM row on this device? Export a backup first.')) return;
    if (!confirm('Last chance. This cannot be undone.')) return;
    ['vehicles', 'jobs', 'bcm', 'prefs'].forEach(k => localStorage.removeItem('keypro:' + k));
    RENDER_settings();
  });

  window.addEventListener('hashchange', routeFromHash);
  routeFromHash();

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
}

document.addEventListener('DOMContentLoaded', boot);
