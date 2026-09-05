# KeyPro Field

An automotive-locksmith reference app in the same shape as AutoProAPP: punch in a
year/make/model and get the blank, the chip, the fob, the cut and the programming
path — plus a VIN decoder, a key-blank cross-reference, a Nissan BCM lookup, a
quote builder and a job log.

It is a static PWA. No build step, no server, no account, no telemetry. Open
`index.html`, or serve the folder and Add to Home Screen — after the first load it
runs with no signal, which is the point when you are under a truck in a canyon.

## Layout

```
index.html              app shell, all views
manifest.json  sw.js    PWA install + offline cache
assets/css/app.css      one stylesheet, dark + light
assets/js/data.js       SEED vehicle records, blank cross-ref, VIN WMI table
assets/js/vin.js        VIN check digit, year, WMI; NHTSA vPIC enrichment
assets/js/store.js      localStorage: your edits, jobs, BCM table, prefs
assets/js/app.js        routing, rendering, forms
```

## What each tab does

**Lookup** — filter by make chip, year, or free text across model, keyway, Ilco
number, chip and FCC ID. Tap a result for the full record: blank (keyway / Ilco /
Silca / JMA / OEM P/N), transponder and whether it clones, fobs with FCC IDs,
code series and cut type, OBD vs onboard vs all-keys-lost programming, whether a
PIN is needed, OBD port location and an entry note.

**VIN** — offline decode always works: WMI to manufacturer, model year from
position 10, ISO 3779 check digit. Tap the NHTSA button when you have signal for
make/model/trim/engine/plant off the free federal vPIC database. Either way it then
lists matching vehicles from your own database.

**Blanks** — a browsable key blank directory. Group by make, by cut type (edge /
laser / Tibbe) or A-Z by keyway, or search any catalog number — keyway, Ilco, Ilco
chip, Silca, JMA, Strattec — and matching groups open themselves. Tap a blank for
the full cross-reference, cut spec (spaces, depths), every make it serves, notes,
and the vehicles in your own database that take it, each one a link straight to its
record. Tapping a make jumps to the vehicle lookup filtered to it. Add and edit
blanks the same way you do vehicles; your version overrides the seed and rides along
in the backup file.

**Tools** — Nissan BCM→PIN lookup (see below), hex/decimal converter, quote builder.

**Jobs** — customer, vehicle, service, keys, price, status, notes. Export CSV.

## The seed data is a starting point, not a catalog

Every bundled vehicle record is flagged **unverified** and the detail screen says so
until you confirm it. Confirm the blank and chip against the vehicle or your machine's
own database before you cut or program. Edit any record (Vehicle → Edit) and saving it
marks it verified and stores your version on this device, overriding the seed.

Adding vehicles is the intended workflow. The seed covers the common domestic and
import platforms to get you going; your database becomes the real one. The same goes
for the blank directory — 51 keyways across autos, powersports and equipment, all
editable.

The seed ships 260 vehicle records across 38 makes and 157 nameplates, every make
carried at generation depth — split where the transponder or keyway changes, which
is what decides the job, rather than where the styling changed. Coverage is audited
programmatically: no overlapping year ranges, and the only gaps are two real North
American production hiatuses (Ford Ranger 2012-2018, Chevrolet Colorado 2013-2014),
noted in the records themselves.

Records are written in a compact form and expanded by `V()` at the top of
`data.js` — short keys, one record per handful of lines. The object it returns is
the same shape the app has always read.

Where a fob's FCC ID or OEM part number was not something the data could state
confidently, the field is left blank rather than filled with a plausible guess — an empty field costs you a lookup, a wrong
one costs you a returned fob.

## Nissan BCM → PIN

The tool searches a conversion table **you** import — CSV, `bcm,pin` with an optional
third note column:

```
bcm,pin,note
5B7D,4021,
24BF,1187,verify on 2008+
```

It deliberately does not compute or guess a PIN. A wrong PIN burns an attempt on the
BCM, so an honest "not in your table" beats a confident wrong answer. Import the list
from your code service or supplier; it stays on the device.

## Backups

Everything is in this browser's `localStorage`. Clearing site data erases it.
Settings → Export backup writes a JSON file with your vehicle edits, jobs, BCM table
and shop prefs; Import merges or replaces. Do this before you switch phones.

## Deploying

It is static — copy the repo anywhere that serves files over HTTPS (service workers
need a secure origin; `localhost` counts). Bump `CACHE` in `sw.js` on every deploy or
installed clients keep serving the old bundle.

Local check:

```
python3 -m http.server 8080     # then open http://localhost:8080/
```
