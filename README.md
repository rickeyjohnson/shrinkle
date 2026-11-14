# Shrinkle

**Play:** [shrinkle.lol](https://shrinkle.lol/) (backup: [rickeyjohnson.github.io/shrinkle](https://rickeyjohnson.github.io/shrinkle/))

A daily word-trivia shrink. Name things to shrink: every word you type sets the next letter box one letter shorter, and your points zoom you down through 12 layers of scale, from the Cosmic Web to an atomic nucleus.

Built in one class period for a Class Jam (theme: **shrinking**, constraint: winnable in **under 5 minutes**).

## How to play

1. Each round gives you a **category** and a **letter box**. Type any answer that fits the box.
2. **Your word sets the next box**: it's one letter shorter than what you typed (minimum 3). Long answers leave room. Short ones box you in.
3. Points = **length + time**: **10 per letter** plus **3 per second left**. That's up to 180 a round, and about 1,000 for a near-perfect run.
4. Your total score decides your **layer**. A big round can skip layers.
5. **7 rounds × 20 seconds**, with a countdown under the layer readout. If time runs out, you score 0 and stay on your layer.
6. **Typos are forgiven:** answers of 4+ letters count with one wrong, missing, extra or swapped letter (BROCOLI → Broccoli). Short answers must be exact.

Everyone gets the same daily shrink (seeded by date), so scores can be compared. You get **one daily attempt per browser**: after that, the title screen shows your saved result, a countdown to the next shrink, and your stats (played, average, best, deepest layer, streak), all kept in this browser's local storage.

**Past shrinks** is a star chart of every daily shrink since #1 (Nov 11, 2026), spiralling out from the centre. Lit stars are days you played (bigger = deeper layer); constellation lines join days played back to back. Tap any earlier star to play that day's shrink with the same categories everyone got. Past shrinks don't change your streak or stats, and their copied result says "(past shrink)".

## Controls

| Action | Key |
|---|---|
| Start | Click **Start shrinking** or press **Enter** |
| Type | Letters (spaces don't count). On a phone, tap the box first |
| Submit | **Enter** |
| Delete | **Backspace** |
| Sound on/off | Speaker button (top right while playing, or under Start shrinking) |
| Past shrinks | **Past shrinks** link on the title or end screen; **Esc** or **Back** closes it |

## Layers

| Layer | Scale | Points |
|---|---|---|
| 🕸️ Cosmic Web | 10²⁴ m | 0 |
| 🌌 Milky Way | 10²¹ m | 70 |
| ☀️ Solar System | 10¹³ m | 140 |
| 🌍 Earth | 10⁷ m | 210 |
| 🗺️ Continent | 10⁶ m | 280 |
| 🏙️ City | 10⁴ m | 350 |
| 🧍 Human | 10⁰ m | 430 |
| 🐜 Ant | 10⁻³ m | 510 |
| 🧫 Cell | 10⁻⁵ m | 590 |
| 🦠 Virus | 10⁻⁷ m | 680 |
| ⚛️ Atom | 10⁻¹⁰ m | 780 |
| 💥 Nucleus | 10⁻¹⁵ m | 900 |

## Sharing

The end screen copies a result like this:

```
SHRINKLE #1 · 🧫 Cell · 612 pts
6/7 words · layer 8 of 12
🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩⬜ 11 · 158 🌌
🟩🟩🟩🟩🟩🟩🟩🟩🟩⬜ 9 · 132 🌍
🟥 0 🌍
...
https://shrinkle.lol
```

🟩 letters used · ⬜ unused box · 🟥 time ran out · number = letters · points · emoji = layer reached after that round

## Categories

There are about 19,000 categories, generated at load time. The title screen shows the live count. They come from two kinds of list.

**Specific prompts (111 of them).** These are hand-written in the spirit of [Krillion](https://krillion.io): each one cuts through something you know in a way that makes you think. Some examples:
- *Shows from Disney Channel, Nickelodeon or Cartoon Network*
- *Living birds bigger than a chicken*
- *Animals that sting*
- *Names for groups of animals*
- *State capitals that aren't their state's biggest city*
- *Mobs in Minecraft*

Each prompt has its own complete answer list. The lists are built from reference lists (rosters, filmographies, Wikipedia "List of…" pages) and stick to sets that can be listed in full, so a right answer is rarely turned away. A leading "The" is optional, and "&" and "and" both count.

**Reference lists (27 of them).** These include:
- countries, tagged with continent, population and landlocked
- U.S. states, tagged with region
- chemical elements
- animals
- foods
- sports
- Gen 1 Pokémon
- NFL/NBA teams
- world capitals
- and more

**Letter twists.** Both kinds of list are combined with filters such as *starting with S*, *ending in "-IA"*, *containing "IN"* and *with a double letter*. On the specific prompts a twist reads "Pixar movies · starting with C". Any combination with fewer than 3 answers is dropped.

**How a dive is dealt:**
- **Round 1** is always a plain specific prompt.
- **Rounds 2–7** have 2 rounds from the reference lists and 4 from the specific prompts. About half of those 4 carry a letter twist.
- A list is never used twice in one dive.
- Every pick has answers that fit your current box. If your box has shrunk too far for any specific prompt, that round falls back to a reference list.
- Picks are seeded by the date, the round and your box size, so everyone with the same box gets the same category.
- Picks use rendezvous hashing. So adding prompts later (each batch carries a start date) never changes the categories of days already played.

Shrinks from before the specific prompts arrived (`NEW_FROM` in `shrinkle.html`) replay with exactly the categories they had.

## Tech

- One self-contained file: [`shrinkle.html`](shrinkle.html) (vanilla JS, no build step)
- [Three.js r128](https://threejs.org/) (MIT) is inlined in the file for the low-poly scenes, so nothing needs to download
- Fonts: Manrope, JetBrains Mono and Space Mono (Google Fonts)
- Sound effects are generated with the Web Audio API
- [`index.html`](index.html) redirects to the game for GitHub Pages

## Run locally

Open `shrinkle.html` in Chrome:

```bash
open -a "Google Chrome" shrinkle.html
```

## Repo

- `shrinkle.html`: the game
- `POST.md`: the Class Jam submission text
- `SHRINKLE-NOTES.md`, `docs/superpowers/plans/`: design notes and the build plan

## Feedback

Feedback goes to a Google Form. In `shrinkle.html`, set `FEEDBACK_FORM` to the form's share link to show **Send feedback** on the title and end screens. To add a **Report** link to every round on the end screen, make the form's pre-filled link with the answers typed as `{num}`, `{round}`, `{category}` and `{answer}`, and paste it into `FEEDBACK_REPORT`.
