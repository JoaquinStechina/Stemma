# Development

How Stemma is built and how to extend it. Code comments and the console messages of the host are in Spanish.

## How it works

The game is an Electron app (JavaScript/Vue). Stemma does not touch the process's memory:

1. `stemma.mjs` (Node) connects to the game through the Chrome debugging protocol (port 9222).
2. It bundles the code in `src/` into one script and runs it inside the game's page.
3. That script reads and changes the game's Vuex state and, when they exist, uses the game's internal functions (traits, job level, multipliers…), so their effects apply just as when playing.

If the game reloads the page, Stemma injects the panel again.

## Commands

| Command | What it does |
|---|---|
| `node stemma.mjs` | Connects to the game and injects the panel (`node trainer.mjs` still works: it is a shortcut) |
| `node stemma.mjs --dev` | Also injects the panel again every time you save a file in `src/` or `locales/` |
| `node stemma.mjs --check` | Checks `src/` and `locales/` (syntax, JSON, language keys) without opening the game |

## Structure

```
stemma.mjs             Node: connection to the game, bundling of src/, --dev and --check
src/
├─ main.js             entry point inside the game (builds the panel, F8)
├─ game.js             the ONLY file with the game's internal identifiers (with hook.js)
├─ hook.js             gate for Stemma's buttons in the game (also runs on its own, before the game)
├─ core/
│  ├─ panel.js         window: move, resize, header, grid of sections
│  ├─ ui.js            reusable pieces: rows, age, trait editor, dropdowns
│  ├─ achievements.js  achievements Stemma unlocks (in the game and on Steam)
│  ├─ i18n.js          t('key'), current language
│  ├─ flags.js         flags (SVG) and order of the languages
│  ├─ selection.js     chosen character and pet (shared between sections)
│  ├─ storage.js       preferences in localStorage
│  └─ dom.js           el(), fmt(), common styles
├─ war/
│  ├─ events.js        decision trees of the military events (copied from the game)
│  └─ analyze.js       probabilities, effects and recommended option for each option
├─ extras/
│  ├─ actions.js       actions of the mods (play as, divorce, adoption, dynasty, scenarios)
│  ├─ ingame.js        buttons and windows of those actions inside the game
│  ├─ finance.js       argentarius: bank, loans to families, publican companies, maritime loans, temple deposit and grain
│  ├─ province.js      provincial governorships of the household's pro-magistrates (and repetundis trials)
│  ├─ matchmaker.js    order to the matchmaker (based on peritiSumus's "coemptio" mod)
│  ├─ themes.js        color themes (from Prahlad's "theme" mod)
│  ├─ scenarios.js     scenario data (from the official "Play a Scenario" mod)
│  └─ icons.js         button icons (from the example mods)
└─ features/           one panel section per file
   ├─ index.js         list and default order of the sections
   └─ resources.js, family.js, traitStacks.js, pets.js, estate.js, multipliers.js, achievements.js, warEvents.js, extras.js
locales/               one JSON of texts per language (es, pt, en, ru, fr, de)
docs/                  Stemma guides and game mechanics
```

The code in `src/` **runs inside the game**, not in Node. `stemma.mjs` bundles it into a single script with a minimal CommonJS-style loader:

- each file is a module whose id is its path without `.js` (`src/core/ui.js` → `'core/ui'`);
- it is used with `require('core/ui')` and `module.exports`;
- the texts arrive as the `'locales'` module.

There is no build step: the script is assembled again on every injection.

## Adding a section

1. Create `src/features/<name>.js`:
   ```js
   // Example: a section with one editable value.
   const { t } = require('core/i18n')
   const game = require('game')

   module.exports = {
     id: 'example',          // also the key of the title in locales/*.json
     // fullWidth: true,     // optional: take the whole width of the panel
     build({ body, ui }) {
       ui.addRow({
         label: t('cash'),
         get: () => game.S()?.current.cash,
         set: v => { game.S().current.cash = v },
         steps: [100, 1000],
       }, body)
     },
   }
   ```
2. Add it to the list in `src/features/index.js`.
3. Add its texts (at least `"example": "Title"`) to each `locales/*.json`.
4. With `node stemma.mjs --dev` running, you will see the section when you save.

Pieces available in `ui` (see `src/core/ui.js`):

- **Rows and controls:**
  - `addRow`: numeric row with buttons, note, colors…
  - `ageRow`, `traitEditor`, `select`, `rosterSelect`, `button`.
  - `fillTraitSelect`: dropdown of grouped traits.
- **Text and blocks:**
  - `note` and `subheading`.
  - `group`: a collapsible block remembered by a key, for example `ui.group(body, t('traits'), 'example.traits')`. With a fourth parameter `true` it starts collapsed.
- **Refresh:** `onRefresh` registers a function that runs every 500 ms.

The character or pet selection is in `core/selection` (`sel.character()`, `sel.pet()`). If a section throws an error while being built, the rest of the panel keeps working and that section shows "Not available".

## Adding a language

1. Copy `locales/es.json` to `locales/<code>.json` and translate the values. Don't change the keys; `langName` is the name shown when you hover over the flag.
2. Add the flag in `src/core/flags.js`, with the same code.
3. `node stemma.mjs --check` warns if a language is missing keys or has extra ones (missing ones are shown in Spanish).

## If a game update breaks something

- **Internal identifiers.** The game's (`'50ab'`, `'a822'`, `'fc68'`…) are **only in `src/game.js`**, grouped by topic. If a group doesn't load, the panel shows "Not available in this game version." for whatever depends on it. The game's console (F12, or DevTools through the debugging port) shows `[trainer] <group> no disponible`.
- **Mods API.** The Extras section uses `game.DA.api()`: the game's `daapi` API `[6174]` created with `isDAAPI: false`, as in the game's own events. You must never call `setupDAAPI` or set `settings.enableMods`, because they mark the save with `flagUsedMods` and disable its achievements forever.
- **Buttons in the game.** The game's buttons and windows call their methods by event name, through `invokeMethod` `[bc91]` and the events context `[baa2]`. They are saved with the game, so they can't name events that only exist with Stemma: if an event is missing, `bc91` logs it with `console.warn`, the game stores the warning in `current.sessionErrorLog` `[9b31]` and, since the `preCheck` is evaluated when the button is drawn `[c29c]`, that redraws it and the game hangs. That is why `src/hook.js` uses `lifeAndDeath/birth.preCheckIfAlive` as a gate, a side-effect-free game check: without `characterId` it returns `undefined`, and with Stemma it carries `{ trainer: { event, method, context } }` to whatever was registered with `HOOK.register` (references are created with `HOOK.call`). Without Stemma, the buttons are visible but do nothing: the game does not hide them, because it uses the result of `dispatch`, which is always a Promise. Earlier saves used `trainer/<name>` events: `stemma.mjs` registers `hook.js` with `Page.addScriptToEvaluateOnNewDocument` (a fake webpack chunk that runs before the game), and `sync()` replaces those buttons. `hook.js` does not use `require`, because it also runs on its own. If you change the buttons, raise `VERSION` in `extras/ingame.js` so they are rebuilt.
- **"Arrange Betrothal" window.** The matchmaker button is added to the DOM of that game view (`game.betrothalView()`) and put back if the game redraws it. Its candidates are created with the game's generator (`game.SPOUSES`) and placed at the start of `current.generatedPotentialSpouseCharacterIds`, which is where the view takes its list from.
- **Military events.** Their trees, with the rolls that force each outcome, are copied from the game's code in `src/war/events.js`. If an update changes an event, fix it there.
- **Mechanics.** The notes in [docs](README.md) give the module of each formula, so you can check them again.
