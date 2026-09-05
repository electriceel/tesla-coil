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

/* ordering is what keeps a schedule cuttable: nearest the parent first, deeper
   on a tie, so no level walks itself down to an uncut key */
eq('ordered from 2 (schlage)', M.orderedCandidates(2, sc), [4,0,6,8]);
eq('ordered from 4 (schlage)', M.orderedCandidates(4, sc), [6,2,8,0]);
eq('ordered from 2 (kwikset)', M.orderedCandidates(2, kw), [4,6]);
eq('ordered set matches the unordered set',
   M.orderedCandidates(5, sc).slice().sort((a,b)=>a-b), M.candidateDepths(5, sc));

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

/* ==================== full multi-level systems ==================== */

eq('symbols, 2 level', [M.topSymbol(2), M.childSymbol('A', 1, 0, 2), M.childSymbol('A', 1, 1, 2)],
   ['A', 'AA', 'AB']);
eq('symbols, 3 level', [M.topSymbol(3), M.childSymbol('A', 1, 0, 3), M.childSymbol('AA', 2, 0, 3), M.childSymbol('AA', 2, 4, 3)],
   ['A', 'AA', 'AA1', 'AA5']);
eq('symbols, 4 level', [M.topSymbol(4), M.childSymbol('GGM', 1, 0, 4), M.childSymbol('A', 2, 1, 4), M.childSymbol('AB', 3, 2, 4)],
   ['GGM', 'A', 'AB', 'AB3']);

eq('default allocation splits the chambers', M.defaultAllocation(5, 3), [[0,1],[2,3,4]]);
eq('default allocation, 6 chambers 4 levels', M.defaultAllocation(6, 4), [[0,1],[2,3],[4,5]]);
eq('overlapping chambers rejected',
   M.validateAllocation([[0,1],[1,2]], 5, kw).length > 0, true);
eq('empty level rejected', M.validateAllocation([[0,1],[]], 5, kw).length > 0, true);

const sys3 = M.buildFullSystem({ system: sc, tmk: '2-4-2-4-2-4', levels: 3, counts: [3, 4] });
eq('3-level builds', sys3.ok, true);
eq('3-level names', sys3.names, ['Grand master', 'Master key', 'Change key']);
eq('3-level key symbols',
   sys3.keys.map(k => k.symbol).join(','),
   'A,AA,AA1,AA2,AA3,AA4,AB,AB1,AB2,AB3,AB4,AC,AC1,AC2,AC3,AC4');
eq('3-level lock count', sys3.locks.length, 12);

/* every key in the chain must turn every lock beneath it */
eq('GM opens every lock', sys3.locks.every(l => M.opensLock(sys3.top, l.chart)), true);
eq('each MK opens its own locks', sys3.locks.every(l => {
  const mk = sys3.keys.find(k => k.symbol === l.chain[l.chain.length - 1]);
  return M.opensLock(mk.bitting, l.chart);
}), true);
eq('each CK opens its own lock', sys3.locks.every(l => M.opensLock(l.bitting, l.chart)), true);

/* and nothing opens a door above its level */
eq('3-level audit is clean', sys3.audit.violations, []);
eq('3-level audit actually checked pairs', sys3.audit.checked, sys3.keys.length * sys3.locks.length);

/* a chamber carrying three depths stacks two master pins */
eq('deep chain stacks master pins',
   sys3.locks[0].chart.some(c => c.masters.length >= 1), true);
eq('every lock passes MACS on its own key',
   sys3.locks.every(l => M.macsOk(l.bitting, sc.macs)), true);
eq('locks know how many keys open them', sys3.locks[0].keysThatOpen, 3);

/* the tree has to be walkable, not just the flat list — every child a real node */
const walkable = (n) => !n ? false
  : (n.children || []).every(c => c && Array.isArray(c.children) && walkable(c));
eq('tree is walkable to the leaves', walkable(sys3.root), true);
eq('leaves carry empty child arrays, not holes',
   sys3.root.children.every(mk => mk.children.length === 4 && mk.children.every(ck =>
     ck && ck.children.length === 0)), true);

/* 4-level, the full house */
const sys4 = M.buildFullSystem({ system: sc, tmk: '2-4-2-4-2-4', levels: 4, counts: [2, 2, 3] });
eq('4-level builds', sys4.ok, true);
eq('4-level top symbol', sys4.keys[0].symbol, 'GGM');
eq('4-level lock count', sys4.locks.length, 12);
eq('4-level chain length', sys4.locks[0].chain.length, 3);
eq('4-level: every ancestor opens the lock', sys4.locks.every(l => {
  const chainKeys = l.chain.map(sym => sys4.keys.find(k => k.symbol === sym));
  return chainKeys.every(k => M.opensLock(k.bitting, l.chart));
}), true);
eq('4-level audit is clean', sys4.audit.violations, []);

/* Kwikset has fewer depths, so the same shape has to still hold */
const kwSys = M.buildFullSystem({ system: kw, tmk: '2-4-2-4-2', levels: 3, counts: [2, 3] });
eq('kwikset 3-level builds', kwSys.ok, true);
eq('kwikset audit is clean', kwSys.audit.violations, []);
eq('kwikset keys all legal',
   kwSys.keys.every(k => M.macsOk(k.bitting, kw.macs)
     && k.bitting.every(d => d >= kw.min && d <= kw.max)), true);

/* an allocation that double-books a chamber must not silently build */
eq('bad allocation refuses to build',
   M.buildFullSystem({ system: sc, tmk: '2-4-2-4-2-4', levels: 3, alloc: [[0,1],[1,2]], counts: [2,2] }).ok,
   false);

/* deliberately broken allocation: if a level owned no chamber of its own the
   audit is what would catch it, so prove the audit can actually fail */
const collide = {
  keys: [{ symbol: 'A', bitting: [2, 2] }, { symbol: 'AA', bitting: [4, 2] }, { symbol: 'AB', bitting: [4, 4] }],
  locks: [{ symbol: 'AA', bitting: [4, 2], chain: ['A'],
            chart: [M.pinChamber([2, 4]), M.pinChamber([2, 2, 4])] }]
};
eq('audit catches a key that should not open a lock',
   M.auditSystem(collide.keys, collide.locks).violations.map(v => v.key), ['AB']);

/* ============ extending a system that already exists ============ */

/* read the layout back off keys in hand */
const an = M.analyzeExisting([2,2,2,2,2], [[4,2,4,2,4],[6,2,6,2,6]], kw);
eq('reads which chambers progress', an.progressing, [0,2,4]);
eq('reads which chambers are held', an.held, [1,3]);
eq('reads a two-step system', an.step, 2);

const an1 = M.analyzeExisting([2,2,2,2,2], [[3,2,2,2,2]], kw);
eq('reads a one-step system', an1.step, 1);
eq('one-step gets called out', an1.notes.some(n => n.includes('one-step')), true);

const anBad = M.analyzeExisting([2,2,2,2,2], [[4,2,4,2],[2,2,2,2,2],[4,4,4,4,4]], kw);
eq('short key rejected', anBad.rejected.some(r => r.why.includes('5 cuts')), true);
eq('the master itself rejected', anBad.rejected.some(r => r.why.includes('master itself')), true);
eq('good keys still counted', anBad.good.length, 1);

/* the cross-key predicate itself */
eq('a key between master and change opens that lock',
   M.opensPair([4,2,2,2,2], [2,2,2,2,2], [4,4,2,2,2]), true);
eq('a key off the pair does not',
   M.opensPair([6,2,2,2,2], [2,2,2,2,2], [4,4,2,2,2]), false);

/* extending: new keys must not touch what is already in the field */
const ext = M.extendSystem({
  system: kw, master: '2-2-2-2-2',
  existing: ['4-2-4-2-4', '6-2-6-2-6'], count: 6
});
eq('extend builds', ext.ok, true);
eq('extend keeps the original layout', ext.positions, [0,2,4]);
eq('extend only progresses those chambers',
   ext.keys.every(k => k.bitting[1] === 2 && k.bitting[3] === 2), true);
eq('extend never repeats an existing key',
   ext.keys.every(k => !['4-2-4-2-4','6-2-6-2-6'].includes(k.bitting.join('-'))), true);
eq('extend never repeats the master',
   ext.keys.every(k => k.bitting.join() !== '2,2,2,2,2'), true);
eq('extend keys are MACS legal',
   ext.keys.every(k => M.macsOk(k.bitting, kw.macs)), true);

/* the point of the whole thing: no cross-keying, either direction */
const fieldKeys = [[4,2,4,2,4],[6,2,6,2,6]];
eq('no new key opens a lock in the field',
   ext.keys.every(k => !fieldKeys.some(e => M.opensPair(k.bitting, ext.master, e))), true);
eq('no key in the field opens a new lock',
   ext.keys.every(k => !fieldKeys.some(e => M.opensPair(e, ext.master, k.bitting))), true);
eq('the new keys do not cross-key each other',
   ext.keys.every((a, i) => ext.keys.every((b, j) =>
     i === j || !M.opensPair(a.bitting, ext.master, b.bitting))), true);
eq('the master still opens every new lock',
   ext.keys.every(k => M.opensLock(ext.master, k.chart)), true);
eq('each new key opens its own lock',
   ext.keys.every(k => M.opensLock(k.bitting, k.chart)), true);

/* with nothing to read, every chamber is fair game */
const bare = M.extendSystem({ system: kw, master: '2-2-2-2-2', existing: [], count: 5 });
eq('no existing keys means all chambers progress', bare.positions, [0,1,2,3,4]);
eq('bare extend still produces legal keys',
   bare.keys.length === 5 && bare.keys.every(k => M.macsOk(k.bitting, kw.macs)), true);

/* a one-step system in the field is matched, not overridden */
const oneStep = M.extendSystem({ system: sc, master: '3-3-3-3-3-3', existing: ['4-3-3-3-3-3'], count: 4 });
eq('one-step extension uses step 1', oneStep.step, 1);
eq('one-step extension only moves the chamber the field key moved',
   oneStep.keys.every(k => k.bitting.slice(1).join() === '3,3,3,3,3'), true);

/* a bad master is refused before anything is generated */
eq('extend refuses a master it cannot cut',
   M.extendSystem({ system: kw, master: '1-6-1-6-1', existing: [], count: 3 }).ok, false);

/* running out of room is reported, not faked */
const tight = M.extendSystem({ system: kw, master: '2-2-2-2-2', existing: [], count: 200 });
eq('exhaustion is reported', tight.exhausted, true);

console.log(fail ? `\n${fail} FAILED` : '\nall master-key math checks passed');
process.exit(fail ? 1 : 0);
