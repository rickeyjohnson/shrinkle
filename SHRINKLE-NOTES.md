# SHRINKLE — design notes

Class Jam game. Theme: **shrinking**. Constraint: winnable in under 5 minutes. Delivered as one .html file. Due 5:50 pm, 2026-11-11.

## The one rule
Every word must be **shorter than your last word**, and **each word comes from a new category**.

## Round structure (option 3, chosen by you)
- **7 rounds**, a new category each round.
- **20 seconds per word.**
- Submit a valid word that's shorter than your last one to score: `points = word length × (10 + seconds left)`. Longer and faster words score more. *(my call)*
- If the timer runs out, the round scores 0, your length limit stays where it was, and you move to the next category.
- If no word in a category can fit under your limit, that round scores 0, and so does every round that can't be played after it.
- The whole run is at most 7 × 20 s ≈ 2:20 plus transitions, so it always fits in 5 minutes. **Every run ends on the win/results screen.**
- You see the full ladder of 7 categories up front, so you can plan your lengths. *(my call)*

## Daily
- One puzzle per day, seeded from the date, so everyone gets the same 7 categories and scores can be compared.
- A **Practice** button deals a random puzzle afterwards for replay. *(my call)*
- The end screen shows the score, a rank, and an emoji line you can copy (e.g. `SHRINKLE 2026-11-11 · 1,240`).
- The daily generator guarantees that a full shrinking chain exists for every puzzle (it's built around a "par" length that drops each round).

## Categories (as many as possible)
- **Krillion's approach, from the research:** everyone gets the same open-ended prompts each day, and accepted answers are scored by rarity. Rarity comes from how often a word appears in written and spoken text, backed by a language model and manual review. Rarity is *not* based on what other players answered.
- **What we do instead:** an LLM can't run inside a single offline HTML file, so we use **closed reference lists** (the Wikipedia/Wikidata-style "list of X" sets) tagged with facts. We then **combine them with filters** to generate thousands of checkable categories.
  - Base lists: countries (continent, population), U.S. states (region), chemical elements (group/type), animals, foods, sports, instruments, body parts, colors, occupations, NFL/NBA teams, Pokémon (Gen 1), languages, capital cities, planets and moons, and more.
  - Filters: starts with, ends with, contains (letter or pair, e.g. "in"), has a double letter, no letter E, ends in a vowel, attribute filters (continent, population over 10M/50M, metals, noble gases, …).
  - A category is kept only if it has enough valid answers across enough different lengths. Target: **5,000+** categories, counted live on the title screen.
- **Rarity bonus:** answers outside each list's "common" set get ×1.5 ("Deep cut"). The rarity judgement is subjective, which you said was fine. *(my call)*
- **Known tradeoff:** in open lists like animals or foods, a real answer that's missing from the list gets rejected. Closed lists are preferred for that reason.

## Visual theme: zooming in
Each round is one zoom level. You shrink from cosmic scale to atomic scale:

| Round | Zoom level |
|---|---|
| 1 | Milky Way |
| 2 | Solar System |
| 3 | Earth |
| 4 | Continent |
| 5 | Country / City |
| 6 | Human |
| 7 | Atom |

*(You listed 8 levels but asked for 7, so I folded "space" into Milky Way. My call.)*

- **Art style (updated):** clean graphics, no pixel art.
  - The UI has an **.io-game feel**: big rounded heavy font, flat bright colors, thick outlines, chunky drop shadows, and bouncy pop-in animations.
  - The background is a **low-poly, PS2-era 3D** scene for each zoom level, flat-shaded with a few hundred polygons. It's built with Three.js from a CDN, and if Three.js can't load, the game still plays on a flat gradient.
  - The scenes: a Milky Way spiral of points, a sun with orbiting planets, an icosahedron Earth, a terrain patch, a city block grid, a low-poly human, and an atom with electron rings.
- When you shrink, the letter tiles shrink and the camera zooms into the next level. The current scene blows up past the camera while the next one grows in from tiny.
- The end screen reads "You shrank from the Milky Way to an atom" (or tells you how far you got).

## Controls
- Type letters. **Enter** submits, **Backspace** deletes. Spaces and punctuation are ignored ("New York" = NEWYORK).
- Click or press Enter to start and continue.
