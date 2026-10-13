// What can happen when choosing each option of a military event. For options
// that lead to another window it is assumed the recommended one (better) is
// chosen afterwards; crownPath also gives the result when going for the crown (crownFirst).
// The figures are expected values and already scaled as the game does.
const { EVENTS, SCALED } = require('war/events')
const game = require('game')

const KIND = { pr: 'prestige', inf: 'influence', cash: 'cash' }
const STAT_KEYS = ['pr', 'inf', 'cash']

const empty = () => ({ death: 0, crown: 0, crownId: null, pr: 0, inf: 0, cash: 0, traits: {}, endWar: 0, endTerm: 0, exile: 0 })

// Real value of some tree changes ({ pr, inf, cash, sc }).
function stats(st, into = empty()) {
  const sc = st.sc || SCALED
  for (const k of STAT_KEYS) {
    if (st[k]) into[k] += game.STATS ? game.STATS.real(KIND[k], st[k], sc.includes(KIND[k])) : st[k]
  }
  return into
}

// a += b × p
function add(a, b, p) {
  for (const k of ['death', 'crown', 'pr', 'inf', 'cash', 'endWar', 'endTerm', 'exile']) a[k] += b[k] * p
  for (const [id, q] of Object.entries(b.traits)) a.traits[id] = (a.traits[id] || 0) + q * p
  a.crownId = a.crownId || b.crownId
  return a
}

// Best first: less risk of dying, higher chance of a crown, fewer
// wounds or bad traits, and more prestige + influence (+ money/10).
const EPS = 0.0005
const badTraits = s => Object.entries(s.traits).filter(([id]) => !/^corona/.test(id)).reduce((n, [, q]) => n + q, 0)
function better(a, b) {
  if (Math.abs(a.death - b.death) > EPS) return a.death < b.death
  if (Math.abs(a.crown - b.crown) > EPS) return a.crown > b.crown
  if (Math.abs(badTraits(a) - badTraits(b)) > EPS) return badTraits(a) < badTraits(b)
  return a.pr + a.inf + a.cash / 10 > b.pr + b.inf + b.cash / 10
}
// For whoever wants the crown: chance of a crown first.
function crownFirst(a, b) {
  if (Math.abs(a.crown - b.crown) > EPS) return a.crown > b.crown
  return better(a, b)
}
const bestIndex = (summaries, cmp = better) => summaries.reduce((best, s, i) => best < 0 || cmp(s, summaries[best]) ? i : best, -1)

const prob = (b, ch) => typeof b.p === 'function' ? b.p(ch) : (b.p ?? 1)
const traitsOf = (b, ch) => typeof b.traits === 'function' ? b.traits(ch) : (b.traits || [])

// A branch's own effects (without what comes after).
function branchEffects(b, ch) {
  const s = stats(b)
  if (b.death) s.death = 1
  if (b.crown) { s.crown = 1; s.crownId = b.crown }
  for (const id of traitsOf(b, ch)) s.traits[id] = (s.traits[id] || 0) + 1
  if (b.crown) s.traits[b.crown] = (s.traits[b.crown] || 0) + 1
  for (const k of ['endWar', 'endTerm', 'exile']) if (b[k]) s[k] = 1
  return s
}

// One-step branches with their probability for this character.
const branches = (evId, key, ch) => (EVENTS[evId]?.steps[key] || [])
  .map(b => ({ b, p: Math.max(0, Math.min(1, prob(b, ch))) })).filter(x => x.p > 0)

// `cmp` decides what is chosen in the following windows (better or crownFirst).
function stepSummary(evId, key, ch, cmp = better, depth = 0) {
  const out = empty()
  if (depth > 40) return out
  for (const { b, p } of branches(evId, key, ch)) add(out, branchSummary(evId, b, ch, cmp, depth), p)
  return out
}

// A branch with what comes after (choosing according to `cmp`).
function branchSummary(evId, b, ch, cmp = better, depth = 0) {
  const s = branchEffects(b, ch)
  if (b.options?.length) {
    const subs = b.options.map(o => optionSummary(evId, o, ch, cmp, depth + 1))
    add(s, subs[bestIndex(subs, cmp)], 1)
  }
  return s
}

// Tree option: { text, to, st }.
function optionSummary(evId, opt, ch, cmp = better, depth = 0) {
  const s = opt.st ? stats(opt.st) : empty()
  return opt.to ? add(s, stepSummary(evId, opt.to, ch, cmp, depth), 1) : s
}

// The same going for the crown; null if that gives no higher chance of a crown.
function crownPath(evId, opt, ch, recSummary) {
  if (!opt.to) return null
  const s = optionSummary(evId, opt, ch, crownFirst)
  return s.crown > recSummary.crown + EPS ? s : null
}

// Step a game action leads to ({ event, method, context }).
function stepKey(evId, action) {
  const ctx = action.context?.examine ?? action.context?.type
  const steps = EVENTS[evId]?.steps || {}
  return ctx != null && steps[action.method + ':' + ctx] ? action.method + ':' + ctx : action.method
}

// The game's statChanges → real values.
function liveStats(sc) {
  if (!sc) return empty()
  const scaled = sc.scaleByRevenue || []
  const s = empty()
  for (const [k, kind] of Object.entries(KIND)) {
    if (sc[kind]) s[k] += game.STATS ? game.STATS.real(kind, sc[kind], scaled.includes(kind)) : sc[kind]
  }
  return s
}

// Outcomes that can be forced in a step with a random element: [{ p, roll, summary }], or
// null if the step has no random element (or the rolls are missing).
function forceable(evId, key, ch) {
  const bs = branches(evId, key, ch)
  if (bs.length < 2 || bs.some(({ b }) => !b.roll)) return null
  return bs.map(({ b, p }) => ({ p, roll: b.roll, summary: branchSummary(evId, b, ch) }))
}

// Window open in the game → { evId, ev, options: [{ text, summary, crown, force }], rec }
// or null if it is not a known military event. `crown` is the summary going for
// the crown when it differs from the recommended one; `force`, the outcomes that can be
// forced when choosing that option (see forceable).
function analyzeModal(m, ch) {
  if (!m?.show || !m.options?.length) return null
  let evId = m.options.map(o => o.action?.event).find(e => EVENTS[e])
  if (!evId) evId = Object.keys(EVENTS).find(id => EVENTS[id].title === m.title)
  if (!evId) return null
  const options = m.options.map(o => {
    const a = o.action
    const live = cmp => {
      const s = liveStats(o.statChanges)
      if (a?.event === evId) add(s, stepSummary(evId, stepKey(evId, a), ch, cmp), 1)
      else if (a?.event === 'lifeAndDeath/death' && a.method === 'kill') s.death = 1
      return s
    }
    const summary = live(better), crown = live(crownFirst)
    return { text: o.text, summary, crown: crown.crown > summary.crown + EPS ? crown : null, force: a?.event === evId ? forceable(evId, stepKey(evId, a), ch) : null }
  })
  return { evId, ev: EVENTS[evId], options, rec: options.length > 1 ? bestIndex(options.map(o => o.summary)) : -1 }
}

module.exports = { EVENTS, analyzeModal, optionSummary, crownPath, forceable, branches, branchEffects, bestIndex }
