# onspotlocksmith.com — SEO restructure

A full rebuild of onspotlocksmith.com as a fast, hand-rolled static site,
restructured to rank for local searches across San Luis Obispo County.

## What's in here

| Path | What it is |
|---|---|
| `site/` | **The finished website.** Upload the *contents* of this folder to the web root (where the current `index.html` lives). |
| `build.py` | Regenerates `site/` from the data below. `python3 build.py` — no dependencies, stdlib only. |
| `data/blog/` | The 7 blog posts (content carried over from the live site) + `_meta.json`. |
| `data/privacy-policy.html`, `data/terms-of-service.html` | Legal page bodies (carried over). |
| `static/` | CSS and images copied verbatim into `site/assets/`. |

To change copy, prices, cities, reviews, or services: edit `build.py` (or the
files in `data/`) and re-run `python3 build.py`.

## What changed and why

### 1. One consistent URL pattern for city pages (the big fix)
The old site had **five different URL patterns** for city pages
(`adelaide-ca.html`, `arroyo-grande-ca-locksmith-services.html`,
`premier-locksmith-services-in-cambria-ca.html`,
`your-trusted-locksmith-partner-in-grover-beach-ca.html`,
`service-areas-nipomo.html`). Search engines read URL patterns as structure;
this looked like five unrelated page types.

Now every city lives at **`/locksmith-<city>-ca.html`** (23 pages, one per
community), each with unique local copy, response-time info, FAQs with
FAQ schema, reviews, and internal links to nearby cities. The included
`.htaccess` 301-redirects every old URL to its new home so existing rankings
and backlinks carry over.

### 2. Real LocalBusiness structured data
The old site only had `WebSite` schema. Every page now carries a full
`Locksmith` (LocalBusiness) JSON-LD node: NAP (name/address/phone), geo
coordinates, 24/7 opening hours, payment methods, Yelp/Google profiles, and
`areaServed` listing the county and all 23 communities — this is what feeds
the Google map pack. Service pages add `Service` schema, city and service
pages add `FAQPage` schema (eligible for FAQ rich results), blog posts add
`BlogPosting`, and all subpages add `BreadcrumbList`.

### 3. County-targeted titles and headings
Old titles targeted generic "near me" phrases ("Mobile Locksmith Near Me")
and H1s were single words ("About", "Automotive"). New pages target what
people in the county actually search:

- Home: **Locksmith San Luis Obispo County | 24/7 Mobile | OnSpot Locksmith**
- Services: "Automotive Locksmith in San Luis Obispo County", etc.
- Cities: "Paso Robles Locksmith | 24/7 Mobile | OnSpot Locksmith", etc.

Every page has a unique title, meta description, canonical URL, and exactly
one keyword-rich H1. (The old privacy/terms pages had the contact page's
meta tags copy-pasted — fixed.)

### 4. Speed
The old pages loaded ~500 KB of WordPress/Divi CSS and a dozen JS bundles.
The new site is one 10 KB stylesheet, no JavaScript except your existing
Google Analytics/Ads tracking (kept as-is, including call-click conversion
tracking). This matters for Core Web Vitals, a ranking factor — and for
someone standing in a parking lot on 3G trying to call you.

### 5. Conversion-focused design
Modern navy/amber design with: click-to-call buttons everywhere, a sticky
call bar on mobile, trust badges, the 12 five-star reviews with context
labels, a "how it works" section, per-city response times, and a working
quote form (same formsubmit.co backend as before, plus a honeypot spam trap).

### 6. Cleanup
- `sitemap.xml` regenerated for the new structure; `robots.txt` kept.
- Thin `category-*.html` archive pages 301 to the blog.
- `.htaccess` forces HTTPS + non-www and redirects `/index.html` → `/`.
- All 7 blog posts kept at their original URLs (they target good long-tail
  keywords) with cleaned-up markup.

## Reconciled with the live site (August 2026)

The live site had been edited outside this repo for a while, so `build.py` was
brought back up to what is actually deployed. Folded in here:

| Change | Where it lives now |
|---|---|
| Adelaide → **Adelaida**, with the old URL redirected | `CITIES` |
| BSIS licence LCO7813, insured & bonded — footer, badges, schema | `LICENSE`, `jsonld_business()` |
| Address 1014 Railroad Avenue, `ryan@` email, text/SMS links | constants at the top |
| Google (map profile), Facebook and BBB profiles | `GOOGLE`, `FACEBOOK`, `BBB` |
| "OnSpot Locksmith Inc." wordmark + SLO Car & Key banner, skip link | `header()` |
| Content-hashed asset filenames (`style.<hash>.css`) | `copy_assets()` |
| `WebPage` schema per page, addressable FAQ answers, connected `@id`s | `page_nodes()` |
| Extra local sections and FAQs for five cities | `local=` / `faqs=` in `CITIES` |
| Rewritten service-page FAQs and home-page review counts | `build_services()`, `build_home()` |
| `/thank-you.html` (form landing page, where the Ads conversion fires) | `build_thank_you()` |
| `/404.html` + `ErrorDocument` | `build_404()` |
| The August 22 blog post, updated legal pages | `data/` |

## Never let a live URL start 404ing

Every URL that has been live is a URL Google has indexed and other sites may
link to. Renaming or deleting a page without a 301 turns it into a
`Not found (404)` in Search Console and throws away its rankings.

That is what happened to `/locksmith-adelaide-ca.html` when the city was
respelled Adelaida: the legacy WordPress URLs were repointed at the new file,
but the page's own previous URL was left to 404. It now 301s to
`/locksmith-adelaida-ca.html`.

So whenever a page's filename changes:

1. Add the **old filename** to that city's `old=[...]` list in `build.py`
   (or to `EXTRA_REDIRECTS` for non-city pages) — that is what generates the
   `Redirect 301` line in `.htaccess`.
2. Rebuild and confirm the old URL 301s to a page that returns 200:

   ```
   curl -sI https://onspotlocksmith.com/<old-url> | head -1
   ```

3. Check nothing still links to the old URL. `build.py` rewrites legacy links
   inside imported blog and legal copy automatically (`rewrite_legacy_links`),
   so imported content points straight at current URLs rather than relying on
   a redirect.

Unknown URLs fall through to `/404.html` (`noindex, follow`, with links back
into the site) via `ErrorDocument 404`.

## Deploying

1. Upload the **contents** of `site/` (including the hidden `.htaccess`) to
   the web root, replacing the old files.
2. Assets are written twice: `style.<hash>.css` (what the pages link to, safe
   to cache forever) and the plain `style.css` name for anything still
   pointing at it. The old `/assets/vendor/...` WordPress files are no longer
   referenced and can be deleted whenever convenient.
3. In [Google Search Console](https://search.google.com/search-console),
   submit `https://onspotlocksmith.com/sitemap.xml` and request re-indexing
   of the homepage.
4. Spot-check a few old URLs (e.g. `/service-areas-nipomo.html`) to confirm
   they 301 to the new pages.

### Verifying a build against the live site

`site/` is generated from `build.py` and, as of August 24 2026, reproduces
onspotlocksmith.com byte for byte apart from four deliberate differences:

- `/locksmith-adelaide-ca.html` now 301s to the Adelaida page instead of 404ing;
- imported blog copy links straight to current URLs instead of retired ones;
- the contact hero has one button row (call / text / WhatsApp) where the
  deployed page repeats the call button in a second row;
- `dateModified` / `lastmod` carry the date of the build, not of the last deploy.

To re-check that after editing, mirror the live pages and diff them:

```
mkdir -p /tmp/live && cd /tmp/live
curl -s https://onspotlocksmith.com/sitemap.xml \
  | grep -o '<loc>[^<]*' | sed 's/<loc>//' \
  | while read u; do curl -s "$u" -o "$(basename "${u%/}" | sed 's/^onspotlocksmith.com$/index.html/')"; done
for f in *.html; do diff <(sed 's/></>\n</g' "$f") \
  <(sed 's/></>\n</g' /path/to/onspotlocksmith/site/"$f"); done
```

Anything else that shows up is drift: someone edited the live site directly,
and that edit needs to come back into `build.py` (or `data/`) before the next
deploy overwrites it.

## Retiring lockmyth.com into this site

`lockmyth.com` still resolves, but its DNS points at a Thryv/Duda account with
nothing published, so every URL on it returns a "SITE NOT FOUND" page. The old
brand is still in circulation (the Facebook page is `facebook.com/LockMyth`),
so that traffic is being thrown away.

`build.py` generates `redirects/lockmyth.com/` — a `.htaccess` that 301s the
whole domain here, plus a meta-refresh `index.html` for the case where the
rewrite rules never run. The rules have to live in **that domain's own
document root**, not in the main site's `.htaccess`, because the main vhost
never sees requests for a domain pointed somewhere else.

Routing, in order: a path that exists here keeps its page
(`lockmyth.com/automotive.html` → `onspotlocksmith.com/automotive.html`); a
handful of extensionless paths the old site plausibly used are mapped to their
nearest equivalent (`/contact` → `/contact-us.html`); everything else lands on
the home page. The old URL structure could not be recovered — archive.org has
no usable listing for it — so that catch-all is doing most of the work.

To put it in place:

1. **DNS** — at the registrar for `lockmyth.com`, point the domain at the same
   host as this site (the nameservers or A record cPanel shows for
   `onspotlocksmith.com`). This is the step that takes it away from Thryv.
2. **cPanel → Domains → Create A New Domain** — add `lockmyth.com` with its own
   document root, e.g. `public_html/lockmyth.com`. Do **not** point it at the
   main `public_html`; the redirect rules would then apply to the live site.
3. **Upload** the contents of `redirects/lockmyth.com/` (both files — turn on
   "Show Hidden Files" so `.htaccess` is visible) into that document root.
4. **SSL** — run cPanel's AutoSSL for the new domain. Without a certificate,
   `https://lockmyth.com` throws a browser warning *before* the redirect can
   fire, which defeats the point.
5. **Verify**:

   ```
   curl -sI https://lockmyth.com/            | head -2   # 301 -> onspotlocksmith.com/
   curl -sI https://lockmyth.com/automotive.html | head -2   # 301 -> /automotive.html
   curl -sI https://www.lockmyth.com/contact | head -2   # 301 -> /contact-us.html
   ```

Optionally, verify `lockmyth.com` in Search Console afterwards and use **Change
of Address** to tell Google the move is permanent — it needs both properties
verified and the 301s already live.

## Beyond the website

The site is now technically solid, but for map-pack rankings in a local
market these matter just as much:

- **Google Business Profile**: keep categories, hours, and service area in
  sync with the site; post photos of real jobs regularly.
- **Reviews**: keep asking happy customers for Google reviews and mention
  their city in your replies ("Glad we could get you back into your car in
  Atascadero!").
- **Citations**: make sure name/address/phone are identical on Yelp, BBB,
  Nextdoor, and local directories.
