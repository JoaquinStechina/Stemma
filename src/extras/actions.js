// Actions of the mods (Play As, Divorce, Give For Adoption, New Dynasty?, Play a
// Scenario) done with the game's mods API without turning mod mode on (game.DA).
// Used by the panel (features/extras) and the in-game buttons (extras/ingame).
// Costs are not charged here: the panel charges them with charge() and the game's
// windows with their statChanges, which the game applies just as in the mod.
const { t } = require('core/i18n')
const ls = require('core/storage')
const game = require('game')
const SCENARIOS = require('extras/scenarios')

const COSTS_KEY = 'corTrainerExtrasCosts'
const HERITAGES = ['roman_plebian', 'roman_novus_homo', 'roman_patrician', 'roman_freedman']
// Costs of the mods (applyStatChanges [2ee0]: × class factor; scaleByRevenue also × income).
const ADOPT_COST = { cash: -50, prestige: -100, influence: -500 }
const DIVORCE_COST = { cash: -500, prestige: -25, influence: -300, scaleByRevenue: ['cash'] }
// The mod's cause of death: the game shows it inside its English sentence
// ("<name> has died <cause> at the age of <age>").
const ADOPT_CAUSE = '...maybe, who knows?, after being given up for adoption'

const api = () => game.DA.api()
const S = () => game.S()
const store = () => game.store()

// --- Costs -------------------------------------------------------------------------
const costsOn = () => ls.get(COSTS_KEY, true)
const setCostsOn = v => ls.set(COSTS_KEY, !!v)
// What the game really charges (with your game's scaling).
const real = (changes, k) => game.STATS ? game.STATS.real(k, changes[k], (changes.scaleByRevenue || []).includes(k)) : changes[k]
const costText = changes => !costsOn() ? t('xFree') : ['cash', 'prestige', 'influence'].filter(k => changes[k])
  .map(k => Math.round(real(changes, k)).toLocaleString() + ' ' + t(k).toLowerCase()).join(', ')
// Warning if the cost leaves the money negative (the game has debt events).
const shortOf = changes => costsOn() && S().current.cash + real(changes, 'cash') < 0 ? '\n\n' + t('xNotEnough') : ''
const charge = changes => { if (costsOn()) api().applyStatChanges(changes) }
// statChanges for a game window option ({} if nothing is charged).
const statChanges = changes => costsOn() ? { ...changes } : {}

// --- Characters ---------------------------------------------------------------------
const name = ch => {
  const d = S().dynasties[ch.dynastyId] || {}
  return [ch.praenomen, d.nomen, d.cognomen, ch.agnomen].filter(s => s && s.trim()).join(' ')
}
// Link to a character in the game's messages.
const link = ch => '[c|' + ch.id + '|' + name(ch) + ']'
const spouseOf = ch => { const sp = ch && S().characters[ch.spouseId]; return sp && !sp.isDead ? sp : null }
const inHousehold = ch => game.household().includes(ch)

const canPlayAs = ch => !!ch && !ch.isDead && ch.id !== S().current.id
// Like the mod: household member with a living spouse.
const canDivorce = ch => !!ch && !ch.isDead && !!spouseOf(ch) && inHousehold(ch)
// Like the mod: in the household, up to 15 years old, with no spouse and neither busy nor traveling.
const canAdopt = ch => !!ch && !ch.isDead && ch.id !== S().current.id && inHousehold(ch) &&
  !ch.spouseId && !ch.flagIsBusy && !ch.flagIsAway && game.ageOf(ch) <= 15

function playAs(id) {
  if (!canPlayAs(S().characters[id])) return false
  api().setCurrentCharacter({ characterId: id })
  store().dispatch('forceUpdateStore')
  return true
}

function divorce(id) {
  const ch = S().characters[id], sp = spouseOf(ch)
  if (!sp) return false
  const a = api()
  a.updateCharacter({ characterId: sp.id, character: { spouseId: false } })
  a.updateCharacter({ characterId: ch.id, character: { spouseId: false } })
  return true
}

function adopt(id) {
  if (!canAdopt(S().characters[id])) return false
  api().kill({ characterId: id, deathCause: ADOPT_CAUSE })
  return true
}

// --- New dynasty -----------------------------------------------------------------
// The original mod renames the dynasty for all its members (it copies its id). Here
// it does what it promises: a new branch, with the same prestige, for the player
// and their descendants who carry their surname; the rest of the family keeps theirs.
function branchDynasty({ nomen, cognomen, heritage }) {
  const s = S(), old = game.dynasty(), id = game.DA.newId()
  nomen = (nomen || '').trim()
  if (!old || !nomen) return 0
  game.setReactive(s.dynasties, id, { ...JSON.parse(JSON.stringify(old)), id, nomen,
    cognomen: (cognomen || '').trim(), heritage: HERITAGES.includes(heritage) ? heritage : old.heritage })
  const moved = []
  const walk = ch => {
    if (!ch || ch.dynastyId !== old.id || moved.includes(ch.id)) return
    ch.dynastyId = id
    moved.push(ch.id)
    ;(ch.childrenIds || []).forEach(k => walk(s.characters[k]))
  }
  walk(game.player())
  moved.forEach(k => store().dispatch('forceUpdateCharacter', k))
  store().dispatch('forceUpdateStore')
  return moved.length
}

// --- Scenarios ---------------------------------------------------------------------
function playScenario(scId) {
  const sc = SCENARIOS.list.find(x => x.id === scId)
  if (!sc) return false
  const data = sc.data(), a = api(), s = S()
  a.setDate(data.date)
  // Like the mod: the characters are created and then linked with their real ids.
  const ids = {}
  for (const tmp in data.characters) {
    ids[tmp] = a.generateCharacter({ characterFeatures: { ...data.characters[tmp] }, dynastyFeatures: data.dynasties[data.characters[tmp].dynastyId] })
  }
  for (const tmp in ids) {
    const c = { ...data.characters[tmp], id: ids[tmp] }
    c.fatherId = ids[c.fatherId] || false
    c.motherId = ids[c.motherId] || false
    c.spouseId = ids[c.spouseId] || false
    c.childrenIds = (c.childrenIds || []).map(k => ids[k]).filter(Boolean)
    a.updateCharacter({ characterId: ids[tmp], character: c })
  }
  a.setCurrentCharacter({ characterId: ids[data.characterId] })
  a.setGlobalFlag({ flag: 'playingScenario', data: sc.id })
  // Money, influence and properties are left at the scenario's values.
  s.current.cash = data.cash
  s.current.influence = data.influence
  const det = s.current.propertyDetails
  for (const k of new Set([...Object.keys(det), ...Object.keys(data.property)])) game.setReactive(det, k, data.property[k] || 0)
  store().dispatch('forceUpdateStore')
  return true
}
const scenarioYear = scId => SCENARIOS.list.find(x => x.id === scId)?.data().date.year

// Agrippa scenario event (marry_attica): at 25½–26½ years old, if not
// married, he can marry Attica or refuse, with the mod's rewards and punishments.
const atticaDue = () => {
  const p = game.player()
  if (!p?.flagPlayScenarioModIsMarcusAgrippa || p.modFlags?.marcus_attica_engagement_over) return false
  const age = game.ageOf(p)
  return age > 25.5 && age < 26.5 && !spouseOf(p)
}
const atticaChanges = yes => {
  const f = api().calculateScaleByClassFactor()
  return yes ? { cash: -6000 / f, prestige: 2000 / f, influence: 4000 / f, property: { insulae: 1, horse: 1 } }
    : { prestige: -500 / f, influence: -2000 / f }
}
const atticaDone = () => api().setCharacterFlag({ characterId: S().current.id, flag: 'marcus_attica_engagement_over', data: true })
// The wedding (the rewards and punishments are applied by the caller).
function atticaWedding() {
  const a = api(), id = a.generateCharacter(SCENARIOS.attica())
  a.performMarriage({ characterId: S().current.id, spouseId: id, isMatrilineal: false })
}

module.exports = {
  HERITAGES, ADOPT_COST, DIVORCE_COST,
  costsOn, setCostsOn, costText, shortOf, charge, statChanges,
  name, link, spouseOf, inHousehold, canPlayAs, canDivorce, canAdopt,
  playAs, divorce, adopt, branchDynasty, playScenario, scenarioYear,
  atticaDue, atticaChanges, atticaDone, atticaWedding,
}
