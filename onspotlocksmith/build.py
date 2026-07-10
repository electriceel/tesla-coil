#!/usr/bin/env python3
"""Static site generator for onspotlocksmith.com.

Usage:  python3 build.py
Output: ./site/  — upload the *contents* of site/ to the web root.

Everything is deliberately dependency-free (stdlib only) so it can be
rebuilt anywhere. Page copy lives in the data structures below; blog and
legal page bodies live in ./data/.
"""
import json
import os
import shutil
from datetime import date

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(ROOT, "site")
DATA = os.path.join(ROOT, "data")

BASE = "https://onspotlocksmith.com"
BIZ = "OnSpot Locksmith 24/7"
PHONE_DISPLAY = "(805) 550-3666"
PHONE_TEL = "805-550-3666"
PHONE_E164 = "+18055503666"
EMAIL = "info@onspotlocksmith.com"
STREET = "1000 Railroad Avenue"
CITY_LOC = "San Luis Obispo"
STATE = "CA"
ZIP = "93401"
GEO = (35.2761, -120.6555)
YELP = "https://www.yelp.com/biz/onspot-locksmith-24-7-san-luis-obispo"
GOOGLE = "https://www.google.com/localservices/prolist?spp=Cg0vZy8xMXN0ZmwxOGh2&src=2&slp=UhUIARIREg8iDS9nLzExc3RmbDE4aHY#ts=3"
WHATSAPP = "https://wa.me/18055503666"
YEAR = date.today().year

GA_SNIPPET = """<script async src="https://www.googletagmanager.com/gtag/js?id=G-SNPZ3P1GWT"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-SNPZ3P1GWT');gtag('config','AW-441351166');</script>
<script>document.addEventListener("DOMContentLoaded",function(){function oslConv(){gtag("event","conversion",{send_to:"AW-441351166/h7PbCLbhzcUcEP73udIB"});}document.querySelectorAll('a[href^="tel:"]').forEach(function(a){a.addEventListener("click",oslConv);});document.querySelectorAll("form").forEach(function(f){if(f.querySelector('input[type="search"]')||f.getAttribute("role")==="search")return;f.addEventListener("submit",oslConv);});});</script>"""

# ---------------------------------------------------------------- reviews --
REVIEWS = [
    ("Kris B.", "Car keys cut on site — Nissan", "Ryan from OnSpot Locksmiths was the best locksmith I have ever had the pleasure to do business with. I called them to get a couple new keys cut for my Nissan and he was polite, professional and on time to the scheduled appointment. Got the keys cut very quickly and everything went smooth as can be! Great price, service and even went out of his way to meet me at my work to get them cut! I'll only be calling them for my locksmith needs!"),
    ("Luke Wills", "Key fob programming — Subaru", "Had a great experience working with Ryan to get an aftermarket key fob programmed for my Subaru Forester. Apparently, Subarus make tricky key fobs to program, but Ryan made quick work of it without issue. He was responsive to calls and texts and was kind and professional during the appointment. I highly recommend his services!"),
    ("Skye Samson", "Motorcycle key duplication", "OnSpot Locksmith is the best locksmith in town! I've called every locksmith on the central coast looking to make a copy of a motorcycle key and Ryan was one of the only 2 people in town who was able to provide this service. Ryan went above and beyond with ensuring he had the right blanks for the key and that my key was cut precisely and turned the ignition. Great communication and quick mobile service."),
    ("James Huang", "Emergency rental lockout", "Called OnSpot Locksmith one desperate evening when my Airbnb guests were locked out. He returned my call within 5 minutes and quickly said he could be there in 40 minutes. He took my ID, proof of ownership of the property, and form of payment, and in less than 20 minutes showed up and let our guests in — no muss, no fuss. Thank you so much for pulling us out of a bind!!"),
    ("Victor T.", "Midnight car lockout", "Had an amazing experience — Ryan was so kind in coming out to help me at midnight with retrieving my keys I locked inside my vehicle. From initial contact to key retrieval, it was less than an hour! 10/10 would call again if I need to, and I recommend him to anyone that ends up in the same situation as I did."),
    ("Blake Petrucci", "Difficult lockbox opening", "Ryan is a good guy and communicated well as we planned our appointment. He helped me with an old lockbox of mine that turned out to have a very difficult lock to crack — not your run of the mill job. He made quick work of it."),
    ("Taryn Kalman", "Responsive mobile service", "OnSpot Locksmith was very responsive, professional and knowledgeable! He accommodated my needs in a very timely manner. I felt such relief when he would update me so I wasn't just waiting around or feeling like I wasn't a valued customer. Very well done."),
    ("Gordon M.", "Sunday home rekey", "Came to our home on a Sunday afternoon to rekey two locks — communicative, professional, and on time. He was able to rekey a digital lock without the key, using skill to open it. Super reasonable prices, especially for a weekend call. Will be our go-to locksmith for our home and rentals."),
    ("Brian Carbone", "Smart lock adjustment", "I installed a couple of smart locks and to my dismay, the new locks weren't aligning properly with the strike plates. Ryan came to the rescue and fixed both issues — this gentleman really knows his stuff. He was very prompt and professional. Can't recommend him enough. If you're on the fence, don't hesitate and give him a call."),
    ("James Mattison", "Safe opening", "Called and within an hour the locksmith was at my house to get into a safe that had a missing key. Ten minutes later, the safe was open. Ryan was extremely courteous and professional. Pricing was extremely reasonable — bordering on cheap even. I would absolutely call these guys again. A+, cannot recommend enough!"),
    ("Cory Karpin", "Spare key fob — used car", "Awesome experience! We bought a used car that only had one key fob. They came to us and made a second key fob with full functionality, including remote start, for far less than other quotes. Professional, nice, and reasonable. What else can you ask for. Highly recommend."),
    ("Joshua Iffert", "Antique safe opening", "We had an antique safe that needed to be opened and this thing was a BEAST — easily 4-inch thick walls — and he did an awesome job getting into it. This safe was no small job. I 100% recommend OnSpot for your locksmithing or safecracking needs!"),
]

# --------------------------------------------------------------- services --
AUTO_SERVICES = [
    ("Vehicle Lockouts", "Locked out of your car? We open vehicles quickly and without damage, typically arriving within 30 minutes to an hour."),
    ("All Keys Lost Replacement", "Lost every key to your car? We cut and program brand-new keys on site — no tow to the dealership needed."),
    ("Key Programming", "Smart keys, transponder chips, and remotes programmed at your location for 95% of vehicle makes and models."),
    ("Car Key Duplication", "Precise spare car keys cut while you wait, so a lost key never becomes an emergency."),
    ("Key Fob Replacement", "Replacement fobs and remotes — including remote start — usually in stock or available next business day."),
    ("Broken Key Extraction", "Snapped a key in the door or ignition? We safely extract the broken piece without damaging the lock."),
    ("Car Key Repair", "Damaged or worn keys repaired promptly so they work smoothly in your ignition and doors."),
    ("Motorcycle Keys", "One of the few locksmiths on the Central Coast who cuts motorcycle keys — including from a lost-key situation."),
]
RES_SERVICES = [
    ("Home Lockouts", "Locked out of the house? Quick, non-destructive entry that gets you back inside without damage."),
    ("Rekeying", "Keep your existing locks but make old keys useless — the smart move after moving in or losing a key."),
    ("Lock Installation & Changing", "Precise installation of new deadbolts and hardware, or upgrades to outdated and compromised locks."),
    ("Electronic & Smart Lock Installation", "Keyless entry, keypads, and smart locks installed and aligned correctly the first time."),
    ("Lock & Key Repair", "Sticky, worn, or broken locks and keys restored to smooth operation — often cheaper than replacement."),
    ("Key Duplication", "Accurate spare house keys for family members, guests, and rentals."),
    ("Safe Locksmith Services", "Locked-out safes opened, combinations changed, and safes serviced — from lockboxes to antiques."),
    ("Gate, Mailbox & Cabinet Locks", "Sturdy locks for gates, mailboxes, and cabinets to protect every corner of your property."),
]
COM_SERVICES = [
    ("Commercial Lockouts", "24/7 response for offices, shops, and warehouses with minimal disruption to your operations."),
    ("Master Key Systems", "One key for the owner, restricted keys for staff — designed around how your business actually runs."),
    ("Access Control & Keypads", "Keyless entry and access control systems installed, maintained, and upgraded."),
    ("High-Security Locks", "Commercial-grade and high-security cylinders that resist picking, bumping, and unauthorized duplication."),
    ("Rekeying & Key Control", "Fast rekeys after employee turnover so former keys no longer open your doors."),
    ("Panic Hardware & Exit Devices", "Exit devices and panic bars serviced — including Von Duprin and other commercial brands."),
    ("Safe Services", "Commercial safe opening, repair, and combination changes to protect cash and documents."),
    ("Security System Services", "Installation, maintenance, and upgrades for CCTV, alarms, and door hardware."),
]
EMERG_SERVICES = [
    ("Car Lockouts", "Keys locked in the car, trunk, or a dead fob at the worst moment — we come to you, day or night."),
    ("Home Lockouts", "Locked out at midnight? We get you back inside quickly with non-destructive entry techniques."),
    ("Business Lockouts", "Can't open up for the day, or can't lock up for the night — we respond fast to keep you in business."),
    ("All Keys Lost", "Every key gone? We cut and program new car and house keys on the spot, 24/7."),
    ("Broken Key Extraction", "Broken keys removed safely from doors and ignitions without damaging the lock."),
    ("Emergency Rekeying", "Lost keys, a break-in, or a bad breakup — we rekey your locks immediately so old keys stop working."),
    ("Safe Opening", "Locked-out safes and lockboxes opened by skill, not brute force."),
    ("Motorcycle Keys", "Lost motorcycle keys replaced on site — a specialty few locksmiths in the county offer."),
]

CAR_BRANDS = ("Acura, Audi, BMW, Buick, Cadillac, Chevrolet, Chrysler, Dodge, Ford, GMC, Honda, "
              "Hyundai, Infiniti, Jaguar, Jeep, Kia, Land Rover, Lexus, Lincoln, Mazda, Mercedes-Benz, "
              "Mercury, MINI, Mitsubishi, Nissan, Subaru, Toyota, Volkswagen, Volvo")

# ----------------------------------------------------------------- cities --
# eta = realistic arrival window from the San Luis Obispo base.
CITIES = [
    dict(slug="san-luis-obispo", name="San Luis Obispo", region="City of San Luis Obispo", eta="15–30 minutes",
         old=["san-luis-obispo-ca-locksmith-services.html"],
         nearby=["edna", "avila-beach", "los-osos", "santa-margarita"],
         intro=["San Luis Obispo is our home base — OnSpot Locksmith 24/7 operates from Railroad Avenue, just off the historic train station district, which means SLO calls get our fastest response in the county. From student rentals near Cal Poly to businesses along Higuera Street and homes from Laguna Lake to the Johnson Avenue corridor, we handle lockouts, rekeys, and on-site car key cutting all over town.",
                "Because we're mobile, you never have to find us — we come to you, whether you're locked out downtown on a Friday night, need an apartment rekeyed between tenants, or lost your only car key in a parking structure. Most SLO jobs are done the same day you call."]),
    dict(slug="paso-robles", name="Paso Robles", region="North County", eta="30–45 minutes",
         old=["service-areas-paso-robles.html"],
         nearby=["templeton", "san-miguel", "adelaide", "creston"],
         intro=["Paso Robles is wine country — and busy event weekends around the Downtown City Park, hotels, and tasting rooms mean lockouts happen at the least convenient times. OnSpot Locksmith 24/7 serves all of Paso Robles, from Spring Street businesses to ranch properties east of the Salinas River, with fully mobile service.",
                "We cut and program car keys on site in Paso Robles — including smart keys and fobs for luxury and touring vehicles — so you don't have to tow your car to a dealership in another town. Homeowners and vacation-rental hosts also count on us for rekeys, smart locks, and emergency entries."]),
    dict(slug="atascadero", name="Atascadero", region="North County", eta="25–40 minutes",
         old=["premier-locksmith-services-in-atascadero-ca.html"],
         nearby=["templeton", "santa-margarita", "asuncion", "creston"],
         intro=["From the Colony District to homes tucked into the oak-covered hills west of Highway 101, Atascadero residents rely on OnSpot Locksmith 24/7 for fast mobile service. We regularly help commuters locked out along El Camino Real and families needing locks rekeyed or upgraded.",
                "Our van carries the equipment to cut and program keys for 95% of vehicles right in your driveway — plus everything needed for residential rekeys, smart lock installs, and emergency lockouts, day or night."]),
    dict(slug="templeton", name="Templeton", region="North County", eta="30–45 minutes",
         old=["service-areas-templeton.html"],
         nearby=["paso-robles", "atascadero", "creston", "adelaide"],
         intro=["Templeton's Main Street charm comes with ranch properties, wineries, and family homes spread across the countryside — and OnSpot Locksmith 24/7 covers all of it with fully mobile locksmith service. No shop to visit; we bring the shop to you.",
                "Whether it's a car lockout at Templeton Community Park, a gate lock for an ag property, or new keys for a home off Vineyard Drive, we arrive equipped to finish the job in one visit."]),
    dict(slug="san-miguel", name="San Miguel", region="North County", eta="40–55 minutes",
         old=["service-areas-san-miguel.html"],
         nearby=["paso-robles", "lake-nacimiento", "shandon", "templeton"],
         intro=["Home to Mission San Miguel and one of the county's oldest communities, San Miguel sits at the far north end of our service area — and yes, we really do come out, 24/7. Locksmith options are thin this far north, so OnSpot Locksmith 24/7 makes regular runs up Highway 101.",
                "We handle car lockouts and lost-key replacements on site, plus residential rekeys and lock repairs for homes and rural properties around San Miguel and Camp Roberts."]),
    dict(slug="santa-margarita", name="Santa Margarita", region="North County", eta="20–35 minutes",
         old=["service-areas-santa-margarita.html"],
         nearby=["atascadero", "san-luis-obispo", "creston", "shandon"],
         intro=["Just over the Cuesta Grade, Santa Margarita is a small ranch town where the nearest locksmith shop is a long drive away. OnSpot Locksmith 24/7 brings full mobile service to Santa Margarita and the surrounding ranch land along Highway 58.",
                "From lockouts at the lake to rekeying a ranch house or cutting a spare truck key, we come to you with everything on board."]),
    dict(slug="creston", name="Creston", region="North County", eta="35–50 minutes",
         old=["your-trusted-locksmith-partner-in-creston-ca.html"],
         nearby=["templeton", "atascadero", "santa-margarita", "shandon"],
         intro=["Creston's horse ranches and rural homesteads are a long way from any storefront locksmith — which is exactly why OnSpot Locksmith 24/7 is fully mobile. We serve Creston and the surrounding back roads with the same 24/7 availability as the rest of the county.",
                "We cut and program vehicle keys on site, open locked farm trucks and barns, rekey ranch houses, and install heavy-duty locks on gates and outbuildings."]),
    dict(slug="shandon", name="Shandon", region="North County", eta="45–60 minutes",
         old=["service-areas-shandon.html"],
         nearby=["paso-robles", "creston", "san-miguel", "templeton"],
         intro=["Out at the junction of Highway 46 East, Shandon is surrounded by vineyards and wide-open ranch land — and very few services. OnSpot Locksmith 24/7 covers Shandon around the clock, so a lockout on a back road doesn't strand you for hours.",
                "Travelers on the 46 corridor between the Central Coast and Central Valley call us for car lockouts and lost keys; locals count on us for home rekeys, mailbox locks, and gate hardware."]),
    dict(slug="adelaide", name="Adelaide", region="North County", eta="45–60 minutes",
         old=["adelaide-ca.html"],
         nearby=["paso-robles", "templeton", "lake-nacimiento", "cambria"],
         intro=["The Adelaide area west of Paso Robles is winding ranch roads, vineyards, and remote properties where a lockout can mean a very long wait — unless your locksmith is mobile. OnSpot Locksmith 24/7 serves Adelaide with on-site car key cutting, lockout response, and residential lock work.",
                "We're used to the terrain: locked farm vehicles, ranch gates, older home hardware, and safes are all in a day's work out here."]),
    dict(slug="asuncion", name="Asuncion", region="North County", eta="30–45 minutes",
         old=["asuncion-ca-locksmith-services.html"],
         nearby=["atascadero", "templeton", "paso-robles", "santa-margarita"],
         intro=["Asuncion, along the Salinas River between Atascadero and Templeton, is a quiet rural pocket without a locksmith for miles. OnSpot Locksmith 24/7 covers Asuncion as part of our everyday North County routes — not as an afterthought.",
                "Car lockouts, lost keys, home rekeys, and lock repairs are all handled on site from our mobile workshop, 24 hours a day."]),
    dict(slug="lake-nacimiento", name="Lake Nacimiento", region="North County", eta="50–70 minutes",
         old=["your-trusted-locksmith-partner-in-lake-nacimiento-ca.html"],
         nearby=["paso-robles", "san-miguel", "adelaide", "templeton"],
         intro=["Between Oak Shores, Heritage Ranch, and the marinas, Lake Nacimiento sees a steady stream of boaters and vacationers — and locked cars with the keys (or the fun) inside. OnSpot Locksmith 24/7 makes the drive out to the lake 24/7, something few locksmiths will commit to.",
                "We open locked vehicles and boats' tow rigs, replace keys lost in the water, and service vacation homes: rekeys between guests, smart locks for remote check-in, and repairs on weathered hardware."]),
    dict(slug="cambria", name="Cambria", region="North Coast", eta="40–55 minutes",
         old=["premier-locksmith-services-in-cambria-ca.html"],
         nearby=["cayucos", "morro-bay", "adelaide", "san-luis-obispo"],
         intro=["Between Moonstone Beach, the East Village, and the crowds headed to Hearst Castle, Cambria hosts thousands of visitors a week — and visitor lockouts are our specialty. OnSpot Locksmith 24/7 serves Cambria and the Highway 1 corridor with fully mobile, 24/7 response.",
                "Locals rely on us too: inn and vacation-rental rekeys, smart lock installs for self-check-in, salt-air-corroded lock repairs, and on-site car key replacement that saves a 40-mile tow."]),
    dict(slug="cayucos", name="Cayucos", region="North Coast", eta="30–45 minutes",
         old=["premier-locksmith-services-in-cayucos-ca.html"],
         nearby=["morro-bay", "cambria", "los-osos", "san-luis-obispo"],
         intro=["Cayucos' pier, beach cottages, and vacation rentals keep this little beach town busy year-round. When keys go missing in the sand, OnSpot Locksmith 24/7 responds with on-site car key cutting and lockout service anywhere in Cayucos.",
                "We also keep the town's rentals turning over safely — rekeys between tenants, keyless entry installs, and repairs to locks that have seen a few decades of ocean air."]),
    dict(slug="morro-bay", name="Morro Bay", region="North Coast", eta="25–40 minutes",
         old=["trusted-locksmith-services-in-morro-bay-ca.html"],
         nearby=["los-osos", "cayucos", "cambria", "san-luis-obispo"],
         intro=["From the Embarcadero to the working waterfront under Morro Rock, Morro Bay mixes tourism, fishing, and quiet neighborhoods — all of which lock themselves out occasionally. OnSpot Locksmith 24/7 provides mobile lockout response, key replacement, and lock service throughout Morro Bay.",
                "Boat owners, RV travelers, and hotel guests call us for vehicle and cabin lockouts; homeowners call for rekeys, deadbolt upgrades, and smart locks. We come to you, 24/7."]),
    dict(slug="los-osos", name="Los Osos", region="North Coast", eta="20–35 minutes",
         old=["premier-locksmith-services-in-los-osos-ca.html"],
         nearby=["morro-bay", "san-luis-obispo", "cayucos", "avila-beach"],
         intro=["Los Osos and Baywood Park sit at the edge of Montaña de Oro, where a car lockout at a trailhead can end an otherwise perfect day. OnSpot Locksmith 24/7 covers all of Los Osos — trailhead rescues included — with fast mobile service from nearby San Luis Obispo.",
                "For the town's homeowners we handle rekeying, lock changes, smart locks, mailbox locks, and repairs on hardware worn down by fog and salt air."]),
    dict(slug="avila-beach", name="Avila Beach", region="South County / Coast", eta="15–30 minutes",
         old=["your-trusted-locksmith-partner-in-avila-beach-ca.html"],
         nearby=["san-luis-obispo", "pismo-beach", "grover-beach", "edna"],
         intro=["Avila Beach packs a resort, a promenade, Port San Luis, and a lot of visitors into a very small town. OnSpot Locksmith 24/7 is minutes away in San Luis Obispo, making us one of the fastest lockout responses available in Avila.",
                "We open locked cars along Front Street and the port, replace keys lost in the sand, and service the town's vacation rentals with rekeys and keyless entry systems."]),
    dict(slug="pismo-beach", name="Pismo Beach", region="South County / Coast", eta="20–35 minutes",
         old=["service-areas-pismo-beach.html"],
         nearby=["grover-beach", "arroyo-grande", "avila-beach", "oceano"],
         intro=["Between the pier, the hotels along Price Street, and classic-car weekends, Pismo Beach stays busy — and so do we. OnSpot Locksmith 24/7 provides 24/7 mobile lockout and key service throughout Pismo Beach, Shell Beach, and Pismo Heights.",
                "Visitors get back into locked cars and hotel-parking mishaps fast; locals get rekeys, smart locks, and on-site car key replacement without a trip over the grade."]),
    dict(slug="grover-beach", name="Grover Beach", region="South County", eta="20–35 minutes",
         old=["your-trusted-locksmith-partner-in-grover-beach-ca.html"],
         nearby=["pismo-beach", "arroyo-grande", "oceano", "nipomo"],
         intro=["Grover Beach's mix of beach access via Grand Avenue, family neighborhoods, and light industry means every kind of locksmith call — house lockouts, shop rekeys, and cars locked at the beach train station. OnSpot Locksmith 24/7 covers them all with one mobile visit.",
                "We cut and program car keys on site anywhere in Grover Beach and handle residential and commercial lock work at prices that beat the dealership and the big chains."]),
    dict(slug="oceano", name="Oceano", region="South County", eta="25–40 minutes",
         old=["service-areas-oceano.html"],
         nearby=["grover-beach", "arroyo-grande", "nipomo", "callender"],
         intro=["Oceano is the gateway to the Oceano Dunes — one of the only beaches in California you can drive on — and sand plus car keys is a combination we know well. OnSpot Locksmith 24/7 responds to lockouts and lost keys at the dunes, the campground, and all over town, 24/7.",
                "Residents also call us for home rekeys, lock repairs, mailbox locks, and spare keys — all done on site from our mobile workshop."]),
    dict(slug="arroyo-grande", name="Arroyo Grande", region="South County", eta="20–35 minutes",
         old=["arroyo-grande-ca-locksmith-services.html"],
         nearby=["grover-beach", "pismo-beach", "oceano", "nipomo"],
         intro=["From the historic Village to the neighborhoods off Traffic Way, Arroyo Grande trusts OnSpot Locksmith 24/7 for fast mobile lock and key service. We're regularly in South County, so response times stay short.",
                "We handle family homes (rekeys, smart locks, spare keys), Village businesses (master keys, high-security cylinders), and every flavor of car lockout and lost-key emergency — on site, at nearly half of what a dealership charges for keys."]),
    dict(slug="nipomo", name="Nipomo", region="South County", eta="30–45 minutes",
         old=["service-areas-nipomo.html"],
         nearby=["arroyo-grande", "oceano", "callender", "grover-beach"],
         intro=["At the southern edge of the county, Nipomo and the Mesa — including the Trilogy community — are a long way from most locksmiths' shops. OnSpot Locksmith 24/7 covers Nipomo daily with full mobile service, so you never need to drive anywhere.",
                "Car keys cut and programmed in your driveway, home rekeys and smart locks, golf-cart and gate locks, and 24/7 lockout response — all of it comes to you."]),
    dict(slug="callender", name="Callender", region="South County", eta="30–45 minutes",
         old=["comprehensive-locksmith-services-in-callender-ca.html"],
         nearby=["oceano", "nipomo", "grover-beach", "arroyo-grande"],
         intro=["The small Callender area between Oceano and Nipomo doesn't have a locksmith of its own — but it has ours. OnSpot Locksmith 24/7 includes Callender in our regular South County coverage with the same 24/7 availability as anywhere else.",
                "Lockouts, lost car keys, rekeys, and lock repairs are all handled on site; most jobs are finished in a single visit."]),
    dict(slug="edna", name="Edna", region="South County", eta="15–30 minutes",
         old=["premier-locksmith-services-in-edna-ca.html"],
         nearby=["san-luis-obispo", "avila-beach", "arroyo-grande", "pismo-beach"],
         intro=["The Edna Valley's wineries, ranches, and rural homes along Highway 227 are just minutes from our San Luis Obispo base, making Edna one of our quickest calls. OnSpot Locksmith 24/7 serves the whole valley with mobile lock and key service.",
                "Tasting-room lockouts, winery master-key systems, ranch gates, and on-site car key replacement for visitors — we cover it all, around the clock."]),
]

CITY_BY_SLUG = {c["slug"]: c for c in CITIES}

# old URL -> new URL redirects (category pages fold into the blog)
EXTRA_REDIRECTS = {
    "category-car-locksmith-services.html": "blog.html",
    "category-handling-car-lockouts.html": "blog.html",
    "category-locksmith-services.html": "blog.html",
    "category-mobile-locksmith-services.html": "blog.html",
    "category-motorcycle-key-replacement.html": "blog.html",
}

# ------------------------------------------------------------------ helpers --
def esc(s):
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace('"', "&quot;")


def city_url(slug):
    return f"locksmith-{slug}-ca.html"


def jsonld_business():
    return {
        "@type": "Locksmith",
        "@id": f"{BASE}/#business",
        "name": BIZ,
        "alternateName": "OnSpot Locksmith",
        "slogan": "Your Full Service Mobile Locksmith",
        "description": "24/7 mobile locksmith serving all of San Luis Obispo County, CA. On-site car key cutting and programming, lockouts, rekeying, and residential and commercial lock services.",
        "url": f"{BASE}/",
        "telephone": PHONE_E164,
        "email": EMAIL,
        "image": f"{BASE}/assets/img/onspot-logo.png",
        "logo": f"{BASE}/assets/img/onspot-logo.png",
        "priceRange": "$$",
        "currenciesAccepted": "USD",
        "paymentAccepted": "Cash, Check, Visa, Mastercard, Discover, Venmo",
        "founder": {"@type": "Person", "name": "Ryan Nunley"},
        "address": {
            "@type": "PostalAddress",
            "streetAddress": STREET,
            "addressLocality": CITY_LOC,
            "addressRegion": STATE,
            "postalCode": ZIP,
            "addressCountry": "US",
        },
        "geo": {"@type": "GeoCoordinates", "latitude": GEO[0], "longitude": GEO[1]},
        "openingHoursSpecification": {
            "@type": "OpeningHoursSpecification",
            "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
            "opens": "00:00",
            "closes": "23:59",
        },
        "areaServed": [{"@type": "AdministrativeArea", "name": "San Luis Obispo County, CA"}]
        + [{"@type": "City", "name": f"{c['name']}, CA"} for c in CITIES],
        "sameAs": [YELP, GOOGLE],
    }


def jsonld_graph(extra_nodes):
    graph = [
        jsonld_business(),
        {
            "@type": "WebSite",
            "@id": f"{BASE}/#website",
            "url": f"{BASE}/",
            "name": BIZ,
            "publisher": {"@id": f"{BASE}/#business"},
        },
    ] + extra_nodes
    return json.dumps({"@context": "https://schema.org", "@graph": graph}, ensure_ascii=False)


def breadcrumbs(items):
    return {
        "@type": "BreadcrumbList",
        "itemListElement": [
            {"@type": "ListItem", "position": i + 1, "name": name, "item": f"{BASE}/{url}" if url else None}
            for i, (name, url) in enumerate(items)
        ],
    }


def faq_node(faqs):
    return {
        "@type": "FAQPage",
        "mainEntity": [
            {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}}
            for q, a in faqs
        ],
    }


NAV = [
    ("automotive.html", "Automotive"),
    ("residential.html", "Residential"),
    ("commercial.html", "Commercial"),
    ("emergency-24-7.html", "Emergency 24/7"),
    ("service-areas.html", "Service Areas"),
    ("about.html", "About"),
    ("blog.html", "Blog"),
    ("contact-us.html", "Contact"),
]


def header(active=""):
    cur = ' aria-current="page"'
    links = "".join(
        f'<li><a href="/{u}"{cur if u == active else ""}>{t}</a></li>' for u, t in NAV
    )
    return f"""<div class="topbar"><div class="wrap"><span>📍 {STREET}, {CITY_LOC}, {STATE} {ZIP}</span><span>Open 24/7 · <a href="tel:{PHONE_TEL}">{PHONE_DISPLAY}</a></span></div></div>
<header class="site"><nav class="nav wrap" aria-label="Main">
<a class="brand" href="/"><img src="/assets/img/onspot-logo.png" alt="OnSpot Locksmith 24/7 — mobile locksmith in San Luis Obispo County" height="46"></a>
<input type="checkbox" id="menu-toggle" aria-hidden="true"><label class="hamburger" for="menu-toggle" aria-label="Menu"><span></span><span></span><span></span></label>
<ul class="menu">{links}</ul>
<a class="btn btn-call" href="tel:{PHONE_TEL}">☎ {PHONE_DISPLAY}</a>
</nav></header>"""


def footer():
    top_cities = ["san-luis-obispo", "paso-robles", "atascadero", "arroyo-grande", "pismo-beach", "morro-bay", "nipomo", "los-osos"]
    city_lis = "".join(f'<li><a href="/{city_url(s)}">Locksmith in {CITY_BY_SLUG[s]["name"]}</a></li>' for s in top_cities)
    return f"""<footer class="site"><div class="wrap">
<div class="foot-grid">
<div>
<h3>{BIZ}</h3>
<p>Locally owned, owner-operated mobile locksmith serving all of San Luis Obispo County — cars, homes, and businesses, 24 hours a day.</p>
<p style="margin-top:12px">📍 {STREET}, {CITY_LOC}, {STATE} {ZIP}<br>☎ <a href="tel:{PHONE_TEL}">{PHONE_DISPLAY}</a><br>✉ <a href="mailto:{EMAIL}">{EMAIL}</a></p>
<p style="margin-top:12px"><a href="{YELP}" rel="noopener">Yelp</a> · <a href="{GOOGLE}" rel="noopener">Google</a> · <a href="{WHATSAPP}" rel="noopener">WhatsApp</a></p>
</div>
<div><h3>Services</h3><ul>
<li><a href="/automotive.html">Automotive Locksmith</a></li>
<li><a href="/residential.html">Residential Locksmith</a></li>
<li><a href="/commercial.html">Commercial Locksmith</a></li>
<li><a href="/emergency-24-7.html">Emergency 24/7</a></li>
<li><a href="/contact-us.html">Free Quote</a></li>
</ul></div>
<div><h3>Company</h3><ul>
<li><a href="/about.html">About Us</a></li>
<li><a href="/blog.html">Blog</a></li>
<li><a href="/service-areas.html">Service Areas</a></li>
<li><a href="/privacy-policy.html">Privacy Policy</a></li>
<li><a href="/terms-of-service.html">Terms of Service</a></li>
</ul></div>
<div><h3>Popular Areas</h3><ul>{city_lis}</ul></div>
</div>
<div class="foot-bottom"><span>© {YEAR} {BIZ}. All rights reserved.</span><span>Visa · Mastercard · Discover · Venmo · Cash &amp; Check accepted</span></div>
</div></footer>
<a class="callbar" href="tel:{PHONE_TEL}">☎ Locked out? Call {PHONE_DISPLAY} — Open 24/7</a>"""


def page(fname, title, desc, body, extra_nodes=None, active="", og_type="website"):
    canonical = f"{BASE}/" if fname == "index.html" else f"{BASE}/{fname}"
    ld = jsonld_graph(extra_nodes or [])
    html = f"""<!DOCTYPE html>
<html lang="en-US">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{esc(title)}</title>
<meta name="description" content="{esc(desc)}">
<link rel="canonical" href="{canonical}">
<meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1">
<meta property="og:type" content="{og_type}">
<meta property="og:url" content="{canonical}">
<meta property="og:site_name" content="{BIZ}">
<meta property="og:title" content="{esc(title)}">
<meta property="og:description" content="{esc(desc)}">
<meta property="og:image" content="{BASE}/assets/img/onspot-logo.png">
<meta name="twitter:card" content="summary">
<link rel="icon" type="image/png" href="/assets/img/onspot-logo.png">
<link rel="stylesheet" href="/assets/css/style.css">
<script type="application/ld+json">{ld}</script>
{GA_SNIPPET}
</head>
<body>
{header(active)}
<main>
{body}
</main>
{footer()}
</body>
</html>
"""
    with open(os.path.join(OUT, fname), "w", encoding="utf-8") as f:
        f.write(html)


# ------------------------------------------------------------- components --
def review_cards(reviews):
    cards = ""
    for name, ctx, text in reviews:
        cards += f"""<figure class="card review"><div class="stars" aria-label="5 out of 5 stars">★★★★★</div><p>“{esc(text)}”</p><cite>{esc(name)}<small>{esc(ctx)}</small></cite></figure>"""
    return cards


def svc_items(items):
    return "".join(f'<div class="svc-item"><h3>{esc(n)}</h3><p>{esc(d)}</p></div>' for n, d in items)


def faq_html(faqs):
    return '<div class="faq">' + "".join(
        f"<details><summary>{esc(q)}</summary><p>{esc(a)}</p></details>" for q, a in faqs
    ) + "</div>"


def city_links_grid():
    return '<ul class="city-links">' + "".join(
        f'<li><a href="/{city_url(c["slug"])}">{c["name"]}</a></li>' for c in sorted(CITIES, key=lambda x: x["name"])
    ) + "</ul>"


def cta_band(h="Locked out right now?", p="We're open 24/7 and we come to you — anywhere in San Luis Obispo County."):
    return f"""<section><div class="wrap"><div class="cta-band"><div><h2>{esc(h)}</h2><p>{esc(p)}</p></div><a class="btn btn-call" href="tel:{PHONE_TEL}">☎ Call {PHONE_DISPLAY}</a></div></div></section>"""


def areas_section(title="Locksmith Services Across San Luis Obispo County"):
    return f"""<section class="areas"><div class="wrap">
<p class="eyebrow">Service Areas</p>
<h2>{esc(title)}</h2>
<p class="lead">Fully mobile and locally based in San Luis Obispo — we cover every community in the county, 24 hours a day.</p>
{city_links_grid()}
<div class="map-card"><img src="/assets/img/slo-county-service-areas.png" alt="Map of OnSpot Locksmith service areas across San Luis Obispo County" loading="lazy" width="640" height="400" style="width:100%"></div>
</div></section>"""


# ----------------------------------------------------------------- pages --
def build_home():
    home_faqs = [
        ("How fast can you get to me?", "We're based in San Luis Obispo and fully mobile. Most calls in and around SLO see us in 15–30 minutes; North County and coastal towns are typically 30–60 minutes, 24 hours a day."),
        ("Can you make a car key if I lost all of mine?", "Yes. We cut and program keys — including smart keys, transponder keys, and fobs — for 95% of vehicles, on site. No tow to the dealership, and usually at close to half the dealer's price."),
        ("Are you available on nights, weekends, and holidays?", "Yes — OnSpot Locksmith 24/7 means exactly that. Lockouts, lost keys, and emergency rekeys are answered around the clock, every day of the year."),
        ("What areas do you serve?", "All of San Luis Obispo County: San Luis Obispo, Paso Robles, Atascadero, Arroyo Grande, Pismo Beach, Morro Bay, Los Osos, Nipomo, Cambria, and every community in between."),
        ("What payment methods do you accept?", "Visa, Mastercard, Discover, Venmo, cash, and checks."),
    ]
    body = f"""
<section class="hero"><div class="wrap">
<p class="eyebrow" style="color:var(--amber)">San Luis Obispo County · Mobile · Open 24/7</p>
<h1>24/7 Mobile Locksmith in San Luis Obispo County</h1>
<p class="sub">Locked out? Lost your car keys? We cut and program keys for 95% of vehicles — on site, day or night — plus full residential and commercial locksmith services across SLO County.</p>
<div class="cta-row"><a class="btn btn-call" href="tel:{PHONE_TEL}">☎ Call {PHONE_DISPLAY}</a><a class="btn btn-ghost" href="/contact-us.html">Get a Free Quote</a></div>
<ul class="badges"><li>✔ Open 24/7</li><li>✔ Mobile — we come to you</li><li>✔ Locally owned &amp; operated</li><li>✔ 5-star rated</li><li>✔ Car keys at ~half dealer cost</li></ul>
</div></section>

<section><div class="wrap">
<p class="eyebrow">What we do</p>
<h2>Complete Locksmith Services, Wherever You Are</h2>
<div class="grid grid-4" style="margin-top:26px">
<div class="card"><div class="icon">🚗</div><h3>Automotive</h3><p>Car lockouts, all-keys-lost replacement, smart keys, fobs, and transponders — cut and programmed at your location for 95% of vehicles.</p><a class="more" href="/automotive.html">Automotive locksmith →</a></div>
<div class="card"><div class="icon">🏠</div><h3>Residential</h3><p>Rekeying, lock installation, smart locks, repairs, and home lockouts — done by the county's most experienced residential locksmiths.</p><a class="more" href="/residential.html">Residential locksmith →</a></div>
<div class="card"><div class="icon">🏢</div><h3>Commercial</h3><p>Master key systems, access control, high-security locks, and fast rekeys that keep your business and staff secure.</p><a class="more" href="/commercial.html">Commercial locksmith →</a></div>
<div class="card"><div class="icon">🚨</div><h3>Emergency 24/7</h3><p>Locked out at 2 a.m.? We answer around the clock and typically arrive within 30 minutes to an hour anywhere in the county.</p><a class="more" href="/emergency-24-7.html">Emergency locksmith →</a></div>
</div>
</div></section>

<section style="padding-top:0"><div class="wrap">
<p class="eyebrow">Why OnSpot</p>
<h2>Why San Luis Obispo County Chooses OnSpot Locksmith</h2>
<ul class="why">
<li>Locally owned and owner-operated — you deal with the locksmith, not a call center</li>
<li>Over 5 years of experience across automotive, residential, and commercial work</li>
<li>Fully mobile workshop — keys cut and programmed on site</li>
<li>Original car keys at nearly half the dealership price</li>
<li>True 24/7 emergency availability, every day of the year</li>
<li>Upfront, honest pricing — no bait-and-switch quotes</li>
</ul>
<p style="margin-top:18px;color:var(--muted)">We service keys and locks for {CAR_BRANDS}, and hardware from Medeco, Emtek, Yale, Master Lock, SentrySafe, Von Duprin, Weslock, and more.</p>
</div></section>

<section style="padding-top:0"><div class="wrap">
<p class="eyebrow">How it works</p>
<h2>Help Is Three Steps Away</h2>
<div class="grid grid-3" style="margin-top:26px">
<div class="card step"><div class="num">1</div><h3>Call or text us</h3><p>Reach us 24/7 at {PHONE_DISPLAY}. Tell us where you are and what happened — we'll quote you upfront.</p></div>
<div class="card step"><div class="num">2</div><h3>We come to you</h3><p>Our mobile workshop heads your way immediately — typically 30 minutes to an hour anywhere in SLO County.</p></div>
<div class="card step"><div class="num">3</div><h3>Problem solved on the spot</h3><p>Keys cut and programmed, locks opened or rekeyed, hardware installed — finished in one visit, on site.</p></div>
</div>
</div></section>

<section id="reviews" style="padding-top:0"><div class="wrap">
<p class="eyebrow">Reviews</p>
<h2>5-Star Reviews From Your Neighbors</h2>
<div class="grid grid-3" style="margin-top:26px">{review_cards(REVIEWS[:6])}</div>
<p style="margin-top:20px"><a class="btn btn-navy" href="{YELP}" rel="noopener">Read more reviews</a></p>
</div></section>

{areas_section()}

<section><div class="wrap">
<p class="eyebrow">FAQ</p>
<h2>Frequently Asked Questions</h2>
{faq_html(home_faqs)}
</div></section>

{cta_band()}
"""
    page("index.html",
         "Locksmith San Luis Obispo County | 24/7 Mobile | OnSpot Locksmith",
         "24/7 mobile locksmith in San Luis Obispo County. Car keys cut & programmed on site, lockouts, rekeys, smart locks. Locally owned. Call (805) 550-3666.",
         body,
         extra_nodes=[faq_node(home_faqs), breadcrumbs([("Home", "")])],
         active="")


def service_page(fname, active, eyebrow, h1, sub, intro2_h, intro2_p, items, svc_name, faqs, title, desc, extra_html=""):
    body = f"""
<section class="hero hero-city"><div class="wrap">
<nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a> › <span>{esc(eyebrow)}</span></nav>
<h1>{esc(h1)}</h1>
<p class="sub">{sub}</p>
<div class="cta-row"><a class="btn btn-call" href="tel:{PHONE_TEL}">☎ Call {PHONE_DISPLAY}</a><a class="btn btn-ghost" href="/contact-us.html">Get a Free Quote</a></div>
<ul class="badges"><li>✔ Open 24/7</li><li>✔ Mobile — we come to you</li><li>✔ Upfront pricing</li></ul>
</div></section>

<section><div class="wrap">
<h2>{esc(intro2_h)}</h2>
<p class="lead">{intro2_p}</p>
{extra_html}
</div></section>

<section style="padding-top:0"><div class="wrap">
<p class="eyebrow">Services</p>
<h2>Our {esc(svc_name)} Services</h2>
<div class="svc-list">{svc_items(items)}</div>
</div></section>

<section style="padding-top:0"><div class="wrap">
<p class="eyebrow">FAQ</p>
<h2>{esc(svc_name)} Questions, Answered</h2>
{faq_html(faqs)}
</div></section>

{areas_section()}
{cta_band()}
"""
    nodes = [
        {
            "@type": "Service",
            "name": svc_name,
            "serviceType": svc_name,
            "provider": {"@id": f"{BASE}/#business"},
            "areaServed": {"@type": "AdministrativeArea", "name": "San Luis Obispo County, CA"},
            "url": f"{BASE}/{fname}",
        },
        faq_node(faqs),
        breadcrumbs([("Home", ""), (h1, fname)]),
    ]
    page(fname, title, desc, body, extra_nodes=nodes, active=active)


def build_services():
    service_page(
        "automotive.html", "automotive.html", "Automotive Locksmith",
        "Automotive Locksmith in San Luis Obispo County",
        f"Locked out, broken key, or all keys lost? We cut and program keys for 95% of vehicles — smart keys, transponders, and fobs — at your location, 24/7. Call <a href=\"tel:{PHONE_TEL}\" style=\"color:#fff;font-weight:700\">{PHONE_DISPLAY}</a> for same-day service.",
        "Skip the Dealership — We Come to You",
        f"From all-keys-lost replacements to fob programming and rekeyed cylinders, we carry nearly every smart key, transponder key, and fob in stock (or by the next business day) and program original keys at your location for nearly half the dealership cost. We unlock vehicles swiftly — typically within 30 minutes to an hour — and resolve most automotive jobs the same day you call. We service {CAR_BRANDS}.",
        AUTO_SERVICES, "Automotive Locksmith",
        [
            ("Can you replace my car key if I lost all of them?", "Yes — all-keys-lost replacement is one of our specialties. We cut and program a brand-new key on site for 95% of vehicles, so you don't need to tow your car to a dealer."),
            ("How much cheaper than the dealership are you?", "In most cases we program original keys at close to half of what a dealership charges — and you skip the tow and the multi-day wait."),
            ("Do you program smart keys and key fobs?", "Yes. We program smart keys, proximity keys, transponder keys, and remote fobs — including remotes with remote start — for nearly every make and model."),
            ("Can you make motorcycle keys?", "Yes — we're one of the only locksmiths on the Central Coast that cuts motorcycle keys, including from a lost-key situation."),
            ("How fast can you unlock my car?", "We typically arrive within 30 minutes to an hour anywhere in San Luis Obispo County, 24/7, and most lockouts are open within minutes of arrival."),
        ],
        "Auto Locksmith SLO County | Car Keys On Site | OnSpot Locksmith",
        "Mobile auto locksmith in San Luis Obispo County. Car lockouts, all keys lost, smart key & fob programming for 95% of vehicles — on site 24/7. (805) 550-3666.")

    service_page(
        "residential.html", "residential.html", "Residential Locksmith",
        "Residential Locksmith in San Luis Obispo County",
        f"Home lockouts, rekeying, smart locks, and repairs — handled by the county's most experienced residential locksmiths, with friendly service and honest prices. Call <a href=\"tel:{PHONE_TEL}\" style=\"color:#fff;font-weight:700\">{PHONE_DISPLAY}</a>.",
        "Your Home's Security, Handled Properly",
        "Home security is our top priority. Whether you need a professional rekey after moving in, a fresh installation of new hardware, smart locks fitted and aligned correctly, or help with systems other locksmiths refuse to work on — we do it on site, with precision and attention to detail, and back it with personalized recommendations that actually improve your home's security.",
        RES_SERVICES, "Residential Locksmith",
        [
            ("Should I rekey or replace my locks after moving in?", "Rekeying is usually the smart, budget-friendly choice: you keep your existing hardware but previous keys stop working. We'll tell you honestly if any lock is worn enough to be worth replacing instead."),
            ("Can you install smart locks?", "Yes — we install and configure electronic keypads and smart locks, and we make sure they align properly with your door and strike plate so they don't fail later."),
            ("I'm locked out of my house. Can you open it without damage?", "In almost all cases, yes. We use non-destructive entry techniques first, so you get back in without needing a new door or lock."),
            ("Do you work on rentals and Airbnbs?", "All the time. We rekey between tenants and guests, install keyless entry for self-check-in, and respond 24/7 when guests get locked out."),
        ],
        "Residential Locksmith SLO County | Rekey & Smart Locks | OnSpot",
        "Home locksmith in San Luis Obispo County: lockouts, rekeying, lock installation, smart locks, safes. Mobile, 24/7, locally owned. Call (805) 550-3666.")

    service_page(
        "commercial.html", "commercial.html", "Commercial Locksmith",
        "Commercial Locksmith in San Luis Obispo County",
        f"Master key systems, access control, high-security locks, and fast rekeys — commercial security tailored to your business. Call <a href=\"tel:{PHONE_TEL}\" style=\"color:#fff;font-weight:700\">{PHONE_DISPLAY}</a> for a free consultation.",
        "Security Your Business Can Build On",
        "We understand what's at stake in commercial security and offer tailored solutions that safeguard your assets, employees, and customers — from high-security lock installations and master key systems to advanced access control. When an employee leaves or a key goes missing, we rekey fast so yesterday's keys don't open today's doors.",
        COM_SERVICES, "Commercial Locksmith",
        [
            ("Can you set up one key that opens everything for me, but limited keys for staff?", "Yes — that's a master key system. We design them around your floor plan and staffing so owners and managers carry one key while employees only access what they need."),
            ("Do you service exit devices and panic bars?", "Yes, we install and repair commercial exit devices and panic hardware, including Von Duprin and other major commercial brands."),
            ("An employee just left with a key. How fast can you rekey?", "Same day in nearly all cases — often within hours. We're available 24/7, so after-hours rekeys before the next business day are routine."),
            ("Do you handle access control and CCTV?", "Yes — we install, maintain, and upgrade keypads, access control systems, CCTV, and alarms alongside traditional lock hardware."),
        ],
        "Commercial Locksmith SLO County | Master Keys & Access Control",
        "Commercial locksmith in San Luis Obispo County: master key systems, access control, high-security locks, rekeys, panic hardware. 24/7. (805) 550-3666.")

    service_page(
        "emergency-24-7.html", "emergency-24-7.html", "Emergency Locksmith",
        "24/7 Emergency Locksmith in San Luis Obispo County",
        f"Emergencies don't keep business hours — neither do we. Average response under an hour, anywhere in the county. Call <a href=\"tel:{PHONE_TEL}\" style=\"color:#fff;font-weight:700\">{PHONE_DISPLAY}</a> now.",
        "Round-the-Clock Help, Every Day of the Year",
        "Whether it's a car lockout on the side of Highway 101, a house lockout at midnight, or a business that can't open in the morning, we're just a phone call away — 24 hours a day, 7 days a week. We answer live, quote upfront, and our mobile workshop typically reaches you within 30 minutes to an hour anywhere in San Luis Obispo County.",
        EMERG_SERVICES, "Emergency Locksmith",
        [
            ("What's your response time for emergencies?", "Typically 30 minutes to an hour anywhere in San Luis Obispo County — often faster in and around the city of San Luis Obispo, where we're based."),
            ("Do you charge extra for nights, weekends, or holidays?", "We quote every job upfront before we head your way, so you know the price before we start — no surprises when we arrive."),
            ("Will you damage my lock or car getting me in?", "No — we use non-destructive entry techniques first. In almost all lockouts you keep your existing lock and keys."),
            ("What do I need to show you when you arrive?", "For your protection we verify you're authorized: a photo ID plus proof of ownership or residency (registration, insurance, a bill, or a lease). It takes a minute and it's how a legitimate locksmith should operate."),
        ],
        "24/7 Emergency Locksmith SLO County | Fast Lockout Help | OnSpot",
        "Emergency locksmith in San Luis Obispo County, open 24/7. Car, home & business lockouts, lost keys, urgent rekeys. Fast response. Call (805) 550-3666.")


def build_city_pages():
    for c in CITIES:
        name, slug, eta = c["name"], c["slug"], c["eta"]
        fname = city_url(slug)
        faqs = [
            (f"How fast can you get to {name}?",
             f"We're based in San Luis Obispo and fully mobile — typical arrival in {name} is {eta}, 24 hours a day, every day of the year."),
            (f"Can you make car keys on site in {name}?",
             f"Yes. Our mobile workshop cuts and programs keys — including smart keys, transponders, and fobs — for 95% of vehicles right where your car is parked in {name}. No tow required."),
            (f"Do you handle home and business locks in {name} too?",
             f"Absolutely — rekeying, lock installation and repair, smart locks, master key systems, and safes, all on site anywhere in {name} and the surrounding {c['region']} area."),
        ]
        intro_html = "".join(f"<p class=\"lead\" style=\"margin-bottom:14px;max-width:70ch\">{esc(p)}</p>" for p in c["intro"])
        nearby_links = " · ".join(
            f'<a href="/{city_url(n)}">{CITY_BY_SLUG[n]["name"]}</a>' for n in c["nearby"] if n in CITY_BY_SLUG
        )
        reviews = REVIEWS[(CITIES.index(c) * 2) % len(REVIEWS):][:2] or REVIEWS[:2]
        body = f"""
<section class="hero hero-city"><div class="wrap">
<nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a> › <a href="/service-areas.html">Service Areas</a> › <span>{esc(name)}</span></nav>
<h1>Locksmith in {esc(name)}, CA</h1>
<p class="sub">24/7 mobile locksmith serving {esc(name)} — car keys cut &amp; programmed on site, lockouts, rekeying, and full residential &amp; commercial service. Typical arrival: {esc(eta)}.</p>
<div class="cta-row"><a class="btn btn-call" href="tel:{PHONE_TEL}">☎ Call {PHONE_DISPLAY}</a><a class="btn btn-ghost" href="/contact-us.html">Get a Free Quote</a></div>
<ul class="badges"><li>✔ Open 24/7</li><li>✔ Mobile — we come to you</li><li>✔ Locally owned</li></ul>
</div></section>

<section><div class="wrap">
<p class="eyebrow">{esc(c['region'])}</p>
<h2>Your Mobile Locksmith in {esc(name)}</h2>
{intro_html}
</div></section>

<section style="padding-top:0"><div class="wrap">
<h2>Locksmith Services We Bring to {esc(name)}</h2>
<div class="grid grid-4" style="margin-top:26px">
<div class="card"><div class="icon">🚗</div><h3>Automotive</h3><p>Lockouts, all keys lost, smart keys &amp; fobs programmed on site in {esc(name)} — for 95% of vehicles.</p><a class="more" href="/automotive.html">Learn more →</a></div>
<div class="card"><div class="icon">🏠</div><h3>Residential</h3><p>Rekeys, lock installation, smart locks, and home lockout service across {esc(name)}.</p><a class="more" href="/residential.html">Learn more →</a></div>
<div class="card"><div class="icon">🏢</div><h3>Commercial</h3><p>Master keys, access control, high-security locks, and fast rekeys for {esc(name)} businesses.</p><a class="more" href="/commercial.html">Learn more →</a></div>
<div class="card"><div class="icon">🚨</div><h3>Emergency 24/7</h3><p>Locked out in {esc(name)} at any hour? We answer around the clock, every day.</p><a class="more" href="/emergency-24-7.html">Learn more →</a></div>
</div>
</div></section>

<section style="padding-top:0"><div class="wrap">
<p class="eyebrow">Reviews</p>
<h2>What Neighbors Say</h2>
<div class="grid grid-2" style="margin-top:26px">{review_cards(reviews)}</div>
</div></section>

<section style="padding-top:0"><div class="wrap">
<p class="eyebrow">FAQ</p>
<h2>Locksmith in {esc(name)} — FAQ</h2>
{faq_html(faqs)}
<p style="margin-top:22px;color:var(--muted)">Also serving nearby: {nearby_links} — <a href="/service-areas.html">all service areas</a>.</p>
</div></section>

{cta_band(f"Need a locksmith in {name} right now?", "Call anytime — we're mobile, local, and open 24/7.")}
"""
        nodes = [
            {
                "@type": "Service",
                "name": f"Locksmith services in {name}, CA",
                "serviceType": "Locksmith",
                "provider": {"@id": f"{BASE}/#business"},
                "areaServed": {"@type": "City", "name": f"{name}, CA"},
                "url": f"{BASE}/{fname}",
            },
            faq_node(faqs),
            breadcrumbs([("Home", ""), ("Service Areas", "service-areas.html"), (f"Locksmith in {name}, CA", fname)]),
        ]
        page(fname,
             f"{name} Locksmith | 24/7 Mobile | OnSpot Locksmith",
             f"24/7 mobile locksmith in {name}, CA. Car keys on site, lockouts, rekeying, smart locks. Typical arrival {eta}. Call (805) 550-3666.",
             body, extra_nodes=nodes, active="service-areas.html")


def build_service_areas():
    regions = {}
    for c in CITIES:
        regions.setdefault(c["region"], []).append(c)
    region_html = ""
    for region in ["City of San Luis Obispo", "North County", "North Coast", "South County / Coast", "South County"]:
        cities = regions.get(region)
        if not cities:
            continue
        links = "".join(f'<li><a href="/{city_url(c["slug"])}">Locksmith in {c["name"]}, CA</a></li>' for c in sorted(cities, key=lambda x: x["name"]))
        region_html += f'<div class="card"><h3>{esc(region)}</h3><ul class="city-links" style="grid-template-columns:1fr;margin-top:12px">{links}</ul></div>'
    body = f"""
<section class="hero hero-city"><div class="wrap">
<nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a> › <span>Service Areas</span></nav>
<h1>Locksmith Service Areas in San Luis Obispo County</h1>
<p class="sub">OnSpot Locksmith 24/7 is fully mobile and based in San Luis Obispo — we bring car key cutting, lockout response, and complete lock services to every community in the county, around the clock.</p>
<div class="cta-row"><a class="btn btn-call" href="tel:{PHONE_TEL}">☎ Call {PHONE_DISPLAY}</a></div>
</div></section>

<section><div class="wrap">
<h2>Every Community, Covered</h2>
<p class="lead">Pick your town for local details, typical response times, and the services we bring to your door.</p>
<div class="grid grid-2" style="margin-top:26px">{region_html}</div>
<div class="map-card"><img src="/assets/img/slo-county-service-areas.png" alt="Map of OnSpot Locksmith service areas across San Luis Obispo County" loading="lazy" width="640" height="400" style="width:100%"></div>
</div></section>

{cta_band()}
"""
    page("service-areas.html",
         "Service Areas | SLO County Mobile Locksmith | OnSpot Locksmith",
         "OnSpot Locksmith 24/7 serves every community in San Luis Obispo County — SLO, Paso Robles, Atascadero, Pismo Beach, Morro Bay & more. (805) 550-3666.",
         body,
         extra_nodes=[breadcrumbs([("Home", ""), ("Service Areas", "service-areas.html")])],
         active="service-areas.html")


def build_about():
    body = f"""
<section class="hero hero-city"><div class="wrap">
<nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a> › <span>About</span></nav>
<h1>About OnSpot Locksmith 24/7</h1>
<p class="sub">A locally owned, owner-operated mobile locksmith serving all of San Luis Obispo County.</p>
<div class="cta-row"><a class="btn btn-call" href="tel:{PHONE_TEL}">☎ Call {PHONE_DISPLAY}</a></div>
</div></section>

<section><div class="wrap">
<h2>Meet OnSpot Locksmith: Your Reliable, Experienced Local Expert</h2>
<p class="lead" style="margin-bottom:14px">Welcome to OnSpot Locksmith, where security meets passion and expertise. Founded with a vision to become one of the best locksmith companies in the county, OnSpot Locksmith is driven by a genuine passion for the locksmithing craft — from the intricate techniques to the broad range of services we provide.</p>
<p class="lead" style="margin-bottom:14px">Our founder, Ryan Nunley, brings over 5 years of hands-on experience in the locksmith industry. With a keen eye on the evolving landscape of security, we stay current with the latest techniques and technologies — so the service you get reflects how locks, keys, and vehicles actually work today, not a decade ago.</p>
<p class="lead">When you choose OnSpot Locksmith, you're choosing more than a service — you're choosing a partner dedicated to your safety and satisfaction. When you call, you talk to the locksmith who shows up: no call centers, no subcontractors, no bait-and-switch pricing.</p>
<ul class="why" style="margin-top:26px">
<li>Locally owned and owner-operated</li>
<li>Over 5 years of locksmith experience</li>
<li>Fully mobile — we come to you, county-wide</li>
<li>Automotive, residential, commercial &amp; emergency</li>
<li>Available 24/7, every day of the year</li>
<li>Honest, upfront pricing</li>
</ul>
</div></section>

<section style="padding-top:0" id="reviews"><div class="wrap">
<p class="eyebrow">Reviews</p>
<h2>What Our Clients Say</h2>
<div class="grid grid-3" style="margin-top:26px">{review_cards(REVIEWS)}</div>
</div></section>

{areas_section()}
{cta_band("Ready when you need us.", "Get a free quote or talk directly with your local locksmith.")}
"""
    page("about.html",
         "About Us | OnSpot Locksmith 24/7 | San Luis Obispo County",
         "Meet OnSpot Locksmith 24/7 — locally owned, owner-operated mobile locksmith led by Ryan Nunley, serving San Luis Obispo County. (805) 550-3666.",
         body,
         extra_nodes=[breadcrumbs([("Home", ""), ("About", "about.html")])],
         active="about.html")


def build_contact():
    body = f"""
<section class="hero hero-city"><div class="wrap">
<nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a> › <span>Contact</span></nav>
<h1>Contact OnSpot Locksmith 24/7</h1>
<p class="sub">Fastest response: call or text <a href="tel:{PHONE_TEL}" style="color:#fff;font-weight:700">{PHONE_DISPLAY}</a> — we answer 24/7. Prefer email? Use the form below for a free quote.</p>
<div class="cta-row"><a class="btn btn-call" href="tel:{PHONE_TEL}">☎ Call {PHONE_DISPLAY}</a><a class="btn btn-ghost" href="{WHATSAPP}" rel="noopener">WhatsApp Us</a></div>
</div></section>

<section><div class="wrap">
<div class="grid grid-2">
<div class="card">
<h2>Get Your Free Quote</h2>
<form action="https://formsubmit.co/{EMAIL}" method="POST">
<input type="hidden" name="_subject" value="Quote request from onspotlocksmith.com">
<input type="text" name="_honey" style="display:none" tabindex="-1" autocomplete="off">
<div class="row">
<div><label for="f-name">Name</label><input id="f-name" name="name" type="text" required autocomplete="name"></div>
<div><label for="f-phone">Phone</label><input id="f-phone" name="phone" type="tel" required autocomplete="tel"></div>
</div>
<label for="f-email">Email</label><input id="f-email" name="email" type="email" autocomplete="email">
<label for="f-loc">Your location (city)</label><input id="f-loc" name="city" type="text" placeholder="e.g. Paso Robles">
<label for="f-svc">What do you need?</label>
<select id="f-svc" name="service">
<option>Car lockout / lost car keys</option>
<option>Car key or fob copy</option>
<option>Home lockout</option>
<option>Rekey / change locks</option>
<option>Smart lock installation</option>
<option>Commercial / business</option>
<option>Safe opening</option>
<option>Other</option>
</select>
<label for="f-msg">Details</label><textarea id="f-msg" name="message" rows="4" placeholder="Year/make/model if it's a car job, and anything else we should know."></textarea>
<button class="btn btn-call" type="submit" style="border:0;width:100%;cursor:pointer">Request Free Quote</button>
</form>
</div>
<div>
<div class="card" style="margin-bottom:20px">
<h3>Reach Us Directly</h3>
<p style="margin-top:10px">☎ <a href="tel:{PHONE_TEL}"><b>{PHONE_DISPLAY}</b></a> — call or text, 24/7<br>
✉ <a href="mailto:{EMAIL}">{EMAIL}</a><br>
💬 <a href="{WHATSAPP}" rel="noopener">WhatsApp</a></p>
<p style="margin-top:12px;color:var(--muted)">📍 {STREET}, {CITY_LOC}, {STATE} {ZIP}<br>Mobile service — we come to you anywhere in San Luis Obispo County.</p>
<p style="margin-top:12px;color:var(--muted)"><b>Hours:</b> Open 24 hours, 7 days a week</p>
</div>
<div class="card">
<h3>Payments Accepted</h3>
<p style="margin-top:8px;color:var(--muted)">Visa · Mastercard · Discover · Venmo · Cash · Check</p>
</div>
</div>
</div>
</div></section>

{cta_band()}
"""
    page("contact-us.html",
         "Contact Us | 24/7 Locksmith SLO County | OnSpot Locksmith",
         "Call or text OnSpot Locksmith 24/7 at (805) 550-3666 — open around the clock in San Luis Obispo County. Or request a free quote online.",
         body,
         extra_nodes=[breadcrumbs([("Home", ""), ("Contact", "contact-us.html")])],
         active="contact-us.html")


def build_blog():
    meta = json.load(open(os.path.join(DATA, "blog", "_meta.json"), encoding="utf-8"))
    # newest first
    def sort_key(item):
        from datetime import datetime
        try:
            return datetime.strptime(item[1]["date"], "%B %d, %Y")
        except ValueError:
            return datetime.min
    posts = sorted(meta.items(), key=sort_key, reverse=True)

    cards = ""
    for slug, m in posts:
        cards += f"""<div class="card post-card"><p class="post-meta">{esc(m['date'])}</p><h3><a href="/{slug}.html">{esc(m['title'])}</a></h3><p>{esc(m['description'])}</p><a class="more" href="/{slug}.html">Read more →</a></div>"""
    body = f"""
<section class="hero hero-city"><div class="wrap">
<nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a> › <span>Blog</span></nav>
<h1>Locksmith Tips &amp; Local Advice</h1>
<p class="sub">Practical security advice from your local San Luis Obispo County locksmith — lockouts, car keys, smart locks, and how to avoid locksmith scams.</p>
</div></section>
<section><div class="wrap"><div class="grid grid-2">{cards}</div></div></section>
{cta_band()}
"""
    page("blog.html",
         "Locksmith Tips & Advice | OnSpot Locksmith Blog",
         "Locksmith tips from San Luis Obispo County: handling lockouts, car key replacement, smart locks, and avoiding locksmith scams on Google.",
         body,
         extra_nodes=[breadcrumbs([("Home", ""), ("Blog", "blog.html")])],
         active="blog.html")

    for slug, m in posts:
        content = open(os.path.join(DATA, "blog", f"{slug}.html"), encoding="utf-8").read()
        body = f"""
<section class="hero hero-city"><div class="wrap">
<nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a> › <a href="/blog.html">Blog</a> › <span>{esc(m['title'][:48])}…</span></nav>
<h1>{esc(m['title'])}</h1>
<p class="sub">{esc(m['date'])} · OnSpot Locksmith</p>
</div></section>
<section><div class="wrap"><article class="article">{content}</article></div></section>
{cta_band()}
"""
        from datetime import datetime
        try:
            iso = datetime.strptime(m["date"], "%B %d, %Y").date().isoformat()
        except ValueError:
            iso = ""
        nodes = [
            {
                "@type": "BlogPosting",
                "headline": m["title"],
                "description": m["description"],
                "datePublished": iso,
                "author": {"@type": "Organization", "name": BIZ},
                "publisher": {"@id": f"{BASE}/#business"},
                "mainEntityOfPage": f"{BASE}/{slug}.html",
            },
            breadcrumbs([("Home", ""), ("Blog", "blog.html"), (m["title"], f"{slug}.html")]),
        ]
        page(f"{slug}.html", m["seo_title"], m["description"], body, extra_nodes=nodes, active="blog.html", og_type="article")


def build_legal():
    for slug, title, desc in [
        ("privacy-policy", "Privacy Policy | OnSpot Locksmith",
         "How OnSpot Locksmith collects, uses, and protects your information when you use our website or locksmith services in San Luis Obispo County."),
        ("terms-of-service", "Terms of Service | OnSpot Locksmith",
         "The terms governing use of the OnSpot Locksmith website and our mobile locksmith services in San Luis Obispo County, California."),
    ]:
        content = open(os.path.join(DATA, f"{slug}.html"), encoding="utf-8").read()
        h1 = "Privacy Policy" if slug == "privacy-policy" else "Terms of Service"
        body = f"""
<section class="hero hero-city"><div class="wrap">
<nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a> › <span>{h1}</span></nav>
<h1>{h1}</h1>
</div></section>
<section><div class="wrap"><article class="article">{content}</article></div></section>
"""
        page(f"{slug}.html", title, desc, body,
             extra_nodes=[breadcrumbs([("Home", ""), (h1, f"{slug}.html")])])


def build_meta_files():
    pages = ["", "automotive.html", "residential.html", "commercial.html", "emergency-24-7.html",
             "service-areas.html", "about.html", "contact-us.html", "blog.html",
             "privacy-policy.html", "terms-of-service.html"]
    pages += [city_url(c["slug"]) for c in CITIES]
    meta = json.load(open(os.path.join(DATA, "blog", "_meta.json"), encoding="utf-8"))
    pages += [f"{slug}.html" for slug in meta]
    today = date.today().isoformat()

    def prio(p):
        if p == "":
            return "1.0"
        if p.startswith("locksmith-") or p in ("automotive.html", "residential.html", "commercial.html", "emergency-24-7.html"):
            return "0.8"
        if p in ("privacy-policy.html", "terms-of-service.html"):
            return "0.3"
        return "0.6"

    urls = "".join(
        f"  <url><loc>{BASE}/{p}</loc><lastmod>{today}</lastmod><changefreq>monthly</changefreq><priority>{prio(p)}</priority></url>\n"
        for p in pages
    )
    with open(os.path.join(OUT, "sitemap.xml"), "w", encoding="utf-8") as f:
        f.write(f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n{urls}</urlset>\n')

    with open(os.path.join(OUT, "robots.txt"), "w", encoding="utf-8") as f:
        f.write(f"User-agent: *\nAllow: /\n\nSitemap: {BASE}/sitemap.xml\n")

    # .htaccess: https + non-www + 301s from every legacy URL
    lines = [
        "RewriteEngine On",
        "",
        "# Force HTTPS and non-www",
        "RewriteCond %{HTTPS} off [OR]",
        "RewriteCond %{HTTP_HOST} ^www\\. [NC]",
        "RewriteCond %{HTTP_HOST} ^(?:www\\.)?(.+)$ [NC]",
        "RewriteRule ^ https://%1%{REQUEST_URI} [R=301,L]",
        "",
        "# Legacy WordPress-style directory URLs -> flat pages",
        "RewriteRule ^(about|blog|automotive|residential|commercial|emergency-24-7|service-areas|contact-us)/?$ /$1.html [R=301,L]",
        "",
        "# Consolidated city page URLs (old inconsistent patterns -> locksmith-<city>-ca.html)",
    ]
    for c in CITIES:
        for old in c["old"]:
            lines.append(f"Redirect 301 /{old} /{city_url(c['slug'])}")
    lines.append("")
    lines.append("# Thin category archives -> blog")
    for old, new in EXTRA_REDIRECTS.items():
        lines.append(f"Redirect 301 /{old} /{new}")
    lines += [
        "",
        "# Canonical hygiene",
        "Redirect 301 /index.html /",
        "",
        "# Caching & compression",
        "<IfModule mod_expires.c>",
        "ExpiresActive On",
        'ExpiresByType image/png "access plus 30 days"',
        'ExpiresByType image/webp "access plus 30 days"',
        'ExpiresByType text/css "access plus 7 days"',
        "</IfModule>",
        "AddDefaultCharset utf-8",
    ]
    with open(os.path.join(OUT, ".htaccess"), "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")


def main():
    if os.path.isdir(OUT):
        shutil.rmtree(OUT)
    os.makedirs(OUT)
    shutil.copytree(os.path.join(ROOT, "static", "assets"), os.path.join(OUT, "assets"))
    build_home()
    build_services()
    build_city_pages()
    build_service_areas()
    build_about()
    build_contact()
    build_blog()
    build_legal()
    build_meta_files()
    n = len([f for f in os.listdir(OUT) if f.endswith(".html")])
    print(f"Built {n} pages into {OUT}")


if __name__ == "__main__":
    main()
