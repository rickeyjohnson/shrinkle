# Shrinkle

**Play:** [rickeyjohnson.github.io/shrinkle](https://rickeyjohnson.github.io/shrinkle/)

A daily word-trivia dive. Name things to shrink: every word you type sets the next letter box one letter shorter, and your points zoom you down through 11 layers of scale, from the Cosmic Web to an atomic nucleus.

Built in one class period for a Class Jam (theme: **shrinking**, constraint: winnable in **under 5 minutes**).

## How to play

1. Each round gives you a **category** and a **letter box**. Type any answer that fits the box.
2. **Your word sets the next box**: it's one letter shorter than what you typed (minimum 3). Long answers leave room. Short ones box you in.
3. Points = **letters + up to 4 for speed** (1 per 5 seconds left).
4. Your total score decides your **layer**. A big round can skip layers.
5. **7 rounds × 20 seconds**. If you skip or run out of time, you score 0 and stay on your layer.

Everyone gets the same daily dive (seeded by date), so scores can be compared. You get **one daily attempt per browser**: after that, the title screen shows your saved result, a countdown to the next dive, and your stats (played, average, best, deepest layer, streak), all kept in this browser's local storage. **Practice** deals a random dive any time.

## Controls

| Action | Key |
|---|---|
| Start | Click **Start shrinking** or press **Enter** |
| Type | Letters (spaces don't count). On a phone, tap the box first |
| Submit | **Enter** |
| Delete | **Backspace** |
| Skip round (0 pts) | **Esc** or the **skip** button |

## Layers

| Layer | Scale | Points |
|---|---|---|
| 🕸️ Cosmic Web | 10²⁴ m | 0 |
| 🌌 Milky Way | 10²¹ m | 6 |
| ☀️ Solar System | 10¹³ m | 12 |
| 🌍 Earth | 10⁷ m | 19 |
| 🗺️ Continent | 10⁶ m | 26 |
| 🏙️ City | 10⁴ m | 34 |
| 🐜 Ant | 10⁻³ m | 42 |
| 🧫 Cell | 10⁻⁵ m | 51 |
| 🦠 Virus | 10⁻⁷ m | 60 |
| ⚛️ Atom | 10⁻¹⁰ m | 70 |
| 💥 Nucleus | 10⁻¹⁵ m | 82 |

## Sharing

The end screen copies a result like this:

```
SHRINKLE #1 · 🐜 Ant · 50 pts
6/7 words · layer 7 of 11
🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩⬜ 11 ☀️
🟩🟩🟩⬜⬜⬜⬜⬜⬜⬜ 3 🌍
🟥 0 🗺️
...
rickeyjohnson.github.io/shrinkle
```

🟩 letters used · ⬜ unused box · 🟥 skipped · emoji = layer reached after that round

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
