/* The blank cross-reference stoplist, read out of app.js at test time rather
   than copied. A copy would drift the moment someone edits one and not the
   other, and the whole point of the cross-link check is that it tests what the
   app actually does. */
const fs = require('fs');
const path = require('path');

const src = fs.readFileSync(path.join(__dirname, '../assets/js/app.js'), 'utf8');
const m = src.match(/const KEY_STOPWORDS = new Set\(\[([\s\S]*?)\]\);/);
if (!m) throw new Error('KEY_STOPWORDS not found in app.js — the cross-link test cannot run');

const words = m[1].match(/'([A-Z]+)'/g) || [];
if (words.length < 20) throw new Error('KEY_STOPWORDS parsed as only ' + words.length + ' words');

module.exports = new Set(words.map(w => w.slice(1, -1)));
