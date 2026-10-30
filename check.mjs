import assert from 'node:assert/strict';
import {GAMES,route,gameURL,filteredGames} from './games.mjs';
import {ART,HERO} from './art.mjs';
import {zh,en} from './i18n.mjs';
assert.equal(GAMES.length,7);assert.equal(new Set(GAMES.map(g=>g.id)).size,7);
assert.deepEqual(Object.keys(zh).sort(),Object.keys(en).sort());
for(const g of GAMES){assert.equal(route(`#play/${g.id}`),g.id);const url=new URL(gameURL(g.id));assert.equal(url.origin,'https://liuyanstone.github.io');assert.equal(url.pathname,`/${g.id}/`);assert.ok(ART[g.id].includes('<svg'));for(const key of ['name','description','detail','tag'])for(const lang of ['zh','en'])assert.ok(g[key][lang]);}
for(const invalid of ['','#games','#play/unknown','#play/https://evil.com','#play/../koi-pond','#play/koi-pond?other=1'])assert.equal(route(invalid),null);
assert.throws(()=>gameURL('unknown'));assert.ok(HERO.includes('<svg'));
assert.deepEqual(new Set(['memory','orientation','thinking','relax'].flatMap(c=>filteredGames(c).map(g=>g.id))),new Set(GAMES.map(g=>g.id)));
console.log('Seven games, bilingual content, categories and safe routes verified.');
