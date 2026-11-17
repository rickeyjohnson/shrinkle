# Shrinkle meaning twists design

Branch: `feature/specific-categories` (continuing; nothing on it has shipped). Date: 2026-11-16. Builds on [2026-11-13-specific-categories-design.md](2026-11-13-specific-categories-design.md), which still holds except where this document changes it.

## Intent

You're seeing too many letter twists: "ending in", "with no", "starting with". Measured over 120 days on three box paths, about **35% of rounds** today are letter twists (29% on the new prompts, 6% on the old lists).

You want twists that make you think about **the world, not spelling**: when something is from, where it is, what kind it is. The examples you confirmed:

- Pixar movies · from the 2000s
- Famous bridges · in Europe
- Harry Potter characters · in Slytherin
- Instruments in an orchestra · in the brass section
- Gemstones · that are red

## Goals

1. **Meaning twists.** A meaning twist is a named group inside a prompt's answers, by:
   - **time**: decade, era or period;
   - **place**: continent, country, state or city;
   - **type**: house, team, section, maker, franchise, color and so on.

   It reads "‹prompt› · ‹twist›", the same way letter twists do now.
2. **Meaning twists come first.** On a twist round, the game picks a meaning twist whenever the prompt has one with enough answers that fit the box.
3. **Letter twists become the exception.** They show up on about **1 twist round in 4**, for variety, or when no meaning twist fits.
4. **The weakest letter twists leave the rotation:**
   - "with no E";
   - "with an A" (one letter anywhere);
   - "ending in N" (one letter);
   - "with only one vowel type".

   These stay: starting with S, starting with "BR", containing "AN" or "ING", ending in "-ER" or "-ING", with a double letter, with 2+ words, starting with a vowel, ending in a vowel, and starting and ending with the same letter.
5. **Tag the existing prompts.** About 60 of the 111 get one to four meaning twists, where one is natural. For example:
   - Pixar, Disney and DreamWorks movies by decade;
   - Avatar characters by nation;
   - Hogwarts houses;
   - Star Wars Jedi, Sith and droids;
   - starter Pokémon by type;
   - consoles by maker;
   - dinosaurs by period;
   - wild cats by continent;
   - gemstones by color;
   - bridges, towers and deserts by continent;
   - cheeses and desserts by country;
   - cereals and candy by maker;
   - positions by sport;
   - orchestra sections;
   - holidays by season.
6. **About 40 new prompts built around time and place from the start.** Each one has meaning twists. They keep the bar from the first design: specific, close to complete, gettable, and with a spread of lengths. Examples to set the tone (the builder writes the final list):
   - Disney Channel Original Movies, by decade
   - Anime series, by decade
   - Studio Ghibli movies, by decade
   - Broadway musicals, by decade
   - Boy bands and girl groups, by decade or from South Korea
   - Toy crazes and fads, by decade
   - Video game series, by decade or maker
   - Apple products, by decade
   - Legendary Pokémon, by generation
   - Netflix original series, made outside the U.S.
   - Rivers and mountains of the world, by continent
   - Famous landmarks, in Paris, London, Rome or New York
   - Theme parks, in Florida or California
   - Soccer clubs, in England, Spain, Italy or Germany
   - MLB teams, by league
   - NHL teams, from Canada
   - Dishes from around the world, by country
   - Ancient civilizations, by continent
   - Space missions, by decade

## Non-goals

- No rarity scoring. Scoring, rounds, timer, box rule, share card and archive stay as they are.
- **The reference lists (countries, animals, car brands…) don't change.** Changing them would change past shrinks. They get no meaning twists in this pass. Meaning twists on them ("Car brands · from Japan") are a possible follow-up.
- No meaning twist with a letter twist stacked on top ("Pixar movies · from the 2000s · starting with C").

## Anti-goals

- **Wrong tags.** A Pixar movie in the wrong decade, or a cheese from the wrong country. Classmates will notice. Tags meet the same bar as answers: checked against a reference source.
- **Twists so narrow that few people can answer.** Every meaning twist has at least 4 answers. Most should have 6 or more.
- **Past shrinks change.** The same guarantees as the first design apply.
- **The single file breaks, or loading gets noticeably slower.**

## Calls I made (check these)

- **Still 2 twisted rounds per dive.** Rounds 2–7 keep the agreed mix: 2 old-list rounds, 2 twisted new rounds and 2 plain new rounds, after a plain round 1. Only what a twisted round shows changes.

  Expected result:

  | | Today | Expected |
  |---|---|---|
  | Letter twists | ~35% of rounds | ~12% |
  | Meaning twists | — | ~20% |

  I'll measure the real numbers.
- **Which twist rounds get a letter twist.** The day and round decide it, not the box. So everyone on the same day and round gets the same kind of twist.
- **Old-list rounds.** They keep what they do today:
  - about 3 in 4 serve the plain list or one of its groups ("African countries", "Mammals");
  - the rest serve letter twists, minus the weak ones dropped above.
- **When a twist counts as fitting.** A meaning twist is offered on a round when **at least 4 of its answers fit the box** (3 as a last resort). That bar is lower than the letter twists' bar of 6 at box 5 and up. Small groups like "Legendary Pokémon · from Gen 1" (4 answers) then still get played instead of sitting unused. A twist round chooses among the prompts that have a fitting meaning twist. If none does, the round falls back:
  1. a letter twist;
  2. the plain prompt;
  3. an old list.
- **An answer counts in every group it fairly belongs to.** Rejecting a right answer is the main thing to avoid, so:
  - a collapsed sequel counts in each decade the series had a movie. "Toy Story" is a Pixar movie from the 1990s and the 2010s; "Cars" is from the 2000s and the 2010s.
  - Vader/Anakin counts as both a Jedi and a Sith.
  - A gemstone counts under every color it's well known in.
  - "Center" counts in every sport that has one.
  - A desert or bridge that crosses two continents counts in both.
  
  A tag still has to be backed by a reference source.
- **Twists can have their own start date.** A twist added to an existing prompt after launch gets a start date, so tagging later never changes a day already played. The twists in this pass all start on the launch date.
- **What a decade means.** A decade tag is the year the thing first came out:
  - a movie's release;
  - a show's premiere;
  - a console's launch;
  - a group's debut;
  - a musical's Broadway opening.
- **Twist wording.** Short phrases that read after the dot: "from the 2000s", "in Europe", "in Slytherin", "in the brass section", "that are red", "made by Nintendo".
- **Launch date.** The new prompts ship with the rest of the branch on the one launch date. They need no batch date of their own.
- **Size budget.** The tags and new prompts add at most about 100 KB. The file is 786 KB today, so I'm raising the size test from 860 KB to 900 KB.
- **The category page** (the list of every category) is rebuilt with meaning twists shown under each prompt, at the same link.

## Left to the builder

- Which prompts get which twists, the twist wording, and the final list of new prompts and answers.
- How tags are written in the data. They should stay compact and easy to check one answer at a time.
- How the picker code is structured, as long as the rules above hold.

## How we'll know it works

- Logic tests show:
  - Every tag on an answer belongs to a twist its prompt defines. Every twist has at least 4 answers.
  - Spot checks of multi-group answers: "Toy Story" counts for Pixar movies from the 1990s and from the 2010s.
  - Meaning-twist labels read "‹prompt› · ‹twist›".
  - Across many dates, twist rounds serve a meaning twist when one fits. Letter twists land on roughly 1 twist round in 4.
  - From launch on, the dropped letter twists are never served.
  - Days before launch pick exactly what they did. The old-category hash and the V1 fixtures are unchanged.
  - Coverage: at box 8 at least 25 prompts offer a meaning twist with 6 or more fitting answers, and at box 5 at least 10.
  - There are at least 150 prompts, with at least 40 new ones carrying meaning twists.
- All existing tests pass, and the file is under 900 KB.
- A full post-launch dive plays end to end in the browser, with at least one meaning twist, and no console errors.
