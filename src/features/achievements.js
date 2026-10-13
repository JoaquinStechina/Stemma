// Achievements: mark or unmark obtained achievements, grouped as in the game, with a
// search box and filter. Each achievement has two checkboxes: obtained (global, like the
// game's achievements screen) and obtained in this playthrough. If "also on
// Steam" is on, marking an achievement unlocks it on Steam (core/achievements);
// removing it only removes it in the game. It takes the full width of the panel and spreads its
// groups over columns.
const { CTRL_CSS, el } = require('core/dom')
const { t } = require('core/i18n')
const game = require('game')
const ach = require('core/achievements')

// Current filter; outside build() so it is kept when the language changes.
let filterText = '', filterMode = 'all'

module.exports = {
  id: 'achievements',
  fullWidth: true,
  build({ body, ui }) {
    const { S, ACH } = game
    if (!ACH) { ui.note(body, t('notAvailable')); return }

    const titleOf = id => ACH.titles[id]?.title || id
    const descOf = id => ACH.titles[id]?.description || ''
    const groupTitle = g => { const x = ACH.titles.groups?.[g]; return (typeof x === 'string' ? x : x?.title) || g }
    const got = () => S()?.achievements || []
    const thisRun = () => S()?.current?.flagAchievementsThisRun || []

    // Steam: switch, send the ones already obtained and a warning if the game does not allow it.
    const steamRow = el('div', 'display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin:2px 0 4px', body)
    const steamLabel = el('label', 'display:flex;align-items:center;gap:6px;cursor:pointer', steamRow)
    steamLabel.title = t('achSteamTip')
    const steamCb = el('input', 'margin:0;cursor:pointer', steamLabel)
    steamCb.type = 'checkbox'
    steamCb.checked = ach.steamOn()
    steamCb.onchange = () => ach.setSteamOn(steamCb.checked)
    steamLabel.append(t('achSteam'))
    const sync = ui.button(steamRow, t('achSyncSteam'), () => {
      const ids = [...new Set(got())]
      if (!ids.length || !confirm(t('achConfirmSync', { n: ids.length }))) return
      const why = game.unlockSteam(ids)
      steamStatus.textContent = why ? t('steam_' + why) : t('achSyncDone', { n: ids.length })
    }, t('achSyncTip'))
    sync.style.marginLeft = 'auto'
    const steamStatus = el('div', 'font-size:11px;color:#e0c07a;width:100%', steamRow)
    ui.onRefresh(() => { const why = game.steamBlocked(); if (why) steamStatus.textContent = t('steam_' + why) })

    // Search box, filter, counter and buttons in one row (it wraps if the panel is narrow).
    const bar = el('div', 'display:flex;flex-wrap:wrap;align-items:center;gap:4px;margin:2px 0 4px', body)
    const search = el('input', CTRL_CSS + ';flex:1 1 180px;max-width:360px;min-width:0;padding:1px 4px', bar)
    search.type = 'search'
    search.placeholder = t('achSearch')
    search.value = filterText
    const mode = el('select', CTRL_CSS + ';padding:1px 2px', bar)
    for (const [v, k] of [['all', 'achFilterAll'], ['got', 'achFilterGot'], ['missing', 'achFilterMissing']]) {
      const o = el('option', '', mode)
      o.value = v
      o.textContent = t(k)
    }
    mode.value = filterMode
    search.addEventListener('input', () => { filterText = search.value; applyFilter() })
    mode.onchange = () => { filterMode = mode.value; applyFilter() }

    const counter = el('span', 'font-size:11px;opacity:.75;margin:0 4px;flex:1;white-space:nowrap', bar)
    // An achievement can be in several of the game's groups (e.g. "A Wedding" in Basics and
    // Family): it is shown in all of them, but counted and marked only once.
    const rows = []
    const shownIds = () => [...new Set(rows.filter(r => r.row.style.display !== 'none').map(r => r.id))]
    const bulk = el('div', 'display:flex;gap:4px;margin-left:auto', bar)
    ui.button(bulk, t('achMarkShown'), () => {
      const ids = shownIds()
      if (ids.length && ach.steamOn() && !confirm(t('achConfirmSteam', { n: ids.length }))) return
      ach.grant(ids)
    }, t('achShownTip'))
    ui.button(bulk, t('achUnmarkShown'), () => {
      const ids = shownIds().filter(id => got().includes(id))
      if (ids.length && confirm(t('achConfirmUnmark', { n: ids.length }))) game.setAchievements(ids, false)
    }, t('achShownTip'))

    // One collapsible block per game group, spread over columns as in Properties.
    const grid = el('div', 'display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));column-gap:22px;align-items:start', body)
    const groups = []
    for (const [g, ids] of Object.entries(ACH.groups || {})) {
      const col = el('div', 'min-width:0', grid)
      const box = ui.group(col, groupTitle(g), 'achievements.' + g)
      // Header of the two checkboxes, in each column so it stays aligned.
      const cols = el('div', 'display:flex;gap:6px;font-size:11px;opacity:.7;margin-top:2px', box)
      el('span', 'flex:1', cols).textContent = '✓ ' + t('achColGot')
      el('span', '', cols).textContent = t('achColRun')
      const groupRows = []
      for (const id of ids) {
        if (!ACH.list[id]) continue
        const row = el('div', 'display:flex;align-items:center;gap:6px;margin:2px 0', box)
        row.title = descOf(id)
        const cb = el('input', 'margin:0;cursor:pointer', row)
        cb.type = 'checkbox'
        const name = el('span', 'flex:1;min-width:0;cursor:pointer', row)
        name.textContent = titleOf(id)
        const run = el('input', 'margin:0 4px 0 0;cursor:pointer', row)
        run.type = 'checkbox'
        run.title = t('achColRun')
        cb.onchange = () => { if (cb.checked) ach.grant([id]); else game.setAchievements([id], false); ui.refresh(true) }
        name.onclick = () => cb.click()
        run.onchange = () => { game.setAchievementThisRun(id, run.checked); ui.refresh(true) }
        const r = { id, row, cb, run, text: (titleOf(id) + ' ' + descOf(id)).toLowerCase() }
        rows.push(r)
        groupRows.push(r)
      }
      groups.push({ col, rows: groupRows })
    }
    ui.note(body, t('achNote'))

    // Hides the achievements that do not match and the groups left empty.
    function applyFilter() {
      const q = filterText.trim().toLowerCase(), have = new Set(got())
      for (const r of rows) {
        const okText = !q || r.text.includes(q)
        const okMode = filterMode === 'all' || (filterMode === 'got' ? have.has(r.id) : !have.has(r.id))
        r.row.style.display = okText && okMode ? '' : 'none'
      }
      for (const g of groups) g.col.style.display =g.rows.some(r => r.row.style.display !== 'none') ? '' : 'none'
    }

    const allIds = [...new Set(rows.map(r => r.id))]
    ui.onRefresh(() => {
      const have = new Set(got()), run = new Set(thisRun())
      for (const r of rows) { r.cb.checked = have.has(r.id); r.run.checked = run.has(r.id) }
      counter.textContent = t('achCount', { got: allIds.filter(id => have.has(id)).length, total: allIds.length })
      if (filterMode !== 'all') applyFilter() // when marking/unmarking, an achievement can leave the filter
    })
    applyFilter()
  },
}
