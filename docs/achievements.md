# Achievements

## Where they are stored

| What | Where | When it is saved |
|---|---|---|
| Achievements obtained (global, the achievements screen) | `state.achievements` and `localStorage.core.achievements` | When saving the game (`[134d]`) |
| Obtained in this playthrough | `current.flagAchievementsThisRun` (+ counter) | With the game |
| Obtained by each character | `characters[id].flagAchievementsWhenPlayed` (+ counter) | With the game |

- There are **110 achievements** in 10 groups: Basics, Family, Genetic, Health, Education, Military, Ludi, Economy, Power, Special. `[06d5]`
- Some achievements are in **two groups** (for example, *A Wedding* in Basics and Family).
- Names and descriptions: `[a550]` (English only).

## How an achievement is unlocked `[c391]`

The game's `addAchievement` action:

1. With some probability, it removes *Depression* or *Stress* from the current character (much less if the achievement was already held).
2. It marks it in "this playthrough" and "this character", and adds to their counters.
3. **If the game is not in easy mode, sandbox mode or using mods**, and the API achievements option is on, it sends it to **Steam** (IPC `achievementGet` → `steamworks.achievement.activate`).
4. If it is new in the global list, it adds it and shows the notification.

**Steam achievements cannot be removed**: the game has no function for that.

The Steam identifier is the same as the game's, and the main process doesn't activate an already activated achievement twice.

Some **traits have an achievement with the same id**:
- Characters: the six crowns, *Veteran*, *One Handed*, *Arm-less*, *One Legged*, *Legless*, *Malnourished*, *Obese* and *Novus Homo*.
- Pets: *Malnourished*, *Blessed* and *Pedigreed*.

## In Stemma

The **Achievements** section marks and unmarks directly in those lists, **without calling `addAchievement`**, to avoid its side effects (points 1 and 2):

- "Unlocked": global list, saved immediately in `localStorage.core`.
- "This playthrough": saved with the game.
- An achievement that appears in two groups is shown in both but counted once.

**Steam**: with the "Also unlock on Steam" checkbox on (it is by default), Stemma sends the same message as the game (`achievementGet`) when:

- an achievement is marked as obtained (one, or "Mark shown", with confirmation);
- a trait that has an achievement is added with Stemma, to a character or a pet;
- "Send obtained ones to Steam" is pressed, which unlocks on Steam every achievement in the game's list (for example, those marked earlier only in the game).

Like the game, it sends nothing in easy mode, sandbox mode or with mods, nor with API achievements turned off in the settings; in that case the section says so. Removing an achievement only removes it in the game.

The forced outcomes of the [military events](military-events.md#in-stemma) go through the game's own functions, which unlock their achievements with `addAchievement`.
