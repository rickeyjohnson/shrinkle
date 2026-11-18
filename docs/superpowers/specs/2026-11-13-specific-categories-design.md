# Shrinkle specific categories design

Branch: `feature/specific-categories`, cut from `main` at `ee778d1` (both earlier PRs are merged). Date: 2026-11-13.

## Intent

Krillion's prompts make you stop and think because they're **specific**. "Name an animal that stings" or "Name a living bird bigger than a chicken" cuts through something you know in a way you've never sorted it before. Shrinkle's categories today mostly come from letter filters on broad lists ("Animals containing 'IN'"). That makes you think about spelling, not about the world.

You want Shrinkle's categories to have **that same vibe**. Your model prompt is "TV shows from Disney, Nick or Cartoon Network": creative, cool, and it makes you dig through memory.

The players are **your classmates, mostly Gen Z**, but every generation should be able to play.

### How Krillion does it (research, for reference)

- Every player gets the same seven hand-written "Name a ___" prompts each day.
- Each prompt's answer set is built by gathering dictionaries, wiki pages and encyclopedias, then merging and cleaning them. Some sets have thousands of answers.
- Rarity scoring comes from word-frequency data, or a language model plus a manual check. **Shrinkle is not copying this part.**
- Matching checks aliases and forgives small typos.
- Sources: [krillion.io/faq](https://krillion.io/faq), [The Word Finder #116](https://www.thewordfinder.com/misc-solvers/krillion-answers/2026-11-08/).

**What Shrinkle takes from it:** hand-written specific prompts, each with its own complete answer list built from reference sources, and alias-aware matching.

## Goals

1. **Add a set of new hand-written specific prompts.** Each one is a list of its own, with its complete answer set.
2. **Keep the letter twists and use them on the new prompts too.** Every existing filter applies to them: starts with, ends in, containing "IN", has a double letter, no E, and the rest. That gives categories like "Disney, Nick or Cartoon Network shows starting with S".
3. **Keep every old list and old category** (countries, elements, Pokémon…, with all their filters).
4. **The dive mix (you agreed):**
   - **Round 1** is always a **plain new prompt** (no twist), so every dive opens on the cool one.
   - **Rounds 2–7** have **exactly 2 rounds from the old lists** and **4 from the new prompts**. That makes 5 new rounds per dive in total.
   - **Some** of the new-prompt rounds in 2–7 carry a letter twist.
5. **Mostly closed answer sets (you chose).** Prompts should have a fixed set of answers that can be listed completely, so a right answer is rarely turned away.

## Non-goals

- **No rarity scoring, tiers or "deep cut" bonuses.** Scoring stays at 10 points per letter plus 3 per second left. Longer answers still win.
- No change to rounds (7), timer (20 s), the box rule, layers, the share card, stats or the archive UI.
- No backend, no language model, no runtime downloads.
- No open-ended "something you empty at home" prompts, except the odd one whose answer list can still be made close to complete.

## Anti-goals (failure even if it works)

- **Right answers rejected often.** This is the main risk of specific prompts. A prompt whose list can't be made close to complete doesn't ship.
- **Prompts that feel like homework or are too obscure** for Gen Z classmates. Most players should be able to name at least 3 answers.
- **Not school-friendly.** No mature or edgy content.
- **Past shrinks change.** The archive promises "the same categories everyone got that day".
- **The single file breaks.** The Class Jam submission depends on `shrinkle.html` being one self-contained file.
- **Noticeably slower load** from generating more categories.

## Constraints

- Everything stays inline in `shrinkle.html`. No build step.
- `node --test tests/logic.test.mjs tests/site.test.mjs` must pass. The logic tests evaluate the script up to the `SOUND` marker, so new data and picker code must live above it.
- `matchAnswer`, the typo rules and the error messages work per list. Each new prompt is its own list (`addList`), so it gets typo matching, "doesn't fit this category" and "isn't on our ___ list" for free. Each prompt needs a short singular `one` noun for the last message (for example "show").
- A list is never used twice in one dive. This rule already exists through `usedLists`.
- `norm` drops everything but a–z. So:
  - "Ben 10" would become "BEN" and accept a 3-letter answer. **Answers must not contain digits.** Spell numbers out (for example "Ben Ten") or leave the entry out.
  - "Phineas & Ferb" and "Phineas and Ferb" normalize to different words.

## What a good new prompt looks like

1. **A twist on something familiar.** It cuts through a domain people know ("birds bigger than a chicken", "animals that sting", "places with Great or Grand in the name"). A plain domain like "Animals" doesn't count.
2. **Closed.** The full answer list can be built from a reference source: a Wikipedia "List of…" page, an official roster, a franchise wiki.
3. **Gettable.** Most classmates can name 3 or more answers.
4. **A spread of lengths.** It has long answers (which score big) and, ideally, a few answers of 5 letters or fewer, so it can show up in late rounds when the box is small.

### Topic mix (my call)

About half of the prompts are **pop culture from the 2000s to the 2020s**:
- cartoons and kids' TV
- Disney and Pixar
- video games (Mario, Minecraft, Pokémon, Zelda)
- music, YouTube and apps
- snacks and fast food

The other half is **timeless**:
- animals and nature with a twist
- geography with a twist
- food
- sports
- school subjects and science

Some examples to set the tone. The builder writes the final list.

- TV shows from Disney Channel, Nickelodeon or Cartoon Network
- Pixar movies
- Characters in Mario Kart
- Mobs in Minecraft
- Animals that sting
- Birds bigger than a chicken
- Places or landmarks with Great or Grand in the name
- Foods named after a place (Buffalo wings, Hamburger, Bologna…)
- Taylor Swift albums
- Hogwarts houses, teachers or subjects
- U.S. states that touch an ocean
- Olympic sports
- Board games
- Breakfast cereals
- Phobias with a common name

## Calls I made (check these)

- **Count:** about **120 new prompts** in the first pass. Each has roughly 15–300 answers.
- **Size budget:** the new data adds **at most about 150 KB** to `shrinkle.html`, which is about 704 KB today.
- **Label style:** labels are plural noun phrases, like the current ones ("Birds bigger than a chicken"), not "Name a…". The twist is added after the label, joined so it reads naturally (for example "Birds bigger than a chicken · starting with E"). The builder picks the exact separator.
- **Twist frequency:** about half of the four new-prompt rounds in 2–7 carry a twist, seeded by date. A twisted category must still have answers that fit the box. If none does, that round falls back to the plain prompt.
- **Which rounds are old lists:** two of rounds 2–7 are picked by the date seed. If the box leaves nothing fitting from the kind a round wants, the round falls back to the other kind, then to the existing "any list with 3 or more fits" fallback.
- **Small boxes may fall back to old lists.** A prompt only counts as fitting under the picker's current bar: at least 10 fitting answers at box 8+, 6 at box 5–7, and 4 at box 3–4, dropping to 3 if nothing meets it. Specific prompts rarely have many 3–4 letter answers. So when a player's box has shrunk to 3 or 4, a "new" round may turn into an old-list round instead of an unwinnable one. Players who keep their boxes big will see all 5 new rounds. To keep this rare:
  - at least ~30 new prompts should have a few answers of 4 letters or fewer (Minecraft mobs: Cow, Pig, Bee; Pixar movies: Up, Cars, Coco);
  - the answers must still be things people would say, not obscure padding.
- **Automatic aliases for new lists:**
  - A leading "The" is optional, and both forms count at their own length.
  - "&" and "and" both count.
  - Hand-written aliases (`name|alias`) still work.
- **Past shrinks stay identical.**
  - **Before launch:** days before a launch date keep using today's picker over the old categories only, so any day already played replays exactly as it did. For this to hold, the old lists and old categories must be generated in exactly the same order as today, so the new lists come **after** the old ones.
  - **The launch date** is one constant, set to **the day after the deploy goes live**. Dates are each player's local day, so some players will already have played on the old build on the deploy day.
  - **After launch,** the picker must survive later edits: new answers from the Report link, typo fixes, and later batches of prompts.
    - Every list (old and new) has a fixed id.
    - Each round picks the eligible list with the **lowest hash of the day's seed, the round, the box and the list id**. A twisted category within the list is picked the same way, by its label. Adding a prompt then can't reshuffle every other day the way "pick by position" would.
    - Each batch of new prompts carries a **start date**. Days before it never see that batch, so adding prompts later never changes days already played.
    - Which rounds are old-list rounds, and which new rounds get a twist, come from the day's seed alone, not from the data.
    - Accepted leftover risk: editing a prompt's answers can, rarely, change a past day's twisted round, or whether a prompt fits a box right at the threshold.
- **Title screen and README:** the category count on the title screen updates by itself. The README's Categories section gets rewritten to describe the new prompts.

## Left to the builder

- The final prompt list, wording and answer lists (sourced from reference lists, within the criteria above).
- The data format inside the file (one string per prompt, or one table).
- How the picker code is structured, as long as the mix rules above hold.
- The exact twist separator in labels.
- Which existing filters run on new prompts. All of them can, but the builder may drop ones that read badly on long labels.

## How we'll know it works

- Logic tests show:
  - Round 1 is always a plain new prompt, across many dates.
  - Rounds 2–7 contain exactly 2 old-list rounds whenever the box allows.
  - Some twisted new rounds appear across a range of dates.
  - New answer data is clean: no digits, no duplicates within a list, at least 3 answers each.
  - Enough new prompts fit each box under the picker's bar: at least 15 at every box from 5 to 12, at least 8 at box 4, and at least 4 at box 3.
  - The "The" and "&" aliases match.
  - A pre-launch date picks the same 7 categories as `main` does today, for several box paths.
  - Adding a dummy prompt batch dated after a day doesn't change that day's picks.
- All existing tests still pass.
- A full daily dive and a past-shrink replay both play end to end in the browser with no console errors.
