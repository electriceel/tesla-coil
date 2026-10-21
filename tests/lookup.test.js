/* The lookup's reach into the NHTSA model index.
   models.js knows 2,301 make/model pairs; data.js has key records for a few
   hundred of them. What matters is that a locksmith typing a real vehicle gets
   the record that answers it, which for anything from the eighties and early
   nineties means the maker's vintage record rather than a record of its own.

   app.js is loaded for real rather than reimplemented here. The last time a
   test wrote its own copy of a matcher, the data went on passing while the
   shipped matcher drifted, and the drift was the bug. */
const fs = require('fs');
const path = require('path');
const read = (p) => fs.readFileSync(path.join(__dirname, '..', p), 'utf8');

let fail = 0;
const check = (name, ok, detail) => {
  if (ok) { console.log('  ok  ' + name); return; }
  fail++; console.log('FAIL ' + name + (detail ? '\n     ' + detail : ''));
};

/* app.js is a browser script: it touches the DOM only inside functions, so it
   evaluates fine against stubs as long as the globals it closes over exist. */
function loadApp() {
  const { SEED_VEHICLES, SEED_BLANKS } = require('../assets/js/data.js');
  const models = new Function(read('assets/js/models.js') + '\n;return { VPIC_MODELS };')();
  let rev = 1;
  const Store = {
    get rev() { return rev; },
    vehicles: () => SEED_VEHICLES,
    blanks: () => SEED_BLANKS,
    prefs: () => ({}), jobs: () => [], tips: () => ({}), mkSystems: () => [], bcmRows: () => [],
  };
  const noop = () => {};
  const el = () => ({ value: '', textContent: '', innerHTML: '', dataset: {}, options: [],
                      hidden: false, addEventListener: noop, dispatchEvent: noop, click: noop });
  const document = {
    querySelector: el, querySelectorAll: () => [], createElement: el,
    addEventListener: noop, body: el(), documentElement: el()
  };
  const src = read('assets/js/app.js')
    + '\n;return { indexGaps, vintageCovering, vintageRecords, VINTAGE_FAMILY, filter, setDomain, parseQuery };';
  return new Function('document', 'window', 'Store', 'VPIC_MODELS',
                      'localStorage', 'navigator', 'location', 'history', 'alert', 'confirm', 'console', src)(
    document, { addEventListener: noop, scrollTo: noop, matchMedia: () => ({ matches: false, addEventListener: noop }) },
    Store, models.VPIC_MODELS,
    { getItem: () => null, setItem: noop, removeItem: noop },
    { onLine: true, serviceWorker: { register: () => ({ catch: noop }) } },
    { hash: '#lookup', href: '' }, { replaceState: noop, pushState: noop, back: noop },
    noop, () => true, { warn: noop, error: noop, log: noop });
}

const app = loadApp();
check('app.js loads outside a browser', !!app && typeof app.indexGaps === 'function');

/* ---- the vintage records cover the marques they name ---- */
const fam = app.vintageRecords();
check('every vintage record is picked up', fam.length >= 20, fam.length + ' records');
check('and each covers at least its own make',
  fam.every(e => e.makes.includes(e.rec.make)),
  fam.filter(e => !e.makes.includes(e.rec.make)).map(e => e.rec.id).join(', '));
/* Read straight out of the record titles -- "Most Chrysler / Dodge / Plymouth
   (vintage)" means those three, and if a title is reworded without the marque
   names the derivation has to stop claiming them. */
const covers = (id, mk) => {
  const e = fam.find(x => x.rec.id === id);
  return !!e && e.makes.includes(mk);
};
[['chrysler-vintage-1981-1995', 'Dodge'], ['chrysler-vintage-1981-1995', 'Plymouth'],
 ['vw-audi-vintage-1981-1994', 'Audi'], ['volvo-saab-vintage-1981-1994', 'Saab'],
 ['isuzu-suzuki-vintage-1981-1994', 'Suzuki'], ['honda-vintage-1981-1995', 'Acura'],
 ['nissan-datsun-vintage-1981-1994', 'Datsun'], ['fiat-alfa-vintage-1981-1995', 'Alfa Romeo'],
 ['exotic-vintage-1981-1995', 'Lamborghini'], ['exotic-vintage-1981-1995', 'Lotus'],
 ['gm-vintage-1981-1995', 'Pontiac'], ['gm-vintage-1981-1995', 'Oldsmobile'],
 ['ford-vintage-1981-1995', 'Mercury'], ['ford-vintage-1981-1995', 'Lincoln']]
  .forEach(([id, mk]) => check(`${id} covers ${mk}`, covers(id, mk)));
/* Saturn had its own keyway and the Geo cars were rebadged Isuzu, Suzuki and
   Toyota, so handing either the GM B-series answer would be wrong. */
check('the GM vintage record does not claim Saturn or Geo',
  !covers('gm-vintage-1981-1995', 'Saturn') && !covers('gm-vintage-1981-1995', 'Geo'));
/* A marque list is only worth anything if it names makes the app uses. */
const makes = new Set(require('../assets/js/data.js').SEED_VEHICLES.map(v => v.make));
const unknown = fam.flatMap(e => e.makes.filter(m => !makes.has(m)));
check('every marque a vintage record claims is a make the app knows',
  !unknown.length, unknown.join(', '));

/* ---- a year the records miss still finds an answer ---- */
const ask = (q, make) => {
  app.setDomain('auto');
  app.filter.make = make || ''; app.filter.year = ''; app.filter.q = q || '';
  return app.indexGaps();
};
const find = (gaps, mk, md) => gaps.find(g => g.mk === mk && g.md === md);

/* The Mercury record naming the Cougar starts in 1995. Before this the lookup
   judged coverage across the whole production run, so "1987 cougar" came back
   "no match in your database" while the Ford vintage record had the answer. */
const cougar87 = find(ask('1987 cougar'), 'Mercury', 'Cougar');
check('"1987 cougar" reaches the index', !!cougar87);
check('and is answered by the Ford vintage record',
  cougar87 && cougar87.via && cougar87.via.id === 'ford-vintage-1981-1995',
  cougar87 && cougar87.via && cougar87.via.id);
/* The same model in a year the Mercury record does cover must NOT be offered
   as an index gap, or every real record would be shadowed by a second row. */
check('"2000 cougar" is left to the record that covers it',
  !find(ask('2000 cougar'), 'Mercury', 'Cougar'));

[['190e', 'Mercedes-Benz', '190', 'mercedes-vintage-1981-1994'],
 ['vanagon', 'Volkswagen', 'Vanagon', 'vw-audi-vintage-1981-1994'],
 ['starion', 'Mitsubishi', 'Starion', 'mitsubishi-vintage-1981-1994'],
 ['1989 240', 'Volvo', '240 Series', 'volvo-saab-vintage-1981-1994']]
  .forEach(([q, mk, md, via]) => {
    const hit = find(ask(q), mk, md);
    check(`"${q}" reaches ${mk} ${md}`, !!hit);
    check(`  and names ${via}`, hit && hit.via && hit.via.id === via, hit && hit.via && hit.via.id);
  });

/* "190E" is typed with the engine letter; the index calls it 190. The stem rule
   that allows that is deliberately numeric-only -- the first version let
   "vanagon" answer with a Mitsubishi Van. */
check('a word query does not stem-match a shorter model',
  !find(ask('vanagon'), 'Mitsubishi', 'Van') && !find(ask('vanagon'), 'Nissan', 'Van'));

/* ---- the index obeys the filters, and short names do not get swallowed ---- */
/* A plain substring test let records swallow models they have nothing to do
   with: the Chevrolet SS vanished into "Expre-SS- / GMC Savana", the Chrysler
   TC into "Mos-tC-hrysler", the C4 and C8 into a Kodiak record that mentions
   C4500-C8500. All four are real vehicles and all four were invisible. */
[['Chevrolet', 'SS'], ['Chrysler', 'TC']]
  .forEach(([mk, md]) => check(`${mk} ${md} is not swallowed by a longer name`,
    !!find(ask('', mk), mk, md)));
/* And the prefix rule that keeps real coverage working still does. */
[['Ford', 'F-350'], ['Mazda', 'CX-5'], ['Honda', 'CR-V'], ['Acura', 'RDX'],
 ['Chevrolet', 'Corvette']]
  .forEach(([mk, md]) => check(`${mk} ${md} is still left to its record`,
    !find(ask('', mk), mk, md)));

/* Brackets separate names rather than being stripped, so "Corvette (C5/C6)"
   covers both generations. vPIC's own C5, C6 and C7 under Chevrolet are
   1981-1993 trucks and nothing to do with a Corvette, so they stay listed --
   with the GM vintage record as their answer, which is the right one. */
const c5 = find(ask('', 'Chevrolet'), 'Chevrolet', 'C5');
check('the 1981-93 Chevrolet C5 is listed, not mistaken for a Corvette',
  !!c5 && c5.y1 < 1997, c5 && c5.y0 + '-' + c5.y1);
check('and the GM vintage record answers it',
  c5 && c5.via && c5.via.id === 'gm-vintage-1981-1995', c5 && c5.via && c5.via.id);

/* The make filter and the query have to agree. emptyLookupHtml used to run its
   own index search that ignored the make, so McLaren plus "metro" answered
   with a Geo Metro and a Chevrolet Metro. */
check('the make filter is honoured by the index', !ask('metro', 'McLaren').length,
  ask('metro', 'McLaren').map(g => g.mk + ' ' + g.md).join(', '));
check('and a model that make does build still comes back',
  !!find(ask('720', 'McLaren'), 'McLaren', '720S'));
/* Read the code, not the comment above it that explains why the call went. */
const appCode = read('assets/js/app.js').replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/^\s*\/\/.*$/gm, ' ');
check('the old filter-blind fallback is gone from app.js', !/vpicSearch\s*\(/.test(appCode));

/* ---- the index is clean ---- */
/* vPIC matches a make name as a substring, so the first harvest asked for
   "Geo" and got Peugeot's 405 (PEU-GEO-T), asked for "Mini" and got Mack, Pete
   and KW. Asking by make ID and vehicle type fixed it; these are the entries
   that were there and must not come back. */
const IDX = new Function(read('assets/js/models.js') + '\n;return VPIC_MODELS;')();
[['Mini', 'Mack'], ['Mini', 'Pete'], ['Mini', 'KW'], ['Mini', 'Brockway Mini Homes'],
 ['Ram', 'B17 Bomber'], ['Smart', 'Beverage Industry'], ['Geo', '505'], ['Ford', 'Milford Pipe & Supply']]
  .forEach(([mk, md]) => check(`the index no longer files "${md}" under ${mk}`,
    !(IDX[mk] || {})[md]));
check('and it carries the marques it was missing',
  ['McLaren', 'Geo', 'Peugeot', 'Bugatti', 'Lancia', 'Maybach', 'VinFast', 'Fisker']
    .every(mk => IDX[mk] && Object.keys(IDX[mk]).length),
  ['McLaren', 'Geo', 'Peugeot', 'Bugatti', 'Lancia', 'Maybach', 'VinFast', 'Fisker']
    .filter(mk => !IDX[mk]).join(', '));
/* Motorcycles are a separate catalogue with its own tab. Honda sold 53 bikes
   in 2015 alongside four cars, and listing them here made the gap look several
   times worse than it is. */
check('and no motorcycles came in with the cars',
  !(IDX['Honda'] || {})['Gold Wing'] && !(IDX['Suzuki'] || {})['GSX-R750']
  && !(IDX['BMW'] || {})['R 18']);
/* A body-builder registering a chassis under its own company name is not a
   vehicle anyone cuts a key for. */
const companyish = Object.entries(IDX).flatMap(([mk, m]) => Object.keys(m)
  .filter(md => /trailer|manufactur|\bllc\b|\binc\b|corporation|welding/i.test(md))
  .map(md => mk + ' / ' + md));
check('and no body-builder company names are filed as models', !companyish.length,
  companyish.slice(0, 6).join(', '));

/* ---- the index does not swamp the records ---- */
const empty = ask('');
check('browsing with no filter still offers the index', empty.length > 500, empty.length + ' models');
const silverado = ask('silverado');
check('a well-covered search stays mostly records', silverado.length <= 5,
  silverado.map(g => g.mk + ' ' + g.md).join(', '));

/* ---- the wiring is actually in the view ---- */
const appSrc = read('assets/js/app.js');
check('the catalogue renders the index under the records',
  /\+ indexGapsHtml\(gaps, hits\.length > 0\);/.test(appSrc));
check('and the make index counts what the index knows',
  /\$\{indexTotal\} models indexed/.test(appSrc));
check('and an index row that a record answers opens that record',
  /data-\$\{h\.via \? `vid="\$\{esc\(h\.via\.id\)\}"`/.test(appSrc));

console.log(fail ? `\n${fail} FAILED`
  : `\nall lookup checks passed  (${fam.length} vintage records, ${empty.length} index models with no record)`);
process.exit(fail ? 1 : 0);
