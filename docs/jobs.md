# Jobs

There are 90 jobs, of six types: `apprentice` (trades you learn), `random`, `appointed` (appointed: civil servants, senator, priests), `elected` (magistracies), `appointedMagistrate` (pro-magistracies) and `military`. `[0262]`

**No job gives more health or longer life for doing it.** The benefits are the ones below.

## Income from a job `[522c]`

```
income = base × (1 + level / min(13.5, max_level)) × multiplier
multiplier = job_<trade> × income (modifiers and traits) × skills   [7ec1]
skills     = 1 + Σ (skill × trade weight) / 135
```

- **Each level adds 7.4% of the base wage** (1/13.5), with no cap up to the maximum level. That is why the **maximum level matters more than the base wage**: at maximum level you earn `base × (1 + max_level / 13.5)`.
- **Skills have no cap** in this formula. With 30 in the trade's skills, the wage is multiplied by 1.4–2.1; with much higher skills, by far more.
- Whoever is dead, has moved out, is away or is missing earns nothing. In easy mode, ×1.25.
- *Vestal Virgin* has maximum level 0: the formula gives `0/0` and the game pays her **0**.

## Best-paid trades

Sorted by the wage at maximum level (without multipliers or skills). The last column adds 30 in the skills the trade uses.

| Trade | Base | Max. level | At level 20 | At max. level | Max. + skills at 30 | Skills (weight) |
|---|---|---|---|---|---|---|
| Lawyer | 20.1 | 200 | 49.8 | **317.7** | **656.6** | intelligence 1.8 · eloquence 3 |
| Figure Painter | 9.4 | 300 | 23.4 | 218.7 | 366.9 | intelligence 2 · eloquence 1.05 |
| Physician | 15.7 | 150 | 38.9 | 190.1 | 325.2 | intelligence 2 · eloquence 1.2 |
| Philosophy Tutor | 16.3 | 125 | 40.5 | 167.4 | 316.2 | intelligence 2.5 · eloquence 1.5 |
| Rhetor | 15.3 | 125 | 37.9 | 156.5 | 295.6 | intelligence 2.5 · eloquence 1.5 |
| Grammaticus | 12.2 | 125 | 30.3 | 125.2 | 236.5 | intelligence 2.5 · eloquence 1.5 |
| Bestiarius | 2.6 | 625 | 6.5 | 123.1 | 205.2 | intelligence 1 · combat 2 |
| Jeweler | 6.3 | 250 | 15.6 | 122.5 | 258.7 | intelligence 1.5 · stewardship 2 · eloquence 1.5 |
| Painter | 6.3 | 250 | 15.6 | 122.5 | 205.6 | intelligence 2 · eloquence 1.05 |
| Theater Performer | 2.8 | 500 | 6.9 | 106.1 | 200.5 | intelligence 1.5 · eloquence 2.5 |
| Barber | 2.5 | 500 | 6.2 | 95.5 | 146.5 | intelligence 1.2 · eloquence 1.2 |
| Judge | 18.8 | 50 | 46.7 | 88.6 | 157.5 | intelligence 1.5 · eloquence 2 |
| Scribe (civil servant) | 15.7 | 50 | 38.9 | 73.8 | 147.6 | intelligence 1.5 · stewardship 1 · eloquence 2 |
| Trader | 5.6 | 150 | 14.0 | 68.4 | 136.8 | intelligence 1 · stewardship 2 · eloquence 1.5 |
| Clerk (civil servant) | 14.4 | 50 | 35.8 | 67.9 | 135.8 | intelligence 1.5 · stewardship 1 · eloquence 2 |
| Litterator | 6.6 | 125 | 16.4 | 67.8 | 128.1 | intelligence 2.5 · eloquence 1.5 |
| Stone Mason | 5.0 | 150 | 12.5 | 60.8 | 101.4 | intelligence 1 · combat 2 |
| Lictor (civil servant) | 12.6 | 50 | 31.2 | 59.1 | 98.4 | intelligence 1 · combat 2 |
| Herald (civil servant) | 10.7 | 50 | 26.5 | 50.2 | 106.0 | intelligence 1 · stewardship 1 · eloquence 3 |
| Carpenter | 5.0 | 100 | 12.5 | 42.2 | 88.7 | intelligence 1.5 · stewardship 1.2 · combat 1 · eloquence 1.25 |
| Secretary | 10.2 | 40 | 25.3 | 40.4 | 85.2 | intelligence 1.5 · stewardship 1.5 · eloquence 2 |

Further down, with less than 35 at maximum level: Scribe (trade), Haruspex, Cobbler, Clerk (trade), Blacksmith, Weaver, Victimarii, Shepherd, Wet Nurse, Farm Hand and Laborer. 33 of the 90 jobs pay money; the offices give prestige and influence (see below).

- *Judge* and the civil servants pay a lot **from the start** (at level 20, *Judge* is second), but they stay at level 50.
- *Bestiarius*, *Theater Performer* and *Barber* have a tiny base wage and huge maximum levels: they only pay off at very high levels. *Theater Performer* also **subtracts** prestige and influence.
- *Physician* is third and also protects the family's health (see below).

## Leveling up `[904c]`

At each check, the level rises by 1 with probability:

```
(1 + intelligence/5) / 13 / 5 / (level/5, minimum 1) × multiplier_without_modifiers / 3
```

- `multiplier_without_modifiers` is the one above without `job_<trade>` or the income one: the trade's traits and skills.
- **Each level costs more than the last** (the probability drops in proportion to the level), so reaching 200 or 300 takes a very long time. **Intelligence** and the trade's skills speed it up a lot. *Ambitious* ×1.25; *Content* ÷1.25.
- Reaching the maximum level (if it is 10 or more) earns the `topBoss` achievement.
- The function that sets the level limits it to `[0, max_level]` `[6cf7]`. In Stemma: Family → Job level → **Max**.

## Magistracies and offices: prestige and influence

They give no money, but they do give prestige and influence **every month**. The game adds up those of **all household members** with a job:

```
prestige/month  += job_prestige   × (1 + 2 × level / max_level)
influence/month += job_influence  × (1 + 2 × level / max_level)
```

(For offices, which have no levels, `max_level` counts as 10 and the level is usually 0, so the base value applies.) Base values:

| Office | Type | Prestige | Influence |
|---|---|---|---|
| Pontifex Maximus | elected | 1,200 | 700 |
| Consul | elected | 500 | 1,000 |
| Censor | elected | 720 | 360 |
| Pro-Consul | appointedMagistrate | 250 | 600 |
| Praetor | elected | 250 | 500 |
| Aedile | elected | 210 | 400 |
| Pro-Praetor | appointedMagistrate | 150 | 450 |
| Tribune of the Plebs | elected | 150 | 450 |
| Quaestor | elected | 100 | 300 |
| Pro-Quaestor / Pro-Aedile | appointedMagistrate | 100 | 250 |
| Hastatus Prior Tesserarius | military | 10 | 30 |
| Vigintisexviri | elected | 5 | 25 |
| Military Tribune | elected | 5 | 20 |
| Senator | appointed | 5 | 15 |

- When leaving the office a "former" trait remains (*Former Consul*, etc.). **Having been a magistrate gives +7.5% in elections** `[0439]`.
- *Theater Performer* is the only trade that **subtracts** prestige and influence.

## Trades that benefit the family

| Trade | Benefit to the family | Condition | Code |
|---|---|---|---|
| **Physician** | Nobody in the household suffers the "Really Sick! / Really Injured!" event (an illness or wound that **gets worse** and forces you to pay a doctor or take a risk) | They live at home, are not away and are healthy | `[0c3d]` |
| **Physician** or **Wet Nurse** | Some bring **household health ×1.0–1.5** ("and their Expertise") | Only game-generated characters (e.g. marriage candidates), ~5% | `[6d52]` |
| **Magistrates and priests** | Their monthly prestige and influence are added to the family's | Held by any household member (alive and not moved out) | monthly prestige/influence calculation |
| **Any shared trade** | Income multiplier for that trade (see below) | ≥2 people and >⅓ of those who work | `[af06]` |

### Shared-trade bonus `[af06]`

- It counts household members who work in a trade of type `apprentice` or `appointed` (elected and military offices don't count, nor does anyone busy, away, missing or at war).
- If a trade is held by **at least 2 people** and **more than a third** of those who work, that trade gets a `job_<trade>` multiplier.
- It starts at ×1 and rises **+0.05 every 5 years** (+1% a year), with a cap of ×5 (unreachable in practice).
- Real example: *Painter* after ~15 years → ×1.16.
- It pays off with well-paid trades (two *Lawyers*, two *Physicians*…).

### When looking for a spouse `[6d52]`

Characters the game generates can bring, with some probability, a modifier that applies to the household while they live in it:

- *Physician* or *Wet Nurse*: household health ×1.0–1.5.
- *Greedy* or stewardship > 15: household expenses ×0.9–1.0.
- With a trade: ±20% on their trade's income.

They can be seen in Stemma under Multipliers → Active now.

## Downside: recruitment in war `[dab4]`

- In war, whoever is **Consul, Pro-Consul, Praetor, Pro-Praetor or Military Tribune** is **always called to lead the legions and cannot evade it**.
- The rest of the males aged 16 to 46 can be recruited at random (more likely with more combat, less with age). Those who are sick, wounded, maimed, blind, etc. cannot be recruited.
- When a relative is recruited, the household gains +20 influence and +20 prestige (scaled).

## Events specific to a trade (only for whoever practices it)

| Trade | Event | Code |
|---|---|---|
| Physician | "Mysterious Illness": investigation; if it goes well, +400 money, +60 influence, +40 prestige (scaled) | `[jobs/common/physician]` |
| Stone Mason | 70% chance to shine in the *Ludi Plebeii* wrestling | `[3ca9]` |
| Jeweller | Advantage in the *Ludi Apollinares* archery | `[c911]` |
| Craftsmen (Blacksmith, Carpenter, Cobbler, Jeweller, Painter, Stone Mason, Bestiarius) | "A good opportunity": chances to earn money | `[1624]` |
| Teaching trades | "Education": accepting pupils (refusing lowers level and reputation) | `[jobs/common/education]` |
| Magistrates | Office events (the consul's floods, the aedile's games, etc.) | `[election/*]` |

## Recommendations

- **Family health**: a **physician son who keeps living at home**.
- **Political power**: have any relative hold a **high magistracy** (Consul, Pontifex Maximus), knowing that in war they will go to the front.
- **Long-term money**: **two or more relatives with the same well-paid trade**, for example lawyers.
