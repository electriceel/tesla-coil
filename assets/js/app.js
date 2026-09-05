/* KeyPro Field — UI + routing. No framework, no build step, no network needed. */

const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const nz = (v, alt = '—') => (v && String(v).trim()) ? v : alt;

/* ======================= routing ======================= */
const VIEWS = ['lookup', 'vehicle', 'vin', 'blanks', 'tools', 'master', 'bcm', 'quote', 'hex',
               'jobs', 'settings'];
let current = 'lookup';

let vehShown = '';
function go(view, arg) {
  if (!VIEWS.includes(view)) view = 'lookup';
  /* Arriving at a different vehicle starts on Overview; re-rendering the one you
     are already reading keeps the tab you are on. */
  if (view === 'vehicle' && arg !== vehShown) { vehTab = 'overview'; vehTipOpen = ''; vehShown = arg; }
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
/* The seed is a few hundred records and grows as the user adds their own, so the
   unfiltered list is capped until they ask for the rest. */
const LOOKUP_CAP = 60;
let lookupShowAll = false;
const lookupOpen = {};

function allMakes() {
  return Array.from(new Set(Store.vehicles().map(v => v.make))).sort();
}

/* Punctuation-insensitive form, so "f150" finds "F-150" and "toy44h" finds
   "TOY44H-PT". */
const squash = (s) => String(s == null ? '' : s).toLowerCase().replace(/[^a-z0-9]+/g, '');

function vehicleHaystack(v) {
  return [
    v.make, v.model, v.blanks && v.blanks.keyway, v.blanks && v.blanks.ilco,
    v.blanks && v.blanks.silca, v.blanks && v.blanks.jma, v.blanks && v.blanks.oem,
    v.transponder && v.transponder.chip, v.transponder && v.transponder.system,
    (v.remotes || []).map(r => `${r.fcc} ${r.pn}`).join(' ')
  ].join(' ');
}

/* A job comes in as "2015 Camry", so the search box has to take it that way:
   any 19xx/20xx in the query is read as a model year, and the words left over
   are matched independently, in any order. */
function parseQuery(raw) {
  const q = String(raw || '').trim().toLowerCase();
  const years = (q.match(/\b(?:19|20)\d{2}\b/g) || []).map(Number);
  const terms = q.replace(/\b(?:19|20)\d{2}\b/g, ' ').split(/\s+/).filter(Boolean);
  return { years, terms };
}

function matchVehicles() {
  const { years, terms } = parseQuery(filter.q);
  const dropdownYear = parseInt(filter.year, 10);
  const covers = (v, y) => y >= v.yearStart && y <= v.yearEnd;

  return Store.vehicles().filter(v => {
    if (filter.make && v.make !== filter.make) return false;
    if (dropdownYear && !covers(v, dropdownYear)) return false;
    if (years.some(y => !covers(v, y))) return false;
    if (terms.length) {
      const hay = vehicleHaystack(v).toLowerCase();
      const tight = squash(hay);
      if (!terms.every(t => hay.includes(t) || tight.includes(squash(t)))) return false;
    }
    return true;
  }).sort((a, b) => (a.make + a.model).localeCompare(b.make + b.model) || b.yearStart - a.yearStart);
}

function RENDER_lookup() {
  const years = [];
  const thisYear = new Date().getFullYear() + 1;
  for (let y = thisYear; y >= 1990; y--) years.push(y);

  /* Include the active make even when no vehicle record uses it yet — otherwise
     arriving from a blank's make chip shows an empty list with no visible filter.
     At 60+ makes this is a dropdown; a chip row filled the whole screen. */
  const makes = Array.from(new Set(allMakes().concat(filter.make ? [filter.make] : []))).sort();
  const makeSel = $('#makeSel');
  const wantMakes = makes.join('\u0000');
  if (makeSel.dataset.built !== wantMakes) {
    makeSel.innerHTML = '<option value="">All makes</option>' +
      makes.map(m => `<option value="${esc(m)}">${esc(m)}</option>`).join('');
    makeSel.dataset.built = wantMakes;
  }
  makeSel.value = filter.make;

  const sel = $('#yearSel');
  if (sel.options.length <= 1) {
    sel.innerHTML = '<option value="">Any year</option>' + years.map(y => `<option value="${y}">${y}</option>`).join('');
  }
  sel.value = filter.year;
  $('#lookupQ').value = filter.q;
  $('#lookupClear').hidden = !(filter.make || filter.year || filter.q);

  const hits = matchVehicles();
  const groups = groupByNameplate(hits);
  const capped = !lookupShowAll && groups.length > LOOKUP_CAP;
  const shown = capped ? groups.slice(0, LOOKUP_CAP) : groups;

  /* Narrowed to a handful of models? Open them — the user has already chosen. */
  const autoOpen = groups.length <= 3;

  $('#lookupCount').textContent = hits.length
    ? `${hits.length} record${hits.length === 1 ? '' : 's'} in ${groups.length} model${groups.length === 1 ? '' : 's'}`
      + (capped ? ` \u00b7 showing ${LOOKUP_CAP}` : '')
    : '';

  $('#lookupResults').innerHTML = hits.length
    ? shown.map(g => g.rows.length === 1 ? vehicleCardHtml(g.rows[0]) : nameplateHtml(g, autoOpen)).join('')
      + (capped ? `<button class="btn ghost" data-showall="1">Show all ${groups.length} models</button>` : '')
    : emptyLookupHtml();
};

/* One row per nameplate. A model with several generations collapses into a
   single line that opens to show them, so 377 records read as ~260 models. */
function groupByNameplate(list) {
  const by = new Map();
  list.forEach(v => {
    const key = v.make + '|' + v.model;
    if (!by.has(key)) by.set(key, { key, make: v.make, model: v.model, rows: [] });
    by.get(key).rows.push(v);
  });
  return Array.from(by.values()).map(g => {
    g.rows.sort((a, b) => b.yearStart - a.yearStart);          // newest generation first
    g.y0 = Math.min(...g.rows.map(r => r.yearStart));
    g.y1 = Math.max(...g.rows.map(r => r.yearEnd));
    g.custom = g.rows.some(r => r.custom);
    return g;
  }).sort((a, b) => (a.make + a.model).localeCompare(b.make + b.model));
}

function vehicleCardHtml(v) {
  return `
    <div class="card tap vres" data-vid="${esc(v.id)}">
      <div style="flex:1;min-width:0">
        <div class="yr">${v.yearStart}${v.yearEnd !== v.yearStart ? '&ndash;' + v.yearEnd : ''}${v.custom ? ' &middot; YOURS' : ''}</div>
        <div class="nm">${esc(v.make)} ${esc(v.model)}</div>
        <div class="sub">${esc(nz(v.blanks && v.blanks.keyway))} &middot; ${esc(nz(v.transponder && v.transponder.chip))}</div>
      </div>
      <div class="go">&rsaquo;</div>
    </div>`;
}

function nameplateHtml(g, autoOpen) {
  const open = autoOpen || lookupOpen[g.key];
  return `<div class="card" style="padding:0;overflow:hidden">
    <button class="grp" data-lopen="${esc(g.key)}">
      <span class="grp-name">${esc(g.make)} ${esc(g.model)}${g.custom ? ' &middot; YOURS' : ''}
        <span class="grp-sub">${g.y0}&ndash;${g.y1}</span></span>
      <span class="grp-n">${g.rows.length}</span>
      <span class="grp-x">${open ? '&minus;' : '+'}</span>
    </button>
    ${open ? `<div class="grp-body">${g.rows.map(v => `
      <button class="brow" data-vid="${esc(v.id)}">
        <span class="brow-key">${v.yearStart}&ndash;${v.yearEnd}</span>
        <span class="brow-sub">${esc(nz(v.blanks && v.blanks.keyway))} &middot; ${esc(nz(v.transponder && v.transponder.chip))}</span>
        <span class="brow-go">&rsaquo;</span>
      </button>`).join('')}</div>` : ''}
  </div>`;
}

/* When the lookup finds nothing, the vPIC index can still say whether the thing
   exists. "Real vehicle, no key data yet" is a different answer from "no such
   vehicle", and only the first one is worth adding a record for. */
function emptyLookupHtml() {
  const hits = (typeof vpicSearch === 'function' && filter.q.trim()) ? vpicSearch(filter.q, 6) : [];
  if (!hits.length) {
    return `<div class="empty">No match in your database.<br><br>
      <button class="btn btn-sm" data-newveh="1">Add this vehicle</button></div>`;
  }
  return `<div class="notice info">No key data on file for that yet &mdash; but these are real
      vehicles, per the NHTSA database. Tap one to start a record with the years filled in.</div>` +
    hits.map(h => `
      <div class="card tap vres" data-vpic="${esc(h.mk)}|${esc(h.md)}|${h.y0}|${h.y1}">
        <div style="flex:1;min-width:0">
          <div class="yr">${h.y0}&ndash;${h.y1} &middot; NHTSA</div>
          <div class="nm">${esc(h.mk)} ${esc(h.md)}</div>
          <div class="sub">No key data yet &mdash; tap to add</div>
        </div><div class="go">+</div>
      </div>`).join('');
}

/* ======================= vehicle detail ======================= */
/* A spec list with the empty rows dropped. On records where a field was left
   blank rather than guessed, a column of dashes buries the parts that do say
   something — the Tesla was 7 dash-only rows out of 24. */
function specList(pairs, opts) {
  const rows = pairs.filter(([, val]) => {
    const t = String(val == null ? '' : val).trim();
    return t !== '' && t !== '\u2014';
  });
  if (!rows.length) return `<div class="card muted tiny">${esc((opts && opts.empty) || 'Not recorded.')}</div>`;
  return `<div class="card"><dl class="spec">` + rows.map(([label, val, cls]) =>
    `<dt>${label}</dt><dd${cls ? ` class="${cls}"` : ''}>${esc(val)}</dd>`).join('') + `</dl></div>`;
}

/* ---- vehicle record: tabbed, the way the job actually runs ---------------
   Overview is what you read at the curb, Keymaking is what you do, Tips is
   what you learned last time, Parts is what you carry back to the van. */
const VEH_TABS = [['overview', 'Overview'], ['keymaking', 'Keymaking'], ['tips', 'Tips'], ['parts', 'Parts']];
let vehTab = 'overview';
let vehTipOpen = '';

/* The categories AutoProAPP splits tips into — they map to the order a lockout
   or a key job actually goes. */
const TIP_CATS = [
  'Car door unlocking', 'Lock picking / decoding', 'Key programming',
  'Remote programming', 'Code locations', 'Lock removal', 'OBD port location'
];

/* Every generation of the same nameplate, newest first — the dropdown at the
   top of the record. */
function generationsOf(v) {
  return Store.vehicles()
    .filter(x => x.make === v.make && x.model === v.model)
    .sort((a, b) => b.yearStart - a.yearStart);
}

const yearSpan = (v) => v.yearStart + (v.yearEnd !== v.yearStart ? '–' + v.yearEnd : '');

/* "1-8", "1,3,5" or [1,2,3] -> a Set of positions. */
function positionSet(spec) {
  const out = new Set();
  String(spec == null ? '' : Array.isArray(spec) ? spec.join(',') : spec)
    .split(',').map(s => s.trim()).filter(Boolean).forEach(part => {
      const m = part.match(/^(\d+)\s*[-–]\s*(\d+)$/);
      if (m) { for (let i = +m[1]; i <= +m[2]; i++) out.add(i); }
      else if (/^\d+$/.test(part)) out.add(+part);
    });
  return out;
}

/* The wafer map. The ignition uses every cut by definition of the space count;
   the other locks are drawn only where the record actually says so. */
function tumblerGridHtml(l) {
  const n = parseInt(l.spaces, 10);
  if (!n || n > 16) return '';
  const t = l.tumblers || {};
  const rows = [['Ignition', t.ignition || `1-${n}`]]
    .concat(t.door ? [['Door', t.door]] : [])
    .concat(t.trunk ? [['Trunk', t.trunk]] : [])
    .concat(t.glove ? [['Glove box', t.glove]] : []);
  const head = Array.from({ length: n }, (_, i) => `<th>${i + 1}</th>`).join('');
  const body = rows.map(([label, spec]) => {
    const on = positionSet(spec);
    return `<tr><th>${label}</th>${Array.from({ length: n }, (_, i) =>
      `<td class="${on.has(i + 1) ? 'on' : ''}"></td>`).join('')}</tr>`;
  }).join('');
  const partial = !t.door && !t.trunk;
  return `<h2>Tumbler locations</h2>
    <div class="card" style="padding:10px">
      <div class="tumwrap"><table class="tum"><tr><th></th>${head}</tr>${body}</table></div>
      ${partial ? `<div class="muted tiny" style="margin-top:8px">Ignition shown across all
        ${n} spaces. Door and trunk positions are not recorded &mdash; add them in Edit once
        you have decoded one.</div>` : ''}
    </div>`;
}

/* A car with two code series — an ignition series and a separate door series —
   gets a block each, the way the spec sheet prints it. */
function basicsHtml(l) {
  const many = !!(l.series && l.series.length);
  const blocks = (many ? l.series : [l]).map(sx => specList([
    ['Code series', sx.codeSeries], ['Spaces', sx.spaces], ['Depths', sx.depths],
    ['Ignition', sx.ignition], ['MACS', sx.macs],
    /* Cut type is a property of the car, not of a series — print it once. */
    ...(many ? [] : [['Cut type', sx.cutMethod]])
  ], { empty: 'Nothing to cut on this one.' })).join('');
  return blocks + (many ? specList([['Cut type', l.cutMethod], ['Decode', l.decode]]) : '');
}

/* "TOY44H (H chip 2013+)" or "DeLorean (Lotus/Renault-derived)" -> the profile
   name alone, without splitting a parenthetical in half. */
const shortKeyway = (kw) => String(kw || '').replace(/\s*\([^)]*\)/g, '').split('/')[0].trim()
  || String(kw || '').trim();

/* Only what the record actually says. Deriving a Lishi number from the blank
   name looks clever and gets it wrong — the blank name and the keyway profile
   are not the same string (a Camry's blank is TOY44H, its Lishi is TOY48). */
function decodersFor(v) {
  const d = (v.lock || {}).decode;
  return d ? [['Method', d]] : [];
}

function RENDER_vehicle(id) {
  const v = Store.vehicles().find(x => x.id === id);
  const host = $('#vehicleBody');
  if (!v) { host.innerHTML = '<div class="empty">Vehicle not found.</div>'; return; }

  const gens = generationsOf(v);
  const p = v.programming || {};

  const header = `
    <div class="vsticky">
    <div class="vhead">
      <div class="vhead-name">${esc(v.make)} ${esc(v.model)}</div>
      ${gens.length > 1
        ? `<select class="vgen" id="vehGen" aria-label="Generation">${gens.map(g =>
            `<option value="${esc(g.id)}"${g.id === v.id ? ' selected' : ''}>${yearSpan(g)}</option>`).join('')}</select>`
        : `<span class="vgen static">${yearSpan(v)}</span>`}
    </div>
    <div class="chips" style="margin:0 0 10px">
      ${v.custom ? '<span class="badge info">Your record</span>' : ''}
      <span class="badge ${v.verified ? 'ok' : 'warn'}">${v.verified ? 'Verified by you' : 'Unverified seed data'}</span>
      ${p.pinRequired && /yes/i.test(p.pinRequired) ? '<span class="badge err">PIN required</span>' : ''}
    </div>
    <div class="tabs" role="tablist">${VEH_TABS.map(([k, label]) =>
      `<button class="tab${vehTab === k ? ' on' : ''}" role="tab" data-vtab="${k}">${label}</button>`).join('')}</div>
    </div>`;

  const body = vehTab === 'keymaking' ? vehKeymakingHtml(v)
    : vehTab === 'tips' ? vehTipsHtml(v)
    : vehTab === 'parts' ? vehPartsHtml(v)
    : vehOverviewHtml(v);

  host.innerHTML = header + `<div class="tabbody">${body}</div>` + `
    <div class="stack" style="margin-top:16px">
      <button class="btn" data-editveh="${esc(v.id)}">Edit this record</button>
      <button class="btn" data-jobfrom="${esc(v.id)}">Start a job for this vehicle</button>
      ${v.custom && !SEED_VEHICLES.some(s => s.id === v.id)
        ? `<button class="btn danger" data-delveh="${esc(v.id)}">Delete this record</button>` : ''}
    </div>`;

  const gen = $('#vehGen');
  if (gen) gen.addEventListener('change', () => go('vehicle', gen.value));
}

/* ---- tab 1: overview ---- */
function vehOverviewHtml(v) {
  const b = v.blanks || {}, t = v.transponder || {}, l = v.lock || {}, r = v.remotes || [];
  const dec = decodersFor(v);
  const ser0 = (l.series && l.series[0]) || l;
  const missing = [!ser0.ignition && 'ignition retainer', !ser0.macs && 'MACS'].filter(Boolean);

  return `
    ${v.verified ? '' : `<div class="notice warn"><strong>Verify before you cut.</strong>
      This came with the app as starter data. Confirm the blank and chip against the vehicle or
      your machine's database, then mark it verified in Edit so it stops nagging you.</div>`}

    <h2>The basics</h2>
    ${basicsHtml(l)}
    ${missing.length ? `<div class="card muted tiny" style="margin-top:-6px">No ${missing.join(' or ')}
      on file. Add it in Edit and it will be here next time.</div>` : ''}

    ${tumblerGridHtml(l)}

    <h2>The keys</h2>
    ${specList([['Keyway', b.keyway, 'mono'], ['Ilco', b.ilco, 'mono'], ['Silca', b.silca, 'mono'],
                ['JMA', b.jma, 'mono'], ['OEM P/N', b.oem, 'mono']],
               { empty: 'No mechanical key on this one.' })}
    ${b.keyway ? `<button class="btn btn-sm ghost" data-blankfor="${esc(b.keyway)}"
      style="margin-top:-6px">Open ${esc(shortKeyway(b.keyway))} in the blank directory</button>` : ''}

    <h2>The transponder</h2>
    ${specList([['Chip', t.chip], ['System', t.system], ['Cloneable', t.cloneable]])}

    <h2>The remotes</h2>
    ${r.length
      ? r.map(x => specList([['Type', x.type], ['FCC ID', x.fcc, 'mono'],
                             ['Part no.', x.pn, 'mono'], ['Buttons', x.buttons]],
                            { empty: 'Fob details not recorded.' })).join('')
      : '<div class="card muted tiny">No fob data on file.</div>'}

    <h2>Decoders</h2>
    ${dec.length ? specList(dec) : ''}
    <div class="card muted tiny">Which reader you reach for is your call and your kit &mdash;
    put it in the decode method in Edit and it will be on this card next time.</div>`;
}

/* ---- tab 2: keymaking ---- */
function vehKeymakingHtml(v) {
  const l = v.lock || {}, p = v.programming || {}, t = v.transponder || {};
  const pinBad = p.pinRequired && /yes/i.test(p.pinRequired);

  return `
    <div class="method">
      <div class="method-h">Method 1 &middot; Decode the lock</div>
      <div class="card">
        ${l.decode ? `<p style="margin:0 0 8px">${esc(l.decode)}</p>`
                   : '<p class="muted tiny" style="margin:0 0 8px">No decode method recorded yet.</p>'}
        ${l.spaces && l.depths ? `<div class="muted tiny" style="margin-top:8px">${esc(l.spaces)} spaces,
          ${esc(l.depths)} depths${l.macs ? `, MACS ${esc(l.macs)}` : ''}. Progression the gaps once you
          have most of the cuts.</div>` : ''}
      </div>
    </div>

    <div class="method">
      <div class="method-h">Method 2 &middot; Originate by code</div>
      ${(l.series && l.series.length ? l.series : [l]).map(sx => specList(
        [['Code series', sx.codeSeries], ['Spaces', sx.spaces], ['Depths', sx.depths],
         ['MACS', sx.macs], ['Cut type', sx.cutMethod || l.cutMethod]],
        { empty: 'No code series on file for this one.' })).join('')}
      ${l.series && l.series.length > 1 ? `<div class="card muted tiny">Two code series on this car.
        Read the code off the lock before you cut &mdash; they do not share a MACS.</div>` : ''}
    </div>

    <div class="method">
      <div class="method-h">Method 3 &middot; Program the key</div>
      ${pinBad ? `<div class="notice warn"><strong>PIN required.</strong> ${esc(p.pinRequired)}
        Get it before you take the old key out of the equation.</div>` : ''}
      ${specList([['OBD', p.obd], ['Onboard', p.onboard], ['All keys lost', p.allKeysLost],
                  ['PIN', p.pinRequired], ['Chip', t.chip], ['Notes', p.notes]],
                 { empty: 'No programming procedure recorded.' })}
    </div>

    <div class="method">
      <div class="method-h">On the vehicle</div>
      ${specList([['OBD port', v.obdPort], ['Entry', v.doorUnlock], ['Notes', v.notes]])}
    </div>`;
}

/* ---- tab 3: tips ---- */
function vehTipsHtml(v) {
  const tips = Store.tipsFor(v.id);
  const total = Object.values(tips).reduce((n, list) => n + list.length, 0);

  return `
    <div class="notice info tiny">Your own notes from your own jobs, saved on this device
    ${total ? ` — ${total} on this vehicle` : ''}. They ride along in the Settings backup.</div>
    ${TIP_CATS.map(cat => {
      const list = tips[cat] || [];
      const open = vehTipOpen === cat;
      return `<div class="tipcat">
        <div class="tipcat-h">
          <span>${esc(cat)}</span>
          <button class="btn btn-sm ghost" data-tipadd="${esc(cat)}">${open ? 'Cancel' : '+ Add'}</button>
        </div>
        ${open ? `<form class="card tipform" data-tipcat="${esc(cat)}">
          <textarea name="text" rows="3" placeholder="What worked, what to watch for" autofocus></textarea>
          <button type="submit" class="btn primary btn-sm" style="margin-top:8px">Save tip</button>
        </form>` : ''}
        ${list.length ? list.map(tp => `<div class="card tip">
            <div>${esc(tp.text)}</div>
            <div class="tip-f">
              <span class="muted tiny">${new Date(tp.at).toLocaleDateString()}</span>
              <button class="btn btn-sm ghost" data-tipdel="${esc(tp.id)}"
                data-tipdelcat="${esc(cat)}">Delete</button>
            </div>
          </div>`).join('')
          : '<div class="card muted tiny">Nothing here yet.</div>'}
      </div>`;
    }).join('')}`;
}

/* ---- tab 4: parts ---- */
function vehPartsHtml(v) {
  const b = v.blanks || {}, t = v.transponder || {}, r = v.remotes || [];
  const rows = [];
  if (b.keyway || b.ilco) rows.push(['Mechanical key', [b.keyway, b.ilco, b.silca, b.jma]
    .filter(x => x && x !== '—').join(' · ')]);
  if (b.oem) rows.push(['OEM part no.', b.oem]);
  if (t.chip) rows.push(['Transponder', t.chip]);
  if (t.cloneable) rows.push(['Cloneable', t.cloneable]);
  r.forEach((x, i) => {
    const val = [x.type, x.buttons, x.fcc, x.pn].filter(Boolean).join(' · ');
    if (val) rows.push([r.length > 1 ? `Remote ${i + 1}` : 'Remote', val]);
  });

  return `
    <h2>What this job takes</h2>
    ${rows.length ? specList(rows) : '<div class="card muted tiny">Nothing recorded to carry yet.</div>'}
    <div class="notice info tiny">Part numbers are only here when they are known. A missing row
    means it has not been confirmed &mdash; look it up rather than reading the gap as "none".
    Start a job below and the quote builder in Jobs picks the vehicle up from here.</div>`;
}

/* ---- vehicle editor (same view, swapped body) ---- */
function editVehicle(id, prefill) {
  const blank = {
    id: '', make: '', model: '', yearStart: '', yearEnd: '', body: 'car',
    blanks: {}, transponder: {}, remotes: [{}], lock: {}, programming: {},
    obdPort: '', doorUnlock: '', notes: '', verified: true
  };
  if (prefill) Object.assign(blank, prefill);
  const v = id ? (Store.vehicles().find(x => x.id === id) || blank) : blank;
  const b = v.blanks || {}, t = v.transponder || {}, l = v.lock || {}, p = v.programming || {};
  const r0 = (v.remotes && v.remotes[0]) || {};
  const F = (name, label, val, ph = '', list = '') =>
    `<div class="field"><label>${label}</label><input name="${name}" value="${esc(val || '')}" ` +
    `placeholder="${esc(ph)}"${list ? ` list="${list}"` : ''}></div>`;

  $('#vehicleBody').innerHTML = `
    <div class="notice info">Anything you save here lives on this device only. Export a backup from Settings.</div>
    <form id="vehForm">
      <h2>Vehicle</h2>
      <div class="card">
        <div class="row">
          ${F('make', 'Make', v.make, 'Toyota', 'vpicMakes')}
          ${F('model', 'Model', v.model, 'Camry', 'vpicModels')}
        </div>
        ${typeof VPIC_MODELS === 'undefined' ? '' : `
          <datalist id="vpicMakes">${Object.keys(VPIC_MODELS).map(m => `<option value="${esc(m)}">`).join('')}</datalist>
          <datalist id="vpicModels">${vpicModelsFor(v.make).map(m => `<option value="${esc(m)}">`).join('')}</datalist>`}
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
        <div class="row">${F('ignition', 'Ignition retainer', l.ignition, 'Active retainer')}${F('macs', 'MACS', l.macs, '3')}</div>
        ${F('cutMethod', 'Cut type', l.cutMethod)}
        ${F('decode', 'Decode method', l.decode)}
        <div class="row">
          ${F('tumIgnition', 'Ignition tumblers', (l.tumblers || {}).ignition, '1-10')}
          ${F('tumDoor', 'Door tumblers', (l.tumblers || {}).door, '1-8')}
        </div>
        <div class="row">
          ${F('tumTrunk', 'Trunk tumblers', (l.tumblers || {}).trunk, '3-10')}
          ${F('tumGlove', 'Glove box tumblers', (l.tumblers || {}).glove)}
        </div>
        <div class="tiny muted">Tumbler positions take a range or a list &mdash; <span class="mono">1-8</span>
        or <span class="mono">1,3,5,7</span>. Leave a lock blank and its row stays off the grid.</div>
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

  const makeInput = $('#vehForm [name="make"]');
  if (makeInput && typeof VPIC_MODELS !== 'undefined') {
    makeInput.addEventListener('change', () => {
      const dl = $('#vpicModels');
      if (dl) dl.innerHTML = vpicModelsFor(makeInput.value).map(m => `<option value="${esc(m)}">`).join('');
    });
  }

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
      lock: {
        codeSeries: f.codeSeries, spaces: f.spaces, depths: f.depths,
        cutMethod: f.cutMethod, decode: f.decode,
        ignition: f.ignition, macs: f.macs,
        tumblers: (f.tumIgnition || f.tumDoor || f.tumTrunk || f.tumGlove)
          ? { ignition: f.tumIgnition, door: f.tumDoor, trunk: f.tumTrunk, glove: f.tumGlove } : null,
        /* The form edits the primary series; a seeded second series is carried
           through rather than quietly dropped by saving the record. */
        series: (v.lock && v.lock.series) || null
      },
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
      $('#vinOnlineOut').innerHTML = specList([
        ['Make', o.make], ['Model', o.model], ['Year', o.year],
        ['Trim', [o.series, o.trim].filter(Boolean).join(' ')], ['Body', o.bodyClass],
        ['Engine', o.engine], ['Keyless', o.keylessIgnition], ['Built at', o.plant]
      ], { empty: 'NHTSA returned no details for this VIN.' });
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

/* ======================= blank cross-reference directory ======================= */
/* 139 blanks across 130-odd makes is unreadable as a make list on arrival, so
   the directory opens on the five categories and drills down from there. */
const blankUI = { q: '', group: 'cat', open: {}, detail: null };

/* Keyway strings carry qualifiers ("TOY44D / TOY44H by year", "NSN14 (emergency
   blade)"), so compare whole words rather than substrings — a substring test
   makes the B1 blank match every B1xx keyway. */
/* Words that describe a key without identifying a keyway. Matching on these
   would link, say, a Porsche "emergency blade in the fob" to a Land Rover one. */
const KEY_STOPWORDS = new Set([
  'EMERGENCY', 'BLADE', 'KEY', 'KEYS', 'FOB', 'NONE', 'NO', 'MECHANICAL',
  'FAMILY', 'STYLE', 'PROFILE', 'SERIES', 'CUT', 'LASER', 'EDGE', 'TIBBE',
  'BY', 'YEAR', 'TRIM', 'MODEL', 'BUILD', 'IN', 'THE', 'AND', 'OR', 'ON', 'FOR', 'WITH',
  'IGNITION', 'ENTRY', 'DOOR', 'LOCK', 'LOCKS', 'SET', 'MASTER', 'COMMON', 'UNIVERSAL',
  'ACCESSORY', 'SECONDARY', 'VINTAGE', 'MOTORCYCLE', 'MARINE', 'TRAILER', 'TRUCK', 'RV',
  /* Descriptive category names carry ordinary English. Without these, a
     warehouse roll-up door matched an Isuzu box truck on the word
     "commercial". */
  'COMMERCIAL', 'RESIDENTIAL', 'OVERHEAD', 'ROLL', 'UP', 'CABINET', 'CABINETS', 'RACK',
  'PANEL', 'STORAGE', 'CONTROL', 'HANDLING', 'ROUTE', 'MUNICIPAL', 'UTILITY', 'ENCLOSURE',
  'DISPENSER', 'FORECOURT', 'HARDWARE', 'KEYING', 'HOTEL', 'SAFE', 'DRAWER', 'REGISTER',
  'LAUNDRY', 'PEDESTAL', 'SERVER', 'EQUIPMENT', 'OFFICE', 'WINDOW', 'GATE', 'PRIVACY',
  'OVERRIDE', 'SLIDING', 'SCREEN', 'STORM', 'POOL', 'GRADE', 'BUILDER', 'SMART', 'HIGH',
  'SECURITY', 'ASSORTED', 'BLADES', 'DEPOSIT', 'DUAL', 'FIRE', 'DEPARTMENT', 'LOCKER'
]);
const keyWords = (s) => String(s || '')
  .replace(/\(.*?\)/g, ' ').toUpperCase().split(/[^A-Z0-9]+/)
  .filter(w => w && !KEY_STOPWORDS.has(w));
const bareTokens = (s) => String(s || '').split(/[\/,]/)
  .map(t => t.replace(/\(.*?\)/g, '').replace(/[^A-Za-z0-9]/g, '').toUpperCase())
  .filter(Boolean);

/* Vehicles in the user's database that take this blank: the keyway names the
   same word, or the vehicle cites this blank's Ilco number. */
function vehiclesForBlank(b) {
  const keys = new Set(keyWords(b.keyway));
  const cats = new Set([b.ilco, b.ilcoChip].flatMap(bareTokens));
  return Store.vehicles().filter(v => {
    const vb = v.blanks || {};
    if (keyWords(vb.keyway).some(w => keys.has(w))) return true;
    if (cats.size && bareTokens(vb.ilco).some(c => cats.has(c))) return true;
    return false;
  });
}

function matchBlanks() {
  const q = blankUI.q.trim().toLowerCase();
  if (!q) return Store.blanks();
  return Store.blanks().filter(b =>
    [b.keyway, b.ilco, b.ilcoChip, b.silca, b.jma, b.strattec, b.cut, b.cat, b.notes]
      .concat(b.makes || []).join(' ').toLowerCase().includes(q));
}

/* Categories sort in the order you meet them on a working day, not A-Z. */
const BLANK_CATS = ['Automotive', 'Powersports', 'Fleet & equipment', 'Residential', 'Commercial'];
const catRank = (c) => { const i = BLANK_CATS.indexOf(c); return i < 0 ? BLANK_CATS.length : i; };

function groupBlanks(list) {
  const g = new Map();
  const push = (k, b) => { if (!g.has(k)) g.set(k, []); g.get(k).push(b); };
  list.forEach(b => {
    if (blankUI.group === 'make') (b.makes || ['Other']).forEach(m => push(m, b));
    else if (blankUI.group === 'cat') push(b.cat || 'Automotive', b);
    else if (blankUI.group === 'cut') push(b.cut || 'Other', b);
    else push((b.keyway || '?')[0].toUpperCase(), b);
  });
  const order = blankUI.group === 'cat'
    ? (a, b) => catRank(a[0]) - catRank(b[0]) || a[0].localeCompare(b[0])
    : (a, b) => a[0].localeCompare(b[0]);
  return new Map(Array.from(g.entries()).sort(order)
    .map(([k, v]) => [k, v.sort((x, y) => x.keyway.localeCompare(y.keyway))]));
}

function RENDER_blanks() {
  if (blankUI.detail) return renderBlankDetail(blankUI.detail);

  $('#blankQ').value = blankUI.q;
  $('#blankGroupChips').innerHTML = [['cat', 'By category'], ['make', 'By make'], ['cut', 'By cut'], ['az', 'A-Z']]
    .map(([k, label]) => `<button class="chip${blankUI.group === k ? ' on' : ''}" data-bgroup="${k}">${label}</button>`).join('');

  const hits = matchBlanks();
  const groups = groupBlanks(hits);
  $('#blankCount').textContent = `${hits.length} blank${hits.length === 1 ? '' : 's'} in ${groups.size} group${groups.size === 1 ? '' : 's'}`;

  /* A search narrow enough to be readable opens everything; browsing starts collapsed. */
  const autoOpen = blankUI.q.trim().length > 0 && hits.length <= 12;

  $('#blankDir').innerHTML = groups.size ? Array.from(groups.entries()).map(([name, items]) => {
    const open = autoOpen || blankUI.open[name];
    return `<div class="card" style="padding:0;overflow:hidden">
      <button class="grp" data-bopen="${esc(name)}">
        <span class="grp-name">${esc(name)}</span>
        <span class="grp-n">${items.length}</span>
        <span class="grp-x">${open ? '&minus;' : '+'}</span>
      </button>
      ${open ? `<div class="grp-body">${items.map(b => `
        <button class="brow" data-bid="${esc(b.id)}">
          <span class="brow-key mono">${esc(b.keyway)}</span>
          <span class="brow-sub mono">${[b.ilco, b.silca, b.jma].filter(x => x && x !== '\u2014').map(esc).join(' &middot; ')}</span>
          <span class="brow-cut">${esc(b.cut)}</span>
        </button>`).join('')}</div>` : ''}
    </div>`;
  }).join('') : '<div class="empty">Nothing matches that.</div>';
}

function renderBlankDetail(id) {
  const b = Store.blanks().find(x => x.id === id);
  if (!b) { blankUI.detail = null; return RENDER_blanks(); }
  const vehicles = vehiclesForBlank(b);
  const dash = (v) => (!v || v === '—') ? '&mdash;' : esc(v);

  $('#blankDir').innerHTML = `
    <button class="back" data-bback="1">&lsaquo; Back to directory</button>
    <div class="card">
      <div style="font-size:22px;font-weight:700" class="mono">${esc(b.keyway)}</div>
      <div class="chips" style="margin-top:8px">
        <span class="badge">${esc(b.cat || 'Automotive')}</span>
        <span class="badge info">${esc(b.cut)}</span>
        ${b.spaces ? `<span class="badge dim">${esc(b.spaces)} spaces</span>` : ''}
        ${b.depths ? `<span class="badge dim">${esc(b.depths)} depths</span>` : ''}
        ${b.custom ? '<span class="badge ok">Your record</span>' : ''}
      </div>
    </div>

    <h2>Catalog numbers</h2>
    <div class="card"><dl class="spec">
      <dt>Ilco</dt><dd class="mono">${dash(b.ilco)}</dd>
      <dt>Ilco chip</dt><dd class="mono">${dash(b.ilcoChip)}</dd>
      <dt>Silca</dt><dd class="mono">${dash(b.silca)}</dd>
      <dt>JMA</dt><dd class="mono">${dash(b.jma)}</dd>
      <dt>Strattec</dt><dd class="mono">${dash(b.strattec)}</dd>
    </dl></div>

    <h2>Used on</h2>
    <div class="card"><div class="chips">${(b.makes || []).map(m =>
      `<button class="chip" data-bmake="${esc(m)}">${esc(m)}</button>`).join('') || '<span class="muted tiny">Not recorded.</span>'}</div></div>

    ${b.notes ? `<h2>Notes</h2><div class="card">${esc(b.notes)}</div>` : ''}

    <h2>Vehicles in your database</h2>
    ${vehicles.length ? vehicles.map(v => `
      <div class="card tap vres" data-vid="${esc(v.id)}">
        <div style="flex:1;min-width:0">
          <div class="yr">${v.yearStart}&ndash;${v.yearEnd}</div>
          <div class="nm">${esc(v.make)} ${esc(v.model)}</div>
          <div class="sub">${esc(nz(v.transponder && v.transponder.chip))}</div>
        </div><div class="go">&rsaquo;</div>
      </div>`).join('')
      : '<div class="card muted tiny">No vehicle records point at this blank yet.</div>'}

    <div class="stack" style="margin-top:16px">
      <button class="btn" data-bedit="${esc(b.id)}">Edit this blank</button>
      ${b.custom && !SEED_BLANKS.some(s => s.id === b.id)
        ? `<button class="btn danger" data-bdel="${esc(b.id)}">Delete this blank</button>` : ''}
    </div>`;
}

function editBlank(id) {
  const b = id ? (Store.blanks().find(x => x.id === id) || {}) : {};
  const F = (n, label, val, ph = '') =>
    `<div class="field"><label>${label}</label><input name="${n}" value="${esc(val == null ? '' : val)}" placeholder="${esc(ph)}"></div>`;
  $('#blankDir').innerHTML = `
    <form id="blankForm">
      <h2>${id ? 'Edit blank' : 'New blank'}</h2>
      <div class="card">
        ${F('keyway', 'Keyway', b.keyway, 'TOY48')}
        <div class="row">${F('ilco', 'Ilco', b.ilco)}${F('ilcoChip', 'Ilco chip version', b.ilcoChip)}</div>
        <div class="row">${F('silca', 'Silca', b.silca)}${F('jma', 'JMA', b.jma)}</div>
        ${F('strattec', 'Strattec', b.strattec)}
      </div>
      <div class="card">
        <div class="row">
          <div class="field"><label>Category</label>
            <select name="cat">${BLANK_CATS.map(c =>
              `<option${(b.cat || 'Automotive') === c ? ' selected' : ''}>${c}</option>`).join('')}</select></div>
          <div class="field"><label>Cut type</label>
            <select name="cut">${['Edge', 'Laser', 'Tibbe', 'Other'].map(c =>
              `<option${b.cut === c ? ' selected' : ''}>${c}</option>`).join('')}</select></div>
        </div>
        <div class="row">${F('spaces', 'Spaces', b.spaces)}${F('depths', 'Depths', b.depths)}</div>
        ${F('makes', 'Makes (comma separated)', (b.makes || []).join(', '), 'Toyota, Lexus')}
        <div class="field"><label>Notes</label><textarea name="notes">${esc(b.notes || '')}</textarea></div>
      </div>
      <div class="stack">
        <button type="submit" class="btn primary">Save blank</button>
        <button type="button" class="btn ghost" data-bcancel="${esc(id || '')}">Cancel</button>
      </div>
    </form>`;
  $('#blankForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.target).entries());
    if (!f.keyway.trim()) { alert('Keyway is required.'); return; }
    const rec = {
      id: id || f.keyway.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      keyway: f.keyway.trim(), ilco: f.ilco, ilcoChip: f.ilcoChip, silca: f.silca,
      jma: f.jma, strattec: f.strattec, cut: f.cut, cat: f.cat || 'Automotive',
      spaces: parseInt(f.spaces, 10) || '', depths: parseInt(f.depths, 10) || '',
      makes: f.makes.split(',').map(s => s.trim()).filter(Boolean),
      notes: f.notes
    };
    Store.saveBlank(rec);
    blankUI.detail = rec.id;
    RENDER_blanks();
  });
}

/* ======================= master keying ======================= */
/* The form state, kept out of the DOM so a re-render never loses your inputs. */
const mkUI = {
  sysId: 'schlage', chambers: 6, min: 0, max: 9, macs: 7, step: 2,
  tmk: '', method: 'rc', count: 12,
  mode: 'single',            // 'single' | 'full' | 'extend'
  existing: '',              // change keys already in the field, one per line
  levels: 3, alloc: null, counts: [3, 4], openSym: {},
  label: '', result: null, openKey: null, loadedId: null
};

function mkSystem() {
  const base = MK_SYSTEMS[mkUI.sysId] || MK_SYSTEMS.schlage;
  return { ...base, chambers: mkUI.chambers, min: mkUI.min, max: mkUI.max, macs: mkUI.macs, step: mkUI.step };
}

/* Switching manufacturer resets the specs to that maker's published ones —
   carrying Schlage's 0-9 into a Kwikset job would quietly produce keys that
   cannot be cut. */
function mkPickSystem(id) {
  const s = MK_SYSTEMS[id];
  if (!s) return;
  Object.assign(mkUI, { sysId: id, chambers: s.chambers, min: s.min, max: s.max, macs: s.macs, step: s.step, result: null });
}

/* ---- extending a master already in the field ---- */

/* One bitting per line; blank lines and stray separators are the user typing,
   not an error worth stopping for. */
function mkExistingLines() {
  return String(mkUI.existing || '').split(/[\n;]+/).map(l => l.trim()).filter(Boolean);
}

function mkExtendFormHtml(sys) {
  return `
    <div class="field"><label>The master you already have</label>
      <input name="tmk" class="mono" inputmode="numeric" autocomplete="off"
        placeholder="${Array(sys.chambers).fill(Math.min(sys.min + 2, sys.max)).join('-')}"
        value="${esc(mkUI.tmk)}"></div>

    <div class="field"><label>Change keys already in the field <span class="tiny muted">one per line, optional</span></label>
      <textarea name="existing" rows="5" class="mono" inputmode="numeric"
        placeholder="4-2-4-2-4&#10;6-2-6-2-6">${esc(mkUI.existing)}</textarea></div>
    <div class="tiny muted" style="margin:-4px 0 12px">Decode or read what is already out there and
      list it here. The tool works out how the system was laid out, keeps the new keys inside it, and
      refuses any that would open a door already in the field. Leave it empty and it treats every
      chamber as free.</div>

    <div class="field"><label>New change keys wanted</label>
      <input name="count" type="number" inputmode="numeric" min="1" max="200" value="${mkUI.count}"></div>`;
}

function mkExtendResultHtml(r) {
  if (!r.ok) {
    return `<div class="notice err"><strong>Cannot read that master.</strong><ul style="margin:6px 0 0 18px">
      ${r.errors.map(e => `<li>${esc(e)}</li>`).join('')}</ul></div>`;
  }
  const a = r.analysis;

  return `
    <h2>What the existing keys say</h2>
    <div class="card">
      <dl class="spec">
        <dt>Master</dt><dd class="mono" style="font-size:17px;font-weight:700">${esc(formatBitting(r.master))}</dd>
        <dt>Chambers that progress</dt>
        <dd>${r.positions.map(p => p + 1).join(', ')}${a.progressing.length ? '' : ' (all — nothing to read from)'}</dd>
        ${a.held.length ? `<dt>Chambers held</dt><dd>${a.held.map(p => p + 1).join(', ')}</dd>` : ''}
        <dt>Step</dt><dd>${r.step} increment${r.step === 1 ? '' : 's'}</dd>
        <dt>Keys read</dt><dd>${a.good.length} in the field</dd>
      </dl>
    </div>
    ${a.notes.map(n => `<div class="notice info tiny">${esc(n)}</div>`).join('')}

    ${a.rejected.length ? `<div class="notice warn tiny">
      <strong>${a.rejected.length} line${a.rejected.length === 1 ? '' : 's'} could not be used:</strong>
      <ul style="margin:6px 0 0 18px">${a.rejected.map(x =>
        `<li class="mono">${esc(formatBitting(x.bitting))} &mdash; ${esc(x.why)}</li>`).join('')}</ul></div>` : ''}

    <h2>New change keys</h2>
    ${r.keys.length ? '' : `<div class="notice err"><strong>No safe change key left.</strong>
      Every combination this master allows either duplicates a key in the field or would cross-key
      with one. The system is full — it needs a rekey, not another change.</div>`}

    ${r.exhausted && r.keys.length ? `<div class="notice warn tiny">Only ${r.keys.length} safe
      change key${r.keys.length === 1 ? '' : 's'} left in this master, fewer than you asked for.</div>` : ''}

    ${r.conflicts.length ? `<div class="notice ok tiny"><strong>${r.conflicts.length}${r.conflicts.length >= 12 ? '+' : ''}
      combination${r.conflicts.length === 1 ? ' was' : 's were'} rejected for cross-keying.</strong>
      They are legal cuts that would have opened a door already in the field:
      ${r.conflicts.slice(0, 4).map(c =>
        `<span class="mono">${esc(formatBitting(c.bitting))}</span>`).join(', ')}${r.conflicts.length > 4 ? ' and more' : ''}.</div>` : ''}

    ${r.keys.map(k => mkKeyHtml({ ...k, subtitle: `chambers ${r.positions.map(p => p + 1).join(', ')}` },
                                { tmk: r.master, system: r.system })).join('')}

    ${r.existingLocks.length ? `<h2>Already in the field</h2>
      <div class="card muted tiny">These are the keys you gave, shown so the new ones can be checked
      against them by eye as well as by the tool.</div>
      ${r.existingLocks.map(l => `<div class="card">
        <div class="mono" style="font-weight:700">${esc(formatBitting(l.bitting))}</div>
        <div class="tiny muted" style="margin-top:4px">bottom ${l.chart.map(c => c.bottom).join(' ')}
          &middot; master ${l.chart.map(c => c.masters.length ? c.masters.join('+') : '-').join(' ')}</div>
      </div>`).join('')}` : ''}

    <div class="stack" style="margin-top:16px">
      <button class="btn" data-mksave="1">Save this system</button>
      <button class="btn ghost" data-mkcopy="1">Copy the whole schedule</button>
    </div>`;
}

function mkExtendText(r) {
  const out = [];
  out.push(`${mkUI.label || 'Added to an existing master'} — ${r.system.name}`);
  out.push(`Master  ${formatBitting(r.master)}`);
  out.push(`Progressing chambers: ${r.positions.map(p => p + 1).join(', ')}   step ${r.step}`);
  if (r.analysis.good.length) {
    out.push('');
    out.push('ALREADY IN THE FIELD');
    r.analysis.good.forEach(b => out.push(`   ${formatBitting(b)}`));
  }
  out.push('');
  out.push('NEW CHANGE KEYS');
  r.keys.forEach(k => {
    out.push(`CK${String(k.n).padStart(2, '0')}  ${formatBitting(k.bitting)}`);
    out.push(`   bottom  ${k.chart.map(c => c.bottom).join(' ')}`);
    out.push(`   master  ${k.chart.map(c => c.masters.length ? c.masters.join('+') : '-').join(' ')}`);
  });
  out.push('');
  out.push(`${r.conflicts.length} combination(s) rejected for cross-keying with the field.`);
  out.push('Verify against your pinning kit before you load a plug.');
  return out.join('\n');
}

/* ---- full multi-level system ---- */

function mkAlloc() {
  const need = mkUI.levels - 1;
  if (!mkUI.alloc || mkUI.alloc.length !== need
      || mkUI.alloc.flat().some(p => p >= mkUI.chambers)) {
    mkUI.alloc = defaultAllocation(mkUI.chambers, mkUI.levels);
  }
  return mkUI.alloc;
}

/* Moving a chamber to a level takes it off whatever level held it — a chamber
   belongs to exactly one, which is what keeps the levels from colliding. */
function mkAssign(level, pos) {
  const alloc = mkAlloc().map(g => g.filter(p => p !== pos));
  alloc[level] = alloc[level].concat([pos]).sort((a, b) => a - b);
  mkUI.alloc = alloc;
  mkUI.result = null;
  RENDER_master();
}

function mkFullFormHtml(sys) {
  const names = LEVEL_NAMES[mkUI.levels];
  const alloc = mkAlloc();
  return `
    <div class="field"><label>System depth</label>
      <div class="chips tight">${[2, 3, 4].map(n =>
        `<button type="button" class="chip${mkUI.levels === n ? ' on' : ''}" data-mklevels="${n}">${n} levels</button>`).join('')}</div>
    </div>
    <div class="tiny muted" style="margin:6px 0 12px">${names.join(' &rsaquo; ')}</div>

    <div class="field"><label>${esc(names[0])} bitting</label>
      <input name="tmk" class="mono" inputmode="numeric" autocomplete="off"
        placeholder="${Array(sys.chambers).fill(Math.min(sys.min + 2, sys.max)).join('-')}"
        value="${esc(mkUI.tmk)}"></div>

    <div class="field"><label>Which chambers each level progresses</label></div>
    ${alloc.map((positions, g) => `
      <div class="allocrow">
        <div class="allocname">${esc(names[g + 1])}</div>
        <div class="chips">${Array.from({ length: sys.chambers }, (_, p) =>
          `<button type="button" class="chip sm${positions.includes(p) ? ' on' : ''}"
             data-mkalloc="${g}" data-mkpos="${p}">${p + 1}</button>`).join('')}</div>
      </div>`).join('')}
    <div class="tiny muted" style="margin:2px 0 12px">Each chamber belongs to one level. The level
      progresses those chambers and holds every other at its parent's depth &mdash; that is what
      stops a change key reaching a door above it.</div>

    ${alloc.map((_, g) => `
      <div class="field"><label>${esc(names[g + 1])}s per parent</label>
        <input name="count${g}" type="number" inputmode="numeric" min="1" max="60"
          value="${(mkUI.counts && mkUI.counts[g]) || 3}"></div>`).join('')}`;
}

function mkFullResultHtml(r) {
  if (!r.ok) {
    return `<div class="notice err"><strong>Cannot build that.</strong><ul style="margin:6px 0 0 18px">
      ${r.errors.map(e => `<li>${esc(e)}</li>`).join('')}</ul></div>`;
  }
  const a = r.audit;
  return `
    <h2>The system</h2>
    <div class="card">
      <dl class="spec">
        <dt>${esc(r.names[0])}</dt>
        <dd class="mono" style="font-size:17px;font-weight:700">${esc(formatBitting(r.top))}</dd>
        <dt>Levels</dt><dd>${esc(r.names.join(' › '))}</dd>
        <dt>Keys</dt><dd>${r.keys.length} across the system</dd>
        <dt>Locks</dt><dd>${r.locks.length}</dd>
        <dt>System</dt><dd>${esc(r.system.name)} &middot; ${r.system.chambers} chambers &middot;
          depths ${r.system.min}-${r.system.max} &middot; MACS ${r.system.macs}</dd>
      </dl>
    </div>

    ${a.violations.length
      ? `<div class="notice err"><strong>${a.violations.length} key${a.violations.length === 1 ? '' : 's'}
          open${a.violations.length === 1 ? 's' : ''} a door it should not.</strong>
          Do not cut this system.
          <ul style="margin:6px 0 0 18px">${a.violations.slice(0, 8).map(v =>
            `<li class="mono tiny">${esc(v.key)} ${esc(formatBitting(v.keyBitting))} opens lock
              ${esc(v.lock)} ${esc(formatBitting(v.lockBitting))}</li>`).join('')}</ul></div>`
      : `<div class="notice ok tiny"><strong>Cross-key audit clean.</strong> All ${a.checked}
          key/lock pairs in this system were tried. Every key opens the doors below it and none
          above it.</div>`}

    <h2>Key schedule</h2>
    ${mkTreeHtml(r.root, r, 0)}

    <div class="stack" style="margin-top:16px">
      <button class="btn" data-mksave="1">Save this system</button>
      <button class="btn ghost" data-mkcopy="1">Copy the whole schedule</button>
    </div>`;
}

/* One block per key, nested. A leaf carries its lock's pinning chart. */
function mkTreeHtml(node, r, depth) {
  const isLeaf = !node.children || !node.children.length;
  const lock = isLeaf ? r.locks.find(l => l.symbol === node.symbol) : null;
  const open = !!mkUI.openSym[node.symbol];
  const name = r.names[node.depth];

  return `<div class="card mktree" style="padding:0;overflow:hidden;margin-left:${depth * 10}px">
    <button class="grp" data-mksym="${esc(node.symbol)}">
      <span class="grp-name mono">${esc(node.symbol)} &nbsp; ${esc(formatBitting(node.bitting))}
        <span class="grp-sub">${esc(name)}${lock
          ? ` &middot; also passes ${lock.incidental}`
          : ` &middot; ${node.children.length} below`}</span></span>
      ${lock && lock.warnings.length ? '<span class="badge err">THIN</span>' : ''}
      <span class="grp-x">${open ? '&minus;' : '+'}</span>
    </button>
    ${open ? `<div class="grp-body" style="padding:${isLeaf ? '10px' : '8px 6px 6px'}">
      ${lock ? mkChartHtml(lock, r) : node.children.map(c => mkTreeHtml(c, r, depth + 1)).join('')}
    </div>` : ''}
  </div>`;
}

function mkChartHtml(lock, r) {
  const chainKeys = lock.chain.map(sym => r.keys.find(k => k.symbol === sym)).filter(Boolean);
  return `<div class="tumwrap"><table class="pinchart">
      <tr><th>Chamber</th>${lock.chart.map((_, i) => `<th>${i + 1}</th>`).join('')}</tr>
      ${chainKeys.map(k => `<tr><th>${esc(k.symbol)} cut</th>${k.bitting.map(d => `<td>${d}</td>`).join('')}</tr>`).join('')}
      <tr><th>${esc(lock.symbol)} cut</th>${lock.bitting.map(d => `<td>${d}</td>`).join('')}</tr>
      <tr class="sep"><th>Bottom pin</th>${lock.chart.map(c => `<td class="bot">${c.bottom}</td>`).join('')}</tr>
      <tr><th>Master pins</th>${lock.chart.map(c =>
        `<td class="${c.masters.length ? 'mas' : 'none'}">${c.masters.length ? c.masters.join('+') : '&mdash;'}</td>`).join('')}</tr>
    </table></div>
    <div class="tiny muted" style="margin-top:8px">${lock.keysThatOpen} keys turn this lock.
      Bottom pin is the shallowest cut among them; each master pin is the step up to the next depth.
      A dash means every key shares that chamber &mdash; one pin, no split. Top pins from your kit.</div>
    ${lock.warnings.length ? `<div class="notice warn tiny" style="margin-top:8px">
      ${lock.warnings.map(esc).join('<br>')}</div>` : ''}`;
}

function mkFullText(r) {
  const out = [];
  out.push(`${mkUI.label || 'Master key system'} — ${r.system.name}`);
  out.push(r.names.join(' > '));
  out.push(`${r.system.chambers} chambers, depths ${r.system.min}-${r.system.max}, MACS ${r.system.macs}`);
  out.push(`Chamber allocation: ${r.alloc.map((g, i) =>
    `${r.names[i + 1]} = ${g.map(p => p + 1).join(',')}`).join('; ')}`);
  out.push('');
  r.keys.forEach(k => out.push(`${'  '.repeat(k.depth)}${k.symbol.padEnd(8)} ${formatBitting(k.bitting)}`));
  out.push('');
  out.push('PINNING');
  r.locks.forEach(l => {
    out.push(`${l.symbol}  ${formatBitting(l.bitting)}   (opens to: ${l.chain.concat([l.symbol]).join(', ')})`);
    out.push(`   bottom  ${l.chart.map(c => c.bottom).join(' ')}`);
    out.push(`   master  ${l.chart.map(c => c.masters.length ? c.masters.join('+') : '-').join(' ')}`);
  });
  out.push('');
  out.push(r.audit.violations.length
    ? `WARNING: ${r.audit.violations.length} cross-key violations — do not cut this system.`
    : `Cross-key audit clean over ${r.audit.checked} key/lock pairs.`);
  out.push('Verify against your pinning kit before you load a plug.');
  return out.join('\n');
}

function RENDER_master() {
  const sys = mkSystem();
  const saved = Store.mkSystems();

  $('#masterBody').innerHTML = `
    <h2>Master keying</h2>

    <form class="card" id="mkForm">
      <div class="field"><label>System type</label>
        <div class="seg">
          <button type="button" class="chip${mkUI.mode === 'single' ? ' on' : ''}" data-mkmode="single">Single master</button>
          <button type="button" class="chip${mkUI.mode === 'full' ? ' on' : ''}" data-mkmode="full">Full system</button>
          <button type="button" class="chip${mkUI.mode === 'extend' ? ' on' : ''}" data-mkmode="extend">Existing master</button>
        </div>
      </div>
      <div class="tiny muted" style="margin:6px 0 12px">${
        mkUI.mode === 'single' ? 'One master over a run of change keys, progressed by rotating constant or total position.'
        : mkUI.mode === 'full' ? 'A hierarchy — grand master over masters over change keys — with each level owning its own chambers.'
        : 'A master already in the field. Give it the keys you know about and it works out the layout, then adds changes that will not open a door already out there.'}</div>

      <div class="field"><label>Manufacturer</label>
        <select name="sysId">${Object.values(MK_SYSTEMS).map(s =>
          `<option value="${s.id}"${mkUI.sysId === s.id ? ' selected' : ''}>${esc(s.name)} &mdash; ${esc(s.keyway)}</option>`).join('')}</select>
      </div>
      <div class="tiny muted" style="margin:-4px 0 10px">${esc(sys.note)}</div>

      <div class="row">
        <div class="field"><label>Chambers</label>
          <input name="chambers" type="number" inputmode="numeric" min="4" max="7" value="${sys.chambers}"></div>
        <div class="field"><label>MACS</label>
          <input name="macs" type="number" inputmode="numeric" min="1" max="9" value="${sys.macs}"></div>
      </div>
      <div class="row">
        <div class="field"><label>Shallowest depth</label>
          <input name="min" type="number" inputmode="numeric" min="0" max="9" value="${sys.min}"></div>
        <div class="field"><label>Deepest depth</label>
          <input name="max" type="number" inputmode="numeric" min="0" max="9" value="${sys.max}"></div>
      </div>

      ${mkUI.mode === 'full' ? mkFullFormHtml(sys)
        : mkUI.mode === 'extend' ? mkExtendFormHtml(sys) : `
        <div class="field"><label>Top master key (TMK)</label>
          <input name="tmk" class="mono" inputmode="numeric" autocomplete="off"
            placeholder="${Array(sys.chambers).fill(sys.min + 2 <= sys.max ? sys.min + 2 : sys.min).join('-')}"
            value="${esc(mkUI.tmk)}"></div>

        <div class="field"><label>Progression</label>
          <select name="method">
            <option value="rc"${mkUI.method === 'rc' ? ' selected' : ''}>Rotating constant — safer</option>
            <option value="tpp"${mkUI.method === 'tpp' ? ' selected' : ''}>Total position — more changes</option>
          </select></div>
        <div class="tiny muted" style="margin:-4px 0 10px">${mkUI.method === 'rc'
          ? 'One chamber is held at the master depth, so no change key can turn into an unintended master. The held chamber rotates by group — the first batch holds chamber 1, the next holds chamber 2, and so on.'
          : 'Every chamber progresses. The most changes a master will carry, and the widest incidental exposure.'}</div>

        <div class="field"><label>Change keys</label>
          <input name="count" type="number" inputmode="numeric" min="1" max="500" value="${mkUI.count}"></div>`}

      <div class="field"><label>Job / label</label>
        <input name="label" autocomplete="off" placeholder="Marsh St duplex" value="${esc(mkUI.label)}"></div>

      <button class="btn primary" type="submit">${
        mkUI.mode === 'full' ? 'Build the system'
        : mkUI.mode === 'extend' ? 'Add to this master' : 'Build the schedule'}</button>
    </form>

    ${mkUI.result
      ? (mkUI.mode === 'full' ? mkFullResultHtml(mkUI.result)
         : mkUI.mode === 'extend' ? mkExtendResultHtml(mkUI.result)
         : mkResultHtml(mkUI.result))
      : `<div class="notice info tiny">
      Enter the master bitting you want the system built around. Everything below is
      computed from it &mdash; nothing is looked up, so nothing is guessed. The depth
      range and MACS start at the manufacturer's published figures; change them to
      match the cylinder in your hand.</div>`}

    ${saved.length ? `<h2>Saved systems</h2>${saved.map(s => `
      <div class="card tap vres" data-mkload="${esc(s.id)}">
        <div style="flex:1;min-width:0">
          <div class="nm">${esc(s.label || 'Untitled system')}</div>
          <div class="sub mono">${esc(s.tmk)} &middot; ${esc((MK_SYSTEMS[s.sysId] || {}).name || s.sysId)}
            &middot; ${s.mode === 'full'
              ? `${s.levels}-level system`
              : s.mode === 'extend'
              ? `existing master, +${s.count}`
              : `${s.count} change key${s.count === 1 ? '' : 's'}`}</div>
        </div>
        <div class="go">&rsaquo;</div>
      </div>`).join('')}` : ''}`;

  const form = $('#mkForm');
  form.elements.sysId.addEventListener('change', (e) => { mkPickSystem(e.target.value); RENDER_master(); });
  if (form.elements.method) {
    form.elements.method.addEventListener('change', (e) => { mkUI.method = e.target.value; RENDER_master(); });
  }
  form.addEventListener('submit', (e) => { e.preventDefault(); mkBuild(); });
}

function mkReadForm() {
  const f = $('#mkForm');
  if (!f) return;
  const v = (n) => f.elements[n] ? f.elements[n].value : '';
  const i = (n, d) => { const x = parseInt(v(n), 10); return Number.isFinite(x) ? x : d; };
  Object.assign(mkUI, {
    sysId: v('sysId') || mkUI.sysId,
    chambers: i('chambers', mkUI.chambers), macs: i('macs', mkUI.macs),
    min: i('min', mkUI.min), max: i('max', mkUI.max),
    tmk: v('tmk'), method: v('method') || mkUI.method,
    count: i('count', mkUI.count), label: v('label')
  });
  if (mkUI.mode === 'full') {
    mkUI.counts = mkAlloc().map((_, g) => i('count' + g, (mkUI.counts && mkUI.counts[g]) || 3));
  }
  if (mkUI.mode === 'extend') mkUI.existing = v('existing');
}

/* One place that knows how each mode builds, so building and reloading a saved
   system can never drift apart. */
function mkBuildResult() {
  const system = mkSystem();
  if (mkUI.mode === 'full') {
    return buildFullSystem({ system, tmk: mkUI.tmk, levels: mkUI.levels,
                             alloc: mkAlloc(), counts: mkUI.counts });
  }
  if (mkUI.mode === 'extend') {
    return extendSystem({ system, master: mkUI.tmk, existing: mkExistingLines(), count: mkUI.count });
  }
  return buildSystem({ system, tmk: mkUI.tmk, method: mkUI.method, count: mkUI.count });
}

function mkBuild() {
  mkReadForm();
  if (mkUI.min >= mkUI.max) {
    mkUI.result = { ok: false, errors: ['The shallowest depth has to be less than the deepest.'] };
    RENDER_master();
    return;
  }
  mkUI.result = mkBuildResult();
  mkUI.openKey = null;
  mkUI.openSym = {};
  /* Open the top key so the schedule is not a wall of closed rows. */
  if (mkUI.mode === 'full' && mkUI.result.ok) mkUI.openSym[mkUI.result.root.symbol] = true;
  RENDER_master();
}

function mkResultHtml(r) {
  if (!r.ok) {
    return `<div class="notice err"><strong>Cannot build that.</strong><ul style="margin:6px 0 0 18px">
      ${r.errors.map(e => `<li>${esc(e)}</li>`).join('')}</ul></div>`;
  }

  const short = r.keys.length < r.capacity;
  const warned = r.keys.filter(k => k.warnings.length).length;

  return `
    <h2>The schedule</h2>
    <div class="card">
      <dl class="spec">
        <dt>Master (TMK)</dt><dd class="mono" style="font-size:17px;font-weight:700">${esc(formatBitting(r.tmk))}</dd>
        <dt>System</dt><dd>${esc(r.system.name)} &middot; ${r.system.chambers} chambers &middot;
          depths ${r.system.min}-${r.system.max} &middot; MACS ${r.system.macs}</dd>
        <dt>Progression</dt><dd>${r.method === 'rc' ? 'Rotating constant' : 'Total position'}</dd>
        <dt>Change keys</dt><dd>${r.keys.length} shown${short ? ` of ${r.capacity} this master will carry` : ''}</dd>
      </dl>
    </div>

    ${warned ? `<div class="notice warn tiny"><strong>${warned} lock${warned === 1 ? '' : 's'}
      need${warned === 1 ? 's' : ''} a master pin under the ${r.system.step}-increment minimum.</strong>
      Thin master pins shear under load and pick easily. Open the lock below to see which chamber.</div>` : ''}

    <div class="notice info tiny">Every lock below is pinned to pass the master and its own change key.
      A chamber holding two depths passes either one, so each lock also opens to bittings you did not
      cut &mdash; the "also passes" count. That is master keying, not a fault in the schedule, but it is
      the number to weigh before this goes on a door that matters.</div>

    ${r.keys.map(k => mkKeyHtml(k, r)).join('')}

    <div class="stack" style="margin-top:16px">
      <button class="btn" data-mksave="1">Save this system</button>
      <button class="btn ghost" data-mkcopy="1">Copy the whole schedule</button>
    </div>`;
}

/* Change keys reach this card from two different builders. Only the
   single-master one has a rotating constant, so anything else says what it
   actually knows rather than reading `undefined + 1` out loud. */
function mkKeySubtitle(k) {
  if (k.subtitle) return k.subtitle;
  return k.constant == null ? 'all chambers progress' : `chamber ${k.constant + 1} held`;
}

function mkKeyHtml(k, r) {
  const open = mkUI.openKey === k.n;
  const label = 'CK' + String(k.n).padStart(2, '0');
  return `<div class="card" style="padding:0;overflow:hidden">
    <button class="grp" data-mkopen="${k.n}">
      <span class="grp-name mono">${label} &nbsp; ${esc(formatBitting(k.bitting))}
        <span class="grp-sub">${esc(mkKeySubtitle(k))} &middot; also passes ${k.incidental}</span></span>
      ${k.warnings.length ? '<span class="badge err">THIN</span>' : ''}
      <span class="grp-x">${open ? '&minus;' : '+'}</span>
    </button>
    ${open ? `<div class="grp-body" style="padding:10px">
      <div class="tumwrap"><table class="pinchart">
        <tr><th>Chamber</th>${k.chart.map((_, i) => `<th>${i + 1}</th>`).join('')}</tr>
        <tr><th>Master cut</th>${r.tmk.map(d => `<td>${d}</td>`).join('')}</tr>
        <tr><th>${label} cut</th>${k.bitting.map(d => `<td>${d}</td>`).join('')}</tr>
        <tr class="sep"><th>Bottom pin</th>${k.chart.map(c => `<td class="bot">${c.bottom}</td>`).join('')}</tr>
        <tr><th>Master pin</th>${k.chart.map(c =>
          `<td class="${c.masters.length ? 'mas' : 'none'}">${c.masters.length ? c.masters.join('+') : '&mdash;'}</td>`).join('')}</tr>
      </table></div>
      <div class="tiny muted" style="margin-top:8px">Bottom pin is the shallower of the two cuts; the master
        pin makes up the difference to the deeper one. A dash means both keys share that chamber &mdash; one
        pin, no split. Top pins come from your kit to fill the cylinder.</div>
      ${k.warnings.length ? `<div class="notice warn tiny" style="margin-top:8px">
        ${k.warnings.map(esc).join('<br>')}</div>` : ''}
    </div>` : ''}
  </div>`;
}

function mkSave() {
  mkReadForm();
  if (!mkUI.result || !mkUI.result.ok) return;
  const rec = {
    id: mkUI.loadedId || uid(),
    label: mkUI.label, sysId: mkUI.sysId,
    chambers: mkUI.chambers, min: mkUI.min, max: mkUI.max, macs: mkUI.macs, step: mkUI.step,
    tmk: mkUI.mode === 'full' ? formatBitting(mkUI.result.top)
       : mkUI.mode === 'extend' ? formatBitting(mkUI.result.master)
       : formatBitting(mkUI.result.tmk),
    method: mkUI.method, count: mkUI.count,
    mode: mkUI.mode, levels: mkUI.levels, alloc: mkAlloc(), counts: mkUI.counts,
    existing: mkUI.existing,
    savedAt: new Date().toISOString()
  };
  Store.saveMkSystem(rec);
  mkUI.loadedId = rec.id;
  RENDER_master();
  alert('Saved. It is in the backup file too.');
}

function mkLoad(id) {
  const rec = Store.mkSystems().find(x => x.id === id);
  if (!rec) return;
  Object.assign(mkUI, {
    sysId: rec.sysId, chambers: rec.chambers, min: rec.min, max: rec.max,
    macs: rec.macs, step: rec.step || 2, tmk: rec.tmk, method: rec.method,
    count: rec.count, label: rec.label, loadedId: rec.id, openKey: null,
    mode: rec.mode || 'single', levels: rec.levels || 3,
    alloc: rec.alloc || null, counts: rec.counts || [3, 4], openSym: {},
    existing: rec.existing || ''
  });
  /* Rebuild rather than store the schedule: a saved system is its inputs, so
     the keys can never drift from the math that produced them. */
  mkUI.result = mkBuildResult();
  if (mkUI.mode === 'full' && mkUI.result.ok) mkUI.openSym[mkUI.result.root.symbol] = true;
  RENDER_master();
  window.scrollTo(0, 0);
}

function mkCopy() {
  if (!mkUI.result || !mkUI.result.ok) return;
  const text = mkUI.mode === 'full' ? mkFullText(mkUI.result)
    : mkUI.mode === 'extend' ? mkExtendText(mkUI.result)
    : mkScheduleText(mkUI.result);
  const done = () => alert('Schedule copied.');
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(done, () => mkCopyFallback(text));
  } else mkCopyFallback(text);
}

/* No clipboard permission (or an old webview): show it so it can be selected
   by hand rather than failing silently. */
function mkCopyFallback(text) {
  const host = $('#masterBody');
  const box = document.createElement('div');
  box.className = 'card';
  box.innerHTML = '<div class="tiny muted" style="margin-bottom:6px">Select and copy:</div>'
    + `<textarea rows="12" class="mono" readonly>${esc(text)}</textarea>`;
  host.appendChild(box);
  box.querySelector('textarea').select();
}

/* Plain text, because it has to survive being pasted into a text message to a
   customer or a note on the job. */
function mkScheduleText(r) {
  const lines = [];
  lines.push(`${mkUI.label || 'Master key system'} — ${r.system.name}`);
  lines.push(`TMK  ${formatBitting(r.tmk)}`);
  lines.push(`${r.system.chambers} chambers, depths ${r.system.min}-${r.system.max}, MACS ${r.system.macs}`);
  lines.push(`${r.method === 'rc' ? 'Rotating constant' : 'Total position'} progression`);
  lines.push('');
  r.keys.forEach(k => {
    lines.push(`CK${String(k.n).padStart(2, '0')}  ${formatBitting(k.bitting)}`);
    lines.push(`   bottom  ${k.chart.map(c => c.bottom).join(' ')}`);
    lines.push(`   master  ${k.chart.map(c => c.masters.length ? c.masters.join('+') : '-').join(' ')}`);
  });
  lines.push('');
  lines.push('Bottom pin = shallower cut. Master pin makes up the difference.');
  lines.push('Verify against your pinning kit before you load a plug.');
  return lines.join('\n');
}

/* ======================= tools ======================= */
/* Tools is a launcher now, so it has nothing of its own to draw. */
function RENDER_tools() {}

function RENDER_bcm() {
  const rows = Store.bcmRows();
  $('#bcmCount').textContent = rows.length
    ? `${rows.length} row${rows.length === 1 ? '' : 's'} loaded`
    : 'No conversion table loaded';
}

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
    <dt>Your edits</dt><dd>${ov} vehicle record(s) &middot; ${Object.keys(Store.blankOverrides()).length} blank record(s)</dd>
    <dt>Your tips</dt><dd>${Store.tipCount()}</dd>
    <dt>Master key systems</dt><dd>${Store.mkSystems().length}</dd>
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
  master: (...a) => RENDER_master(...a),
  bcm: (...a) => RENDER_bcm(...a),
  /* The quote and hex screens are pure markup — the listeners bound at boot do
     the work, so there is nothing to render on arrival. */
  quote: () => {},
  hex: () => {},
  settings: (...a) => RENDER_settings(...a)
};

document.addEventListener('click', (e) => {
  const t = e.target.closest('[data-go],[data-vid],[data-editveh],[data-delveh],[data-canceledit],[data-newveh],[data-jobfrom],[data-editjob],[data-deljob],[data-canceljob],[data-newjob],[data-bgroup],[data-bopen],[data-bid],[data-bback],[data-bedit],[data-bdel],[data-bcancel],[data-bmake],[data-bnew],[data-showall],[data-vpic],[data-lopen],[data-vtab],[data-blankfor],[data-tipadd],[data-tipdel],[data-mkopen],[data-mksave],[data-mkcopy],[data-mkload],[data-mkmode],[data-mklevels],[data-mkalloc],[data-mksym]');
  if (!t) return;

  if (t.dataset.go)        { go(t.dataset.go); return; }
  if (t.dataset.showall)   { lookupShowAll = true; RENDER_lookup(); return; }
  if (t.dataset.lopen)     { const k = t.dataset.lopen; lookupOpen[k] = !lookupOpen[k]; RENDER_lookup(); return; }
  if (t.dataset.vpic) {
    const [mk, md, y0, y1] = t.dataset.vpic.split('|');
    go('vehicle');
    editVehicle(null, { make: mk, model: md, yearStart: y0, yearEnd: y1 });
    return;
  }
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
  /* --- blank directory --- */
  if (t.dataset.mkmode)  {
    mkReadForm();
    mkUI.mode = t.dataset.mkmode; mkUI.result = null; mkUI.openSym = {};
    RENDER_master();
    return;
  }
  if (t.dataset.mklevels) {
    mkReadForm();
    mkUI.levels = parseInt(t.dataset.mklevels, 10);
    mkUI.alloc = null;                      // re-split the chambers for the new depth
    mkUI.counts = Array(mkUI.levels - 1).fill(3);
    mkUI.result = null;
    RENDER_master();
    return;
  }
  if (t.dataset.mkalloc) {
    mkReadForm();
    mkAssign(parseInt(t.dataset.mkalloc, 10), parseInt(t.dataset.mkpos, 10));
    return;
  }
  if (t.dataset.mksym)   {
    const k = t.dataset.mksym;
    mkUI.openSym[k] = !mkUI.openSym[k];
    RENDER_master();
    return;
  }
  if (t.dataset.mkopen)  {
    const n = parseInt(t.dataset.mkopen, 10);
    mkUI.openKey = mkUI.openKey === n ? null : n;
    RENDER_master();
    return;
  }
  if (t.hasAttribute('data-mksave')) { mkSave(); return; }
  if (t.hasAttribute('data-mkcopy')) { mkCopy(); return; }
  if (t.dataset.mkload)  { mkLoad(t.dataset.mkload); return; }
  if (t.dataset.vtab)    { vehTab = t.dataset.vtab; vehTipOpen = ''; RENDER_vehicle(vehShown); return; }
  if (t.dataset.tipadd)  {
    vehTipOpen = vehTipOpen === t.dataset.tipadd ? '' : t.dataset.tipadd;
    RENDER_vehicle(vehShown);
    return;
  }
  if (t.dataset.tipdel)  {
    if (confirm('Delete this tip?')) Store.deleteTip(vehShown, t.dataset.tipdelcat, t.dataset.tipdel);
    RENDER_vehicle(vehShown);
    return;
  }
  if (t.dataset.blankfor) {
    /* Jump to the blank whose keyway names the same profile as this vehicle. */
    const want = keyWords(t.dataset.blankfor);
    const hit = Store.blanks().find(b => keyWords(b.keyway).some(w => want.includes(w)));
    blankUI.detail = hit ? hit.id : null;
    blankUI.q = hit ? '' : t.dataset.blankfor.split('/')[0].trim();
    go('blanks');
    return;
  }
  if (t.dataset.bgroup)  { blankUI.group = t.dataset.bgroup; blankUI.open = {}; RENDER_blanks(); return; }
  if (t.dataset.bopen)   { const k = t.dataset.bopen; blankUI.open[k] = !blankUI.open[k]; RENDER_blanks(); return; }
  if (t.dataset.bid)     { blankUI.detail = t.dataset.bid; RENDER_blanks(); return; }
  if (t.hasAttribute('data-bback')) { blankUI.detail = null; RENDER_blanks(); return; }
  if (t.dataset.bnew)    { blankUI.detail = null; editBlank(null); return; }
  if (t.dataset.bedit)   { editBlank(t.dataset.bedit); return; }
  if (t.hasAttribute('data-bcancel')) {
    const back = t.dataset.bcancel;
    blankUI.detail = back || null;
    RENDER_blanks();
    return;
  }
  if (t.dataset.bdel) {
    if (confirm('Delete this blank record?')) { Store.deleteBlank(t.dataset.bdel); blankUI.detail = null; RENDER_blanks(); }
    return;
  }
  /* A make chip on a blank detail jumps to the vehicle lookup filtered to it. */
  if (t.dataset.bmake)   { filter.make = t.dataset.bmake; filter.q = ''; filter.year = ''; go('lookup'); return; }

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
  $('#makeSel').addEventListener('change', (e) => { filter.make = e.target.value; lookupShowAll = false; RENDER_lookup(); });
  $('#yearSel').addEventListener('change', (e) => { filter.year = e.target.value; lookupShowAll = false; RENDER_lookup(); });
  $('#lookupQ').addEventListener('input', (e) => { filter.q = e.target.value; lookupShowAll = false; RENDER_lookup(); });
  $('#lookupClear').addEventListener('click', () => { filter.make = ''; filter.year = ''; filter.q = ''; lookupShowAll = false; RENDER_lookup(); });
  $('#addVehBtn').addEventListener('click', () => { go('vehicle'); editVehicle(null); });

  /* vin */
  $('#vinForm').addEventListener('submit', (e) => { e.preventDefault(); runVinDecode(); });
  $('#vinInput').addEventListener('input', (e) => {
    e.target.value = normalizeVin(e.target.value).slice(0, 17);
    $('#vinLen').textContent = `${e.target.value.length}/17`;
  });

  /* blanks */
  $('#blankQ').addEventListener('input', (e) => {
    blankUI.q = e.target.value;
    blankUI.detail = null;
    RENDER_blanks();
  });
  $('#addBlankBtn').addEventListener('click', () => { blankUI.detail = null; editBlank(null); });

  /* tools */
  $('#bcmForm').addEventListener('submit', (e) => { e.preventDefault(); bcmLookup(); });
  $('#bcmImport').addEventListener('click', async () => {
    try {
      const text = await pickFile('.csv,.txt,text/csv,text/plain');
      const n = importBcmCsv(text, true);
      alert(`Imported ${n} row(s).`);
      RENDER_bcm();
    } catch (err) { alert(err.message); }
  });
  $('#bcmClear').addEventListener('click', () => {
    if (confirm('Clear the loaded BCM table?')) { Store.setBcmRows([]); RENDER_bcm(); $('#bcmOut').innerHTML = ''; }
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
    if (!confirm('Erase every edit, tip, job, key system and BCM row on this device? Export a backup first.')) return;
    if (!confirm('Last chance. This cannot be undone.')) return;
    ['vehicles', 'blanks', 'jobs', 'bcm', 'tips', 'mk', 'prefs'].forEach(k => localStorage.removeItem('keypro:' + k));
    RENDER_settings();
  });

  window.addEventListener('hashchange', routeFromHash);
  routeFromHash();

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
}

/* The tip form is rebuilt on every tab render, so its submit is delegated. */
document.addEventListener('submit', (e) => {
  const f = e.target.closest('.tipform');
  if (!f) return;
  e.preventDefault();
  const text = (f.elements.text.value || '').trim();
  if (!text) return;
  Store.addTip(vehShown, f.dataset.tipcat, text);
  vehTipOpen = '';
  RENDER_vehicle(vehShown);
});

document.addEventListener('DOMContentLoaded', boot);
