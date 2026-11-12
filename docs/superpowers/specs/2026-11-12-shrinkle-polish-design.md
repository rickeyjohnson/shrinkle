# Shrinkle "polish for the world" design

Branch: `polish/world`. Date: 2026-11-12. `main` stays untouched until this is merged.

## Intent

Shrinkle spreads **one group chat at a time**. Someone finishes a dive, pastes the emoji funnel and link into a chat, and a friend taps the link on their phone. That friend should feel **hooked instantly**. Three moments carry the loop:

1. **The link preview** that unfolds in the chat.
2. **The first ten seconds** after the tap.
3. **The result** they paste back.

This pass makes all three feel finished on any phone or laptop. It isn't a big launch; it's a link that holds up wherever it lands.

## Goals

### 1. Hosting on Vercel
- Deploy the existing static site to **Vercel**. For now it uses the free `*.vercel.app` address (ideally `shrinkle.vercel.app`).
- **Custom domain: not bought yet.** `shrinkle.io` (~$45/yr) waits until Shrinkle is popular; cheaper options like `shrinkle.lol` are being weighed. **Launch on the free `vercel.app` address.** The site has to work on the `vercel.app` address first. Switching to `shrinkle.io` later must only take connecting the domain in Vercel and changing **one constant** (`SITE_URL`) that drives the share link and the absolute preview-image URL.
- A shared link must open the game directly. Crawlers don't follow `index.html`'s meta-refresh, so the address people share must serve the page that carries the preview tags. Planned approach: a `vercel.json` rewrite of `/` → `/shrinkle.html`. The GitHub Pages copy can stay as a backup.
- **How it connects (you answered):** you already have a Vercel account linked to GitHub. You import `rickeyjohnson/shrinkle` in the Vercel dashboard as a static project (no build command, output is the repo root). From then on:
  - Every push to `polish/world` gets a **preview URL** for review.
  - **Production follows `main`**, so the public link only changes when you merge this branch.
  - The Vercel CLI isn't installed on this machine. Deploys run through the GitHub link, not the CLI.

### 2. Remove skip (your request)
- Remove the skip button and the **Esc** shortcut.
- A round ends only on a correct answer or when the 20 seconds run out: 0 points, and you stay on your layer.

### 3. Countdown number (your request)
- Show a large countdown number from 20 to 0, in Space Mono, in the top-center readout, **directly under the "N pts to <next layer>" line**.
- It's white above 10 seconds, **yellow** from 10 to 6 (your change), and red with a slight pulse from 5 to 0. The existing last-5-seconds tick sound stays.
- The thin bar under the tiles stays as well *(my call)*.

### 4. Forgiving spelling: typos only (your rule)
- **Exact matches always win**, including aliases.
- Otherwise, accept an answer from *this round's category* that is **exactly one typo** away. A typo is one wrong letter, one missing letter, one extra letter, or two neighbouring letters swapped.
- Applies to answers of **4 or more letters**. Answers of 3 letters or fewer must be exact.
- If one typo could mean two different answers (IRAK could be Iran or Iraq), it's rejected with "Did you mean Iran or Iraq?".
- Answers already used this game are never typo-matched.
- The **real** answer's length counts for points, the next box size and the share funnel. If the real answer doesn't fit the box, it's rejected with a clear message.
- Feedback: "Close enough · BROCOLI → Broccoli". No point penalty.

### 5. Start screen (your decision)
- **Keep today's layout, logo and four instructions as they are.**
- "Start shrinking" stays the one big main button. **Practice moves underneath it** as a smaller, quieter secondary button.

### 6. Link preview card (your choice: option A)
- When the link is pasted into iMessage, WhatsApp, Discord, Slack or X, it unfolds a card. The card is a **1200×630 PNG** with:
  - a cosmic background,
  - the shrinking tile logo,
  - "NAME IT TO SHRINK IT".
- **Title:** "Shrinkle". **Description:** "A daily dive from the Cosmic Web to the atom. Name it to shrink it." *(Wording is my call.)*
- Tags to include:
  - Open Graph: `og:title`, `og:description`, `og:image` (absolute URL, with width and height), `og:url`, `og:type=website`.
  - `twitter:card=summary_large_image`.
  - `theme-color`.
  - An **apple-touch-icon** (180×180 PNG) made from the tile logo.
- The image is the same for everyone. Per-player result images are out of scope.

### 7. Share text
- The copy result keeps its current shape: the header, then "words · layer", then funnel rows with points and layer emoji.
- The last line becomes `SITE_URL` without `https://`. That's the `vercel.app` address now and `shrinkle.io` later. Today it's the GitHub Pages address.

### 8. General polish (my calls, within the current visual style)
- **Size checks (you confirmed):** a consistent type scale across the HUD, banner and end screen. Nothing overlaps or gets cut off at 375×667 (small phone), 390×844, 768×1024, 1280×720 and 1440×900. Each size gets checked with a screenshot.
- **End screen (you confirmed):** at 390×844 the layer reached, score and Copy button are visible without scrolling. The round-by-round recap sits below.
- **Phone input:** tapping anywhere on the play area opens the keyboard, and the play area stays above it, as today. There's no page zoom on input focus, and safe areas are respected.
- **Sound with a mute toggle (you confirmed):** keep the sound effects, plus a mute toggle in the top bar and on the title screen, remembered per browser.
- **Vibration (you confirmed):** a short buzz on correct and wrong answers, and a longer one on a layer drop, where the device supports it (Android Chrome; iPhones ignore it). It's silenced along with mute.
- **Accessibility:** visible focus states. Reduced-motion settings soften the zoom and banner animations.
- **Speed:** fonts load without blocking. The game stays one self-contained HTML file; Three.js stays inlined.

## Non-goals
- No accounts, backend, global leaderboards or multiplayer. The site stays static.
- No ads or other money-making in this pass.
- No new categories or changes to the word lists, beyond what fuzzy matching needs.
- No changes to scoring (10 per letter + 3 per second left), layers or thresholds.
- Buying the domain. You'll do that later.

## Anti-goals (a failure even if it technically works)
- A start screen that gets longer or wordier.
- A shared link that unfurls as a bare URL or opens a redirect page instead of the game.
- Fuzzy matching so loose that it accepts a *different* real answer, or a nonsense word.
- Anything that breaks the "one HTML file, opens in Chrome" property the Class Jam submission relies on.
- Changes landing on `main` before you've reviewed the branch.

## Constraints
- Static hosting on Vercel's free tier. **Only you can sign in to Vercel or link your GitHub account to it.** I can't create accounts or enter passwords.
- `og:image` must be an absolute HTTPS URL on the live host.
- `shrinkle.html` stays self-contained.
- Daily seeding, local-storage keys and scoring stay compatible, so today's daily result and stats survive.

## Left to the builder
- How to generate the 1200×630 image and the 180×180 icon (rendered from HTML or canvas, then committed as PNGs).
- The exact look of the secondary Practice button, the countdown size, and the mute icon, within the current style.
- The implementation details of the edit-distance matching.
