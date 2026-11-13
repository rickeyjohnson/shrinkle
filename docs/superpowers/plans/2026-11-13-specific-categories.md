# Specific Categories Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add about 115 hand-written, Krillion-style specific prompts (each with its own complete answer list) to Shrinkle, keep every old list and letter twist, and pick each dive as 5 new + 2 old rounds without changing any past day.

**Architecture:** Each new prompt is an ordinary list (`addList`) flagged `fresh` with a batch start date, so the existing `genPool` filters and `matchAnswer` work on it unchanged. Days before `NEW_FROM` keep today's picker over the old categories only (`pickCatV1`). Days from `NEW_FROM` on use `pickCatV2`, which follows a per-day round plan and chooses lists and categories by rendezvous hashing, so adding data never reshuffles other choices.

**Tech Stack:** Vanilla JS inline in `shrinkle.html`, Node's built-in test runner (`node --test`).

**Spec:** `docs/superpowers/specs/2026-11-13-specific-categories-design.md`

## Global Constraints

- One self-contained file: all data and code go inline in `shrinkle.html`. No build step, no fetches.
- New data and picker code sit **above** the `/* ============================== SOUND` marker; the tests evaluate only that slice.
- `node --test tests/logic.test.mjs tests/site.test.mjs` passes after every task.
- Old lists, old pools and old categories are generated in exactly today's order. New lists and their categories come after all of them.
- No rarity, tiers or bonuses. Scoring stays at 10 per letter plus 3 per second left.
- Answer data rules:
  - no digits (spell numbers out or leave the entry out);
  - no commas, colons or pipes inside a name (they are the separators);
  - every normalized answer is at least 2 letters;
  - names are written in display case ("SpongeBob SquarePants");
  - school-friendly.
- New-prompt labels are plural noun phrases. Twists are joined with `' · '` ("Pixar movies · starting with C"). Old labels are unchanged.
- Added data is at most about 150 KB. `shrinkle.html` stays under 860 KB in total (704 KB today).

## Review Focus

1. **A player whose box shrinks to 3 or 4 letters.** Every pick still has at least 3 answers that fit. When no new prompt fits, the round goes to an old list. → Task 3, test `every pick has at least 3 answers that fit the box`.
2. **Typing a title without "The", or with "&" instead of "and".** It is accepted at its own length. → Task 2, alias tests.
3. **Replaying a pre-launch past shrink from the star chart.** It shows exactly the categories that day had. → Task 1, fixture test.
4. **An answer that appears in two items of one prompt** (an auto "The" alias colliding with another title). The later item must not silently lose it. → Task 2, `new prompt data is clean`.
5. **Adding answers or a new batch after launch.** Earlier days' round plan and list picks stay put. → Task 3, `a later prompt batch does not change earlier days`.

---

### Task 1: Freeze the picker for days before launch

**Files:**
- Modify: `shrinkle.html` (the category generator and `pickCat`, about lines 400–525)
- Test: `tests/logic.test.mjs`

**Interfaces:**
- Produces:
  - `const NEW_FROM='2026-11-14'` (the launch day, `YYYY-MM-DD`; re-set to the day after the deploy when merging);
  - `const CATS_OLD` (a copy of `CATS` taken right after the old pools are generated);
  - `pickCatV1(base,round,box,usedLists)` (today's `pickCat` body, unchanged, reading `CATS_OLD` instead of `CATS`);
  - `pickCat(base,round,box,usedLists,day=base.slice(-10))`, which returns `pickCatV1(...)` when `day<NEW_FROM` and, until Task 3, also otherwise.
- The test `load()` return list gains `pickCat, runBase, NEW_FROM`. `runBase` is already exported.

- [ ] **Step 1: Write the failing tests**

```js
import { createHash } from 'node:crypto';
test('old categories are generated exactly as before', () => {
  const old = T.CATS.filter(c => !c.list.fresh);
  const h = createHash('sha256').update(old.map(c => c.list.id+'|'+c.label+'|'+c.words.join(',')+'|'+c.w).join('\n')).digest('hex').slice(0,16);
  assert.equal(old.length, 5200);
  assert.equal(h, '5d0cefd53051e6c2');
});
const V1 = /* paste the JSON from the scratchpad file v1-fixtures.json: 9 keys like "2026-11-11#0" -> 7 labels */;
const PATHS = [[12,11,9,7,5,4,3],[12,8,6,4,3,3,3],[12,12,10,10,8,8,6]];
test('days before NEW_FROM replay exactly the categories they had', () => {
  for (const [k, labels] of Object.entries(V1)) {
    const [key, pi] = k.split('#'), used = new Set();
    PATHS[pi].forEach((box, r) => { const c = T.pickCat(T.runBase(key), r, box, used); assert.equal(c.label, labels[r], `${k} round ${r+1}`); used.add(c.list.id); });
  }
});
```

The fixture JSON is at `/private/tmp/claude-501/-Users-rickeyjohnson-repos-shrinkle/099a7a9e-7015-4e09-b702-3f2df34920d9/scratchpad/v1-fixtures.json`. It was produced from `main` at `ee778d1` by calling `pickCat` along each path and adding each pick's list id to `used`.

- [ ] **Step 2: Run the tests and see them fail**

Run: `node --test tests/logic.test.mjs`
Expected: FAIL. `pickCat`/`NEW_FROM` are not exported yet (the hash test passes already).

- [ ] **Step 3: Implement**

Add `CATS_OLD`, `NEW_FROM`, rename the body to `pickCatV1` over `CATS_OLD` (including its last-resort `CATS_OLD.find(...)`), and add the `pickCat` dispatcher. `ask()` keeps calling `pickCat(G.base,G.round,G.box,G.usedLists)`, and the day comes from the base.

- [ ] **Step 4: Run all tests and see them pass**

Run: `node --test tests/logic.test.mjs tests/site.test.mjs`
Expected: all pass (26 tests).

- [ ] **Step 5: Commit** — `git commit -am "Freeze the category picker for days before launch"`

---

### Task 2: New prompt lists, auto aliases, twist labels and batch A

**Files:**
- Modify: `shrinkle.html` (`addList`, `genPool` label joiner, new `addPrompts`, new data block placed after the old `D_*` strings)
- Test: `tests/logic.test.mjs`

**Interfaces:**
- Consumes: `CATS_OLD` from Task 1. It must still be captured **before** any `addPrompts` call.
- Produces:
  - `addList(id,label,one,str,common,opts)`. When `opts.fresh`, it sets `L.fresh=true`, `L.from=opts.from` and `L.src=str`, and expands auto aliases.
  - `addPrompts(from, rows)`. `rows` is an array of `[id, label, one, answers]`. For each row it calls `addList(...,undefined,{fresh:true,from})`, pushes a `'base'` pool and runs `genPool` on that pool. It returns the new lists, and it works when called again after load (tests use that).
  - List ids are prefixed `p-` (for example `p-pixar`).
- Auto aliases (fresh lists only), added to each item's `raws` after the hand-written ones:
  - a raw starting with "The " also gets the form without it;
  - a raw containing "&" also gets the form with " and ";
  - a raw containing the word "and" also gets the form with "&".
- `genPool` joins a twist to the label with `' · '` when `p.list.fresh`, and with `' '` otherwise. For example: `Pixar movies · starting with C`, `Pixar movies · containing "AR"`, `Pixar movies · with a double letter`.

- [ ] **Step 1: Write the failing tests**

```js
const fresh = () => T.LISTS.filter(L => L.fresh);
test('new prompt data is clean', () => {
  assert.ok(fresh().length >= 20);
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
```

- [ ] **Step 2: Run and see them fail** — `node --test tests/logic.test.mjs` fails with "no category Shows from Disney Channel…".

- [ ] **Step 3: Implement `addList` opts, the auto aliases, the `genPool` joiner and `addPrompts`.** Put `const POOLS_OLD_END=POOLS.length` and `CATS_OLD` before the first `addPrompts` call.

- [ ] **Step 4: Write batch A as `addPrompts(NEW_FROM, PROMPTS_A)`.** These are TV and movies, 20 prompts. Each answer list is built from the source named, as completely as the "closed" rule allows.

| id | label | one | source / notes |
|---|---|---|---|
| p-kidstv | Shows from Disney Channel, Nickelodeon or Cartoon Network | kids' show | channel "original programming" lists, 1990s to now; include The Fairly OddParents, Phineas and Ferb |
| p-pixar | Pixar movies | Pixar movie | feature list; sequels without the numeral collapse into the original |
| p-disney | Disney animated movies | Disney movie | Walt Disney Animation Studios canon |
| p-dreamworks | DreamWorks animated movies | DreamWorks movie | DreamWorks Animation filmography |
| p-princess | Disney princesses (plus Elsa and Anna) | princess | official lineup plus Elsa, Anna |
| p-villains | Disney and Pixar villains | villain | main antagonists of the canon and Pixar features |
| p-spongebob | Characters in SpongeBob SquarePants | SpongeBob character | main and recurring cast |
| p-simpsons | Characters in The Simpsons | Simpsons character | main and recurring cast |
| p-avatar | Characters in Avatar: The Last Airbender | Avatar character | main and recurring cast |
| p-toystory | Characters in Toy Story | Toy Story character | all four films |
| p-insideout | Emotions and characters in Inside Out | Inside Out character | both films: Joy, Fear, Envy… |
| p-shrek | Characters in Shrek | Shrek character | the films plus Puss in Boots films |
| p-looney | Looney Tunes characters | Looney Tunes character | classic roster, school-friendly |
| p-stranger | Characters in Stranger Things | Stranger Things character | main and recurring cast |
| p-mcu | Marvel superheroes from the MCU movies | MCU hero | heroes with an MCU film appearance |
| p-dc | DC superheroes | DC hero | Justice League, Titans, Bat-family |
| p-batvillains | Batman villains | Batman villain | rogues gallery |
| p-starwars | Star Wars characters | Star Wars character | film and Disney+ series main casts |
| p-hpchars | Harry Potter characters | Harry Potter character | books and films, named characters |
| p-hpspells | Harry Potter spells | spell | incantations named in books and films |

- [ ] **Step 5: Run all tests and see them pass** — `node --test tests/logic.test.mjs tests/site.test.mjs` passes, and Task 1's hash and fixture tests are unchanged.

- [ ] **Step 6: Commit** — `git commit -am "Add new prompt lists with auto aliases and batch A (TV and movies)"`

---

### Task 3: Day plan and the new picker

**Files:**
- Modify: `shrinkle.html` (next to `pickCatV1`)
- Test: `tests/logic.test.mjs`

**Interfaces:**
- Consumes: `fresh`, `from` and `whole` on lists and categories (Tasks 1–2), plus `hashStr` and `rng32`.
- Produces:
  - `dayPlan(base)` returns `{old:Set<number>, twist:Set<number>}`, built from `rng32(hashStr(base+'|plan'))`. `old` is 2 distinct rounds drawn from 1–6; `twist` is 2 distinct rounds drawn from the remaining 4.
  - `pickCatV2(base,round,box,usedLists,day)` returns a category.
  - `pickCat` sends `day>=NEW_FROM` to `pickCatV2`.
- The test `load()` return list gains `dayPlan, addPrompts`.

- [ ] **Step 1: Write the failing tests**

```js
const days = (n, from = T.NEW_FROM) => Array.from({length: n}, (_, i) => T.dayKey(T.dayNum(from) + i));
const dive = (TT, key, path) => { const used = new Set(); return path.map((box, r) => { const c = TT.pickCat(TT.runBase(key), r, box, used); used.add(c.list.id); return c; }); };
const ROOMY = [12,11,10,9,8,7,6];
test('from NEW_FROM on, round 1 is always a plain new prompt', () => {
  for (const k of days(90)) { const c = T.pickCat(T.runBase(k), 0, 12, new Set()); assert.ok(c.list.fresh && c.whole, `${k}: ${c.label}`); }
});
test('rounds 2-7 have exactly 2 old-list rounds when the box is roomy', () => {
  for (const k of days(90)) assert.equal(dive(T, k, ROOMY).slice(1).filter(c => !c.list.fresh).length, 2, k);
});
test('new rounds carry letter twists, including "containing"', () => {
  const tw = days(90).flatMap(k => dive(T, k, ROOMY)).filter(c => c.list.fresh && !c.whole);
  assert.ok(tw.length >= 90, `${tw.length} twisted rounds in 90 days`);
  assert.ok(tw.some(c => c.label.includes(' · containing "')));
});
test('a list is never used twice in a dive, and every pick has at least 3 answers that fit the box', () => {
  for (const k of days(60)) for (const path of [ROOMY, [12,8,6,4,3,3,3], [12,5,4,3,3,3,3]]) {
    const cs = dive(T, k, path);
    assert.equal(new Set(cs.map(c => c.list.id)).size, 7, k);
    cs.forEach((c, r) => assert.ok(c.cum[path[r]] >= 3, `${k} r${r+1} ${c.label} at box ${path[r]}`));
  }
});
test('a later prompt batch does not change earlier days', () => {
  const T2 = load(), before = days(30).map(k => dive(T2, k, ROOMY).map(c => c.label).join('|'));
  T2.addPrompts('2099-01-01', [['p-zz','Test things','thing','Alpha,Bravo,Charlie,Delta,Echo,Foxtrot,Golf,Hotel,India,Juliet,Kilo,Lima']]);
  assert.deepEqual(days(30).map(k => dive(T2, k, ROOMY).map(c => c.label).join('|')), before);
});
```

- [ ] **Step 2: Run and see them fail** — `node --test tests/logic.test.mjs` fails: round 1 picks old lists, and `dayPlan` is not defined.

- [ ] **Step 3: Implement `dayPlan` and `pickCatV2`**

This is the algorithm (the tests don't pin the fallback order or the hashing, so here it is):

```
need0 = box>=8?10 : box>=5?6 : 4          // today's bar
want  = round==0 ? 'plain' : plan.old.has(round) ? 'old' : plan.twist.has(round) ? 'twist' : 'plain'
order = {plain:['plain','old'], twist:['twist','plain','old'], old:['old','plain']}[want]
for need of [need0, 3]: for kind of order: c = pickKind(kind, kind=='twist' ? min(need,6) : need); if c return c
return first whole category with cum[box]>=3 whose list is unused, else any whole with cum[box]>=3, else CATS[0]

pickKind(kind, need):
  candidates = CATS where !usedLists.has(list.id) and cum[box]>=need and
      plain: list.fresh && list.from<=day && whole
      twist: list.fresh && list.from<=day && !whole
      old:   !list.fresh
  list = the candidate list with the lowest hashStr(base+'|'+round+'|'+box+'|'+list.id)
  return that list's candidate with the lowest  -Math.log((hashStr(base+'|'+round+'|'+box+'|'+label)+0.5)/4294967296)/c.w
```

All weights count, including the 0.3/0.4 "containing" filters. That is how "containing" twists show up.

- [ ] **Step 4: Run all tests and see them pass** — `node --test tests/logic.test.mjs tests/site.test.mjs`.

- [ ] **Step 5: Commit** — `git commit -am "New picker: plain new opener, 2 old rounds, seeded twists, stable hashing"`

---

### Tasks 4–8: Prompt batches B–F

Each batch is one task with the same steps:

1. Append `addPrompts(NEW_FROM, PROMPTS_X)` with the rows below. Build each answer list from the source named, as completely as the closed rule allows, and with aliases for common alternative names.
2. Run `node --test tests/logic.test.mjs tests/site.test.mjs`. Expected: all pass, and `new prompt data is clean` now covers the new lists.
3. Commit: `git commit -am "Add prompt batch X (<theme>)"`.

Watch out for prompts marked **short**. They need their 2–4 letter answers, which keep small boxes playable (Review Focus 1).

**Task 4 — batch B, games, music and apps:**
- p-mariokart: Characters in Mario Kart (one: Mario Kart racer)
- p-smash: Super Smash Bros. fighters (one: Smash fighter)
- p-mcmobs: Mobs in Minecraft (one: Minecraft mob) — **short**
- p-mcores: Ores and minerals in Minecraft (one: Minecraft ore) — **short**
- p-poketypes: Pokémon types (one: Pokémon type) — **short**
- p-starters: Starter Pokémon (one: starter Pokémon)
- p-zelda: Characters in The Legend of Zelda (one: Zelda character) — **short**
- p-sonic: Characters in Sonic the Hedgehog (one: Sonic character) — **short**
- p-fnaf: Characters in Five Nights at Freddy's (one: FNAF character)
- p-acnh: Special characters in Animal Crossing (one: Animal Crossing character)
- p-amongus: Crewmate colors in Among Us (one: Among Us color) — **short**
- p-consoles: Video game consoles (one: console)
- p-board: Board games (one: board game) — **short**
- p-cards: Card games (one: card game) — **short**
- p-apps: Social media and messaging apps (one: app)
- p-swift: Taylor Swift albums (one: Taylor Swift album)
- p-genres: Music genres (one: music genre) — **short**
- p-dances: Dance styles and famous dance moves (one: dance)
- p-disneysongs: Songs from Disney and Pixar movies (one: Disney song)

**Task 5 — batch C, animals and nature with a twist:**
- p-stingers: Animals that sting (one: stinging animal) — **short**
- p-bigbirds: Living birds bigger than a chicken (one: big bird)
- p-venomous: Venomous snakes (one: venomous snake) — **short**
- p-dinos: Dinosaurs (one: dinosaur)
- p-wildcats: Big cats and wild cats (one: wild cat) — **short**
- p-catbreeds: Cat breeds (one: cat breed)
- p-marsupials: Marsupials (one: marsupial)
- p-flightless: Flightless birds (one: flightless bird) — **short**
- p-deepsea: Deep-sea creatures (one: deep-sea creature)
- p-extinct: Extinct animals (one: extinct animal) — **short**
- p-babyanimals: Names for baby animals (one: baby animal name) — **short**
- p-groups: Names for groups of animals (one: animal group name) — **short**
- p-sounds: Sounds animals make (one: animal sound) — **short**
- p-horns: Animals with horns or antlers (one: horned animal) — **short**
- p-flowernames: Flowers that are also first names (one: flower name) — **short**
- p-gems: Gemstones and birthstones (one: gemstone) — **short**
- p-storms: Kinds of storms and wild weather (one: kind of weather) — **short**

**Task 6 — batch D, geography with a twist:**
- p-greatgrand: Places and landmarks with Great or Grand in the name (one: place)
- p-oceanstates: U.S. states that touch an ocean or the Gulf (one: coastal state)
- p-borderstates: U.S. states that border Canada or Mexico (one: border state)
- p-equator: Countries the equator passes through (one: country)
- p-parks: U.S. national parks (one: national park)
- p-hawaii: Hawaiian islands (one: Hawaiian island) — **short**
- p-wonders: Wonders of the world, old, new or natural (one: wonder)
- p-towers: Famous towers and skyscrapers (one: tower)
- p-bridges: Famous bridges (one: bridge)
- p-capitals: State capitals that aren't their state's biggest city (one: state capital)
- p-olympiccities: Cities that have hosted the Olympics (one: Olympic city) — **short**
- p-islands: Countries that are islands or made of islands (one: island country) — **short**
- p-eu: Countries in the European Union (one: EU country)
- p-spanish: Countries where Spanish is an official language (one: country)
- p-french: Countries where French is an official language (one: country)
- p-monarchies: Countries with a king, queen or emperor today (one: monarchy)
- p-teamcities: U.S. cities with an NFL or NBA team (one: city)
- p-deserts: Deserts of the world (one: desert) — **short**
- p-seas: Seas and oceans (one: sea) — **short**

**Task 7 — batch E, food:**
- p-placefoods: Foods named after a place (one: food) — obvious place names only
- p-pasta: Pasta shapes (one: pasta shape) — **short**
- p-cheese: Cheeses (one: cheese) — **short**
- p-cereal: Breakfast cereals (one: cereal) — **short**
- p-candy: Candy bars and candy brands (one: candy) — **short**
- p-chips: Chip and crisp brands (one: chip brand) — **short**
- p-soda: Sodas and soft drinks (one: soda) — **short**
- p-coffee: Drinks on a coffee shop menu (one: coffee shop drink) — **short**
- p-bread: Kinds of bread (one: bread) — **short**
- p-sandwich: Kinds of sandwiches (one: sandwich) — **short**
- p-toppings: Pizza toppings (one: pizza topping) — **short**
- p-icecream: Ice cream flavors (one: ice cream flavor)
- p-nuts: Nuts and seeds you can eat (one: nut or seed) — **short**
- p-plugin: Kitchen appliances that plug in (one: appliance) — **short**
- p-fastitems: Famous fast food menu items (one: menu item)
- p-desserts: Desserts from around the world (one: dessert) — **short**
- p-spices: Herbs and spices (one: herb or spice) — **short**
- p-sauces: Condiments and sauces (one: sauce) — **short**

**Task 8 — batch F, school, science and sports, plus the coverage gates:**
- p-summer: Summer Olympic sports (one: Olympic sport)
- p-winter: Winter Olympic sports (one: Winter Olympic sport) — **short**
- p-positions: Positions in team sports (one: position) — **short**
- p-chess: Chess pieces and chess terms (one: chess word) — **short**
- p-subjects: School subjects (one: school subject) — **short**
- p-sciences: Branches of science (one: branch of science)
- p-bones: Bones in the human body (one: bone) — **short**
- p-phobias: Phobias, by their -phobia name (one: phobia)
- p-greek: Greek letters (one: Greek letter) — **short**
- p-nato: Words in the NATO phonetic alphabet (one: NATO word) — **short**
- p-units: Units of measurement (one: unit) — **short**
- p-currency: Currencies of the world (one: currency) — **short**
- p-constellations: Constellations (one: constellation) — **short**
- p-holidays: Holidays celebrated in the U.S. (one: holiday) — **short**
- p-ivy: Ivy League schools (one: Ivy League school) — **short**
- p-code: Programming languages (one: programming language) — **short**
- p-orchestra: Instruments in an orchestra (one: orchestra instrument) — **short**
- p-money: People on U.S. coins and bills (one: person)

Task 8 also adds these tests before its data, and they must fail first. Run them, then add the batch F data, then run them to pass:

```js
const fits = (L, box) => { const need = box>=8?10 : box>=5?6 : 4; return T.CATS.some(c => c.list === L && c.whole && c.cum[box] >= need); };
test('enough new prompts fit every box size', () => {
  for (let box = 3; box <= 12; box++) {
    const n = fresh().filter(L => fits(L, box)).length, min = box >= 5 ? 15 : box === 4 ? 8 : 4;
    assert.ok(n >= min, `box ${box}: ${n} prompts fit, want ${min}`);
  }
});
test('about 115 new prompts, at least 30 with short answers', () => {
  assert.ok(fresh().length >= 110);
  assert.ok(fresh().filter(L => L.items.filter(it => it.ns.some(n => n.length <= 4)).length >= 3).length >= 30);
});
```

Add to `tests/site.test.mjs`:

```js
test('shrinkle.html stays one file under 860 KB', () => assert.ok(statSync(new URL('../shrinkle.html', import.meta.url)).size < 860 * 1024));
```

Then measure the load time:

```bash
node /private/tmp/claude-501/-Users-rickeyjohnson-repos-shrinkle/099a7a9e-7015-4e09-b702-3f2df34920d9/scratchpad/time.mjs shrinkle.html
```

It printed 82 ms before. Budget: **250 ms**. If it's over, speed up `genPool`: build letter, bigram and trigram → entries indexes in one pass, and keep the output byte-identical (Task 1's hash test guards it).

Commit: `git commit -am "Add prompt batch F and coverage gates"`.

---

### Task 9: README and end-to-end check

**Files:**
- Modify: `README.md` (the "Categories" section; the count in the first sentence)
- No code changes unless the browser check finds a bug.

- [ ] **Step 1: Rewrite README "Categories"**

Cover:
- about 115 hand-written specific prompts, each with a complete answer list built from reference lists, inspired by Krillion;
- the 27 old reference lists;
- letter twists on both;
- the 5 new + 2 old mix, with round 1 always a plain new prompt;
- past shrinks before launch keep their old categories;
- the live total from the title screen.

- [ ] **Step 2: Run all tests** — `node --test tests/logic.test.mjs tests/site.test.mjs` passes.

- [ ] **Step 3: Browser check.** Open `shrinkle.html` in the Browser pane through a static server, and check:
  - The title screen shows the new category count, with no console errors.
  - **Today's daily (before `NEW_FROM`)** still plays with the old picker. Play all 7 rounds to the end screen.
  - **A post-launch day:** run `startRun('archive','2026-11-20')` from the console.
    - Round 1 is a plain new prompt.
    - Rounds show " · " twists on new prompts.
    - Typing an answer without "The" is accepted.
    - Play to the end screen, and the recap lists all 7 categories.
  - Take a screenshot of a new-prompt round and of the end screen.

- [ ] **Step 4: Commit** — `git commit -am "README: specific categories"`

At merge time, set `NEW_FROM` to the day after the deploy goes live, and update the fixture test only if the date passes one of its keys. (It doesn't for 2026-11-11 to 2026-11-13.)
