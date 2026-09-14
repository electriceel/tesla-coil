/* The blank cross-reference matcher, read out of app.js at test time rather
   than copied. A copy would drift the moment someone edits one and not the
   other, and the whole point of the cross-link check is that it tests what the
   app actually does.

   The stoplist was shared this way from the start. The tokenizer was not, and
   it drifted exactly as predicted: the tests filtered single characters, app.js
   never did, so the E in "Schlage 101-E-LFIC" matched the E in Can-Am's
   "D.E.S.S." and hung a commercial mortise blank on a Sea-Doo for four PRs
   without a single test noticing. Both halves come from app.js now. */
const fs = require('fs');
const path = require('path');

const src = fs.readFileSync(path.join(__dirname, '../assets/js/app.js'), 'utf8');

const sm = src.match(/const KEY_STOPWORDS = new Set\(\[([\s\S]*?)\]\);/);
if (!sm) throw new Error('KEY_STOPWORDS not found in app.js — the cross-link test cannot run');
const words = sm[1].match(/'([A-Z]+)'/g) || [];
if (words.length < 20) throw new Error('KEY_STOPWORDS parsed as only ' + words.length + ' words');
const KEY_STOPWORDS = new Set(words.map(w => w.slice(1, -1)));

/* Lift app.js's own tokenizer and run it, so the tests cannot disagree with
   the shipped one about what counts as a word. */
const km = src.match(/const keyWords = \(s\) =>([\s\S]*?);\n/);
if (!km) throw new Error('keyWords not found in app.js — the cross-link test cannot run');
const keyWords = new Function('KEY_STOPWORDS', 'return (s) =>' + km[1] + ';')(KEY_STOPWORDS);

/* Prove the lifted function behaves before any test leans on it. */
if (keyWords('D.E.S.S.').length) {
  throw new Error('app.js keyWords still yields single characters: ' + JSON.stringify(keyWords('D.E.S.S.')));
}
if (!keyWords('TOY48 laser').includes('TOY48')) {
  throw new Error('app.js keyWords dropped a real keyway token');
}

module.exports = KEY_STOPWORDS;
module.exports.STOP = KEY_STOPWORDS;
module.exports.keyWords = keyWords;
