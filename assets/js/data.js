/* ===========================================================================
   KeyPro Field — seed reference data
   ---------------------------------------------------------------------------
   THIS IS STARTER DATA, NOT GOSPEL. Every record is marked `verified:false`
   until a human confirms it against the vehicle, the OEM key catalog or the
   machine's own database. The app treats this file as a seed: anything the
   user adds or edits in Garage > Edit lives in localStorage and overrides the
   matching seed record by `id`.

   Field notes on the shape of a record are in autopro/README.md.
   =========================================================================== */

const SEED_VERSION = '2026.09.05';

/* --- Vehicle reference ---------------------------------------------------- */
const SEED_VEHICLES = [
  /* ---------------- FORD / LINCOLN ---------------- */
  {
    id: 'ford-f150-2015-2020', make: 'Ford', model: 'F-150', yearStart: 2015, yearEnd: 2020, body: 'truck',
    blanks: { keyway: 'HU101', ilco: 'HU101-PT', silca: 'FO21T', jma: 'FO-24.P', oem: '164-R8134 / 5923293' },
    transponder: { chip: 'ID49 (Hitag Pro)', system: 'PATS / IPC', cloneable: 'No — OEM or Hitag-Pro capable cloner only' },
    remotes: [
      { type: 'prox', fcc: 'M3N-A2C31243300', pn: '164-R8109', buttons: '4B / 5B w/ remote start' },
      { type: 'flip', fcc: 'N5F-A08TAA', pn: '164-R8130', buttons: '4B (base trim)' }
    ],
    lock: { codeSeries: 'Ford 10-cut (HU101)', spaces: 10, depths: 4, cutMethod: 'Laser / sidewinder — 2-track', decode: 'Decode door lock or read code from dealer w/ proof of ownership' },
    programming: { obd: 'Yes — 2 working keys allow onboard add. 1 key or AKL needs OBD tool + security wait.', onboard: '2 working keys: insert/turn cycle. Prox: 2 fobs in cup holder sequence.', allKeysLost: 'OBD, 10-min security access on most tools', pinRequired: 'No PIN — timed security access', notes: 'Push-to-start trims have an emergency blade (HU101) hidden in the fob.' },
    obdPort: 'Driver side, under dash, left of the steering column',
    doorUnlock: 'Wedge top-corner of driver door + long reach to the interior lock switch. Watch the side-curtain airbag on Super Crew.',
    verified: false
  },
  {
    id: 'ford-f150-2004-2014', make: 'Ford', model: 'F-150', yearStart: 2004, yearEnd: 2014, body: 'truck',
    blanks: { keyway: 'H92 / H84', ilco: 'H92-PT', silca: 'FO21T', jma: 'FO-21.P2', oem: '5913441 / H92-PT' },
    transponder: { chip: '4D-63 (80-bit from 2011; 40-bit 2004-2010)', system: 'PATS', cloneable: 'Yes — 40-bit clones easily; 80-bit needs a capable cloner' },
    remotes: [{ type: 'fob', fcc: 'CWTWB1U331 / CWTWB1U345', pn: '8L3Z-15K601-B', buttons: '4B' }],
    lock: { codeSeries: 'Ford 8-cut (H75 series)', spaces: 8, depths: 5, cutMethod: 'Edge cut', decode: 'Door lock decodes with a 8-cut Ford tryout set or lishi FO38' },
    programming: { obd: 'Yes', onboard: '2 working keys: insert key 1, on/off, key 2 within 5s, on/off, new key within 10s — chime confirms.', allKeysLost: 'OBD + 10-min timed access', pinRequired: 'No', notes: '80-bit vs 40-bit split is roughly the 2011 model year — verify with a chip reader before you cut.' },
    obdPort: 'Driver side, under dash, left of the steering column',
    doorUnlock: 'Wedge and long reach, or the H75 tryout set on the door.',
    verified: false
  },
  {
    id: 'ford-focus-2012-2018', make: 'Ford', model: 'Focus', yearStart: 2012, yearEnd: 2018, body: 'car',
    blanks: { keyway: 'HU101', ilco: 'HU101-PT', silca: 'FO21T', jma: 'FO-24.P', oem: '164-R8046' },
    transponder: { chip: '4D-63 80-bit', system: 'PATS', cloneable: 'Yes with an 80-bit capable cloner' },
    remotes: [{ type: 'flip', fcc: 'KR55WK48801', pn: '164-R8042', buttons: '4B integrated flip' }],
    lock: { codeSeries: 'HU101 10-cut', spaces: 10, depths: 4, cutMethod: 'Laser / sidewinder', decode: 'Lishi HU101 on the driver door' },
    programming: { obd: 'Yes', onboard: '2 working keys — insert/turn cycle', allKeysLost: 'OBD + timed access', pinRequired: 'No', notes: '' },
    obdPort: 'Driver side, under dash, left of the steering column',
    doorUnlock: 'Lishi HU101 is faster than forcing a wedge on this door seal.',
    verified: false
  },

  /* ---------------- GM (CHEVY / GMC / BUICK / CADILLAC) ---------------- */
  {
    id: 'chevy-silverado-2007-2013', make: 'Chevrolet', model: 'Silverado 1500', yearStart: 2007, yearEnd: 2013, body: 'truck',
    blanks: { keyway: 'B111 (GM 10-cut)', ilco: 'B111-PT', silca: 'GM39RT', jma: 'GM-37.P', oem: '15912286' },
    transponder: { chip: 'GM Circle Plus (PK3+)', system: 'Passlock / PK3+', cloneable: 'Yes — widely cloned' },
    remotes: [{ type: 'fob', fcc: 'OUC60270 / OUC60221', pn: '20952474', buttons: '4B / 5B' }],
    lock: { codeSeries: 'GM 10-cut (B111)', spaces: 10, depths: 4, cutMethod: 'Edge cut, 10-cut', decode: 'Lishi GM37 on the door, or read the code off the lock cylinder code tag' },
    programming: { obd: 'Yes', onboard: '30-min relearn: key on 10 min until security light stops flashing, cycle off/on, repeat 3x', allKeysLost: '30-min x3 onboard relearn works with no tool', pinRequired: 'No', notes: 'The 3x10 minute relearn is free but slow — budget 35 minutes on site.' },
    obdPort: 'Driver side, under dash, left of the steering column',
    doorUnlock: 'Lishi GM37, or wedge + reach to the pillar lock rod.',
    verified: false
  },
  {
    id: 'chevy-silverado-2014-2019', make: 'Chevrolet', model: 'Silverado 1500', yearStart: 2014, yearEnd: 2019, body: 'truck',
    blanks: { keyway: 'B119 (GM 10-cut, HU100-ish profile)', ilco: 'B119-PT', silca: 'GM45', jma: 'GM-40.P', oem: '13500223 / 13504199' },
    transponder: { chip: 'GM 46E (Hitag2 / PCF7937E)', system: 'Immobilizer 2 / Passive Entry on prox trims', cloneable: 'Limited — usually programmed, not cloned' },
    remotes: [
      { type: 'fob', fcc: 'M3N-32337100', pn: '13577770', buttons: '5B / 6B' },
      { type: 'prox', fcc: 'M3N-32337200', pn: '13508398', buttons: '5B prox (High Country / LTZ)' }
    ],
    lock: { codeSeries: 'GM 10-cut (B119)', spaces: 10, depths: 4, cutMethod: 'Edge cut, 10-cut', decode: 'Lishi HU100 / GM45 on the driver door' },
    programming: { obd: 'Yes', onboard: '30-min relearn available on blade-key trims', allKeysLost: 'OBD, or 30-min x3 relearn on non-prox', pinRequired: 'No — some tools want the VIN for the seed', notes: 'Prox trims: add-a-fob is quick; AKL needs the security relearn.' },
    obdPort: 'Driver side, under dash, left of the steering column',
    doorUnlock: 'Lishi HU100. Watch the door film on 2016+.',
    verified: false
  },
  {
    id: 'chevy-malibu-2013-2015', make: 'Chevrolet', model: 'Malibu', yearStart: 2013, yearEnd: 2015, body: 'car',
    blanks: { keyway: 'HU100', ilco: 'B116-PT', silca: 'GM45', jma: 'GM-40.P', oem: '13500223' },
    transponder: { chip: 'GM 46E (Hitag2)', system: 'Immobilizer 2', cloneable: 'No — program it' },
    remotes: [{ type: 'fob', fcc: 'OHT01060512', pn: '13584829', buttons: '4B / 5B' }],
    lock: { codeSeries: 'GM HU100 10-cut', spaces: 10, depths: 4, cutMethod: 'Edge cut', decode: 'Lishi HU100' },
    programming: { obd: 'Yes', onboard: '30-min x3 relearn', allKeysLost: '30-min relearn or OBD', pinRequired: 'No', notes: '' },
    obdPort: 'Driver side, under dash',
    doorUnlock: 'Lishi HU100', verified: false
  },

  /* ---------------- TOYOTA / LEXUS / SCION ---------------- */
  {
    id: 'toyota-camry-2007-2011', make: 'Toyota', model: 'Camry', yearStart: 2007, yearEnd: 2011, body: 'car',
    blanks: { keyway: 'TOY44D', ilco: 'TOY44D-PT', silca: 'TOY48', jma: 'TP00TOYO-15.P', oem: '89785-08020 (dot chip)' },
    transponder: { chip: '4D-67 (dot) / 4D-72 G on 2010+', system: 'Toyota immobilizer', cloneable: 'Dot chip clones; G chip needs a G-capable cloner' },
    remotes: [
      { type: 'fob', fcc: 'GQ43VT20T', pn: '89742-06020', buttons: '4B separate fob' },
      { type: 'prox', fcc: 'HYQ14AAB', pn: '89904-06041', buttons: 'Smart key on XLE / Hybrid' }
    ],
    lock: { codeSeries: 'TOY48 / TOY44D', spaces: 10, depths: 4, cutMethod: 'Laser / sidewinder', decode: 'Lishi TOY48 on the door' },
    programming: { obd: 'Yes', onboard: 'Yes on blade-key trims — the classic ignition-cycle + door-cycle dance', allKeysLost: 'OBD; some need a reset via the immobilizer box', pinRequired: 'No', notes: 'Confirm dot vs G chip before you cut — the G chip is stamped "G" on the key head.' },
    obdPort: 'Driver side, under dash, left of the steering column',
    doorUnlock: 'Lishi TOY48 is the clean way in. Wedge and reach works but the seal marks easily.',
    verified: false
  },
  {
    id: 'toyota-camry-2012-2017', make: 'Toyota', model: 'Camry', yearStart: 2012, yearEnd: 2017, body: 'car',
    blanks: { keyway: 'TOY44H (H chip 2013+)', ilco: 'TOY44H-PT', silca: 'TOY48', jma: 'TP00TOYO-15.P', oem: '89785-0D140 (H)' },
    transponder: { chip: '8A / H chip (128-bit AES) 2013+, G chip 2012', system: 'Toyota immobilizer', cloneable: 'No for H — must be programmed' },
    remotes: [{ type: 'prox', fcc: 'HYQ14FBA', pn: '89904-06140', buttons: '4B smart key' }],
    lock: { codeSeries: 'TOY48', spaces: 10, depths: 4, cutMethod: 'Laser / sidewinder', decode: 'Lishi TOY48' },
    programming: { obd: 'Yes', onboard: 'Limited — H-chip AKL often needs the 16-min immobilizer reset', allKeysLost: 'OBD + 16-minute security wait on most tools', pinRequired: 'No, but many tools need the seed/PIN read first', notes: 'H-chip Toyotas are where cheap clone tools quit. Bring the good tool.' },
    obdPort: 'Driver side, under dash',
    doorUnlock: 'Lishi TOY48 on the door; smart-key trims hide a TOY48 emergency blade in the fob.',
    verified: false
  },
  {
    id: 'toyota-tacoma-2016-2023', make: 'Toyota', model: 'Tacoma', yearStart: 2016, yearEnd: 2023, body: 'truck',
    blanks: { keyway: 'TOY44H', ilco: 'TOY44H-PT', silca: 'TOY48', jma: 'TP00TOYO-15.P', oem: '89785-0D140' },
    transponder: { chip: '8A / H chip', system: 'Toyota immobilizer', cloneable: 'No' },
    remotes: [{ type: 'prox', fcc: 'HYQ14FBA', pn: '89904-04100', buttons: '3B / 4B smart key' }],
    lock: { codeSeries: 'TOY48', spaces: 10, depths: 4, cutMethod: 'Laser / sidewinder', decode: 'Lishi TOY48' },
    programming: { obd: 'Yes', onboard: 'No', allKeysLost: 'OBD + 16-min wait', pinRequired: 'No', notes: '' },
    obdPort: 'Driver side, under dash', doorUnlock: 'Lishi TOY48', verified: false
  },

  /* ---------------- HONDA / ACURA ---------------- */
  {
    id: 'honda-accord-2008-2012', make: 'Honda', model: 'Accord', yearStart: 2008, yearEnd: 2012, body: 'car',
    blanks: { keyway: 'HO01 / HO03', ilco: 'HO01-PT', silca: 'HON66', jma: 'HOND-20.P', oem: '35111-TA0-A00' },
    transponder: { chip: 'ID46 (PCF7936)', system: 'Honda immobilizer', cloneable: 'Yes — ID46 clones with most cloners' },
    remotes: [{ type: 'fob', fcc: 'KR55WK49308 / OUCG8D-380H-A', pn: '35111-TA0-A00', buttons: '4B' }],
    lock: { codeSeries: 'Honda 8-cut (HO01)', spaces: 8, depths: 4, cutMethod: 'Edge cut', decode: 'Lishi HON66 (high security trims) / HON58R' },
    programming: { obd: 'Yes', onboard: 'No true onboard — OBD tool needed', allKeysLost: 'OBD; some need the immobilizer PIN', pinRequired: 'Sometimes — PIN by VIN from the dealer or a code service', notes: '' },
    obdPort: 'Driver side, under dash, above the hood release',
    doorUnlock: 'Lishi HON66 or wedge + reach.', verified: false
  },
  {
    id: 'honda-civic-2016-2021', make: 'Honda', model: 'Civic', yearStart: 2016, yearEnd: 2021, body: 'car',
    blanks: { keyway: 'HON66', ilco: 'HO03-PT', silca: 'HON66', jma: 'HOND-22.P', oem: '72147-TBA-A11' },
    transponder: { chip: 'ID47 (Hitag3 / PCF7938)', system: 'Honda smart entry', cloneable: 'No — program it' },
    remotes: [{ type: 'prox', fcc: 'KR5V2X', pn: '72147-TBA-A11', buttons: '4B / 5B smart key' }],
    lock: { codeSeries: 'HON66 high security', spaces: 10, depths: 4, cutMethod: 'Laser / sidewinder', decode: 'Lishi HON66' },
    programming: { obd: 'Yes', onboard: 'No', allKeysLost: 'OBD, tool-dependent security wait', pinRequired: 'Some tools want PIN by VIN', notes: 'Emergency blade lives in the fob — cut it from the door decode.' },
    obdPort: 'Driver side, under dash', doorUnlock: 'Lishi HON66', verified: false
  },

  /* ---------------- NISSAN / INFINITI ---------------- */
  {
    id: 'nissan-altima-2007-2012', make: 'Nissan', model: 'Altima', yearStart: 2007, yearEnd: 2012, body: 'car',
    blanks: { keyway: 'NSN14 (emergency blade)', ilco: 'DA34', silca: 'NSN14', jma: 'NE-38.P', oem: '285E3-JA05A' },
    transponder: { chip: 'ID46 (Hitag2, in the Intelligent Key)', system: 'NATS 5/6', cloneable: 'No — Intelligent Key is programmed' },
    remotes: [{ type: 'prox', fcc: 'KR55WK48903 / CWTWB1U821', pn: '285E3-JA05A', buttons: '4B Intelligent Key' }],
    lock: { codeSeries: 'NSN14', spaces: 10, depths: 4, cutMethod: 'Laser / sidewinder', decode: 'Lishi NSN14 on the driver door' },
    programming: { obd: 'Yes', onboard: 'No', allKeysLost: 'OBD + 4-digit PIN', pinRequired: 'YES — PIN comes from the BCM code (see Tools > Nissan BCM)', notes: 'BCM code is on a white label on the BCM behind the kick panel / under the dash.' },
    obdPort: 'Driver side, under dash, left of the steering column',
    doorUnlock: 'Lishi NSN14 — this door is a bad wedge candidate.', verified: false
  },
  {
    id: 'nissan-rogue-2014-2020', make: 'Nissan', model: 'Rogue', yearStart: 2014, yearEnd: 2020, body: 'suv',
    blanks: { keyway: 'NSN14 (emergency blade)', ilco: 'DA34', silca: 'NSN14', jma: 'NE-38.P', oem: '285E3-5HA3B' },
    transponder: { chip: 'ID47 / Hitag3 on later builds', system: 'NATS 6', cloneable: 'No' },
    remotes: [{ type: 'prox', fcc: 'KR5S180144014', pn: '285E3-5HA3B', buttons: '4B Intelligent Key' }],
    lock: { codeSeries: 'NSN14', spaces: 10, depths: 4, cutMethod: 'Laser / sidewinder', decode: 'Lishi NSN14' },
    programming: { obd: 'Yes', onboard: 'No', allKeysLost: 'OBD + PIN', pinRequired: 'YES — BCM-derived PIN', notes: '' },
    obdPort: 'Driver side, under dash', doorUnlock: 'Lishi NSN14', verified: false
  },

  /* ---------------- HYUNDAI / KIA ---------------- */
  {
    id: 'hyundai-elantra-2011-2016', make: 'Hyundai', model: 'Elantra', yearStart: 2011, yearEnd: 2016, body: 'car',
    blanks: { keyway: 'HY20 (KIA5 family)', ilco: 'HY20-PT', silca: 'HYN14R', jma: 'HY-20.P', oem: '81996-3X010' },
    transponder: { chip: 'ID46 (PCF7936)', system: 'Hyundai immobilizer', cloneable: 'Yes' },
    remotes: [{ type: 'flip', fcc: 'OSLOKA-360T', pn: '95430-3X500', buttons: '3B / 4B flip' }],
    lock: { codeSeries: 'HY20', spaces: 8, depths: 4, cutMethod: 'Edge cut', decode: 'Lishi HY20 / HY22' },
    programming: { obd: 'Yes', onboard: 'No', allKeysLost: 'OBD + PIN', pinRequired: 'YES — PIN by VIN (dealer or code service)', notes: 'Hyundai/Kia PIN by VIN is the usual holdup, not the cut.' },
    obdPort: 'Driver side, under dash', doorUnlock: 'Lishi HY20', verified: false
  },
  {
    id: 'kia-optima-2011-2015', make: 'Kia', model: 'Optima', yearStart: 2011, yearEnd: 2015, body: 'car',
    blanks: { keyway: 'KK10 / HY18', ilco: 'KK10-PT', silca: 'HYN14R', jma: 'HY-18.P', oem: '81996-2T010' },
    transponder: { chip: 'ID46', system: 'Kia immobilizer', cloneable: 'Yes' },
    remotes: [{ type: 'prox', fcc: 'SY5HMFNA04', pn: '95440-2T500', buttons: '4B smart key (EX/SX)' }],
    lock: { codeSeries: 'KK10', spaces: 8, depths: 4, cutMethod: 'Edge cut', decode: 'Lishi KIA7 / HY18' },
    programming: { obd: 'Yes', onboard: 'No', allKeysLost: 'OBD + PIN', pinRequired: 'YES — PIN by VIN', notes: '' },
    obdPort: 'Driver side, under dash', doorUnlock: 'Lishi KIA7', verified: false
  },

  /* ---------------- STELLANTIS (DODGE / CHRYSLER / JEEP / RAM) ---------------- */
  {
    id: 'dodge-ram-1500-2013-2018', make: 'Ram', model: '1500', yearStart: 2013, yearEnd: 2018, body: 'truck',
    blanks: { keyway: 'Y170 / CY24', ilco: 'Y170-PT', silca: 'CY24', jma: 'CHR-15.P', oem: '68051387' },
    transponder: { chip: 'ID46 (Hitag2)', system: 'SKREEM / SKIM', cloneable: 'Yes on some, program is safer' },
    remotes: [{ type: 'fob', fcc: 'GQ4-53T', pn: '68051387AB', buttons: '3B / 5B' }],
    lock: { codeSeries: 'CY24 8-cut', spaces: 8, depths: 4, cutMethod: 'Edge cut', decode: 'Lishi CY24' },
    programming: { obd: 'Yes', onboard: '2 working keys: cycle on with key 1, then key 2, then new key', allKeysLost: 'OBD + 4-digit PIN', pinRequired: 'YES for AKL — PIN read from the SKREEM or by VIN', notes: '' },
    obdPort: 'Driver side, under dash', doorUnlock: 'Lishi CY24', verified: false
  },
  {
    id: 'jeep-wrangler-2007-2017', make: 'Jeep', model: 'Wrangler JK', yearStart: 2007, yearEnd: 2017, body: 'suv',
    blanks: { keyway: 'Y164 / CY24', ilco: 'Y164-PT', silca: 'CY24', jma: 'CHR-15.P', oem: '68001702' },
    transponder: { chip: 'ID46 (Hitag2)', system: 'SKREEM', cloneable: 'Yes' },
    remotes: [{ type: 'fob', fcc: 'OHT692427AA', pn: '68001702AA', buttons: '3B' }],
    lock: { codeSeries: 'CY24', spaces: 8, depths: 4, cutMethod: 'Edge cut', decode: 'Lishi CY24' },
    programming: { obd: 'Yes', onboard: '2 working keys onboard add', allKeysLost: 'OBD + PIN', pinRequired: 'YES for AKL', notes: 'Soft-top Wranglers are an easy non-destructive entry — go through the window zipper before you touch a wedge.' },
    obdPort: 'Driver side, under dash', doorUnlock: 'Soft top: unzip. Hard top: Lishi CY24.', verified: false
  },

  /* ---------------- VW / AUDI ---------------- */
  {
    id: 'vw-jetta-2011-2018', make: 'Volkswagen', model: 'Jetta', yearStart: 2011, yearEnd: 2018, body: 'car',
    blanks: { keyway: 'HU66', ilco: 'HU66AT4', silca: 'HU66', jma: 'TP00VA-6D.P', oem: '5K0837202' },
    transponder: { chip: 'ID48 (Megamos) / MQB ID88 on 2016+', system: 'Immobilizer 4 / MQB', cloneable: 'ID48 with a capable cloner; MQB is not a clone job' },
    remotes: [{ type: 'flip', fcc: 'NBG010180T', pn: '5K0837202AE', buttons: '3B / 4B flip' }],
    lock: { codeSeries: 'HU66', spaces: 8, depths: 4, cutMethod: 'Laser / sidewinder', decode: 'Lishi HU66' },
    programming: { obd: 'Yes', onboard: 'No', allKeysLost: 'OBD; MQB platform needs an MQB-capable tool', pinRequired: 'Component security / CS code needed on some', notes: 'Find out MQB vs non-MQB before you quote. It is a different job and a different price.' },
    obdPort: 'Driver side, under dash, left of the steering column',
    doorUnlock: 'Lishi HU66', verified: false
  },

  /* ---------------- BMW / MERCEDES ---------------- */
  {
    id: 'bmw-3series-2006-2013', make: 'BMW', model: '3 Series (E90)', yearStart: 2006, yearEnd: 2013, body: 'car',
    blanks: { keyway: 'HU92', ilco: 'HU92', silca: 'HU92', jma: 'TP00BM-15.P', oem: 'CAS3 fob' },
    transponder: { chip: 'CAS3 / CAS3+ (PCF7945)', system: 'CAS3', cloneable: 'No — CAS work, often bench' },
    remotes: [{ type: 'fob', fcc: 'KR55WK49127', pn: '6986583', buttons: '3B / 4B' }],
    lock: { codeSeries: 'HU92', spaces: 10, depths: 4, cutMethod: 'Laser / sidewinder', decode: 'Lishi HU92' },
    programming: { obd: 'Sometimes — CAS3+ often needs bench work', onboard: 'No', allKeysLost: 'CAS module read, ISN required', pinRequired: 'ISN from the DME/CAS', notes: 'Quote this one high or refer it out. It is not a driveway 20-minute job.' },
    obdPort: 'Driver side, under dash', doorUnlock: 'Lishi HU92', verified: false
  },
  {
    id: 'mercedes-cclass-2008-2014', make: 'Mercedes-Benz', model: 'C-Class (W204)', yearStart: 2008, yearEnd: 2014, body: 'car',
    blanks: { keyway: 'HU64', ilco: 'HU64', silca: 'HU64', jma: 'TP00ME-10.P', oem: 'FBS3 smart key' },
    transponder: { chip: 'FBS3 (Infrared)', system: 'FBS3 / DAS3', cloneable: 'No' },
    remotes: [{ type: 'prox', fcc: 'IYZ3312', pn: 'A2049055204', buttons: '3B/4B FBS3 IR key' }],
    lock: { codeSeries: 'HU64', spaces: 10, depths: 4, cutMethod: 'Laser / sidewinder', decode: 'Lishi HU64' },
    programming: { obd: 'No — FBS3 needs EIS/ESL work and password calculation', onboard: 'No', allKeysLost: 'EIS read, password calc, key file write', pinRequired: 'Password from EIS data', notes: 'Specialist job. Price it as one.' },
    obdPort: 'Driver side, under dash', doorUnlock: 'Lishi HU64', verified: false
  },

  /* ---------------- SUBARU / MAZDA ---------------- */
  {
    id: 'subaru-outback-2015-2019', make: 'Subaru', model: 'Outback', yearStart: 2015, yearEnd: 2019, body: 'suv',
    blanks: { keyway: 'SUB4 (emergency blade)', ilco: 'SUB4-PT', silca: 'SUB4', jma: 'SUBA-6.P', oem: '88835-AL04A' },
    transponder: { chip: 'ID47 / Hitag3', system: 'Subaru immobilizer', cloneable: 'No' },
    remotes: [{ type: 'prox', fcc: 'HYQ14AHC', pn: '88835-AL04A', buttons: '4B smart key' }],
    lock: { codeSeries: 'SUB4', spaces: 8, depths: 4, cutMethod: 'Edge cut', decode: 'Lishi SUB4' },
    programming: { obd: 'Yes', onboard: 'No', allKeysLost: 'OBD + PIN/seed', pinRequired: 'Tool-dependent', notes: '' },
    obdPort: 'Driver side, under dash', doorUnlock: 'Lishi SUB4', verified: false
  },
  {
    id: 'mazda-3-2014-2018', make: 'Mazda', model: 'Mazda3', yearStart: 2014, yearEnd: 2018, body: 'car',
    blanks: { keyway: 'MAZ24', ilco: 'MAZ24R-PT', silca: 'MAZ24R', jma: 'MAZ-16.P', oem: 'BHP1-67-5DY' },
    transponder: { chip: 'ID49 / Hitag Pro', system: 'Mazda immobilizer', cloneable: 'No' },
    remotes: [{ type: 'prox', fcc: 'WAZSKE13D01', pn: 'BHP1-67-5DY', buttons: '3B / 4B smart key' }],
    lock: { codeSeries: 'MAZ24', spaces: 8, depths: 4, cutMethod: 'Laser / sidewinder', decode: 'Lishi MAZ24' },
    programming: { obd: 'Yes', onboard: 'Limited', allKeysLost: 'OBD', pinRequired: 'No', notes: '' },
    obdPort: 'Driver side, under dash', doorUnlock: 'Lishi MAZ24', verified: false
  },

  /* ---------------- MOTORCYCLE / POWERSPORTS ---------------- */
  {
    id: 'harley-davidson-common', make: 'Harley-Davidson', model: 'Most models', yearStart: 1993, yearEnd: 2026, body: 'moto',
    blanks: { keyway: 'HD103 / HD106', ilco: 'HD103', silca: 'HD64', jma: 'HD-3', oem: 'varies by model' },
    transponder: { chip: 'None on most — HFSM fob is separate', system: 'Hands-free security fob (not a transponder key)', cloneable: 'n/a' },
    remotes: [{ type: 'fob', fcc: 'varies', pn: 'varies', buttons: 'HFSM proximity fob' }],
    lock: { codeSeries: 'HD103 / HD106', spaces: 6, depths: 4, cutMethod: 'Edge cut', decode: 'Impression or decode the ignition; saddlebag locks often share a code' },
    programming: { obd: 'n/a', onboard: 'Security fob pairing via the odometer menu', allKeysLost: 'Cut by code / impression; fob pairing separate', pinRequired: 'No', notes: 'Motorcycle lost-key work is high-margin and low-tool. Good bread and butter.' },
    obdPort: 'n/a', doorUnlock: 'n/a', verified: false
  },

  /* ---------------- FORD / LINCOLN ---------------- */
  {
    id: 'ford-superduty-2011-2016', make: 'Ford', model: 'F-250/F-350 Super Duty', yearStart: 2011, yearEnd: 2016, body: 'truck',
    blanks: { keyway: 'HU101', ilco: 'HU101-PT', silca: 'FO21T', jma: 'FO-24.P', oem: '164-R8040' },
    transponder: { chip: '4D-63 80-bit', system: 'PATS', cloneable: 'Yes with an 80-bit cloner' },
    remotes: [{ type: 'fob', fcc: 'CWTWB1U793', pn: '', buttons: '4B / 5B' }],
    lock: { codeSeries: 'HU101 10-cut', spaces: 10, depths: 4, cutMethod: 'Laser / sidewinder', decode: 'Lishi HU101' },
    programming: { obd: 'Yes', onboard: '2 working keys: insert/turn cycle', allKeysLost: 'OBD + 10-min timed access', pinRequired: 'No', notes: '' },
    obdPort: 'Driver side, under dash, left of the steering column', doorUnlock: 'Lishi HU101', verified: false
  },
  {
    id: 'ford-escape-2013-2019', make: 'Ford', model: 'Escape', yearStart: 2013, yearEnd: 2019, body: 'suv',
    blanks: { keyway: 'HU101', ilco: 'HU101-PT', silca: 'FO21T', jma: 'FO-24.P', oem: '164-R8092' },
    transponder: { chip: '4D-63 80-bit; ID49 on prox trims', system: 'PATS', cloneable: 'Blade keys yes; prox no' },
    remotes: [{ type: 'prox', fcc: 'M3N-A2C31243300', pn: '', buttons: '4B / 5B (Titanium)' }],
    lock: { codeSeries: 'HU101 10-cut', spaces: 10, depths: 4, cutMethod: 'Laser / sidewinder', decode: 'Lishi HU101' },
    programming: { obd: 'Yes', onboard: '2 working keys', allKeysLost: 'OBD + timed access', pinRequired: 'No', notes: '' },
    obdPort: 'Driver side, under dash', doorUnlock: 'Lishi HU101', verified: false
  },
  {
    id: 'ford-explorer-2011-2019', make: 'Ford', model: 'Explorer', yearStart: 2011, yearEnd: 2019, body: 'suv',
    blanks: { keyway: 'HU101', ilco: 'HU101-PT', silca: 'FO21T', jma: 'FO-24.P', oem: '164-R8109' },
    transponder: { chip: 'ID49 Hitag Pro on prox; 4D-63 on blade', system: 'PATS / IPC', cloneable: 'No on prox' },
    remotes: [{ type: 'prox', fcc: 'M3N-A2C31243300', pn: '', buttons: '5B w/ remote start' }],
    lock: { codeSeries: 'HU101 10-cut', spaces: 10, depths: 4, cutMethod: 'Laser / sidewinder', decode: 'Lishi HU101' },
    programming: { obd: 'Yes', onboard: '2 prox fobs in the cup holder sequence', allKeysLost: 'OBD + timed access', pinRequired: 'No', notes: 'Police Interceptor variants share the platform.' },
    obdPort: 'Driver side, under dash', doorUnlock: 'Lishi HU101', verified: false
  },
  {
    id: 'ford-fusion-2013-2020', make: 'Ford', model: 'Fusion', yearStart: 2013, yearEnd: 2020, body: 'car',
    blanks: { keyway: 'HU101', ilco: 'HU101-PT', silca: 'FO21T', jma: 'FO-24.P', oem: '164-R8109' },
    transponder: { chip: 'ID49 Hitag Pro (prox) / 4D-63 (blade)', system: 'PATS', cloneable: 'Blade only' },
    remotes: [{ type: 'prox', fcc: 'M3N-A2C31243300', pn: '', buttons: '5B' }],
    lock: { codeSeries: 'HU101 10-cut', spaces: 10, depths: 4, cutMethod: 'Laser / sidewinder', decode: 'Lishi HU101' },
    programming: { obd: 'Yes', onboard: '2 fobs', allKeysLost: 'OBD + timed access', pinRequired: 'No', notes: '' },
    obdPort: 'Driver side, under dash', doorUnlock: 'Lishi HU101', verified: false
  },
  {
    id: 'ford-mustang-2015-2023', make: 'Ford', model: 'Mustang', yearStart: 2015, yearEnd: 2023, body: 'car',
    blanks: { keyway: 'HU101', ilco: 'HU101-PT', silca: 'FO21T', jma: 'FO-24.P', oem: '164-R8118' },
    transponder: { chip: 'ID49 Hitag Pro', system: 'PATS', cloneable: 'No' },
    remotes: [{ type: 'prox', fcc: 'M3N-A2C31243300', pn: '', buttons: '4B / 5B' }],
    lock: { codeSeries: 'HU101 10-cut', spaces: 10, depths: 4, cutMethod: 'Laser / sidewinder', decode: 'Lishi HU101' },
    programming: { obd: 'Yes', onboard: '2 fobs', allKeysLost: 'OBD + timed access', pinRequired: 'No', notes: '' },
    obdPort: 'Driver side, under dash', doorUnlock: 'Lishi HU101', verified: false
  },
  {
    id: 'ford-transit-2015-2023', make: 'Ford', model: 'Transit / Transit Connect', yearStart: 2015, yearEnd: 2023, body: 'van',
    blanks: { keyway: 'HU101', ilco: 'HU101-PT', silca: 'FO21T', jma: 'FO-24.P', oem: '' },
    transponder: { chip: 'ID49 / 4D-63 by trim', system: 'PATS', cloneable: 'Varies' },
    remotes: [{ type: 'flip', fcc: '', pn: '', buttons: '3B / 4B' }],
    lock: { codeSeries: 'HU101 10-cut', spaces: 10, depths: 4, cutMethod: 'Laser / sidewinder', decode: 'Lishi HU101' },
    programming: { obd: 'Yes', onboard: '2 working keys on some trims', allKeysLost: 'OBD + timed access', pinRequired: 'No', notes: 'Work vans are frequent lockout calls — the sliding door is often the easier way in.' },
    obdPort: 'Driver side, under dash', doorUnlock: 'Lishi HU101', verified: false
  },
  {
    id: 'ford-expedition-2015-2023', make: 'Ford', model: 'Expedition', yearStart: 2015, yearEnd: 2023, body: 'suv',
    blanks: { keyway: 'HU101', ilco: 'HU101-PT', silca: 'FO21T', jma: 'FO-24.P', oem: '164-R8166' },
    transponder: { chip: 'ID49 Hitag Pro', system: 'PATS', cloneable: 'No' },
    remotes: [{ type: 'prox', fcc: 'M3N-A2C931426', pn: '', buttons: '5B' }],
    lock: { codeSeries: 'HU101 10-cut', spaces: 10, depths: 4, cutMethod: 'Laser / sidewinder', decode: 'Lishi HU101' },
    programming: { obd: 'Yes', onboard: '2 fobs', allKeysLost: 'OBD + timed access', pinRequired: 'No', notes: '' },
    obdPort: 'Driver side, under dash', doorUnlock: 'Lishi HU101', verified: false
  },
  {
    id: 'ford-ranger-2019-2023', make: 'Ford', model: 'Ranger', yearStart: 2019, yearEnd: 2023, body: 'truck',
    blanks: { keyway: 'HU101', ilco: 'HU101-PT', silca: 'FO21T', jma: 'FO-24.P', oem: '' },
    transponder: { chip: 'ID49 Hitag Pro', system: 'PATS', cloneable: 'No' },
    remotes: [{ type: 'prox', fcc: 'N5F-A08TAA', pn: '', buttons: '4B' }],
    lock: { codeSeries: 'HU101 10-cut', spaces: 10, depths: 4, cutMethod: 'Laser / sidewinder', decode: 'Lishi HU101' },
    programming: { obd: 'Yes', onboard: '2 fobs', allKeysLost: 'OBD + timed access', pinRequired: 'No', notes: '' },
    obdPort: 'Driver side, under dash', doorUnlock: 'Lishi HU101', verified: false
  },

  /* ---------------- GM ---------------- */
  {
    id: 'gmc-sierra-2014-2019', make: 'GMC', model: 'Sierra 1500', yearStart: 2014, yearEnd: 2019, body: 'truck',
    blanks: { keyway: 'B119', ilco: 'B119-PT', silca: 'GM45', jma: 'GM-40.P', oem: '13500223' },
    transponder: { chip: 'GM 46E (Hitag2)', system: 'Immobilizer 2', cloneable: 'No' },
    remotes: [{ type: 'fob', fcc: 'M3N-32337100', pn: '13577770', buttons: '5B / 6B' }],
    lock: { codeSeries: 'GM 10-cut', spaces: 10, depths: 4, cutMethod: 'Edge cut', decode: 'Lishi HU100 / GM45' },
    programming: { obd: 'Yes', onboard: '30-min x3 relearn on blade trims', allKeysLost: 'OBD or relearn', pinRequired: 'No', notes: 'Same platform as the Silverado of the same years.' },
    obdPort: 'Driver side, under dash', doorUnlock: 'Lishi HU100', verified: false
  },
  {
    id: 'chevy-equinox-2010-2017', make: 'Chevrolet', model: 'Equinox', yearStart: 2010, yearEnd: 2017, body: 'suv',
    blanks: { keyway: 'HU100', ilco: 'B116-PT', silca: 'GM45', jma: 'GM-40.P', oem: '13504252' },
    transponder: { chip: 'GM 46E (Hitag2)', system: 'Immobilizer 2', cloneable: 'No' },
    remotes: [{ type: 'fob', fcc: 'OHT01060512', pn: '13584829', buttons: '4B / 5B' }],
    lock: { codeSeries: 'GM HU100 10-cut', spaces: 10, depths: 4, cutMethod: 'Edge cut', decode: 'Lishi HU100' },
    programming: { obd: 'Yes', onboard: '30-min x3 relearn', allKeysLost: 'Relearn or OBD', pinRequired: 'No', notes: '' },
    obdPort: 'Driver side, under dash', doorUnlock: 'Lishi HU100', verified: false
  },
  {
    id: 'chevy-cruze-2011-2019', make: 'Chevrolet', model: 'Cruze', yearStart: 2011, yearEnd: 2019, body: 'car',
    blanks: { keyway: 'HU100', ilco: 'B116-PT', silca: 'GM45', jma: 'GM-40.P', oem: '13500223' },
    transponder: { chip: 'GM 46E (Hitag2)', system: 'Immobilizer 2', cloneable: 'No' },
    remotes: [{ type: 'fob', fcc: 'OHT01060512', pn: '', buttons: '4B / 5B' }],
    lock: { codeSeries: 'GM HU100 10-cut', spaces: 10, depths: 4, cutMethod: 'Edge cut', decode: 'Lishi HU100' },
    programming: { obd: 'Yes', onboard: '30-min x3 relearn', allKeysLost: 'Relearn or OBD', pinRequired: 'No', notes: '' },
    obdPort: 'Driver side, under dash', doorUnlock: 'Lishi HU100', verified: false
  },
  {
    id: 'chevy-tahoe-2015-2020', make: 'Chevrolet', model: 'Tahoe / Suburban', yearStart: 2015, yearEnd: 2020, body: 'suv',
    blanks: { keyway: 'B119 (emergency blade)', ilco: 'B119-PT', silca: 'GM45', jma: 'GM-40.P', oem: '13580804' },
    transponder: { chip: 'GM 46E (Hitag2)', system: 'Passive entry / push start', cloneable: 'No' },
    remotes: [{ type: 'prox', fcc: 'M3N-32337100', pn: '13580804', buttons: '6B' }],
    lock: { codeSeries: 'GM 10-cut', spaces: 10, depths: 4, cutMethod: 'Edge cut', decode: 'Lishi HU100' },
    programming: { obd: 'Yes', onboard: 'Add-a-fob possible with a working fob', allKeysLost: 'OBD + security relearn', pinRequired: 'No', notes: '' },
    obdPort: 'Driver side, under dash', doorUnlock: 'Lishi HU100', verified: false
  },
  {
    id: 'chevy-impala-2014-2020', make: 'Chevrolet', model: 'Impala', yearStart: 2014, yearEnd: 2020, body: 'car',
    blanks: { keyway: 'HU100', ilco: 'B119-PT', silca: 'GM45', jma: 'GM-40.P', oem: '' },
    transponder: { chip: 'GM 46E (Hitag2)', system: 'Immobilizer 2', cloneable: 'No' },
    remotes: [{ type: 'prox', fcc: 'HYQ4EA', pn: '', buttons: '5B' }],
    lock: { codeSeries: 'GM 10-cut', spaces: 10, depths: 4, cutMethod: 'Edge cut', decode: 'Lishi HU100' },
    programming: { obd: 'Yes', onboard: '30-min relearn on blade trims', allKeysLost: 'OBD', pinRequired: 'No', notes: '' },
    obdPort: 'Driver side, under dash', doorUnlock: 'Lishi HU100', verified: false
  },
  {
    id: 'chevy-colorado-2015-2022', make: 'Chevrolet', model: 'Colorado', yearStart: 2015, yearEnd: 2022, body: 'truck',
    blanks: { keyway: 'B119', ilco: 'B119-PT', silca: 'GM45', jma: 'GM-40.P', oem: '' },
    transponder: { chip: 'GM 46E (Hitag2)', system: 'Immobilizer 2', cloneable: 'No' },
    remotes: [{ type: 'fob', fcc: 'M3N-32337100', pn: '', buttons: '4B / 5B' }],
    lock: { codeSeries: 'GM 10-cut', spaces: 10, depths: 4, cutMethod: 'Edge cut', decode: 'Lishi HU100' },
    programming: { obd: 'Yes', onboard: '30-min x3 relearn', allKeysLost: 'Relearn or OBD', pinRequired: 'No', notes: '' },
    obdPort: 'Driver side, under dash', doorUnlock: 'Lishi HU100', verified: false
  },
  {
    id: 'chevy-traverse-2009-2017', make: 'Chevrolet', model: 'Traverse', yearStart: 2009, yearEnd: 2017, body: 'suv',
    blanks: { keyway: 'B111', ilco: 'B111-PT', silca: 'GM39RT', jma: 'GM-37.P', oem: '' },
    transponder: { chip: 'GM Circle Plus / 46E by year', system: 'PK3+ / Immobilizer 2', cloneable: 'Circle Plus yes' },
    remotes: [{ type: 'fob', fcc: 'OUC60270', pn: '', buttons: '4B / 5B' }],
    lock: { codeSeries: 'GM 10-cut', spaces: 10, depths: 4, cutMethod: 'Edge cut', decode: 'Lishi GM37' },
    programming: { obd: 'Yes', onboard: '30-min x3 relearn', allKeysLost: 'Relearn', pinRequired: 'No', notes: 'Check which chip generation before cutting — this model spans the changeover.' },
    obdPort: 'Driver side, under dash', doorUnlock: 'Lishi GM37', verified: false
  },
  {
    id: 'gm-vats-1986-2002', make: 'Chevrolet', model: 'VATS / PASS-Key (older GM)', yearStart: 1986, yearEnd: 2002, body: 'car',
    blanks: { keyway: 'B106 / B62 pellet', ilco: 'B62-P1 .. B62-P15', silca: 'GM37', jma: 'GM-14.P', oem: 'varies by pellet value' },
    transponder: { chip: 'None — resistor pellet in the blade', system: 'VATS / PASS-Key', cloneable: 'n/a — match the pellet resistance' },
    remotes: [{ type: 'fob', fcc: '', pn: '', buttons: 'Separate keyless entry, if fitted' }],
    lock: { codeSeries: 'GM 6-cut (B106)', spaces: 6, depths: 4, cutMethod: 'Edge cut', decode: 'Lishi GM37 or impression' },
    programming: { obd: 'n/a', onboard: 'n/a', allKeysLost: 'Read the pellet value with a VATS interrogator, then cut and match', pinRequired: 'No', notes: '15 pellet values. Carry the full set or an interrogator — guessing burns the 4-minute lockout timer each try.' },
    obdPort: 'Under dash (OBD-I on the earliest)', doorUnlock: 'Lishi GM37 or wedge and reach', verified: false
  },
  /* ---------------- TOYOTA / LEXUS ---------------- */
  {
    id: 'toyota-corolla-2009-2013', make: 'Toyota', model: 'Corolla', yearStart: 2009, yearEnd: 2013, body: 'car',
    blanks: { keyway: 'TOY43', ilco: 'TOY43-PT', silca: 'TOY43', jma: 'TOYO-21.P', oem: '89785-08020' },
    transponder: { chip: '4D-67 (dot) / G on later', system: 'Toyota immobilizer', cloneable: 'Dot yes, G needs a G cloner' },
    remotes: [{ type: 'fob', fcc: 'GQ43VT20T', pn: '', buttons: '3B / 4B' }],
    lock: { codeSeries: 'TOY43 8-cut', spaces: 8, depths: 4, cutMethod: 'Edge cut', decode: 'Lishi TOY43' },
    programming: { obd: 'Yes', onboard: 'Yes on blade trims', allKeysLost: 'OBD', pinRequired: 'No', notes: '' },
    obdPort: 'Driver side, under dash', doorUnlock: 'Lishi TOY43', verified: false
  },
  {
    id: 'toyota-corolla-2014-2019', make: 'Toyota', model: 'Corolla', yearStart: 2014, yearEnd: 2019, body: 'car',
    blanks: { keyway: 'TOY44H', ilco: 'TOY44H-PT', silca: 'TOY48', jma: 'TP00TOYO-15.P', oem: '89785-0D140' },
    transponder: { chip: '8A / H chip', system: 'Toyota immobilizer', cloneable: 'No' },
    remotes: [{ type: 'prox', fcc: 'HYQ14FBA', pn: '', buttons: '3B / 4B smart key' }],
    lock: { codeSeries: 'TOY48', spaces: 10, depths: 4, cutMethod: 'Laser / sidewinder', decode: 'Lishi TOY48' },
    programming: { obd: 'Yes', onboard: 'Limited', allKeysLost: 'OBD + 16-min wait', pinRequired: 'No', notes: '' },
    obdPort: 'Driver side, under dash', doorUnlock: 'Lishi TOY48', verified: false
  },
  {
    id: 'toyota-rav4-2013-2018', make: 'Toyota', model: 'RAV4', yearStart: 2013, yearEnd: 2018, body: 'suv',
    blanks: { keyway: 'TOY44H', ilco: 'TOY44H-PT', silca: 'TOY48', jma: 'TP00TOYO-15.P', oem: '89785-0D140' },
    transponder: { chip: '8A / H chip', system: 'Toyota immobilizer', cloneable: 'No' },
    remotes: [{ type: 'prox', fcc: 'HYQ14FBA', pn: '', buttons: '3B / 4B smart key' }],
    lock: { codeSeries: 'TOY48', spaces: 10, depths: 4, cutMethod: 'Laser / sidewinder', decode: 'Lishi TOY48' },
    programming: { obd: 'Yes', onboard: 'No', allKeysLost: 'OBD + 16-min wait', pinRequired: 'No', notes: '' },
    obdPort: 'Driver side, under dash', doorUnlock: 'Lishi TOY48', verified: false
  },
  {
    id: 'toyota-tundra-2014-2021', make: 'Toyota', model: 'Tundra', yearStart: 2014, yearEnd: 2021, body: 'truck',
    blanks: { keyway: 'TOY44H', ilco: 'TOY44H-PT', silca: 'TOY48', jma: 'TP00TOYO-15.P', oem: '89785-0D140' },
    transponder: { chip: '8A / H chip', system: 'Toyota immobilizer', cloneable: 'No' },
    remotes: [{ type: 'prox', fcc: 'HYQ14FBA', pn: '', buttons: '3B / 4B' }],
    lock: { codeSeries: 'TOY48', spaces: 10, depths: 4, cutMethod: 'Laser / sidewinder', decode: 'Lishi TOY48' },
    programming: { obd: 'Yes', onboard: 'No', allKeysLost: 'OBD + 16-min wait', pinRequired: 'No', notes: '' },
    obdPort: 'Driver side, under dash', doorUnlock: 'Lishi TOY48', verified: false
  },
  {
    id: 'toyota-highlander-2014-2019', make: 'Toyota', model: 'Highlander', yearStart: 2014, yearEnd: 2019, body: 'suv',
    blanks: { keyway: 'TOY44H', ilco: 'TOY44H-PT', silca: 'TOY48', jma: 'TP00TOYO-15.P', oem: '89785-0D140' },
    transponder: { chip: '8A / H chip', system: 'Toyota immobilizer', cloneable: 'No' },
    remotes: [{ type: 'prox', fcc: 'HYQ14FBA', pn: '', buttons: '4B / 5B' }],
    lock: { codeSeries: 'TOY48', spaces: 10, depths: 4, cutMethod: 'Laser / sidewinder', decode: 'Lishi TOY48' },
    programming: { obd: 'Yes', onboard: 'No', allKeysLost: 'OBD + 16-min wait', pinRequired: 'No', notes: '' },
    obdPort: 'Driver side, under dash', doorUnlock: 'Lishi TOY48', verified: false
  },
  {
    id: 'toyota-prius-2010-2015', make: 'Toyota', model: 'Prius', yearStart: 2010, yearEnd: 2015, body: 'car',
    blanks: { keyway: 'TOY48 (emergency blade)', ilco: 'TOY44D-PT', silca: 'TOY48', jma: 'TP00TOYO-15.P', oem: '89904-47230' },
    transponder: { chip: 'G chip smart key', system: 'Toyota smart entry', cloneable: 'No' },
    remotes: [{ type: 'prox', fcc: 'HYQ14ACX', pn: '89904-47230', buttons: '4B smart key' }],
    lock: { codeSeries: 'TOY48', spaces: 10, depths: 4, cutMethod: 'Laser / sidewinder', decode: 'Lishi TOY48 on the door' },
    programming: { obd: 'Yes', onboard: 'No', allKeysLost: 'OBD; smart box reset on some', pinRequired: 'No', notes: 'No conventional ignition — the emergency blade only opens the door.' },
    obdPort: 'Driver side, under dash', doorUnlock: 'Lishi TOY48', verified: false
  },
  {
    id: 'lexus-rx-2010-2015', make: 'Lexus', model: 'RX 350', yearStart: 2010, yearEnd: 2015, body: 'suv',
    blanks: { keyway: 'TOY48 (emergency blade)', ilco: 'TOY44D-PT', silca: 'TOY48', jma: 'TP00TOYO-15.P', oem: '89904-48191' },
    transponder: { chip: 'G chip smart key', system: 'Lexus smart access', cloneable: 'No' },
    remotes: [{ type: 'prox', fcc: 'HYQ14AAB', pn: '89904-48191', buttons: '4B smart key' }],
    lock: { codeSeries: 'TOY48', spaces: 10, depths: 4, cutMethod: 'Laser / sidewinder', decode: 'Lishi TOY48' },
    programming: { obd: 'Yes', onboard: 'No', allKeysLost: 'OBD; smart reset on some', pinRequired: 'No', notes: '' },
    obdPort: 'Driver side, under dash', doorUnlock: 'Lishi TOY48', verified: false
  },

  /* ---------------- HONDA / ACURA ---------------- */
  {
    id: 'honda-crv-2012-2016', make: 'Honda', model: 'CR-V', yearStart: 2012, yearEnd: 2016, body: 'suv',
    blanks: { keyway: 'HO01', ilco: 'HO01-PT', silca: 'HON58R', jma: 'HOND-20.P', oem: '35118-T0A-A00' },
    transponder: { chip: 'ID46 (PCF7936)', system: 'Honda immobilizer', cloneable: 'Yes' },
    remotes: [{ type: 'fob', fcc: 'MLBHLIK6-1T', pn: '', buttons: '4B' }],
    lock: { codeSeries: 'Honda 8-cut', spaces: 8, depths: 4, cutMethod: 'Edge cut', decode: 'Lishi HON58R' },
    programming: { obd: 'Yes', onboard: 'No', allKeysLost: 'OBD; PIN by VIN on some', pinRequired: 'Sometimes', notes: '' },
    obdPort: 'Driver side, under dash', doorUnlock: 'Lishi HON58R', verified: false
  },
  {
    id: 'honda-crv-2017-2022', make: 'Honda', model: 'CR-V', yearStart: 2017, yearEnd: 2022, body: 'suv',
    blanks: { keyway: 'HON66', ilco: 'HO03-PT', silca: 'HON66', jma: 'HOND-22.P', oem: '72147-TLA-A11' },
    transponder: { chip: 'ID47 (Hitag3)', system: 'Honda smart entry', cloneable: 'No' },
    remotes: [{ type: 'prox', fcc: 'KR5V2X', pn: '72147-TLA-A11', buttons: '4B / 5B' }],
    lock: { codeSeries: 'HON66 high security', spaces: 10, depths: 4, cutMethod: 'Laser / sidewinder', decode: 'Lishi HON66' },
    programming: { obd: 'Yes', onboard: 'No', allKeysLost: 'OBD', pinRequired: 'Some tools want PIN by VIN', notes: '' },
    obdPort: 'Driver side, under dash', doorUnlock: 'Lishi HON66', verified: false
  },
  {
    id: 'honda-pilot-2016-2022', make: 'Honda', model: 'Pilot', yearStart: 2016, yearEnd: 2022, body: 'suv',
    blanks: { keyway: 'HON66', ilco: 'HO03-PT', silca: 'HON66', jma: 'HOND-22.P', oem: '72147-TG7-A11' },
    transponder: { chip: 'ID47 (Hitag3)', system: 'Honda smart entry', cloneable: 'No' },
    remotes: [{ type: 'prox', fcc: 'KR5V2X', pn: '', buttons: '5B' }],
    lock: { codeSeries: 'HON66', spaces: 10, depths: 4, cutMethod: 'Laser / sidewinder', decode: 'Lishi HON66' },
    programming: { obd: 'Yes', onboard: 'No', allKeysLost: 'OBD', pinRequired: 'Sometimes', notes: '' },
    obdPort: 'Driver side, under dash', doorUnlock: 'Lishi HON66', verified: false
  },
  {
    id: 'honda-odyssey-2011-2017', make: 'Honda', model: 'Odyssey', yearStart: 2011, yearEnd: 2017, body: 'van',
    blanks: { keyway: 'HO01', ilco: 'HO01-PT', silca: 'HON58R', jma: 'HOND-20.P', oem: '' },
    transponder: { chip: 'ID46', system: 'Honda immobilizer', cloneable: 'Yes' },
    remotes: [{ type: 'fob', fcc: 'KR5V1X', pn: '', buttons: '5B / 6B w/ sliding doors' }],
    lock: { codeSeries: 'Honda 8-cut', spaces: 8, depths: 4, cutMethod: 'Edge cut', decode: 'Lishi HON58R' },
    programming: { obd: 'Yes', onboard: 'No', allKeysLost: 'OBD', pinRequired: 'Sometimes', notes: '' },
    obdPort: 'Driver side, under dash', doorUnlock: 'Lishi HON58R', verified: false
  },
  {
    id: 'honda-civic-2006-2011', make: 'Honda', model: 'Civic', yearStart: 2006, yearEnd: 2011, body: 'car',
    blanks: { keyway: 'HO01', ilco: 'HO01-PT', silca: 'HON58R', jma: 'HOND-20.P', oem: '35111-SNA-A01' },
    transponder: { chip: 'ID46', system: 'Honda immobilizer', cloneable: 'Yes' },
    remotes: [{ type: 'fob', fcc: 'OUCG8D-380H-A', pn: '', buttons: '3B / 4B' }],
    lock: { codeSeries: 'Honda 8-cut', spaces: 8, depths: 4, cutMethod: 'Edge cut', decode: 'Lishi HON58R' },
    programming: { obd: 'Yes', onboard: 'No', allKeysLost: 'OBD', pinRequired: 'Sometimes', notes: '' },
    obdPort: 'Driver side, under dash', doorUnlock: 'Lishi HON58R', verified: false
  },
  {
    id: 'acura-mdx-2014-2020', make: 'Acura', model: 'MDX', yearStart: 2014, yearEnd: 2020, body: 'suv',
    blanks: { keyway: 'HON66', ilco: 'HO03-PT', silca: 'HON66', jma: 'HOND-22.P', oem: '72147-TZ5-A01' },
    transponder: { chip: 'ID47 (Hitag3)', system: 'Acura smart entry', cloneable: 'No' },
    remotes: [{ type: 'prox', fcc: 'KR5V1X', pn: '', buttons: '5B' }],
    lock: { codeSeries: 'HON66', spaces: 10, depths: 4, cutMethod: 'Laser / sidewinder', decode: 'Lishi HON66' },
    programming: { obd: 'Yes', onboard: 'No', allKeysLost: 'OBD', pinRequired: 'Sometimes', notes: '' },
    obdPort: 'Driver side, under dash', doorUnlock: 'Lishi HON66', verified: false
  },

  /* ---------------- NISSAN / INFINITI ---------------- */
  {
    id: 'nissan-altima-2013-2018', make: 'Nissan', model: 'Altima', yearStart: 2013, yearEnd: 2018, body: 'car',
    blanks: { keyway: 'NSN14 (emergency blade)', ilco: 'DA34', silca: 'NSN14', jma: 'NE-38.P', oem: '285E3-9HP4B' },
    transponder: { chip: 'ID46 / ID47 by year', system: 'NATS 6', cloneable: 'No' },
    remotes: [{ type: 'prox', fcc: 'KR5S180144014', pn: '', buttons: '4B / 5B Intelligent Key' }],
    lock: { codeSeries: 'NSN14', spaces: 10, depths: 4, cutMethod: 'Laser / sidewinder', decode: 'Lishi NSN14' },
    programming: { obd: 'Yes', onboard: 'No', allKeysLost: 'OBD + PIN', pinRequired: 'YES — BCM-derived PIN', notes: '' },
    obdPort: 'Driver side, under dash', doorUnlock: 'Lishi NSN14', verified: false
  },
  {
    id: 'nissan-sentra-2013-2019', make: 'Nissan', model: 'Sentra', yearStart: 2013, yearEnd: 2019, body: 'car',
    blanks: { keyway: 'NSN14', ilco: 'DA34', silca: 'NSN14', jma: 'NE-38.P', oem: '' },
    transponder: { chip: 'ID46 / ID47', system: 'NATS 6', cloneable: 'No' },
    remotes: [{ type: 'prox', fcc: 'CWTWB1U840', pn: '', buttons: '4B' }],
    lock: { codeSeries: 'NSN14', spaces: 10, depths: 4, cutMethod: 'Laser / sidewinder', decode: 'Lishi NSN14' },
    programming: { obd: 'Yes', onboard: 'No', allKeysLost: 'OBD + PIN', pinRequired: 'YES', notes: 'Base trims use a blade key with a separate fob rather than a prox.' },
    obdPort: 'Driver side, under dash', doorUnlock: 'Lishi NSN14', verified: false
  },
  {
    id: 'nissan-frontier-2005-2019', make: 'Nissan', model: 'Frontier', yearStart: 2005, yearEnd: 2019, body: 'truck',
    blanks: { keyway: 'DA31 / NSN14 by trim', ilco: 'DA31-PT', silca: 'NSN11', jma: 'DAT-17.P', oem: '' },
    transponder: { chip: 'ID46', system: 'NATS 5/6', cloneable: 'Some' },
    remotes: [{ type: 'fob', fcc: 'CWTWB1U751', pn: '', buttons: '3B / 4B' }],
    lock: { codeSeries: 'DA31 8-cut', spaces: 8, depths: 4, cutMethod: 'Edge cut', decode: 'Lishi DA31' },
    programming: { obd: 'Yes', onboard: 'No', allKeysLost: 'OBD + PIN', pinRequired: 'YES', notes: '' },
    obdPort: 'Driver side, under dash', doorUnlock: 'Lishi DA31', verified: false
  },
  {
    id: 'nissan-pathfinder-2013-2020', make: 'Nissan', model: 'Pathfinder', yearStart: 2013, yearEnd: 2020, body: 'suv',
    blanks: { keyway: 'NSN14', ilco: 'DA34', silca: 'NSN14', jma: 'NE-38.P', oem: '' },
    transponder: { chip: 'ID46 / ID47', system: 'NATS 6', cloneable: 'No' },
    remotes: [{ type: 'prox', fcc: 'KR5S180144014', pn: '', buttons: '4B / 5B' }],
    lock: { codeSeries: 'NSN14', spaces: 10, depths: 4, cutMethod: 'Laser / sidewinder', decode: 'Lishi NSN14' },
    programming: { obd: 'Yes', onboard: 'No', allKeysLost: 'OBD + PIN', pinRequired: 'YES', notes: '' },
    obdPort: 'Driver side, under dash', doorUnlock: 'Lishi NSN14', verified: false
  },
  {
    id: 'nissan-titan-2016-2023', make: 'Nissan', model: 'Titan', yearStart: 2016, yearEnd: 2023, body: 'truck',
    blanks: { keyway: 'NSN14', ilco: 'DA34', silca: 'NSN14', jma: 'NE-38.P', oem: '' },
    transponder: { chip: 'ID47 (Hitag3)', system: 'NATS 6', cloneable: 'No' },
    remotes: [{ type: 'prox', fcc: 'KR5TXN7', pn: '', buttons: '4B / 5B' }],
    lock: { codeSeries: 'NSN14', spaces: 10, depths: 4, cutMethod: 'Laser / sidewinder', decode: 'Lishi NSN14' },
    programming: { obd: 'Yes', onboard: 'No', allKeysLost: 'OBD + PIN', pinRequired: 'YES', notes: '' },
    obdPort: 'Driver side, under dash', doorUnlock: 'Lishi NSN14', verified: false
  },
  /* ---------------- HYUNDAI / KIA ---------------- */
  {
    id: 'hyundai-sonata-2011-2019', make: 'Hyundai', model: 'Sonata', yearStart: 2011, yearEnd: 2019, body: 'car',
    blanks: { keyway: 'HY20 / HY22 by trim', ilco: 'HY20-PT', silca: 'HYN14R', jma: 'HY-20.P', oem: '' },
    transponder: { chip: 'ID46', system: 'Hyundai immobilizer', cloneable: 'Yes on blade keys' },
    remotes: [{ type: 'prox', fcc: 'SY5HMFNA04', pn: '', buttons: '4B smart key on Limited' }],
    lock: { codeSeries: 'HY20', spaces: 8, depths: 4, cutMethod: 'Edge cut', decode: 'Lishi HY20 / HY22' },
    programming: { obd: 'Yes', onboard: 'No', allKeysLost: 'OBD + PIN', pinRequired: 'YES — PIN by VIN', notes: 'PIN by VIN is the bottleneck on Hyundai/Kia, not the cut.' },
    obdPort: 'Driver side, under dash', doorUnlock: 'Lishi HY20', verified: false
  },
  {
    id: 'hyundai-santafe-2013-2018', make: 'Hyundai', model: 'Santa Fe', yearStart: 2013, yearEnd: 2018, body: 'suv',
    blanks: { keyway: 'HY22', ilco: 'HY22-PT', silca: 'HYN17R', jma: 'HY-22.P', oem: '' },
    transponder: { chip: 'ID46', system: 'Hyundai immobilizer', cloneable: 'Yes' },
    remotes: [{ type: 'prox', fcc: 'TQ8-FOB-4F03', pn: '', buttons: '4B smart key' }],
    lock: { codeSeries: 'HY22 high security', spaces: 10, depths: 4, cutMethod: 'Laser / sidewinder', decode: 'Lishi HY22' },
    programming: { obd: 'Yes', onboard: 'No', allKeysLost: 'OBD + PIN', pinRequired: 'YES — PIN by VIN', notes: '' },
    obdPort: 'Driver side, under dash', doorUnlock: 'Lishi HY22', verified: false
  },
  {
    id: 'hyundai-tucson-2016-2021', make: 'Hyundai', model: 'Tucson', yearStart: 2016, yearEnd: 2021, body: 'suv',
    blanks: { keyway: 'HY22', ilco: 'HY22-PT', silca: 'HYN17R', jma: 'HY-22.P', oem: '' },
    transponder: { chip: 'ID47 / ID46 by year', system: 'Hyundai immobilizer', cloneable: 'Varies' },
    remotes: [{ type: 'prox', fcc: 'TQ8-FOB-4F11', pn: '', buttons: '4B smart key' }],
    lock: { codeSeries: 'HY22', spaces: 10, depths: 4, cutMethod: 'Laser / sidewinder', decode: 'Lishi HY22' },
    programming: { obd: 'Yes', onboard: 'No', allKeysLost: 'OBD + PIN', pinRequired: 'YES — PIN by VIN', notes: '' },
    obdPort: 'Driver side, under dash', doorUnlock: 'Lishi HY22', verified: false
  },
  {
    id: 'kia-soul-2014-2019', make: 'Kia', model: 'Soul', yearStart: 2014, yearEnd: 2019, body: 'suv',
    blanks: { keyway: 'KK10 / HY22 by trim', ilco: 'KK10-PT', silca: 'HYN14R', jma: 'HY-18.P', oem: '' },
    transponder: { chip: 'ID46', system: 'Kia immobilizer', cloneable: 'Yes on blade' },
    remotes: [{ type: 'flip', fcc: 'OSLOKA-875T', pn: '', buttons: '4B flip' }],
    lock: { codeSeries: 'KK10', spaces: 8, depths: 4, cutMethod: 'Edge cut', decode: 'Lishi KIA7' },
    programming: { obd: 'Yes', onboard: 'No', allKeysLost: 'OBD + PIN', pinRequired: 'YES — PIN by VIN', notes: '' },
    obdPort: 'Driver side, under dash', doorUnlock: 'Lishi KIA7', verified: false
  },
  {
    id: 'kia-sorento-2016-2020', make: 'Kia', model: 'Sorento', yearStart: 2016, yearEnd: 2020, body: 'suv',
    blanks: { keyway: 'HY22', ilco: 'HY22-PT', silca: 'HYN17R', jma: 'HY-22.P', oem: '' },
    transponder: { chip: 'ID47 / ID46', system: 'Kia immobilizer', cloneable: 'Varies' },
    remotes: [{ type: 'prox', fcc: 'SY5MQ4FGE04', pn: '', buttons: '4B / 5B smart key' }],
    lock: { codeSeries: 'HY22', spaces: 10, depths: 4, cutMethod: 'Laser / sidewinder', decode: 'Lishi HY22' },
    programming: { obd: 'Yes', onboard: 'No', allKeysLost: 'OBD + PIN', pinRequired: 'YES — PIN by VIN', notes: '' },
    obdPort: 'Driver side, under dash', doorUnlock: 'Lishi HY22', verified: false
  },
  {
    id: 'kia-forte-2014-2018', make: 'Kia', model: 'Forte', yearStart: 2014, yearEnd: 2018, body: 'car',
    blanks: { keyway: 'KK10', ilco: 'KK10-PT', silca: 'HYN14R', jma: 'HY-18.P', oem: '' },
    transponder: { chip: 'ID46', system: 'Kia immobilizer', cloneable: 'Yes' },
    remotes: [{ type: 'flip', fcc: 'OSLOKA-875T', pn: '', buttons: '4B flip' }],
    lock: { codeSeries: 'KK10', spaces: 8, depths: 4, cutMethod: 'Edge cut', decode: 'Lishi KIA7' },
    programming: { obd: 'Yes', onboard: 'No', allKeysLost: 'OBD + PIN', pinRequired: 'YES — PIN by VIN', notes: '' },
    obdPort: 'Driver side, under dash', doorUnlock: 'Lishi KIA7', verified: false
  },

  /* ---------------- STELLANTIS ---------------- */
  {
    id: 'jeep-grand-cherokee-2014-2021', make: 'Jeep', model: 'Grand Cherokee', yearStart: 2014, yearEnd: 2021, body: 'suv',
    blanks: { keyway: 'CY24 (emergency blade)', ilco: 'Y170-PT', silca: 'CY24', jma: 'CHR-15.P', oem: '68143502' },
    transponder: { chip: 'ID46 (Hitag2)', system: 'RFHM / SKREEM', cloneable: 'No on prox' },
    remotes: [{ type: 'prox', fcc: 'M3N-40821302', pn: '68143502', buttons: '5B smart key' }],
    lock: { codeSeries: 'CY24', spaces: 8, depths: 4, cutMethod: 'Edge cut', decode: 'Lishi CY24' },
    programming: { obd: 'Yes', onboard: 'Add-a-key with 2 working', allKeysLost: 'OBD + 4-digit PIN', pinRequired: 'YES for AKL', notes: '' },
    obdPort: 'Driver side, under dash', doorUnlock: 'Lishi CY24', verified: false
  },
  {
    id: 'jeep-cherokee-2014-2021', make: 'Jeep', model: 'Cherokee', yearStart: 2014, yearEnd: 2021, body: 'suv',
    blanks: { keyway: 'SIP22', ilco: 'FT48-PT', silca: 'SIP22', jma: 'FI-21.P', oem: '' },
    transponder: { chip: 'ID46 (Hitag2)', system: 'Fiat platform immobilizer', cloneable: 'No' },
    remotes: [{ type: 'prox', fcc: 'M3N-40821302', pn: '', buttons: '4B / 5B' }],
    lock: { codeSeries: 'SIP22', spaces: 8, depths: 4, cutMethod: 'Laser / sidewinder', decode: 'Lishi SIP22' },
    programming: { obd: 'Yes', onboard: 'Limited', allKeysLost: 'OBD + PIN', pinRequired: 'YES', notes: 'Fiat platform, not the CY24 Jeep you expect — bring SIP22.' },
    obdPort: 'Driver side, under dash', doorUnlock: 'Lishi SIP22', verified: false
  },
  {
    id: 'jeep-wrangler-2018-2023', make: 'Jeep', model: 'Wrangler JL', yearStart: 2018, yearEnd: 2023, body: 'suv',
    blanks: { keyway: 'SIP22', ilco: 'FT48-PT', silca: 'SIP22', jma: 'FI-21.P', oem: '' },
    transponder: { chip: 'ID4A (Hitag AES)', system: 'Stellantis immobilizer', cloneable: 'No' },
    remotes: [{ type: 'prox', fcc: 'OHT1130261', pn: '', buttons: '4B / 5B' }],
    lock: { codeSeries: 'SIP22', spaces: 8, depths: 4, cutMethod: 'Laser / sidewinder', decode: 'Lishi SIP22' },
    programming: { obd: 'Yes', onboard: 'No', allKeysLost: 'OBD + PIN, tool-dependent', pinRequired: 'YES', notes: 'JL is a different platform from the JK — do not assume CY24.' },
    obdPort: 'Driver side, under dash', doorUnlock: 'Soft top: unzip. Hard top: Lishi SIP22.', verified: false
  },
  {
    id: 'dodge-charger-2011-2023', make: 'Dodge', model: 'Charger / Challenger', yearStart: 2011, yearEnd: 2023, body: 'car',
    blanks: { keyway: 'CY24 (emergency blade)', ilco: 'Y170-PT', silca: 'CY24', jma: 'CHR-15.P', oem: '' },
    transponder: { chip: 'ID46 (Hitag2)', system: 'RFHM', cloneable: 'No on prox' },
    remotes: [{ type: 'prox', fcc: 'M3N-40821302', pn: '', buttons: '4B / 5B' }],
    lock: { codeSeries: 'CY24', spaces: 8, depths: 4, cutMethod: 'Edge cut', decode: 'Lishi CY24' },
    programming: { obd: 'Yes', onboard: 'Add-a-key with 2 working', allKeysLost: 'OBD + PIN', pinRequired: 'YES for AKL', notes: '' },
    obdPort: 'Driver side, under dash', doorUnlock: 'Lishi CY24', verified: false
  },
  {
    id: 'chrysler-pacifica-2017-2023', make: 'Chrysler', model: 'Pacifica', yearStart: 2017, yearEnd: 2023, body: 'van',
    blanks: { keyway: 'SIP22', ilco: 'FT48-PT', silca: 'SIP22', jma: 'FI-21.P', oem: '' },
    transponder: { chip: 'ID4A (Hitag AES)', system: 'Stellantis immobilizer', cloneable: 'No' },
    remotes: [{ type: 'prox', fcc: 'M3N-97395900', pn: '', buttons: '6B / 7B w/ sliding doors' }],
    lock: { codeSeries: 'SIP22', spaces: 8, depths: 4, cutMethod: 'Laser / sidewinder', decode: 'Lishi SIP22' },
    programming: { obd: 'Yes', onboard: 'No', allKeysLost: 'OBD + PIN', pinRequired: 'YES', notes: '' },
    obdPort: 'Driver side, under dash', doorUnlock: 'Lishi SIP22', verified: false
  },
  {
    id: 'dodge-caravan-2008-2020', make: 'Dodge', model: 'Grand Caravan', yearStart: 2008, yearEnd: 2020, body: 'van',
    blanks: { keyway: 'CY24', ilco: 'Y164-PT', silca: 'CY24', jma: 'CHR-15.P', oem: '' },
    transponder: { chip: 'ID46 (Hitag2)', system: 'SKREEM', cloneable: 'Yes on some' },
    remotes: [{ type: 'fob', fcc: 'IYZ-C01C', pn: '', buttons: '5B / 6B' }],
    lock: { codeSeries: 'CY24', spaces: 8, depths: 4, cutMethod: 'Edge cut', decode: 'Lishi CY24' },
    programming: { obd: 'Yes', onboard: '2 working keys onboard add', allKeysLost: 'OBD + PIN', pinRequired: 'YES for AKL', notes: 'Very common lockout call. Sliding door is often the easy entry.' },
    obdPort: 'Driver side, under dash', doorUnlock: 'Lishi CY24', verified: false
  },
  {
    id: 'ram-promaster-2014-2023', make: 'Ram', model: 'ProMaster', yearStart: 2014, yearEnd: 2023, body: 'van',
    blanks: { keyway: 'SIP22', ilco: 'FT48-PT', silca: 'SIP22', jma: 'FI-21.P', oem: '' },
    transponder: { chip: 'ID46 (Hitag2)', system: 'Fiat platform immobilizer', cloneable: 'No' },
    remotes: [{ type: 'flip', fcc: '', pn: '', buttons: '3B flip' }],
    lock: { codeSeries: 'SIP22', spaces: 8, depths: 4, cutMethod: 'Laser / sidewinder', decode: 'Lishi SIP22' },
    programming: { obd: 'Yes', onboard: 'No', allKeysLost: 'OBD + PIN', pinRequired: 'YES', notes: 'Fleet vans — expect all-keys-lost with no paperwork. Verify ownership.' },
    obdPort: 'Driver side, under dash', doorUnlock: 'Lishi SIP22', verified: false
  },

  /* ---------------- VW / AUDI / EURO ---------------- */
  {
    id: 'vw-tiguan-2018-2023', make: 'Volkswagen', model: 'Tiguan', yearStart: 2018, yearEnd: 2023, body: 'suv',
    blanks: { keyway: 'HU162T', ilco: 'HU162T-PT', silca: 'HU162T', jma: 'TP00VAG-7.P', oem: '' },
    transponder: { chip: 'MQB (ID88 / AES)', system: 'MQB immobilizer', cloneable: 'No' },
    remotes: [{ type: 'prox', fcc: 'NBGFS12A01', pn: '', buttons: '4B' }],
    lock: { codeSeries: 'HU162T', spaces: 9, depths: 4, cutMethod: 'Laser / sidewinder', decode: 'Lishi HU162T' },
    programming: { obd: 'Yes with an MQB-capable tool', onboard: 'No', allKeysLost: 'MQB AKL — specialist job', pinRequired: 'Component security data', notes: 'MQB is a different price bracket. Quote it as one.' },
    obdPort: 'Driver side, under dash', doorUnlock: 'Lishi HU162T', verified: false
  },
  {
    id: 'audi-a4-2009-2016', make: 'Audi', model: 'A4', yearStart: 2009, yearEnd: 2016, body: 'car',
    blanks: { keyway: 'HU66', ilco: 'HU66AT4', silca: 'HU66', jma: 'TP00VA-6D.P', oem: '' },
    transponder: { chip: 'ID48 (Megamos)', system: 'Immobilizer 4', cloneable: 'With a capable cloner' },
    remotes: [{ type: 'flip', fcc: 'IYZFBSB802', pn: '', buttons: '3B / 4B flip' }],
    lock: { codeSeries: 'HU66', spaces: 8, depths: 4, cutMethod: 'Laser / sidewinder', decode: 'Lishi HU66' },
    programming: { obd: 'Sometimes — often bench', onboard: 'No', allKeysLost: 'Usually needs the cluster / immo data', pinRequired: 'CS code', notes: '' },
    obdPort: 'Driver side, under dash', doorUnlock: 'Lishi HU66', verified: false
  },
  {
    id: 'mercedes-sprinter-2007-2018', make: 'Mercedes-Benz', model: 'Sprinter', yearStart: 2007, yearEnd: 2018, body: 'van',
    blanks: { keyway: 'HU64 / YM23 by trim', ilco: 'HU64', silca: 'HU64', jma: 'TP00ME-10.P', oem: '' },
    transponder: { chip: 'FBS3 on later; earlier vary', system: 'FBS3 / DAS', cloneable: 'No' },
    remotes: [{ type: 'fob', fcc: '', pn: '', buttons: '3B' }],
    lock: { codeSeries: 'HU64', spaces: 10, depths: 4, cutMethod: 'Laser / sidewinder', decode: 'Lishi HU64' },
    programming: { obd: 'No on FBS3 — EIS work', onboard: 'No', allKeysLost: 'EIS read + password calc', pinRequired: 'Password from EIS', notes: 'Commercial fleet work. Specialist job, price accordingly.' },
    obdPort: 'Driver side, under dash', doorUnlock: 'Lishi HU64', verified: false
  },

  /* ---------------- SUBARU / MAZDA / MITSUBISHI ---------------- */
  {
    id: 'subaru-forester-2014-2018', make: 'Subaru', model: 'Forester', yearStart: 2014, yearEnd: 2018, body: 'suv',
    blanks: { keyway: 'SUB4', ilco: 'SUB4-PT', silca: 'SUB4', jma: 'SUBA-6.P', oem: '' },
    transponder: { chip: 'ID47 / Hitag3', system: 'Subaru immobilizer', cloneable: 'No' },
    remotes: [{ type: 'prox', fcc: 'HYQ14AHC', pn: '', buttons: '4B smart key' }],
    lock: { codeSeries: 'SUB4', spaces: 8, depths: 4, cutMethod: 'Edge cut', decode: 'Lishi SUB4' },
    programming: { obd: 'Yes', onboard: 'No', allKeysLost: 'OBD + PIN/seed', pinRequired: 'Tool-dependent', notes: '' },
    obdPort: 'Driver side, under dash', doorUnlock: 'Lishi SUB4', verified: false
  },
  {
    id: 'subaru-crosstrek-2013-2022', make: 'Subaru', model: 'Impreza / Crosstrek', yearStart: 2013, yearEnd: 2022, body: 'suv',
    blanks: { keyway: 'SUB4', ilco: 'SUB4-PT', silca: 'SUB4', jma: 'SUBA-6.P', oem: '' },
    transponder: { chip: 'ID47 / Hitag3', system: 'Subaru immobilizer', cloneable: 'No' },
    remotes: [{ type: 'prox', fcc: 'HYQ14AHK', pn: '', buttons: '4B' }],
    lock: { codeSeries: 'SUB4', spaces: 8, depths: 4, cutMethod: 'Edge cut', decode: 'Lishi SUB4' },
    programming: { obd: 'Yes', onboard: 'No', allKeysLost: 'OBD + PIN/seed', pinRequired: 'Tool-dependent', notes: '' },
    obdPort: 'Driver side, under dash', doorUnlock: 'Lishi SUB4', verified: false
  },
  {
    id: 'mazda-cx5-2013-2021', make: 'Mazda', model: 'CX-5', yearStart: 2013, yearEnd: 2021, body: 'suv',
    blanks: { keyway: 'MAZ24', ilco: 'MAZ24R-PT', silca: 'MAZ24R', jma: 'MAZ-16.P', oem: '' },
    transponder: { chip: 'ID49 / Hitag Pro', system: 'Mazda immobilizer', cloneable: 'No' },
    remotes: [{ type: 'prox', fcc: 'WAZSKE13D01', pn: '', buttons: '3B / 4B smart key' }],
    lock: { codeSeries: 'MAZ24', spaces: 8, depths: 4, cutMethod: 'Laser / sidewinder', decode: 'Lishi MAZ24' },
    programming: { obd: 'Yes', onboard: 'Limited', allKeysLost: 'OBD', pinRequired: 'No', notes: '' },
    obdPort: 'Driver side, under dash', doorUnlock: 'Lishi MAZ24', verified: false
  },
  {
    id: 'mitsubishi-outlander-2014-2021', make: 'Mitsubishi', model: 'Outlander', yearStart: 2014, yearEnd: 2021, body: 'suv',
    blanks: { keyway: 'MIT11', ilco: 'MIT11-PT', silca: 'MIT11', jma: 'MIT-6.P', oem: '' },
    transponder: { chip: 'ID46', system: 'Mitsubishi immobilizer', cloneable: 'Some' },
    remotes: [{ type: 'prox', fcc: 'OUCJ166N', pn: '', buttons: '4B' }],
    lock: { codeSeries: 'MIT11 8-cut', spaces: 8, depths: 4, cutMethod: 'Edge cut', decode: 'Lishi MIT11' },
    programming: { obd: 'Yes', onboard: 'No', allKeysLost: 'OBD + PIN', pinRequired: 'Often', notes: '' },
    obdPort: 'Driver side, under dash', doorUnlock: 'Lishi MIT11', verified: false
  },

  /* ---------------- EV / OTHER ---------------- */
  {
    id: 'tesla-model3-y-2017-2024', make: 'Tesla', model: 'Model 3 / Model Y', yearStart: 2017, yearEnd: 2024, body: 'car',
    blanks: { keyway: 'None — no mechanical key', ilco: '', silca: '', jma: '', oem: 'Key card / phone key / key fob' },
    transponder: { chip: 'NFC key card, BLE phone key', system: 'Tesla BLE / NFC', cloneable: 'No' },
    remotes: [{ type: 'prox', fcc: '', pn: '', buttons: 'Optional BLE fob' }],
    lock: { codeSeries: 'n/a', spaces: '', depths: '', cutMethod: 'n/a', decode: 'n/a' },
    programming: { obd: 'No conventional OBD port', onboard: 'Owner pairs a new card via the touchscreen with an existing card', allKeysLost: 'Tesla service — not a locksmith job', pinRequired: 'No', notes: 'There is nothing to cut. Lockouts are the only realistic call, and there is no mechanical override on the door.' },
    obdPort: 'None in the usual place — diagnostic connector is behind the front trim',
    doorUnlock: 'No mechanical keyway. Do not attempt entry tools on the frameless glass — refer the owner to Tesla or roadside.', verified: false
  },
  {
    id: 'polaris-rzr-ranger', make: 'Polaris', model: 'RZR / Ranger / General', yearStart: 2010, yearEnd: 2026, body: 'moto',
    blanks: { keyway: 'Polaris', ilco: '', silca: '', jma: '', oem: 'varies by model' },
    transponder: { chip: 'None on most', system: 'None', cloneable: 'n/a' },
    remotes: [{ type: '', fcc: '', pn: '', buttons: '' }],
    lock: { codeSeries: 'Polaris', spaces: 6, depths: 4, cutMethod: 'Edge cut', decode: 'Impression or decode the ignition' },
    programming: { obd: 'n/a', onboard: 'n/a', allKeysLost: 'Cut by code or impression', pinRequired: 'No', notes: 'No immobilizer on most. Fast, high-margin work — worth stocking the blanks.' },
    obdPort: 'n/a', doorUnlock: 'n/a', verified: false
  },

  /* ===== TOYOTA — cars ===== */
  {
    id: 'toyota-camry-1997-2001', make: 'Toyota', model: 'Camry', yearStart: 1997, yearEnd: 2001, body: 'car',
    blanks: { keyway: 'TOY43', ilco: 'TOY43', silca: 'TOY43', jma: 'TOYO-21', oem: '' },
    transponder: { chip: 'None on most; 4C on late builds', system: 'Pre-immobilizer / early 4C', cloneable: '4C clones easily' },
    remotes: [{ type: 'fob', fcc: '', pn: '', buttons: 'Aftermarket or dealer add-on' }],
    lock: { codeSeries: 'TOY43 8-cut', spaces: 8, depths: 4, cutMethod: 'Edge cut', decode: 'Lishi TOY43, or impression' },
    programming: { obd: 'n/a on non-chip', onboard: 'n/a', allKeysLost: 'Cut by code or decode the door', pinRequired: 'No', notes: 'Fast money — no chip, no tool. Confirm with a chip sniffer before you quote a programming fee.' },
    obdPort: 'Driver side, under dash', doorUnlock: 'Lishi TOY43 or wedge and reach', verified: false
  },
  {
    id: 'toyota-camry-2002-2006', make: 'Toyota', model: 'Camry', yearStart: 2002, yearEnd: 2006, body: 'car',
    blanks: { keyway: 'TOY43', ilco: 'TOY43-PT', silca: 'TOY43', jma: 'TOYO-21.P', oem: '' },
    transponder: { chip: '4C', system: 'Toyota immobilizer', cloneable: 'Yes — 4C is the easy one' },
    remotes: [{ type: 'fob', fcc: 'GQ43VT14T', pn: '', buttons: '3B / 4B separate fob' }],
    lock: { codeSeries: 'TOY43 8-cut', spaces: 8, depths: 4, cutMethod: 'Edge cut', decode: 'Lishi TOY43' },
    programming: { obd: 'Yes', onboard: 'Yes — ignition-cycle procedure', allKeysLost: 'OBD, or ECU reset on some', pinRequired: 'No', notes: '' },
    obdPort: 'Driver side, under dash', doorUnlock: 'Lishi TOY43', verified: false
  },
  {
    id: 'toyota-camry-2018-2024', make: 'Toyota', model: 'Camry', yearStart: 2018, yearEnd: 2024, body: 'car',
    blanks: { keyway: 'TOY48 (emergency blade)', ilco: 'TOY44H-PT', silca: 'TOY48', jma: 'TP00TOYO-15.P', oem: '' },
    transponder: { chip: '8A / H chip (AES)', system: 'Toyota smart entry', cloneable: 'No' },
    remotes: [{ type: 'prox', fcc: 'HYQ14FBC', pn: '', buttons: '4B / 5B smart key' }],
    lock: { codeSeries: 'TOY48', spaces: 10, depths: 4, cutMethod: 'Laser / sidewinder', decode: 'Lishi TOY48 on the door' },
    programming: { obd: 'Yes with an H-capable tool', onboard: 'No', allKeysLost: 'OBD + 16-min security wait', pinRequired: 'No', notes: 'TNGA platform. Cheap clone tools will not touch it.' },
    obdPort: 'Driver side, under dash', doorUnlock: 'Lishi TOY48', verified: false
  },
  {
    id: 'toyota-corolla-1998-2002', make: 'Toyota', model: 'Corolla', yearStart: 1998, yearEnd: 2002, body: 'car',
    blanks: { keyway: 'TOY43', ilco: 'TOY43', silca: 'TOY43', jma: 'TOYO-21', oem: '' },
    transponder: { chip: 'None on most', system: 'Pre-immobilizer', cloneable: 'n/a' },
    remotes: [{ type: 'fob', fcc: '', pn: '', buttons: 'Dealer add-on if fitted' }],
    lock: { codeSeries: 'TOY43 8-cut', spaces: 8, depths: 4, cutMethod: 'Edge cut', decode: 'Lishi TOY43 or impression' },
    programming: { obd: 'n/a', onboard: 'n/a', allKeysLost: 'Cut by code or decode', pinRequired: 'No', notes: '' },
    obdPort: 'Driver side, under dash', doorUnlock: 'Lishi TOY43', verified: false
  },
  {
    id: 'toyota-corolla-2003-2008', make: 'Toyota', model: 'Corolla', yearStart: 2003, yearEnd: 2008, body: 'car',
    blanks: { keyway: 'TOY43', ilco: 'TOY43-PT', silca: 'TOY43', jma: 'TOYO-21.P', oem: '' },
    transponder: { chip: '4C / 4D-67 dot on later', system: 'Toyota immobilizer', cloneable: 'Yes' },
    remotes: [{ type: 'fob', fcc: 'GQ43VT14T', pn: '', buttons: '3B' }],
    lock: { codeSeries: 'TOY43 8-cut', spaces: 8, depths: 4, cutMethod: 'Edge cut', decode: 'Lishi TOY43' },
    programming: { obd: 'Yes', onboard: 'Yes on chip trims', allKeysLost: 'OBD', pinRequired: 'No', notes: 'Base trims of these years often have no chip at all — check before quoting.' },
    obdPort: 'Driver side, under dash', doorUnlock: 'Lishi TOY43', verified: false
  },
  {
    id: 'toyota-corolla-2020-2025', make: 'Toyota', model: 'Corolla', yearStart: 2020, yearEnd: 2025, body: 'car',
    blanks: { keyway: 'TOY48 (emergency blade)', ilco: 'TOY44H-PT', silca: 'TOY48', jma: 'TP00TOYO-15.P', oem: '' },
    transponder: { chip: '8A / H chip (AES)', system: 'Toyota smart entry', cloneable: 'No' },
    remotes: [{ type: 'prox', fcc: 'HYQ14FBC', pn: '', buttons: '3B / 4B smart key' }],
    lock: { codeSeries: 'TOY48', spaces: 10, depths: 4, cutMethod: 'Laser / sidewinder', decode: 'Lishi TOY48' },
    programming: { obd: 'Yes with an H-capable tool', onboard: 'No', allKeysLost: 'OBD + 16-min wait', pinRequired: 'No', notes: '' },
    obdPort: 'Driver side, under dash', doorUnlock: 'Lishi TOY48', verified: false
  },
  {
    id: 'toyota-avalon-2005-2012', make: 'Toyota', model: 'Avalon', yearStart: 2005, yearEnd: 2012, body: 'car',
    blanks: { keyway: 'TOY48', ilco: 'TOY44D-PT', silca: 'TOY48', jma: 'TP00TOYO-15.P', oem: '' },
    transponder: { chip: '4D-67 dot; G on 2011+', system: 'Toyota immobilizer / smart entry', cloneable: 'Dot yes, G needs a G cloner' },
    remotes: [{ type: 'prox', fcc: 'HYQ14AAB', pn: '', buttons: '4B smart key' }],
    lock: { codeSeries: 'TOY48', spaces: 10, depths: 4, cutMethod: 'Laser / sidewinder', decode: 'Lishi TOY48' },
    programming: { obd: 'Yes', onboard: 'Blade trims only', allKeysLost: 'OBD', pinRequired: 'No', notes: 'One of the earliest Toyota smart-key platforms in the US.' },
    obdPort: 'Driver side, under dash', doorUnlock: 'Lishi TOY48', verified: false
  },
  {
    id: 'toyota-avalon-2013-2018', make: 'Toyota', model: 'Avalon', yearStart: 2013, yearEnd: 2018, body: 'car',
    blanks: { keyway: 'TOY48 (emergency blade)', ilco: 'TOY44H-PT', silca: 'TOY48', jma: 'TP00TOYO-15.P', oem: '' },
    transponder: { chip: '8A / H chip', system: 'Toyota smart entry', cloneable: 'No' },
    remotes: [{ type: 'prox', fcc: 'HYQ14FBA', pn: '', buttons: '4B / 5B' }],
    lock: { codeSeries: 'TOY48', spaces: 10, depths: 4, cutMethod: 'Laser / sidewinder', decode: 'Lishi TOY48' },
    programming: { obd: 'Yes', onboard: 'No', allKeysLost: 'OBD + 16-min wait', pinRequired: 'No', notes: '' },
    obdPort: 'Driver side, under dash', doorUnlock: 'Lishi TOY48', verified: false
  },
  {
    id: 'toyota-yaris-2007-2018', make: 'Toyota', model: 'Yaris', yearStart: 2007, yearEnd: 2018, body: 'car',
    blanks: { keyway: 'TOY43', ilco: 'TOY43-PT', silca: 'TOY43', jma: 'TOYO-21.P', oem: '' },
    transponder: { chip: '4D-67 dot; G on later', system: 'Toyota immobilizer', cloneable: 'Dot yes' },
    remotes: [{ type: 'fob', fcc: 'GQ4-29T', pn: '', buttons: '3B' }],
    lock: { codeSeries: 'TOY43 8-cut', spaces: 8, depths: 4, cutMethod: 'Edge cut', decode: 'Lishi TOY43' },
    programming: { obd: 'Yes', onboard: 'Yes on blade trims', allKeysLost: 'OBD', pinRequired: 'No', notes: 'Some base trims shipped with no immobilizer.' },
    obdPort: 'Driver side, under dash', doorUnlock: 'Lishi TOY43', verified: false
  },
  {
    id: 'toyota-yaris-ia-2016-2020', make: 'Toyota', model: 'Yaris iA / Yaris sedan', yearStart: 2016, yearEnd: 2020, body: 'car',
    blanks: { keyway: 'MAZ24', ilco: 'MAZ24R-PT', silca: 'MAZ24R', jma: 'MAZ-16.P', oem: '' },
    transponder: { chip: 'ID49 / Hitag Pro (Mazda)', system: 'Mazda immobilizer', cloneable: 'No' },
    remotes: [{ type: 'fob', fcc: '', pn: '', buttons: '3B' }],
    lock: { codeSeries: 'MAZ24', spaces: 8, depths: 4, cutMethod: 'Laser / sidewinder', decode: 'Lishi MAZ24' },
    programming: { obd: 'Yes — use the Mazda menu, not Toyota', onboard: 'No', allKeysLost: 'OBD as a Mazda 2', pinRequired: 'No', notes: 'GOTCHA: this is a rebadged Mazda 2. Toyota blanks and Toyota software will both fail you.' },
    obdPort: 'Driver side, under dash', doorUnlock: 'Lishi MAZ24', verified: false
  },
  {
    id: 'toyota-prius-2004-2009', make: 'Toyota', model: 'Prius', yearStart: 2004, yearEnd: 2009, body: 'car',
    blanks: { keyway: 'TOY43 / TOY48 by trim', ilco: 'TOY43-PT', silca: 'TOY43', jma: 'TOYO-21.P', oem: '' },
    transponder: { chip: '4D-67 dot', system: 'Toyota immobilizer / early smart entry', cloneable: 'Yes' },
    remotes: [{ type: 'prox', fcc: 'MOZB21TG', pn: '', buttons: '3B smart key (option)' }],
    lock: { codeSeries: 'TOY43 / TOY48', spaces: 8, depths: 4, cutMethod: 'Edge or laser by trim', decode: 'Lishi TOY43 or TOY48' },
    programming: { obd: 'Yes', onboard: 'Blade trims', allKeysLost: 'OBD', pinRequired: 'No', notes: 'Smart-key trims have no conventional ignition.' },
    obdPort: 'Driver side, under dash', doorUnlock: 'Lishi by trim', verified: false
  },
  {
    id: 'toyota-prius-2016-2022', make: 'Toyota', model: 'Prius', yearStart: 2016, yearEnd: 2022, body: 'car',
    blanks: { keyway: 'TOY48 (emergency blade)', ilco: 'TOY44H-PT', silca: 'TOY48', jma: 'TP00TOYO-15.P', oem: '' },
    transponder: { chip: '8A / H chip (AES)', system: 'Toyota smart entry', cloneable: 'No' },
    remotes: [{ type: 'prox', fcc: 'HYQ14FBA / HYQ14FLA', pn: '', buttons: '4B smart key' }],
    lock: { codeSeries: 'TOY48', spaces: 10, depths: 4, cutMethod: 'Laser / sidewinder', decode: 'Lishi TOY48 on the door' },
    programming: { obd: 'Yes with an H-capable tool', onboard: 'No', allKeysLost: 'OBD + 16-min wait', pinRequired: 'No', notes: 'No mechanical ignition — the blade only opens the door.' },
    obdPort: 'Driver side, under dash', doorUnlock: 'Lishi TOY48', verified: false
  },
  {
    id: 'toyota-matrix-2003-2013', make: 'Toyota', model: 'Matrix', yearStart: 2003, yearEnd: 2013, body: 'car',
    blanks: { keyway: 'TOY43', ilco: 'TOY43-PT', silca: 'TOY43', jma: 'TOYO-21.P', oem: '' },
    transponder: { chip: '4C / 4D-67 dot by year', system: 'Toyota immobilizer', cloneable: 'Yes' },
    remotes: [{ type: 'fob', fcc: 'GQ43VT20T', pn: '', buttons: '3B / 4B' }],
    lock: { codeSeries: 'TOY43 8-cut', spaces: 8, depths: 4, cutMethod: 'Edge cut', decode: 'Lishi TOY43' },
    programming: { obd: 'Yes', onboard: 'Yes', allKeysLost: 'OBD', pinRequired: 'No', notes: 'Corolla mechanicals. Pontiac Vibe of the same years is the same car.' },
    obdPort: 'Driver side, under dash', doorUnlock: 'Lishi TOY43', verified: false
  },
  {
    id: 'toyota-solara-2004-2008', make: 'Toyota', model: 'Camry Solara', yearStart: 2004, yearEnd: 2008, body: 'car',
    blanks: { keyway: 'TOY43', ilco: 'TOY43-PT', silca: 'TOY43', jma: 'TOYO-21.P', oem: '' },
    transponder: { chip: '4D-67 dot', system: 'Toyota immobilizer', cloneable: 'Yes' },
    remotes: [{ type: 'fob', fcc: 'GQ43VT14T', pn: '', buttons: '3B / 4B' }],
    lock: { codeSeries: 'TOY43 8-cut', spaces: 8, depths: 4, cutMethod: 'Edge cut', decode: 'Lishi TOY43' },
    programming: { obd: 'Yes', onboard: 'Yes', allKeysLost: 'OBD', pinRequired: 'No', notes: '' },
    obdPort: 'Driver side, under dash', doorUnlock: 'Lishi TOY43', verified: false
  },
  {
    id: 'toyota-venza-2009-2015', make: 'Toyota', model: 'Venza', yearStart: 2009, yearEnd: 2015, body: 'suv',
    blanks: { keyway: 'TOY48', ilco: 'TOY44D-PT', silca: 'TOY48', jma: 'TP00TOYO-15.P', oem: '' },
    transponder: { chip: '4D-67 dot; G on 2011+', system: 'Toyota immobilizer / smart entry', cloneable: 'Dot yes' },
    remotes: [{ type: 'prox', fcc: 'HYQ14AAB', pn: '', buttons: '4B smart key' }],
    lock: { codeSeries: 'TOY48', spaces: 10, depths: 4, cutMethod: 'Laser / sidewinder', decode: 'Lishi TOY48' },
    programming: { obd: 'Yes', onboard: 'Blade trims', allKeysLost: 'OBD', pinRequired: 'No', notes: '' },
    obdPort: 'Driver side, under dash', doorUnlock: 'Lishi TOY48', verified: false
  },
  {
    id: 'toyota-chr-2018-2022', make: 'Toyota', model: 'C-HR', yearStart: 2018, yearEnd: 2022, body: 'suv',
    blanks: { keyway: 'TOY48 (emergency blade)', ilco: 'TOY44H-PT', silca: 'TOY48', jma: 'TP00TOYO-15.P', oem: '' },
    transponder: { chip: '8A / H chip', system: 'Toyota smart entry', cloneable: 'No' },
    remotes: [{ type: 'prox', fcc: 'HYQ14FBC', pn: '', buttons: '3B / 4B' }],
    lock: { codeSeries: 'TOY48', spaces: 10, depths: 4, cutMethod: 'Laser / sidewinder', decode: 'Lishi TOY48' },
    programming: { obd: 'Yes', onboard: 'No', allKeysLost: 'OBD + 16-min wait', pinRequired: 'No', notes: '' },
    obdPort: 'Driver side, under dash', doorUnlock: 'Lishi TOY48', verified: false
  },
  {
    id: 'toyota-86-2017-2024', make: 'Toyota', model: '86 / GR86', yearStart: 2017, yearEnd: 2024, body: 'car',
    blanks: { keyway: 'SUB4', ilco: 'SUB4-PT', silca: 'SUB4', jma: 'SUBA-6.P', oem: '' },
    transponder: { chip: 'Subaru ID47 / Hitag3', system: 'Subaru immobilizer', cloneable: 'No' },
    remotes: [{ type: 'prox', fcc: '', pn: '', buttons: '3B / 4B' }],
    lock: { codeSeries: 'SUB4', spaces: 8, depths: 4, cutMethod: 'Edge cut', decode: 'Lishi SUB4' },
    programming: { obd: 'Yes — work it as a Subaru', onboard: 'No', allKeysLost: 'OBD as Subaru BRZ', pinRequired: 'Tool-dependent', notes: 'GOTCHA: built by Subaru. Subaru blank, Subaru software. Same car as the BRZ.' },
    obdPort: 'Driver side, under dash', doorUnlock: 'Lishi SUB4', verified: false
  },
  {
    id: 'toyota-supra-2020-2025', make: 'Toyota', model: 'GR Supra', yearStart: 2020, yearEnd: 2025, body: 'car',
    blanks: { keyway: 'HU100R', ilco: 'BMW1', silca: 'HU100R', jma: 'TP00BM-20.P', oem: 'BMW-style fob' },
    transponder: { chip: 'BMW FEM/BDC', system: 'BMW immobilizer', cloneable: 'No' },
    remotes: [{ type: 'prox', fcc: '', pn: '', buttons: '3B BMW-style' }],
    lock: { codeSeries: 'HU100R', spaces: 10, depths: 4, cutMethod: 'Laser / sidewinder', decode: 'Lishi HU100R' },
    programming: { obd: 'BMW procedure — often bench', onboard: 'No', allKeysLost: 'BMW FEM/BDC work, ISN required', pinRequired: 'ISN', notes: 'GOTCHA: this is a BMW Z4 underneath. Toyota tooling will not see it. Quote it as a BMW or refer it out.' },
    obdPort: 'Driver side, under dash', doorUnlock: 'Lishi HU100R', verified: false
  },
  /* ===== TOYOTA — trucks and SUVs ===== */
  {
    id: 'toyota-tacoma-1995-2004', make: 'Toyota', model: 'Tacoma', yearStart: 1995, yearEnd: 2004, body: 'truck',
    blanks: { keyway: 'TOY43 / TR47', ilco: 'TOY43', silca: 'TOY43', jma: 'TOYO-21', oem: '' },
    transponder: { chip: 'None on most', system: 'Pre-immobilizer', cloneable: 'n/a' },
    remotes: [{ type: 'fob', fcc: '', pn: '', buttons: 'Dealer add-on if fitted' }],
    lock: { codeSeries: 'TOY43 8-cut', spaces: 8, depths: 4, cutMethod: 'Edge cut', decode: 'Lishi TOY43 or impression' },
    programming: { obd: 'n/a', onboard: 'n/a', allKeysLost: 'Cut by code or decode the ignition', pinRequired: 'No', notes: 'No chip. Quick job, and these are still everywhere.' },
    obdPort: 'Driver side, under dash', doorUnlock: 'Lishi TOY43 or wedge and reach', verified: false
  },
  {
    id: 'toyota-tacoma-2005-2015', make: 'Toyota', model: 'Tacoma', yearStart: 2005, yearEnd: 2015, body: 'truck',
    blanks: { keyway: 'TOY43', ilco: 'TOY43-PT', silca: 'TOY43', jma: 'TOYO-21.P', oem: '' },
    transponder: { chip: '4D-67 dot; G on 2011+', system: 'Toyota immobilizer', cloneable: 'Dot yes, G needs a G cloner' },
    remotes: [{ type: 'fob', fcc: 'GQ43VT20T', pn: '', buttons: '3B / 4B' }],
    lock: { codeSeries: 'TOY43 8-cut', spaces: 8, depths: 4, cutMethod: 'Edge cut', decode: 'Lishi TOY43' },
    programming: { obd: 'Yes', onboard: 'Yes on blade trims', allKeysLost: 'OBD', pinRequired: 'No', notes: 'Base work trucks of these years often have no chip at all.' },
    obdPort: 'Driver side, under dash', doorUnlock: 'Lishi TOY43', verified: false
  },
  {
    id: 'toyota-tundra-2000-2006', make: 'Toyota', model: 'Tundra', yearStart: 2000, yearEnd: 2006, body: 'truck',
    blanks: { keyway: 'TOY43', ilco: 'TOY43', silca: 'TOY43', jma: 'TOYO-21', oem: '' },
    transponder: { chip: 'None to 4C by year', system: 'Pre-immobilizer / early 4C', cloneable: '4C yes' },
    remotes: [{ type: 'fob', fcc: '', pn: '', buttons: 'Add-on' }],
    lock: { codeSeries: 'TOY43 8-cut', spaces: 8, depths: 4, cutMethod: 'Edge cut', decode: 'Lishi TOY43' },
    programming: { obd: 'Yes on chip trims', onboard: 'Yes', allKeysLost: 'Cut by code, or OBD if chipped', pinRequired: 'No', notes: '' },
    obdPort: 'Driver side, under dash', doorUnlock: 'Lishi TOY43', verified: false
  },
  {
    id: 'toyota-tundra-2007-2013', make: 'Toyota', model: 'Tundra', yearStart: 2007, yearEnd: 2013, body: 'truck',
    blanks: { keyway: 'TOY43', ilco: 'TOY43-PT', silca: 'TOY43', jma: 'TOYO-21.P', oem: '' },
    transponder: { chip: '4D-67 dot; G on 2011+', system: 'Toyota immobilizer', cloneable: 'Dot yes' },
    remotes: [{ type: 'fob', fcc: 'GQ43VT20T', pn: '', buttons: '3B / 4B' }],
    lock: { codeSeries: 'TOY43 8-cut', spaces: 8, depths: 4, cutMethod: 'Edge cut', decode: 'Lishi TOY43' },
    programming: { obd: 'Yes', onboard: 'Yes on blade trims', allKeysLost: 'OBD', pinRequired: 'No', notes: '' },
    obdPort: 'Driver side, under dash', doorUnlock: 'Lishi TOY43', verified: false
  },
  {
    id: 'toyota-tundra-2022-2025', make: 'Toyota', model: 'Tundra', yearStart: 2022, yearEnd: 2025, body: 'truck',
    blanks: { keyway: 'TOY48 (emergency blade)', ilco: 'TOY44H-PT', silca: 'TOY48', jma: 'TP00TOYO-15.P', oem: '' },
    transponder: { chip: '8A / H chip (AES)', system: 'Toyota smart entry', cloneable: 'No' },
    remotes: [{ type: 'prox', fcc: 'HYQ14FBX', pn: '', buttons: '4B / 5B smart key' }],
    lock: { codeSeries: 'TOY48', spaces: 10, depths: 4, cutMethod: 'Laser / sidewinder', decode: 'Lishi TOY48' },
    programming: { obd: 'Yes with a current H-capable tool', onboard: 'No', allKeysLost: 'OBD + security wait; newest builds may need dealer', pinRequired: 'No', notes: 'Newest generation — check your tool covers it before you commit to the job.' },
    obdPort: 'Driver side, under dash', doorUnlock: 'Lishi TOY48', verified: false
  },
  {
    id: 'toyota-4runner-1996-2002', make: 'Toyota', model: '4Runner', yearStart: 1996, yearEnd: 2002, body: 'suv',
    blanks: { keyway: 'TOY43', ilco: 'TOY43', silca: 'TOY43', jma: 'TOYO-21', oem: '' },
    transponder: { chip: 'None on most', system: 'Pre-immobilizer', cloneable: 'n/a' },
    remotes: [{ type: 'fob', fcc: '', pn: '', buttons: 'Add-on' }],
    lock: { codeSeries: 'TOY43 8-cut', spaces: 8, depths: 4, cutMethod: 'Edge cut', decode: 'Lishi TOY43 or impression' },
    programming: { obd: 'n/a', onboard: 'n/a', allKeysLost: 'Cut by code or decode', pinRequired: 'No', notes: '' },
    obdPort: 'Driver side, under dash', doorUnlock: 'Lishi TOY43', verified: false
  },
  {
    id: 'toyota-4runner-2003-2009', make: 'Toyota', model: '4Runner', yearStart: 2003, yearEnd: 2009, body: 'suv',
    blanks: { keyway: 'TOY43', ilco: 'TOY43-PT', silca: 'TOY43', jma: 'TOYO-21.P', oem: '' },
    transponder: { chip: '4D-67 dot', system: 'Toyota immobilizer', cloneable: 'Yes' },
    remotes: [{ type: 'fob', fcc: 'GQ43VT14T', pn: '', buttons: '3B / 4B' }],
    lock: { codeSeries: 'TOY43 8-cut', spaces: 8, depths: 4, cutMethod: 'Edge cut', decode: 'Lishi TOY43' },
    programming: { obd: 'Yes', onboard: 'Yes', allKeysLost: 'OBD', pinRequired: 'No', notes: '' },
    obdPort: 'Driver side, under dash', doorUnlock: 'Lishi TOY43', verified: false
  },
  {
    id: 'toyota-4runner-2013-2024', make: 'Toyota', model: '4Runner', yearStart: 2013, yearEnd: 2024, body: 'suv',
    blanks: { keyway: 'TOY44H', ilco: 'TOY44H-PT', silca: 'TOY48', jma: 'TP00TOYO-15.P', oem: '89785-0D140' },
    transponder: { chip: '8A / H chip', system: 'Toyota immobilizer / smart entry', cloneable: 'No' },
    remotes: [{ type: 'prox', fcc: 'HYQ14FBA', pn: '', buttons: '3B / 4B smart key' }],
    lock: { codeSeries: 'TOY48', spaces: 10, depths: 4, cutMethod: 'Laser / sidewinder', decode: 'Lishi TOY48' },
    programming: { obd: 'Yes', onboard: 'No', allKeysLost: 'OBD + 16-min wait', pinRequired: 'No', notes: '' },
    obdPort: 'Driver side, under dash', doorUnlock: 'Lishi TOY48', verified: false
  },
  {
    id: 'toyota-highlander-2001-2007', make: 'Toyota', model: 'Highlander', yearStart: 2001, yearEnd: 2007, body: 'suv',
    blanks: { keyway: 'TOY43', ilco: 'TOY43-PT', silca: 'TOY43', jma: 'TOYO-21.P', oem: '' },
    transponder: { chip: '4C / 4D-67 dot by year', system: 'Toyota immobilizer', cloneable: 'Yes' },
    remotes: [{ type: 'fob', fcc: 'GQ43VT14T', pn: '', buttons: '3B / 4B' }],
    lock: { codeSeries: 'TOY43 8-cut', spaces: 8, depths: 4, cutMethod: 'Edge cut', decode: 'Lishi TOY43' },
    programming: { obd: 'Yes', onboard: 'Yes', allKeysLost: 'OBD', pinRequired: 'No', notes: '' },
    obdPort: 'Driver side, under dash', doorUnlock: 'Lishi TOY43', verified: false
  },
  {
    id: 'toyota-highlander-2008-2013', make: 'Toyota', model: 'Highlander', yearStart: 2008, yearEnd: 2013, body: 'suv',
    blanks: { keyway: 'TOY48', ilco: 'TOY44D-PT', silca: 'TOY48', jma: 'TP00TOYO-15.P', oem: '' },
    transponder: { chip: '4D-67 dot; G on 2011+', system: 'Toyota immobilizer / smart entry', cloneable: 'Dot yes' },
    remotes: [{ type: 'prox', fcc: 'HYQ14AAB', pn: '', buttons: '4B smart key' }],
    lock: { codeSeries: 'TOY48', spaces: 10, depths: 4, cutMethod: 'Laser / sidewinder', decode: 'Lishi TOY48' },
    programming: { obd: 'Yes', onboard: 'Blade trims', allKeysLost: 'OBD', pinRequired: 'No', notes: '' },
    obdPort: 'Driver side, under dash', doorUnlock: 'Lishi TOY48', verified: false
  },
  {
    id: 'toyota-highlander-2020-2024', make: 'Toyota', model: 'Highlander', yearStart: 2020, yearEnd: 2024, body: 'suv',
    blanks: { keyway: 'TOY48 (emergency blade)', ilco: 'TOY44H-PT', silca: 'TOY48', jma: 'TP00TOYO-15.P', oem: '' },
    transponder: { chip: '8A / H chip (AES)', system: 'Toyota smart entry', cloneable: 'No' },
    remotes: [{ type: 'prox', fcc: 'HYQ14FBC', pn: '', buttons: '4B / 5B' }],
    lock: { codeSeries: 'TOY48', spaces: 10, depths: 4, cutMethod: 'Laser / sidewinder', decode: 'Lishi TOY48' },
    programming: { obd: 'Yes', onboard: 'No', allKeysLost: 'OBD + 16-min wait', pinRequired: 'No', notes: '' },
    obdPort: 'Driver side, under dash', doorUnlock: 'Lishi TOY48', verified: false
  },
  {
    id: 'toyota-rav4-2001-2005', make: 'Toyota', model: 'RAV4', yearStart: 2001, yearEnd: 2005, body: 'suv',
    blanks: { keyway: 'TOY43', ilco: 'TOY43-PT', silca: 'TOY43', jma: 'TOYO-21.P', oem: '' },
    transponder: { chip: '4C', system: 'Toyota immobilizer', cloneable: 'Yes' },
    remotes: [{ type: 'fob', fcc: '', pn: '', buttons: '3B' }],
    lock: { codeSeries: 'TOY43 8-cut', spaces: 8, depths: 4, cutMethod: 'Edge cut', decode: 'Lishi TOY43' },
    programming: { obd: 'Yes', onboard: 'Yes', allKeysLost: 'OBD', pinRequired: 'No', notes: '' },
    obdPort: 'Driver side, under dash', doorUnlock: 'Lishi TOY43', verified: false
  },
  {
    id: 'toyota-rav4-2006-2012', make: 'Toyota', model: 'RAV4', yearStart: 2006, yearEnd: 2012, body: 'suv',
    blanks: { keyway: 'TOY43', ilco: 'TOY43-PT', silca: 'TOY43', jma: 'TOYO-21.P', oem: '' },
    transponder: { chip: '4D-67 dot; G on 2011+', system: 'Toyota immobilizer', cloneable: 'Dot yes' },
    remotes: [{ type: 'fob', fcc: 'GQ43VT20T', pn: '', buttons: '3B / 4B' }],
    lock: { codeSeries: 'TOY43 8-cut', spaces: 8, depths: 4, cutMethod: 'Edge cut', decode: 'Lishi TOY43' },
    programming: { obd: 'Yes', onboard: 'Yes', allKeysLost: 'OBD', pinRequired: 'No', notes: '' },
    obdPort: 'Driver side, under dash', doorUnlock: 'Lishi TOY43', verified: false
  },
  {
    id: 'toyota-rav4-2019-2025', make: 'Toyota', model: 'RAV4', yearStart: 2019, yearEnd: 2025, body: 'suv',
    blanks: { keyway: 'TOY48 (emergency blade)', ilco: 'TOY44H-PT', silca: 'TOY48', jma: 'TP00TOYO-15.P', oem: '' },
    transponder: { chip: '8A / H chip (AES)', system: 'Toyota smart entry', cloneable: 'No' },
    remotes: [{ type: 'prox', fcc: 'HYQ14FBC', pn: '', buttons: '3B / 4B smart key' }],
    lock: { codeSeries: 'TOY48', spaces: 10, depths: 4, cutMethod: 'Laser / sidewinder', decode: 'Lishi TOY48' },
    programming: { obd: 'Yes with an H-capable tool', onboard: 'No', allKeysLost: 'OBD + 16-min wait', pinRequired: 'No', notes: 'TNGA platform, highest-volume Toyota in the US right now.' },
    obdPort: 'Driver side, under dash', doorUnlock: 'Lishi TOY48', verified: false
  },
  {
    id: 'toyota-sequoia-2001-2007', make: 'Toyota', model: 'Sequoia', yearStart: 2001, yearEnd: 2007, body: 'suv',
    blanks: { keyway: 'TOY43', ilco: 'TOY43-PT', silca: 'TOY43', jma: 'TOYO-21.P', oem: '' },
    transponder: { chip: '4C / 4D-67 dot by year', system: 'Toyota immobilizer', cloneable: 'Yes' },
    remotes: [{ type: 'fob', fcc: 'GQ43VT14T', pn: '', buttons: '3B / 4B' }],
    lock: { codeSeries: 'TOY43 8-cut', spaces: 8, depths: 4, cutMethod: 'Edge cut', decode: 'Lishi TOY43' },
    programming: { obd: 'Yes', onboard: 'Yes', allKeysLost: 'OBD', pinRequired: 'No', notes: '' },
    obdPort: 'Driver side, under dash', doorUnlock: 'Lishi TOY43', verified: false
  },
  {
    id: 'toyota-sequoia-2008-2022', make: 'Toyota', model: 'Sequoia', yearStart: 2008, yearEnd: 2022, body: 'suv',
    blanks: { keyway: 'TOY48', ilco: 'TOY44D-PT / TOY44H-PT by year', silca: 'TOY48', jma: 'TP00TOYO-15.P', oem: '' },
    transponder: { chip: 'Dot to 2010, G 2011-2012, H 2013+', system: 'Toyota smart entry', cloneable: 'Dot/G yes, H no' },
    remotes: [{ type: 'prox', fcc: 'HYQ14FBA', pn: '', buttons: '4B / 5B' }],
    lock: { codeSeries: 'TOY48', spaces: 10, depths: 4, cutMethod: 'Laser / sidewinder', decode: 'Lishi TOY48' },
    programming: { obd: 'Yes', onboard: 'Blade trims early', allKeysLost: 'OBD; 16-min wait on H', pinRequired: 'No', notes: 'Long run spanning all three chip generations — check the key head stamp.' },
    obdPort: 'Driver side, under dash', doorUnlock: 'Lishi TOY48', verified: false
  },
  {
    id: 'toyota-landcruiser-2008-2021', make: 'Toyota', model: 'Land Cruiser', yearStart: 2008, yearEnd: 2021, body: 'suv',
    blanks: { keyway: 'TOY48 (emergency blade)', ilco: 'TOY44D-PT / TOY44H-PT by year', silca: 'TOY48', jma: 'TP00TOYO-15.P', oem: '' },
    transponder: { chip: 'G to 2012, H 2013+', system: 'Toyota smart entry', cloneable: 'No on H' },
    remotes: [{ type: 'prox', fcc: 'HYQ14FBA', pn: '', buttons: '4B smart key' }],
    lock: { codeSeries: 'TOY48', spaces: 10, depths: 4, cutMethod: 'Laser / sidewinder', decode: 'Lishi TOY48' },
    programming: { obd: 'Yes', onboard: 'No', allKeysLost: 'OBD + 16-min wait', pinRequired: 'No', notes: 'High-value vehicle. Verify ownership carefully on an AKL call.' },
    obdPort: 'Driver side, under dash', doorUnlock: 'Lishi TOY48', verified: false
  },
  {
    id: 'toyota-fjcruiser-2007-2014', make: 'Toyota', model: 'FJ Cruiser', yearStart: 2007, yearEnd: 2014, body: 'suv',
    blanks: { keyway: 'TOY43', ilco: 'TOY43-PT', silca: 'TOY43', jma: 'TOYO-21.P', oem: '' },
    transponder: { chip: '4D-67 dot; G on 2011+', system: 'Toyota immobilizer', cloneable: 'Dot yes' },
    remotes: [{ type: 'fob', fcc: 'GQ43VT20T', pn: '', buttons: '3B' }],
    lock: { codeSeries: 'TOY43 8-cut', spaces: 8, depths: 4, cutMethod: 'Edge cut', decode: 'Lishi TOY43' },
    programming: { obd: 'Yes', onboard: 'Yes', allKeysLost: 'OBD', pinRequired: 'No', notes: '' },
    obdPort: 'Driver side, under dash', doorUnlock: 'Lishi TOY43', verified: false
  },
  {
    id: 'toyota-sienna-2004-2010', make: 'Toyota', model: 'Sienna', yearStart: 2004, yearEnd: 2010, body: 'van',
    blanks: { keyway: 'TOY43', ilco: 'TOY43-PT', silca: 'TOY43', jma: 'TOYO-21.P', oem: '' },
    transponder: { chip: '4D-67 dot', system: 'Toyota immobilizer', cloneable: 'Yes' },
    remotes: [{ type: 'fob', fcc: 'GQ43VT20T', pn: '', buttons: '4B / 5B w/ sliding doors' }],
    lock: { codeSeries: 'TOY43 8-cut', spaces: 8, depths: 4, cutMethod: 'Edge cut', decode: 'Lishi TOY43' },
    programming: { obd: 'Yes', onboard: 'Yes', allKeysLost: 'OBD', pinRequired: 'No', notes: 'Frequent lockout call — the sliding door is often the easier entry.' },
    obdPort: 'Driver side, under dash', doorUnlock: 'Lishi TOY43', verified: false
  },
  {
    id: 'toyota-sienna-2021-2024', make: 'Toyota', model: 'Sienna', yearStart: 2021, yearEnd: 2024, body: 'van',
    blanks: { keyway: 'TOY48 (emergency blade)', ilco: 'TOY44H-PT', silca: 'TOY48', jma: 'TP00TOYO-15.P', oem: '' },
    transponder: { chip: '8A / H chip (AES)', system: 'Toyota smart entry', cloneable: 'No' },
    remotes: [{ type: 'prox', fcc: 'HYQ14FBX', pn: '', buttons: '5B / 6B w/ sliding doors' }],
    lock: { codeSeries: 'TOY48', spaces: 10, depths: 4, cutMethod: 'Laser / sidewinder', decode: 'Lishi TOY48' },
    programming: { obd: 'Yes with a current H-capable tool', onboard: 'No', allKeysLost: 'OBD + security wait', pinRequired: 'No', notes: '' },
    obdPort: 'Driver side, under dash', doorUnlock: 'Lishi TOY48', verified: false
  },
  {
    id: 'toyota-4runner-2010-2012', make: 'Toyota', model: '4Runner', yearStart: 2010, yearEnd: 2012, body: 'suv',
    blanks: { keyway: 'TOY44G', ilco: 'TOY44G-PT', silca: 'TOY48', jma: 'TP00TOYO-15.P', oem: '' },
    transponder: { chip: '4D-72 G chip', system: 'Toyota immobilizer', cloneable: 'Yes with a G-capable cloner' },
    remotes: [{ type: 'fob', fcc: 'GQ43VT20T', pn: '', buttons: '3B / 4B' }],
    lock: { codeSeries: 'TOY48', spaces: 10, depths: 4, cutMethod: 'Laser / sidewinder', decode: 'Lishi TOY48' },
    programming: { obd: 'Yes', onboard: 'Yes on blade trims', allKeysLost: 'OBD', pinRequired: 'No', notes: 'G chip years only — 2013 on is the H chip and a different job.' },
    obdPort: 'Driver side, under dash', doorUnlock: 'Lishi TOY48', verified: false
  },
  {
    id: 'toyota-sienna-2011-2012', make: 'Toyota', model: 'Sienna', yearStart: 2011, yearEnd: 2012, body: 'van',
    blanks: { keyway: 'TOY44G', ilco: 'TOY44G-PT', silca: 'TOY48', jma: 'TP00TOYO-15.P', oem: '' },
    transponder: { chip: '4D-72 G chip', system: 'Toyota immobilizer / smart entry', cloneable: 'Yes with a G-capable cloner' },
    remotes: [{ type: 'prox', fcc: 'HYQ14ADR', pn: '', buttons: '5B / 6B w/ sliding doors' }],
    lock: { codeSeries: 'TOY48', spaces: 10, depths: 4, cutMethod: 'Laser / sidewinder', decode: 'Lishi TOY48' },
    programming: { obd: 'Yes', onboard: 'Blade trims', allKeysLost: 'OBD', pinRequired: 'No', notes: 'G chip years only.' },
    obdPort: 'Driver side, under dash', doorUnlock: 'Lishi TOY48', verified: false
  },
  {
    id: 'toyota-sienna-2013-2020', make: 'Toyota', model: 'Sienna', yearStart: 2013, yearEnd: 2020, body: 'van',
    blanks: { keyway: 'TOY44H', ilco: 'TOY44H-PT', silca: 'TOY48', jma: 'TP00TOYO-15.P', oem: '89785-0D140' },
    transponder: { chip: '8A / H chip (AES)', system: 'Toyota smart entry', cloneable: 'No' },
    remotes: [{ type: 'prox', fcc: 'HYQ14FBA', pn: '', buttons: '5B / 6B w/ sliding doors' }],
    lock: { codeSeries: 'TOY48', spaces: 10, depths: 4, cutMethod: 'Laser / sidewinder', decode: 'Lishi TOY48' },
    programming: { obd: 'Yes', onboard: 'No', allKeysLost: 'OBD + 16-min wait', pinRequired: 'No', notes: 'Very common family-van lockout. Sliding door is often the easier entry.' },
    obdPort: 'Driver side, under dash', doorUnlock: 'Lishi TOY48', verified: false
  },
  /* ===== LEXUS ===== */
  {
    id: 'lexus-es-2007-2012', make: 'Lexus', model: 'ES 350', yearStart: 2007, yearEnd: 2012, body: 'car',
    blanks: { keyway: 'TOY48 (emergency blade)', ilco: 'TOY44D-PT', silca: 'TOY48', jma: 'TP00TOYO-15.P', oem: '' },
    transponder: { chip: '4D-67 dot; G on 2011+', system: 'Lexus smart access', cloneable: 'Dot yes' },
    remotes: [{ type: 'prox', fcc: 'HYQ14AAB', pn: '', buttons: '4B smart key' }],
    lock: { codeSeries: 'TOY48', spaces: 10, depths: 4, cutMethod: 'Laser / sidewinder', decode: 'Lishi TOY48' },
    programming: { obd: 'Yes', onboard: 'No', allKeysLost: 'OBD', pinRequired: 'No', notes: 'Camry underneath.' },
    obdPort: 'Driver side, under dash', doorUnlock: 'Lishi TOY48', verified: false
  },
  {
    id: 'lexus-es-2013-2018', make: 'Lexus', model: 'ES 350', yearStart: 2013, yearEnd: 2018, body: 'car',
    blanks: { keyway: 'TOY48 (emergency blade)', ilco: 'TOY44H-PT', silca: 'TOY48', jma: 'TP00TOYO-15.P', oem: '' },
    transponder: { chip: '8A / H chip', system: 'Lexus smart access', cloneable: 'No' },
    remotes: [{ type: 'prox', fcc: 'HYQ14FBA', pn: '', buttons: '4B smart key' }],
    lock: { codeSeries: 'TOY48', spaces: 10, depths: 4, cutMethod: 'Laser / sidewinder', decode: 'Lishi TOY48' },
    programming: { obd: 'Yes', onboard: 'No', allKeysLost: 'OBD + 16-min wait', pinRequired: 'No', notes: '' },
    obdPort: 'Driver side, under dash', doorUnlock: 'Lishi TOY48', verified: false
  },
  {
    id: 'lexus-is-2006-2013', make: 'Lexus', model: 'IS 250 / IS 350', yearStart: 2006, yearEnd: 2013, body: 'car',
    blanks: { keyway: 'TOY48 (emergency blade)', ilco: 'TOY44D-PT', silca: 'TOY48', jma: 'TP00TOYO-15.P', oem: '' },
    transponder: { chip: '4D-67 dot; G on 2011+', system: 'Lexus smart access', cloneable: 'Dot yes' },
    remotes: [{ type: 'prox', fcc: 'HYQ14AAB', pn: '', buttons: '4B smart key' }],
    lock: { codeSeries: 'TOY48', spaces: 10, depths: 4, cutMethod: 'Laser / sidewinder', decode: 'Lishi TOY48' },
    programming: { obd: 'Yes', onboard: 'No', allKeysLost: 'OBD', pinRequired: 'No', notes: '' },
    obdPort: 'Driver side, under dash', doorUnlock: 'Lishi TOY48', verified: false
  },
  {
    id: 'lexus-is-2014-2020', make: 'Lexus', model: 'IS', yearStart: 2014, yearEnd: 2020, body: 'car',
    blanks: { keyway: 'TOY48 (emergency blade)', ilco: 'TOY44H-PT', silca: 'TOY48', jma: 'TP00TOYO-15.P', oem: '' },
    transponder: { chip: '8A / H chip', system: 'Lexus smart access', cloneable: 'No' },
    remotes: [{ type: 'prox', fcc: 'HYQ14FBA', pn: '', buttons: '4B' }],
    lock: { codeSeries: 'TOY48', spaces: 10, depths: 4, cutMethod: 'Laser / sidewinder', decode: 'Lishi TOY48' },
    programming: { obd: 'Yes', onboard: 'No', allKeysLost: 'OBD + 16-min wait', pinRequired: 'No', notes: '' },
    obdPort: 'Driver side, under dash', doorUnlock: 'Lishi TOY48', verified: false
  },
  {
    id: 'lexus-rx-2004-2009', make: 'Lexus', model: 'RX 330 / RX 350', yearStart: 2004, yearEnd: 2009, body: 'suv',
    blanks: { keyway: 'TOY48 / TOY43 by trim', ilco: 'TOY44D-PT', silca: 'TOY48', jma: 'TP00TOYO-15.P', oem: '' },
    transponder: { chip: '4D-67 dot', system: 'Lexus smart access', cloneable: 'Yes' },
    remotes: [{ type: 'prox', fcc: 'HYQ12BBX', pn: '', buttons: '4B smart key' }],
    lock: { codeSeries: 'TOY48', spaces: 10, depths: 4, cutMethod: 'Laser / sidewinder', decode: 'Lishi TOY48' },
    programming: { obd: 'Yes', onboard: 'Blade trims', allKeysLost: 'OBD', pinRequired: 'No', notes: '' },
    obdPort: 'Driver side, under dash', doorUnlock: 'Lishi TOY48', verified: false
  },
  {
    id: 'lexus-rx-2016-2022', make: 'Lexus', model: 'RX 350', yearStart: 2016, yearEnd: 2022, body: 'suv',
    blanks: { keyway: 'TOY48 (emergency blade)', ilco: 'TOY44H-PT', silca: 'TOY48', jma: 'TP00TOYO-15.P', oem: '' },
    transponder: { chip: '8A / H chip (AES)', system: 'Lexus smart access', cloneable: 'No' },
    remotes: [{ type: 'prox', fcc: 'HYQ14FBA / HYQ14FBB', pn: '', buttons: '4B / 5B' }],
    lock: { codeSeries: 'TOY48', spaces: 10, depths: 4, cutMethod: 'Laser / sidewinder', decode: 'Lishi TOY48' },
    programming: { obd: 'Yes', onboard: 'No', allKeysLost: 'OBD + 16-min wait', pinRequired: 'No', notes: '' },
    obdPort: 'Driver side, under dash', doorUnlock: 'Lishi TOY48', verified: false
  },
  {
    id: 'lexus-gx460-2010-2023', make: 'Lexus', model: 'GX 460', yearStart: 2010, yearEnd: 2023, body: 'suv',
    blanks: { keyway: 'TOY48 (emergency blade)', ilco: 'TOY44D-PT / TOY44H-PT by year', silca: 'TOY48', jma: 'TP00TOYO-15.P', oem: '' },
    transponder: { chip: 'G to 2012, H 2013+', system: 'Lexus smart access', cloneable: 'No on H' },
    remotes: [{ type: 'prox', fcc: 'HYQ14FBA', pn: '', buttons: '4B smart key' }],
    lock: { codeSeries: 'TOY48', spaces: 10, depths: 4, cutMethod: 'Laser / sidewinder', decode: 'Lishi TOY48' },
    programming: { obd: 'Yes', onboard: 'No', allKeysLost: 'OBD + 16-min wait on H', pinRequired: 'No', notes: '4Runner platform underneath.' },
    obdPort: 'Driver side, under dash', doorUnlock: 'Lishi TOY48', verified: false
  },
  {
    id: 'lexus-lx570-2008-2021', make: 'Lexus', model: 'LX 570', yearStart: 2008, yearEnd: 2021, body: 'suv',
    blanks: { keyway: 'TOY48 (emergency blade)', ilco: 'TOY44D-PT / TOY44H-PT by year', silca: 'TOY48', jma: 'TP00TOYO-15.P', oem: '' },
    transponder: { chip: 'G to 2012, H 2013+', system: 'Lexus smart access', cloneable: 'No on H' },
    remotes: [{ type: 'prox', fcc: 'HYQ14FBA', pn: '', buttons: '4B' }],
    lock: { codeSeries: 'TOY48', spaces: 10, depths: 4, cutMethod: 'Laser / sidewinder', decode: 'Lishi TOY48' },
    programming: { obd: 'Yes', onboard: 'No', allKeysLost: 'OBD + 16-min wait', pinRequired: 'No', notes: 'Land Cruiser platform. High value — verify ownership on AKL.' },
    obdPort: 'Driver side, under dash', doorUnlock: 'Lishi TOY48', verified: false
  },
  {
    id: 'lexus-nx-2015-2021', make: 'Lexus', model: 'NX 200t / NX 300', yearStart: 2015, yearEnd: 2021, body: 'suv',
    blanks: { keyway: 'TOY48 (emergency blade)', ilco: 'TOY44H-PT', silca: 'TOY48', jma: 'TP00TOYO-15.P', oem: '' },
    transponder: { chip: '8A / H chip', system: 'Lexus smart access', cloneable: 'No' },
    remotes: [{ type: 'prox', fcc: 'HYQ14FBA', pn: '', buttons: '4B' }],
    lock: { codeSeries: 'TOY48', spaces: 10, depths: 4, cutMethod: 'Laser / sidewinder', decode: 'Lishi TOY48' },
    programming: { obd: 'Yes', onboard: 'No', allKeysLost: 'OBD + 16-min wait', pinRequired: 'No', notes: '' },
    obdPort: 'Driver side, under dash', doorUnlock: 'Lishi TOY48', verified: false
  },
  {
    id: 'lexus-gs-2006-2011', make: 'Lexus', model: 'GS 300 / GS 350', yearStart: 2006, yearEnd: 2011, body: 'car',
    blanks: { keyway: 'TOY48 (emergency blade)', ilco: 'TOY44D-PT', silca: 'TOY48', jma: 'TP00TOYO-15.P', oem: '' },
    transponder: { chip: '4D-67 dot', system: 'Lexus smart access', cloneable: 'Yes' },
    remotes: [{ type: 'prox', fcc: 'HYQ14AAB', pn: '', buttons: '4B smart key' }],
    lock: { codeSeries: 'TOY48', spaces: 10, depths: 4, cutMethod: 'Laser / sidewinder', decode: 'Lishi TOY48' },
    programming: { obd: 'Yes', onboard: 'No', allKeysLost: 'OBD', pinRequired: 'No', notes: '' },
    obdPort: 'Driver side, under dash', doorUnlock: 'Lishi TOY48', verified: false
  },
  {
    id: 'lexus-ls460-2007-2017', make: 'Lexus', model: 'LS 460', yearStart: 2007, yearEnd: 2017, body: 'car',
    blanks: { keyway: 'TOY48 (emergency blade)', ilco: 'TOY44D-PT / TOY44H-PT by year', silca: 'TOY48', jma: 'TP00TOYO-15.P', oem: '' },
    transponder: { chip: 'Dot to 2010, G 2011-2012, H 2013+', system: 'Lexus smart access', cloneable: 'No on H' },
    remotes: [{ type: 'prox', fcc: 'HYQ14ACX', pn: '', buttons: '4B / 5B' }],
    lock: { codeSeries: 'TOY48', spaces: 10, depths: 4, cutMethod: 'Laser / sidewinder', decode: 'Lishi TOY48' },
    programming: { obd: 'Yes', onboard: 'No', allKeysLost: 'OBD; 16-min wait on H', pinRequired: 'No', notes: '' },
    obdPort: 'Driver side, under dash', doorUnlock: 'Lishi TOY48', verified: false
  },

  /* ===== SCION ===== */
  {
    id: 'scion-tc-2005-2016', make: 'Scion', model: 'tC', yearStart: 2005, yearEnd: 2016, body: 'car',
    blanks: { keyway: 'TOY43', ilco: 'TOY43-PT', silca: 'TOY43', jma: 'TOYO-21.P', oem: '' },
    transponder: { chip: '4D-67 dot; G on 2011+', system: 'Toyota immobilizer', cloneable: 'Dot yes' },
    remotes: [{ type: 'fob', fcc: 'GQ43VT20T', pn: '', buttons: '3B' }],
    lock: { codeSeries: 'TOY43 8-cut', spaces: 8, depths: 4, cutMethod: 'Edge cut', decode: 'Lishi TOY43' },
    programming: { obd: 'Yes', onboard: 'Yes', allKeysLost: 'OBD', pinRequired: 'No', notes: 'Scion is Toyota — work it in the Toyota menu.' },
    obdPort: 'Driver side, under dash', doorUnlock: 'Lishi TOY43', verified: false
  },
  {
    id: 'scion-xb-xd-2004-2015', make: 'Scion', model: 'xB / xD', yearStart: 2004, yearEnd: 2015, body: 'car',
    blanks: { keyway: 'TOY43', ilco: 'TOY43-PT', silca: 'TOY43', jma: 'TOYO-21.P', oem: '' },
    transponder: { chip: '4C / 4D-67 dot by year', system: 'Toyota immobilizer', cloneable: 'Yes' },
    remotes: [{ type: 'fob', fcc: 'GQ43VT20T', pn: '', buttons: '3B' }],
    lock: { codeSeries: 'TOY43 8-cut', spaces: 8, depths: 4, cutMethod: 'Edge cut', decode: 'Lishi TOY43' },
    programming: { obd: 'Yes', onboard: 'Yes', allKeysLost: 'OBD', pinRequired: 'No', notes: '' },
    obdPort: 'Driver side, under dash', doorUnlock: 'Lishi TOY43', verified: false
  },
  {
    id: 'scion-frs-2013-2016', make: 'Scion', model: 'FR-S', yearStart: 2013, yearEnd: 2016, body: 'car',
    blanks: { keyway: 'SUB4', ilco: 'SUB4-PT', silca: 'SUB4', jma: 'SUBA-6.P', oem: '' },
    transponder: { chip: 'Subaru ID47 / Hitag3', system: 'Subaru immobilizer', cloneable: 'No' },
    remotes: [{ type: 'prox', fcc: '', pn: '', buttons: '3B' }],
    lock: { codeSeries: 'SUB4', spaces: 8, depths: 4, cutMethod: 'Edge cut', decode: 'Lishi SUB4' },
    programming: { obd: 'Yes — work it as a Subaru', onboard: 'No', allKeysLost: 'OBD as Subaru BRZ', pinRequired: 'Tool-dependent', notes: 'GOTCHA: Subaru build. Subaru blank and Subaru software, not Toyota.' },
    obdPort: 'Driver side, under dash', doorUnlock: 'Lishi SUB4', verified: false
  },
  {
    id: 'scion-ia-2016-2018', make: 'Scion', model: 'iA', yearStart: 2016, yearEnd: 2018, body: 'car',
    blanks: { keyway: 'MAZ24', ilco: 'MAZ24R-PT', silca: 'MAZ24R', jma: 'MAZ-16.P', oem: '' },
    transponder: { chip: 'ID49 / Hitag Pro (Mazda)', system: 'Mazda immobilizer', cloneable: 'No' },
    remotes: [{ type: 'fob', fcc: '', pn: '', buttons: '3B' }],
    lock: { codeSeries: 'MAZ24', spaces: 8, depths: 4, cutMethod: 'Laser / sidewinder', decode: 'Lishi MAZ24' },
    programming: { obd: 'Yes — Mazda menu', onboard: 'No', allKeysLost: 'OBD as a Mazda 2', pinRequired: 'No', notes: 'GOTCHA: rebadged Mazda 2, same as the Yaris iA that replaced it.' },
    obdPort: 'Driver side, under dash', doorUnlock: 'Lishi MAZ24', verified: false
  }
];

/* --- Key blank cross-reference directory ---------------------------------
   One record per keyway. `ilco` is the mechanical blank, `ilcoChip` the
   transponder version of the same blank where one exists. Same caveat as the
   vehicle data: verify against your catalog before you order a box of them. */
const SEED_BLANKS = [
  /* ---- FORD / LINCOLN / MERCURY ---- */
  { id:'hu101', keyway:'HU101', ilco:'HU101', ilcoChip:'HU101-PT', silca:'FO21T', jma:'FO-24.P', strattec:'5913441',
    cut:'Laser', spaces:10, depths:4, makes:['Ford','Lincoln','Jaguar','Land Rover'],
    notes:'The 2-track Ford laser key. Also the emergency blade inside most Ford prox fobs.' },
  { id:'h92', keyway:'H92', ilco:'H92', ilcoChip:'H92-PT', silca:'FO21T', jma:'FO-21.P2', strattec:'599114',
    cut:'Edge', spaces:8, depths:5, makes:['Ford','Lincoln','Mercury'],
    notes:'Ford 8-cut. 40-bit chip through ~2010, 80-bit after — same blank, different chip.' },
  { id:'h75', keyway:'H75', ilco:'H75', ilcoChip:'H72-PT', silca:'FO38', jma:'FO-15.P', strattec:'596753',
    cut:'Edge', spaces:8, depths:5, makes:['Ford','Lincoln','Mercury'],
    notes:'Older Ford 8-cut, pre-PATS and early PATS.' },
  { id:'fo38', keyway:'FO38 (Tibbe)', ilco:'FO21', ilcoChip:'FO21T', silca:'FO12', jma:'FO-13.P', strattec:'—',
    cut:'Tibbe', spaces:6, depths:4, makes:['Ford','Jaguar'],
    notes:'Tibbe. Needs a dedicated Tibbe decoder and cutter — not an edge or laser machine.' },

  /* ---- GM ---- */
  { id:'b111', keyway:'B111', ilco:'B111', ilcoChip:'B111-PT', silca:'GM39RT', jma:'GM-37.P', strattec:'5912543',
    cut:'Edge', spaces:10, depths:4, makes:['Chevrolet','GMC','Buick','Cadillac','Pontiac','Saturn'],
    notes:'GM 10-cut, PK3+/Circle-Plus era. The workhorse GM blank of 2006-2013.' },
  { id:'b119', keyway:'B119', ilco:'B119', ilcoChip:'B119-PT', silca:'GM45', jma:'GM-40.P', strattec:'5928114',
    cut:'Edge', spaces:10, depths:4, makes:['Chevrolet','GMC','Buick','Cadillac'],
    notes:'GM 2014+ 10-cut with the 46E chip.' },
  { id:'b116', keyway:'HU100', ilco:'B116', ilcoChip:'B116-PT', silca:'GM45', jma:'GM-40.P', strattec:'5912542',
    cut:'Edge', spaces:10, depths:4, makes:['Chevrolet','Buick','GMC','Opel','Saturn'],
    notes:'HU100 profile. Cruze, Malibu, Equinox era.' },
  { id:'b106', keyway:'B106', ilco:'B106', ilcoChip:'B106-PT', silca:'GM37', jma:'GM-14.P', strattec:'596415',
    cut:'Edge', spaces:6, depths:4, makes:['Chevrolet','GMC','Buick','Pontiac','Oldsmobile'],
    notes:'GM 6-cut, VATS/PASS-Key era. Pellet keys are B62-P1 through P15.' },
  { id:'b102', keyway:'B102', ilco:'B102', ilcoChip:'—', silca:'GM32', jma:'GM-10.P', strattec:'322773',
    cut:'Edge', spaces:6, depths:4, makes:['Chevrolet','GMC','Buick','Pontiac'],
    notes:'Older GM 10-cut door/trunk secondary.' },

  /* ---- TOYOTA / LEXUS / SCION ---- */
  { id:'toy48', keyway:'TOY48', ilco:'TOY44D', ilcoChip:'TOY44D-PT', silca:'TOY48', jma:'TP00TOYO-15.P', strattec:'—',
    cut:'Laser', spaces:10, depths:4, makes:['Toyota','Lexus','Scion'],
    notes:'Dot / G chip era. The G chip is stamped "G" on the head.' },
  { id:'toy44g', keyway:'TOY44G', ilco:'TOY44G', ilcoChip:'TOY44G-PT', silca:'TOY48', jma:'TP00TOYO-15.P', strattec:'—',
    cut:'Laser', spaces:10, depths:4, makes:['Toyota','Lexus','Scion'],
    notes:'G chip era, roughly 2010-2012. Same TOY48 keyway as the dot and H blanks — only the chip differs, so the blade cuts the same and the wrong box still will not start the car.' },
  { id:'toy44h', keyway:'TOY44H', ilco:'TOY44H', ilcoChip:'TOY44H-PT', silca:'TOY48', jma:'TP00TOYO-15.P', strattec:'—',
    cut:'Laser', spaces:10, depths:4, makes:['Toyota','Lexus'],
    notes:'H chip, 2013+. Same TOY48 keyway, different chip — do not mix the boxes up.' },
  { id:'toy43', keyway:'TOY43', ilco:'TOY43', ilcoChip:'TOY43-PT', silca:'TOY43', jma:'TOYO-21.P', strattec:'—',
    cut:'Edge', spaces:8, depths:4, makes:['Toyota','Lexus','Scion'],
    notes:'Toyota 8-cut, older Corolla / Camry / Tacoma.' },
  { id:'toy40', keyway:'TOY40', ilco:'TOY40', ilcoChip:'—', silca:'TOY40', jma:'TOYO-15.P', strattec:'—',
    cut:'Edge', spaces:6, depths:4, makes:['Toyota','Lexus'], notes:'Older 4-track Toyota.' },

  /* ---- HONDA / ACURA ---- */
  { id:'hon66', keyway:'HON66', ilco:'HO03', ilcoChip:'HO03-PT', silca:'HON66', jma:'HOND-22.P', strattec:'—',
    cut:'Laser', spaces:10, depths:4, makes:['Honda','Acura'],
    notes:'High security Honda. Emergency blade in the smart fobs is this profile.' },
  { id:'ho01', keyway:'HO01', ilco:'HO01', ilcoChip:'HO01-PT', silca:'HON58R', jma:'HOND-20.P', strattec:'—',
    cut:'Edge', spaces:8, depths:4, makes:['Honda','Acura'],
    notes:'Honda 8-cut, ID46 era.' },
  { id:'ho05', keyway:'HD106/HO05', ilco:'HO05', ilcoChip:'—', silca:'HON43', jma:'HOND-14.P', strattec:'—',
    cut:'Edge', spaces:6, depths:4, makes:['Honda','Acura'], notes:'Older Honda 6-cut, non-transponder.' },

  /* ---- NISSAN / INFINITI ---- */
  { id:'nsn14', keyway:'NSN14', ilco:'DA34', ilcoChip:'DA34-PT', silca:'NSN14', jma:'NE-38.P', strattec:'—',
    cut:'Laser', spaces:10, depths:4, makes:['Nissan','Infiniti'],
    notes:'Nissan high security. Also the emergency blade in the Intelligent Key.' },
  { id:'da31', keyway:'DA31', ilco:'DA31', ilcoChip:'DA31-PT', silca:'NSN11', jma:'DAT-17.P', strattec:'—',
    cut:'Edge', spaces:8, depths:4, makes:['Nissan','Infiniti'], notes:'Nissan 8-cut, older Altima / Sentra / Frontier.' },

  /* ---- HYUNDAI / KIA ---- */
  { id:'hy20', keyway:'HY20', ilco:'HY20', ilcoChip:'HY20-PT', silca:'HYN14R', jma:'HY-20.P', strattec:'—',
    cut:'Edge', spaces:8, depths:4, makes:['Hyundai','Kia'], notes:'The common Hyundai 8-cut.' },
  { id:'hy22', keyway:'HY22', ilco:'HY22', ilcoChip:'HY22-PT', silca:'HYN17R', jma:'HY-22.P', strattec:'—',
    cut:'Laser', spaces:10, depths:4, makes:['Hyundai','Kia'], notes:'Hyundai/Kia high security laser.' },
  { id:'kk10', keyway:'KK10', ilco:'KK10', ilcoChip:'KK10-PT', silca:'HYN14R', jma:'HY-18.P', strattec:'—',
    cut:'Edge', spaces:8, depths:4, makes:['Kia'], notes:'Kia 8-cut.' },

  /* ---- STELLANTIS ---- */
  { id:'cy24', keyway:'CY24', ilco:'Y164', ilcoChip:'Y164-PT', silca:'CY24', jma:'CHR-15.P', strattec:'692352',
    cut:'Edge', spaces:8, depths:4, makes:['Chrysler','Dodge','Jeep','Ram'],
    notes:'The Stellantis 8-cut. Y170 is the same keyway in the later fob-head style.' },
  { id:'y160', keyway:'Y160', ilco:'Y160', ilcoChip:'Y160-PT', silca:'CY22', jma:'CHR-9.P', strattec:'—',
    cut:'Edge', spaces:8, depths:4, makes:['Chrysler','Dodge','Jeep'], notes:'Older Chrysler 8-cut, SKIM era.' },
  { id:'sip22', keyway:'SIP22', ilco:'FT48', ilcoChip:'FT48-PT', silca:'SIP22', jma:'FI-21.P', strattec:'—',
    cut:'Laser', spaces:8, depths:4, makes:['Fiat','Chrysler','Dodge','Ram','Alfa Romeo'],
    notes:'Fiat platform laser — ProMaster City, 500, Renegade.' },

  /* ---- VW / AUDI ---- */
  { id:'hu66', keyway:'HU66', ilco:'HU66AT4', ilcoChip:'HU66AT4-PT', silca:'HU66', jma:'TP00VA-6D.P', strattec:'—',
    cut:'Laser', spaces:8, depths:4, makes:['Volkswagen','Audi','Seat','Skoda','Porsche'],
    notes:'The VAG laser. Check MQB vs non-MQB before quoting the programming.' },
  { id:'hu162t', keyway:'HU162T', ilco:'HU162T', ilcoChip:'HU162T-PT', silca:'HU162T', jma:'TP00VAG-7.P', strattec:'—',
    cut:'Laser', spaces:9, depths:4, makes:['Volkswagen','Audi','Seat','Skoda'],
    notes:'MQB platform blade, 2015+.' },
  { id:'hu49', keyway:'HU49', ilco:'VW1', ilcoChip:'—', silca:'HU49', jma:'VO-1.P', strattec:'—',
    cut:'Edge', spaces:8, depths:4, makes:['Volkswagen','Audi'], notes:'Old air-cooled and early water-cooled VW.' },

  /* ---- BMW / MERCEDES ---- */
  { id:'hu92', keyway:'HU92', ilco:'HU92', ilcoChip:'HU92-PT', silca:'HU92', jma:'TP00BM-15.P', strattec:'—',
    cut:'Laser', spaces:10, depths:4, makes:['BMW','Mini','Rolls-Royce'], notes:'BMW 2-track, CAS era.' },
  { id:'hu100r', keyway:'HU100R', ilco:'BMW1', ilcoChip:'—', silca:'HU100R', jma:'TP00BM-20.P', strattec:'—',
    cut:'Laser', spaces:10, depths:4, makes:['BMW','Mini'], notes:'BMW F-series / FEM-BDC emergency blade.' },
  { id:'hu64', keyway:'HU64', ilco:'HU64', ilcoChip:'—', silca:'HU64', jma:'TP00ME-10.P', strattec:'—',
    cut:'Laser', spaces:10, depths:4, makes:['Mercedes-Benz'], notes:'Mercedes 4-track. FBS3/FBS4 is the hard part, not the cut.' },
  { id:'ymb', keyway:'YM15/YM23', ilco:'YM23', ilcoChip:'—', silca:'YM15', jma:'ME-3.P', strattec:'—',
    cut:'Edge', spaces:8, depths:4, makes:['Mercedes-Benz'], notes:'Older Mercedes edge cut.' },

  /* ---- MAZDA / SUBARU / MITSUBISHI ---- */
  { id:'maz24', keyway:'MAZ24', ilco:'MAZ24R', ilcoChip:'MAZ24R-PT', silca:'MAZ24R', jma:'MAZ-16.P', strattec:'—',
    cut:'Laser', spaces:8, depths:4, makes:['Mazda'], notes:'Mazda high security.' },
  { id:'mz34', keyway:'MZ34', ilco:'MZ34', ilcoChip:'MZ34-PT', silca:'MAZ20', jma:'MAZ-11.P', strattec:'—',
    cut:'Edge', spaces:8, depths:4, makes:['Mazda'], notes:'Mazda 8-cut, older.' },
  { id:'sub4', keyway:'SUB4', ilco:'SUB4', ilcoChip:'SUB4-PT', silca:'SUB4', jma:'SUBA-6.P', strattec:'—',
    cut:'Edge', spaces:8, depths:4, makes:['Subaru'], notes:'Subaru 8-cut and the smart-key emergency blade.' },
  { id:'dat17', keyway:'DAT17', ilco:'DAT17', ilcoChip:'—', silca:'NSN11', jma:'DAT-17.P', strattec:'—',
    cut:'Edge', spaces:8, depths:4, makes:['Subaru','Nissan'], notes:'Older Subaru / Datsun profile.' },
  { id:'mit11', keyway:'MIT11', ilco:'MIT11', ilcoChip:'MIT11-PT', silca:'MIT11', jma:'MIT-6.P', strattec:'—',
    cut:'Edge', spaces:8, depths:4, makes:['Mitsubishi','Chrysler','Dodge'], notes:'Mitsubishi 8-cut, also on captive Chrysler models.' },

  /* ---- VOLVO / SAAB / OTHER EURO ---- */
  { id:'hu56r', keyway:'HU56R', ilco:'HU56R', ilcoChip:'—', silca:'HU56R', jma:'TP00VOL-1.P', strattec:'—',
    cut:'Laser', spaces:8, depths:4, makes:['Volvo'], notes:'Volvo laser.' },
  { id:'yh35r', keyway:'YM30/NE66', ilco:'YM30', ilcoChip:'—', silca:'NE66', jma:'VAL-3.P', strattec:'—',
    cut:'Laser', spaces:8, depths:4, makes:['Volvo','Renault','Saab'], notes:'Renault/Volvo shared laser profile.' },

  /* ---- MOTORCYCLE / POWERSPORTS ---- */
  { id:'pol1', keyway:'Polaris', ilco:'X255', ilcoChip:'—', silca:'—', jma:'—', strattec:'—',
    cut:'Edge', spaces:6, depths:4, makes:['Polaris','Powersports'],
    notes:'Polaris RZR / Ranger / General ignition. No immobilizer on most — cut and go.' },
  { id:'hd103', keyway:'HD103', ilco:'HD103', ilcoChip:'—', silca:'HD64', jma:'HD-3', strattec:'—',
    cut:'Edge', spaces:6, depths:4, makes:['Harley-Davidson'], notes:'The common Harley ignition blank.' },
  { id:'hd106', keyway:'HD106', ilco:'HD106', ilcoChip:'—', silca:'HD66', jma:'HD-6', strattec:'—',
    cut:'Edge', spaces:6, depths:4, makes:['Harley-Davidson'], notes:'Harley saddlebag / accessory.' },
  { id:'ya23', keyway:'YH35 / YA23', ilco:'YH35', ilcoChip:'—', silca:'YH35', jma:'YAMA-14', strattec:'—',
    cut:'Edge', spaces:6, depths:4, makes:['Yamaha'], notes:'Yamaha ignition.' },
  { id:'ka13', keyway:'KA13', ilco:'KA13', ilcoChip:'—', silca:'KW14', jma:'KAWA-10', strattec:'—',
    cut:'Edge', spaces:6, depths:4, makes:['Kawasaki'], notes:'Kawasaki ignition.' },
  { id:'sz14', keyway:'SUZ14', ilco:'X257', ilcoChip:'—', silca:'SZ14', jma:'SUZU-14', strattec:'—',
    cut:'Edge', spaces:6, depths:4, makes:['Suzuki'], notes:'Suzuki ignition.' },
  { id:'hon41', keyway:'HD91 / HON41', ilco:'HD91', ilcoChip:'—', silca:'HON41', jma:'HOND-11', strattec:'—',
    cut:'Edge', spaces:6, depths:4, makes:['Honda'], notes:'Honda motorcycle and powersports.' },

  /* ---- FLEET / EQUIPMENT ---- */
  { id:'b1', keyway:'B1 / 1098', ilco:'1098', ilcoChip:'—', silca:'GM1', jma:'GM-1', strattec:'—',
    cut:'Edge', spaces:6, depths:4, makes:['Chevrolet','GMC','Fleet'], notes:'Classic GM ignition / equipment.' },
  { id:'cat', keyway:'CAT / 5P8500', ilco:'1690', ilcoChip:'—', silca:'—', jma:'—', strattec:'—',
    cut:'Edge', spaces:5, depths:3, makes:['Caterpillar','Equipment'], notes:'Heavy equipment master. Common on job-site calls.' },
  { id:'jd', keyway:'John Deere AR51481', ilco:'1660', ilcoChip:'—', silca:'—', jma:'—', strattec:'—',
    cut:'Edge', spaces:5, depths:3, makes:['John Deere','Equipment'], notes:'Deere tractor / mower ignition.' }
];

/* --- VIN: World Manufacturer Identifier prefixes -------------------------- */
const WMI = {
  '1FA':'Ford (US)','1FB':'Ford (US)','1FC':'Ford (US)','1FD':'Ford (US)','1FM':'Ford SUV (US)','1FT':'Ford Truck (US)',
  '2FA':'Ford (Canada)','2FM':'Ford SUV (Canada)','2FT':'Ford Truck (Canada)','3FA':'Ford (Mexico)',
  '1G1':'Chevrolet (US)','1GC':'Chevrolet Truck (US)','1GN':'Chevrolet SUV (US)','1GT':'GMC Truck (US)','1GK':'GMC SUV (US)',
  '1G4':'Buick (US)','1G6':'Cadillac (US)','2G1':'Chevrolet (Canada)','3GC':'Chevrolet Truck (Mexico)','KL7':'Chevrolet (Korea)',
  '1C3':'Chrysler (US)','1C4':'Jeep/Chrysler SUV (US)','1C6':'Ram (US)','2C3':'Chrysler (Canada)','3C4':'Chrysler (Mexico)',
  '3C6':'Ram (Mexico)','1J4':'Jeep (US)',
  '4T1':'Toyota (US)','4T3':'Toyota (US)','5TD':'Toyota (US)','5TF':'Toyota Truck (US)','JTD':'Toyota (Japan)','JTE':'Toyota SUV (Japan)',
  'JTH':'Lexus (Japan)','2T1':'Toyota (Canada)','2T3':'Toyota (Canada)',
  '1HG':'Honda (US)','2HG':'Honda (Canada)','JHM':'Honda (Japan)','5FN':'Honda SUV (US)','5J6':'Honda SUV (US)',
  '19U':'Acura (US)','JH4':'Acura (Japan)',
  '1N4':'Nissan (US)','1N6':'Nissan Truck (US)','JN1':'Nissan (Japan)','JN8':'Nissan SUV (Japan)','5N1':'Nissan (US)','3N1':'Nissan (Mexico)',
  'KMH':'Hyundai (Korea)','5NP':'Hyundai (US)','KNA':'Kia (Korea)','KND':'Kia SUV (Korea)','5XY':'Kia (US)','3KP':'Kia (Mexico)',
  '3VW':'Volkswagen (Mexico)','1VW':'Volkswagen (US)','WVW':'Volkswagen (Germany)','WV1':'VW Commercial','WAU':'Audi (Germany)','TRU':'Audi (Hungary)',
  'WBA':'BMW (Germany)','WBS':'BMW M (Germany)','5UX':'BMW SUV (US)','4US':'BMW (US)','WMW':'Mini (UK)',
  'WDD':'Mercedes-Benz (Germany)','WDC':'Mercedes-Benz SUV (Germany)','4JG':'Mercedes-Benz (US)','W1K':'Mercedes-Benz (Germany)',
  'JF1':'Subaru (Japan)','JF2':'Subaru SUV (Japan)','4S3':'Subaru (US)','4S4':'Subaru SUV (US)',
  'JM1':'Mazda (Japan)','JM3':'Mazda SUV (Japan)','4F2':'Mazda (US)',
  '5YJ':'Tesla (US)','7SA':'Tesla (US)','LRW':'Tesla (China)',
  'JA4':'Mitsubishi SUV','4A3':'Mitsubishi (US)','JN6':'Nissan Commercial',
  '1HD':'Harley-Davidson','5HD':'Harley-Davidson','JYA':'Yamaha','JH2':'Honda Motorcycle','JKA':'Kawasaki','JS1':'Suzuki'
};

/* VIN position-10 model year codes. */
const VIN_YEAR = {
  'A':[1980,2010],'B':[1981,2011],'C':[1982,2012],'D':[1983,2013],'E':[1984,2014],'F':[1985,2015],
  'G':[1986,2016],'H':[1987,2017],'J':[1988,2018],'K':[1989,2019],'L':[1990,2020],'M':[1991,2021],
  'N':[1992,2022],'P':[1993,2023],'R':[1994,2024],'S':[1995,2025],'T':[1996,2026],'V':[1997,2027],
  'W':[1998,2028],'X':[1999,2029],'Y':[2000,2030],
  '1':[2001,2031],'2':[2002,2032],'3':[2003,2033],'4':[2004,2034],'5':[2005,2035],
  '6':[2006,2036],'7':[2007,2037],'8':[2008,2038],'9':[2009,2039]
};

if (typeof module !== 'undefined') module.exports = { SEED_VEHICLES, SEED_BLANKS, WMI, VIN_YEAR, SEED_VERSION };
