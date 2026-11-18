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
  return new Function(code + ';return {CATS,LISTS,LEVELS,typoDist,matchAnswer,norm,dayNum,dayKey,runBase,starPos,savedRun,fillForm,cleanPath,shareText,unlimitedBase,pickCat,BOX0,NEW_FROM,dayPlan,addPrompts,formName,addTwist,LETTER_SHARE,todayKey}')();
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
  const t = T.shareText({ mode: 'daily', num: 2, hist, score: 170, layer: 2, site: 'https://shrinkle.lol' }).split('\n');
  assert.equal(t[0], 'SHRINKLE #2 · ☀️ Solar System · 170 pts');
  assert.equal(t[1], '1/7 words · layer 3 of 12');
  assert.equal(t[2], '🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩⬜ 11 · 170 ☀️');
  assert.equal(t[3], '🟥 0 ☀️');
  assert.equal(t[t.length - 1], 'https://shrinkle.lol');
  assert.match(T.shareText({ mode: 'archive', num: 1, hist, score: 170, layer: 2, site: 'https://shrinkle.lol' }), /^SHRINKLE #1 \(past shrink\) · /);
});
test('an Unlimited result says Unlimited instead of a shrink number and still ends with the link', () => {
  const hist = [{ ok: true, len: 11, box: 12, pts: 170, layer: 2 }];
  const t = T.shareText({ mode: 'unlimited', num: null, hist, score: 170, layer: 2, site: 'https://shrinkle.lol' }).split('\n');
  assert.equal(t[0], 'SHRINKLE Unlimited · ☀️ Solar System · 170 pts');
  assert.equal(t[t.length - 1], 'https://shrinkle.lol');
});
test('Unlimited runs always deal the current categories (a specific prompt first), never the pre-launch picker', () => {
  // An Unlimited seed is random, not a date, so the picker must not read a "day" out of it
  for (let i = 0; i < 300; i++) {
    const b = T.unlimitedBase(), c = T.pickCat(b, 0, T.BOX0, new Set());
    assert.ok(c.list.fresh && c.kind === 'base' && c.whole, `${b}: round 1 dealt ${c.label}`);
  }
});
test('every Unlimited run gets its own random categories, never the daily ones', () => {
  const bases = new Set();
  for (let i = 0; i < 50; i++) bases.add(T.unlimitedBase());
  assert.equal(bases.size, 50);
  for (const b of bases) assert.ok(!b.startsWith(T.runBase('')), `${b} looks like a daily seed`);
  const firsts = new Set([...bases].map((b) => T.pickCat(b, 0, T.BOX0, new Set()).label));
  assert.ok(firsts.size > 5, `only ${firsts.size} different opening categories in 50 runs`);
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
  // Days played on the live site (main at fdb3c1c) while this branch was being built: they must replay too
  '2026-11-14#0': ['Dog breeds', 'Greek & Roman gods starting with a vowel', 'Animals starting with H', 'Fruits', 'Car brands', 'Chemical elements', 'Body parts'],
  '2026-11-14#1': ['Dog breeds', 'Original 151 Pokémon', 'Greek & Roman gods starting with a vowel', 'Car brands', 'Body parts', 'Mammals', 'Foods & dishes'],
  '2026-11-14#2': ['Dog breeds', 'Jobs ending in "-ER"', 'Car brands', 'Mammals', 'Fruits', 'Sports', 'Languages'],
  '2026-11-16#0': ['The first 30 elements', 'Animals', 'NFL team nicknames', 'Dog breeds', 'Sports', 'NBA team nicknames', 'Car brands'],
  '2026-11-16#1': ['The first 30 elements', 'Vegetables', 'Sports', 'Original 151 Pokémon', 'Car brands', 'Body parts', 'Mammals'],
  '2026-11-16#2': ['The first 30 elements', 'Animals', 'Clothing', 'Original 151 Pokémon starting with D', 'Musical instruments', 'Colors', 'Foods & dishes starting with C'],
  '2026-11-18#0': ['Clothing', 'African countries', 'Body parts', 'Colors', 'Vegetables', 'Planets, moons & dwarf planets', 'Animals'],
  '2026-11-18#1': ['Clothing', 'Jobs', 'Fast food chains', 'Sports', 'Car brands', 'Mammals', 'Body parts'],
  '2026-11-18#2': ['Clothing', 'Countries ending in E', 'Southern states', 'Shapes', 'Months & days of the week', 'Car brands', 'Fast food chains'],
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

// ---- Categories: the new specific prompts ----
const fresh = () => T.LISTS.filter(L => L.fresh);
test('new prompt data is clean', () => {
  assert.ok(fresh().length >= 20, `${fresh().length} new prompts`);
  for (const L of fresh()) {
    assert.ok(L.items.length >= 8, `${L.id} has ${L.items.length} answers`);
    assert.equal(L.src.split(',').filter(s => s.trim()).length, L.items.length, `${L.id} has a duplicate entry`);
    for (const it of L.items) for (const r of it.raws) {
      assert.ok(!/\d/.test(r), `${L.id}: digit in "${r}"`);
      assert.ok(T.norm(r).length >= 2, `${L.id}: "${r}" is too short`);
      assert.equal(L.map[T.norm(r)], it.idx, `${L.id}: "${r}" belongs to another answer`);
    }
  }
});
test('a leading "The" is optional on new prompts', () => {
  const c = cat('Shows from Disney Channel, Nickelodeon or Cartoon Network');
  assert.equal(T.matchAnswer(c, 'fairlyoddparents', new Set(), 20).kind, 'exact');
  assert.equal(T.matchAnswer(c, 'thefairlyoddparents', new Set(), 20).kind, 'exact');
});
test('"&" and "and" both count on new prompts', () => {
  const c = cat('Shows from Disney Channel, Nickelodeon or Cartoon Network');
  assert.equal(T.matchAnswer(c, 'phineasandferb', new Set(), 20).kind, 'exact');
  assert.equal(T.matchAnswer(c, 'phineasferb', new Set(), 20).kind, 'exact');
});
test('twists on new prompts read "<prompt> · <twist>"', () => {
  assert.ok(T.CATS.some(c => c.list.id === 'p-pixar' && c.label.startsWith('Pixar movies · starting with ')));
  assert.ok(T.CATS.some(c => c.list.fresh && / · containing "/.test(c.label)));
  assert.ok(!T.CATS.some(c => !c.list.fresh && c.label.includes(' · ')));
});

// ---- Review fixes: honest messages and the answers people actually give ----
test('"doesn\'t fit" names the form the player typed, not a different form that does fit', () => {
  const c = cat('Pixar movies · starting with T'), r = T.matchAnswer(c, 'incredibles', new Set(), 12);
  assert.equal(r.kind, 'notcat');
  assert.equal(r.n, 'incredibles');
  assert.equal(T.formName(c.list.items[r.idx], r.n), 'Incredibles');
});
test('an answer too long for the box says so, even after the box cut it short', () => {
  const r = T.matchAnswer(cat('Shows from Disney Channel, Nickelodeon or Cartoon Network'), 'stevenuniver', new Set(), 12);
  assert.equal(r.kind, 'toolong');
  assert.equal(r.n, 'stevenuniverse');
});
test('new answers keep their own capitals', () => {
  const ds = T.LISTS.find(l => l.id === 'p-kidstv').items.map(it => it.d);
  assert.ok(ds.includes('iCarly'));
  assert.ok(ds.includes('Phineas and Ferb'));
});
test('answers players commonly give are on the lists', () => {
  const ok = {
    'Famous towers and skyscrapers': ['empirestate', 'chrysler', 'petronas'],
    'Famous bridges': ['brooklyn', 'mackinac'],
    'Candy bars and candy brands': ['sourpatch', 'jellybeans', 'reesespieces', 'cadbury', 'lollipop', 'gummyworms', 'hersheyskisses'],
    'Breakfast cereals': ['honeybunches'],
    'Shows from Disney Channel, Nickelodeon or Cartoon Network': ['powerpuff', 'littleeinsteins', 'ninjago', 'yogabbagabba', 'houseofanubis'],
    'Names for groups of animals': ['murmuration', 'shiver', 'rafter', 'covey'],
    'Sounds animals make': ['squeal', 'heehaw'],
    'Mobs in Minecraft': ['zombiepigman', 'mushroomcow'],
    'Star Wars characters': ['artoo', 'threepio'],
    'Marvel superheroes from the MCU movies': ['daredevil'],
  };
  for (const [label, words] of Object.entries(ok)) for (const w of words) assert.equal(T.matchAnswer(cat(label), w, new Set(), 20).kind, 'exact', `${label}: ${w}`);
});
test('no alcohol answers (school-friendly)', () => {
  for (const [label, w] of [['Foods named after a place', 'champagne'], ['Foods named after a place', 'irishcoffee'], ['Drinks on a coffee shop menu', 'irishcoffee']])
    assert.equal(T.matchAnswer(cat(label), w, new Set(), 20).kind, 'unknown', `${label}: ${w}`);
});
test('"isn\'t on our ___ list" names the prompt, not a whole domain', () => {
  const broad = new Set(['country', 'city', 'person', 'place', 'state capital']);
  for (const L of fresh()) assert.ok(!broad.has(L.one), `${L.id}: "${L.one}"`);
});

const fits = (L, box) => { const need = box >= 8 ? 10 : box >= 5 ? 6 : 4; return T.CATS.some(c => c.list === L && c.kind === 'base' && c.whole && c.cum[box] >= need); };
test('enough new prompts fit every box size', () => {
  for (let box = 3; box <= 12; box++) {
    const n = fresh().filter(L => fits(L, box)).length, min = box >= 5 ? 15 : box === 4 ? 8 : 4;
    assert.ok(n >= min, `box ${box}: ${n} prompts fit, want ${min}`);
  }
});
test('about 115 new prompts, at least 30 with short answers', () => {
  assert.ok(fresh().length >= 110, `${fresh().length} new prompts`);
  const short = fresh().filter(L => L.items.filter(it => it.ns.some(n => n.length <= 4)).length >= 3).length;
  assert.ok(short >= 30, `${short} prompts with 3+ short answers`);
});

// ---- Categories: the picker from NEW_FROM on ----
const days = (n, from = T.NEW_FROM) => Array.from({ length: n }, (_, i) => T.dayKey(T.dayNum(from) + i));
const dive = (TT, key, path) => { const used = new Set(); return path.map((box, r) => { const c = TT.pickCat(TT.runBase(key), r, box, used); used.add(c.list.id); return c; }); };
const ROOMY = [12, 11, 10, 9, 8, 7, 6];
test('from NEW_FROM on, round 1 is always a plain new prompt', () => {
  for (const k of days(90)) { const c = T.pickCat(T.runBase(k), 0, 12, new Set()); assert.ok(c.list.fresh && c.whole && c.kind === 'base', `${k}: ${c.label}`); }
});
test('rounds 2-7 have exactly 2 old-list rounds when the box is roomy', () => {
  for (const k of days(90)) assert.equal(dive(T, k, ROOMY).slice(1).filter(c => !c.list.fresh).length, 2, k);
});
test('twisted new rounds are mostly meaning twists, and letter twists still include "containing"', () => {
  const tw = days(90).flatMap(k => dive(T, k, ROOMY)).filter(c => c.list.fresh && (c.kind === 'mean' || !c.whole));
  assert.ok(tw.length >= 90, `${tw.length} twisted rounds in 90 days`);
  assert.ok(tw.some(c => c.kind === 'mean'));
  assert.ok(tw.some(c => c.kind !== 'mean' && c.label.includes(' · containing "')));
});
test('a list is never used twice in a dive, and every pick has at least 3 answers that fit the box', () => {
  for (const k of days(60)) for (const path of [ROOMY, [12, 8, 6, 4, 3, 3, 3], [12, 5, 4, 3, 3, 3, 3]]) {
    const cs = dive(T, k, path);
    assert.equal(new Set(cs.map(c => c.list.id)).size, 7, k);
    cs.forEach((c, r) => assert.ok(c.cum[path[r]] >= 3, `${k} r${r + 1} ${c.label} at box ${path[r]}`));
  }
});
test('a later prompt batch does not change earlier days', () => {
  const T2 = load(), before = days(30).map(k => dive(T2, k, ROOMY).map(c => c.label).join('|'));
  T2.addPrompts('2099-01-01', [['p-zz', 'Test things', 'thing', 'Alpha,Bravo,Charlie,Delta,Echo,Foxtrot,Golf,Hotel,India,Juliet,Kilo,Lima']]);
  assert.deepEqual(days(30).map(k => dive(T2, k, ROOMY).map(c => c.label).join('|')), before);
});

// ---- Meaning twists: groups inside a prompt by time, place or type ----
const PATHS3 = [ROOMY, [12, 8, 6, 4, 3, 3, 3], [12, 5, 4, 3, 3, 3, 3]];
const WEAK = /(with no [A-Z]|with an? [A-Z]|ending in [A-Z]|with only one vowel type)$/;
test('meaning twists read "<prompt> · <twist>" and hold only tagged answers', () => {
  const c = cat('Pixar movies · from the 2000s');
  assert.equal(c.kind, 'mean');
  assert.equal(c.whole, true);
  assert.equal(T.matchAnswer(c, 'ratatouille', new Set(), 20).kind, 'exact');
  assert.equal(T.matchAnswer(c, 'coco', new Set(), 20).kind, 'notcat');
});
test('an answer counts in every twist it is tagged with, alias forms included', () => {
  for (const [label, w] of [['Pixar movies · from the 2000s', 'cars'], ['Pixar movies · from the 2010s', 'cars'], ['Pixar movies · from the 2010s', 'toystory'],
    ['Pixar movies · from the 2000s', 'incredibles'], ['Pixar movies · from the 2010s', 'theincredibles']])
    assert.equal(T.matchAnswer(cat(label), w, new Set(), 20).kind, 'exact', `${label}: ${w}`);
});
test('a typo of an answer outside the twist is not accepted', () => {
  assert.equal(T.matchAnswer(cat('Pixar movies'), 'elemntal', new Set(), 20).kind, 'typo');
  assert.notEqual(T.matchAnswer(cat('Pixar movies · from the 2000s'), 'elemntal', new Set(), 20).kind, 'typo');
});
test('every tag is a twist its prompt defines, and every twist has at least 4 answers', () => {
  assert.ok(fresh().some(L => L.twists && Object.keys(L.twists).length), 'no prompt has twists');
  for (const L of fresh()) {
    const tw = L.twists || {};
    for (const it of L.items) for (const t of it.tags) assert.ok(tw[t], `${L.id}: "${it.d}" has undefined tag "${t}"`);
    for (const [code, { say }] of Object.entries(tw)) {
      assert.match(code, /^[a-z0-9]+$/, `${L.id}: tag code "${code}"`);
      const c = T.CATS.find(x => x.list === L && x.kind === 'mean' && x.label === L.label + ' · ' + say);
      assert.ok(c, `${L.id}: twist "${say}" has no category (fewer than 3 forms, or the same answers as another twist)`);
      assert.ok(new Set(c.words.map(w => L.map[w])).size >= 4, `${L.id}: twist "${say}" has under 4 answers`);
    }
  }
});
test('new prompts never generate the weak letter twists', () => {
  const bad = T.CATS.filter(c => c.list.fresh && WEAK.test(c.label));
  assert.equal(bad.length, 0, bad.slice(0, 3).map(c => c.label).join(' | '));
});
test('from NEW_FROM on, the weak letter twists are never served', () => {
  for (const k of days(60)) for (const path of PATHS3) for (const c of dive(T, k, path)) assert.ok(!c.weak && !WEAK.test(c.label), `${k}: ${c.label}`);
});
test('about 1 twist round in 4 is a letter round, decided by day and round alone', () => {
  assert.equal(T.LETTER_SHARE, 0.25);
  let tw = 0, lt = 0;
  for (const k of days(400)) {
    const p = T.dayPlan(T.runBase(k));
    for (const r of p.letter) assert.ok(p.twist.has(r), `${k}: letter round ${r} is not a twist round`);
    tw += p.twist.size; lt += p.letter.size;
  }
  assert.ok(lt / tw >= 0.18 && lt / tw <= 0.32, `letter share ${(lt / tw).toFixed(3)}`);
});
test('a twist round serves a meaning twist when one fits', () => {
  let checked = 0;
  for (const k of days(90)) {
    const base = T.runBase(k), plan = T.dayPlan(base), used = new Set();
    ROOMY.forEach((box, r) => {
      const c = T.pickCat(base, r, box, used);
      if (plan.twist.has(r) && !plan.letter.has(r)) {
        const need = Math.min(box >= 8 ? 10 : box >= 5 ? 6 : 4, 4);
        const fitsOne = T.CATS.some(m => m.kind === 'mean' && !used.has(m.list.id) && m.cum[box] >= need && m.from <= k && m.list.from <= k);
        if (fitsOne) { checked++; assert.equal(c.kind, 'mean', `${k} r${r + 1}: ${c.label}`); }
      }
      used.add(c.list.id);
    });
  }
  assert.ok(checked > 0, 'no twist round had a fitting meaning twist');
});
test('a twist dated later is never dealt before its start date', () => {
  // Every other new prompt counts as already used, so each meaning round has to choose among p-kidstv's twists,
  // and the future-dated one would win some of them if the start-date check were missing
  const T2 = load(), L = T2.LISTS.find(l => l.id === 'p-kidstv');
  L.items.slice(0, 12).forEach(it => it.tags.push('zz'));
  const label = L.label + ' · ' + 'test twist';
  T2.addTwist(L, 'zz', 'test twist', '2099-01-01');
  const others = new Set(T2.LISTS.filter(l => l.fresh && l !== L).map(l => l.id));
  let meaningRounds = 0;
  for (const k of days(60)) {
    const base = T2.runBase(k), plan = T2.dayPlan(base);
    for (const r of plan.twist) {
      if (plan.letter.has(r)) continue;
      const c = T2.pickCat(base, r, 12, new Set(others));
      if (c.kind === 'mean') meaningRounds++;
      assert.notEqual(c.label, label, `${k} round ${r + 1} dealt a twist dated 2099`);
    }
  }
  assert.ok(meaningRounds > 50, `${meaningRounds} meaning rounds checked`);
});
test('a twist dated later does not change earlier days', () => {
  const T2 = load(), before = days(30).map(k => dive(T2, k, ROOMY).map(c => c.label).join('|'));
  const L = T2.LISTS.find(l => l.id === 'p-kidstv');
  L.items.slice(0, 8).forEach(it => it.tags.push('zz')); // as if tags were added to the data later
  T2.addTwist(L, 'zz', 'test twist', '2099-01-01');
  assert.ok(T2.CATS.some(c => c.label === L.label + ' · test twist'));
  assert.deepEqual(days(30).map(k => dive(T2, k, ROOMY).map(c => c.label).join('|')), before);
});
const tagged = () => fresh().filter(L => L.twists && Object.keys(L.twists).length);
const inTwist = (label, words, kind) => { for (const w of words) assert.equal(T.matchAnswer(cat(label), w, new Set(), 25).kind, kind, `${label}: ${w}`); };
test('tagged prompts, batches A–C', () => {
  assert.ok(tagged().length >= 25, `${tagged().length} prompts have twists`);
  inTwist('Harry Potter characters · in Slytherin', ['draco', 'snape'], 'exact');
  inTwist('Star Wars characters · who are Sith', ['vader'], 'exact');
  inTwist('Star Wars characters · who trained as Jedi', ['anakin'], 'exact');
  inTwist('Dinosaurs · from the Jurassic', ['stegosaurus'], 'exact');
  inTwist('Gemstones and birthstones · that are red', ['ruby'], 'exact');
  inTwist('Dinosaurs · from the Jurassic', ['tyrannosaurus'], 'notcat');
  inTwist('Harry Potter characters · in Slytherin', ['hermione'], 'notcat');
});
test('tagged prompts, batches D–F', () => {
  assert.ok(tagged().length >= 55, `${tagged().length} prompts have twists`);
  inTwist('Famous bridges · in Europe', ['towerbridge'], 'exact');
  inTwist('Instruments in an orchestra · in the brass section', ['trumpet'], 'exact');
  inTwist('Cheeses · from France', ['brie'], 'exact');
  inTwist('Positions in team sports · in baseball', ['shortstop'], 'exact');
  inTwist('Instruments in an orchestra · in the brass section', ['violin'], 'notcat');
  inTwist('Famous bridges · in Europe', ['goldengate'], 'notcat');
});
const G_IDS = ['p-dcoms', 'p-anime', 'p-ghibli', 'p-musicals', 'p-bands', 'p-fads', 'p-gameseries', 'p-apple', 'p-legendary', 'p-netflix', 'p-missions', 'p-sitcoms', 'p-onename', 'p-gameshows', 'p-reality', 'p-movieseries', 'p-bookseries', 'p-pokegames'];
test('batch G: time prompts', () => {
  const g = fresh().filter(L => G_IDS.includes(L.id));
  assert.ok(g.length >= 17, `${g.length} batch G prompts`);
  for (const L of g) assert.ok(Object.keys(L.twists || {}).length >= 2, `${L.id} has under 2 twists`);
  inTwist('Disney Channel Original Movies · from the 2000s', ['highschoolmusical'], 'exact');
  inTwist('Studio Ghibli movies · directed by Hayao Miyazaki', ['spiritedaway'], 'exact');
  inTwist('Boy bands and girl groups · from South Korea', ['bts'], 'exact');
  inTwist('Studio Ghibli movies · directed by Hayao Miyazaki', ['graveofthefireflies'], 'notcat');
});
const H_IDS = ['p-rivers', 'p-mountains', 'p-volcanoes', 'p-lakes', 'p-landmarks', 'p-castles', 'p-themeparks', 'p-soccer', 'p-mlb', 'p-nhl', 'p-dishes', 'p-snacksworld', 'p-civs', 'p-mythgods', 'p-carmodels', 'p-airlines', 'p-festivals', 'p-worldinstr', 'p-provinces', 'p-streets', 'p-isles', 'p-beaches'];
test('batch H: place prompts', () => {
  const h = fresh().filter(L => H_IDS.includes(L.id));
  assert.ok(h.length >= 20, `${h.length} batch H prompts`);
  for (const L of h) assert.ok(Object.keys(L.twists || {}).length >= 1, `${L.id} has no twists`);
  assert.ok(fresh().length >= 150, `${fresh().length} new prompts in all`);
  inTwist('Rivers of the world · in Africa', ['nile'], 'exact');
  inTwist('Famous soccer clubs · in Spain', ['realmadrid'], 'exact');
  inTwist('NHL teams · from Canada', ['mapleleafs'], 'exact');
  inTwist('NHL teams · from Canada', ['bruins'], 'notcat');
});

// ---- Meaning twists: coverage and the mix a player actually sees ----
test('meaning twists fit roomy boxes', () => {
  const fitMean = (box, need) => fresh().filter(L => T.CATS.some(c => c.list === L && c.kind === 'mean' && c.cum[box] >= need)).length;
  assert.ok(fitMean(8, 6) >= 25, `box 8: ${fitMean(8, 6)} prompts have a meaning twist with 6+ fits`);
  assert.ok(fitMean(5, 6) >= 10, `box 5: ${fitMean(5, 6)} prompts have a meaning twist with 6+ fits`);
});
test('meaning twists lead the twist rounds, and letter twists are the exception', () => {
  let tw = 0, mean = 0;
  for (const k of days(120)) {
    const plan = T.dayPlan(T.runBase(k));
    dive(T, k, ROOMY).forEach((c, r) => { if (plan.twist.has(r)) { tw++; if (c.kind === 'mean') mean++; } });
  }
  assert.ok(mean / tw >= 0.55, `meaning twists on ${(100 * mean / tw).toFixed(1)}% of twist rounds`);
  let all = 0, letter = 0;
  for (const k of days(120)) for (const path of PATHS3) for (const c of dive(T, k, path)) {
    all++;
    if (c.kind !== 'mean' && !c.whole && (c.list.fresh || c.kind !== 'tag')) letter++;
  }
  assert.ok(letter / all <= 0.15, `letter twists on ${(100 * letter / all).toFixed(1)}% of all rounds`);
});
