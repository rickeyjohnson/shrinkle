# Meaning Twists Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add time/place/type twists ("Pixar movies · from the 2000s") to the new prompts. Serve them first on twist rounds, and make letter twists the exception. Add about 40 new prompts built around time and place.

**Architecture:**
- A prompt row gains an optional 5th element, a twist map: `{code: wording}`, or `{code: [wording, startDate]}`.
- Answers carry codes with the existing `:` tag syntax, for example `Toy Story:90s:10s`.
- Each twist becomes its own pool of kind `'mean'`. That pool yields only its whole category, with no letter twists.
- `pickCatV2` gains the kinds `mean` and `letter`. `dayPlan` marks about 1 twist round in 4 as a letter round.
- Weak letter twists are flagged in `addCat`. New prompts never generate them, and V2 never serves them.
- V1 and `CATS_OLD` are untouched.

**Tech Stack:** vanilla JS inside `shrinkle.html`, `node:test`.

**Spec:** `docs/superpowers/specs/2026-11-16-meaning-twists-design.md`. It builds on `docs/superpowers/specs/2026-11-13-specific-categories-design.md`.

## Global Constraints

- **One file.** Everything stays inline in `shrinkle.html`, with no build step. Data and picker code go above the `/* ============================== SOUND` marker.
- **Tests.** `node --test tests/logic.test.mjs tests/site.test.mjs` passes after every task.
- **Past days are frozen.**
  - The old-category hash stays `5d0cefd53051e6c2` over 5,200 categories.
  - The V1 fixtures stay unchanged.
  - Old list data strings (`D_*`) are not edited.
- **Labels** read `‹prompt› · ‹twist›`, the same `' · '` joiner the letter twists use.
- **Tags.**
  - A tag code is `[a-z0-9]+`, written after `:` on an answer entry.
  - Every code used on an answer is defined on its prompt.
  - Every twist has **at least 4 distinct answers**.
- **An answer counts in every group it fairly belongs to.**
  - A collapsed sequel counts in each decade the series had a movie.
  - Vader counts as both Jedi and Sith.
  - A gem counts under every color it is well known in.
  - A cross-continent place counts on both continents.
  - Every tag must be backed by a reference source.
- **Decade** means the year the thing first came out: a movie's release, a show's premiere, a console's launch, a group's debut, a musical's Broadway opening.
- **Twist wording** is a short phrase that reads after the dot: "from the 2000s", "in Europe", "in Slytherin", "in the brass section", "that are red", "made by Nintendo".
- **Picker bars.**
  - A meaning twist fits at `min(need,4)`.
  - A letter twist fits at `min(need,6)`.
  - Plain and old categories fit at `need`.
  - `need` is 10 at box 8 and up, 6 at box 5–7, and 4 below that. The last-resort pass uses 3.
- **Twist-round order.**
  - `mean → letter → plain → old`.
  - On a letter round: `letter → mean → plain → old`.
- **Letter rounds.** A twist round is a letter round when `hashStr(base+'|letter|'+round) < 0.25·2³²`. It depends on the day and round only, not the box.
- **Weak letter twists are dropped.** They are never generated for new prompts and never served by V2:
  - "with no X";
  - "with a/an X";
  - single-letter "ending in X";
  - "with only one vowel type".
- **Content.** No digits in answers, school-friendly, no alcohol, and no rarity scoring.
- **Size.** `shrinkle.html` stays under **900 KB**.
- **Launch date.** All new prompts and twists use `NEW_FROM`. No separate batch date.

## Review Focus

1. **Alias forms inherit their answer's tags.** "Incredibles" (auto-alias of "The Incredibles") must count in "Pixar movies · from the 2000s". A test for this is in Task 1.
2. **An answer in the prompt but outside the twist** returns `notcat`, so the player sees "doesn't fit this category". For example, "Coco" in "Pixar movies · from the 2000s". A test is in Task 1.
3. **Two twists with identical answer sets.** `addCat` silently drops the second. A test checks that every defined twist yields a category (Task 1).
4. **A typo nearer an answer outside the twist** must not be accepted as an in-twist typo. The existing `outCat` logic covers this; Task 1 adds a test on a meaning twist.
5. **Long meaning labels on a 375 px phone.** For example, "Shows from Disney Channel, Nickelodeon or Cartoon Network · that premiered in the 2000s". Checked in the browser in Task 6.

---

### Task 1: Twist engine and picker

**Files:**
- Modify: `shrinkle.html`
  - `addCat`/`genPool`: around lines 557–608
  - `addPrompts`: around lines 615–627
  - `dayPlan`/`pickCatV2`: around lines 683–712
  - the `p-pixar` row: around line 353
- Test: `tests/logic.test.mjs`

**Interfaces:**
- Produces:
  - `addTwist(L, code, say, from) -> category|undefined`: adds a meaning pool and its whole category to fresh list `L`. The category carries `kind:'mean'` and `from`.
  - `addPrompts(from, rows)`: rows may carry a 5th element `{code: say | [say, from]}`.
  - `addCat(p, label, ents, w, weak=false)`: stores `weak` on the category.
  - `dayPlan(base) -> {old:Set, twist:Set, letter:Set}`, where `letter ⊆ twist`.
  - `LETTER_SHARE = 0.25`.
  - `load()` in the tests also returns `addTwist` and `LETTER_SHARE`.

- [ ] **Step 1: Write the failing tests.** Add them to `tests/logic.test.mjs` under a new `// ---- Meaning twists ----` heading. Add `addTwist,LETTER_SHARE` to `load()`.

  **Test: `meaning twists read "<prompt> · <twist>" and hold only tagged answers`**

  On `cat('Pixar movies · from the 2000s')`, assert:
  - `kind === 'mean'` and `whole === true`;
  - `ratatouille` returns `'exact'`;
  - `coco` returns `'notcat'`.

  **Test: `an answer counts in every twist it is tagged with, alias forms included`**

  `toystory` is `'exact'` in both "· from the 1990s" and "· from the 2010s". `incredibles` is `'exact'` in "· from the 2000s".

  Before writing this test, check whether the Pixar list has 4 or more 1990s answers. If it doesn't, the 1990s twist is not defined: use 2000s and 2010s, and ledger a ruling.

  **Test: `a typo of an answer outside the twist is not accepted`**

  `matchAnswer(cat('Pixar movies · from the 2000s'), 'cocco', …).kind !== 'typo'`

  **Test: `every tag is a twist its prompt defines, and every twist has at least 4 answers`**

  For every fresh list, each code used on its items is defined on the list. Every defined twist has a category with at least 4 distinct items. That also covers duplicate answer sets being dropped.

  This needs `L.twists`, a map from code to `{say, from}`, stored by `addPrompts`.

  **Test: `new prompts never generate the weak letter twists`**

  No fresh category label matches:
  ```
  / · (with no [A-Z]|with an? [A-Z]|ending in [A-Z]|with only one vowel type)$/
  ```

  **Test: `from NEW_FROM on, the weak letter twists are never served`**

  Over 60 days, run the paths ROOMY, `[12,8,6,4,3,3,3]` and `[12,5,4,3,3,3,3]`. Assert:
  - no pick has `c.weak`;
  - no old pick label matches `/ (with no [A-Z]|with an? [A-Z]|ending in [A-Z]|with only one vowel type)$/`.

  **Test: `about 1 twist round in 4 is a letter round, decided by day and round alone`**

  Over 400 days of `dayPlan`:
  - the share of `letter` rounds among `twist` rounds is in `[0.18, 0.32]`;
  - `letter ⊆ twist`.

  **Test: `a twist round serves a meaning twist when one fits`**

  For 90 days on ROOMY, for each round in `plan.twist \ plan.letter`: if some unused fresh list has a `mean` category with `cum[box] >= Math.min(need,4)`, then the pick has `kind === 'mean'`.

  **Test: `a twist dated later does not change earlier days`**

  Load `T2` and record 30 days of ROOMY dives. Call:
  ```
  T2.addTwist(<p-kidstv list>, '90s', 'test twist', '2099-01-01')
  ```
  The dives must be unchanged. Use any code that has 4+ answers.

  **Update these existing tests:**
  - **`fits()` (line 195)** counts only `c.kind==='base' && c.whole`.
  - **Round 1 test (line 213)** asserts `c.kind==='base'`.
  - **`new rounds carry letter twists…` (line 218)** becomes `twisted new rounds are mostly meaning twists, and letter twists still include "containing"`. Over 90 days on ROOMY:
    - twisted fresh picks (`kind==='mean' || !c.whole`) number at least 90;
    - some letter pick contains `' · containing "'`.

- [ ] **Step 2: Run the tests and confirm the new ones fail.**

  Run: `node --test tests/logic.test.mjs 2>&1 | tail -40`

  Expected: FAIL. The failures are `no category Pixar movies · from the 2000s`, `T.addTwist is not a function`, the weak-twist label assertions, and `plan.letter` being undefined.

- [ ] **Step 3: Implement.**
  - **`entsOf(p)`.** Extract it from `genPool`, which then uses it. It builds the same array in the same order.
  - **`addCat` 5th parameter `weak`.** It is stored on the category.
  - **The `f(...)` helper in `genPool`** takes a 5th `weak` flag. When `p.list.fresh && weak`, it returns early; otherwise it passes `weak` through to `addCat`. Mark these weak:
    - single-letter "ending in";
    - "with a/an";
    - "with no";
    - "with only one vowel type".
  - **`addTwist(L,code,say,from)`:**
    1. `pool(L, L.label+' · '+say, it=>it.tags.includes(code), 'mean')`;
    2. `addCat(p, p.label, entsOf(p), 40)`;
    3. set `.from` on the pushed category;
    4. record `L.twists[code]={say,from}`.
  - **`addPrompts`** reads `row[4]`. A value is either a string or `[say, from]`, with `from` defaulting to the batch date. It calls `addTwist` for each code.
  - **`dayPlan`** adds `letter`. **`pickCatV2`** uses the kinds and bars from Global Constraints:
    ```
    plain:  live && kind==='base' && whole
    mean:   kind==='mean' && list.fresh && list.from<=day && c.from<=day
    letter: live && kind==='base' && !whole && !weak
    old:    !fresh && !weak
    ```
  - **Tag the Pixar row** with decade codes (`90s` if 4+ answers qualify, then `00s`, `10s`, `20s`) and give it its twist map.

- [ ] **Step 4: Run all tests.**

  Run: `node --test tests/logic.test.mjs tests/site.test.mjs 2>&1 | tail -15`

  Expected: all pass. The old hash and V1 fixtures are unchanged.

- [ ] **Step 5: Commit.**

  ```bash
  git add shrinkle.html tests/logic.test.mjs
  git commit -m "Meaning twists: tagged groups inside a prompt, served first on twist rounds; letter twists the exception, weak ones dropped"
  ```

### Task 2: Tag the existing prompts, batches A–C

**Files:**
- Modify: `shrinkle.html` (`PROMPTS_A`, `PROMPTS_B`, `PROMPTS_C`)
- Test: `tests/logic.test.mjs`

**Interfaces:**
- Consumes: the 5th row element and the `:code` answer tags (Task 1).

These are the candidate twists. Drop any twist that can't reach 4 answers from the list, and ledger a ruling for each drop. Codes are in brackets.

**A, TV and movies**

| Prompt | Twists |
|---|---|
| kidstv | on Disney Channel [dc]; on Nickelodeon [nick]; on Cartoon Network [cn]; that premiered in the 1990s / 2000s / 2010s [90s/00s/10s] |
| disney | before 1970 [old]; 1990s; 2000s; 2010s; 2020s |
| dreamworks | 2000s; 2010s; 2020s |
| villains | from Pixar movies [pixar] |
| simpsons | in the Simpson family [fam] |
| avatar | from the Water Tribes [water]; from the Earth Kingdom [earth]; from the Fire Nation [fire] |
| insideout | that are emotions [emo]; new in Inside Out 2 [two] |
| starwars | who are Jedi [jedi]; who are Sith [sith]; who are droids [droid] |
| hpchars | in Gryffindor / Slytherin / Ravenclaw / Hufflepuff [g/s/r/h]; who teach at Hogwarts [staff] |
| disneysongs | from 1990s movies; from 2010s movies |

**B, games, music and apps**

| Prompt | Twists |
|---|---|
| smash | from Pokémon [poke]; from Fire Emblem [fe]; from the Mario games [mario]; from Zelda [zelda] |
| mcmobs | found in the Nether [nether]; that are hostile [hostile] |
| starters | that are Grass / Fire / Water type |
| consoles | made by Nintendo / Sony / Microsoft / Sega |
| apps | owned by Meta [meta] |
| dances | from Latin America [latin] |

**C, animals and nature**

| Prompt | Twists |
|---|---|
| bigbirds | by continent, where 4+ answers |
| venomous | found in the U.S. / Australia / Africa |
| dinos | from the Triassic / Jurassic / Cretaceous |
| wildcats | from Africa / Asia / the Americas |
| flightless | from New Zealand |
| extinct | from the Ice Age |
| groups | for birds |
| sounds | that birds make |
| horns | from Africa |
| gems | that are red / blue / green / purple |
| storms | with ice or snow |

- [ ] **Step 1: Write the failing test `tagged prompts, batches A–C`.**
  - At least 25 lists in A–C have twists.
  - These spot checks are `'exact'`:
    - "Harry Potter characters · in Slytherin": `draco`, `snape`
    - "Star Wars characters · who are Sith": `vader`
    - "Star Wars characters · who are Jedi": `anakin`
    - "Dinosaurs · from the Jurassic": `stegosaurus`
    - "Gemstones and birthstones · that are red": `ruby`
  - These are `'notcat'`:
    - "Dinosaurs · from the Jurassic": `tyrannosaurus`
    - "Harry Potter characters · in Slytherin": `hermione`
- [ ] **Step 2: Run it and confirm it fails.**

  Run: `node --test tests/logic.test.mjs 2>&1 | grep -A5 "batches A"`

  Expected: FAIL with `no category`.
- [ ] **Step 3: Tag the answers and add the twist maps** for the table above.
- [ ] **Step 4: Run all tests.** Expected: all pass, including Task 1's "every tag defined, 4+ answers" test.
- [ ] **Step 5: Commit.** Message: `Tag prompts A–C with time, place and type twists`.

### Task 3: Tag the existing prompts, batches D–F, then fact-check all tags

**Files:**
- Modify: `shrinkle.html` (`PROMPTS_D`, `PROMPTS_E`, `PROMPTS_F`)
- Test: `tests/logic.test.mjs`

These are the candidate twists, under the same rules as Task 2.

**D, geography**

| Prompt | Twists |
|---|---|
| greatgrand | in the U.S. |
| oceanstates | on the Atlantic / Pacific / Gulf |
| borderstates | that border Canada / Mexico |
| equator | in Africa |
| parks | in California / Alaska / Utah / Colorado |
| wonders | of the ancient world; on the New 7 Wonders list (worded "on the new wonders list", no digits); that are natural |
| towers | in Asia / the U.S. / Europe |
| bridges | in Europe / the U.S. |
| capitals | in the Northeast / Midwest / South / West |
| olympiccities | that hosted the Winter Games; in Europe / Asia / the U.S. |
| islands | in the Caribbean / the Pacific / Asia |
| eu | that joined in 2004; that founded it in 1957 |
| spanish | in South America / Central America |
| french | in Africa / Europe |
| monarchies | in Europe / Asia |
| deserts | in Asia / Africa / the Americas / Australia |
| seas | that are oceans |

**E, food**

| Prompt | Twists |
|---|---|
| placefoods | named after a U.S. place / a place in Europe |
| pasta | that are stuffed / that are long |
| cheese | from France / Italy / the U.S. / Switzerland / the UK |
| cereal | made by Kellogg's / General Mills / Post |
| candy | made by Hershey / Mars |
| chips | made by Frito-Lay |
| soda | made by Coca-Cola / PepsiCo |
| bread | from France / Italy |
| toppings | that are meats / that are veggies |
| fastitems | from McDonald's / Burger King / Taco Bell / Wendy's |
| desserts | from Italy / France / Asia |
| sauces | from Asia |

Note: "joined in 2004" and "founded it in 1957" are labels, not answers, so they may contain digits.

**F, school, science and sports**

| Prompt | Twists |
|---|---|
| summer | played with a ball / in or on the water |
| winter | on ice / on snow |
| positions | in baseball / football / basketball / soccer / hockey |
| bones | in the arm or hand / in the leg or foot |
| units | that are metric / for volume / for length |
| constellations | in the zodiac |
| holidays | in the winter / spring / summer / fall |
| code | created before 1980 / in the 1990s |
| orchestra | in the brass / woodwind / string / percussion section |
| money | on coins / on bills |

- [ ] **Step 1: Write the failing test `tagged prompts, batches D–F`.**
  - At least 55 of the 111 existing prompts have twists.
  - These spot checks are `'exact'`:
    - "Famous bridges · in Europe": `towerbridge`
    - "Instruments in an orchestra · in the brass section": `trumpet`
    - "Cheeses · from France": `brie`
    - "Positions in team sports · in baseball": `shortstop`
  - These are `'notcat'`:
    - "Instruments in an orchestra · in the brass section": `violin`
    - "Famous bridges · in Europe": `goldengate`
- [ ] **Step 2: Run it and confirm it fails.** Expected: FAIL with `no category`.
- [ ] **Step 3: Tag the answers and add the twist maps.**
- [ ] **Step 4: Run all tests.** Expected: all pass.
- [ ] **Step 5: Fact-check.**
  1. Export every twist with its answers to `<workspace>/twists-AF.txt`, one line per twist.
  2. Dispatch one fresh general-purpose subagent to check each answer's membership against reference knowledge, under the "counts in every group it fairly belongs to" rule. It reports only wrong or missing memberships.
  3. Fix confirmed errors, and ledger anything you decline.
- [ ] **Step 6: Commit.** Message: `Tag prompts D–F with time, place and type twists; fact-check fixes`.

### Task 4: New prompts, batch G (time)

**Files:**
- Modify: `shrinkle.html`. Add `PROMPTS_G` after `PROMPTS_F`, and `addPrompts(NEW_FROM,PROMPTS_G)` after the F call.
- Test: `tests/logic.test.mjs`

Each prompt has 2 or more twists, a close-to-complete answer list, and at least 15 answers. Prefer some answers of 5 letters or fewer. These are the candidates; ids are prefixed `p-`.

| Id | Prompt | Twists |
|---|---|---|
| dcoms | Disney Channel Original Movies | 1990s / 2000s / 2010s / 2020s |
| anime | Anime series | before 2000 / 2000s / 2010s / 2020s |
| ghibli | Studio Ghibli movies | 1980s / 1990s / 2000s / 2010s+; directed by Hayao Miyazaki |
| musicals | Broadway musicals | before 1970 / 1970s–80s / 1990s–2000s / 2010s+ |
| bands | Boy bands and girl groups | 1990s / 2000s / 2010s; from South Korea; from the UK |
| fads | Toy crazes and fads | before 1980 / 1980s / 1990s / 2000s / 2010s+ |
| gameseries | Video game series | 1980s / 1990s / 2000s; made by Nintendo |
| apple | Apple products | before 2000 / 2000s / 2010s+ |
| legendary | Legendary and mythical Pokémon | from Gen 1, Gen 2 and so on; spell the generations out, no digits |
| netflix | Netflix original series | made outside the U.S.; 2010s / 2020s |
| missions | Space missions and spacecraft | 1950s–60s / 1970s–90s / 2000s+ |
| sitcoms | TV sitcoms | before 1980 / 1980s / 1990s / 2000s / 2010s+ |
| onename | Singers known by one name | by decade of debut |
| gameshows | TV game shows | before 1980 / 1980s–90s / 2000s+ |
| reality | Reality TV shows | 2000s / 2010s+; from the UK |
| movieseries | Movie series | first movie before 1990 / 1990s / 2000s / 2010s+ |
| bookseries | Book series for kids and teens | before 1990 / 1990s / 2000s / 2010s+ |
| pokegames | Pokémon video games | 1990s / 2000s / 2010s / 2020s |

Batches G and H together aim for 40 prompts. The test only needs 17 from G, which leaves room to drop a weak candidate.

- [ ] **Step 1: Write the failing test `batch G: time prompts`.**
  - `PROMPTS_G` adds at least 17 lists, each with 2 or more twists.
  - These spot checks are `'exact'`:
    - "Disney Channel Original Movies · from the 2000s": `highschoolmusical`
    - "Studio Ghibli movies · directed by Hayao Miyazaki": `spiritedaway`
    - "Boy bands and girl groups · from South Korea": `bts`
- [ ] **Step 2: Run it and confirm it fails.** Expected: FAIL with `no category`.
- [ ] **Step 3: Write `PROMPTS_G`.**
- [ ] **Step 4: Run all tests.** Expected: all pass.
- [ ] **Step 5: Commit.** Message: `Add prompt batch G: time-period prompts with decade twists`.

### Task 5: New prompts, batch H (place), then fact-check G and H

**Files:**
- Modify: `shrinkle.html`. Add `PROMPTS_H` and its `addPrompts` call.
- Test: `tests/logic.test.mjs`

These are the candidates:

| Id | Prompt | Twists |
|---|---|---|
| rivers | Rivers of the world | continents |
| mountains | Famous mountains and mountain ranges | continents |
| volcanoes | Famous volcanoes | continents, including the U.S. |
| lakes | Famous lakes | continents |
| landmarks | Famous landmarks in world cities | in Paris / London / Rome / New York / Washington, D.C. |
| castles | Famous castles and palaces | in Europe / Asia / the U.S. |
| themeparks | Theme parks and amusement parks | in Florida / California / outside the U.S. |
| soccer | Famous soccer clubs | in England / Spain / Italy / Germany |
| mlb | MLB teams | in the American League / National League |
| nhl | NHL teams | from Canada; from the U.S. |
| dishes | Dishes from around the world | from Mexico / Italy / Japan / India / China / Korea |
| snacksworld | Snacks and sweets from around the world | from Japan / the UK / Europe |
| civs | Ancient civilizations and empires | in Europe / Asia / Africa / the Americas |
| mythgods | Gods from Egyptian, Norse or Aztec myths | from Egypt / Norse myths / Aztec myths |
| carmodels | Car models | by a Japanese / American / German brand |
| airlines | Airlines | from the U.S. / Europe / Asia and the Middle East |
| festivals | Holidays and festivals around the world | in Asia / Europe / the Americas |
| worldinstr | Instruments from around the world | from Asia / Africa / Europe / the Americas |
| provinces | Canadian provinces and territories | that border the U.S. |
| streets | Famous streets and squares | in the U.S. / Europe / Asia |
| isles | Famous islands that aren't countries | in the Atlantic / the Pacific / the Mediterranean |

Spares, in case candidates are dropped: famous beaches (in the U.S. / outside); decade twists on board games.

- [ ] **Step 1: Write the failing test `batch H: place prompts`.**
  - `PROMPTS_H` adds at least 20 lists, each with 1 or more twists.
  - There are at least 150 fresh lists in total, which is the design's gate.
  - These spot checks are `'exact'`:
    - "Rivers of the world · in Africa": `nile`
    - "Famous soccer clubs · in Spain": `realmadrid`
    - "NHL teams · from Canada": `mapleleafs`
- [ ] **Step 2: Run it and confirm it fails.** Expected: FAIL.
- [ ] **Step 3: Write `PROMPTS_H`.**
- [ ] **Step 4: Run all tests.** Expected: all pass.
- [ ] **Step 5: Fact-check G and H.** Do it the same way as Task 3 Step 5: export to `<workspace>/twists-GH.txt`, then send one subagent. It also flags any answer list missing well-known answers.
- [ ] **Step 6: Commit.** Message: `Add prompt batch H: place prompts with continent, country and city twists; fact-check fixes`.

### Task 6: Coverage gates, mix, size, docs, category page, browser play

**Files:**
- Modify: `tests/logic.test.mjs`, `tests/site.test.mjs` (cap 860 → 900), `README.md` (Categories section)
- Scratchpad: `export-cats.mjs`, `categories-template.html`, `mix.mjs`

- [ ] **Step 1: Write the failing tests.**
  - **`meaning twists fit roomy boxes`.** At box 8, at least 25 fresh lists have a `mean` category with 6 or more fits. At box 5, at least 10.
  - **`meaning twists lead the twist rounds`.**
    - Over 120 days on ROOMY, at least 55% of `plan.twist` rounds serve `kind==='mean'`.
    - Over 120 days across the three paths, letter-twist picks (fresh `!whole`, or old `!whole && kind!=='tag'`) make up at most 15% of all picks.
  - **Size cap.** Change it to `< 900`. The test passes immediately; that's a cap change, not a behavior.
- [ ] **Step 2: Run the tests.** If a gate fails, fix the data (add twists or short answers) rather than lowering the gate, and ledger what you changed.
- [ ] **Step 3: Measure.** Run `node <scratchpad>/mix.mjs shrinkle.html`, and the load-time script `time.mjs`. Ledger both. Load time should stay under 200 ms.
- [ ] **Step 4: Update the README Categories section.** Describe meaning twists, the letter-twist share, the dropped weak twists, the new prompt count and how to add a twist later with a start date.
- [ ] **Step 5: Rebuild the category page.**
  1. In `export-cats.mjs`, group `kind==='mean'` categories under their prompt and mark them as meaning twists.
  2. In the template, show the meaning twists first under each prompt, styled apart from the letter twists.
  3. Rebuild with `build-page.mjs` and `check-page.mjs`.
  4. Republish from the same file path, so the link stays the same.
- [ ] **Step 6: Play in the browser.**
  1. Start the `game-specific-cats` server.
  2. Play a post-launch archive day to completion. It must include at least one meaning twist, a "doesn't fit" on a meaning twist, and no console errors.
  3. Check a long meaning label at 375 px.
  4. Stop the server.
- [ ] **Step 7: Commit.** Message: `Meaning-twist coverage gates, 900 KB cap, README`.
