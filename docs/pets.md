# Pets

Pets are named animals that belong to a family member. They are stored in `current.pets`. They don't give money directly: they serve the household's **health** and **mood**, and they can be **bred and sold**. `[ed26]`

## Skills

| Skill | What it is for |
|---|---|
| **Aptitude** | Speeds up learning of all its skills; recovery from illness, stress and malnutrition; Aesculapian blessing |
| **Vigor** | Pest control; protects against malnutrition. **Raises** the risk that it attacks its owner |
| **Tameness** | Relieves the owner's stress; **lowers** the risk of attack; Aesculapian blessing |

## Benefits

| Effect | Pets | Depends on | What it does | Code |
|---|---|---|---|---|
| Stress relief ("Feel the love") | All | Tameness: `(1 + tameness/25)` | Removes *Stress* or *Depression* from the owner | `[9c81]` |
| Pest control ("Pest free") | Snakes, dogs, cats, ferrets | Vigor: `(1 + vigor/30)` | Household health up to +25%; the pet gains *Hunter* | `[e4e4]` |
| Aesculapian blessing | Only the Aesculapian snake, if the owner is ill | `0.5 + aptitude/45 + tameness/30` | Personal health up to ×2.25, household health up to +42%; the snake gains *Blessed* | `[01af]` |
| Breeding | All | Species (fertility, litter size) | Offspring that can be sold | `[7497]` `[3bb1]` |

## Costs and risks

- **Upkeep**: proportional to `class_factor × 6.543 × 0.18 × species_factor × household expense multiplier`, and half while not an adult. The species factor goes from 0.1 (pigeon, snake) to 1.5 (horse) and **25 (elephant)**. The class factor is the one in [General mechanics](general-mechanics.md#cost-scaling-by-class).
- **Attack on the owner** `[e321]`: probability `(1 + vigor/45 − tameness/25)`; leaves the owner wounded or stressed, with a 20% chance of falling ill.
- The pet can fall ill, get hurt, get stressed or become malnourished `[faaf]` `[9c3d]` `[56ea]` `[524f]`, which lowers its price.

## Aptitude in detail

| Use | Effect | Code |
|---|---|---|
| Learning | All its skills grow ×(1 + aptitude/25) | `[78b0]` |
| Recovering from an illness | ×(1 + aptitude/39.6) | `[faaf]` |
| Shedding stress | ×(1 + aptitude/60) | `[56ea]` |
| Malnutrition | With vigor: the chance of becoming malnourished is divided by 10×(vigor + aptitude) and it recovers sooner | `[524f]` |
| Healing a wound | ×(1 + aptitude/400) (almost nothing) | `[9c3d]` |

## How a pet "learns" `[78b0]`

There are no schools or paid training: its skills rise on their own throughout its life.

```
speed = (1 + aptitude / 25) / 450        ÷1.5 if there is austerity
aptitude rises    if random + aptitude_gain/45  < speed / 7
vigor rises       if random + vigor_gain/45     < speed / 3
tameness rises    if random + tameness_gain/45  < speed / 2  (with an owner)
                                                  speed / 5  (without an owner)
```

- `*_gain` is how much it has risen **above normal for its species** (not counting traits) `[d9f0]`: the more it has improved, the harder it gets.
- **Tameness** rises 2.5 times faster if it has an owner; **aptitude** is the slowest.
- Age does **not** matter.
- It is a slow process: a point every so often.

## Traits

| Trait | How it is obtained | Bonus | Price |
|---|---|---|---|
| *Hunter* | "Pest free" event | +5 vigor, +1 aptitude | ×1.5 |
| *Blessed* | "Aesculapian blessing" event | +2 aptitude | **×100** |
| *Pedigreed* | At birth (0.5%) | — | ×5 |
| Personality (*Mischievous*, *Well Behaved*, *Friendly*, *Loner*) | At birth (75%) | — | — |
| Genetics (*Strong*, *Weak*, *Deformed*) | At birth, uncommon; *Strong*/*Weak* hidden until adult | — | *Strong* ×1.2, *Weak* ×0.7, *Deformed* ×0.6 |
| *Learned Tricks* | **No event gives it** (v1.6.36) | +1 aptitude, +3 vigor, +3 tameness | ×1.7 |
| *Mimics Speech* | **No event gives it** | +1 aptitude, +5 tameness | ×3 |
| *Warrior Spirit* | **No event gives it** | +1 aptitude, +5 vigor, −5 tameness | ×2 |

*Learned Tricks*, *Mimics Speech* and *Warrior Spirit* are defined but no code adds them: they can only be obtained with mods or with Stemma.

Negative traits and their effect on price: *Ill* ×0.35, *Wounded* ×0.4, *Mangled* ×0.4, *Malnourished* ×0.8, *Blind* ×0.8, *Deaf* ×0.8, *Disfigured* ×0.7, *Accident Deformed* ×0.7.

## Species

| Species | Group | Rarity | Price | Upkeep (factor) | Life expectancy | Litter |
|---|---|---|---|---|---|---|
| Molossian (dog) | dogs | uncommon | 120 | 0.4 | 8 | 3 |
| Shaggy (dog) | dogs | local | 25 | 0.25 | 13.2 | 3 |
| Cave canem (dog) | dogs | uncommon | 35 | 0.25 | 13.2 | 3 |
| Maltese (dog) | dogs | exotic | 480 | 0.4 | 13.3 | 2 |
| Lab (dog) | dogs | uncommon | 50 | 0.3 | 12.6 | 3 |
| Greyhound (dog) | dogs | local | 40 | 0.3 | 13.2 | 3 |
| Mau (cat) | cats | exotic | 210 | 0.24 | 15 | 4 |
| Orange (cat) | cats | uncommon | 60 | 0.2 | 15 | 4 |
| Polecat (ferret) | ferrets | uncommon | 40 | 0.24 | 6 | 5 |
| Elephant | elephants | rare | 13,000 | 25 | 50 | 1 |
| Aesculapian snake | snakes | local | 35 | 0.1 | 25 | 5 |
| Barbary ape | monkeys | exotic | 300 | 0.4 | 25 | 1 |
| Maremma (horse, 2 coats) | horses | uncommon | 150 | 1.5 | 25 | 1 |
| Peafowl (peacock) | birds | exotic | 1,300 | 0.2 | 15 | 4 |
| Pigeon | birds | local | 15 | 0.1 | 6 | 3 |
| Parakeet | birds | exotic | 750 | 0.4 | 15 | 2 |
| Goldfinch | birds | uncommon | 90 | 0.15 | 15 | 3 |
| Blackbird | birds | uncommon | 90 | 0.15 | 12 | 3 |

## Recommendations

- **Tameness** is the most useful skill (more stress relief and fewer attacks).
- An **Aesculapian snake** is cheap (35), costs almost nothing to keep, lives 25 years, controls pests and can bless its ill owner; if it receives *Blessed*, it is worth ×100.
- For selling, *Blessed* (×100) and *Pedigreed* (×5) pay the most; keeping the pet healthy stops its price from dropping.
