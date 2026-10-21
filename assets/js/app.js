/* KeyPro Field — UI + routing. No framework, no build step, no network needed. */

const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const nz = (v, alt = '—') => (v && String(v).trim()) ? v : alt;

/* ======================= routing =======================
   Back has to come back here, not leave. This router called
   history.replaceState and nothing else, so however deep you were the app
   occupied a single history entry and there was nothing underneath it but the
   browser: installed on a phone, the first press of Back closed KeyPro
   outright, mid-job.

   Two changes fix it. A main-menu entry is seeded under whatever the app opens
   on, so Back always has somewhere inside the app to land. And a move to a new
   destination pushes its own entry instead of overwriting the one you are on,
   with one exception: a hop between two bottom-nav tabs replaces, because the
   tabs are all one level deep and Back from any of them should be the main
   menu, not the tab you looked at before it. Drill-downs still push, so Back
   out of a vehicle record returns to the list you found it in -- the moto list
   if that is where you were, not the main menu.

   From the main menu itself Back is let through, because leaving is what Back
   should do there and a spare entry would only make one press do nothing. */
const VIEWS = ['lookup', 'moto', 'vehicle', 'vin', 'blanks', 'tools', 'lishi', 'dealer', 'safe',
               'master', 'bcm', 'quote', 'hex', 'jobs', 'settings'];
/* The view the app opens on, and the one Back works back towards. */
const HOME = 'lookup';
/* The bottom-nav tabs. Every other view is reached from one of them. */
const TABS = ['lookup', 'moto', 'vin', 'blanks', 'tools', 'jobs'];
let current = 'lookup';
/* The hash of the history entry directly beneath the one we are on, known only
   while we put it there -- a Back or Forward press leaves us somewhere this
   cannot account for, so it is cleared and the shortcut below goes quiet until
   the next push. */
let below = '';

let vehShown = '';
function go(view, arg) {
  if (!VIEWS.includes(view)) view = HOME;
  /* Walking back to the entry directly beneath this one -- the on-screen "Back
     to vehicles" button under a record, say -- is the Back button's job. Let
     the browser do it, so this entry is dropped rather than a third copy of the
     list stacked on top of the record you just left, which would have put the
     next press of Back straight back into it. */
  const to = arg ? `#${view}/${encodeURIComponent(arg)}` : `#${view}`;
  if (to !== location.hash && to === below) { history.back(); return; }
  /* Arriving at a different vehicle starts on Overview; re-rendering the one you
     are already reading keeps the tab you are on. */
  if (view === 'vehicle' && arg !== vehShown) { vehTab = 'overview'; vehTipOpen = ''; vehShown = arg; }
  current = view;
  $$('.view').forEach(v => v.classList.toggle('active', v.id === 'view-' + view));
  $$('.nav button').forEach(b => b.classList.toggle('on', b.dataset.go === view));
  const r = RENDER[view];
  if (r) r(arg);
  window.scrollTo(0, 0);
  /* Already here: a re-render, or Back landing on an entry that exists. Either
     way there is no new destination to record. */
  if (location.hash === to) return;
  const from = location.hash.replace(/^#/, '').split('/');
  const sideways = !arg && view !== HOME && TABS.includes(view)
    && from.length === 1 && from[0] !== HOME && TABS.includes(from[0]);
  if (sideways) history.replaceState(null, '', to);
  else { below = location.hash; history.pushState(null, '', to); }
}

function routeFromHash() {
  /* A history traversal put us somewhere this router did not choose, so what is
     underneath is no longer anything it can claim to know. */
  below = '';
  const [v, a] = location.hash.replace(/^#/, '').split('/');
  go(v || HOME, a ? decodeURIComponent(a) : undefined);
}

/* ======================= lookup =======================
   Two catalogs, one renderer. Cars and bikes are different work — different
   blanks, different tooling, different money — and mixing 70 motorcycle records
   into 570 cars meant scrolling past Chevrolet to reach Ducati. Each tab keeps
   its own make / year / search, so switching to check a bike does not throw away
   the car you were part-way through. */
const DOMAINS = {
  auto: {
    view: 'lookup', noun: 'vehicle', backLabel: 'Back to vehicles', firstYear: 1990,
    sel: '#makeSel', year: '#yearSel', q: '#lookupQ', clear: '#lookupClear',
    count: '#lookupCount', results: '#lookupResults'
  },
  moto: {
    view: 'moto', noun: 'machine', backLabel: 'Back to moto', firstYear: 1965,
    sel: '#motoMakeSel', year: '#motoYearSel', q: '#motoQ', clear: '#motoClear',
    count: '#motoCount', results: '#motoResults'
  }
};
/* `body: 'moto'` covers everything that is not a car: bikes, ATVs, side-by-sides,
   PWC and snowmobiles. They share a parts shelf and a tool roll. */
const domainOf = (v) => (v && v.body === 'moto') ? 'moto' : 'auto';
let lookupDomain = 'auto';

const filter = { make: '', year: '', q: '' };
/* `filter` keeps its identity so every reference to it stays live; switching tabs
   parks the current values here and brings the other tab's back. */
const filterMem = { auto: { make: '', year: '', q: '' }, moto: { make: '', year: '', q: '' } };
function setDomain(d) {
  if (d === lookupDomain) return;
  Object.assign(filterMem[lookupDomain], filter);
  lookupDomain = d;
  Object.assign(filter, filterMem[d]);
  resetLookupPaging();
}
const domainVehicles = (d) => Store.vehicles().filter(v => domainOf(v) === (d || lookupDomain));
/* The seed is a few hundred records and grows as the user adds their own, so the
   unfiltered list is capped until they ask for the rest. */
const LOOKUP_CAP = 60;
let lookupShowAll = false;
const INDEX_CAP = 40;
let indexShowAll = false;
/* Both "show all" states belong to the filter that produced them, so changing
   the filter clears both. Kept in one place because it is set from seven. */
function resetLookupPaging() { lookupShowAll = false; indexShowAll = false; }
const lookupOpen = {};

function allMakes() {
  return Array.from(new Set(domainVehicles().map(v => v.make))).sort();
}

/* Punctuation-insensitive form, so "f150" finds "F-150" and "toy44h" finds
   "TOY44H-PT".

   Accents are folded, not dropped. The old version stripped anything outside
   a-z0-9, which turned "Hafele" into "hfele" -- so the one accented name in
   the directory could not be found by typing it the way anyone types it on a
   phone, and the next Citroen or Skoda entry would have gone the same way.
   NFD splits a letter from its accent so the accent alone is removed. */
const squash = (s) => String(s == null ? '' : s)
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .toLowerCase().replace(/[^a-z0-9]+/g, '');

/* Nobody walks up and says "Chevrolet". They say Chevy, and before this the
   search came back empty for it across all 58 Chevrolet records. One map, read
   into the haystack, rather than the same nickname copied onto every record of
   that make -- the same reason Silca and JMA live only on the blank row. */
const MAKE_NICKNAMES = {
  'Chevrolet': 'chevy chev',
  'Volkswagen': 'vw dub',
  'Mercedes-Benz': 'merc benz mercedes',
  'BMW': 'bimmer beemer',
  'Mitsubishi': 'mitsu',
  'Subaru': 'subie',
  'Volvo': 'volvo',
  'Cadillac': 'caddy',
  'Lincoln': 'linc',
  'Oldsmobile': 'olds',
  'Pontiac': 'poncho',
  'Land Rover': 'landrover rover',
  'Harley-Davidson': 'harley hd',
  'Porsche': 'porsche',
  'Chrysler': 'chrysler mopar',
  'Dodge': 'dodge mopar',
  'Ram': 'ram dodge mopar',
  'Plymouth': 'plymouth mopar',
  'Jeep': 'jeep mopar',
  'Toyota': 'toyota',
  'Nissan': 'nissan datsun',
  'Infiniti': 'infiniti nissan',
  'Acura': 'acura honda',
  'Lexus': 'lexus toyota',
  'Genesis': 'genesis hyundai',
};

function vehicleHaystack(v) {
  return [
    v.make, MAKE_NICKNAMES[v.make] || '',
    v.model, (v.aliases || []).join(' '), v.blanks && v.blanks.keyway, v.blanks && v.blanks.ilco,
    v.blanks && v.blanks.silca, v.blanks && v.blanks.jma, v.blanks && v.blanks.oem,
    v.transponder && v.transponder.chip, v.transponder && v.transponder.system,
    (v.remotes || []).map(r => `${r.fcc} ${r.pn}`).join(' ')
  ].join(' ');
}

/* Same story as the blank directory: these strings are identical until a
   record is edited, and rebuilding them for all 835 vehicles on every
   keystroke was most of the cost of typing in the lookup box. Keyed by record
   id against the store's revision, so an edit still takes effect at once. */
let vehHayCache = { rev: -1, map: new Map() };
function vehHay(v) {
  if (vehHayCache.rev !== Store.rev) vehHayCache = { rev: Store.rev, map: new Map() };
  let h = vehHayCache.map.get(v.id);
  if (!h) {
    const hay = vehicleHaystack(v).toLowerCase();
    h = { hay, tight: squash(hay) };
    vehHayCache.map.set(v.id, h);
  }
  return h;
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

  return domainVehicles().filter(v => {
    if (filter.make && v.make !== filter.make) return false;
    if (dropdownYear && !covers(v, dropdownYear)) return false;
    if (years.some(y => !covers(v, y))) return false;
    if (terms.length) {
      const h = vehHay(v);
      if (!terms.every(t => h.hay.includes(t) || h.tight.includes(squash(t)))) return false;
    }
    return true;
  }).sort((a, b) => (a.make + a.model).localeCompare(b.make + b.model) || b.yearStart - a.yearStart);
}

function RENDER_lookup() { setDomain('auto'); renderCatalog(); }
function RENDER_moto()   { setDomain('moto'); renderCatalog(); }

function renderCatalog() {
  const D = DOMAINS[lookupDomain];
  const years = [];
  const thisYear = new Date().getFullYear() + 1;
  for (let y = thisYear; y >= D.firstYear; y--) years.push(y);

  /* Include the active make even when no record uses it yet — otherwise arriving
     from a blank's make chip shows an empty list with no visible filter.
     At 60+ makes this is a dropdown; a chip row filled the whole screen. */
  const makes = Array.from(new Set(allMakes().concat(filter.make ? [filter.make] : []))).sort();
  const makeSel = $(D.sel);
  const wantMakes = makes.join('\u0000');
  if (makeSel.dataset.built !== wantMakes) {
    makeSel.innerHTML = '<option value="">All makes</option>' +
      makes.map(m => `<option value="${esc(m)}">${esc(m)}</option>`).join('');
    makeSel.dataset.built = wantMakes;
  }
  makeSel.value = filter.make;

  const sel = $(D.year);
  if (sel.options.length <= 1) {
    sel.innerHTML = '<option value="">Any year</option>' + years.map(y => `<option value="${y}">${y}</option>`).join('');
  }
  sel.value = filter.year;
  $(D.q).value = filter.q;
  $(D.clear).hidden = !(filter.make || filter.year || filter.q);

  /* Nothing chosen yet? Show the makes, not 500 vehicles. Picking a make is the
     first thing you do on a real call, and a list you have to scroll past to
     start is not a starting point. */
  if (!filter.make && !filter.year && !parseQuery(filter.q).terms.length) {
    return renderMakeIndex();
  }

  const hits = matchVehicles();
  const groups = groupByNameplate(hits);
  const capped = !lookupShowAll && groups.length > LOOKUP_CAP;
  const shown = capped ? groups.slice(0, LOOKUP_CAP) : groups;

  /* Narrowed to a handful of models? Open them — the user has already chosen. */
  const autoOpen = groups.length <= 3;

  const gaps = indexGaps();
  const gapCount = gaps.length;
  $(D.count).textContent = (hits.length
    ? `${hits.length} record${hits.length === 1 ? '' : 's'} in ${groups.length} model${groups.length === 1 ? '' : 's'}`
      + (capped ? ` \u00b7 showing ${LOOKUP_CAP}` : '')
    : '') + (gapCount ? `${hits.length ? ' \u00b7 ' : ''}${gapCount} more in the index` : '');

  $(D.results).innerHTML =
    (filter.make ? `<button class="back" data-allmakes="1">&lsaquo; All makes</button>` : '')
    + (hits.length
      ? shown.map(g => g.rows.length === 1 ? vehicleCardHtml(g.rows[0]) : nameplateHtml(g, autoOpen)).join('')
        + (capped ? `<button class="btn ghost" data-showall="1">Show all ${groups.length} models</button>` : '')
      : (gaps.length ? '' : emptyLookupHtml()))
    + indexGapsHtml(gaps);
}

/* The make index: every make with what it holds, so the first tap narrows a few
   hundred records to a couple of dozen. */
function renderMakeIndex() {
  const D = DOMAINS[lookupDomain];
  const byMake = new Map();
  domainVehicles().forEach(v => {
    if (!byMake.has(v.make)) byMake.set(v.make, { records: 0, models: new Set() });
    const e = byMake.get(v.make);
    e.records++;
    e.models.add(v.model);
  });
  /* A make the index knows but no record covers still belongs on this screen:
     leaving it off is how the catalogue came to look thinner than it is. */
  const idx = (lookupDomain === 'auto' && typeof VPIC_MODELS !== 'undefined') ? VPIC_MODELS : {};
  Object.keys(idx).forEach(mk => { if (!byMake.has(mk)) byMake.set(mk, { records: 0, models: new Set() }); });
  const rows = Array.from(byMake.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  const total = domainVehicles().length;
  const indexTotal = Object.values(idx).reduce((n, m) => n + Object.keys(m).length, 0);

  $(D.count).textContent =
    `${rows.length} makes \u00b7 ${total} record${total === 1 ? '' : 's'}`
    + (indexTotal ? ` \u00b7 ${indexTotal} models indexed` : '');

  $(D.results).innerHTML = `<div class="card" style="padding:0;overflow:hidden">`
    + rows.map(([make, e]) => {
      const known = Object.keys(idx[make] || {}).length;
      return `
      <button class="mkrow" data-pickmake="${esc(make)}">
        <span class="mkrow-nm">${esc(make)}</span>
        <span class="mkrow-n">${e.models.size ? e.models.size + ' model' + (e.models.size === 1 ? '' : 's') : ''}${
          known > e.models.size ? `${e.models.size ? ' &middot; ' : ''}${known} indexed` : ''}</span>
        <span class="mkrow-go">&rsaquo;</span>
      </button>`; }).join('')
    + `</div>`;
}

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
        <div class="nm">${esc(filter.make ? v.model : v.make + ' ' + v.model)}</div>
        <div class="sub">${esc(nz(v.blanks && v.blanks.keyway))} &middot; ${esc(nz(v.transponder && v.transponder.chip))}</div>
      </div>
      <div class="go">&rsaquo;</div>
    </div>`;
}

function nameplateHtml(g, autoOpen) {
  const open = autoOpen || lookupOpen[g.key];
  return `<div class="card" style="padding:0;overflow:hidden">
    <button class="grp" data-lopen="${esc(g.key)}">
      <span class="grp-name">${esc(filter.make ? g.model : g.make + ' ' + g.model)}${g.custom ? ' &middot; YOURS' : ''}
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
/* ======================= the model index =======================
   models.js carries 2,301 make/model pairs harvested from NHTSA vPIC: which
   vehicles exist and what years they ran, and nothing about keys. Until now the
   lookup only reached for it when a search came back with nothing at all, so
   "mercedes" returned the 15 records on file and said nothing about the other
   30 models Mercedes built -- the catalogue looked thin because most of what it
   knows was only wired into the add-vehicle form's autocomplete.

   Those models are now listed under the records, plainly marked as index
   entries with no key record of their own. Several of them do have an answer
   already: the directory holds 23 vintage records, each covering a marque for a
   span of years, and a 1987 Mercury Cougar has been answerable from the Ford
   vintage record the whole time -- there was just no way to type your way to
   it. An index row that one of those records covers now says so and opens it. */

/* Each vintage record names the marques it covers in its own title -- "Most
   Chrysler / Dodge / Plymouth (vintage)" -- so splitting that is reading the
   record rather than second-guessing it. Two name a corporation instead of its
   marques, and those two are spelled out here. Saturn and Geo are deliberately
   left out of the GM list: Saturn had its own keyway, and the Geo cars were
   rebadged Isuzu, Suzuki and Toyota, so the B-series answer would be wrong for
   both. */
const VINTAGE_FAMILY = {
  'gm-vintage-1981-1995':   ['Chevrolet', 'GMC', 'Buick', 'Cadillac', 'Oldsmobile', 'Pontiac'],
  'ford-vintage-1981-1995': ['Ford', 'Mercury', 'Lincoln'],
};
function vintageRecords() {
  const known = Array.from(new Set(Store.vehicles().map(v => v.make)));
  return Store.vehicles().filter(v => /vintage/i.test(v.model)).map(v => ({
    rec: v,
    makes: VINTAGE_FAMILY[v.id]
      || Array.from(new Set([v.make].concat(
           v.model.split(/[\/,]|\band\b/).map(part => {
             const t = part.replace(/\(.*?\)/g, '').replace(/\bmost\b|\bvintage\b/gi, '').trim();
             return known.find(mk => mk.toLowerCase() === t.toLowerCase()
               || mk.toLowerCase().startsWith(t.toLowerCase()) && t.length > 3);
           }).filter(Boolean))))
  }));
}
/* Rebuilt only when the store changes, like the search haystacks. */
let vintageCache = { rev: -1, list: null };
function vintageCovering(make, y0, y1) {
  if (vintageCache.rev !== Store.rev) vintageCache = { rev: Store.rev, list: vintageRecords() };
  const hit = vintageCache.list.find(e => e.makes.includes(make)
    && y0 <= e.rec.yearEnd && y1 >= e.rec.yearStart);
  return hit ? hit.rec : null;
}

/* Index models the current filter matches that no record of their own covers.
   Coverage is judged at the year asked for, not across the whole production
   run, because that is the difference between an answer and a shrug: there is a
   Mercury record naming the Cougar, but it starts in 1995, and "1987 cougar"
   used to come back "no match in your database" even though the Ford vintage
   record has answered it all along. With no year in the query the whole run is
   the window, so browsing still hides models the directory already covers. */
function indexGaps() {
  if (lookupDomain !== 'auto' || typeof VPIC_MODELS === 'undefined') return [];
  const { years, terms } = parseQuery(filter.q);
  const dropdownYear = parseInt(filter.year, 10);
  const wanted = years.concat(dropdownYear ? [dropdownYear] : []);
  const byMake = new Map();
  domainVehicles().forEach(v => {
    if (!byMake.has(v.make)) byMake.set(v.make, []);
    byMake.get(v.make).push(v);
  });
  const out = [];
  Object.entries(VPIC_MODELS).forEach(([mk, models]) => {
    if (filter.make && mk !== filter.make) return;
    const recs = byMake.get(mk) || [];
    Object.entries(models).forEach(([md, yrs]) => {
      const [y0, y1] = yrs;
      if (wanted.some(y => y < y0 || y > y1)) return;
      /* The years the question is actually about. */
      const w0 = wanted.length ? Math.max(y0, Math.min(...wanted)) : y0;
      const w1 = wanted.length ? Math.min(y1, Math.max(...wanted)) : y1;
      if (terms.length) {
        const hay = (mk + ' ' + md + ' ' + (MAKE_NICKNAMES[mk] || '')).toLowerCase();
        const tight = squash(hay);
        /* Chassis designations get typed with the engine letter on the end --
           190E, 300D, 240TD -- and the index calls them 190, 300, 240. A model
           that starts with a digit and runs to three characters or more counts
           as a match when it starts the term. Numbers only, because the first
           version of this let "vanagon" answer with a Mitsubishi Van, and three
           characters at least, or "3" would answer for every BMW ever built. */
        const mdt = squash(md);
        const stem = /^\d/.test(mdt) && mdt.length >= 3 && terms.some(t => squash(t).startsWith(mdt));
        if (!stem && !terms.every(t => hay.includes(t) || tight.includes(squash(t)))) return;
      }
      const n = squash(md);
      const covered = recs.some(r => {
        if (r.yearEnd < w0 || r.yearStart > w1) return false;
        const h = squash(r.model + ' ' + (r.aliases || []).join(' '));
        return h.includes(n) || (n.includes(h) && h.length > 3);
      });
      if (!covered) out.push({ mk, md, y0, y1, via: vintageCovering(mk, w0, w1) });
    });
  });
  return out.sort((a, b) => (a.mk + a.md).localeCompare(b.mk + b.md));
}

function indexGapsHtml(gaps) {
  if (!gaps.length) return '';
  const shown = indexShowAll ? gaps : gaps.slice(0, INDEX_CAP);
  return `<div class="notice info" style="margin-top:14px">${gaps.length} more model${gaps.length === 1 ? '' : 's'}
      in the NHTSA index with no key record of their own. The ones a vintage record
      covers say so; the rest are real vehicles waiting for your notes.</div>`
    + shown.map(h => `
      <div class="card tap vres" data-${h.via ? `vid="${esc(h.via.id)}"` : `vpic="${esc(h.mk)}|${esc(h.md)}|${h.y0}|${h.y1}"`}>
        <div style="flex:1;min-width:0">
          <div class="yr">${h.y0}${h.y1 !== h.y0 ? '&ndash;' + h.y1 : ''} &middot; INDEX</div>
          <div class="nm">${esc(filter.make ? h.md : h.mk + ' ' + h.md)}</div>
          <div class="sub">${h.via
            ? esc(nz(h.via.blanks && h.via.blanks.keyway)) + ' &middot; via ' + esc(h.via.model)
            : 'No key record yet &mdash; tap to add'}</div>
        </div><div class="go">${h.via ? '&rsaquo;' : '+'}</div>
      </div>`).join('')
    + (gaps.length > shown.length
        ? `<button class="btn ghost" data-indexall="1">Show all ${gaps.length} index models</button>` : '');
}

function emptyLookupHtml() {
  /* The NHTSA index is passenger vehicles — it does not carry bikes, ATVs or
     side-by-sides, so under Moto there is nothing honest to offer and the
     fallback stays out of the way. */
  const hits = (lookupDomain === 'auto' && typeof vpicSearch === 'function' && filter.q.trim())
    ? vpicSearch(filter.q, 6) : [];
  if (!hits.length) {
    return `<div class="empty">No match in your database.<br><br>
      <button class="btn btn-sm" data-newveh="1">Add ${lookupDomain === 'moto' ? 'this machine' : 'this vehicle'}</button></div>`;
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
/* One detail screen serves both catalogs, so its Back button has to say which
   one it is going back to. */
function syncVehBack() {
  const btn = $('#vehBack');
  if (!btn) return;
  const D = DOMAINS[lookupDomain];
  btn.dataset.go = D.view;
  btn.innerHTML = '&lsaquo; ' + D.backLabel;
}

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
  /* Opening a record from search, a blank's cross-link or a job puts you in the
     tab that record belongs to, so Back goes where you expect. */
  if (v) setDomain(domainOf(v));
  syncVehBack();
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

/* The FCC grant behind a fob, or null when the ID has not been checked against
   the public record. A missing entry is not a blank field: the record says so,
   because an unverified FCC ID is the one you should not order against. */
function fccGrant(fcc) {
  const k = String(fcc || '').trim().toUpperCase();
  return (k && typeof FCC_GRANTS !== 'undefined' && FCC_GRANTS[k]) || null;
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

    ${(v.aliases || []).length ? `<div class="card muted tiny">Also called
      ${v.aliases.map(a => `<span class="mono">${esc(a)}</span>`).join(', ')} &mdash; the badge or
      platform name a customer is likely to give you on the phone.</div>` : ''}

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
      style="margin-top:-6px">Open ${esc(shortKeyway(b.keyway))} in the blank directory</button>
      <div class="tiny muted" style="margin:6px 2px 0">Silca and JMA cross-references live on the
      blank record &mdash; one row per keyway, so there is only ever one answer to check.</div>` : ''}

    <h2>The transponder</h2>
    ${specList([['Chip', t.chip], ['System', t.system], ['Cloneable', t.cloneable]])}

    <h2>The remotes</h2>
    ${r.length
      ? r.map(x => {
          /* Frequency and grantee are joined from the FCC grant record rather
             than stored per vehicle: the same fob is on eight Fords, and one
             row cannot disagree with itself. */
          const g = fccGrant(x.fcc);
          return specList([['Type', x.type], ['FCC ID', x.fcc, 'mono'],
                           ['Frequency', g && g.freq, 'mono'],
                           ['Grant holder', g && g.mfr],
                           ['Part no.', x.pn, 'mono'], ['Buttons', x.buttons]],
                          { empty: 'Fob details not recorded.' })
            + (x.fcc && !g ? `<div class="card muted tiny" style="margin-top:-6px">This FCC ID
               is not in the verified grant list. Confirm it before ordering.</div>` : '');
        }).join('')
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
    id: '', make: '', model: '', aliases: [], yearStart: '', yearEnd: '', body: 'car',
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
        ${F('aliases', 'Search aliases', (v.aliases || []).join(', '), 'Grand Cherokee L, WL75')}
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
      aliases: f.aliases.split(',').map(x => x.trim()).filter(Boolean),
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
    if (!persisted(Store.saveVehicle(rec))) return;
    go('vehicle', rec.id);
  });
}

/* A save that did not happen must never read as one. localStorage fills up --
   a long job log, an imported BCM table -- and every save path here used to
   say "Saved." whether or not the bytes landed. Wrap each one: the call sites
   read the same, and a failure now stops the flow and says what to do. */
function persisted(ok) {
  if (ok !== false) return true;
  alert(Store.lastError || 'Nothing was saved — this device refused the write.');
  return false;
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
  'SECURITY', 'ASSORTED', 'BLADES', 'DEPOSIT', 'DUAL', 'FIRE', 'DEPARTMENT', 'LOCKER',
  /* A nationality describes a market, not a keyway. Sharing one tells you
     nothing: "British lever lock" matched a vintage exotic whose keyway note
     said "often Fiat or British Leyland family", and "European furniture"
     matched the same car on the word European. */
  'BRITISH', 'EUROPEAN', 'GERMAN', 'ITALIAN', 'FRENCH', 'JAPANESE', 'KOREAN', 'CHINESE',
  'AMERICAN', 'SWEDISH', 'SWISS', 'AUSTRIAN', 'INDIAN', 'ISRAELI', 'AUSTRALIAN',
  'SCANDINAVIAN', 'IMPORT', 'IMPORTED', 'DOMESTIC', 'FOREIGN', 'MARKET',
  /* Prose, not designations. A vehicle keyway that reads "HU101 on the 2017
     car" put a car-wash coin box on a Lincoln, and "Golf cart ignition" put a
     hospital crash cart on a golf cart. Neither word has ever been part of a
     keyway name; both turn up in descriptions constantly. */
  'CAR', 'CARS', 'CART', 'CARTS', 'BAY', 'COIN',
  /* In a key blank directory, "blank" is the one word every row has in common.
     A vintage exotic whose keyway reads "usually a European blank" matched a
     row about sourcing dimple blanks on it. The hedges beside it are prose too. */
  'BLANK', 'BLANKS', 'VARIES', 'USUALLY', 'OFTEN', 'SOMETIMES',
  /* Negation is not evidence. Four vehicle keyways read "not recorded" or
     "not Ford H-series", and they matched a row titled "...and are not" on the
     word NOT alone. The rest are the pronouns and copulas that only appear when
     a field has been written as a sentence instead of a label. */
  'NOT', 'WHAT', 'THEY', 'ARE', 'THAT', 'THIS', 'IS', 'IT', 'AN', 'AS',
  /* ACCESS describes what a lock is for, never which keyway it is. It collided
     once between a gate operator and a reefer panel and was fixed by rewording
     the row; it came back and matched a reefer against a quick-access safe. The
     second time is the signal to fix it here instead of renaming another row. */
  'ACCESS', 'QUICK', 'PANEL', 'PATTERN'
]);
/* A single character is never evidence that two keyways are related. The E in
   "Schlage 101-E-LFIC" matched the E in Can-Am's "D.E.S.S." and put a
   commercial mortise blank on a Sea-Doo. tests/data.test.js has always had
   this guard; the app did not, and the two matchers drifted. */
const keyWords = (s) => String(s || '')
  .replace(/\(.*?\)/g, ' ').toUpperCase().split(/[^A-Z0-9]+/)
  .filter(w => w.length > 1 && !KEY_STOPWORDS.has(w));
const bareTokens = (s) => String(s || '').split(/[\/,]/)
  .map(t => t.replace(/\(.*?\)/g, '').replace(/[^A-Za-z0-9]/g, '').toUpperCase())
  .filter(Boolean);

/* Vehicles in the user's database that take this blank: the keyway names the
   same word, or the vehicle cites this blank's Ilco number. */
function vehiclesForBlank(b) {
  /* A kwUnknown row's label is a make plus a blank number, not a keyway, so
     matching a vehicle on its words would link on the manufacturer's name.
     Those rows join on the catalog number alone. */
  const keys = new Set(b.kwUnknown ? [] : keyWords(b.keyway));
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
  /* Terms matched independently, in any order, the way the vehicle lookup has
     always worked. As one literal substring this box missed "horse trailer" on
     a row called "Horse and livestock trailer" and "scissor lift" on "Scissor
     and boom lift" -- you had to guess the row's exact wording, which is the
     opposite of a search. squash() keeps "toy51" finding "TOY51" and
     "hu100r" finding "HU100R-PT". */
  const terms = q.split(/\s+/).filter(Boolean);
  const rows = blankHaystacks();
  return rows.filter(r => terms.every(t => r.hay.includes(t) || r.flat.includes(squash(t)))).map(r => r.b);
}

/* Joining and lower-casing nine fields across 1224 rows on every keystroke was
   half the cost of typing in this box, and the strings are identical until a
   blank is edited. Built once per revision of the store instead. */
let blankHayCache = { rev: -1, rows: [] };
function blankHaystacks() {
  if (blankHayCache.rev !== Store.rev) {
    blankHayCache = {
      rev: Store.rev,
      rows: Store.blanks().map(b => {
        const hay = [b.keyway, b.ilco, b.ilcoChip, b.silca, b.jma, b.strattec, b.framon, b.cut, b.cat, b.notes]
          .concat(b.makes || []).join(' ').toLowerCase();
        return { b, hay, flat: squash(hay) };
      })
    };
  }
  return blankHayCache.rows;
}

/* Categories sort in the order you meet them on a working day, not A-Z. */
const BLANK_CATS = ['Automotive', 'Powersports', 'Fleet & equipment', 'Utility', 'Residential', 'Commercial', 'Safe & vault', 'Import & uncommon'];
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
  const base = blankUI.group === 'cat'
    ? (a, b) => catRank(a[0]) - catRank(b[0]) || a[0].localeCompare(b[0])
    : (a, b) => a[0].localeCompare(b[0]);
  /* Browsing keeps the working-day order. Searching puts the groups holding a
     confirmed keyway first: a brand search used to bury the one Lockwood
     keyway record under 41 Lockwood blank numbers, because Commercial comes
     before Import & uncommon on an ordinary day and the long tail lives there. */
  const searching = String(blankUI.q || '').trim().length > 0;
  const confirmedIn = (e) => e[1].some(b => !b.kwUnknown) ? 0 : 1;
  const order = searching
    ? (a, b) => confirmedIn(a) - confirmedIn(b) || base(a, b)
    : base;
  /* A confirmed keyway outranks a blank-number row inside its group: searching
     a brand should land on the row you can actually identify from a lock,
     with the catalog's long tail behind it. */
  return new Map(Array.from(g.entries()).sort(order)
    .map(([k, v]) => [k, v.sort((x, y) => (x.kwUnknown ? 1 : 0) - (y.kwUnknown ? 1 : 0)
      || x.keyway.localeCompare(y.keyway))]));
}

function RENDER_blanks() {
  if (blankUI.detail) return renderBlankDetail(blankUI.detail);

  $('#blankQ').value = blankUI.q;
  $('#blankGroupChips').innerHTML = [['cat', 'By category'], ['make', 'By make'], ['cut', 'By cut'], ['az', 'A-Z']]
    .map(([k, label]) => `<button class="chip${blankUI.group === k ? ' on' : ''}" data-bgroup="${k}">${label}</button>`).join('');

  const hits = matchBlanks();
  const groups = groupBlanks(hits);
  $('#blankCount').textContent = `${hits.length} blank${hits.length === 1 ? '' : 's'} in ${groups.size} group${groups.size === 1 ? '' : 's'}`;

  /* A search narrow enough to be readable opens everything; browsing starts
     collapsed. Blank-number rows do not spend that budget: 41 "Lockwood
     A1015xx" rows sit behind the one Lockwood keyway record, and counting them
     pushed a brand search past the limit so it rendered nothing but collapsed
     headers -- the answer was there and invisible.

     The budget was 12, which was sized for a directory a third of this one and
     turned out to hide ordinary searches: "toyota" matches 14 rows, "dimple"
     17, "safe" 20, and every one of them came back as a bare header. 40 keeps
     those open and still closes the queries that match most of the file --
     "edge" has 372 confirmed hits, "key" 335, a bare letter 524.

     The absolute cap keeps a one-letter query from opening all 8,143 rows. It
     was 150, which the Blue Dog import pushed "padlock" (276 rows) and "safe"
     (253) straight past, so both came back as bare headers again. 300 opens
     them and still closes "ilco" (3,238) and "commercial" (3,396). Rendering
     the 276 costs nothing measurable: on a 4x-throttled CPU the last keystroke
     of "padlock" took 64ms with them open against 69ms with them shut. */
  const confirmedHits = hits.filter(b => !b.kwUnknown).length;
  const autoOpen = blankUI.q.trim().length > 0 && confirmedHits <= 40 && hits.length <= 300;

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
          <span class="brow-key mono">${esc(b.keyway)}${b.kwUnknown
            ? '<span class="kwq" title="Blank number, not a keyway">#</span>' : ''}</span>
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
        ${b.kwUnknown ? '<span class="badge warn">Blank number, not a keyway</span>' : ''}
        ${b.custom ? '<span class="badge ok">Your record</span>' : ''}
      </div>
      ${b.kwUnknown ? `<div class="tiny muted" style="margin-top:8px">This row is indexed by its
      Ilco number. The keyway designation is not confirmed, so match it against the number stamped
      on the blank &mdash; do not go looking for <span class="mono">${esc(b.keyway)}</span> on a
      lock.</div>` : ''}
    </div>

    ${b.image ? `<figure class="blank-photo">
      <img src="${esc(b.image)}" alt="${esc(b.imageAlt || `${b.keyway} key blank`)}" loading="lazy">
      ${b.imageSource ? `<figcaption>Reference image: <a href="${esc(b.imageSource)}" target="_blank" rel="noopener">JMA e-catalogue</a></figcaption>` : ''}
    </figure>` : ''}

    <h2>Catalog numbers</h2>
    <div class="card"><dl class="spec">
      <dt>Ilco</dt><dd class="mono">${dash(b.ilco)}</dd>
      <dt>Ilco chip</dt><dd class="mono">${dash(b.ilcoChip)}</dd>
      <dt>Silca</dt><dd class="mono">${dash(b.silca)}</dd>
      <dt>JMA</dt><dd class="mono">${dash(b.jma)}</dd>
      <dt>Strattec</dt><dd class="mono">${dash(b.strattec)}</dd>
      <dt>Framon</dt><dd class="mono">${dash(b.framon)}</dd>
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
        <div class="row">${F('strattec', 'Strattec', b.strattec)}${F('framon', 'Framon', b.framon)}</div>
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
      jma: f.jma, strattec: f.strattec, framon: f.framon, cut: f.cut, cat: f.cat || 'Automotive',
      spaces: parseInt(f.spaces, 10) || '', depths: parseInt(f.depths, 10) || '',
      makes: f.makes.split(',').map(s => s.trim()).filter(Boolean),
      notes: f.notes
    };
    if (!persisted(Store.saveBlank(rec))) return;
    blankUI.detail = rec.id;
    RENDER_blanks();
  });
}

/* ======================= master keying ======================= */
/* The form state, kept out of the DOM so a re-render never loses your inputs. */
const mkUI = {
  sysId: 'schlage', chambers: 6, min: 0, max: 9, macs: 7, step: 2,
  tmk: '', method: 'rc', count: 12,
  mode: 'single',            // 'single' | 'full' | 'extend' | 'sfic'
  existing: '',              // change keys already in the field, one per line
  levels: 3, alloc: null, counts: [3, 4], openSym: {},
  sficSysId: 'a2-7',         // SFIC runs on its own systems, not MK_SYSTEMS
  control: '', opKeys: '', sficCount: 0,
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

/* ---- SFIC: BEST small format interchangeable core ---- */
/* A figure-8 core is pinned for two shear lines, so its system is defined by
   the core family rather than by the manufacturer dropdown the other modes
   use. Depth range, control-lug thickness and total stack are the published
   A2/A4 specifications and are shown rather than offered: change the stack
   height and every chart below it is wrong in a way that still looks like a
   chart. Barrel count is the one real choice, so it picks the 6- or 7-pin
   system instead of editing a field. */
function sficSys() {
  return SFIC_SYSTEMS[mkUI.sficSysId] || SFIC_SYSTEMS['a2-7'];
}

function sficOpLines() {
  return String(mkUI.opKeys || '').split(/[\n;]+/).map(l => l.trim()).filter(Boolean);
}

function mkSficFormHtml() {
  const s = sficSys();
  const eg = Array(s.chambers).fill(0).map((_, i) => s.min + ((i * 2) % (s.max - s.min + 1))).join('-');
  return `
    <div class="field"><label>Core</label>
      <select name="sficSysId">${Object.values(SFIC_SYSTEMS).map(x =>
        `<option value="${x.id}"${mkUI.sficSysId === x.id ? ' selected' : ''}>${esc(x.name)}</option>`).join('')}</select>
    </div>
    <div class="tiny muted" style="margin:-4px 0 10px">${esc(s.note)}</div>

    <div class="card" style="margin:0 0 14px;padding:10px 12px">
      <dl class="spec" style="margin:0">
        <dt>Barrels</dt><dd>${s.chambers}</dd>
        <dt>Depths</dt><dd>${s.min}&ndash;${s.max}, step ${s.step}${s.increment ? ` &middot; ${esc(s.increment)} per increment` : ''}</dd>
        <dt>Control lug</dt><dd>${s.controlAdd} increments &mdash; added to every control key cut</dd>
        <dt>Total stack</dt><dd>${s.totalStack} in every barrel</dd>
      </dl>
    </div>

    <div class="field"><label>Control key <span class="tiny muted">optional</span></label>
      <input name="control" class="mono" inputmode="numeric" autocomplete="off"
        placeholder="${eg}" value="${esc(mkUI.control)}"></div>
    <div class="tiny muted" style="margin:-4px 0 12px">The key that pulls the core out of the
      housing. It is not a key that opens a door, and it cannot be worked out from one &mdash; leave
      it blank and the tool proposes one and says so, which is fine for a new system and wrong for
      cores joining a building that already has its own.</div>

    <div class="field"><label>Master key <span class="tiny muted">optional</span></label>
      <input name="tmk" class="mono" inputmode="numeric" autocomplete="off"
        placeholder="${eg}" value="${esc(mkUI.tmk)}"></div>

    <div class="field"><label>Operating keys <span class="tiny muted">one per line, optional</span></label>
      <textarea name="opKeys" rows="4" class="mono" inputmode="numeric"
        placeholder="${eg}">${esc(mkUI.opKeys)}</textarea></div>
    <div class="tiny muted" style="margin:-4px 0 12px">Change keys already cut. Each one gets its
      own core charted, and they are all tried against each other for cross-keying.</div>

    <div class="field"><label>New change keys wanted</label>
      <input name="sficCount" type="number" inputmode="numeric" min="0" max="60" value="${mkUI.sficCount}"></div>
    <div class="tiny muted" style="margin:-4px 0 4px">Needs the master &mdash; without it there is no
      way to tell which barrels the system holds, so a new key would be a guess at whether it
      cross-keys. Leave it at 0 to just chart the keys you gave.</div>`;
}

/* The chart laid out the way BEST's own code page is: codes down the column,
   stack height at the top, then the segments those differences produce. */
function sficChartHtml(core, r) {
  const s = r.system;
  const ctl = r.effectiveControl;
  const cell = (v) => `<td>${v}</td>`;
  return `<div class="tumwrap"><table class="pinchart">
      <tr><th>Barrel</th>${core.barrels.map((_, i) => `<th>${i + 1}</th>`).join('')}</tr>
      ${core.keys.map(k => `<tr><th>${esc(k.symbol)} cut</th>${k.bitting.map(cell).join('')}</tr>`).join('')}
      ${ctl ? `<tr><th>Control cut${r.control ? '' : ' *'}</th>${ctl.map(cell).join('')}</tr>
        <tr><th>+ ${s.controlAdd} lug</th>${core.barrels.map(b => cell(b.controlCode)).join('')}</tr>
        <tr><th>Total stack</th>${core.barrels.map(() => cell(s.totalStack)).join('')}</tr>` : ''}
      <tr class="sep"><th>Bottom pin</th>${core.barrels.map(b => `<td class="bot">${b.bottom}A</td>`).join('')}</tr>
      <tr><th>Master pins</th>${core.barrels.map(b =>
        `<td class="${b.masters.length ? 'mas' : 'none'}">${b.masters.length
          ? b.masters.map(m => m + 'B').join('+') : '&mdash;'}</td>`).join('')}</tr>
      ${ctl ? `<tr><th>Control pin</th>${core.barrels.map(b => `<td class="ctl">${b.control}B</td>`).join('')}</tr>
        <tr><th>Top pin</th>${core.barrels.map(b => `<td class="topp">${b.top}B</td>`).join('')}</tr>` : ''}
    </table></div>
    <div class="tiny muted" style="margin-top:8px">${ctl
      ? `Loads bottom up, every barrel totalling ${s.totalStack}. The A segment is the bottom pin and
         rides the key; every B segment above it is flat at both ends. The control pin spans from the
         deepest operating cut to the control shear line, and the top pin fills what is left.`
      : `Only the operating half of the stack. Without a control key there is no control pin and no
         top pin &mdash; the core cannot be loaded from this.`}</div>
    ${core.warnings.length ? `<div class="notice warn tiny" style="margin-top:8px">
      ${core.warnings.map(esc).join('<br>')}</div>` : ''}`;
}

function sficCoreHtml(core, r) {
  const open = mkUI.openKey === core.symbol;
  return `<div class="card" style="padding:0;overflow:hidden">
    <button class="grp" data-mkopen="${esc(core.symbol)}">
      <span class="grp-name mono">${esc(core.symbol)} &nbsp; ${esc(formatBitting(core.bitting))}
        <span class="grp-sub">${core.source === 'new' ? 'new' : 'given'} &middot;
          ${core.keys.length} key${core.keys.length === 1 ? '' : 's'} turn${core.keys.length === 1 ? 's' : ''} it
          &middot; also passes ${core.incidental}</span></span>
      ${core.warnings.length ? '<span class="badge err">THIN</span>' : ''}
      <span class="grp-x">${open ? '&minus;' : '+'}</span>
    </button>
    ${open ? `<div class="grp-body" style="padding:10px">${sficChartHtml(core, r)}</div>` : ''}
  </div>`;
}

function mkSficResultHtml(r) {
  if (!r.ok) {
    return `<div class="notice err"><strong>Cannot chart that.</strong><ul style="margin:6px 0 0 18px">
      ${r.errors.map(e => `<li>${esc(e)}</li>`).join('')}</ul></div>`;
  }
  const s = r.system;
  const a = r.audit;

  return `
    <h2>What the keys say</h2>
    ${r.read.known.map(n => `<div class="notice ok tiny">${esc(n)}</div>`).join('')}
    ${r.read.unknown.map(n => `<div class="notice warn tiny">${esc(n)}</div>`).join('')}

    ${r.proposedControl ? `<div class="card">
      <dl class="spec" style="margin:0">
        <dt>Control key *</dt>
        <dd class="mono" style="font-size:17px;font-weight:700">${esc(formatBitting(r.proposedControl))}
          <span class="badge warn" style="margin-left:6px">PROPOSED</span></dd>
      </dl>
      <div class="tiny muted" style="margin-top:8px">Chosen, not read &mdash; it centres the control
        and top pins so neither comes out thin. The app has no way to know what control keys this
        building already uses. Cut cores to this and they will not come out with the facility's
        control key, and the facility's may well pull yours.</div>
    </div>` : ''}

    ${r.parity ? `<div class="card">
      <div class="tiny muted" style="margin-bottom:6px">Depths each barrel can use, read off the
        two-step pattern in the keys you gave:</div>
      <div class="tumwrap"><table class="pinchart">
        <tr><th>Barrel</th>${r.parity.map((_, i) => `<th>${i + 1}</th>`).join('')}</tr>
        <tr><th>Depths</th>${r.parity.map(ds => `<td>${ds.join(' ')}</td>`).join('')}</tr>
      </table></div>
    </div>` : ''}

    ${r.topPins ? `<div class="notice info tiny"><strong>Top pins
      ${r.topPins.map(t => t + 'B').join(' ')} &mdash; the same in every core on this control key.</strong>
      A top pin is the stack height less the control code, so it depends on the control key and
      nothing else. Count them out once for the whole job.</div>` : ''}

    ${a.violations.length
      ? `<div class="notice err"><strong>${a.violations.length} key${a.violations.length === 1 ? '' : 's'}
          open${a.violations.length === 1 ? 's' : ''} a core ${a.violations.length === 1 ? 'it' : 'they'}
          should not.</strong> Do not cut this.
          <ul style="margin:6px 0 0 18px">${a.violations.slice(0, 8).map(v =>
            `<li class="mono tiny">${esc(v.key)} ${esc(formatBitting(v.keyBitting))}
              opens core ${esc(v.core)}</li>`).join('')}</ul></div>`
      : (r.cores.length > 1 ? `<div class="notice ok tiny"><strong>Cross-key audit clean.</strong>
          All ${a.checked} key/core pairs tried. No key opens a core it was not cut for.</div>` : '')}

    ${a.controlAlsoOperates.length ? `<div class="notice warn tiny">
      <strong>The control key also turns the plug on ${a.controlAlsoOperates.join(', ')}.</strong>
      Its cut matches an operating depth at every barrel, so the stack breaks at both shear lines.
      It still pulls the core; it now opens the door as well. Legal, and almost never what was
      intended &mdash; change one cut of the control key and it stops.</div>` : ''}

    ${a.canPull ? `<div class="notice err"><strong>This system's control lug is not thicker than
      its depth range.</strong> An operating key could be cut that reaches the control shear line
      and pulls cores. Check the specs before cutting anything.</div>`
      : `<div class="notice ok tiny">No operating key can reach the control shear line in this
          system: the smallest control code a legal key produces (${s.min} + ${s.controlAdd}) sits
          above the deepest legal operating cut (${s.max}), so no change key can pull a core.</div>`}

    ${r.extend && r.extend.ok && r.extend.conflicts.length ? `<div class="notice ok tiny">
      <strong>${r.extend.conflicts.length}${r.extend.conflicts.length >= 12 ? '+' : ''}
      combination${r.extend.conflicts.length === 1 ? ' was' : 's were'} rejected for cross-keying</strong>
      before the new keys below were accepted.</div>` : ''}

    ${r.extend && r.extend.ok && r.extend.exhausted ? `<div class="notice warn tiny">The master ran
      out of safe change keys before reaching the number asked for.</div>` : ''}

    <h2>${r.cores.length ? `${r.cores.length} core${r.cores.length === 1 ? '' : 's'}` : 'No core to chart'}</h2>
    ${r.cores.length ? r.cores.map(c => sficCoreHtml(c, r)).join('')
      : `<div class="notice info tiny">A control key on its own has nothing to be charted against.
          Add the master or an operating key and the stacks below it can be worked out.</div>`}

    ${r.cores.length ? `<div class="stack" style="margin-top:16px">
      <button class="btn" data-mksave="1">Save this system</button>
      <button class="btn ghost" data-mkcopy="1">Copy the whole schedule</button>
    </div>` : ''}`;
}

function mkSficText(r) {
  const s = r.system;
  const out = [];
  out.push(`${mkUI.label || 'SFIC core pinning'} — ${s.name}`);
  out.push(`${s.chambers} barrels, depths ${s.min}-${s.max}, control lug +${s.controlAdd}, total stack ${s.totalStack}`);
  if (r.effectiveControl) {
    out.push(`CONTROL  ${formatBitting(r.effectiveControl)}${r.control ? '' : '   *** PROPOSED, not read from a core ***'}`);
  } else {
    out.push('CONTROL  not given — the operating half only, this cannot be loaded');
  }
  if (r.master) out.push(`MASTER   ${formatBitting(r.master)}`);
  out.push('');
  r.cores.forEach(c => {
    out.push(`${c.symbol}  ${formatBitting(c.bitting)}   (${c.keys.map(k => k.symbol).join(' + ')} turn it)`);
    out.push(`   bottom   ${c.barrels.map(b => b.bottom + 'A').join(' ')}`);
    out.push(`   master   ${c.barrels.map(b => b.masters.length ? b.masters.map(m => m + 'B').join('+') : '-').join(' ')}`);
    if (r.effectiveControl) {
      out.push(`   control  ${c.barrels.map(b => b.control + 'B').join(' ')}`);
      out.push(`   top      ${c.barrels.map(b => b.top + 'B').join(' ')}`);
    }
    c.warnings.forEach(w => out.push(`   ! ${w}`));
  });
  out.push('');
  out.push(r.audit.violations.length
    ? `WARNING: ${r.audit.violations.length} cross-key violation(s) — do not cut this.`
    : `Cross-key audit clean over ${r.audit.checked} key/core pairs.`);
  if (r.audit.controlAlsoOperates.length) {
    out.push(`WARNING: the control key also turns the plug on ${r.audit.controlAlsoOperates.join(', ')}.`);
  }
  out.push('A segment = bottom pin, rides the key. B segments are flat both ends.');
  out.push('Verify against your pinning kit before you load a core.');
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
          <button type="button" class="chip${mkUI.mode === 'sfic' ? ' on' : ''}" data-mkmode="sfic">SFIC core</button>
        </div>
      </div>
      <div class="tiny muted" style="margin:6px 0 12px">${
        mkUI.mode === 'single' ? 'One master over a run of change keys, progressed by rotating constant or total position.'
        : mkUI.mode === 'full' ? 'A hierarchy — grand master over masters over change keys — with each level owning its own chambers.'
        : mkUI.mode === 'sfic' ? 'A BEST figure-8 interchangeable core, pinned for both shear lines. Give it any of the control, master and operating keys — any one, any two, or all three — and it charts what those allow and says what they cannot tell you.'
        : 'A master already in the field. Give it the keys you know about and it works out the layout, then adds changes that will not open a door already out there.'}</div>

      ${mkUI.mode === 'sfic' ? '' : `
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
      </div>`}

      ${mkUI.mode === 'sfic' ? mkSficFormHtml()
        : mkUI.mode === 'full' ? mkFullFormHtml(sys)
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
        : mkUI.mode === 'sfic' ? 'Chart the cores'
        : mkUI.mode === 'extend' ? 'Add to this master' : 'Build the schedule'}</button>
    </form>

    ${mkUI.result
      ? (mkUI.mode === 'sfic' ? mkSficResultHtml(mkUI.result)
         : mkUI.mode === 'full' ? mkFullResultHtml(mkUI.result)
         : mkUI.mode === 'extend' ? mkExtendResultHtml(mkUI.result)
         : mkResultHtml(mkUI.result))
      : mkUI.mode === 'sfic' ? `<div class="notice info tiny">
      Give whichever of the three keys you have. A control key alone fixes the top of every
      stack; a master or an operating key alone fixes the bottom. Two of them chart a core
      outright, and the tool says in plain words which half it had to choose rather than read.</div>`
      : `<div class="notice info tiny">
      Enter the master bitting you want the system built around. Everything below is
      computed from it &mdash; nothing is looked up, so nothing is guessed. The depth
      range and MACS start at the manufacturer's published figures; change them to
      match the cylinder in your hand.</div>`}

    ${saved.length ? `<h2>Saved systems</h2>${saved.map(s => `
      <div class="card tap vres" data-mkload="${esc(s.id)}">
        <div style="flex:1;min-width:0">
          <div class="nm">${esc(s.label || 'Untitled system')}</div>
          <div class="sub mono">${s.mode === 'sfic'
            ? `${esc((SFIC_SYSTEMS[s.sficSysId] || {}).name || s.sficSysId)}
               &middot; control ${esc(s.control || 'proposed')}`
            : `${esc(s.tmk)} &middot; ${esc((MK_SYSTEMS[s.sysId] || {}).name || s.sysId)}
            &middot; ${s.mode === 'full'
              ? `${s.levels}-level system`
              : s.mode === 'extend'
              ? `existing master, +${s.count}`
              : `${s.count} change key${s.count === 1 ? '' : 's'}`}`}</div>
        </div>
        <button class="iconbtn danger" data-mkdel="${esc(s.id)}"
          aria-label="Delete the saved system ${esc(s.label || 'Untitled system')}"
          title="Delete this saved system">&times;</button>
        <div class="go">&rsaquo;</div>
      </div>`).join('')}` : ''}`;

  const form = $('#mkForm');
  if (form.elements.sysId) {
    form.elements.sysId.addEventListener('change', (e) => { mkPickSystem(e.target.value); RENDER_master(); });
  }
  if (form.elements.sficSysId) {
    form.elements.sficSysId.addEventListener('change', (e) => {
      mkReadForm();
      mkUI.sficSysId = e.target.value;
      mkUI.result = null;
      RENDER_master();
    });
  }
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
  if (mkUI.mode === 'sfic') {
    Object.assign(mkUI, {
      sficSysId: v('sficSysId') || mkUI.sficSysId,
      control: v('control'), opKeys: v('opKeys'),
      sficCount: i('sficCount', mkUI.sficCount)
    });
  }
}

/* One place that knows how each mode builds, so building and reloading a saved
   system can never drift apart. */
function mkBuildResult() {
  const system = mkSystem();
  if (mkUI.mode === 'sfic') {
    return buildSFIC({ system: sficSys(), control: mkUI.control, master: mkUI.tmk,
                       operating: sficOpLines(), count: mkUI.sficCount });
  }
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
  if (mkUI.mode !== 'sfic' && mkUI.min >= mkUI.max) {
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
       : mkUI.mode === 'sfic' ? mkUI.tmk
       : formatBitting(mkUI.result.tmk),
    method: mkUI.method, count: mkUI.count,
    mode: mkUI.mode, levels: mkUI.levels, alloc: mkAlloc(), counts: mkUI.counts,
    existing: mkUI.existing,
    sficSysId: mkUI.sficSysId, control: mkUI.control,
    opKeys: mkUI.opKeys, sficCount: mkUI.sficCount,
    savedAt: new Date().toISOString()
  };
  if (!persisted(Store.saveMkSystem(rec))) return;
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
    existing: rec.existing || '',
    sficSysId: rec.sficSysId || 'a2-7', control: rec.control || '',
    opKeys: rec.opKeys || '', sficCount: rec.sficCount || 0
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
  const text = mkUI.mode === 'sfic' ? mkSficText(mkUI.result)
    : mkUI.mode === 'full' ? mkFullText(mkUI.result)
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

/* The code is normalised the same way here as in the lookup. It was not: the
   lookup strips spaces from both sides, the import deduplicated on the raw
   string, so a file carrying "AB12,1234" and "AB 12,9999" stored both and the
   second -- a different PIN for the same BCM -- could never be reached. A PIN
   you cannot see is not harmless in a table whose whole job is to stop you
   burning an attempt on the module. One key, one row, and the collisions are
   counted so the file can be questioned. */
const bcmKey = (v) => String(v == null ? '' : v).toUpperCase().replace(/\s+/g, '');

function importBcmCsv(text, append) {
  const rows = [];
  text.split(/\r?\n/).forEach(line => {
    const t = line.trim();
    if (!t || /^bcm\b/i.test(t)) return;
    const p = t.split(/[,;\t]/).map(s => s.trim());
    if (p.length >= 2 && p[0] && p[1]) rows.push({ bcm: bcmKey(p[0]), pin: p[1], note: p[2] || '' });
  });
  if (!rows.length) throw new Error('Found no "bcm,pin" rows in that file.');
  const merged = append ? Store.bcmRows().map(r => ({ ...r, bcm: bcmKey(r.bcm) })) : [];
  const have = new Map(merged.map(r => [r.bcm, r.pin]));
  let dupes = 0, conflicts = 0;
  rows.forEach(r => {
    if (!have.has(r.bcm)) { merged.push(r); have.set(r.bcm, r.pin); return; }
    dupes++;
    if (have.get(r.bcm) !== r.pin) conflicts++;
  });
  if (!persisted(Store.setBcmRows(merged))) return { added: 0, dupes: 0, conflicts: 0, failed: true };
  return { added: rows.length - dupes, dupes, conflicts };
}

/* --- small field calculators --- */
/* parseInt stops at the first character it does not like and returns what it
   read so far, which made this tool confidently wrong in two ways: "0x1A" read
   as decimal 0, and "1A" as decimal 1, both shown as real answers. And a
   20-digit hex value -- an ordinary length for transponder data -- came back
   as 1.2089258196146292e+24 with a binary string rounded off past 2^53.

   So: a value must be wholly valid in a base to be read in that base, and the
   conversion runs on BigInt, which is exact at any length. */
const HEX_RE = /^[0-9a-f]+$/i;
const DEC_RE = /^[0-9]+$/;

function runHexDec() {
  const raw = ($('#hexIn').value || '').trim().replace(/[\s_]/g, '');
  if (!raw) { $('#hexOut').innerHTML = ''; return; }
  const h = raw.replace(/^0x/i, '');
  const isHex = HEX_RE.test(h) && h.length <= 64;
  /* An explicit 0x prefix says the value is hex and nothing else. */
  const isDec = !/^0x/i.test(raw) && DEC_RE.test(raw) && raw.length <= 64;

  const fromHex = isHex ? BigInt('0x' + h) : null;
  const fromDec = isDec ? BigInt(raw) : null;
  const em = '&mdash;';

  $('#hexOut').innerHTML = `<div class="card"><dl class="spec">
    <dt>As hex</dt><dd class="mono">${fromHex === null ? em : fromHex.toString(10) + ' dec'}</dd>
    <dt>As decimal</dt><dd class="mono">${fromDec === null ? em : fromDec.toString(16).toUpperCase() + ' hex'}</dd>
    <dt>Binary</dt><dd class="mono" style="word-break:break-all">${fromHex === null
      ? (fromDec === null ? em : fromDec.toString(2)) : fromHex.toString(2)}</dd>
  </dl></div>`
    + (isHex || isDec ? '' : `<div class="notice warn tiny">Not a whole number in either base.
        Hex takes 0-9 and A-F, decimal takes 0-9 &mdash; a value that is only partly valid is
        shown as a dash rather than guessed at.</div>`);
}

/* Every figure on this screen is read back to a customer, so a stray NaN or a
   negative key count is worse here than almost anywhere else in the app. Each
   input is coerced once, at the point of use. */
const money = (v, dflt) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : (dflt || 0);
};

function runQuote() {
  const p = Store.prefs();
  const base = Math.max(0, money($('#qBase').value));
  const keys = Math.max(0, Math.min(99, parseInt($('#qKeys').value, 10) || 0));
  const per = Math.max(0, money($('#qPer').value));
  const prog = Math.max(0, money($('#qProg').value));
  const trip = Math.max(0, money($('#qTrip').value, money(p.rate)));
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
    if (!persisted(Store.saveJob({ id: id || uid(), ...f }))) return;
    $('#jobEditor').innerHTML = '';
    $('#jobListWrap').hidden = false;
    RENDER_jobs();
  });
}

/* Quoting is not enough on its own: Excel and Sheets evaluate a cell whose
   text begins with = + - @ or a control character, quoted or not. The everyday
   casualty is not an attack, it is a phone number -- "+18055550123" opens as a
   broken formula. A leading apostrophe makes the spreadsheet treat it as text
   and is not displayed.

   Plain numbers are left alone, so a negative price stays a number people can
   sum rather than becoming text. */
const CSV_FORMULA = /^[=+\-@\t\r]/;
function csvCell(v) {
  let s = String(v == null ? '' : v);
  if (CSV_FORMULA.test(s) && !/^-?\d+(\.\d+)?$/.test(s)) s = "'" + s;
  return `"${s.replace(/"/g, '""')}"`;
}

function jobsCsv() {
  const cols = ['date', 'customer', 'phone', 'vehicle', 'service', 'keys', 'price', 'status', 'notes'];
  return [cols.join(',')]
    .concat(Store.jobs().map(j => cols.map(c => csvCell(j[c])).join(','))).join('\n');
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
/* ======================= Lishi guide =======================
   A tool-first view of data that already exists elsewhere: the keyway's cut,
   spaces, depths and catalog numbers come off the blank row, and the cars a
   tool opens come off the vehicle records. Nothing here is a second copy, so
   nothing here can drift out of agreement with the rest of the app. */
let lishiOpen = '';
let lishiQ = '';

/* Tool names appear inside prose ("Lishi GM37, or impression"), so a word-
   boundary match on the tool name is how a record is credited to a tool. */
/* RENDER_lishi asks this for the same tool up to three times -- once to
   filter, once to weigh the family, once to draw the row -- across 32 tools.
   That was ninety-six scans of 835 records, each rebuilding the merged
   vehicle list and recompiling a regex, and it made this the slowest screen
   in the app by a factor of five: 170ms for one keystroke. The answer only
   changes when the store does. */
const lishiMentionCache = new Map();
function lishiMentions(tool) {
  if (lishiMentionCache.rev !== Store.rev) {
    lishiMentionCache.clear();
    lishiMentionCache.rev = Store.rev;
  }
  if (lishiMentionCache.has(tool)) return lishiMentionCache.get(tool);
  const re = new RegExp('\\bLishi\\s+' + tool.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i');
  const hits = Store.vehicles().filter(v => {
    const l = v.lock || {};
    return re.test(l.decode || '') || re.test(v.doorUnlock || '')
        || re.test((v.programming || {}).notes || '');
  });
  lishiMentionCache.set(tool, hits);
  return hits;
}

/* The blank rows whose keyway the tool reads, so the guide can show what to cut
   once you have the numbers. */
const lishiBlankCache = new Map();
function lishiBlanks(row) {
  if (lishiBlankCache.rev !== Store.rev) {
    lishiBlankCache.clear();
    lishiBlankCache.rev = Store.rev;
  }
  if (lishiBlankCache.has(row.id)) return lishiBlankCache.get(row.id);
  const want = new Set(String(row.kw).split(/[\/,]/).map(s => s.trim().toUpperCase()).filter(Boolean));
  const hits = Store.blanks().filter(b => String(b.keyway).split(/[\/,]/)
    .some(k => want.has(k.trim().toUpperCase())));
  lishiBlankCache.set(row.id, hits);
  return hits;
}

function RENDER_lishi() {
  $('#lishiTop').hidden = false;
  const rows = SEED_LISHI.slice().sort((a, b) => a.tool.localeCompare(b.tool));
  const q = squash(lishiQ);
  const hits = !q ? rows : rows.filter(r => {
    const hay = squash([r.tool, r.fam, r.kw, r.use].join(' '));
    if (hay.includes(q)) return true;
    /* Searching a make should find the tool, so the cars count as haystack too. */
    return lishiMentions(r.tool).some(v => squash(v.make + ' ' + v.model).includes(q));
  });

  const byFam = new Map();
  hits.forEach(r => {
    if (!byFam.has(r.fam)) byFam.set(r.fam, []);
    byFam.get(r.fam).push(r);
  });
  /* Ordered by how much of your database the family covers, so the tools your
     hand reaches for most sit at the top rather than wherever the alphabet puts
     them. Ties fall back to alphabetical. */
  const famOrder = Array.from(byFam.entries()).map(([fam, list]) => ({
    fam, list: list.slice().sort((a, b) => a.tool.localeCompare(b.tool)),
    n: list.reduce((t, r) => t + lishiMentions(r.tool).length, 0)
  })).sort((a, b) => b.n - a.n || a.fam.localeCompare(b.fam));

  $('#lishiCount').textContent =
    `${hits.length} tool${hits.length === 1 ? '' : 's'}${lishiQ ? ' matching' : ''}`;

  $('#lishiResults').innerHTML = hits.length
    ? famOrder.map(g => `<h2>${esc(g.fam)}</h2>` + g.list.map(r => lishiRowHtml(r)).join('')).join('')
    : `<div class="empty">No tool matches that.</div>`;
}

function lishiRowHtml(r) {
  const open = lishiOpen === r.id;
  const cars = lishiMentions(r.tool);
  const blanks = lishiBlanks(r);
  /* Cut, spaces and depths are the keyway's facts, not the tool's — take them
     from the blank row rather than restating them. */
  const geo = blanks.map(b => [b.cut, b.spaces && b.depths ? `${b.spaces} spaces, ${b.depths} depths` : '']
    .filter(Boolean).join(' · ')).filter(Boolean);
  const byMake = new Map();
  cars.forEach(v => {
    if (!byMake.has(v.make)) byMake.set(v.make, 0);
    byMake.set(v.make, byMake.get(v.make) + 1);
  });

  return `<div class="card" style="padding:0;overflow:hidden">
    <button class="grp" data-lishi="${esc(r.id)}">
      <span class="grp-name">${esc(r.tool)}
        <span class="grp-sub">${esc(r.kw === r.tool ? r.use : r.kw)}</span></span>
      <span class="grp-n">${cars.length}</span>
      <span class="grp-x">${open ? '&minus;' : '+'}</span>
    </button>
    ${open ? `<div class="grp-body" style="padding:var(--s3)">
      <dl class="spec">
        <dt>Reads</dt><dd>${esc(r.kw)}</dd>
        <dt>Works on</dt><dd>${esc(r.use)}</dd>
        ${geo.length ? `<dt>Keyway</dt><dd>${esc(Array.from(new Set(geo)).join('  |  '))}</dd>` : ''}
        ${blanks.length ? `<dt>Cut on</dt><dd>${esc(Array.from(new Set(blanks
            .map(b => b.ilcoChip && b.ilcoChip !== '—' ? b.ilcoChip : b.ilco)
            .filter(x => x && x !== '—'))).join(', ') || '—')}</dd>` : ''}
      </dl>
      ${r.note ? `<div class="tiny" style="margin:var(--s3) 0;line-height:1.6">${esc(r.note)}</div>` : ''}
      ${blanks.length ? `<div class="chips tight">${blanks.map(b =>
        `<button class="chip" data-lishiblank="${esc(b.id)}">${esc(b.keyway)}</button>`).join('')}</div>` : ''}

      <div class="tiny muted" style="margin-top:var(--s3)">Opens in your database</div>
      ${cars.length ? `<div class="chips" style="margin-top:6px">${Array.from(byMake.entries())
          .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
          .map(([mk, n]) => `<button class="chip" data-lishimake="${esc(r.tool)}|${esc(mk)}">${esc(mk)} ${n}</button>`).join('')}</div>`
        : `<div class="tiny muted">No record names this tool yet.</div>`}
    </div>` : ''}
  </div>`;
}

/* Tapping a make on a tool lists just those records, so you can go from
   "I am holding an HU101" to the actual car in two taps. */
function lishiCarsHtml(tool, make) {
  const cars = lishiMentions(tool).filter(v => v.make === make)
    .sort((a, b) => a.model.localeCompare(b.model) || b.yearStart - a.yearStart);
  return `
    <button class="back" data-lishiback="1">&lsaquo; Back to the Lishi guide</button>
    <h2>${esc(tool)} &middot; ${esc(make)}</h2>
    <div class="countline">${cars.length} record${cars.length === 1 ? '' : 's'}</div>
    ${cars.map(v => `
      <div class="card tap vres" data-vid="${esc(v.id)}">
        <div style="flex:1;min-width:0">
          <div class="yr">${v.yearStart}${v.yearEnd !== v.yearStart ? '&ndash;' + v.yearEnd : ''}</div>
          <div class="nm">${esc(v.model)}</div>
          <div class="sub">${esc(nz(v.blanks && v.blanks.keyway))} &middot; ${esc(nz((v.lock || {}).decode))}</div>
        </div>
        <div class="go">&rsaquo;</div>
      </div>`).join('')}`;
}

/* ======================= dealer-only reference =======================
   Grouped by what it means for the job rather than by make, because the first
   question on a call is "can I do this at all". The classifier lives in
   dealer.js and reads only each record's own programming fields, so this view
   holds no list of its own and a new record classifies itself. */
let dealerQ = '';
let dealerOpen = {};

function dealerRows() {
  const q = squash(dealerQ);
  return Store.vehicles().map(v => ({ v, c: classifyAccess(v) }))
    .filter(r => r.c)
    .filter(r => !q || squash([r.v.make, r.v.model, (r.v.transponder || {}).system,
                               r.c.obd, r.c.akl].join(' ')).includes(q))
    .sort((a, b) => (a.v.make + a.v.model).localeCompare(b.v.make + b.v.model)
                 || b.v.yearStart - a.v.yearStart);
}

function RENDER_dealer() {
  $('#dealerTop').hidden = false;
  const rows = dealerRows();
  const byTier = new Map();
  rows.forEach(r => {
    if (!byTier.has(r.c.tier)) byTier.set(r.c.tier, []);
    byTier.get(r.c.tier).push(r);
  });

  $('#dealerQ').value = dealerQ;
  const total = Store.vehicles().length;
  $('#dealerCount').textContent = dealerQ
    ? `${rows.length} record${rows.length === 1 ? '' : 's'} matching`
    : `${rows.length} of ${total} records need a warning`;

  $('#dealerResults').innerHTML = rows.length
    ? DEALER_TIERS.map(t => {
        const list = byTier.get(t.tier) || [];
        if (!list.length) return '';
        /* Searching opens the tiers that matched — a closed section with a
           count is not an answer when you are on the phone. */
        const open = dealerQ ? true : !!dealerOpen[t.tier];
        return `<div class="card" style="padding:0;overflow:hidden">
          <button class="grp" data-dtier="${t.tier}">
            <span class="grp-name">${t.tier} &middot; ${esc(t.name)}
              <span class="grp-sub">${esc(t.sub)}</span></span>
            <span class="grp-n">${list.length}</span>
            <span class="grp-x">${open ? '&minus;' : '+'}</span>
          </button>
          ${open ? `<div class="grp-body">${list.map(r => `
            <button class="brow drow" data-vid="${esc(r.v.id)}">
              <span class="brow-key">${esc(r.v.make)} ${esc(r.v.model)}
                <span class="dyr">${r.v.yearStart}&ndash;${r.v.yearEnd}</span></span>
              <span class="brow-sub dwhy">${r.c.obd ? `<span><b>OBD</b> ${esc(r.c.obd)}</span>` : ''}${r.c.akl ? `<span><b>AKL</b> ${esc(r.c.akl)}</span>` : ''}</span>
              <span class="brow-go">&rsaquo;</span>
            </button>`).join('')}</div>` : ''}
        </div>`;
      }).join('')
    : `<div class="empty">Nothing matches that.<br><br>
        <span class="tiny muted">A record with no match is ordinary OBD work &mdash;
        this screen only lists the ones that need a warning.</span></div>`;
}

/* ======================= safe keys =======================
   Ordered as the call actually goes: work out what you are looking at, then
   whether a key exists, then whether you are allowed. The refusals are a group
   of their own at the bottom rather than scattered, so "not yours to open" is
   one place you can check in front of a customer. */
let safeQ = '';
let safeOpen = '';

function safeRows() {
  const q = squash(safeQ);
  return SEED_SAFE.filter(r => !q || squash([r.name, r.is, r.find, r.path, r.auth].join(' ')).includes(q)
    || (r.bl || []).some(id => {
      const b = Store.blanks().find(x => x.id === id);
      return b && squash([b.keyway, (b.makes || []).join(' ')].join(' ')).includes(q);
    }));
}

function RENDER_safe() {
  $('#safeTop').hidden = false;
  const rows = safeRows();
  $('#safeQ').value = safeQ;
  $('#safeCount').textContent = safeQ
    ? `${rows.length} match${rows.length === 1 ? '' : 'es'}`
    : `${rows.length} to identify · ${rows.filter(r => r.stop).length} you refuse`;

  $('#safeResults').innerHTML = rows.length
    ? SAFE_GROUPS.map(([g, label]) => {
        const list = rows.filter(r => r.group === g);
        if (!list.length) return '';
        return `<h2>${esc(label)}</h2>` + list.map(r => safeRowHtml(r)).join('');
      }).join('')
    : `<div class="empty">Nothing matches that.</div>`;
}

function safeRowHtml(r) {
  const open = safeOpen === r.id || !!safeQ;
  const blanks = (r.bl || []).map(id => Store.blanks().find(x => x.id === id)).filter(Boolean);
  return `<div class="card${r.stop ? ' stopcard' : ''}" style="padding:0;overflow:hidden">
    <button class="grp" data-safe="${esc(r.id)}">
      <span class="grp-name">${r.stop ? '<span class="badge warn">REFER</span> ' : ''}${esc(r.name)}
        <span class="grp-sub">${esc(r.is)}</span></span>
      <span class="grp-x">${open ? '&minus;' : '+'}</span>
    </button>
    ${open ? `<div class="grp-body" style="padding:var(--s3)">
      <dl class="spec">
        ${r.find && r.find !== 'n/a' ? `<dt>Serial</dt><dd>${esc(r.find)}</dd>` : ''}
        <dt>${r.stop ? 'Who owns it' : 'Route to a key'}</dt><dd>${esc(r.path)}</dd>
        <dt>Before you touch it</dt><dd class="${/VERIFY|CONFIRM|Never|Refer|Decline|decline/.test(r.auth) ? 'warnval' : ''}">${esc(r.auth)}</dd>
      </dl>
      ${blanks.length ? `<div class="chips tight" style="margin-top:var(--s3)">${blanks.map(b =>
        `<button class="chip" data-safeblank="${esc(b.id)}">${esc(b.keyway)}</button>`).join('')}</div>` : ''}
    </div>` : ''}
  </div>`;
}

const RENDER = {
  lookup: (...a) => RENDER_lookup(...a),
  moto: (...a) => RENDER_moto(...a),
  vehicle: (...a) => RENDER_vehicle(...a),
  vin: (...a) => RENDER_vin(...a),
  blanks: (...a) => RENDER_blanks(...a),
  tools: (...a) => RENDER_tools(...a),
  lishi: (...a) => RENDER_lishi(...a),
  dealer: (...a) => RENDER_dealer(...a),
  safe: (...a) => RENDER_safe(...a),
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
  const t = e.target.closest('[data-go],[data-vid],[data-editveh],[data-delveh],[data-canceledit],[data-newveh],[data-jobfrom],[data-editjob],[data-deljob],[data-canceljob],[data-newjob],[data-bgroup],[data-bopen],[data-bid],[data-bback],[data-bedit],[data-bdel],[data-bcancel],[data-bmake],[data-bnew],[data-showall],[data-indexall],[data-vpic],[data-lopen],[data-vtab],[data-blankfor],[data-tipadd],[data-tipdel],[data-mkopen],[data-mksave],[data-mkcopy],[data-mkload],[data-mkdel],[data-mkmode],[data-mklevels],[data-mkalloc],[data-mksym],[data-pickmake],[data-allmakes],[data-lishi],[data-lishimake],[data-lishiback],[data-lishiblank],[data-dtier],[data-safe],[data-safeblank]');
  if (!t) return;

  if (t.dataset.go)        { go(t.dataset.go); return; }
  if (t.dataset.showall)   { lookupShowAll = true; renderCatalog(); return; }
  if (t.dataset.indexall)  { indexShowAll = true; renderCatalog(); return; }
  if (t.dataset.lopen)     { const k = t.dataset.lopen; lookupOpen[k] = !lookupOpen[k]; renderCatalog(); return; }
  if (t.dataset.vpic) {
    const [mk, md, y0, y1] = t.dataset.vpic.split('|');
    go('vehicle');
    editVehicle(null, { make: mk, model: md, yearStart: y0, yearEnd: y1 });
    return;
  }
  if (t.dataset.vid)       { go('vehicle', t.dataset.vid); return; }
  if (t.dataset.editveh)   { editVehicle(t.dataset.editveh); return; }
  if (t.dataset.newveh)    { go('vehicle'); editVehicle(null, lookupDomain === 'moto' ? { body: 'moto' } : null); return; }
  if (t.hasAttribute('data-canceledit')) {
    const back = t.dataset.canceledit;
    if (back) go('vehicle', back); else go(DOMAINS[lookupDomain].view);
    return;
  }
  if (t.dataset.delveh) {
    if (confirm('Delete this record for good?')) {
      if (!persisted(Store.deleteVehicle(t.dataset.delveh))) return;
      go('lookup');
    }
    return;
  }
  /* --- blank directory --- */
  if (t.dataset.pickmake) {
    filter.make = t.dataset.pickmake;
    resetLookupPaging();
    renderCatalog();
    window.scrollTo(0, 0);
    return;
  }
  if (t.hasAttribute('data-allmakes')) {
    filter.make = ''; filter.year = ''; filter.q = '';
    resetLookupPaging();
    renderCatalog();
    window.scrollTo(0, 0);
    return;
  }
  if (t.dataset.safe) {
    safeOpen = safeOpen === t.dataset.safe ? '' : t.dataset.safe;
    RENDER_safe();
    return;
  }
  if (t.dataset.safeblank) { blankUI.detail = t.dataset.safeblank; go('blanks'); return; }
  if (t.dataset.dtier) {
    const k = t.dataset.dtier;
    dealerOpen[k] = !dealerOpen[k];
    RENDER_dealer();
    return;
  }
  if (t.dataset.lishi) {
    lishiOpen = lishiOpen === t.dataset.lishi ? '' : t.dataset.lishi;
    RENDER_lishi();
    return;
  }
  if (t.dataset.lishimake) {
    const [tool, mk] = t.dataset.lishimake.split('|');
    $('#lishiTop').hidden = true;
    $('#lishiResults').innerHTML = lishiCarsHtml(tool, mk);
    window.scrollTo(0, 0);
    return;
  }
  if (t.hasAttribute('data-lishiback')) { RENDER_lishi(); window.scrollTo(0, 0); return; }
  if (t.dataset.lishiblank) { blankUI.detail = t.dataset.lishiblank; go('blanks'); return; }
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
    /* A conventional change key is numbered; an SFIC core is named, because
       the cores in one job come from two places and CK03 has to mean the same
       row whether it was given or generated. */
    const raw = t.dataset.mkopen;
    const n = mkUI.mode === 'sfic' ? raw : parseInt(raw, 10);
    mkUI.openKey = mkUI.openKey === n ? null : n;
    RENDER_master();
    return;
  }
  if (t.hasAttribute('data-mksave')) { mkSave(); return; }
  if (t.hasAttribute('data-mkcopy')) { mkCopy(); return; }
  if (t.dataset.mkdel)   {
    /* Store.deleteMkSystem existed from the start and nothing ever called it,
       so saved systems only ever accumulated -- on the one screen where a
       locksmith saves a record per job. */
    const rec = Store.mkSystems().find(x => x.id === t.dataset.mkdel);
    if (!confirm(`Delete the saved system "${(rec && rec.label) || 'Untitled system'}"?`)) return;
    if (!persisted(Store.deleteMkSystem(t.dataset.mkdel))) return;
    if (mkUI.loadedId === t.dataset.mkdel) mkUI.loadedId = null;
    RENDER_master();
    return;
  }
  if (t.dataset.mkload)  { mkLoad(t.dataset.mkload); return; }
  if (t.dataset.vtab)    { vehTab = t.dataset.vtab; vehTipOpen = ''; RENDER_vehicle(vehShown); return; }
  if (t.dataset.tipadd)  {
    vehTipOpen = vehTipOpen === t.dataset.tipadd ? '' : t.dataset.tipadd;
    RENDER_vehicle(vehShown);
    return;
  }
  if (t.dataset.tipdel)  {
    if (confirm('Delete this tip?')
        && !persisted(Store.deleteTip(vehShown, t.dataset.tipdelcat, t.dataset.tipdel))) return;
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
    if (confirm('Delete this blank record?')) {
      if (!persisted(Store.deleteBlank(t.dataset.bdel))) return;
      blankUI.detail = null;
      RENDER_blanks();
    }
    return;
  }
  /* A make chip on a blank detail jumps to the vehicle lookup filtered to it. */
  if (t.dataset.bmake) {
    const mk = t.dataset.bmake;
    const d = Store.vehicles().some(v => v.make === mk && domainOf(v) === 'moto')
           && !Store.vehicles().some(v => v.make === mk && domainOf(v) === 'auto') ? 'moto' : 'auto';
    setDomain(d);
    filter.make = mk; filter.q = ''; filter.year = '';
    go(DOMAINS[d].view);
    return;
  }

  if (t.dataset.jobfrom)   { go('jobs'); editJob(null, t.dataset.jobfrom); return; }
  if (t.dataset.newjob)    { editJob(null); return; }
  if (t.dataset.editjob)   { editJob(t.dataset.editjob); return; }
  if (t.dataset.deljob) {
    if (confirm('Delete this job?')) {
      if (!persisted(Store.deleteJob(t.dataset.deljob))) return;
      $('#jobEditor').innerHTML = '';
      $('#jobListWrap').hidden = false;
      RENDER_jobs();
    }
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
  /* Both catalog toolbars are wired the same way; the domain config says which
     elements belong to which tab. */
  Object.values(DOMAINS).forEach(D => {
    $(D.sel).addEventListener('change', (e) => { filter.make = e.target.value; resetLookupPaging(); renderCatalog(); });
    $(D.year).addEventListener('change', (e) => { filter.year = e.target.value; resetLookupPaging(); renderCatalog(); });
    $(D.q).addEventListener('input', (e) => { filter.q = e.target.value; resetLookupPaging(); renderCatalog(); });
    $(D.clear).addEventListener('click', () => { filter.make = ''; filter.year = ''; filter.q = ''; resetLookupPaging(); renderCatalog(); });
  });
  $('#addVehBtn').addEventListener('click', () => { go('vehicle'); editVehicle(null); });
  /* Adding from the Moto tab starts a moto record, so it lands back in the tab
     you added it from rather than disappearing into the car list. */
  $('#addMotoBtn').addEventListener('click', () => { go('vehicle'); editVehicle(null, { body: 'moto' }); });
  $('#lishiQ').addEventListener('input', (e) => { lishiQ = e.target.value; lishiOpen = ''; RENDER_lishi(); });
  $('#dealerQ').addEventListener('input', (e) => { dealerQ = e.target.value; RENDER_dealer(); });
  $('#safeQ').addEventListener('input', (e) => { safeQ = e.target.value; safeOpen = ''; RENDER_safe(); });

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
      const r = importBcmCsv(text, true);
      if (r.failed) return;
      /* A duplicate code carrying a DIFFERENT PIN is the one worth saying out
         loud -- the file disagrees with itself, and only one of the two can be
         right. The table keeps the first and says how many it passed over. */
      alert(`Imported ${r.added} row(s).`
        + (r.dupes ? `\n${r.dupes} already in the table were skipped.` : '')
        + (r.conflicts ? `\n${r.conflicts} of those gave a DIFFERENT PIN for a code you `
            + `already have. The table kept the one you had — check the file before `
            + `you trust either.` : ''));
      RENDER_bcm();
    } catch (err) { alert(err.message); }
  });
  $('#bcmClear').addEventListener('click', () => {
    if (!confirm('Clear the loaded BCM table?')) return;
    if (!persisted(Store.setBcmRows([]))) return;
    RENDER_bcm();
    $('#bcmOut').innerHTML = '';
  });
  $('#hexIn').addEventListener('input', runHexDec);
  $('#quoteForm').addEventListener('submit', (e) => { e.preventDefault(); runQuote(); });

  /* jobs */
  $('#newJobBtn').addEventListener('click', () => editJob(null));
  $('#jobCsvBtn').addEventListener('click', () => download('keypro-jobs.csv', jobsCsv(), 'text/csv'));

  /* settings */
  $('#setForm').addEventListener('submit', (e) => {
    e.preventDefault();
    if (!persisted(Store.setPrefs({ shop: $('#setShop').value, phone: $('#setPhone').value,
                                    rate: $('#setRate').value }))) return;
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

  /* Opened on a deep link rather than the main menu -- a bookmarked vehicle, a
     shared blank -- so seed the main menu underneath it. Without an entry below
     it the first press of Back has nowhere to go but out, which is the whole
     bug. Opening on the main menu needs no seed: Back there should leave, and a
     spare entry would only make one press do nothing. */
  const opened = /^#[a-z]/.test(location.hash) ? location.hash : '#' + HOME;
  if (opened === '#' + HOME) {
    /* Pin the entry we are on to the route about to render. The start_url
       carries no hash, so without this "" and "#lookup" read as two different
       destinations and the very first render stacked one on the other -- and
       that spare entry made the first press of Back on the main menu do
       nothing at all. */
    history.replaceState(null, '', opened);
  } else {
    history.replaceState(null, '', '#' + HOME);
    history.pushState(null, '', opened);
    below = '#' + HOME;
  }
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
  if (!persisted(Store.addTip(vehShown, f.dataset.tipcat, text))) return;
  vehTipOpen = '';
  RENDER_vehicle(vehShown);
});

/* Build the search indexes while the phone is idle rather than on the first
   letter someone types. Nothing here changes what the app does -- every one
   of these is built on demand anyway -- it only moves about 45ms of joining
   and lower-casing off the first keystroke, which is the one place the delay
   is felt. Guarded so a browser without requestIdleCallback simply keeps the
   old on-demand behaviour. */
function warmCaches() {
  try {
    Store.vehicles().forEach(vehHay);
    Store.blanks();
    blankHaystacks();
    SEED_LISHI.forEach(r => { lishiMentions(r.tool); lishiBlanks(r); });
  } catch (e) { /* warming is an optimisation; never let it break boot */ }
}

document.addEventListener('DOMContentLoaded', () => {
  boot();
  if (typeof requestIdleCallback === 'function') requestIdleCallback(warmCaches, { timeout: 3000 });
  else setTimeout(warmCaches, 1200);
});
