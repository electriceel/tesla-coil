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
  }
];

/* --- Key blank cross-reference ------------------------------------------- */
/* keyway -> equivalents across the common catalogs. */
const SEED_BLANKS = [
  { keyway: 'HU101',   ilco: 'HU101-PT',  silca: 'FO21T',   jma: 'FO-24.P',      strattec: '5913441', makes: 'Ford, Lincoln, Jaguar, Land Rover', cut: 'Laser / 2-track' },
  { keyway: 'H92',     ilco: 'H92-PT',    silca: 'FO21T',   jma: 'FO-21.P2',     strattec: '5913441', makes: 'Ford, Mercury', cut: '8-cut edge' },
  { keyway: 'B111',    ilco: 'B111-PT',   silca: 'GM39RT',  jma: 'GM-37.P',      strattec: '5912543', makes: 'GM 10-cut', cut: '10-cut edge' },
  { keyway: 'B119',    ilco: 'B119-PT',   silca: 'GM45',    jma: 'GM-40.P',      strattec: '5928114', makes: 'GM 2014+', cut: '10-cut edge' },
  { keyway: 'HU100',   ilco: 'B116-PT',   silca: 'GM45',    jma: 'GM-40.P',      strattec: '5912542', makes: 'GM, Opel', cut: '10-cut edge' },
  { keyway: 'TOY48',   ilco: 'TOY44D-PT', silca: 'TOY48',   jma: 'TP00TOYO-15.P',strattec: '—',       makes: 'Toyota, Lexus', cut: 'Laser / sidewinder' },
  { keyway: 'TOY44H',  ilco: 'TOY44H-PT', silca: 'TOY48',   jma: 'TP00TOYO-15.P',strattec: '—',       makes: 'Toyota 2013+ (H chip)', cut: 'Laser / sidewinder' },
  { keyway: 'HON66',   ilco: 'HO03-PT',   silca: 'HON66',   jma: 'HOND-22.P',    strattec: '—',       makes: 'Honda, Acura high security', cut: 'Laser / sidewinder' },
  { keyway: 'HO01',    ilco: 'HO01-PT',   silca: 'HON58R',  jma: 'HOND-20.P',    strattec: '—',       makes: 'Honda, Acura 8-cut', cut: '8-cut edge' },
  { keyway: 'NSN14',   ilco: 'DA34',      silca: 'NSN14',   jma: 'NE-38.P',      strattec: '—',       makes: 'Nissan, Infiniti', cut: 'Laser / sidewinder' },
  { keyway: 'HY20',    ilco: 'HY20-PT',   silca: 'HYN14R',  jma: 'HY-20.P',      strattec: '—',       makes: 'Hyundai, Kia', cut: '8-cut edge' },
  { keyway: 'KK10',    ilco: 'KK10-PT',   silca: 'HYN14R',  jma: 'HY-18.P',      strattec: '—',       makes: 'Kia', cut: '8-cut edge' },
  { keyway: 'CY24',    ilco: 'Y164-PT',   silca: 'CY24',    jma: 'CHR-15.P',     strattec: '692352',  makes: 'Chrysler, Dodge, Jeep, Ram', cut: '8-cut edge' },
  { keyway: 'HU66',    ilco: 'HU66AT4',   silca: 'HU66',    jma: 'TP00VA-6D.P',  strattec: '—',       makes: 'VW, Audi, Seat, Skoda', cut: 'Laser / sidewinder' },
  { keyway: 'HU92',    ilco: 'HU92',      silca: 'HU92',    jma: 'TP00BM-15.P',  strattec: '—',       makes: 'BMW, Mini, Rolls-Royce', cut: 'Laser / sidewinder' },
  { keyway: 'HU64',    ilco: 'HU64',      silca: 'HU64',    jma: 'TP00ME-10.P',  strattec: '—',       makes: 'Mercedes-Benz', cut: 'Laser / sidewinder' },
  { keyway: 'MAZ24',   ilco: 'MAZ24R-PT', silca: 'MAZ24R',  jma: 'MAZ-16.P',     strattec: '—',       makes: 'Mazda', cut: 'Laser / sidewinder' },
  { keyway: 'SUB4',    ilco: 'SUB4-PT',   silca: 'SUB4',    jma: 'SUBA-6.P',     strattec: '—',       makes: 'Subaru', cut: '8-cut edge' },
  { keyway: 'HD103',   ilco: 'HD103',     silca: 'HD64',    jma: 'HD-3',         strattec: '—',       makes: 'Harley-Davidson', cut: '6-cut edge' }
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
