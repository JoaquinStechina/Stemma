# General mechanics

## Social class

A family's class depends on its **wealth** (money + value of properties), except senators, who are always class 7. `[5485]`

| Class | Wealth |
|---|---|
| 0 | under 1,100 |
| 1 | 1,100 – 2,500 |
| 2 | 2,500 – 5,000 |
| 3 | 5,000 – 7,500 |
| 4 | 7,500 – 10,000 |
| 5 | 10,000 – 25,000 |
| 6 | 25,000 or more |
| 7 | Senatorial class (always) |

Many options (expensive education, offices) require a minimum class.

## Cost scaling by class

When an event gives or takes **money, prestige or influence**, the value is multiplied by a factor that depends on class `[cfed]`:

```
factor = 1 + max(0, class − 1) / 1.26
```

| Class | Factor |
|---|---|
| 0–1 | ×1.00 |
| 2 | ×1.79 |
| 3 | ×2.59 |
| 4 | ×3.38 |
| 5 | ×4.17 |
| 6 | ×4.97 |
| 7 (senatorial) | ×5.76 |

It applies to event payments and rewards (`applyStatChanges` `[2ee0]`). It does **not** apply to monthly income modifiers (for example, a school's monthly cost), which go as they are. Some events also scale by income (`scaleByRevenue`).

## Calendar and age

- The year has **13 months** (Roman calendar), with different days per month. `[7de9]`
- Age is not stored: it is computed from the birth month and year, in years with decimals. `[9b55]`
- Changing the age amounts to moving the birth year (which is what Stemma does).

## Character skills

Four skills: **intelligence, stewardship, eloquence and combat**.

- **There is no fixed cap**, but many formulas saturate around 27–30 (for example, banquet checks: `100 × (0.45 + skill/50)`, max. 99%).
- To raise a skill, the game compares `random + own_skill/45` (without trait bonuses) against the learning speed: **the higher it is, the harder it is to raise**, and at some point the probability is 0. See [Education](education.md#learning-speed).
- The stewardship of household members raises the manageable **property limit**. `[20e3]`

## Traits

- They are added and removed with the game's own functions (`addTrait` `[a822]`, `removeTrait` `[cc6f]`), which **add or subtract the skill bonuses** of the trait and **remove opposite traits**.
- Some traits are **discoverable** (sexual orientation) and aren't shown until discovered.

### Stackable traits

82 traits have `isStackable` and can be held several times. The copies are stored in the character's `traitStackCount[trait]`; 0 or nothing means one copy.

| Type | Examples |
|---|---|
| Genetic | *Strong*, *Weak*, *Brilliant*, *Simple Minded*, *Attractive*, *Unattractive*, *Giant*, *Short-Statured*, *Deformed* |
| Damage and conditions | *Mangled*, *Severely Mangled*, *Wounded*, *Grievously Wounded*, *Ill*, *Stressed*, *Depressed*, *Malnourished*, *Obese*, *Drunkard*, *Disfigured*, *Stutter* |
| Personality | all |
| Skills and honors | *Veteran*, *Gladiator*, *Horse Rider*, the "Former …" traits (ex-magistrates), military crowns |
| Punishments | *Deserter*, *Barred From Senate*, *Barred from Ludi* |

- **Adding** a trait you already have adds a copy `[a822]`. Each extra copy adds **10%** of the trait's skill bonus (`traitStackMultiplier = 0.1` `[7de9]`): *Strong* (+3.5 combat) ×2 = +3.85, ×3 = +4.2.
- **Removing** a trait subtracts a copy; with a single one, it removes it entirely `[cc6f]`. Some cures remove it entirely at once (`forceClearStack`).
- **Inheritance**: children inherit their parents' copies and, with a 0.9% chance, are born with 1–2 extra copies `[2ff7]`.
- **Effects that aren't skills** (health, fertility, income, expenses): `[4476]` computes a factor ×(1 + copies × 0.1) that only appears in the **breakdown**. The total the game applies uses the trait's value without the copies. That is why stacking *Strong* gives no extra health. It looks like a bug in the game.
- The physician's cost rises with copies of *Wounded* (×5 per copy of *Grievously Wounded*) `[0c3d]`.
- The *Cos Tertivm* achievement requires *Former Consul* ×2 `[3bbd]`.
- Stemma has a **Stackable traits** section to change the copies with the game's functions.

## Multipliers (modifiers)

- They are stored in `current.modifiers[key]` as a list of entries `{ factor, id, end month/year, reason }`. The total value is the **product** of the active ones. `[fc68]`
- Keys: `household_health`, `revenue`, `household_fertility`, `household_expenses`, `household_stewardship`, `job_<trade>`, `property_<type>`, `character_*_<id>`, `pet_*_<id>`.
- The game **caches** the total for about 1 second.
- An entry with no end date is **permanent** (that is how Stemma's factor works).
- For expenses (`*_expenses`), a factor **below 1** is favorable.

## Achievements and mod mode

- Turning on the game's **mods** (DAAPI system) marks the save with `flagUsedMods` and **disables that save's achievements** forever. `setupDAAPI` `[e35e]` does it when the option is switched on, and `addAchievement` `[c391]` sends nothing if `flagEasyMode`, `flagSandboxMode` or `flagUsedMods` are set.
- The mods API (`daapi`) is created by the factory `[6174]`. The game itself uses it in its events with `isDAAPI: false` (for example, frugality `[ea0b]`), and so it doesn't mark the save. Stemma uses it the same way in the Extras section.
- Easy and sandbox modes also prevent unlocking Steam achievements.
- See [Achievements](achievements.md).

## Saving

- Games are saved as files in `Documents\CitizenOfRomeDynastyAscendant\saves` (the main process's `saveGame` IPC). Mods go in `Documents\CitizenOfRomeDynastyAscendant\mods`.
- The **settings, the global achievements list and the saves index** are stored in `localStorage.core` (function `[134d]`).
