// Access to the game. It is the ONLY file (with hook.js, which also runs on its own)
// that knows the game's internal identifiers (webpack modules) and the shape
// of its Vuex state: if a game update breaks something, fix it here.
//
// The same functions the game uses are used (traits, job level,
// multipliers…), so their side effects apply. It does not turn on
// mod mode, so achievements stay active.

const hook = require('hook')

// --- Vuex state ---------------------------------------------------------------
const store = () => document.querySelector('#app')?.__vue__?.$store
const S = () => store()?.state
const player = () => { const s = S(); return s?.characters?.[s.current.id] }
const dynasty = () => { const s = S(), p = player(); return p && s.dynasties?.[p.dynastyId] }

// Assign a key the object doesn't have yet, in a way Vue sees (Vue 2).
const setReactive = (obj, key, value) => {
  if (key in obj) obj[key] = value
  else store()._vm.$set(obj, key, value)
}

// Living household members (you first).
const household = () => {
  const s = S()
  if (!s) return []
  const ids = [s.current.id, ...(s.current.householdCharacterIds || [])]
  return [...new Set(ids)].map(id => s.characters[id]).filter(c => c && !c.isDead)
}

// All known pets, and the living ones of the household and its members.
const pets = () => S()?.current?.pets || {}
const householdPets = () => {
  const s = S()
  if (!s) return []
  const ids = [...(s.current.petIds || []), ...(s.current.householdPetIds || [])]
  household().forEach(ch => ids.push(...(ch.petIds || [])))
  return [...new Set(ids)].map(id => pets()[id]).filter(p => p && !p.isDead)
}

// --- Internal modules (webpack) --------------------------------------------------
// A fake "chunk" is registered to get webpack's require function.
function gameRequire() {
  if (window.__corReq) return window.__corReq
  const key = Object.keys(window).find(k => /^webpackJsonp/.test(k))
  if (!key) return null
  const mid = '__cor' + Date.now()
  window[key].push([[mid], { [mid]: (m, e, r) => { window.__corReq = r } }, [[mid]]])
  return window.__corReq || null
}
// Each group is null if it could not be loaded (e.g. another game version).
const load = (what, fn) => { try { return fn(gameRequire()) } catch (e) { console.warn('[stemma] ' + what + ' not available', e); return null } }

// Character traits: definitions, titles and the game's functions to
// add/remove (they apply skill bonuses and remove opposites).
// Stackable traits (isStackable): adding one you already have adds
// copies in ch.traitStackCount, and each extra copy adds traitStackMultiplier (10%)
// of the skill bonus; removing it without forcing subtracts a copy.
const TR = load('traits', req => {
  const defs = req('50ab').default()
  const addTrait = req('a822').a, removeTrait = req('cc6f').a
  const discoverable = defs.discoverable || []
  const add = (ch, id) => {
    addTrait(S(), ch.id, id)
    // The "discoverable" traits are not shown in the game until discovered.
    if (discoverable.includes(id)) {
      ch.discoveredTraits = ch.discoveredTraits || []
      if (!ch.discoveredTraits.includes(id)) ch.discoveredTraits.push(id)
    }
  }
  const remove = (ch, id) => removeTrait(S(), ch.id, id, true)
  // Copies it has: 0 if it does not have it; the game stores 0 or nothing when there is one.
  const stacks = (ch, id) => ch?.traits?.includes(id) ? Math.max(1, ch.traitStackCount?.[id] || 0) : 0
  const setStacks = (ch, id, n) => {
    n = Math.max(0, Math.min(99, Math.floor(n)))
    let cur = stacks(ch, id)
    if (n === cur) return
    if (n === 0) return remove(ch, id)
    if (cur === 0) { add(ch, id); cur = 1 }
    if (n > cur) addTrait(S(), ch.id, id, n - cur)
    else for (; cur > n; cur--) removeTrait(S(), ch.id, id, false)
  }
  return { list: defs.list, titles: req('7073').default(), discoverable, add, remove,
    stackable: Object.keys(defs.list).filter(id => defs.list[id].isStackable),
    stackMultiplier: req('7de9').default.traitStackMultiplier, stacks, setStacks }
})

// Rewards and punishments of events (applyStatChanges [2ee0]): if the event
// asks for it (scaleByRevenue), money × income, influence × income/8 and prestige ×
// income/10 [14ef]; and always × the class factor [cfed].
const STATS = load('scaling', req => {
  const revenue = req('14ef').default, classFactor = req('cfed').default
  const DIV = { cash: 1, influence: 8, prestige: 10 }
  return { real: (kind, base, scaled) => base * (scaled ? revenue(S()) / DIV[kind] : 1) * classFactor(S()),
    signature: () => revenue(S()) + ':' + classFactor(S()) }
})

// Event window open in the game: { show, title, message, options }.
const modal = () => S()?.interactionModal

// Age in years from birth month/year (13-month calendar).
const AGE = load('age', req => req('9b55').default)

// Jobs: definitions (maxLevel), names and the function that sets the level
// (it limits it to [0, maxLevel] and recalculates the character).
const JOBS = load('jobs', req => ({ types: req('0262').default.types, titles: req('c9c8').default.titles || {}, set: req('6cf7').a }))

// Pets: types (species, adult age, life expectancy), traits and their functions.
const PETS = load('pets', req => {
  const P = req('ed26').a
  return { types: P.types || {}, traitList: P.traits.list, traitTitles: req('c7db').default.traits || {},
    add: (p, id) => req('d6d3').a({ state: S(), petId: p.id, trait: id }),
    remove: (p, id) => req('d217').a({ state: S(), petId: p.id, trait: id, forceClearStack: true }) }
})

// Properties: types, groups, names and the manageable limit of each.
const PROPS = load('properties', req => {
  const P = req('08e5').default, L = req('5785').default
  return { types: P.types, groups: P.groups, titles: L.types || {}, groupTitles: L.groups || {}, max: k => req('40cf').default(S(), k) }
})

// Multipliers (modifiers): add/remove by key and id, and the total value
// (product of the active ones; the game caches it for ~1 s).
const MODS = load('multipliers', req => ({
  add: (key, id, factor, description) => req('dbe5').default(S(), { key, id, factor, description }),
  remove: (key, id) => req('f761').a(S(), key, id),
  value: key => req('fc68').a(S(), { key }),
  propTypes: req('08e5').default.types, propTitles: req('5785').default.types || {},
}))

// Achievements: list, groups and names. The obtained ones are in state.achievements
// (global, the game saves it in localStorage.core) and those of the current game in
// current.flagAchievementsThisRun (saved with the game).
const ACH = load('achievements', req => {
  const D = req('06d5').a, L = req('a550').default
  return { list: D.list, groups: D.groups, titles: typeof L === 'function' ? L() : L }
})

// The game's mods API (daapi) [6174], created the way the game itself uses it in its
// events (isDAAPI: false, e.g. household/enforceAusterity [ea0b]). That way mod mode
// is not turned on (setupDAAPI [e35e]), which marks the save with
// current.flagUsedMods and blocks achievements forever [c391]. api() is created on
// every use because it keeps the state it was created with (loading a game replaces
// it). newId() generates ids like the game's [e381].
const DA = load('daapi', req => {
  const make = req('6174').a
  return { api: () => make({ state: S(), dispatch: store().dispatch, commit: store().commit }, { isDAAPI: false }), newId: req('e381').default }
})

// Stemma's events inside the game (see hook.js). stemma.mjs already installs it at
// the start of the page; here too, in case the game was opened before Stemma.
const HOOK = load('events', req => {
  hook.install(req)
  return { register: (name, ev) => { window.__corEvents[name] = ev }, call: hook.call, ours: hook.ours }
})

// Names of the social classes (current.class 0–7: Proletarii … Equites, Senatores).
// Class comes from wealth [5485]; Senatores is separate (flagIsSenetorialClass).
const CLASSES = load('classes', req => req('83de').default.classes)

// Wealth. Class comes from cash plus the value of properties [5485, 0698]
// (what is in the argentarius doesn't count). Cash has a cap [625b]: 9819 ×
// the household stewardship [20e3], and by class up to Class I; from time to time the
// game takes what is over the cap ("Greed", "Theft"…) or removes it without warning [f93d].
const WEALTH_STEPS = [1100, 2500, 5000, 7500, 10000, 25000] // [5485]
const WEALTH = load('wealth', req => ({
  cashCap: () => req('625b').default(S()),
  propertyValue: () => req('0698').default(S()),
  // Class the family would have with this cash (Senatores does not depend on money).
  classFor: cash => {
    if (S().current.flagIsSenetorialClass) return 7
    const w = req('0698').default(S()) + cash, i = WEALTH_STEPS.findIndex(x => w < x)
    return i < 0 ? 6 : i
  },
}))

// Spouse candidates of the "Arrange Betrothal" window (MarriageView). The game
// generates them with [6d52] (dynasty, dowry, personality, sometimes a pet and a
// marriage deal), stores them in current.generatedPotentialSpouseCharacterIds with
// flagGeneratedPotentialSpouse = { targetCharacterId, isMatrilineal, month, year },
// shows the first 10 valid ones [1eff] (valid = [deda]: single, marriageable age…)
// and deletes them after 6 months [9427].
const SPOUSES = load('spouse', req => ({
  generate: (n, targetId, isMatrilineal) => req('6d52').default(S(), n, targetId, !!isMatrilineal),
  list: (targetId, isMatrilineal) => req('1eff').default(S(), targetId, false, !!isMatrilineal),
  valid: ch => !!req('deda').default(S(), ch),
}))

// The open "Arrange Betrothal" window: who a spouse is being sought for, whether it is matrilineal
// (window checkbox) and the character's actions box (where "Pay to
// look for other matches" is; the game does not show it with debts or without money).
const betrothalView = () => {
  if (document.querySelector('#app')?.__vue__?.$route?.name !== 'MarriageView') return null
  const main = document.querySelector('.container-main'), view = main?.__vue__
  if (!view || view.$options.name !== 'MarriageView') return null
  return { targetId: S().selectedMarriageCharacterId, isMatrilineal: !!view.isMatrilineal, actions: main.querySelector('.character-actions') }
}

// Marks or unmarks achievements as obtained inside the game (for Steam, see
// unlockSteam). The game's addAchievement action is not used because it has side
// effects (it counts the achievement in the game and sometimes removes Stressed/Depressed).
const setAchievements = (ids, on) => {
  const list = S().achievements
  for (const id of ids) {
    const i = list.indexOf(id)
    if (on && i < 0) list.push(id)
    if (!on && i >= 0) list.splice(i, 1)
  }
  // Saved as the game does when saving, but only the achievements list.
  try {
    const core = JSON.parse(localStorage.core || '{}')
    core.achievements = [...list]
    localStorage.core = JSON.stringify(core)
  } catch (e) { console.warn('[stemma] could not save the achievements list', e) }
}

// Marks or unmarks an achievement as obtained in the current game.
const setAchievementThisRun = (id, on) => {
  const c = S().current
  if (!c.flagAchievementsThisRun) setReactive(c, 'flagAchievementsThisRun', [])
  if (!c.flagAchievementsThisRunCount) setReactive(c, 'flagAchievementsThisRunCount', {})
  const list = c.flagAchievementsThisRun, i = list.indexOf(id)
  if (on && i < 0) {
    list.push(id)
    setReactive(c.flagAchievementsThisRunCount, id, Math.max(1, c.flagAchievementsThisRunCount[id] || 0))
  }
  if (!on && i >= 0) {
    list.splice(i, 1)
    store()._vm.$delete(c.flagAchievementsThisRunCount, id)
  }
}

// Unlocks achievements on Steam with the same message addAchievement uses [c391]:
// the main process activates them with Steamworks (if already active, it does nothing).
// Like the game, it sends nothing in easy mode, sandbox mode or with mods, nor with achievements
// turned off in its settings. Returns '' or the reason ('noSteam', 'apiOff', 'mode').
// Steam achievements cannot be removed.
const steamBlocked = () => {
  const s = S()
  if (!window.ipcRenderer?.send) return 'noSteam'
  if (!s.settings?.enableAPIAchievements) return 'apiOff'
  if (s.current.flagEasyMode || s.current.flagSandboxMode || s.current.flagUsedMods) return 'mode'
  return ''
}
const unlockSteam = ids => {
  const why = steamBlocked()
  if (!why) for (const id of ids) window.ipcRenderer.send('achievementGet', { achievement: id })
  return why
}

// Picks option `i` of the open event window, just as when pressing it
// (processInteractionModalAction action). The first calls to Math.random
// return `rolls` in order, to force the outcome; the game decides the random element
// at that very moment, and later calls are random again.
const chooseOption = (i, rolls = []) => {
  const opt = modal()?.options?.[i]
  if (!modal()?.show || !opt || opt.disabled) return false
  const real = Math.random
  let n = 0
  Math.random = () => n < rolls.length ? rolls[n++] : real()
  try { store().dispatch('processInteractionModalAction', opt) } finally { Math.random = real }
  return true
}

// Current age in years of a character or pet.
const ageOf = x => AGE ? AGE(S(), x.birthMonth, x.birthYear) : S().year - x.birthYear

// From ~27 the game's formulas already give the maximum (99%) in skills.
const SKILL_MAX = 30

module.exports = {
  store, S, player, dynasty, setReactive, household, pets, householdPets, ageOf, modal, chooseOption,
  setAchievements, setAchievementThisRun, steamBlocked, unlockSteam,
  TR, AGE, JOBS, PETS, PROPS, MODS, ACH, STATS, DA, HOOK, SPOUSES, CLASSES, WEALTH, betrothalView, SKILL_MAX,
}
