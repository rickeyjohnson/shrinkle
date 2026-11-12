// Logic tests for shrinkle.html: evaluates the pure data + logic slice of the game script in Node.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

function load() {
  const html = readFileSync(fileURLToPath(new URL('../shrinkle.html', import.meta.url)), 'utf8');
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
  const game = scripts[scripts.length - 1][1];
  const code = game.split('/* ============================== SOUND')[0];
  return new Function(code + ';return {CATS,LISTS,typoDist,matchAnswer,norm}')();
}
const T = load();
const cat = (label) => {
  const c = T.CATS.find((x) => x.label === label);
  if (!c) throw new Error('no category ' + label);
  return c;
};

test('typoDist', () => { assert.equal(T.typoDist('brocoli','broccoli'),1); assert.equal(T.typoDist('borccoli','broccoli'),1); assert.equal(T.typoDist('brcoli','broccoli'),2); });
test('exact', () => assert.equal(T.matchAnswer(cat('Vegetables'),'broccoli',new Set(),12).kind,'exact'));
test('one typo', () => { const r=T.matchAnswer(cat('Vegetables'),'brocoli',new Set(),12); assert.equal(r.kind,'typo'); assert.equal(r.n,'broccoli'); });
test('two typos rejected', () => assert.equal(T.matchAnswer(cat('Vegetables'),'brcoli',new Set(),12).kind,'unknown'));
test('3-letter must be exact', () => assert.equal(T.matchAnswer(cat('Animals'),'cta',new Set(),12).kind,'unknown'));
test('ambiguous', () => { const r=T.matchAnswer(cat('Countries'),'irak',new Set(),12); assert.equal(r.kind,'ambiguous'); assert.deepEqual(r.options.sort(),['Iran','Iraq']); });
test('used typo not accepted', () => { const L=cat('Vegetables').list; assert.notEqual(T.matchAnswer(cat('Vegetables'),'brocoli',new Set([L.id+':'+L.map.broccoli]),12).kind,'typo'); });
test('too long for box', () => assert.equal(T.matchAnswer(cat('Vegetables'),'brocoli',new Set(),7).kind,'toolong'));
test('not in category', () => assert.equal(T.matchAnswer(cat('African countries'),'peru',new Set(),12).kind,'notcat'));
