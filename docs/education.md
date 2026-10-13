# Education

## Summary

- The **type of school almost never changes the title** you get at the end: it changes **how fast the child gains skills** while studying (and the cost, prestige and influence). The exception is the **rhetor**, where the choice decides the title.
- **No course requires intelligence**: the requirements are age, previous title and the family's class.
- Initial payments, prestige and influence are multiplied by the [class](general-mechanics.md#cost-scaling-by-class) (×5.76 for senators). The monthly cost is not.
- Each title **replaces** the previous one (Literate → Educated → Orator), except *Philosopher*, which **adds** to the orator one.

## Stages

### 1. Ludus litterarius → *Literate* `[3a31]` `[5686]`

You can enroll between ages **4 and 6**; it ends at **9**.

| Option | Requirement | Initial payment | Cost/month | Prestige | Influence | Learning |
|---|---|---|---|---|---|---|
| Private tutor | class ≥ 3 | 15 | −32 | +10 | +20 | ×5 |
| Renowned ludus | class ≥ 2 | 9 | −15 | +1 | +5 | ×3.5 |
| Nearest ludus | — | 3 | −7 | — | — | ×2 |
| "Continue with their moral education" | — | — | — | — | — | ×1 |

The first three give the same title. **If they aren't enrolled before age 6, the option disappears**, and without *Literate* they can't go to the grammaticus (nor later to the rhetor or to philosophy).

### 2. Grammaticus → *Educated* `[ed1b]` `[e2851]`

Between ages **9 and 10** (requires *Literate* and class ≥ 2); it ends at **12**.

| Option | Requirement | Initial payment | Cost/month | Prestige | Influence | Learning |
|---|---|---|---|---|---|---|
| The most renowned | class ≥ 4 | 100 | −100 | +20 | +50 | ×8 |
| A reputable one | — | 50 | −50 | +10 | +20 | ×5 |
| Any | — | 40 | −30 | +5 | +10 | ×3 |

While studying with a grammaticus, every time eloquence rises there is a 20% chance of an extra point.

### 3. Rhetor → *Deliberative Orator* or *Judicial Orator* `[007e]` `[3853]`

Between ages **12 and 13** (requires *Educated* and class ≥ 3); it ends at **16**.

| Option | Requirement | Initial payment | Cost/month | Prestige | Influence | Learning | Title |
|---|---|---|---|---|---|---|---|
| Deliberative rhetoric | class ≥ 3 | 150 | −120 | +40 | +45 | ×9.75 | Deliberative Orator |
| Judicial rhetoric | class ≥ 4 | 180 | −120 | +35 | +40 | ×8.75 | Judicial Orator |

### 4. Philosophy → *Philosopher* `[a955]` `[6590]`

Between ages **16 and 17** (requires being an orator and class ≥ 4); it ends at **20**. A single option: going to **Greece**.

- Initial payment 1,000, cost −250/month, +200 prestige, +500 influence.
- Learning ×10.08, and also ×1.35 for being away from home.
- **Dropping out** costs −500 prestige and −1,000 influence (scaled).

### Alternative: apprentice to a trade `[403b]` `[e902]`

From age **7**. Learning ×9. At the end they start in that job at a random level between 1 and `1 + intelligence/18` (maximum `max_level/1.5`), and with an extra if **the father has the same trade**. It gives no education title.

### Dropping out midway

Taking a child out of a course costs −1 prestige and −5 influence (scaled by income), except philosophy (see above).

## Titles

| Title | Intelligence | Eloquence | Stewardship | Combat | Other |
|---|---|---|---|---|---|
| Literate | +0.5 | +3 | +2 | +1 | — |
| Educated | +1 | +4 | +3 | +2 | — |
| Deliberative Orator | +2 | +6 | +4 | +3 | income ×1.02, expenses ×1.05, fertility ×1.6 |
| Judicial Orator | +2 | +5 | +5 | +2 | income ×1.04, expenses ×1.06, fertility ×1.4 |
| Philosopher | +3 | +4 | +3 | +3 | income ×1.03, expenses ×1.08, fertility ×1.1 |

Opposites: Literate, Educated and the two orators exclude each other; Philosopher only excludes Literate and Educated.

## Learning speed

Every so often, each character has a chance to gain a point in each skill `[f0c5]`:

```
speed = (5.4 + intelligence / 6.543) / 180
speed ×= school (tables above)   ×1.35 if away from home   ÷1.5 if there is austerity
if age ≥ 25: speed ÷= age
stewardship rises if  random + stewardship/45 < speed / 1.8
eloquence rises   if  random + eloquence/45   < speed / 1.5
combat rises      if  random + combat/45      < speed / 2
intelligence rises if random + intelligence/45 < speed / 3
```

(The skill being compared is the character's own, **without** trait bonuses `[a396]`: titles, *Strong*, etc. do not slow learning. The bonuses are stored added into `skills`, because `addTrait` `[a822]` adds them when adding the trait; `[a396]` subtracts them to get the character's own skill.)

Consequences:

- Order of speed: **eloquence > stewardship > combat > intelligence**.
- The higher a skill is, the less likely it is to rise; at some point it becomes impossible. That **ceiling is proportional to the speed**: the school and intelligence decide **how far** it gets, not just how fast.
- Adults (25+) barely learn.
- It could not be confirmed how often exactly this calculation runs (it depends on the game's batch processing), so no absolute ceilings are given.

## Influence of intelligence

Intelligence is part of the base of the formula, so it **speeds up all four skills**:

| Intelligence | Speed compared to intelligence 0 |
|---|---|
| 0 | ×1.00 |
| 5 | ×1.14 |
| 10 | ×1.28 |
| 15 | ×1.42 |
| 20 | ×1.57 |
| 30 | ×1.85 |

- It feeds back on itself: intelligence also rises with studies (it is the slowest), and each point speeds up the rest.
- In trade apprenticeships, it raises the job's starting level (small effect).
- **Tip**: raising a child's intelligence **before the ludus** (with Stemma: Family → Intelligence) improves their whole education.

## Judicial or deliberative rhetoric?

**In general, deliberative is better**, especially for families pursuing a political career.

- **Elections**: in the Vigintisexviri election, the base probability is `(stewardship + intelligence)/80 + eloquence/45` (max. 75%), plus bonuses for influence; when campaigning `[0439]` trait bonuses are added. A point of **eloquence is worth almost double** one of stewardship. With the skill and title bonuses (deliberative +7.5%, judicial +6%), deliberative gets about **2.5 points more** probability in each election.
- **It learns faster** during those 4 years (×9.75 versus ×8.75) and eloquence is the one that rises most.
- **More fertility** (×1.6), **cheaper**, and slightly more prestige and influence at the start.

**Judicial** only if the child won't go into politics and you are after money: **+4% income** instead of +2%, and one more point of stewardship (raises the property limit a little).

Both give the same access to philosophy, the same bonus as a scribe (×1.4) and the same bonuses in teaching trades.
