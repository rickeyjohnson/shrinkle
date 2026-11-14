// Logic tests for shrinkle.html: evaluates the pure data + logic slice of the game script in Node.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

function load() {
  const html = readFileSync(fileURLToPath(new URL('../shrinkle.html', import.meta.url)), 'utf8');
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
  const game = scripts[scripts.length - 1][1];
  const code = game.split('/* ============================== SOUND')[0];
  return new Function(code + ';return {CATS,LISTS,LEVELS,typoDist,matchAnswer,norm,dayNum,dayKey,runBase,starPos,savedRun,fillForm,cleanPath,shareText,pickCat,NEW_FROM}')();
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
test('used typo not accepted', () => { const L=cat('Vegetables').list; assert.equal(T.matchAnswer(cat('Vegetables'),'brocoli',new Set([L.id+':'+L.map.broccoli]),12).kind,'used'); });
test('typo closer to an out-of-category answer is not accepted (IRAK in Countries ending in N)', () => assert.notEqual(T.matchAnswer(cat('Countries ending in N'),'irak',new Set(),12).kind,'typo'));
test('typo of an out-of-category answer is not accepted (DEAR in Animals starting with B)', () => assert.notEqual(T.matchAnswer(cat('Animals starting with B'),'dear',new Set(),12).kind,'typo'));
test('typo whose only match is outside the category says it does not fit', () => { const r=T.matchAnswer(cat('African countries'),'pery',new Set(),12); assert.equal(r.kind,'notcat'); });
test('too long for box', () => assert.equal(T.matchAnswer(cat('Vegetables'),'brocoli',new Set(),7).kind,'toolong'));
test('not in category', () => assert.equal(T.matchAnswer(cat('African countries'),'peru',new Set(),12).kind,'notcat'));

// ---- Daily numbers, archive and the star chart ----
test('day numbers: #1 is 2026-11-11, #2 is 2026-11-12, a year later is #366', () => {
  assert.equal(T.dayNum('2026-11-11'), 1);
  assert.equal(T.dayNum('2026-11-12'), 2);
  assert.equal(T.dayNum('2027-11-11'), 366);
});
test('dayKey turns a dive number back into its date, across DST changes and leap days', () => {
  assert.equal(T.dayKey(1), '2026-11-11');
  for (let n = 1; n <= 1200; n++) assert.equal(T.dayNum(T.dayKey(n)), n, `day ${n}`);
  assert.equal(T.dayKey(T.dayNum('2028-02-29')), '2028-02-29');
  assert.equal(T.dayKey(T.dayNum('2027-03-14')), '2027-03-14');
});
test('a past dive replays exactly the categories that day had (same seed as the daily)', () => {
  assert.equal(T.runBase('2026-11-11'), 'shrinkle3:2026-11-11');
});
test('star chart: neighbouring days sit close and no two stars overlap, even after 3 years', () => {
  const N = 1100, P = [];
  for (let i = 1; i <= N; i++) P.push(T.starPos(i));
  const d = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  for (let i = 1; i < N; i++) { const s = d(P[i - 1], P[i]); assert.ok(s >= 14 && s <= 30, `days ${i}-${i + 1} are ${s.toFixed(1)} apart`); }
  let min = Infinity;
  for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) min = Math.min(min, d(P[i], P[j]));
  assert.ok(min >= 14, `closest stars are ${min.toFixed(1)} apart`);
});
test('saved results from before this change still give the layer and score', () => {
  assert.deepEqual(T.savedRun({ title: '⚛️ Atom', score: '812 pts' }), { layer: 10, score: 812 });
  assert.deepEqual(T.savedRun({ title: '🧍 Human', score: '455 pts', layer: 6, points: 455 }), { layer: 6, score: 455 });
  assert.deepEqual(T.savedRun({ title: '🕸️ Cosmic Web', score: '0 pts' }), { layer: 0, score: 0 });
});
test('report links fill the Google Form pre-filled link with the round details', () => {
  const tpl = 'https://docs.google.com/forms/d/e/ABC/viewform?usp=pp_url&entry.11=%7Bnum%7D&entry.22=%7Bround%7D&entry.33=%7Bcategory%7D&entry.44=%7Banswer%7D';
  assert.equal(T.fillForm(tpl, { num: 2, round: 3, category: 'Countries ending in N', answer: 'IRAK & co' }),
    'https://docs.google.com/forms/d/e/ABC/viewform?usp=pp_url&entry.11=2&entry.22=3&entry.33=Countries%20ending%20in%20N&entry.44=IRAK%20%26%20co');
  assert.equal(T.fillForm('https://forms.gle/x?a={num}', { num: 7 }), 'https://forms.gle/x?a=7');
  assert.equal(T.fillForm('', { num: 7 }), '');
});
test('the address bar drops shrinkle.html (GitHub Pages, local server) and leaves clean paths alone', () => {
  assert.equal(T.cleanPath('/shrinkle.html'), '/');
  assert.equal(T.cleanPath('/shrinkle/shrinkle.html'), '/shrinkle/');
  assert.equal(T.cleanPath('/'), null);
  assert.equal(T.cleanPath('/shrinkle/'), null);
  assert.equal(T.cleanPath('/shrinkle/index.html'), null);
});
test('copied result ends with a real https://shrinkle.lol link so chats show the preview card', () => {
  const hist = [
    { ok: true, len: 11, box: 12, pts: 170, layer: 2 },
    { ok: false, box: 10, pts: 0, layer: 2 },
  ];
  const t = T.shareText({ num: 2, past: false, hist, score: 170, layer: 2, site: 'https://shrinkle.lol' }).split('\n');
  assert.equal(t[0], 'SHRINKLE #2 · ☀️ Solar System · 170 pts');
  assert.equal(t[1], '1/7 words · layer 3 of 12');
  assert.equal(t[2], '🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩⬜ 11 · 170 ☀️');
  assert.equal(t[3], '🟥 0 ☀️');
  assert.equal(t[t.length - 1], 'https://shrinkle.lol');
  assert.match(T.shareText({ num: 1, past: true, hist, score: 170, layer: 2, site: 'https://shrinkle.lol' }), /^SHRINKLE #1 \(past shrink\) · /);
});

// ---- Categories: past days keep their old picker ----
test('old categories are generated exactly as before', () => {
  const old = T.CATS.filter(c => !c.list.fresh);
  const h = createHash('sha256').update(old.map(c => c.list.id + '|' + c.label + '|' + c.words.join(',') + '|' + c.w).join('\n')).digest('hex').slice(0, 16);
  assert.equal(old.length, 5200);
  assert.equal(h, '5d0cefd53051e6c2');
});
// Picks made by main at ee778d1 along each box path (each pick's list is then marked used, as the game does)
const V1 = {
  '2026-11-11#0': ['Vegetables', 'Zodiac signs', 'Musical instruments', 'Planets, moons & dwarf planets', 'U.S. presidents (last name)', 'Fruits', 'Car brands'],
  '2026-11-11#1': ['Vegetables', 'Southern states', 'Sports', 'Languages', 'Body parts', 'Animals', 'Car brands'],
  '2026-11-11#2': ['Vegetables', 'Shapes', 'Months & days of the week', 'Languages ending in "-AN"', 'Greek & Roman gods', 'Body parts with a double letter', 'Car brands ending in a vowel'],
  '2026-11-12#0': ['Foods & dishes', 'Fruits', 'Vegetables', 'Birds', 'Jobs', 'Original 151 Pokémon', 'Car brands'],
  '2026-11-12#1': ['Foods & dishes', 'Shapes', 'Car brands', 'Mammals starting with a vowel', 'Body parts', 'Jobs', 'Greek & Roman gods'],
  '2026-11-12#2': ['Foods & dishes', 'Zodiac signs', 'NFL team nicknames', 'NBA team nicknames', 'U.S. presidents (last name)', 'Clothing', 'Musical instruments'],
  '2026-11-13#0': ['U.S. presidents (last name)', 'Dog breeds', 'Animals', 'Musical instruments', 'Greek & Roman gods', 'Car brands', 'Body parts'],
  '2026-11-13#1': ['U.S. presidents (last name)', 'Sports', 'Car brands', 'Shapes', 'Body parts', 'Mammals', 'Clothing'],
  '2026-11-13#2': ['U.S. presidents (last name)', 'Months & days of the week', 'Western states', 'Foods & dishes', 'Landlocked countries', 'Musical instruments', 'Jobs'],
};
const PATHS = [[12, 11, 9, 7, 5, 4, 3], [12, 8, 6, 4, 3, 3, 3], [12, 12, 10, 10, 8, 8, 6]];
test('days before NEW_FROM replay exactly the categories they had', () => {
  for (const [k, labels] of Object.entries(V1)) {
    const [key, pi] = k.split('#'), used = new Set();
    assert.ok(key < T.NEW_FROM, `${key} is before launch`);
    PATHS[pi].forEach((box, r) => {
      const c = T.pickCat(T.runBase(key), r, box, used);
      assert.equal(c.label, labels[r], `${k} round ${r + 1}`);
      used.add(c.list.id);
    });
  }
});
