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

**Lookup** opens on the makes, not on 500 vehicles — 75 rows, each saying how many
models sit behind it, because picking a make is the first thing you do on a real call.
Tap one to drill in; a link at the top comes back out. Searching or setting a year
skips the index and goes straight to results across every make.

Then filter by make, year, or free text across model, keyway, Ilco number,
chip and FCC ID. The search box takes a job the way it arrives on the phone: type
`2015 camry` or `camry 2015` and the year is read as a model year, so you land on
the one generation rather than all five. Punctuation is ignored, so `f150` finds
the F-150. Results are grouped by nameplate: a model with several generations
is one line showing its full year span and a count, which opens to the individual
generations. Narrow to a few models and they open themselves.

**The record** — tap a result and the vehicle opens as four tabs under a sticky
header, with a generation dropdown so you can move between year ranges of the same
nameplate without going back to the list.

- **Overview** — the basics (code series, spaces, depths, ignition retainer, MACS,
  cut type — a block per code series when a car carries more than one, each with
  its own MACS), a tumbler-location grid, the keys (keyway / Ilco / Silca / JMA / OEM
  P/N) with a jump straight to that blank in the directory, the transponder and
  whether it clones, the fobs with FCC IDs, and the decoders.
- **Keymaking** — the three ways in, in order: decode the lock, originate by code,
  program the key (OBD vs onboard vs all-keys-lost, with the PIN warning up front),
  plus the OBD port and entry note.
- **Tips** — your own notes from your own jobs, filed under the seven categories a
  job actually goes through: car door unlocking, lock picking / decoding, key
  programming, remote programming, code locations, lock removal, OBD port location.
  They save per vehicle on this device and ride along in the backup.
- **Parts** — what this job takes, in one list you can read at the van.

The ignition retainer, MACS and per-lock tumbler positions ship empty. They are
machine-book facts with no source to cite, so the record says so rather than
guessing, and the editor takes them (`1-8` or `1,3,5,7`) once you have decoded one.

**VIN** — offline decode always works: WMI to manufacturer, model year from
position 10, ISO 3779 check digit. Tap the NHTSA button when you have signal for
make/model/trim/engine/plant off the free federal vPIC database. Either way it then
lists matching vehicles from your own database.

**Master keying** — under Tools, in two shapes.

*Single master* progresses a run of change keys under one master, by rotating constant
(holds one chamber at the master depth, so no change key can turn into an unintended
master) or total position (progresses every chamber, for the most changes a master will
carry).

*Existing master* is the job that actually comes up: a building already has a master
and keys in the field, and needs six more changes. Give it the master and whatever keys
you have decoded, and it reads the layout back off them — which chambers progress, which
are held, and what step the system was cut on, including one-step systems that would be
wrong to pin as two. Then it generates new changes inside that layout and **refuses any
that would cross-key** — a new key that sits between the master and a key already in the
field will open that lock, and nobody finds out until a tenant does. Rejections are
counted and shown. If nothing safe is left, it says the system is full and needs a rekey
rather than handing you another change.

*Full system* builds the hierarchy — up to great grand master over grand master over
master over change key, with standard key symbols (GGM, A, AA, AA1). The method is
position allocation: each level owns a set of chambers and progresses only those,
holding every other at its parent's depth. That is what keeps the levels from
colliding, and the chamber assignment is yours to set. Every lock is pinned for its
whole chain, so a chamber can carry three or four depths and a stack of master pins.

Then it audits itself. Every key in the system is tried against every lock in it, and
any key that opens a door above its level is reported by name — because "the allocation
should prevent that" is not the same as having checked. The suite includes a
deliberately broken system to prove the audit can fail, so a clean one means something.

Schlage and Kwikset ship with their published depth range and MACS, and every one of
those is editable for the cylinder in your hand; switching maker resets the range to
that maker's. Each lock opens to a pinning chart — bottom pin and master pins per
chamber — plus the count of bittings the pinning also passes, which is the number worth
weighing before a system goes on a door that matters. Master pins under the
two-increment minimum are flagged. Systems save by their inputs, not their output, so a
reloaded system regenerates from the same math rather than carrying a stale schedule.

Nothing in it is looked up. It is arithmetic on one physical fact: a deeper cut lets
the stack sit lower, so the bottom pin is sized to the shallower of the two cuts and the
master pin makes up the difference. The math has its own test suite separate from the UI — `node tests/master.test.js`.
The seed data has two — `node tests/data.test.js` and `node tests/crossref.test.js`.

The first checks the mistakes that are easy to make by hand and impossible to see by eye
in a 300 KB file: duplicate ids, a record entered twice, backwards or implausible years,
HTML entities that would render as literal `&amp;`, stray non-ASCII characters, and
residential or commercial keyways that match a vehicle — which is always two descriptions
sharing an ordinary English word, and always reads as data.

The second checks that catalog cross-references do not contradict each other. Vehicle
records name the keyway and the Ilco blank; **Silca and JMA live only on the blank record**,
one authoritative row per keyway. They used to sit in both places and disagreed 25 times,
with no way to tell from inside the file which side was right — so the duplicate came out
rather than being made to agree on a number that could not be stood behind.

**Tools** is a launcher, not a scroll — four tiles, each opening its own screen:
master keying, Nissan BCM, the quote builder, and hex/decimal.

**Blanks** — a browsable key blank directory. It opens on five categories —
automotive, powersports, fleet & equipment, residential, commercial — because 226
blanks across 200-odd makes is not a list you read on arrival. From there, regroup
by make, by cut type (edge / laser / Tibbe) or A-Z by keyway, or search any catalog number — keyway, Ilco, Ilco
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
for the blank directory — 226 keyways, all editable: automotive, powersports,
fleet & equipment (RV and trailer, heavy truck, forklift, golf cart, marine),
residential and commercial.

The residential and commercial records are deliberately a separate category rather
than more rows in the car list — it is different work, and the restricted systems
in it (Everest, Primus, Medeco, Mul-T-Lock, Abloy, ASSA) are marked as restricted
because that is the job, not a footnote: the blank comes from an authorized dealer
against the end user on file, and the honest answer on site is to say so rather
than promise a key. The USPS arrow lock record says do not service it at all.

The seed ships 512 vehicle records across 75 makes and 404 nameplates, every make
carried at generation depth — split where the transponder or keyway changes, which
is what decides the job, rather than where the styling changed. Coverage is audited
programmatically against the NHTSA vPIC database: no overlapping year ranges, no
record claiming years vPIC does not list, and the only gaps are real North American
production hiatuses (Ford Ranger 2012-2018, Chevrolet Colorado 2013-2014, Chevrolet
Blazer 2006-2018, Lexus GS 2012), each noted in the record so it does not read as
missing data.

## Two kinds of data, and only one of them is sourced

`assets/js/models.js` is a make / model / year index harvested from the NHTSA vPIC
database (a free public federal API) for model years 1981-2026 — 2,301 models across
62 makes. It is real, checkable reference data, and it says only which vehicles exist
and when they were built.

`assets/js/data.js` holds the key data — blanks, chips, fobs, cutting, programming.
That is not sourced from anywhere; it is written knowledge, flagged unverified, and
it is the part to confirm before you cut.

The app keeps the two apart on purpose. Search for a vehicle it has no key data for
and it will tell you, from vPIC, whether the thing is real and what years it ran —
"a real vehicle you have no record for" is a different answer from "no such vehicle",
and only the first is worth starting a record for. The same index backs the make and
model fields when you add one, so spelling stays consistent.

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
