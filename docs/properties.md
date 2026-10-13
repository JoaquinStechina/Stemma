# Properties and livestock

Properties are stored in `current.propertyDetails` as a **number of units per type**. There are 22 types in four groups: land, animals, ships, and buildings or estates. `[08e5]`

## Yield

Each unit has a price (`value`) and an income (`revenue`). When selling, 90% is recovered (`saleRate`).

### Land

| Type | Price | Income | Yield |
|---|---|---|---|
| Farmlands | 250 | 1.75 | 0.70% |
| Vineyards | 360 | 2.53 | 0.70% |
| Orchards | 420 | 2.79 | 0.66% |
| Prime Farmlands | 2,700 | 17.25 | 0.64% |
| Prime Vineyards | 3,300 | 21.98 | 0.67% |
| Prime Orchards | 3,900 | 27.03 | 0.69% |

### Livestock

| Animal | Price | Income | Yield |
|---|---|---|---|
| Chicken | 10 | 0.072 | 0.72% |
| Duck | 15 | 0.104 | 0.69% |
| Pig | 26 | 0.202 | 0.78% |
| Donkey | 28 | 0.216 | 0.77% |
| Goat | 32 | 0.230 | 0.72% |
| Sheep | 36 | 0.252 | 0.70% |
| Cattle | 40 | 0.288 | 0.72% |
| **Horse** | **125** | 0.324 | **0.26%** |

- Land and livestock yield about the same (~0.7% of their price); **the horse is the worst investment**.
- Income can be raised with the `property_<type>` multipliers (in Stemma: Multipliers → Properties).

## Manageable limit `[40cf]`

```
limit = group_base × household_capacity
```

| Group | Base |
|---|---|
| Animals | 1.251 |
| Land | 0.45 |
| Buildings and estates | 0.18 |
| Ships | 0.126 |

- The **household capacity** `[20e3]` adds a contribution for each household member `[a37c]` plus the **caretaker's stewardship**, adjusted by class and by the stewardship multipliers (`household_stewardship`, `character_stewardship_*`). Minimum 5.
- The **animal limit is almost 3 times the land limit**, so you can hold many more units.
- **Commercial** properties (merchant ships) have a limit of **0 for senatorial families**.

## Excess properties

- If a property goes over **1.2 times its limit**, the game can trigger events that **take away part of the excess**: for animals, diseases or thefts ("unable to properly care for all of them").
- The probability grows with the square of `units / limit`; it is 25 times lower in easy mode and 10 times lower if the player is under 13.
- There are time margins: from when the excess begins, ~0.33 years pass before the first event, and ~0.25 years between one event and the next. **In war the margins are longer** (~1 year and ~0.75 years).
- The game offers to "sell everything that can't be managed" (action `propertySellExcess`) at 90% of its price.

## In Stemma

The **Household properties** section shows each type with its limit, in yellow if it goes over the limit and in red if it goes over 1.2×. Properties are added **for free**, with no money deducted.
