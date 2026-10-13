// Roman finance: the bank (argentarius) and three historical ways to invest.
//   - Borrowing from the bank: every class (in debt bondage, only paying).
//   - Lending to other families: from Class I.
//   - Publican companies (state contracts): Class I small shares,
//     Equites with no special limit, Senatores only through a front man.
//   - Maritime loan (fenus nauticum): from Class III; Senatores through a front man.
//   - Deposit at the temple of Castor: every class. What is deposited is not cash,
//     so the game does not take it for going over the cap (see game.WEALTH); it charges a
//     yearly safekeeping fee and doesn't count for class.
//   - Grain in the horrea: every class. It is bought cheap after the harvest
//     (Quintilis–September) and sold dear before the next one (Aprilis–Iunius); it
//     rots, rats eat it or it is stolen, and the aedile sometimes hands out cheap grain.
// Your character's own attributes count (skills with their traits, no cap). 20 is neutral:
// below it penalizes (×(v/20)^1.24: 15 → ×0.70; 10 → ×0.42; minimum ×0.1) and above it
// improves without limit, per extra ten (30 → 1, 40 → 2…).
//   Stewardship = higher amounts, more of what you collect (interest, dividends,
//     ship profits) and fewer defaults by those who owe you.
//   Eloquence = less interest when borrowing, better price when buying and selling shares.
//   Intelligence = less risk (contracts and routes) and a more accurate displayed risk.
//   Combat = you recover more of a defaulted debt and guard the granary better.
// The economy's limits still apply: minimum interest 4%, probabilities up to 90%, you never
// recover more than 100% of a debt or sell a share for more than its value.
//   Honorable = −0.5 interest points; Greedy = you can charge 15% but there are more defaults;
//   Sly = cheaper front man (10% commission, 3% scandal).
// It is saved with the game in current.modFlags.trainerFinance (and the earlier bank,
// trainerBank, moves here). The payment and the yearly results arrive in Martius (month 3),
// when the game runs its yearly events; ships, when their voyage is up.
const game = require('game')

const FLAG = 'trainerFinance'
const OLD_BANK = 'trainerBank'
const YEAR_MONTH = 3 // Martius
const WINTER = [11, 12, 0, 1, 2] // November–Mercedonius: mare clausum
const MONTHS_PER_YEAR = 13

// By class: Proletarii, V, IV, III, II, I, Equites, Senatores.
const BANK_LIMIT = [600, 1500, 3000, 5000, 8000, 15000, 40000, 100000]
const BANK_RATE = [12, 11.5, 11, 10.5, 10, 9, 8.33, 8.33] // % a year (12% = centesima; 8⅓% = Twelve Tables)
const LEND_LIMIT = [0, 0, 0, 0, 0, 10000, 25000, 60000]
const SHARE_LIMIT = [0, 0, 0, 0, 0, 5000, 30000, 30000]
const SEA_LIMIT = [0, 0, 0, 2000, 3000, 6000, 15000, 30000]
const MIN_CLASS = { lend: 5, shares: 5, sea: 3 }

// State contracts: yearly yield (%), yearly risk of failure and what is lost.
const CONTRACTS = {
  asia: { min: 8, max: 20, risk: 0.06, loss: 0.7 },
  sicily: { min: 5, max: 11, risk: 0.02, loss: 0.5 },
  mines: { min: 6, max: 16, risk: 0.04, loss: 0.6 },
  works: { min: 4, max: 8, risk: 0.01, loss: 0.4 },
  army: { min: 3, max: 7, risk: 0.02, loss: 0.6, war: { min: 10, max: 24, risk: 0.06 } },
}
const ROUTES = ['Alexandria', 'Carthago', 'Gades', 'Massilia', 'Rhodus', 'Antiochia', 'Ostia', 'Puteoli']
const POOL_SHIPS = 50

const S = () => game.S()
const rnd = (a, b) => a + Math.random() * (b - a)
const rint = (a, b) => Math.floor(rnd(a, b + 1))
const round10 = n => Math.max(0, Math.round(n / 10) * 10)
const nowAbs = () => S().year * MONTHS_PER_YEAR + S().month

// --- Character and class ---------------------------------------------------------------
const player = () => game.player()
const PIVOT = 20
// All accept another character (ch); the default is yours.
const skillValue = (k, ch = player()) => Math.max(0, parseFloat(ch?.skills?.[k]) || 0)
// Penalty below 20 (1 from 20).
const penalty = (k, ch) => { const v = skillValue(k, ch); return v >= PIVOT ? 1 : Math.max(0.1, (v / PIVOT) ** 1.24) }
// Tens above 20, no cap (30 → 1, 40 → 2).
const above = (k, ch) => Math.max(0, skillValue(k, ch) - PIVOT) / 10
// Factor for something good (amounts, collections): the penalty below 20; above, +rate per ten.
const better = (k, rate, ch) => skillValue(k, ch) < PIVOT ? penalty(k, ch) : 1 + rate * above(k, ch)
// Factor for something bad (risks, commissions, defaults): grows below 20; above, it is divided.
const worse = (k, rate, ch) => skillValue(k, ch) < PIVOT ? 2 - penalty(k, ch) : 1 / (1 + rate * above(k, ch))
const has = (tr, ch = player()) => !!ch?.traits?.includes(tr)
const cls = () => Math.max(0, Math.min(7, S().current.class || 0))
const isSenator = () => cls() >= 7
const debtSlave = () => !!S().current.flagIsDebtSlave
const size = () => better('stewardship', 0.75) // 15 → ×0.70; 20 → ×1; 30 → ×1.75; 40 → ×2.5
const gains = () => better('stewardship', 0.1) // interest, dividends and ship profits
// Front man (Senatores): commission on what you earn and yearly scandal risk.
const proxy = () => isSenator() ? { commission: has('sly') ? 0.1 : 0.2, scandal: has('sly') ? 0.03 : 0.05 } : null

// --- Saved data -----------------------------------------------------------------
function data() {
  const api = game.DA.api()
  let d = api.getGlobalFlag({ flag: FLAG })
  if (!d) {
    d = { debt: { principal: 0, rate: 0, billedYear: null }, lent: [], shares: [], voyages: [], offers: {}, yearDone: null, monthDone: null }
    const old = api.getGlobalFlag({ flag: OLD_BANK }) // earlier bank (peritiSumus's mod)
    if (old?.principal > 0) d.debt = { principal: old.principal, rate: old.rate || 0.083, billedYear: old.billedYear ?? null }
    api.setGlobalFlag({ flag: FLAG, data: d })
  }
  // Parts that came later (data saved with an earlier version).
  if (!d.deposit) d.deposit = { amount: 0, feeYear: null }
  if (!d.grain) d.grain = { modii: 0, paid: 0, harvest: null, next: null }
  if (!d.provinces) d.provinces = {}
  return d
}
const save = d => game.DA.api().setGlobalFlag({ flag: FLAG, data: d })
const sum = (list, k = 'amount') => list.reduce((a, x) => a + (x[k] || 0), 0)

// --- Availability ------------------------------------------------------------------
// '' = available; otherwise, the reason (text key).
function why(kind) {
  if (debtSlave()) return 'finDebtSlave'
  if (kind === 'bank') return ''
  return cls() >= MIN_CLASS[kind] ? '' : 'finMinClass_' + kind
}

// --- Bank: borrowing -----------------------------------------------------------
// Eloquence: below 20 up to +4 points; above, −2 points per ten.
const eloPoints = () => skillValue('eloquence') < PIVOT ? 4 * (1 - penalty('eloquence')) : -2 * above('eloquence')
const bankRate = () => Math.max(4, BANK_RATE[cls()] + eloPoints() - (has('honorable') ? 0.5 : 0)) / 100
const bankLimit = () => round10(BANK_LIMIT[cls()] * size())
const debt = () => Math.max(0, data().debt.principal)
const debtRate = () => data().debt.rate || bankRate()
const interest = () => Math.ceil(debt() * debtRate())
const bankRoom = () => Math.max(0, bankLimit() - debt())
const borrowOffers = () => [0.25, 0.5, 0.75, 1].map(f => round10(bankRoom() * f)).filter((n, i, a) => n >= 50 && a.indexOf(n) === i)

// The money is given by the caller (panel: directly; game window: statChanges).
function borrow(amount) {
  const d = data(), s = S(), p = d.debt.principal, r = bankRate()
  d.debt.rate = p > 0 ? (p * d.debt.rate + amount * r) / (p + amount) : r
  d.debt.principal = p + amount
  if (p <= 0) d.debt.billedYear = s.month >= YEAR_MONTH ? s.year : s.year - 1 // first payment in the next Martius
  save(d)
}
function repay(amount) { const d = data(); d.debt.principal = Math.max(0, d.debt.principal - amount); save(d) }

// Yearly bank payment: once a year, from Martius. Returns the options or null.
function dueBill() {
  if (busy()) return null
  const d = data(), s = S()
  if (d.debt.principal <= 0 || s.month < YEAR_MONTH || (d.debt.billedYear ?? -Infinity) >= s.year) return null
  d.debt.billedYear = s.year
  save(d)
  const i = Math.ceil(d.debt.principal * d.debt.rate)
  return { interest: i, principal: d.debt.principal, rate: d.debt.rate,
    extras: [100, 500, 1000, 2500, 5000].filter(x => d.debt.principal > x).map(x => ({ extra: x, total: x + i })), all: d.debt.principal + i }
}

// --- Lending to other families --------------------------------------------------------
const lendLimit = () => round10(LEND_LIMIT[cls()] * size())
const lendRoom = () => Math.max(0, lendLimit() - sum(data().lent))
const lendRates = () => has('greedy') ? [6, 9, 12, 15] : [6, 9, 12]
// Yearly default probability by rate: more interest, more defaults.
const defaultChance = (req, ratePct) => Math.min(0.9, (1 - req.reliability) * (0.3 + 0.1 * (ratePct - 4)) * worse('stewardship', 0.5) * (has('greedy') ? 1.2 : 1))
// Of a defaulted debt you recover 30% with combat 20; less below and +25 points per
// ten above (up to 100%).
const recovery = () => skillValue('combat') < PIVOT ? 0.3 * penalty('combat') : Math.min(1, 0.3 + 0.25 * above('combat'))
// What you see: an estimate (±60% with intelligence 20; more accurate the more intelligence).
const shown = (real, fuzz) => Math.max(0, real * (1 + fuzz * worse('intelligence', 1)))

// The month's offers (loan requests, contracts, voyages): redone every month.
function offers(kind, make) {
  const d = data(), key = kind, now = nowAbs()
  if (d.offers[key]?.at !== now) { d.offers[key] = { at: now, list: make() }; save(d) }
  return d.offers[key].list
}
function takeOffer(kind, id) { const d = data(); d.offers[kind].list = (d.offers[kind]?.list || []).filter(o => o.id !== id); save(d) }

const lendRequests = () => why('lend') ? [] : offers('lend', () => {
  const mine = player()?.dynastyId
  const dyns = Object.values(S().dynasties).filter(x => x && x.id !== mine && x.nomen)
  const room = lendRoom()
  return Array.from({ length: 3 }, (_, i) => {
    const dy = dyns[rint(0, dyns.length - 1)] || {}
    return { id: 'l' + nowAbs() + i, family: [dy.nomen, dy.cognomen].filter(Boolean).join(' ') || 'Ignotus',
      amount: round10(room * rnd(0.15, 0.6)), years: rint(1, 3), reliability: rnd(0.85, 0.99), fuzz: rnd(-0.6, 0.6) }
  }).filter(r => r.amount >= 100)
})
function lend(reqId, ratePct) {
  const req = lendRequests().find(r => r.id === reqId)
  if (!req || req.amount > lendRoom()) return false
  const d = data()
  d.lent.push({ id: req.id, family: req.family, amount: req.amount, rate: ratePct / 100, endYear: S().year + req.years, reliability: req.reliability })
  save(d)
  takeOffer('lend', reqId)
  return req
}

// --- Publican companies --------------------------------------------------------
const atWar = () => !!S().current.flagRomeAtWar
const contract = id => { const c = CONTRACTS[id]; return atWar() && c.war ? { ...c, ...c.war } : c }
const contractRisk = id => Math.min(0.9, contract(id).risk * worse('intelligence', 0.5))
const shareLimit = () => round10(SHARE_LIMIT[cls()] * size())
const shareRoom = () => Math.max(0, shareLimit() - sum(data().shares))
const shareFee = () => 0.05 * worse('eloquence', 1) // commission when buying: 5% with eloquence 20
// When selling: 90% with eloquence 20; less below; above, it approaches 100%.
const sellFactor = () => skillValue('eloquence') < PIVOT ? 0.9 * (0.5 + 0.5 * penalty('eloquence')) : 1 - 0.1 / (1 + above('eloquence'))
// Risk estimate for each contract, different every year.
const contractFuzz = () => offers('contracts', () => Object.fromEntries(Object.keys(CONTRACTS).map(k => [k, rnd(-0.6, 0.6)])))
const shownContractRisk = id => shown(contractRisk(id), contractFuzz()[id] || 0)
function buyShares(cid, amount) {
  if (!CONTRACTS[cid] || amount > shareRoom()) return false
  const d = data()
  d.shares.push({ id: 's' + nowAbs() + '_' + d.shares.length, contract: cid, amount, since: S().year })
  save(d)
  return true
}
function sellShares(id) {
  const d = data(), sh = d.shares.find(x => x.id === id)
  if (!sh) return 0
  d.shares = d.shares.filter(x => x.id !== id)
  save(d)
  return Math.round(sh.amount * sellFactor())
}

// --- Maritime loan (fenus nauticum) ----------------------------------------------
const seaLimit = () => round10(SEA_LIMIT[cls()] * size())
const seaRoom = () => Math.max(0, seaLimit() - sum(data().voyages))
const isWinter = () => WINTER.includes(S().month)
const voyageOffers = () => why('sea') ? [] : offers('sea', () => {
  const pool = [...ROUTES].sort(() => Math.random() - 0.5).slice(0, 3)
  return pool.map((route, i) => ({ id: 'v' + nowAbs() + i, route, rate: rint(20, 35), months: rint(3, 5), risk: rnd(0.1, 0.2), fuzz: rnd(-0.6, 0.6) }))
})
const voyageRisk = o => Math.min(0.9, o.risk * (isWinter() ? 2 : 1) * worse('intelligence', 0.5))
// Spread over 50 ships (Cato's method): 5 points less interest.
const voyageRate = (o, pooled) => (o.rate - (pooled ? 5 : 0)) / 100
function sail(offerId, amount, pooled) {
  const o = voyageOffers().find(x => x.id === offerId)
  if (!o || amount > seaRoom()) return false
  const d = data()
  d.voyages.push({ id: o.id, route: o.route, amount, rate: voyageRate(o, pooled), risk: voyageRisk(o), pooled: !!pooled, due: nowAbs() + o.months })
  save(d)
  takeOffer('sea', offerId)
  return true
}

// --- Deposit at the temple of Castor -----------------------------------------------
// Yearly safekeeping: 1% with eloquence 20 (less with more eloquence, never below 0.1%).
// A fire at the temple (very rare) burns part of the deposit.
const TEMPLE_FIRE = { risk: 0.004, loss: 0.25 }
const depositFee = () => Math.max(0.001, 0.01 * worse('eloquence', 1))
const deposited = () => Math.max(0, data().deposit.amount)
const cashCap = () => game.WEALTH?.cashCap() ?? Infinity
const excessCash = () => Math.max(0, Math.floor(S().current.cash - cashCap()))
// Class you would have if you take `amount` out of cash (to warn before depositing).
const classAfter = amount => game.WEALTH ? game.WEALTH.classFor(S().current.cash - amount) : cls()
function deposit(amount) {
  const d = data()
  if (d.deposit.amount <= 0) d.deposit.feeYear = S().month >= YEAR_MONTH ? S().year : S().year - 1 // first safekeeping in the next Martius
  d.deposit.amount += amount
  save(d)
}
// Takes out up to `amount`; returns what it took out.
function withdraw(amount) {
  const d = data(), n = Math.min(amount, d.deposit.amount)
  d.deposit.amount -= n
  save(d)
  return n
}

// --- Grain in the horrea -------------------------------------------------------------
// Price of a modius: base 1 × season × the year's harvest × war × a bit each month.
// The harvest is known in Quintilis (month 7) and holds until the following Iunius; from
// Martius the next one can be estimated (more accurate the more intelligence). A very
// bad harvest is a famine: grain is worth 1.5 times more, but selling dear in a famine
// costs prestige (or you can sell to the people at a fair price and gain influence).
const SEASON = [1.08, 1.11, 1.14, 1.17, 1.2, 1.22, 1.14, 0.88, 0.85, 0.9, 0.96, 1, 1.04] // Ianuarius…December
const HARVEST_MONTH = 7 // Quintilis
const OWN_HARVEST = [7, 8, 9] // with grain land you buy cheaper
const GRAIN_LIMIT = [1000, 2500, 5000, 8000, 12000, 25000, 60000, 100000] // modii per class
const GRAIN_RISK = {
  rot: 0.006, // loss per month (damp, weevils)
  rats: { risk: 0.02, min: 0.08, max: 0.2 }, // per month
  theft: { risk: 0.015, loss: 0.12 }, // per month
  dole: 0.12, // per month, Martius–Iunius: the aedile hands out cheap grain (price ×0.75)
  famine: 1.18, // harvest from which there is famine
}
const CEREAL = ['farmland', 'primeFarmland', 'latifundiumFood']
const grain = () => data().grain
const rollHarvest = () => ({ factor: rnd(0.8, 1.25), fuzz: rnd(-0.6, 0.6) })
// Harvest in effect now; from Martius the next one is also rolled (to estimate it).
function harvest() {
  const d = data(), g = d.grain, s = S()
  const year = s.month >= HARVEST_MONTH ? s.year : s.year - 1 // the harvest being eaten
  if (g.harvest?.year !== year) {
    const roll = g.next?.year === year ? g.next : rollHarvest()
    g.harvest = { year, factor: roll.factor }
    g.next = null
    save(d)
  }
  if (s.month >= YEAR_MONTH && s.month < HARVEST_MONTH && g.next?.year !== s.year) { g.next = { year: s.year, ...rollHarvest() }; save(d) }
  return g.harvest
}
const famine = () => harvest().factor >= GRAIN_RISK.famine
const doleNow = () => offers('dole', () => S().month >= YEAR_MONTH && S().month < HARVEST_MONTH && Math.random() < GRAIN_RISK.dole)
const grainPrice = () => {
  const noise = offers('grainNoise', () => rnd(0.94, 1.06))
  return SEASON[S().month] * harvest().factor * (famine() ? 1.5 : 1) * (atWar() ? 1.15 : 1) * noise * (doleNow() ? 0.75 : 1)
}
// Estimate of the next harvest (null outside Martius–Iunius).
const harvestForecast = () => { harvest(); const n = grain().next; return n ? shown(n.factor, n.fuzz * 0.5) : null }
const ownsCereal = () => CEREAL.some(k => (S().current.propertyDetails?.[k] || 0) > 0)
// When buying you pay a commission (3% with eloquence 20); with grain land, at
// harvest, 10% less. When selling you are paid 95% (with eloquence 20; with 10, 89%;
// above, it approaches 100%).
const grainBuyPrice = () => grainPrice() * (1 + 0.03 * worse('eloquence', 1)) * (ownsCereal() && OWN_HARVEST.includes(S().month) ? 0.9 : 1)
const grainSellFactor = () => skillValue('eloquence') < PIVOT ? 0.95 * (0.8 + 0.2 * penalty('eloquence')) : 1 - 0.05 / (1 + above('eloquence'))
const grainSellPrice = () => grainPrice() * grainSellFactor()
const grainLimit = () => Math.round(GRAIN_LIMIT[cls()] * size())
const grainRoom = () => Math.max(0, grainLimit() - grain().modii)
function buyGrain(modii, paid) {
  if (modii > grainRoom()) return false
  const d = data()
  d.grain.modii += modii
  d.grain.paid += paid
  save(d)
  return true
}
// Sells `modii` (or what is left); returns how many it sold.
function sellGrain(modii) {
  const d = data(), n = Math.min(modii, d.grain.modii)
  if (n <= 0) return 0
  d.grain.paid *= 1 - n / d.grain.modii
  d.grain.modii -= n
  save(d)
  return n
}
// Selling dear in a famine: prestige lost (more the more you sell; double
// for senators). Selling to the people at a fair price (1 per modius): influence.
const hoardPenalty = modii => { const p = game.dynasty()?.prestige || 0; return Math.round(p * Math.min(0.1, 0.02 * modii / 1000) * (isSenator() ? 2 : 1)) }
const fairSaleInfluence = modii => Math.round(modii / 20)

// The game is passing the month: it processes it in a Worker on a copy of the state and
// applies the changes when done, so whatever is paid now could be lost.
const busy = () => !!S()?.current?.showSpinner

// --- Results: ships (every month) and the year (in Martius) -----------------------------
// Applies the money and returns the report lines ([] if nothing happened).
function tick() {
  if (busy()) return []
  const s = S(), d = data(), now = nowAbs(), lines = [], px = proxy()
  const pay = n => { s.current.cash += n }
  if (d.monthDone !== now) {
    d.monthDone = now
    for (const v of d.voyages.filter(x => x.due <= now)) {
      // What arrives: the capital of the ships that arrive plus their interest; the interest
      // (the profit) is multiplied by stewardship and pays the front man's commission.
      let ok = 0, n = v.pooled ? POOL_SHIPS : 1
      for (let i = 0; i < n; i++) if (Math.random() >= v.risk) ok++
      const capital = v.amount * ok / n
      let profit = capital * v.rate * gains()
      if (px) profit *= 1 - px.commission
      const back = Math.round(capital + profit)
      pay(back)
      if (v.pooled) lines.push({ key: 'finSeaPool', vars: { route: v.route, ok, n, amount: back } })
      else if (ok) lines.push({ key: 'finSeaOk', vars: { route: v.route, amount: back } })
      else lines.push({ key: 'finSeaLost', vars: { route: v.route, amount: v.amount } })
    }
    d.voyages = d.voyages.filter(x => x.due > now)
    // Grain: a little rots every month; sometimes rats or thieves.
    const g = d.grain
    if (g.modii > 0) {
      const lose = (frac, key) => {
        const n = Math.min(g.modii, Math.round(g.modii * frac))
        if (n <= 0) return
        g.paid *= 1 - n / g.modii
        g.modii -= n
        if (key) lines.push({ key, vars: { amount: n } })
      }
      lose(GRAIN_RISK.rot * worse('stewardship', 0.5))
      if (Math.random() < Math.min(0.9, GRAIN_RISK.rats.risk * worse('intelligence', 0.5))) lose(rnd(GRAIN_RISK.rats.min, GRAIN_RISK.rats.max), 'finGrainRats')
      if (Math.random() < Math.min(0.9, GRAIN_RISK.theft.risk * worse('combat', 0.5))) lose(GRAIN_RISK.theft.loss, 'finGrainTheft')
    }
    // The new harvest, if you hold grain or have used it.
    if (s.month === HARVEST_MONTH && (g.modii > 0 || g.harvest)) {
      const h = harvest().factor
      lines.push({ key: h >= GRAIN_RISK.famine ? 'finGrainFamine' : h > 1.05 ? 'finGrainPoor' : h < 0.92 ? 'finGrainGood' : 'finGrainNormal', vars: {} })
    }
  }
  if (s.month >= YEAR_MONTH && d.yearDone !== s.year) {
    d.yearDone = s.year
    // Loans to families: interest, repayment at the end or default.
    for (const l of [...d.lent]) {
      if (Math.random() < defaultChance(l, l.rate * 100)) {
        const back = Math.round(l.amount * recovery())
        pay(back)
        lines.push({ key: 'finLendDefault', vars: { family: l.family, amount: back } })
        d.lent = d.lent.filter(x => x !== l)
        continue
      }
      const i = Math.round(l.amount * l.rate * gains())
      pay(i)
      if (s.year >= l.endYear) {
        pay(l.amount)
        lines.push({ key: 'finLendDone', vars: { family: l.family, amount: l.amount + i } })
        d.lent = d.lent.filter(x => x !== l)
      } else lines.push({ key: 'finLendPaid', vars: { family: l.family, amount: i } })
    }
    // Companies: dividend or failure of the contract.
    for (const sh of d.shares) {
      const c = contract(sh.contract)
      if (Math.random() < contractRisk(sh.contract)) {
        const lost = Math.round(sh.amount * c.loss)
        sh.amount -= lost
        lines.push({ key: 'finShareLoss', vars: { contract: sh.contract, amount: lost } })
      } else {
        let div = sh.amount * rnd(c.min, c.max) / 100 * gains()
        if (px) div *= 1 - px.commission
        pay(Math.round(div))
        lines.push({ key: 'finShareDiv', vars: { contract: sh.contract, amount: div } })
      }
    }
    d.shares = d.shares.filter(x => x.amount >= 1)
    // Deposit: the year's safekeeping and, very rarely, a fire at the temple.
    if (d.deposit.amount > 0 && (d.deposit.feeYear ?? -Infinity) < s.year) {
      d.deposit.feeYear = s.year
      const fee = Math.ceil(d.deposit.amount * depositFee())
      d.deposit.amount -= fee
      lines.push({ key: 'finDepositFee', vars: { amount: fee, left: d.deposit.amount } })
      if (Math.random() < TEMPLE_FIRE.risk) {
        const lost = Math.round(d.deposit.amount * TEMPLE_FIRE.loss)
        d.deposit.amount -= lost
        lines.push({ key: 'finTempleFire', vars: { amount: lost } })
      }
    }
    // Front man: if discovered, the senator loses prestige and influence.
    if (px && (d.shares.length || d.voyages.length) && Math.random() < px.scandal) {
      const dyn = game.dynasty()
      const p = Math.round((dyn?.prestige || 0) * 0.05), inf = Math.round(Math.max(0, s.current.influence) * 0.1)
      if (dyn) dyn.prestige -= p
      s.current.influence -= inf
      lines.push({ key: 'finScandal', vars: { prestige: p, influence: inf } })
    }
  }
  save(d)
  return lines
}

module.exports = {
  CONTRACTS, MIN_CLASS, ROUTES, POOL_SHIPS,
  PIVOT, cls, isSenator, proxy, skillValue, penalty, size, gains, why, data,
  bankRate, bankLimit, bankRoom, borrowOffers, debt, debtRate, interest, borrow, repay, dueBill,
  lendLimit, lendRoom, lendRates, lendRequests, defaultChance, shown, lend,
  contract, contractRisk, shownContractRisk, shareLimit, shareRoom, shareFee, sellFactor, buyShares, sellShares, atWar,
  seaLimit, seaRoom, isWinter, voyageOffers, voyageRisk, voyageRate, sail,
  depositFee, deposited, cashCap, excessCash, classAfter, deposit, withdraw, TEMPLE_FIRE,
  SEASON, GRAIN_RISK, grain, harvest, famine, doleNow, grainPrice, harvestForecast, ownsCereal, grainBuyPrice, grainSellPrice,
  grainLimit, grainRoom, buyGrain, sellGrain, hoardPenalty, fairSaleInfluence,
  better, worse, has, rnd, nowAbs, YEAR_MONTH,
  busy, tick,
}
