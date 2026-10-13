# Stemma

An unofficial companion for **Citizen of Rome - Dynasty Ascendant** (Steam). It adds a floating panel inside the game to edit your save as you play, plus new things to do: banking and investments, a matchmaker, provincial governorships and more.

Works with game version **1.6.37**. Not affiliated with the game's developers.

## What it does

- **Edit your game live.** Money, influence, prestige, family skills and traits, pets, properties, achievements.
- **Military event advisor.** See what each choice in a war event can lead to.
- **Extras inside the game's own windows.** Color themes and dark mode, play as another character, divorce, adoption, new dynasty and historical scenarios.
- **The Argentarius.** Borrow from the bank, lend, invest in public contracts and sea voyages, trade grain and keep money safe in a temple.
- **A matchmaker.** Order candidates to measure in the "Arrange Betrothal" window.
- **Provincial governorships.** Decide how your pro-magistrates govern, and risk a trial.
- **Six languages.** Spanish, Portuguese, English, Russian, French and German.

Stemma does **not** turn on the game's mod mode, so game and Steam achievements keep working.

## Quick start

1. Install [Node.js](https://nodejs.org/) 22 or newer (Windows).
2. In Steam, open the game's **Properties** and add this **Launch option**: `--remote-debugging-port=9222`
3. In this folder, run `node stemma.mjs` and leave the window open.
4. Start the game and load your save. Press **F8** to show or hide the panel.

Something not working? See the [troubleshooting guide](docs/guia.md#problemas-frecuentes).

## Before you use it

- Back up your saves before big changes, and save after making them.
- Achievements unlocked through Stemma also unlock on Steam and can't be removed there. You can turn this off in the Achievements section.
- Remove the launch option when you're not using Stemma.

## Documentation

The documentation is in Spanish.

- [Guide](docs/guia.md): every panel section, the extras and troubleshooting.
- [Warnings](docs/avisos.md): achievements, backups and the debugging port.
- [Strategy](docs/estrategia.md): how to build a rich family with strong heirs.
- [Game mechanics](docs/README.md): how the game works under the hood.
- [Development](docs/desarrollo.md): how Stemma is built.
