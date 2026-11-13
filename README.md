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

**Unlimited** gives you a fresh, random set of categories every run, as many runs as you like. It never touches your daily result, stats or streak, and its copied result says "SHRINKLE Unlimited".

The **top bar** switches between **Daily**, **Unlimited** and **Past shrinks**, and holds **Feedback** and the sound switch. It hides during a run so the zoom has the whole screen.

## Controls

| Action | Key |
|---|---|
| Start | Click **Start shrinking** or press **Enter** |
| Type | Letters (spaces don't count). On a phone, tap the box first |
| Submit | **Enter** |
| Delete | **Backspace** |
| Unlimited | **Unlimited** in the top bar, or **Play unlimited** under Start shrinking and on the end screen |
| Past shrinks | **Past shrinks** in the top bar; **Esc** or **Back** closes it |
| Sound on/off | Speaker button in the top bar, or top right while playing |

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

There are 5,200 categories, generated at load time from 27 reference lists. The lists include countries (tagged with continent, population and landlocked), U.S. states (region), chemical elements, animals (mammals, birds, sea creatures, bugs, reptiles), foods, sports, instruments, Gen 1 Pokémon, NFL/NBA teams, world capitals, languages and more. Each list is combined with filters such as *starts with*, *ends in "-IA"*, *contains "IN"*, *has a double letter* and *10M+ people*, and any combination with fewer than 3 answers is dropped.

Each round's category is picked from the date, the round number and your current box size, so every pick is guaranteed to have answers that fit.

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

Feedback goes to a Google Form. In `shrinkle.html`, set `FEEDBACK_FORM` to the form's share link to show **Feedback** in the top bar. To add a **Report** link to every round on the end screen, make the form's pre-filled link with the answers typed as `{num}`, `{round}`, `{category}` and `{answer}`, and paste it into `FEEDBACK_REPORT`.
