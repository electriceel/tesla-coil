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

**Vehicles** opens on the makes, not on 650-odd records — 96 rows, each saying how many
models sit behind it, because picking a make is the first thing you do on a real call.
Tap one to drill in; a link at the top comes back out. Searching or setting a year
skips the index and goes straight to results across every make.

**Tools > Safe keys** is the one section where the paperwork comes before the
hardware. It reads in the order the call actually goes: work out what you are
looking at, establish whether a key exists at all (most safes are a dial or a
keypad and the key, where there is one, opens nothing on its own), assume there
is a relocker, and only then decide whether you are allowed. Four rows are
refusals grouped together at the bottom and badged so they do not look like
jobs — safe deposit boxes, ATMs, pharmacy narcotics storage and Realtor
lockboxes each belong to someone with their own process.

Nothing in it is about defeating a safe. The route is the serial number and the
manufacturer, which is cheaper for the customer and leaves the safe worth what
it was, so the rows carry where the serial hides rather than a part number. Two
tests enforce that: one that every refusal still refuses, and one that no row in
the section or its blank category has drifted into explaining a way in.

**Tools > Dealer only** answers the first question on a call: can you do this
job at all. 172 of the 835 records carry a warning, in six tiers that are six
different phone conversations — dealer only, bench or module work, needs the OEM
master key, gateway-gated, all-keys-lost only, and too new to promise. Nothing
else is listed, because everything else is ordinary OBD work and a warning
screen that flags half the book stops meaning anything.

The classification is derived, not written down. `assets/js/dealer.js` reads
each record's own `programming.obd` and `programming.allKeysLost` and nothing
else, so the screen holds no list of its own and a record added tomorrow
classifies itself. Every row shows the two fields it was judged on, so the
verdict is auditable rather than asserted — tap through to the record if the
evidence looks wrong.

`tests/dealer.test.js` drives the classifier directly, and its cases are the
mistakes it actually made: "Usually bench" begins with the word "usually" and an
early version read that as an affirmative, filing a BMW F30 alongside a Camry;
"Dealer on most" is some-trims-yes and reading it as dealer-only turns down work
you can do; the notes field mentions tooling in passing and reading it flagged
an ordinary Silverado. One test asserts only that the warning stays selective,
because the failure mode of a screen like this is becoming wallpaper.

**Tools > Lishi guide** is the tool roll, indexed the other way round. You are
holding an HU101 and want to know what it opens; the guide answers that, grouped
by make family and ordered by how much of your database each family covers, so
the tools your hand reaches for most sit at the top. Every row joins live to the
rest of the app: the cut type, spaces, depths and the blank to cut come off the
blank row, and the vehicle list comes off the vehicle records, so nothing in the
guide is a second copy that can drift. Tap a make to see just those records, or a
keyway to jump into the directory. A test enforces the correspondence both ways
— a tool named in a record with no row in the guide is a car you cannot reach
from the tool in your hand, and a row no record mentions is a tool that lists
nothing.

**Moto** is the same screen for a different trade. Bikes, ATVs, side-by-sides,
PWC and snowmobiles are separate work — separate blanks, separate tooling,
separate money — and mixing 71 of them into 650 cars meant scrolling past
Chevrolet to reach Ducati. Each tab keeps its own make, year and search, so
checking a bike mid-job does not throw away the car you were part-way through.
A record's Back button knows which catalog it came from, and a powersports
blank's make chip lands you in Moto rather than in an empty car list.

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

**Master keying** — under Tools, in four shapes.

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

*SFIC core* is BEST's small format interchangeable core, which is a different animal
because it has two shear lines. The operating one, between plug and sleeve, is what an
ordinary key lifts to. The control one, between sleeve and shell, is what pulls the core
out of the housing. So the chart grows two rows: a **control pin** spanning from the
deepest operating cut up to the control shear line, and a **top pin** filling what is
left to a constant stack height.

Give it whichever of the three keys you have — control, master, operating, any one, any
two, or all three — and it charts what they allow and says plainly what they cannot
tell you:

- **A control key cannot be worked out from operating keys.** Its cuts are an independent
  bitting. The only ways to learn an existing core's control key are to be handed it or
  to pull the core and read the stack. Leave the field blank and the tool proposes one,
  centring both pins it governs so neither comes out thin — and labels it PROPOSED
  everywhere it appears, because it has no way to know what control keys the building
  already uses.
- **Operating keys with no master generate no new change keys.** Which barrels a system
  holds constant is the master's business; with only change keys in hand there is no way
  to tell a held barrel from one that happens to match, so a new key would be a guess at
  whether it cross-keys. It charts what you gave it and says why it stopped.
- **One key reads the whole pattern in A2** — a two-step system keeps each barrel's
  odd/even pattern, so any key in it reads the depths that barrel can use. A4 is single
  step with no pattern, so it reads nothing, which is why BEST says to scramble A4 codes
  rather than progress them.

It also reports the things that are easy to miss: that every core on one control key
takes the same top pins (a top pin is the stack height less the control code, so it
depends on the control key and nothing else); that the control key *also turns the plug*
when its cut happens to be an operating depth at every barrel; and that no operating key
can reach the control shear line, which holds because the control lug is thicker than the
depth range spans — proved for the system in use rather than asserted.

A2 and A4 ship, 6-pin and 7-pin, with their published specifications: A2 depths 0-9 two
step, lug 10, stack 23; A4 depths 0-5 single step, lug 6, stack 14. Those are shown
rather than offered as fields — change a stack height and every chart below it is wrong
in a way that still looks like a chart. **A3 is deliberately absent**: the trade
literature gives its lug as 7 and its stack as 16, but nothing citable states its depth
range, and a chart built on a guessed depth range is confidently and uniformly wrong.

The arithmetic is checked against BEST's own two worked examples, reproduced barrel for
barrel and segment for segment — `node tests/sfic.test.js`.

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

**FCC IDs** are kept in `assets/js/fcc.js`, one row per ID, joined to the vehicle at render
time — 100 verified grants across 241 vehicles. Only what the FCC certifies is stored: the
grant holder, the equipment class, the frequency and the **original** grant date. Original
matters: a grant accumulates Class II permissive changes and a lookup page leads with the
most recent one, which makes a 2002-granted fob read as 2012 and an ordinary 2004 car look
impossible. Fitment is deliberately *not* in that file — the FCC certifies a radio, not a
model year, so the "fits 2012-2017 Camry" line on a lookup site is a marketplace listing
and lives on the vehicle record where the bench can correct it.

`node tests/fcc.test.js` refuses to let an unchecked ID ship: every ID in the seed must have
a grant row, every grant row must be attached to a vehicle, no fob may be certified after
its car stopped being built, and a record naming one fob for a span that plainly had several
is listed by name rather than quietly accepted.

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

**Blanks** — a browsable key blank directory. It opens on eight categories —
automotive, powersports, fleet & equipment, utility, residential, commercial,
safe & vault, import & uncommon — because 1,224 blanks across 540-odd makes is
not a list you read on arrival. From there, regroup
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

### FCC IDs are the exception — those are checked

The one part of the seed that is not "confirm it yourself" is the fob. Every FCC ID
the app shows has been checked against the public FCC equipment-authorization record,
and `assets/js/fcc.js` holds what the FCC actually certifies for each one: the grant
holder, the equipment class, the operating frequency and the original grant date. The
vehicle detail joins those in, so a fob shows its frequency before you reach for a
sniffer, and its grantee tells an OEM part from a clone.

An FCC ID that is **not** in that file renders with a warning rather than a blank
field, because an unchecked ID is exactly the one you should not order against. That
applies to fobs you type in yourself too. `tests/fcc.test.js` fails the build if any
ID in the seed is missing from the verified list, so an unchecked one cannot ship.

Checking found two that would have cost money at the counter. `LGQ25LR`, listed on the
1999-2006 Silverado, is a PAX payment terminal on 13.56 MHz — it is now `ABO1502T`
(General Motors, 315 MHz) for 1999-2002 and `LHJ011` (Continental, 315 MHz) for
2003-2006. And `YG0G21TB2` on five GM trucks was `YGOG21TB2` with the letter O typed
as a zero.

Fitment is not FCC data and is not treated as such. The FCC certifies a radio, not a
model year; the "fits 2012-2017 Camry" line on a lookup site is a marketplace listing.
Four records still name one fob for a span that used several — the 2004-2023 Maxima
and 2004-2024 Armada among them — and those are listed in the test rather than guessed
at, because splitting them by year needs the bench.

Adding vehicles is the intended workflow. The seed covers the common domestic and
import platforms to get you going; your database becomes the real one. The same goes
for the blank directory — 489 confirmed keyways, all editable: automotive,
powersports, fleet & equipment (RV and trailer, heavy truck, forklift, golf cart,
marine), utility, residential, commercial, safe & vault, and import & uncommon.

Behind those sit 735 **blank-number rows**, marked `#` in the directory and
"Blank number, not a keyway" on the record. Each one is a real Ilco number, and
most carry the JMA equivalent, but the keyway designation was never confirmed —
they arrived with the make and the number pasted into the keyway field, which
reads the cross-reference backwards. Identify one by the number stamped on the
blank, not by its label; a confirmed keyway always sorts ahead of them in a
search. Their earlier "edition 13, section 2, pages 276-282" citations are gone:
19 page ranges spread across 994 rows is a section range, not a citation, and
precision you cannot check is worse than none because it invites trust.

The **Import & uncommon** category is the cross reference for what is not on a
US van by default: cruciform and cross keys, British lever locks, Euro profile
and DIN cylinders, multipoint gearboxes, Scandinavian ovals, the German and Swiss
dimple systems, EVVA magnetic, Japanese residential, Lockwood, Rav Bariach,
Godrej, imported big-box cylinders and tubular variants past the seven-pin Ace.
Import vehicles sit in Automotive instead, because that is where you would look
for them — JDM grey imports past the 25-year rule, kei trucks, VinFast, the
Chinese marques, Mahindra, and the European heavy trucks.

Each row says how likely you are to meet it. Some of these genuinely turn up on
the Central Coast: Euro profile cylinders on modern architecture, imported
multipoint patio doors, kei trucks on ranches and in vineyards, VinFast in
California. Others you will most likely never see, and the row says so — the
point of a reference is that the one call in five years finds you knowing what
you are looking at rather than guessing.

The **Safe & vault** category holds the key-operated side of safe work, and the
five safe rows that used to sit awkwardly in Residential and Commercial moved
into it — a gun safe was never residential door hardware. Almost none of these
carry a catalog number, for the same reason the Tools section does not.

The **Utility** category is the odds and ends: barrel and bayonet locks, meter and
enclosure hardware, the padlock brands below Master and American, office casework,
truck toolboxes, roof racks, coin-op and amusement, luggage and cable locks. On most
of these there is no catalog number worth printing and the useful fact is where the
code is stamped, so that is what the rows carry. Several are refusals rather than
jobs — a locked gas meter, a hydrant and a fire-service cap belong to the utility or
the district, and the row says so and gives the referral instead.

The residential and commercial records are deliberately a separate category rather
than more rows in the car list — it is different work, and the restricted systems
in it (Everest, Primus, Medeco, Mul-T-Lock, Abloy, ASSA) are marked as restricted
because that is the job, not a footnote: the blank comes from an authorized dealer
against the end user on file, and the honest answer on site is to say so rather
than promise a key. The USPS arrow lock record says do not service it at all.

The seed ships 835 records across 117 makes and 657 nameplates, every make
carried at generation depth — split where the transponder or keyway changes, which
is what decides the job, rather than where the styling changed. Coverage is audited
programmatically against the NHTSA vPIC database: no overlapping year ranges, no
record claiming years vPIC does not list, and the only gaps are real North American
production hiatuses (Ford Ranger 2012-2018, Chevrolet Colorado 2013-2014, Chevrolet
Blazer 2006-2018, Chevrolet TrailBlazer 2010-2020, Land Rover Defender 1999-2019,
Acura MDX 2021, Acura NSX 2006-2015), each noted in the record so it does not read
as missing data.

Commercial vehicles run from the light vans up: Class 8 tractors from
Freightliner, Peterbilt, Kenworth, International, Mack, Volvo Truck and Western
Star; medium duty from Hino, Fuso, Ford, GM and Ram; school, transit and
charter buses; step vans, ambulance and fire bodies; and the yard equipment
that comes with them. The recurring fact worth knowing before you drive out is
that Class 8 has no transponder anywhere in it — the whole job is a five-cut
wafer switch — but the ignition and the door are usually different keys, and a
fleet yard is commonly keyed alike across every truck on it. Forklifts and golf
carts go further: one key per brand across the entire fleet, so those are a
stock item rather than a decode.

The 70 powersports records are deliberately outside that audit. vPIC is a
passenger-vehicle index: it lists a handful of motorcycle makes, but patchily
enough that it has the Honda CBR for 1989-1990 only and Polaris snowmobiles for
1999-2008. Checking bike years against it would report the index's gaps as our
errors, so bikes are checked by hand and by the same overlap and duplicate rules
as everything else, not against vPIC. Heavy commercial, buses, upfitted bodies
and yard equipment are outside it for the same reason — but rather than dropping
those rows, the audit sorts them into their own list, so the gap is labelled
instead of hidden. That matters because Freightliner also builds the Sprinter,
which vPIC indexes perfectly well and which stays in scope.

Where a record's keyway, blank number or code series is blank, that is deliberate:
nothing was written down that could not be stood behind. A wrong PIN burns a BCM
attempt and a wrong blank costs money, so an empty field says "decode it" rather
than offering a plausible guess.

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

Combined or alternate nameplates can also carry an `aka` array. Those aliases
are searchable and editable without changing the display name of the record, and
the record shows them as "Also called …" so you can confirm you have the right
car when the customer names a badge rather than a model.

Aliases are for names that identify a **specific** record — Denali, Z71, Panther,
Hellcat, Rubicon, OBS, Dually, ESV, P71. Make-wide nicknames are not repeated
onto every record of that make; `MAKE_NICKNAMES` in `app.js` holds them in one
place, which is what makes "chevy" find all 68 Chevrolet records and "bimmer"
find the BMWs. Before that map existed, searching "chevy" returned nothing at
all — nobody walks up and says Chevrolet.

Every car record also carries a programming note, because the empty case was
the dangerous one: a record with nothing in that field reads as "nothing to know
here", when what it usually meant was that nobody had written down the ten
minutes of Ford timed access or the PIN-by-VIN phone call that decides whether
the job is worth quoting.

The directory search matches your words independently, in any order, so "horse
trailer" finds the row called "Horse and livestock trailer" and "scissor lift"
finds "Scissor and boom lift". It used to match the whole query as one literal
substring, which meant guessing a row's exact wording.

A search that matches a readable number of rows opens them; one that matches
most of the file stays collapsed so the page does not render 1,200 rows. That
budget was set when the directory was a third of this size and had started
hiding ordinary searches — "toyota" matched 14 rows and showed a bare header.
`tests/data.test.js` now pins it from both ends: twelve everyday searches have
to open, and six broad ones have to stay shut.

**Magnetic** had the EVVA MCS row and nothing else, which missed the two that
actually cost time. A key can carry a magnet *alongside* ordinary cuts, so a
duplicate comes out dimensionally perfect, enters cleanly and does nothing —
that reads exactly like a bad cut and is not one. And the childproof cabinet
latch whose "key" is a magnet puck is an ordinary residential call that was
nowhere in the directory. The method row also separates three words people use
interchangeably on the phone: a magnet, a transponder and a radio fob are three
different jobs.

**Safe deposit** was a single RESTRICTED row and a refusal in the safe section,
which is correct for a box still in service and no help at all for the ex-bank
nest somebody buys at an auction and brings to the shop. Both now exist and the
value is that they stay told apart: renter, guard and private-vault rows keep
saying RESTRICTED and keep pointing at the institution, while the
out-of-service row says plainly that it is yours and asks for a bill of sale.
The renter row also answers "can you cut me a spare" with the reason rather than
just a no — the bank keeps no copy of either renter key by design, so there is
no code on file anywhere to work from. Tests assert both directions, because
softening the refusal and over-restricting the legitimate job are both wrong.

**Cruciform** had one row naming the cross key; it now has a method row (count
the pin *rows*, not the blades — a four-bladed key often has a plain guide wing
and still reads only three), a padlock-and-bike-lock row for how US shops
actually meet one, an automotive row for the pre-1990s Fiat/Lada/Zastava era, and
a row that answers "can you cut another" and "is this a good lock" differently,
because the honest answers are yes and no. Adding it also exposed that **"cross
key"**, the term a customer actually uses, returned 657 rows: the word *cross*
was buried inside a "cross-reference" note on 637 of them. That wording was mine
and said no more than "equivalent", so it is gone and the search works — a test
holds it there.

**Tubular** had the Ace pattern and its variants but nothing on how you work one,
so it gained a method row — pin count, shank diameter, post diameter, and whether
the post is centred or offset — plus the row that stops a wasted trip: "tubular"
names both the round Ace key *and* a door prep, and a tubular deadbolt almost
always takes an ordinary edge-cut key. Checking that also turned up four rows
whose `cut` field contradicted their own notes (a vending T-handle filed as Edge
while its text said "usually tubular"), which matters because `cut` is what
decides the machine and clamp that go in the van. A test now refuses any row that
argues with itself about the cut.

**Bit keys and flat steel** were the same story as dimple, one step further on:
present by application — warded interior doors, antique safes, British levers,
luggage, boat hatches — but never as a family, so nothing explained how you pick
a bit blank or hold a flat key. Flat appeared only as a cut qualifier on ten rows
and had no row of its own at all. Both now have one, including the four
measurements that decide a bit blank (shank diameter, shoulder distance, bit
height, bit thickness, since you file these rather than cut to a code), the
hollow-shank pipe keys that are a different blank from a solid one, and a
pre-war automotive flat-key row for the classic-car work. The clock row exists to
say the thing customers get wrong: a winding key is a socket on an arbor, not a
lock key, and the case door is the only part of that job that is yours.

**Dimple** was in the data from early on but spread across four categories with
nothing explaining the method, so searching for it returned fragments. One
search now gathers the family: Mul-T-Lock and the Kaba/Keso line that were
already there, plus ABUS, the Italian and Turkish armoured-door systems, EVVA,
the German, Austrian, Czech, Polish and French makers, dimple padlocks, and two
rows that are the practical part — what machine, clamp and cutter the job needs,
and how you identify and order a blank Ilco does not make. Several of those
manufacturers sell a conventional pin line beside the dimple one, so the rows
say to read the key in hand rather than the badge on the door.

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
