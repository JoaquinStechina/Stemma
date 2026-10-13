// Buttons of the mods inside the game's interface, as the original mods place them:
// on each character (Play as, Divorce, Give for adoption, Matchmaker,
// and Borrow on the player) and on the main screen (Theme, New
// dynasty, Scenarios). They open game windows. The bank's yearly payment is also
// a game window, and so are the provincial governorships (extras/province), which have no
// button: their windows appear when someone in the household starts or ends a term.
//
// The buttons are saved with the game (characters[id].actions, current.actions)
// like any game action. Their methods go through a game check
// that Stemma redirects to its events (hook.js): without Stemma, the buttons do
// nothing and give no errors. Neither the actions nor the windows turn on mod mode
// (isDAAPI: false).
const i18n = require('core/i18n')
const ls = require('core/storage')
const game = require('game')
const A = require('extras/actions')
const THEMES = require('extras/themes')
const SCENARIOS = require('extras/scenarios')
const ICONS = require('extras/icons')
const FIN = require('extras/finance')
const MM = require('extras/matchmaker')
const PROV = require('extras/province')

const { t } = i18n
const KEY = 'corTrainerInGame'
// Button signature: if it changes (another language, or a new version of this file)
// they are rebuilt; if not, they are left as they are so nobody is redrawn.
const VERSION = 2 // 2: events through the game.HOOK gate (before: 'trainer/...')
const sig = () => VERSION + ':' + i18n.lang()
// Blocks that can be shown in the game, in the panel's order.
const FEATURES = ['theme', 'playAs', 'divorce', 'adopt', 'dynasty', 'scenario', 'bank', 'matchmaker', 'province']
const CHARACTER = ['playAs', 'divorce', 'adopt']
const ACTION = f => 'trainer_' + f // key of the action in the game

const enabled = f => ls.get(KEY, {})[f] ?? true
const setEnabled = (f, v) => { const o = ls.get(KEY, {}); o[f] = !!v; ls.set(KEY, o) }

const api = () => game.DA.api()
const S = () => game.S()
const call = (name, method, context) => game.HOOK.call(name, method, context)
// Opens a game window (if another is already open, Stemma's replaces it, as in the Play As mod).
const show = modal => api().displayInteractionModal({ isManualOnly: true, ...modal })
const cancel = () => ({ text: t('xCancel') })

// Whether the button can be shown (the game also checks it when drawing it, with preCheck).
const VISIBLE = {
  playAs: id => enabled('playAs') && A.canPlayAs(S().characters[id]),
  divorce: id => enabled('divorce') && A.canDivorce(S().characters[id]),
  adopt: id => enabled('adopt') && A.canAdopt(S().characters[id]),
}
const fmt = n => Math.round(n).toLocaleString()
const traitName = id => game.TR?.titles[id]?.title || id

// Form for the matchmaker order, as dropdowns of the game's window.
// Each entry: [field, title, options [{ label, value }]].
const orderFields = () => {
  const any = t('xMmAny')
  const fields = [
    ['count', t('xMmCount'), MM.COUNTS.map((n, i) => ({ label: String(n), value: i }))],
    ['age', t('age'), MM.AGES.map(([a, b], i) => ({ label: a + '–' + b, value: i }))],
    ['heritage', t('xHeritage'), MM.HERITAGES.map((h, i) => ({ label: h ? t('xH_' + h) : any, value: i }))],
    ...MM.SKILLS.map(k => ['skill:' + k, t(k) + ' ' + t('xMmMin'), MM.SKILL_MINS.map((m, i) => ({ label: m ? m + '+' : any, value: i }))]),
  ]
  const traits = [{ label: '—', value: '' }, ...MM.orderable().map(id => ({ label: traitName(id) + ' (' + t('g_' + game.TR.list[id].group) + ')', value: id }))]
  for (let i = 0; i < MM.TRAIT_SLOTS; i++) fields.push(['trait:' + i, t('xMmTrait') + ' ' + (i + 1), traits])
  fields.push(['noBad', t('xMmNoBad'), [{ label: t('xNo'), value: false }, { label: t('xYes'), value: true }]])
  return fields
}
const specGet = (spec, field) => {
  const [k, sub] = field.split(':')
  return k === 'skill' ? spec.skills[sub] : k === 'trait' ? spec.traits[sub] : spec[k]
}
const specSet = (spec, field, v) => {
  const [k, sub] = field.split(':')
  if (k === 'skill') spec.skills[sub] = v
  else if (k === 'trait') spec.traits[sub] = v
  else spec[k] = v
}
// Price text: total and breakdown.
const quoteText = q => q.items.map(({ key, cost }) => {
  const [k, sub] = key.split(':')
  const name = k === 'fee' ? t('xMmFeeItem') : k === 'count' ? t('xMmCount') : k === 'heritage' ? t('xHeritage') :
    k === 'noBad' ? t('xMmNoBad') : k === 'trait' ? traitName(sub) : t(k)
  return name + ' ' + fmt(cost)
}).join(' · ')

// --- Events ------------------------------------------------------------------------
// The game calls methods[m](storeContext, { ...context, ...params }).
const EVENTS = {
  playAs: {
    visible: (_, { characterId }) => VISIBLE.playAs(characterId),
    process(_, { characterId }) {
      const ch = S().characters[characterId]
      if (!A.canPlayAs(ch)) return
      show({
        title: t('xPlayAs'), image: ICONS.playAs,
        message: t('xPlayAsConfirm', { name: A.link(ch) }),
        options: [{ variant: 'info', text: t('xYes'), action: call('playAs', 'confirm', { characterId }) }, cancel()],
      })
    },
    confirm: (_, { characterId }) => { A.playAs(characterId) },
  },
  divorce: {
    visible: (_, { characterId }) => VISIBLE.divorce(characterId),
    process(_, { characterId }) {
      const ch = S().characters[characterId], sp = A.spouseOf(ch)
      if (!sp) return
      show({
        title: t('xDivorce'), image: ICONS.divorce,
        message: t('xDivorceMsg', { a: A.link(ch), b: A.link(sp) }),
        options: [{ variant: 'danger', text: t('xDivorceYes'), tooltip: t('xIrreversible'),
          statChanges: A.statChanges(A.DIVORCE_COST), action: call('divorce', 'confirm', { characterId }) }, cancel()],
      })
    },
    confirm: (_, { characterId }) => { A.divorce(characterId) },
  },
  adopt: {
    visible: (_, { characterId }) => VISIBLE.adopt(characterId),
    process(_, { characterId }) {
      const ch = S().characters[characterId]
      if (!A.canAdopt(ch)) return
      show({
        title: t('xAdopt'), image: ICONS.adopt,
        message: t('xAdoptMsg', { name: A.link(ch) }),
        options: [{ variant: 'danger', text: t('xAdoptYes', { name: ch.praenomen }), tooltip: t('xIrreversible'),
          statChanges: A.statChanges(A.ADOPT_COST), action: call('adopt', 'confirm', { characterId }) },
        { text: t('xAdoptNo', { name: ch.praenomen }) }],
      })
    },
    confirm: (_, { characterId }) => { A.adopt(characterId) },
  },
  theme: {
    visible: () => enabled('theme'),
    process() {
      const ids = ['', ...Object.keys(THEMES.LIST)]
      show({
        title: t('xTheme'), image: ICONS.theme, message: t('xThemeMsg'),
        dropdowns: [{
          title: t('xTheme'), selected: Math.max(0, ids.indexOf(THEMES.current())),
          options: ids.map(id => ({ label: id ? THEMES.label(id) : t('xThemeGame'), value: id })),
          onChange: call('theme', 'pick'),
        }],
        options: [{ text: '☾ ' + t('xDarkModeToggle'), action: call('theme', 'dark') }, { text: t('xOk') }],
      })
      setTimeout(orderStyle, 50) // scroll bar for the theme list
    },
    pick: (_, { option }) => THEMES.apply(option?.value || ''),
    dark: ({ dispatch }) => dispatch('toggleSetting', { setting: 'darkMode' }),
  },
  dynasty: {
    visible: () => enabled('dynasty'),
    // What is being typed in the window (the game calls onChange on every change).
    draft: null,
    process() {
      const d = game.dynasty()
      if (!d) return
      const heritage = A.HERITAGES.includes(d.heritage) ? d.heritage : A.HERITAGES[0]
      EVENTS.dynasty.draft = { nomen: d.nomen || '', cognomen: d.cognomen || '', heritage }
      show({
        title: t('xDynasty'), image: ICONS.dynasty, message: t('xDynastyMsg'),
        inputs: [
          { type: 'text', title: t('xNomen'), value: d.nomen || '', onChange: call('dynasty', 'set', { field: 'nomen' }) },
          { type: 'text', title: t('xCognomen'), value: d.cognomen || '', onChange: call('dynasty', 'set', { field: 'cognomen' }) },
        ],
        dropdowns: [{
          title: t('xHeritage'), selected: A.HERITAGES.indexOf(heritage),
          options: A.HERITAGES.map(h => ({ label: t('xH_' + h), value: h })),
          onChange: call('dynasty', 'set', { field: 'heritage' }),
        }],
        options: [{ variant: 'info', text: t('xDynastyBtn'), action: call('dynasty', 'confirm') }, cancel()],
      })
    },
    set(_, { field, input, option }) {
      const draft = EVENTS.dynasty.draft
      if (draft) draft[field] = field === 'heritage' ? option?.value : input?.value
    },
    confirm() {
      const draft = EVENTS.dynasty.draft
      EVENTS.dynasty.draft = null
      if (draft) A.branchDynasty(draft)
    },
  },
  scenario: {
    visible: () => enabled('scenario'),
    process() {
      show({
        title: t('xScenario'), image: ICONS.scenario, message: t('xScenarioMsg'),
        options: [...SCENARIOS.list.map(sc => ({
          text: t('scn_' + sc.id), tooltip: t('scn_' + sc.id + '_info'), action: call('scenario', 'play', { id: sc.id }),
        })), { text: t('xNotNow') }],
      })
    },
    play: (_, { id }) => { A.playScenario(id) },
    // Wedding with Attica (Agrippa scenario): rewards and punishments go in statChanges.
    attica: (_, { yes }) => { if (yes) A.atticaWedding() },
  },
  // Argentarius: the bank and the investments (extras/finance). Each window leads to the
  // next through the game's queue (it opens when the previous one closes). The money is
  // moved by each option's statChanges; if the action can't be done (something changed
  // in between), it is refunded.
  bank: {
    visible: () => enabled('bank'),
    process() { show(finHub()) },
    hub() { next(finHub()) },
    borrowMenu() { next(finBorrow()) },
    borrow: (_, { amount }) => { FIN.borrow(amount) },
    repayMenu() { next(finRepay()) },
    repay: (_, { amount }) => { FIN.repay(amount) },
    lendMenu() { next(finLend()) },
    lendRate: (_, { id }) => { next(finLendRate(id)) },
    lend: (_, { id, rate, amount }) => { if (!FIN.lend(id, rate)) refund(amount) },
    sharesMenu() { next(finShares()) },
    buyMenu: (_, { cid }) => { next(finBuy(cid)) },
    buy: (_, { cid, amount, paid }) => { if (!FIN.buyShares(cid, amount)) refund(paid) },
    sellMenu() { next(finSell()) },
    sell: (_, { id, value }) => { if (!FIN.sellShares(id)) refund(-value) },
    seaMenu() { next(finSea()) },
    seaAmount: (_, { id }) => { next(finSeaAmount(id)) },
    sail: (_, { id, amount, pooled }) => { if (!FIN.sail(id, amount, pooled)) refund(amount) },
    portfolio() { next(finPortfolio()) },
    depositMenu() { next(finDeposit()) },
    deposit: (_, { amount }) => { FIN.deposit(amount) },
    withdraw: (_, { amount }) => { refund(FIN.withdraw(amount) - amount) },
    grainMenu() { next(finGrain()) },
    grainBuy: (_, { modii, paid }) => { if (!FIN.buyGrain(modii, paid)) refund(paid) },
    // fair: sale to the people at a fair price in a famine (gains influence); otherwise, in
    // a famine selling dear costs prestige.
    grainSell: (_, { modii, value, fair }) => {
      const n = FIN.sellGrain(modii)
      if (n < modii) refund(-Math.round(value * (modii - n) / modii))
      if (!n || !FIN.famine()) return
      if (fair) { const inf = FIN.fairSaleInfluence(n); S().current.influence += inf; finReport([{ key: 'finGrainFairDone', vars: { amount: n, influence: inf } }]) }
      else { const p = FIN.hoardPenalty(n), dyn = game.dynasty(); if (dyn) dyn.prestige -= p; finReport([{ key: 'finGrainHoarded', vars: { prestige: p } }]) }
    },
  },
  // Provincial governorships: windows at the start and end of a term (from sync).
  province: {
    choose: (_, { key, level }) => { PROV.choose(key, level) },
    trial: (_, { key, defense }) => {
      asked.delete(key)
      const r = PROV.trial(key, defense)
      if (r) next(provVerdict(r))
    },
  },
  // Matchmaker: opened from its button in the "Arrange Betrothal" window.
  matchmaker: {
    // Order in progress (what is being chosen in the dropdowns).
    draft: null,
    process(_, { characterId, isMatrilineal }) {
      const ch = S().characters[characterId]
      if (!ch || !game.SPOUSES?.valid(ch)) return
      const spec = EVENTS.matchmaker.draft?.characterId === characterId ? EVENTS.matchmaker.draft.spec : MM.defaultSpec()
      EVENTS.matchmaker.draft = { characterId, isMatrilineal, spec }
      show({
        title: t('xMatchmaker'), image: ICONS.matchmaker,
        message: t('xMmOrderMsg', { name: A.link(ch) }) + (isMatrilineal ? ' ' + t('xMmMatrilineal') : ''),
        dropdowns: orderFields().map(([field, title, options]) => ({
          title, options, selected: Math.max(0, options.findIndex(o => o.value === specGet(spec, field))),
          onChange: call('matchmaker', 'set', { field }),
        })),
        options: [payOption(), cancel()],
      })
      setTimeout(orderStyle, 50) // the window opens on the next cycle
    },
    // Change in a dropdown: it is saved and the pay button's price is updated.
    set(_, { field, option }) {
      const d = EVENTS.matchmaker.draft, m = S().interactionModal
      if (!d || !option) return
      specSet(d.spec, field, option.value)
      if (m?.options?.[0]?.action?.method === 'order') {
        const pay = payOption()
        // The game warns "You may not be able to afford this" only on opening; here, on change.
        Object.assign(m.options[0], pay, { cantAfford: !!pay.statChanges.cash && -pay.statChanges.cash * api().calculateScaleByClassFactor() > S().current.cash })
      }
    },
    order() {
      const d = EVENTS.matchmaker.draft
      if (d) MM.order(d.characterId, d.isMatrilineal, d.spec)
    },
  },
}

// Button to pay the order, with the total and its breakdown (or free).
function payOption() {
  const d = EVENTS.matchmaker.draft, q = MM.quote(d.spec), n = MM.COUNTS[d.spec.count]
  const cost = A.costsOn() ? q.total : 0
  return {
    variant: 'info', text: t('xMmOrderPay', { n, total: cost ? fmt(cost) : t('xFree') }),
    tooltip: A.costsOn() ? quoteText(q) : t('xFree'),
    statChanges: cost ? money(-cost) : {}, action: call('matchmaker', 'order'),
  }
}

// Money in statChanges: the game multiplies it by the class factor, so it is
// divided beforehand so that exactly `real` is charged (or given).
function money(real) { return { cash: real / api().calculateScaleByClassFactor() } }

// --- Argentarius windows ---------------------------------------------------------
// The next window, from another's action: it goes to the queue and opens when that one closes.
function next(modal) {
  api().pushInteractionModalQueue({ isManualOnly: true, image: ICONS.bank, ...modal })
  api().processInteractionModalQueue()
}
function refund(n) { if (n) S().current.cash += n }
const pct = x => (Math.round(x * 1000) / 10).toLocaleString() + '%'
const className = () => game.CLASSES?.[FIN.cls()] || String(FIN.cls())
const back = (method = 'hub') => ({ text: t('finBack'), action: call('bank', method) })
const close = () => ({ text: t('finClose') })
// Main menu option: disabled (with the reason) if not available.
const menuOption = (kind, text, method) => {
  const why = FIN.why(kind)
  return why ? { text, disabled: true, showDisabledWithTooltip: true, tooltip: t(why, { cls: game.CLASSES?.[FIN.MIN_CLASS[kind]] || '' }) }
    : { text, action: call('bank', method) }
}
// Front man note for senators.
const proxyNote = () => { const p = FIN.proxy(); return p ? ' ' + t('finProxyNote', { commission: pct(p.commission), scandal: pct(p.scandal) }) : '' }

// Attributes below 20, with their penalty ('' if none).
function lowSkills() {
  const low = ['stewardship', 'eloquence', 'intelligence', 'combat'].filter(k => FIN.penalty(k) < 1)
  return low.length ? ' ' + t('finHubPenalty', { list: low.map(k => t(k) + ' ' + Math.round(FIN.skillValue(k)) + ' (×' + FIN.penalty(k).toFixed(2) + ')').join(', ') }) : ''
}

function finHub() {
  const debt = FIN.debt()
  return {
    title: t('finTitle'), image: ICONS.bank,
    message: t('finHubMsg', { cls: className(), rate: pct(FIN.bankRate()), limit: fmt(FIN.bankLimit()) }) +
      (debt > 0 ? ' ' + t('finHubDebt', { debt: fmt(debt), rate: pct(FIN.debtRate()), interest: fmt(FIN.interest()) }) : '') + lowSkills(),
    options: [
      menuOption('bank', t('finBorrow'), 'borrowMenu'),
      ...(debt > 0 ? [{ text: t('finRepay', { debt: fmt(debt) }), action: call('bank', 'repayMenu') }] : []),
      menuOption('lend', t('finLend'), 'lendMenu'),
      menuOption('shares', t('finShares'), 'sharesMenu'),
      menuOption('sea', t('finSea'), 'seaMenu'),
      menuOption('bank', t('finDeposit'), 'depositMenu'),
      menuOption('bank', t('finGrain'), 'grainMenu'),
      { text: t('finPortfolio'), action: call('bank', 'portfolio') },
      close(),
    ],
  }
}

function finBorrow() {
  const offers = FIN.borrowOffers()
  return {
    title: t('finBorrow'),
    message: t('finBorrowMsg', { rate: pct(FIN.bankRate()), limit: fmt(FIN.bankLimit()), room: fmt(FIN.bankRoom()) }),
    options: [...offers.map(n => ({ text: t('finBorrowAmt', { amount: fmt(n) }), statChanges: money(n), action: call('bank', 'borrow', { amount: n }) })), back()],
  }
}

function finRepay() {
  const debt = FIN.debt()
  return {
    title: t('finRepayTitle'), message: t('finRepayMsg', { debt: fmt(debt) }),
    options: [...[...new Set([1000, 5000, debt])].filter(n => n <= debt).map(n => ({
      text: n === debt ? t('finPayOff', { amount: fmt(n) }) : t('finPay', { amount: fmt(n) }), statChanges: money(-n), action: call('bank', 'repay', { amount: n }),
    })), back()],
  }
}

function finLend() {
  const reqs = FIN.lendRequests()
  return {
    title: t('finLend'),
    message: (reqs.length ? t('finLendMsg', { room: fmt(FIN.lendRoom()) }) : t('finLendNone')) + ' ' + t('finSkillsLend'),
    options: [...reqs.map(r => ({
      text: t('finLendReq', { family: r.family, amount: fmt(r.amount), years: r.years }),
      tooltip: t('finDefaultEst', { risk: pct(FIN.shown(FIN.defaultChance(r, 9), r.fuzz)) }),
      action: call('bank', 'lendRate', { id: r.id }),
    })), back()],
  }
}

function finLendRate(id) {
  const r = FIN.lendRequests().find(x => x.id === id)
  if (!r) return finLend()
  return {
    title: t('finLend'), message: t('finLendRateMsg', { family: r.family, amount: fmt(r.amount), years: r.years }),
    options: [...FIN.lendRates().map(rate => ({
      text: t('finLendAt', { rate }), tooltip: t('finDefaultEst', { risk: pct(FIN.shown(FIN.defaultChance(r, rate), r.fuzz)) }),
      statChanges: money(-r.amount), action: call('bank', 'lend', { id, rate, amount: r.amount }),
    })), back('lendMenu')],
  }
}

function finShares() {
  const holdings = FIN.data().shares
  return {
    title: t('finShares'),
    message: t('finSharesMsg', { room: fmt(FIN.shareRoom()), fee: pct(FIN.shareFee()) }) + (FIN.atWar() ? ' ' + t('finAtWar') : '') + proxyNote() + ' ' + t('finSkillsShares'),
    options: [
      ...Object.keys(FIN.CONTRACTS).map(cid => {
        const c = FIN.contract(cid)
        return { text: t('fin_c_' + cid) + ' · ' + t('finYield', { min: c.min, max: c.max }),
          tooltip: t('finRiskEst', { risk: pct(FIN.shownContractRisk(cid)) }), action: call('bank', 'buyMenu', { cid }) }
      }),
      ...(holdings.length ? [{ text: t('finSellMenu', { n: holdings.length }), action: call('bank', 'sellMenu') }] : []),
      back(),
    ],
  }
}

function finBuy(cid) {
  const room = FIN.shareRoom(), fee = FIN.shareFee()
  const amounts = [...new Set([0.25, 0.5, 1].map(f => Math.round(room * f / 10) * 10))].filter(n => n >= 100)
  return {
    title: t('fin_c_' + cid), message: t('finBuyMsg', { room: fmt(room), fee: pct(fee) }),
    options: [...amounts.map(n => {
      const paid = Math.round(n * (1 + fee))
      return { text: t('finInvest', { amount: fmt(n) }), statChanges: money(-paid), action: call('bank', 'buy', { cid, amount: n, paid }) }
    }), back('sharesMenu')],
  }
}

function finSell() {
  return {
    title: t('finSellTitle'), message: t('finSellMsg', { factor: pct(FIN.sellFactor()) }),
    options: [...FIN.data().shares.map(sh => {
      const value = Math.round(sh.amount * FIN.sellFactor())
      return { text: t('finSellFor', { contract: t('fin_c_' + sh.contract), amount: fmt(sh.amount), value: fmt(value) }),
        statChanges: money(value), action: call('bank', 'sell', { id: sh.id, value }) }
    }), back('sharesMenu')],
  }
}

function finSea() {
  const offers = FIN.voyageOffers()
  return {
    title: t('finSea'),
    message: t('finSeaMsg', { room: fmt(FIN.seaRoom()) }) + (FIN.isWinter() ? ' ' + t('finWinter') : '') + proxyNote() + ' ' + t('finSkillsSea'),
    options: [...offers.map(o => ({
      text: t('finVoyage', { route: o.route, rate: o.rate, months: o.months }),
      tooltip: t('finWreckEst', { risk: pct(FIN.shown(FIN.voyageRisk(o), o.fuzz)) }),
      action: call('bank', 'seaAmount', { id: o.id }),
    })), back()],
  }
}

function finSeaAmount(id) {
  const o = FIN.voyageOffers().find(x => x.id === id)
  if (!o) return finSea()
  const room = FIN.seaRoom()
  const amounts = [...new Set([0.25, 0.5, 1].map(f => Math.round(room * f / 10) * 10))].filter(n => n >= 100)
  const opts = []
  for (const n of amounts) {
    opts.push({ text: t('finSail', { amount: fmt(n), rate: o.rate }), tooltip: t('finSailTip'), statChanges: money(-n), action: call('bank', 'sail', { id, amount: n, pooled: false }) })
    opts.push({ text: t('finSailPool', { amount: fmt(n), rate: o.rate - 5, n: FIN.POOL_SHIPS }), tooltip: t('finSailPoolTip'), statChanges: money(-n), action: call('bank', 'sail', { id, amount: n, pooled: true }) })
  }
  return { title: t('finVoyage', { route: o.route, rate: o.rate, months: o.months }), message: t('finSeaAmountMsg', { room: fmt(room) }), options: [...opts, back('seaMenu')] }
}

// Deposit at the temple of Castor: what is over the cash cap, a part, or
// taking it out. Warns if depositing would drop you a class (deposits do not count).
function finDeposit() {
  const cash = Math.floor(S().current.cash), dep = FIN.deposited(), excess = FIN.excessCash(), cap = FIN.cashCap()
  const drop = n => FIN.classAfter(n) < FIN.cls() ? t('finDepositDrop', { cls: game.CLASSES?.[FIN.classAfter(n)] || '' }) : ''
  const opt = n => ({ text: t('finDepositAmt', { amount: fmt(n) }), tooltip: drop(n) || undefined, statChanges: money(-n), action: call('bank', 'deposit', { amount: n }) })
  const amounts = [...new Set([0.25, 0.5, 1].map(f => Math.floor(cash * f / 10) * 10))].filter(n => n >= 100)
  const outs = [...new Set([0.25, 0.5, 1].map(f => f === 1 ? Math.floor(dep) : Math.floor(dep * f / 10) * 10))].filter(n => n >= 1)
  return {
    title: t('finDeposit'),
    message: t('finDepositMsg', { amount: fmt(dep), fee: pct(FIN.depositFee()), cap: Number.isFinite(cap) ? fmt(cap) : '∞' }) +
      ' ' + (excess > 0 ? t('finDepositExcess', { excess: fmt(excess) }) : t('finDepositUnder')) + ' ' + t('finDepositClass'),
    options: [
      ...(excess >= 1 ? [{ ...opt(excess), text: t('finDepositExcessBtn', { amount: fmt(excess) }) }] : []),
      ...amounts.filter(n => n !== excess).map(opt),
      ...outs.map(n => ({ text: n === Math.floor(dep) ? t('finWithdrawAll', { amount: fmt(n) }) : t('finWithdraw', { amount: fmt(n) }), statChanges: money(n), action: call('bank', 'withdraw', { amount: n }) })),
      back(),
    ],
  }
}

// Grain in the horrea: price of the month, harvest, estimate of the next and warnings.
const price2 = n => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
function finGrain() {
  const g = FIN.grain(), buy = FIN.grainBuyPrice(), sell = FIN.grainSellPrice(), room = FIN.grainRoom(), h = FIN.harvest().factor
  const fc = FIN.harvestForecast(), famine = FIN.famine()
  const notes = [t('finGrainHarvest', { factor: price2(h) }) + (famine ? ' ' + t('finGrainFamineNow') : '')]
  if (fc !== null) notes.push(t('finGrainForecast', { factor: price2(fc) }))
  if (FIN.doleNow()) notes.push(t('finGrainDole'))
  if (FIN.atWar()) notes.push(t('finGrainWar'))
  if (FIN.ownsCereal()) notes.push(t('finGrainOwn'))
  const buys = [...new Set([0.25, 0.5, 1].map(f => Math.floor(room * f / 10) * 10))].filter(n => n >= 100)
  const sells = [...new Set([0.5, 1].map(f => f === 1 ? g.modii : Math.floor(g.modii * f / 10) * 10))].filter(n => n >= 1)
  return {
    title: t('finGrain'),
    message: t('finGrainMsg', { buy: price2(buy), sell: price2(sell), stock: fmt(g.modii), room: fmt(room), paid: fmt(g.paid) }) + ' ' + notes.join(' ') + ' ' + t('finSkillsGrain'),
    options: [
      ...buys.map(n => { const paid = Math.round(n * buy); return { text: t('finGrainBuy', { modii: fmt(n), amount: fmt(paid) }), statChanges: money(-paid), action: call('bank', 'grainBuy', { modii: n, paid }) } }),
      ...sells.map(n => {
        const value = Math.round(n * sell)
        return { text: t('finGrainSell', { modii: fmt(n), amount: fmt(value) }), tooltip: famine ? t('finGrainHoardTip', { prestige: fmt(FIN.hoardPenalty(n)) }) : undefined,
          statChanges: money(value), action: call('bank', 'grainSell', { modii: n, value }) }
      }),
      ...(famine && g.modii >= 1 ? [{ text: t('finGrainFair', { modii: fmt(g.modii), amount: fmt(g.modii) }), tooltip: t('finGrainFairTip', { influence: fmt(FIN.fairSaleInfluence(g.modii)) }),
        statChanges: money(Math.round(g.modii)), action: call('bank', 'grainSell', { modii: g.modii, value: Math.round(g.modii), fair: true }) }] : []),
      back(),
    ],
  }
}

function finPortfolio() {
  const d = FIN.data(), parts = []
  if (FIN.debt() > 0) parts.push(t('finPfDebt', { debt: fmt(FIN.debt()), rate: pct(FIN.debtRate()) }))
  for (const l of d.lent) parts.push(t('finPfLent', { family: l.family, amount: fmt(l.amount), rate: pct(l.rate), year: l.endYear }))
  for (const sh of d.shares) parts.push(t('finPfShare', { contract: t('fin_c_' + sh.contract), amount: fmt(sh.amount) }))
  for (const v of d.voyages) parts.push(t('finPfVoyage', { route: v.route, amount: fmt(v.amount), rate: pct(v.rate), pooled: v.pooled ? ' (' + t('finPooled') + ')' : '' }))
  if (FIN.deposited() > 0) parts.push(t('finPfDeposit', { amount: fmt(FIN.deposited()) }))
  if (FIN.grain().modii > 0) parts.push(t('finPfGrain', { modii: fmt(FIN.grain().modii), paid: fmt(FIN.grain().paid) }))
  return { title: t('finPortfolio'), message: parts.length ? parts.join(' · ') : t('finPfEmpty'), options: [back(), close()] }
}

// Results report (ships returning, the year's payments): a game window.
function finReport(lines) {
  const text = lines.map(({ key, vars }) => t(key, Object.fromEntries(Object.entries(vars).map(([k, v]) =>
    [k, k === 'contract' ? t('fin_c_' + v) : typeof v === 'number' ? fmt(v) : v])))).join(' · ')
  api().pushInteractionModalQueue({ isManualOnly: true, title: t('finReport'), image: ICONS.bank, message: text, options: [{ text: t('xOk') }] })
  api().processInteractionModalQueue()
}

// --- Provincial governorships ------------------------------------------------------------
const postTitle = post => game.JOBS?.titles?.[post] || post
const govName = rec => { const ch = S().characters[rec.id]; return ch ? A.link(ch) : '?' }
// Trials already asked about in this session (if the window is lost, it is asked again
// when Stemma reloads).
const asked = new Set()

function provChoose(rec) {
  const opt = level => {
    const e = PROV.estimate(rec, level)
    return { text: t('provLevel_' + level), tooltip: e ? t('provLevelTip', { year: fmt(e.year), trial: pct(e.trial) }) : undefined, action: call('province', 'choose', { key: rec.key, level }) }
  }
  return { isManualOnly: true, title: t('provTitle', { post: postTitle(rec.post) }), image: ICONS.province, requireChoice: true,
    message: t('provChooseMsg', { name: govName(rec), province: rec.province }) + ' ' + t('provSkills'),
    options: ['honest', 'moderate', 'rapacious'].map(opt) }
}

function provEnded(rec) {
  const msg = t('provEndedMsg', { name: govName(rec), province: rec.province, amount: fmt(rec.accrued) }) +
    (rec.reward ? ' ' + t('provHonestReward', { prestige: fmt(rec.reward.prestige), influence: fmt(rec.reward.influence) }) : '')
  return { isManualOnly: true, title: t('provTitle', { post: postTitle(rec.post) }), image: ICONS.province, message: msg, options: [{ text: t('xOk') }] }
}

function provTrial(rec) {
  const ch = S().characters[rec.id]
  const opt = defense => {
    const cost = PROV.defenseCost(rec, defense)
    return { text: t('provDef_' + defense, { amount: fmt(cost) }), tooltip: t('provConvictTip', { risk: pct(PROV.convictChance(ch, defense)) }) + (defense === 'bribe' ? ' ' + t('provBribeTip', { risk: pct(PROV.DEFENSES.bribe.exposed) }) : ''),
      statChanges: cost ? money(-cost) : {}, action: call('province', 'trial', { key: rec.key, defense }) }
  }
  return { isManualOnly: true, title: t('provTrialTitle'), image: ICONS.province, requireChoice: true,
    message: t('provTrialMsg', { name: govName(rec), province: rec.province, amount: fmt(rec.accrued), restitution: fmt(rec.accrued * PROV.RESTITUTION) }),
    options: ['self', 'orator', 'bribe'].map(opt) }
}

function provVerdict(r) {
  const parts = [r.convicted ? t('provConvicted', { restitution: fmt(r.restitution), prestige: fmt(r.prestige), influence: fmt(r.influence) }) : t('provAcquitted')]
  if (r.exposed) parts.push(t('provBribeExposed'))
  return { title: t('provTrialTitle'), image: ICONS.province, message: parts.join(' '), options: [{ text: t('xOk') }] }
}

// Long dropdowns in Stemma's windows (order traits, themes): with a
// maximum height and a vertical bar to scroll them. Only while a Stemma
// window with dropdowns is open (class on <body>), so the game's own are not changed.
const MM_CLASS = 'cor-trainer-mm-open', MM_STYLE = 'cor-trainer-mm-style'
const isOrderOpen = () => {
  const m = S()?.interactionModal
  return !!m?.show && !!m.dropdowns?.some(d => game.HOOK.ours(d.onChange))
}
function orderStyle() {
  if (!document.getElementById(MM_STYLE)) {
    const st = document.createElement('style')
    st.id = MM_STYLE
    st.textContent = `
body.${MM_CLASS} #interactionModal .dropdown-menu{max-height:min(45vh,420px);overflow-y:auto;overscroll-behavior:contain;scrollbar-width:auto}
body.${MM_CLASS} #interactionModal .dropdown-menu::-webkit-scrollbar{width:12px}
body.${MM_CLASS} #interactionModal .dropdown-menu::-webkit-scrollbar-track{background:rgba(0,0,0,.12);border-radius:6px}
body.${MM_CLASS} #interactionModal .dropdown-menu::-webkit-scrollbar-thumb{background:#8a7350;border-radius:6px;border:2px solid transparent;background-clip:padding-box}
body.${MM_CLASS} #interactionModal .dropdown-menu::-webkit-scrollbar-thumb:hover{background-color:#b08d57}`
    document.head.appendChild(st)
  }
  document.body.classList.toggle(MM_CLASS, isOrderOpen())
}

// Matchmaker button in "Arrange Betrothal", next to "Pay to look for other
// "matches". The view belongs to the game, so the button is put back if the game
// redraws it.
const BTN_ID = 'cor-trainer-matchmaker'
function betrothalButton() {
  const view = game.betrothalView(), old = document.getElementById(BTN_ID)
  if (!view || !view.actions || !enabled('matchmaker') || !game.SPOUSES) { old?.remove(); return }
  if (old && old.parentElement === view.actions) return
  old?.remove()
  const b = document.createElement('button')
  b.id = BTN_ID
  b.className = 'btn btn-outline-secondary btn-sm'
  b.title = t('xMatchmakerBtn')
  const img = document.createElement('img')
  img.className = 'img-fluid img-icon-action'
  img.src = ICONS.matchmaker
  img.setAttribute('aria-hidden', 'true')
  b.appendChild(img)
  b.onclick = () => {
    const v = game.betrothalView()
    if (v) EVENTS.matchmaker.process(null, { characterId: v.targetId, isMatrilineal: v.isMatrilineal })
  }
  view.actions.appendChild(b)
}

// The game's methods go in "methods"; visible() is used as the preCheck.
for (const [name, e] of Object.entries(EVENTS)) {
  const methods = {}
  for (const [k, fn] of Object.entries(e)) if (typeof fn === 'function') methods[k] = fn
  game.HOOK?.register(name, { methods })
}

// --- Syncing the buttons ---------------------------------------------------------
// Adds or removes the buttons according to what is turned on and who can use them. It only
// touches the characters that change (each change redraws that character in the game).
const characterAction = f => ({
  title: t({ playAs: 'xPlayAs', divorce: 'xDivorce', adopt: 'xAdopt' }[f]),
  icon: ICONS[f], isAvailable: true, hideWhenBusy: f === 'adopt',
})
const GLOBAL = {
  bank: () => ({ title: t('finTitle'), icon: ICONS.bank }),
  theme: () => ({ title: t('xTheme'), icon: ICONS.theme }),
  dynasty: () => ({ title: t('xDynasty'), icon: ICONS.dynasty }),
  scenario: () => ({ title: t('xScenario'), icon: ICONS.scenario }),
}
function sync() {
  const s = S()
  if (!s || !game.DA || !game.HOOK) return
  const a = api(), now = sig()
  for (const f of Object.keys(GLOBAL)) {
    const key = ACTION(f), cur = s.current.actions?.[key]
    if (enabled(f) && cur?.sig !== now) {
      a.addGlobalAction({ key, action: { ...GLOBAL[f](), sig: now, isAvailable: true, preCheck: call(f, 'visible'), process: call(f, 'process') } })
    } else if (!enabled(f) && cur) a.deleteGlobalAction({ key })
  }
  for (const ch of Object.values(s.characters)) {
    if (!ch) continue
    for (const f of CHARACTER) {
      const key = ACTION(f), cur = ch.actions?.[key], want = VISIBLE[f](ch.id)
      if (want && cur?.sig !== now) {
        a.addCharacterAction({ characterId: ch.id, key, action: { ...characterAction(f), sig: now,
          preCheck: call(f, 'visible', { characterId: ch.id }), process: call(f, 'process', { characterId: ch.id }) } })
      } else if (!want && cur) a.deleteCharacterAction({ characterId: ch.id, key })
    }
    // Stemma buttons that no longer exist (e.g. the matchmaker, which is now in
    // the "Arrange Betrothal" window).
    for (const key of Object.keys(ch.actions || {})) {
      if (key.startsWith('trainer_') && !CHARACTER.includes(key.slice(8))) a.deleteCharacterAction({ characterId: ch.id, key })
    }
  }
  betrothalButton()
  orderStyle()
  // Wedding with Attica: a game window, as in the mod (only once).
  if (enabled('scenario') && A.atticaDue()) {
    const p = game.player()
    A.atticaDone()
    a.pushInteractionModalQueue({
      title: t('xAtticaTitle'), image: ICONS.scenario, message: t('xAttica'),
      options: [
        { text: t('xAtticaYes'), tooltip: t('xAtticaYesTip'), statChanges: A.atticaChanges(true), action: call('scenario', 'attica', { yes: true, characterId: p.id }) },
        { text: t('xAtticaNo'), tooltip: t('xAtticaNoTip'), statChanges: A.atticaChanges(false) },
      ],
    })
    a.processInteractionModalQueue()
  }
  // Finance: returning ships and the year's results (report), and the bank's
  // yearly payment. They appear even if the argentarius button is turned off: what is invested
  // keeps running and at least the interest has to be paid.
  const lines = FIN.tick()
  if (lines.length) finReport(lines)
  if (enabled('province')) {
    const pv = PROV.check()
    for (const rec of pv.ask) a.pushInteractionModalQueue(provChoose(rec))
    for (const { rec } of pv.ended) a.pushInteractionModalQueue(provEnded(rec))
    let n = pv.ask.length + pv.ended.length
    for (const rec of PROV.pendingTrials()) if (!asked.has(rec.key)) { asked.add(rec.key); a.pushInteractionModalQueue(provTrial(rec)); n++ }
    if (n) a.processInteractionModalQueue()
  }
  const bill = FIN.dueBill()
  if (bill) {
    a.pushInteractionModalQueue({
      title: t('finBill'), image: ICONS.bank, requireChoice: true,
      message: t('finBillMsg', { debt: fmt(bill.principal), rate: pct(bill.rate), interest: fmt(bill.interest) }),
      options: [
        ...bill.extras.map(x => ({ text: t('finPayExtra', { extra: fmt(x.extra) }), statChanges: money(-x.total), action: call('bank', 'repay', { amount: x.extra }) })),
        { text: t('finPayAll'), statChanges: money(-bill.all), action: call('bank', 'repay', { amount: bill.principal }) },
        { text: t('finPayInterest'), statChanges: money(-bill.interest) },
      ],
    })
    a.processInteractionModalQueue()
  }
}

// Opens the argentarius in the game (from the panel).
const openFinance = () => EVENTS.bank.process()

module.exports = { FEATURES, enabled, setEnabled, sync, openFinance }
