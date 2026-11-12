# Shrinkle Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Polish Shrinkle for sharing in group chats:
- typo-forgiving answers
- no skip
- a countdown number
- sound with mute, and vibration
- a phone-friendly end screen
- a link preview card
- Vercel hosting

**Architecture:** Everything stays in the single self-contained `shrinkle.html` (inline Three.js). The pure logic before the `/* ==== SOUND` marker in the game script gets Node tests. A test harness extracts that slice and evaluates it. UI changes are checked in the browser at fixed viewport sizes. Static assets (`og.png`, `apple-touch-icon.png`) are rendered once with headless Chrome from a committed source card, and `vercel.json` makes `/` serve the game.

**Tech Stack:** Vanilla JS, Three.js r128 (inlined), `node:test`, headless Chrome for PNG rendering, Vercel static hosting.

**Spec:** `docs/superpowers/specs/2026-11-12-shrinkle-polish-design.md`

## Global Constraints
- `shrinkle.html` stays one self-contained file that opens in Chrome. No new external scripts.
- Scoring, layers, thresholds, categories, the daily seed (`'shrinkle3:'+date`) and local-storage keys (`shrinkle1k-*`) stay unchanged.
- Typos: exact matches win. One typo (substitute, insert, delete, or adjacent swap) is allowed only for answers of **4+ letters**. Two candidates means ambiguous. Used answers are never typo-matched. The real answer's length counts, and a real answer longer than the box is rejected.
- Countdown: white above 10 s, **yellow** (`#ffe14d`) from 10 to 6 s, red with a pulse from 5 to 0 s.
- Copy line: last line = `SITE_URL` without `https://`. Start: `https://shrinkle.vercel.app`.
- Preview text: title `Shrinkle`, description `A daily dive from the Cosmic Web to the atom. Name it to shrink it.`
- Sizes to check: 375×667, 390×844, 768×1024, 1280×720, 1440×900.
- All work stays on `polish/world`. Don't touch `main`.

## Review Focus
1. A typo whose real answer was already used this game → rejected as "Already used" (not accepted). Test in Task 1.
2. A 3-letter typo like `CTA` for Cat → rejected; short answers must be exact. Test in Task 1.
3. A daily result saved before this update, whose share text ends with the github.io link → "See today's result" still opens it without errors. Check in Task 5.
4. Mute → reload → still muted, and no vibration while muted. Check in Task 3.
5. 375×667 with the phone keyboard area reduced to about 400 px tall → countdown, prompt and tiles stay visible. Check in Task 6.

---

### Task 1: Typo-forgiving answers

**Files:**
- Create: `tests/logic.test.mjs`
- Modify: `shrinkle.html`. In the DIVE section, add `typoDist` and `matchAnswer` after `fitCount`. In GAME, update `submit()`.

**Interfaces:**
- Produces:
  - `typoDist(a: string, b: string, max = 2): number`: optimal-string-alignment distance. It may return early once the distance exceeds `max`.
  - `matchAnswer(cat, typed: string, used: Set<string>, box: number): {kind, n?, idx?, options?}`, where `kind` is one of:
    - `'exact'` or `'typo'`: carry `n`, the real normalized name, and `idx`, the list item index.
    - `'ambiguous'`: carries `options: string[]` of display names.
    - `'used'`, `'toolong'` (carries `n`), `'notcat'` (carries `idx`) or `'unknown'`.
  - Precedence: an exact name in the category wins, and if its item is used → `'used'`. An exact name in the list but not the category → `'notcat'`. Otherwise, gather category names within 1 typo where `typed.length >= 3`, the name has 4+ letters, and the item isn't used. Group them by item: one item → `'typo'`, more than one → `'ambiguous'`, none → `'unknown'`. For `'exact'` or `'typo'`, a name longer than `box` → `'toolong'`.
- `used` keys keep today's format `list.id+':'+idx`.

- [ ] **Step 1: Write the failing tests** in `tests/logic.test.mjs`. A `load()` helper reads `shrinkle.html`, takes the **last** `<script>` body, cuts it at `/* ============================== SOUND`, evaluates it with `new Function(code+';return {CATS,LISTS,typoDist,matchAnswer,norm}')`, and returns the result. Use `cat(label)` to find a category by exact label.
```js
test('typoDist', () => { assert.equal(T.typoDist('brocoli','broccoli'),1); assert.equal(T.typoDist('borccoli','broccoli'),1); assert.equal(T.typoDist('brcoli','broccoli'),2); });
test('exact', () => assert.equal(T.matchAnswer(cat('Vegetables'),'broccoli',new Set(),12).kind,'exact'));
test('one typo', () => { const r=T.matchAnswer(cat('Vegetables'),'brocoli',new Set(),12); assert.equal(r.kind,'typo'); assert.equal(r.n,'broccoli'); });
test('two typos rejected', () => assert.equal(T.matchAnswer(cat('Vegetables'),'brcoli',new Set(),12).kind,'unknown'));
test('3-letter must be exact', () => assert.equal(T.matchAnswer(cat('Animals'),'cta',new Set(),12).kind,'unknown'));
test('ambiguous', () => { const r=T.matchAnswer(cat('Countries'),'irak',new Set(),12); assert.equal(r.kind,'ambiguous'); assert.deepEqual(r.options.sort(),['Iran','Iraq']); });
test('used typo not accepted', () => { const L=cat('Vegetables').list; assert.notEqual(T.matchAnswer(cat('Vegetables'),'brocoli',new Set([L.id+':'+L.map.broccoli]),12).kind,'typo'); });
test('too long for box', () => assert.equal(T.matchAnswer(cat('Vegetables'),'brocoli',new Set(),7).kind,'toolong'));
test('not in category', () => assert.equal(T.matchAnswer(cat('African countries'),'peru',new Set(),12).kind,'notcat'));
```
- [ ] **Step 2: Run** `node --test tests/`. Expected: FAIL (`typoDist is not defined`).
- [ ] **Step 3: Implement `typoDist` and `matchAnswer`** in `shrinkle.html` as specified in Interfaces.
- [ ] **Step 4: Run** `node --test tests/`. Expected: all PASS.
- [ ] **Step 5: Wire up `submit()`.** It uses `matchAnswer(G.cat,G.buf,G.used,G.box)`:
  - `'exact'` / `'typo'` → score with the **real** `n.length`, and set the next box from `n.length`.
  - Messages:
    - `'typo'` → toast `Close enough · ${typed.toUpperCase()} → ${display}`.
    - `'ambiguous'` → `Did you mean ${a} or ${b}?`.
    - `'used'` → `Already used this game`.
    - `'toolong'` → `${display} has ${n.length} letters — too big for this box`.
    - `'notcat'` → keep today's message.
    - `'unknown'` → keep today's message.
- [ ] **Step 6: Browser check.** Start a practice run. Type a one-typo answer for the shown category, check that the toast and score use the real length, and that the next box equals the real length − 1.
- [ ] **Step 7: Commit** `tests/logic.test.mjs` and `shrinkle.html` with the message "Accept one-letter typos for 4+ letter answers".

### Task 2: Remove skip, add countdown number

**Files:** Modify `shrinkle.html`: remove `#btnPass`, its handler and the `Escape` branch; add `#cd` in `#scaleRead` after `#next`; update `renderTimer()`; add CSS.

**Interfaces:**
- Produces: `#cd` text = `Math.ceil(G.t)`, with class `''`, `'warn'` (≤10) or `'danger'` (≤5). `'danger'` gets a 0.5 s scale pulse. The bar fill uses the same three colors: `#f3f5fa`, `#ffe14d`, `#ff7a7a`.

- [ ] **Step 1: Implement.** `#cd` is Space Mono, about 34 px on desktop and 28 px under 560 px, centered under the "N pts to …" line. It stays visible on phones (unlike `.nx`, which is hidden under 560 px today, so move the countdown outside that rule). Remove `miss('skip')` wiring, and keep `miss('time')`.
- [ ] **Step 2: Browser check** (JS in the page during a round):
  - `!document.getElementById('btnPass')`
  - pressing Escape leaves `G.state==='play'`
  - `#cd` reads `20`
  - after mocking `G.t0` to 11 s ago, `#cd` has class `warn` and reads `9`
  - after mocking 16 s ago, it has class `danger`
- [ ] **Step 3: Commit** with the message "Remove skip; add countdown number under next-layer line".

### Task 3: Sound with mute, vibration

**Files:** Modify `shrinkle.html`: SOUND section, top bar (`#btnMute`), title panel (`#btnMuteTitle`), and calls in `submit()`, `fail()`, `advance()`.

**Interfaces:**
- Produces:
  - `let muted` (from `localStorage['shrinkle-muted']==='1'`)
  - `setMuted(on: boolean): void` (stores the value and updates both toggles' label and `aria-pressed`)
  - `buzz(pattern: number|number[]): void` (calls `navigator.vibrate` when it exists and not muted)
  - `tone()` returns immediately when `muted`
- Vibration patterns: correct → `30`, wrong → `[20,40,20]`, layer drop → `80`.

- [ ] **Step 1: Implement.** The toggle is a small ghost button showing a speaker or a muted speaker drawn with inline SVG (no emoji). It sits right of the score on the HUD, and under the Practice link on the title screen.
- [ ] **Step 2: Browser check:**
  - click `#btnMute` → `localStorage['shrinkle-muted']==='1'`
  - reload → `muted===true` and the toggle shows muted
  - stub `navigator.vibrate=(p)=>window._v=p`, answer correctly while muted → `window._v` stays undefined
  - unmute and answer → `window._v===30`
- [ ] **Step 3: Commit** with the message "Add mute toggle and vibration".

### Task 4: Start and end screen layout

**Files:** Modify `shrinkle.html`: the title `.btns` block, the end panel markup order, and CSS.

**Interfaces:**
- Produces:
  - **Title:** `#btnDaily` stays the full-width primary button, and `#btnPractice` sits directly under it as a smaller secondary (outlined, about 14 px text, less emphasis). Instructions 01–04 are unchanged.
  - **End screen order:**
    1. kicker
    2. title
    3. sub
    4. score
    5. a button row (`#btnCopy`, `#btnAgain`)
    6. `pre#share`
    7. `#recap`
    8. foot
    9. next-dive line

- [ ] **Step 1: Implement.**
- [ ] **Step 2: Browser check at 390×844.** After a practice run, `document.getElementById('btnCopy').getBoundingClientRect().bottom <= innerHeight` while the end screen is scrolled to the top. On the title screen, `#btnPractice` sits below `#btnDaily`, and its height is smaller.
- [ ] **Step 3: Commit** with the message "Title: practice under start; end: score and copy above the fold".

### Task 5: Link preview card, SITE_URL, Vercel config

**Files:**
- Create: `assets/og-card.html` (the 1200×630 source card), `og.png`, `apple-touch-icon.png`, `vercel.json`
- Modify: `shrinkle.html` (`<head>` meta tags; `SITE_URL`; share last line), `index.html` (same meta tags for the GitHub Pages copy), `README.md` (play link)

**Interfaces:**
- Produces:
  - `const SITE_URL=document.querySelector('meta[property="og:url"]').content.replace(/\/$/,'')`. The domain lives only in the `<head>` meta block.
  - `vercel.json` = `{"rewrites":[{"source":"/","destination":"/shrinkle.html"}]}`
- Meta tags:
  - `og:title`
  - `og:description`
  - `og:url=https://shrinkle.vercel.app/`
  - `og:image=https://shrinkle.vercel.app/og.png`
  - `og:image:width=1200`, `og:image:height=630`
  - `og:type=website`
  - `twitter:card=summary_large_image`
  - `meta name=description`
  - `theme-color=#05060b`
  - `link rel=apple-touch-icon href=apple-touch-icon.png`

- [ ] **Step 1: Write `assets/og-card.html`.** It uses the cosmic gradient and stars, the shrinking tile logo (S→E, white→cyan, Space Mono 700), "NAME IT TO SHRINK IT", and the small line "A daily dive from the Cosmic Web to the atom". Render it with:
  `"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --hide-scrollbars --window-size=1200,630 --screenshot=og.png assets/og-card.html`
  Render the 180×180 icon the same way from the same file with `?icon` (just three shrinking tiles).
- [ ] **Step 2: Verify the sizes** with `sips -g pixelWidth -g pixelHeight og.png apple-touch-icon.png`. Expected: 1200×630 and 180×180.
- [ ] **Step 3: Add the meta tags, `SITE_URL` and `vercel.json`.** The share last line is `SITE_URL.replace(/^https?:\/\//,'')`.
- [ ] **Step 4: Check** that `node --test tests/` still passes, and grep `shrinkle.html` for all the `og:` tags. In the browser, open "See today's result" with an old saved daily entry injected into localStorage (`share` ending in github.io). Expected: it renders with no console errors.
- [ ] **Step 5: Commit** with the message "Link preview card, icons, SITE_URL and vercel.json".

### Task 6: Size pass

**Files:** Modify `shrinkle.html` (CSS media queries only, unless a check fails for a logic reason).

- [ ] **Step 1: Screenshots.** At 375×667, 390×844, 768×1024, 1280×720 and 1440×900, take a screenshot of the title screen, a mid-round play screen (with a long category label such as "Fast food chains ending in S" and a 12-tile box) and the end screen.
- [ ] **Step 2: Check each one** with `document.documentElement.scrollWidth===innerWidth`. On the play screen, `#cd`, `#prompt` and `#tiles` rects must be inside the viewport and must not overlap `#banner` or `#meter`. Also check 375 wide × 400 tall (keyboard open).
- [ ] **Step 3: Fix** what fails, re-check that size only, then **commit** with the message "Size pass: 375 to 1440 px".

### Task 7: Deploy

- [ ] **Step 1: You import** `rickeyjohnson/shrinkle` in the Vercel dashboard: Framework "Other", no build command, output directory `.`. Only you can do this step.
- [ ] **Step 2: Push** `polish/world`, open the preview URL Vercel posts, and check:
  - the game loads at `/`
  - `curl -s <preview>/ | grep og:image` shows the tag
  - `/og.png` returns 200
- [ ] **Step 3: You decide** when to merge into `main`, which makes it the public production site. If Vercel gives a production address other than `shrinkle.vercel.app`, update the `og:url` / `og:image` meta lines to match before merging.
