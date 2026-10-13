# Stemma guide

How each part of the panel works and what to keep in mind when using it. To install it, see the [README](../README.md#quick-start).

## The panel

- **F8** shows or hides the panel.
- **Move:** drag the title.
- **Resize:** from any edge or corner. If the panel is wide, the sections are laid out in columns.
- **Sections:** click a section's name to collapse it; reorder them by dragging their header or with ▲▼.
- **Blocks:** inside sections, blocks (traits, property groups, achievement groups, events…) also collapse with a click on their title.
- **⊟ / ⊞** collapse or expand everything at once; **↺** resets position, size and order.
- **Languages:** Spanish (Argentina), Portuguese (Brazil), English, Russian, French and German, with the flags in the header. The names of traits, jobs and properties come from the game, which only has them in English.
- **Values:** type them in (Enter applies, Esc cancels) or change them with the quick buttons.

Language, position, size, order and what is collapsed are remembered between sessions. **Save the game** after making changes so they are kept.

## Resources

Money, influence and prestige of the dynasty.

## Family

Pick a household member in the dropdown and change:

- **Age.** The game works it out from the birth date (13-month year), so Stemma moves the birth year. Making someone much older raises their chance of dying.
- **Skills:** intelligence, stewardship, eloquence and combat. In most of the game's formulas, around 27–30 already reaches the maximum. The exception is **wages**, which keep rising with skills (see [Jobs](jobs.md#income-from-a-job-522c)).
- **Job level**, with a button to set it to the maximum for their trade.
- **Traits.** They are added and removed with the game's own functions, so they add or subtract their skill bonuses and remove opposite traits.

## Stackable traits

Some traits can be held several times (*Strong*, *Veteran*, personalities, wounds…). This section shows how many copies the chosen character has of each, with + and −, and the skill bonus they give.

- Each extra copy adds **10%** of the trait's skill bonus.
- The game does **not** apply the copies to health, fertility or income ([details](general-mechanics.md#stackable-traits)).
- With 0 copies the trait is removed.

## Pets

Age, aptitude, vigor, tameness and traits of each household pet. What each skill does: [Pets](pets.md).

## Household properties

The 22 properties (land, animals, ships and estates) with their manageable limit. The limit is marked **yellow** if you go over it and **red** if you go over 1.2 times the limit.

- They are added **for free**, with no money deducted.
- Above 1.2 times the limit, the game can cause thefts or diseases that take part of them away ([details](properties.md#excess-properties)).

## Multipliers

A Stemma factor for health, income, fertility, expenses, stewardship, each job and each property, for the household or for a character or pet.

- The factor is **permanent**, is saved with the game and is multiplied with the game's own.
- For "Expenses" you want a factor **below 1** (0.5 = half the expenses).
- "Active now" shows every multiplier in effect, the game's and Stemma's.

## Achievements

Mark or remove achievements, grouped as in the game, with a search box, a filter (all, unlocked, locked) and a counter.

- **"Unlocked"** changes the game's global list (the one on its achievements screen). **"This playthrough"** is saved with the game.
- **"Also unlock on Steam"** (on by default): when you mark an achievement, or add with Stemma a trait that has an achievement (crowns, wounds, *Veteran*, *Pedigreed*…), it also unlocks on Steam. **Steam achievements cannot be removed.**
- **"Send obtained ones to Steam"** unlocks on Steam every achievement in the game's list, for example those you marked earlier only in the game.
- Removing an achievement only removes it in the game.

Details: [Achievements](achievements.md#in-stemma).

## Military events

When Rome is at war, 8 events with a decision tree can appear. In almost all of them you can win a crown, and in several you can die.

- **Military events section:** the full tree of each event, with the chance of dying and of winning the crown, the wounds and the rewards of each option, using the real figures from your game.
- **Advice in the game:** when one of these events appears, a box is shown next to its window with what happens in each option, and the recommended one is marked with ★ in the game too. If there is a path with a higher chance of a crown, a "Going for the crown" line appears. It can be turned off with the section's checkbox.
- **Force the outcome:** on options with a random element, **🎲 Force** buttons appear, one per possible outcome (crown, victory, death…). When you press one, Stemma picks that option with the roll that gives that outcome. The game does the rest, including achievements, which also unlock on Steam.

The recommended option is the one with the least risk of dying; with equal risk, the one with the highest chance of a crown, fewer wounds and more prestige and influence. Details and the best path for each event: [Military events](military-events.md).

## Extras

What the [official example mods](https://github.com/CitizenOfRomeDynastyAscendant/example-mods), Prahlad's [theme mod](https://github.com/prahlad-swarnkar/CORmods) and peritiSumus's [bank and matchmaker](https://github.com/peritiSumus/CoR-Mods) do, but from Stemma.

Turning mods on in the game disables the save's achievements forever. Stemma does not turn them on: it uses the same functions the game itself uses internally, so **the game's and Steam's achievements stay active** ([details](general-mechanics.md#achievements-and-mod-mode)).

Each option can be used from the panel or **from the game's interface**, as in the original mods:

- **On each character:** Play as, Divorce and Give for adoption buttons, only on those who can use them.
- **In the "Arrange Betrothal" window:** the Matchmaker button.
- **On the main screen:** Argentarius, Theme, New dynasty and Scenarios buttons.
- The buttons open **game windows**, with the costs next to each option and its "You may not be able to afford this" warning if you can't pay.
- In the **"Buttons in the game"** block you choose which ones to show; all are on by default.
- The buttons are saved with the game. **Without Stemma connected they are visible but do nothing** (the game does not hide them), and they work again when it connects.

| Block | What it does |
|---|---|
| **Theme** | 20 color themes or the game's own, and a button for the game's **dark mode** (the same setting as in Settings). Light: *Green*, *Mono Mix* and *Vestalia* (from Prahlad's mod), *Imperial Purple*, *Marble & Gold*, *Pompeian Red*, *Mare Nostrum*, *Olive Grove*, *Legion* and *High Contrast*. Dark (marked with ☾): *Saturnalia*, *Nox*, *Vesuvius*, *Catacombs*, *Tyrian Night*, *Sacred Grove*, *Bronze Age*, *Neptune* and *High Contrast Dark*. All are readable with or without dark mode. Stemma remembers the chosen theme. |
| **Play as** | You take control of another living character, from the household or outside it. Their household becomes yours and your current character stays in the game. |
| **Divorce** | Separates a couple in the household. |
| **Give for adoption** | A child up to 15 years old, with no partner, who is not studying or away on a trip, leaves the family. As in the mod, the game records it as a death and shows the funeral window. |
| **New dynasty** | Founds a branch with another nomen, cognomen and heritage (plebeian, *novus homo*, patrician or freedman), with the same prestige. You and your descendants who carry your surname move to it; the rest of the family keeps theirs. The original mod, by contrast, renames the whole dynasty. |
| **Scenarios** | You start with the family of Julius Caesar (661 A.U.C.), Marcus Agrippa (716) or Marcus Antonius's mother (683). The date, money, influence and properties become those of the scenario. Your current family stays in the game, but is no longer your household. In Agrippa's scenario, at age 25½–26½ the window for the marriage with Attica appears, as in the mod (in the panel, if you turn off the Scenarios button). |
| **Argentarius** (bank and investments) | A button on the main screen with the bank, three historical ways to invest, the deposit at the temple of Castor and grain; see [Argentarius](#argentarius). |
| **Provincial governorships** | No button: when the Senate appoints someone in your household as a pro-magistrate, you choose how they govern; see [Provincial governorships](#provincial-governorships). |
| **Matchmaker** | It is in the game's **"Arrange Betrothal"** window: the rings button, next to "Pay to look for other matches". It opens a made-to-measure order: you pay the matchmaker's fee (5% of your money, minimum 20,000) and an **extra per candidate** for each thing you ask for: more candidates (3 to 6), age (free), origin (*novus homo* or patrician), a minimum skill in each of the 4 (10+ to 30+), up to 2 traits (34 to choose from: good genetics, education, skills and personalities; the list has a scroll bar) and "no bad traits". The price on the pay button updates as you change the order, with the breakdown in its tooltip. The candidates are created by the game's generator (with dowry, personality and sometimes a marriage deal or a pet), are adjusted to the order and appear **first in the list**. You marry from there, with the usual ceremony. It respects the window's matrilineal marriage checkbox. Like the game's own candidates, they are discarded after 6 months or when you pay for other matches. The panel shows the ordered ones that are still available. |

- **Costs.** Divorcing, giving for adoption and the matchmaker charge the same as the mods (for the matchmaker, the mod's fee plus the order's extras). The matchmaker's amounts are fixed. For divorce and adoption, the game multiplies the amount by your class factor, and for divorce, the money also by your income. That is why it can cost a lot; the panel shows the real figure and warns if you would end up negative. The "Charge the original mods' costs" checkbox lets you do it for free (the argentarius always charges: it is borrowed or invested money).
- **They cannot be undone.** Actions ask for confirmation. Before playing a scenario, save to another slot.
- If your game is in a year after the scenario's, the date goes back, as in the mod.

### Argentarius

The Roman banker: a button on the main screen that opens a game window with the bank, three ways to invest that the Romans used, a temple deposit and the grain trade. What you can do depends on your **social class** (the one the game works out from your wealth) and on your **character's attributes**:

| | Proletarii | Class V – II | Class I | Equites | Senatores |
|---|---|---|---|---|---|
| **Borrow** | yes (little) | yes | yes | yes | yes |
| **Lend to other families** | — | — | yes | yes | yes |
| **Publican companies** | — | — | small shares | yes | with a front man |
| **Maritime loan** | — | Class III and II | yes | yes | with a front man |
| **Temple deposit** | yes | yes | yes | yes | yes |
| **Grain in the horrea** | yes (little) | yes | yes | yes | yes |

In debt bondage you can't do anything except pay.

Your character's attributes have **no cap**. **20 is neutral**: below it they penalize, with a multiplier of (attribute/20)^1.24 that never goes below ×0.1, and above it they improve without limit.

| Value | 0 | 5 | 10 | 15 | 20 | 30 | 40 | 60 |
|---|---|---|---|---|---|---|---|---|
| Penalty | ×0.10 | ×0.18 | ×0.42 | ×0.70 | — | — | — | — |
| Limits (stewardship) | ×0.10 | ×0.18 | ×0.42 | ×0.70 | ×1 | ×1.75 | ×2.5 | ×4 |
| What you collect (stewardship) | ×0.10 | ×0.18 | ×0.42 | ×0.70 | ×1 | ×1.1 | ×1.2 | ×1.4 |
| Bank interest for Equites (eloquence) | 11.9% | 11.6% | 10.6% | 9.5% | 8.3% | 6.3% | 4.3% | 4% (minimum) |
| Asia risk (intelligence; base 6%) | 11.4% | 10.9% | 9.5% | 7.8% | 6% | 4% | 3% | 2% |
| Purchase commission (eloquence) | 9.5% | 9.1% | 7.9% | 6.5% | 5% | 2.5% | 1.7% | 1% |
| Sale price (eloquence) | 50% | 53% | 64% | 77% | 90% | 95% | 97% | 98% |

| Attribute | Effect |
|---|---|
| **Stewardship** | Limits of everything, what you collect (interest, dividends and ship profits) and fewer defaults by those who owe you. |
| **Eloquence** | Bank interest (up to 4 points more below 20; 2 points less for every 10 above), commission when buying shares and price when selling them. |
| **Intelligence** | Risk of contracts and routes, and how accurate the risk you see is (with low intelligence, the figure is approximate). |
| **Combat** | Of a defaulted debt you recover 30% at 20; less below, and 25 points more for every 10 above, up to 100%. Fewer thefts from the granary. |
| **Traits** | *Honorable*: half a point less interest. *Greedy*: you can lend at 15%, but there are more defaults. *Sly*: the front man charges 10% instead of 20%, and the scandal risk drops from 5% to 3%. |

The economy's own limits still apply: interest never goes below 4%, probabilities never exceed 90%, and you never recover more than 100% of a debt or sell a share for more than its value. The argentarius window lists the attributes you have below 20, with their penalty.

- **Borrowing.** Interest runs from 12% a year for the Proletarii (the Roman legal cap, the *centesima*) to 8⅓% for Equites and Senatores (the *fenus unciarium* of the Twelve Tables), with eloquence 20. It goes up or down with your eloquence, with a minimum of 4%. The limit grows with class: 600 for the Proletarii and 40,000 for the Equites, with stewardship 20. Interest is charged every year in **Martius** (month 3, when the game runs its yearly events), with a game window where you pay at least the interest or something more. Whatever you pay ahead of time, from the window or the panel, carries no interest. If you had debt with the earlier bank, it moves to the argentarius.
- **Lending to other families.** Each month 3 families ask for money for 1 to 3 years. You choose the rate: 6%, 9% or 12% (15% with *Greedy*). The higher it is, the likelier a default. Each Martius they pay the interest, or they don't pay and you recover part.
- **Publican companies.** You buy shares in 5 state contracts: taxes of Asia (8–20% a year, the riskiest), tithes of Sicily, mines of Hispania, public works or supplying the army (3–7% in peace, 10–24% in war). Each Martius you collect the dividend, or the contract fails and you lose part. You can sell the shares whenever you like.
- **Maritime loan.** Each month there are 3 voyages, for example to Alexandria, Gades or Rhodus: between 20% and 35% interest, 3 to 5 months, and a risk of shipwreck. In winter (November to Mercedonius) the sea is "closed" and the risk doubles. You can lend on a single ship (all or nothing) or spread it over 50 ships, like Cato, with 5 points less interest and almost no risk of losing everything.
- **Deposit at the temple of Castor.** The game has an invisible **cash cap**: about 9,819 times the household's stewardship (adding everyone up, with their multipliers). What goes over the cap is lost bit by bit: sometimes with a window ("Greed", "Theft", "Ransacked", "Embezzlement") and sometimes without warning. Money on deposit is not cash, so the game doesn't touch it. The window shows your cap and offers to deposit exactly what is over. The temple charges a safekeeping fee of 1% a year in Martius (with eloquence 20; with more eloquence it drops to 0.1%), and very rarely (0.4% a year) it burns down and a quarter of the deposit is lost. You can withdraw whenever you like. Note: **money on deposit does not count for your class** (the game works it out from cash and properties), and the window warns you if depositing would drop you a class. This applies to everything held in the argentarius.
- **Grain in the horrea.** The price of a modius changes every month: cheap after the harvest (Quintilis to September) and dear before the next one (Aprilis to Iunius). It also changes with the year's harvest (known in Quintilis; from Martius you see an estimate of the next one, more accurate with more intelligence), with war (+15%) and a little at random. Some rots every month (less with stewardship) and sometimes rats eat it (less with intelligence) or it is stolen (less with combat). In spring the aedile sometimes hands out cheap grain and that month it sells worse. If you own grain land, you buy 10% cheaper at harvest. A disastrous harvest brings **famine**: grain is worth 1.5 times more, but selling it dear costs prestige (double for Senatores); you can sell it to the people at a fair price and gain influence. In tests, buying in Sextilis and selling in Maius returned 15% on average with all attributes at 20, −5% at 10 and 28% at 40, and in any case you can lose.
- **Senatores.** As in Rome, they invest in companies and maritime loans through a front man: he keeps 20% of what you earn, and each year there is a 5% risk of scandal, which costs prestige and influence.
- **Results.** The yearly payments (Martius) and the ships that return arrive in a game window, "The argentarius's report". The panel (Argentarius block) shows your class, what your attributes allow you, and all your debts and investments.

### Provincial governorships

In the game, the Senate appoints a senator who already held the office as a pro-magistrate (proconsul, propraetor, proaedile or proquaestor) for a year, and it pays nothing. In Rome, governing a province was the way to get rich, and also to end up on trial.

- When someone in your household starts a term, a game window asks how they will govern their province (for example Asia, Sicily or Hispania), with the estimated gain and the risk of prosecution:

| How they govern | What they take per year (proconsul, stewardship 20) | Prosecution (intelligence 20) | At the end |
|---|---|---|---|
| **Honestly** | ≈ 4,900 | 3% | +3% prestige and +5% influence |
| **As expected** | ≈ 19,500 | 15% | — |
| **Squeezing the province** | ≈ 58,500 (×1.2 with *Greedy*) | 45% | — |

- A propraetor takes two thirds of what a proconsul does, a proquaestor 30% and a proaedile 20%. In war, if the governor is on campaign, they take 50% more.
- What they take builds up every month and arrives **at the end of the term**. The panel shows how much they have so far.
- At the end there can be a ***de repetundis* trial** (the Calpurnian law, 149 B.C.). You choose the defense: defending themselves (50% chance of conviction with eloquence 20), hiring a great orator (10% of what was gathered; half the risk) or bribing the jury (25%; 30% of the risk, but a 25% chance it comes out, which costs more prestige). If convicted, they pay back **double** (the Acilian law, 123 B.C.), and the family loses 10% of its prestige and 25% of its influence. It can leave you in the red.
- The attributes **of whoever governs** count: stewardship = how much they take; intelligence = fewer prosecutions; eloquence = fewer convictions. *Honorable* = half the prosecutions. If they die during the term, the family collects and there is no trial.
- In tests, with everything at 20 and defending themselves, a proconsul brought back on average 4,700 (honest), 16,700 (as expected) and 31,200 (squeezing; convicted 1 time in 4).
- It is turned on or off in "Buttons in the game" (Provincial governorships).

The scenario data comes from the example mods by Sathvik Software Solutions, licensed [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/) with the *Commons Clause* condition (they may not be sold). The themes are from Prahlad's "theme" mod. The matchmaker is based on peritiSumus's "Coemptio" mod, in the public domain. The argentarius replaces their "Bank of Rome" mod.

## Another port

To use a port other than 9222, put the same number in the game's launch options and in the `CDP_PORT` variable. In PowerShell:

```
$env:CDP_PORT=9333; node stemma.mjs
```

## Troubleshooting

| Message or problem | What to do |
|---|---|
| "Waiting for the game on port 9222..." | The game isn't open, or it lacks the `--remote-debugging-port=9222` launch option. Open it (or close it, check the option in Steam and open it again): Stemma connects by itself. |
| The game hangs while loading the save (and "The game is not responding" in Stemma) | This happens with saves made with an earlier version of Stemma if they are loaded without it. Close the game with Stemma open and start it again: Stemma prepares it before the save loads and updates the buttons. Save the game, and from then on it also loads fine without Stemma. |
| "The game has no save loaded yet" | Load a save: the panel appears by itself on reload. |
| I can't see the panel | Press **F8**, which shows or hides it. Check that Stemma's window says "Panel ready". |
| A section says "Not available" | Probably a game update changed something that section uses. The rest of the panel keeps working. See [Development](development.md#if-a-game-update-breaks-something). |
| "The game closed." | This is normal: Stemma waits for you to open it again. **Ctrl+C** closes it. |
| "node is not recognized as a command" | Install [Node.js](https://nodejs.org/) 22 or newer and open a new terminal. |
