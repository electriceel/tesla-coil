const M = require('../assets/js/master.js');
let fail = 0;
const eq = (name, got, want) => {
  const g = JSON.stringify(got), w = JSON.stringify(want);
  if (g !== w) { console.log('FAIL', name, '\n  got ', g, '\n  want', w); fail++; }
  else console.log('  ok ', name);
};

/* --- the textbook chamber: master cut 2, change key cut 4 ---
   bottom #2, master #2. */
eq('chamber 2 & 4', M.pinChamber([2, 4]), { depths:[2,4], bottom:2, masters:[2], deepest:4 });
eq('chamber 4 & 2 (order does not matter)', M.pinChamber([4, 2]), { depths:[2,4], bottom:2, masters:[2], deepest:4 });
eq('chamber same depth = no master pin', M.pinChamber([5, 5]), { depths:[5], bottom:5, masters:[], deepest:5 });
eq('three depths stack two masters', M.pinChamber([2, 6, 4]), { depths:[2,4,6], bottom:2, masters:[2,2], deepest:6 });
eq('deep master, shallow change', M.pinChamber([8, 2]), { depths:[2,8], bottom:2, masters:[6], deepest:8 });

/* --- MACS --- */
eq('schlage MACS 7 ok',   M.macsOk([1,8,1,8,1,8], 7), true);
eq('schlage MACS 7 broken', M.macsOk([0,8,0,8,0,8], 7), false);
eq('kwikset MACS 4 broken', M.macsOk([1,6,1,6,1], 4), false);
eq('MACS 7 exactly is legal', M.macsViolations([2,2,9,2,2], 7), []);   // |2-9| = 7, not over
eq('violation index', M.macsViolations([0,8,0,1,1], 7), [1,2]);        // |0-8| = 8, twice

/* --- two-step candidates keep parity and never repeat the master --- */
const sc = M.MK_SYSTEMS.schlage, kw = M.MK_SYSTEMS.kwikset;
eq('schlage candidates from 4', M.candidateDepths(4, sc), [0,2,6,8]);
eq('schlage candidates from 5', M.candidateDepths(5, sc), [1,3,7,9]);
eq('kwikset candidates from 2', M.candidateDepths(2, kw), [4,6]);
eq('kwikset candidates from 1', M.candidateDepths(1, kw), [3,5]);

/* --- capacity: product of per-chamber candidates --- */
// Kwikset 2-2-2-2-2: each chamber can go to 4 or 6 => 2^5 = 32
eq('kwikset TPP capacity', M.capacity([2,2,2,2,2], kw, 'tpp'), 32);
// rotating constant: 5 chambers x 2^4 held-out combinations = 80
eq('kwikset RC capacity', M.capacity([2,2,2,2,2], kw, 'rc'), 80);

/* --- every generated change key must be legal --- */
const built = M.buildSystem({ system: kw, tmk: '2-2-2-2-2', method: 'tpp', count: 40 });
eq('build ok', built.ok, true);
eq('build respects MACS and range',
   built.keys.every(k => M.macsOk(k.bitting, kw.macs)
     && k.bitting.every(d => d >= kw.min && d <= kw.max)), true);
eq('no change key equals the master',
   built.keys.every(k => k.bitting.join() !== built.tmk.join()), true);
eq('every change key is unique',
   new Set(built.keys.map(k => k.bitting.join())).size, built.keys.length);

/* --- the master must actually operate every lock it generated --- */
const opens = (key, chart) => chart.every((c, i) => c.depths.includes(key[i]));
eq('master opens every lock', built.keys.every(k => opens(built.tmk, k.chart)), true);
eq('change key opens its own lock', built.keys.every(k => opens(k.bitting, k.chart)), true);

/* --- rotating constant really does hold one chamber --- */
const rc = M.buildSystem({ system: kw, tmk: '2-2-2-2-2', method: 'rc', count: 30 });
eq('RC holds its constant chamber',
   rc.keys.every(k => k.constant !== null && k.bitting[k.constant] === rc.tmk[k.constant]), true);
eq('RC locks need no master pin in the constant chamber',
   rc.keys.every(k => k.chart[k.constant].masters.length === 0), true);

/* --- incidental count: 2^(chambers that differ) - 2 --- */
const one = M.buildSystem({ system: kw, tmk: '2-2-2-2-2', method: 'tpp', count: 1 }).keys[0];
eq('incidental for a 5-chamber TPP lock', one.incidental, 30); // 2^5 - 2

/* --- validation catches real mistakes --- */
eq('wrong length rejected',
   M.buildSystem({ system: kw, tmk: '2-2-2', method: 'tpp', count: 5 }).ok, false);
eq('out of range rejected',
   M.buildSystem({ system: kw, tmk: '2-2-2-2-9', method: 'tpp', count: 5 }).ok, false);
eq('MACS-breaking master rejected',
   M.buildSystem({ system: kw, tmk: '1-6-1-6-1', method: 'tpp', count: 5 }).ok, false);

/* --- bitting parsing --- */
eq('parse dashes', M.parseBitting('1-4-6-2-3'), [1,4,6,2,3]);
eq('parse bare digits', M.parseBitting('14623'), [1,4,6,2,3]);
eq('parse spaces', M.parseBitting('1 4 6 2 3'), [1,4,6,2,3]);
eq('parse array passthrough', M.parseBitting([1,4,6]), [1,4,6]);

/* --- schlage 6-pin end to end --- */
const s6 = M.buildSystem({ system: sc, tmk: '3-5-3-5-3-5', method: 'tpp', count: 25 });
eq('schlage builds', s6.ok && s6.keys.length === 25, true);
eq('schlage keys all legal',
   s6.keys.every(k => M.macsOk(k.bitting, sc.macs) && k.bitting.length === 6), true);
eq('schlage master opens all', s6.keys.every(k => opens(s6.tmk, k.chart)), true);

console.log(fail ? `\n${fail} FAILED` : '\nall master-key math checks passed');
process.exit(fail ? 1 : 0);
