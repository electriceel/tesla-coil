/* VIN decoding — offline structural decode + optional NHTSA vPIC enrichment. */

const VIN_TRANSLIT = {
  A:1,B:2,C:3,D:4,E:5,F:6,G:7,H:8,
  J:1,K:2,L:3,M:4,N:5,          P:7,    R:9,
  S:2,T:3,U:4,V:5,W:6,X:7,Y:8,Z:9,
  '0':0,'1':1,'2':2,'3':3,'4':4,'5':5,'6':6,'7':7,'8':8,'9':9
};
const VIN_WEIGHTS = [8,7,6,5,4,3,2,10,0,9,8,7,6,5,4,3,2];

function normalizeVin(raw) {
  return (raw || '').toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, '');
}

/* Standard ISO 3779 check digit. North American VINs must satisfy it; many
   non-NA-market VINs legitimately do not, so a failure is a warning, not a
   hard error. */
function vinCheckDigit(vin) {
  let sum = 0;
  for (let i = 0; i < 17; i++) {
    const v = VIN_TRANSLIT[vin[i]];
    if (v === undefined) return null;
    sum += v * VIN_WEIGHTS[i];
  }
  const r = sum % 11;
  return r === 10 ? 'X' : String(r);
}

function decodeVin(raw) {
  const vin = normalizeVin(raw);
  const out = { vin, valid: false, issues: [] };

  if (vin.length !== 17) {
    out.issues.push(`VIN is ${vin.length} characters — a road VIN is 17. Check for I, O or Q (never used in a VIN).`);
    return out;
  }

  out.wmi = vin.slice(0, 3);
  out.vds = vin.slice(3, 8);
  out.checkDigit = vin[8];
  out.yearCode = vin[9];
  out.plant = vin[10];
  out.serial = vin.slice(11);

  out.manufacturer = WMI[out.wmi] || WMI[vin.slice(0, 2)] || 'Unknown WMI — decode online for the make';

  const years = VIN_YEAR[out.yearCode];
  if (years) {
    // Position 7 alpha => 2010+ cycle for North American VINs.
    const modern = /[A-Z]/.test(vin[6]);
    out.modelYear = modern ? years[1] : years[0];
    out.modelYearAlt = modern ? years[0] : years[1];
  } else {
    out.issues.push('Year code in position 10 is not a valid VIN year character.');
  }

  const expected = vinCheckDigit(vin);
  out.expectedCheckDigit = expected;
  out.checkDigitOk = expected !== null && expected === out.checkDigit;
  if (!out.checkDigitOk) {
    out.issues.push(`Check digit is ${out.checkDigit}, math says ${expected}. Re-read the VIN — or it is a non-North-American VIN, where the check digit is optional.`);
  }

  out.valid = out.checkDigitOk;
  return out;
}

/* Free NHTSA vPIC decode. No key, no auth. Fails closed when offline. */
async function decodeVinOnline(vin) {
  const url = `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${encodeURIComponent(vin)}?format=json`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`vPIC returned ${res.status}`);
  const json = await res.json();
  const r = (json.Results && json.Results[0]) || {};
  const pick = (k) => (r[k] && String(r[k]).trim()) || '';
  return {
    make: pick('Make'), model: pick('Model'), year: pick('ModelYear'),
    trim: pick('Trim'), bodyClass: pick('BodyClass'), driveType: pick('DriveType'),
    engine: [pick('DisplacementL') && pick('DisplacementL') + 'L', pick('EngineCylinders') && pick('EngineCylinders') + 'cyl', pick('FuelTypePrimary')].filter(Boolean).join(' '),
    plant: [pick('PlantCity'), pick('PlantState'), pick('PlantCountry')].filter(Boolean).join(', '),
    series: pick('Series'), doors: pick('Doors'),
    keylessIgnition: pick('KeylessIgnition'),
    errorText: pick('ErrorText')
  };
}
