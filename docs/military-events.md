# Military events

While Rome is at war and your character serves in it, eight events with a decision tree can appear. In almost all of them you can win a **crown** (a military honor with its trait and its achievement), and in several **you can die**. Stemma has a **Military events** section with all the trees, and it shows advice next to the event's window when one appears.

## The war

The start and end of the war are in `[ca8b]`.

- It **starts** from year 10 of the game, if there is no war and more than 2 years have passed since the last one, between months 1 and 9. The probability per check is `1/(13 × 7.56)`, ×9 if your character is a military tribune, praetor, propraetor, consul or proconsul.
- It **lasts** 2 to 6 years; with a 10% chance, up to 5 more years.
- It **ends** in the planned year (from month 2, 4/13 per check) and gives household fertility ×1.25 for 3 months.
- Several event endings **bring the end forward** (`endWar`): they set the end year to the current one.
- Others **end your military service** (`endTerm`, from `war/conscription` `[dab4]`).

## How rewards scale

The figures in the events are base values. When applied (`applyStatChanges` `[2ee0]`):

```
money       × income             (if the event asks for it)   × class factor
influence   × income / 8         (if the event asks for it)   × class factor
prestige    × income / 10        (if the event asks for it)   × class factor
```

`income` is the monthly income (`[14ef]`: yearly income / 13, between 0.9 and 20) and the class factor is the one in [General mechanics](general-mechanics.md#cost-scaling-by-class). Almost all military events scale prestige and influence, not money. With maximum income and senatorial class, prestige comes out ×11.5 and influence ×14.4.

## Summary

| Event (title) | Who | Crown | Best path | For the crown |
|---|---|---|---|---|
| *War: At Battle* `[2b96]` | soldier | Civica | "To each their own": nothing happens | 9% crown, **70% death** |
| *War: At Sea* `[c393]` | commander | Rostrata | Agree → Wait → Curb → Dig → artillery: **50%** crown | same |
| *At War: Campaign* `[d03a]` | both | Castrensis | Soldier: Stay → "Destroy their camps!": **50%**, no risk. Commander: any → reinforcement → attack (no crown) | same |
| *At War: Seige* `[15d0]` | soldier | Muralis | "Burn incense": 5% death, 13.5% crown | 27% crown, 10% death, you lose an eye and a hand |
| *For my Legionnaires* `[7ab4]` | commander | Obsidionalis | Don't go to the senate, or "I did my part": nothing happens | 40% crown, **60% death** |
| *A Call for Help* `[6aeb]` | commander | Grass* | "Rush to aid" and, if it goes badly, retreat: no risk | depends on your skills |
| *At War: Invasion* `[b782]` | commander | Triumphalis | → hire → transfugi: **58.8%** crown, 75% *Severely Mangled* | same |
| *Triumphator* `[7837]` | after the Triumphalis | — | Paintings → **Ivory** → … → Games and a Banquet | — |

\* The game gives the trait and the achievement of the Corona Obsidionalis.

## Details

### War: At Battle (Corona Civica)
- "Assist them!" → "Stand my ground": **70% death**. If you survive, 30% crown; overall, **9%**.
- "Let the fellow soldier die a martyr": leaves you *Depressed*.

### War: At Sea (Corona Rostrata)
- Attacking in the storm, or any path other than Curb → Dig → artillery, is a **sure defeat**: −2,000 prestige, −1,500 influence and a wound (*Mangled* or a leg).
- Heavy artillery wins 50% of the time (+2,500 / +2,800 and the crown). **You always lose a hand.**
- If the character no longer has legs, the wound is `severlyMangled`, a misspelled trait that does not exist, so there is no wound.

### At War: Campaign (Corona Castrensis)
- **Soldier**: "Stay and help set up camp" → "Destroy their camps!" gives a 50% crown and you never die. Volunteering has a **50% chance of death** before reaching that choice.
- **Commander**: the first option makes no difference. "Send reinforcement" → "Attack the enemy camps!" gives +3,000 / +1,500; refusing the reinforcements or ignoring the camp subtracts.

### At War: Seige (Corona Muralis)
- Carrying the wounded friend: **70% death**.
- If you are captured, **"Carefully sneak past the guard" is sure death**; strangling the guard, 10%.
- For the crown: accept the treaty (you lose an eye and a hand, you are left *Wounded*) → go to battle → leave the corpses ("Let them hang"): 30%.
- If you can escape on horseback, nothing happens.

### For my Legionnaires (Corona Obsidionalis)
- Taking the case to the senate and "Continue to plead" or paying out of your own pocket (−76,000 money) forces a mission on you: waiting gives a 40% crown and **60% death**; attacking or joining the weak army is **sure death**.
- "I did my part" or ignoring the men: nothing happens.

### A Call for Help (Grass Crown)
- Charging succeeds if `random + (combat + eloquence)/100 > 0.8`; with *Strong*, always. Splitting the troops, if `random + (intelligence + combat)/100 > 0.8`.
- If it fails, retreating costs only −20 / −20. Fighting on needs `random/3 + (combat + eloquence)/120 > 0.95`; if it fails, you can flee (deserter or death) or hold on (deserter if `random + combat/100 > 0.8`, otherwise death).
- Deserter: −2,000 / −2,000 and **5 years of exile**.

### At War: Invasion (Corona Triumphalis)
- The first option makes no difference: the best path is always to hire someone to kill the inventor and make a deal with the *transfugi*. If they don't answer, write to them personally (−6,700 money).
- On winning: 75% chance of ending up *Severely Mangled*; the crown arrives 58.8% of the time overall.
- Persevering without the deal or talking to the soldiers ends in *Depressed* or big losses (up to −7,500 prestige and −6,500 influence).
- Winning the crown later triggers the *Triumphator* parade.

### Triumphator (parade)
- **Ivory** paintings and models cost more (−12,000 and −9,000 money), but the parade gives **+30,000 / +25,000** instead of +3,000 / +2,500 with wood.
- Clemency: +17,000 / +19,000; sacrifice: +19,000 / +15,000.
- "Games and a Banquet" (−60,000 money, +29,000 / +23,000) gives the most.
- At the end: +15,000 money and a plot for your mansion.

## In Stemma

The **Military events** section shows each tree with the probability and effects of each option, already scaled for your game, and marks the recommended one with ★.

The recommended one is the one with the least risk of dying; with equal risk, the one with the most crown, fewer wounds and more prestige and influence. When there is a path with a higher chance of a crown, a "Going for the crown" line also appears. The data is in `src/war/events.js`.

### Force the outcome

The game decides the random element of a step at the same moment the option leading to it is pressed: the event's method runs synchronously (`processInteractionModalAction` `[8be1]` → `[bc91]`) and calls `Math.random()` once or twice. In the advice, each option that leads to a step with a random element has **🎲 Force** buttons, one per possible outcome (for example, "☠ death" or "👑 Corona Civica"). When you press one, Stemma picks that option in the game with the rolls fixed for that outcome; later calls to `Math.random()` are random again.

- The rolls for each branch are in `roll` inside `src/war/events.js`, one for each call the method makes.
- They were checked by running each event's real code with a simulated state: all 37 branches come out as expected and use exactly those rolls.
- Everything else is done by the game: death, wounds, rewards and achievements, which also unlock on Steam as if it had come out by luck.
- In the Grass Crown event, the possible outcomes depend on the character's skills. With high skills, defeat is not possible and does not appear.
