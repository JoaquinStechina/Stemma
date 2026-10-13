# Documentation

## Stemma

| Document | Contents |
|---|---|
| [Stemma guide](guide.md) | The panel, every section in detail, and troubleshooting |
| [Warnings](warnings.md) | Debugging port, Steam achievements, backups |
| [Development](development.md) | How it works, code structure, adding sections and languages, game updates |

## Mechanics of Citizen of Rome - Dynasty Ascendant

Notes on how the game works internally, taken from its code (version **1.6.36**) while Stemma was being developed. They help you play better and keep Stemma up to date.

| Document | Contents |
|---|---|
| [Strategy](strategy.md) | How to play to get characters with high skills and a rich family: spouse and genetics, education, personality and trades, money, inheritance, health |
| [General mechanics](general-mechanics.md) | Social class, cost scaling, calendar and age, skills, traits, multipliers, saving |
| [Education](education.md) | Stages (ludus, grammaticus, rhetor, philosophy, apprentice), options and costs, learning speed, intelligence, judicial or deliberative rhetoric |
| [Jobs](jobs.md) | Best-paid trades, magistracies, which trades benefit the family, a physician at home, shared-trade bonus, recruitment |
| [Pets](pets.md) | What they are for, aptitude, vigor and docility, learning, traits, prices, species |
| [Properties and livestock](properties.md) | Yield of land and animals, manageable limit, penalty for exceeding it |
| [Achievements](achievements.md) | Where they are stored, groups, relation to Steam |
| [Military events](military-events.md) | War, how event rewards scale, decision trees of the 8 crown events: best path, risk of death and chance of a crown |

## How to read these notes

- **Formulas** are copied as they appear in the code and explained in words. The webpack module identifier where they live goes in square brackets (e.g. `[f0c5]`), so you can check them again if the game updates.
- When something **could not be confirmed** (for example, exactly how often an event is processed), it says so.
- The names of traits, jobs and properties are left **in English**, as the game shows them.
- Text with amounts of money, prestige or influence gives **base values**: the game multiplies them by the family's class (see [General mechanics](general-mechanics.md#cost-scaling-by-class)) and, in many events, by your income (see [Military events](military-events.md#how-rewards-scale)).
