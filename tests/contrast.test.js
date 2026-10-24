/* The stylesheet opens by promising a screen "readable in a driveway at noon"
   with "no ornament that costs legibility". It was not keeping that promise:
   --fg3, the grey that carries every count, caption and section heading, sat
   at 3.87:1 on dark and 3.6:1 on light, under the 4.5:1 WCAG AA needs for text
   this size. Nothing caught it because contrast is a property of a PAIR, and
   no file holds the pair -- the colour is in :root and the backdrop is picked
   by whichever card the text lands in.

   So the pairs are enumerated here. Each row is a foreground token that is
   really used as text, times every surface it can legitimately sit on. A
   quieter grey is a reasonable-looking one-character edit, which is exactly
   how the last one got in. */
const fs = require('fs');
const path = require('path');
const css = fs.readFileSync(path.join(__dirname, '..', 'assets/css/app.css'), 'utf8');

let fail = 0;
const check = (name, ok, detail) => {
  if (ok) { console.log('  ok  ' + name); return; }
  console.log('FAIL ' + name + (detail ? '\n     ' + detail : ''));
  fail++;
};

/* ---- read the tokens straight out of the stylesheet ----
   Parsed rather than copied, so the test cannot drift away from the file it
   is guarding. The print block redefines the same names and must not be read
   as a theme, so blocks are taken by selector, not by order. */
const block = (sel) => {
  const i = css.indexOf(sel + '{');
  if (i < 0) throw new Error('no ' + sel + ' block in app.css');
  return css.slice(i, css.indexOf('}', i));
};
const tokens = (sel) => {
  const out = {};
  for (const m of block(sel).matchAll(/(--[a-z0-9-]+)\s*:\s*(#[0-9a-f]{3,8})/gi)) out[m[1]] = m[2];
  return out;
};
const DARK = tokens(':root');
const LIGHT = { ...DARK, ...tokens('[data-theme="light"]') };

/* #rrggbbaa is legal and the tokens use it -- --acc-soft is amber at 12%.
   Reading only the first six digits turns a whisper into a solid colour, and
   that is exactly how the faint focus ring passed this file's first draft. */
const rgba = (h) => {
  h = h.replace('#', '');
  if (h.length === 3 || h.length === 4) h = [...h].map((c) => c + c).join('');
  const n = [0, 2, 4].map((i) => parseInt(h.substr(i, 2), 16));
  return { c: n, a: h.length === 8 ? parseInt(h.substr(6, 2), 16) / 255 : 1 };
};
/* what the eye actually sees: the colour painted onto its backdrop */
const flatten = (fg, bg) => {
  const f = rgba(fg), b = rgba(bg);
  return f.c.map((x, i) => x * f.a + b.c[i] * (1 - f.a));
};
const rgb = (h) => rgba(h).c;
const lum = (c) => {
  const f = (x) => { x /= 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); };
  return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]);
};
const ratio = (a, b) => {
  const [l1, l2] = [lum(flatten(a, b)), lum(rgb(b))];
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
};
const r2 = (n) => Math.round(n * 100) / 100;

/* Every surface that actually carries text. --surface3 is reserved and unused,
   so pairing text against it would constrain the greys for no one -- but the
   moment it IS used the list below is wrong, so that is asserted, not assumed.
   --surface2 is the binding one: inputs and .grp-body sit on it. */
const SURFACES = ['--bg', '--surface', '--surface2'];
check('--surface3 is still unused, so it is fair to leave it out above',
  !/var\(--surface3\)/.test(css),
  'something now paints --surface3; add it to SURFACES and re-check the greys');

/* 4.5:1 is the AA floor for text under 18.66px bold / 24px regular, and every
   one of these is used below that size. --hint is the row chevron: a glyph
   that signals "this opens", judged by the 3:1 non-text rule instead. */
const TEXT = ['--fg', '--fg2', '--fg3'];

for (const [name, T] of [['dark', DARK], ['light', LIGHT]]) {
  const bad = [];
  for (const fg of TEXT) {
    for (const bg of SURFACES) {
      const got = ratio(T[fg], T[bg]);
      if (got < 4.5) bad.push(`${fg} ${T[fg]} on ${bg} ${T[bg]} = ${r2(got)}:1`);
    }
  }
  check(`${name}: every text grey clears 4.5:1 on every surface`, !bad.length, bad.join('\n     '));

  const hintBad = SURFACES
    .map((bg) => [bg, ratio(T['--hint'], T[bg])])
    .filter(([, got]) => got < 3)
    .map(([bg, got]) => `--hint ${T['--hint']} on ${bg} ${T[bg]} = ${r2(got)}:1`);
  check(`${name}: the row chevron clears 3:1`, !hintBad.length, hintBad.join('\n     '));
}

/* The ramp has to stay a ramp. Raising --fg3 to pass contrast is only correct
   while it is still visibly quieter than --fg2; push it far enough and the
   three tiers collapse into one and the layout loses its hierarchy. */
for (const [name, T] of [['dark', DARK], ['light', LIGHT]]) {
  const [f1, f2, f3] = ['--fg', '--fg2', '--fg3'].map((k) => ratio(T[k], T['--surface']));
  check(`${name}: --fg > --fg2 > --fg3 is still a visible ramp`,
    f1 > f2 * 1.25 && f2 > f3 * 1.25,
    `on --surface: fg ${r2(f1)}:1, fg2 ${r2(f2)}:1, fg3 ${r2(f3)}:1`);
}

/* The focus ring is the only thing a keyboard user has to go on. It spent a
   while at 12% amber -- 1.2:1 against the page, which is not a ring, it is a
   rumour. Measured as a solid colour because that is what it now is. */
const ringColor = (/--ring:[^;]*?(var\(--[a-z0-9-]+\)|#[0-9a-f]{3,8})/i.exec(css) || [])[1];
check('the focus ring is defined', !!ringColor, 'no --ring in :root');
if (ringColor) {
  const tok = /var\((--[a-z0-9-]+)\)/.exec(ringColor);
  for (const [name, T] of [['dark', DARK], ['light', LIGHT]]) {
    const hex = tok ? T[tok[1]] : ringColor;
    check(`${name}: the focus ring is visible against the page`,
      !!hex && ratio(hex, T['--bg']) >= 3,
      hex ? `${hex} on ${T['--bg']} = ${r2(ratio(hex, T['--bg']))}:1` : `cannot resolve ${ringColor}`);
  }
}

/* ---- progressive enhancement ----
   color-mix() is Safari 16.2+. A declaration the browser cannot parse is
   dropped, and .top is sticky, so on an older iPhone a header with no fallback
   is a transparent strip that the list scrolls straight through. Any element
   whose BACKGROUND is a color-mix needs a plain colour on the line before. */
const mixBg = [];
for (const m of css.matchAll(/([^{}]+)\{([^{}]*background\s*:\s*color-mix[^{}]*)\}/g)) {
  const sel = m[1].trim().split('\n').pop().trim();
  const body = m[2];
  const decls = body.split(';').map((d) => d.trim()).filter(Boolean);
  const i = decls.findIndex((d) => /^background\s*:\s*color-mix/.test(d));
  const before = decls.slice(0, i).reverse().find((d) => /^background\s*:/.test(d));
  if (!before) mixBg.push(sel);
}
check('a color-mix background has a plain fallback before it', !mixBg.length, mixBg.join(', '));

/* ---- print ----
   A quote is how the app talks to a customer, and it leaves through the
   browser's print dialog. Without this block it printed a near-white title
   onto white paper with the bottom tab bar stamped under the total. */
check('there is a print stylesheet', /@media\s+print\s*\{/.test(css));
check('print hides the bottom nav', /@media\s+print[\s\S]*?\.nav[^{]*\{[^}]*display\s*:\s*none/.test(css));
check('print forces ink on white', /@media\s+print[\s\S]*?--fg\s*:\s*#000/.test(css));

console.log(fail ? `\n${fail} contrast check(s) failed` : '\nall contrast checks passed');
process.exit(fail ? 1 : 0);
