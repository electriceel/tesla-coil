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
2. The old `/assets/vendor/...` WordPress files are no longer referenced and
   can be deleted whenever convenient.
3. In [Google Search Console](https://search.google.com/search-console),
   submit `https://onspotlocksmith.com/sitemap.xml` and request re-indexing
   of the homepage.
4. Spot-check a few old URLs (e.g. `/service-areas-nipomo.html`) to confirm
   they 301 to the new pages.

> **Check before you overwrite.** The live site has been edited outside this
> repo — as of August 2026 it serves content-hashed asset filenames
> (`style.<hash>.css`) and a hero image that `build.py` here does not
> generate. Diff the live pages against a fresh `site/` build before
> uploading everything, or change only what you need to — a missing redirect
> is fixed by adding its one `Redirect 301` line to the live `.htaccess`,
> without replacing the rest of the file.

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
