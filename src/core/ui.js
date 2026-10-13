// UI pieces reusable by the sections. createUI() is called on
// every panel build and keeps that build's rows and refreshes;
// ui.refresh() (called every 500 ms and after each action) updates what is shown.
const { CTRL_CSS, el, fmt } = require('core/dom')
const { t } = require('core/i18n')
const ls = require('core/storage')
const game = require('game')

// Collapsed blocks inside sections: { 'family.traits': true, … }.
const GROUPS_KEY = 'corTrainerGroups'

// Order and names of the trait groups in the dropdowns.
const GROUP_ORDER = ['education', 'personality', 'good', 'bad', 'goodGenetic', 'badGenetic', 'neutralGenetic', 'skill', 'militaryHonor', 'neutral']
const groupName = g => GROUP_ORDER.includes(g) ? t('g_' + g) : g

function createUI() {
  const rows = [], refreshers = []
  const ui = {}

  // Registers a function that runs on every refresh; it receives `force`
  // (true after a user action, to redraw even if nothing changed).
  ui.onRefresh = fn => refreshers.push(fn)

  ui.refresh = force => {
    for (const fn of refreshers) { try { fn(force) } catch (e) { console.warn('[stemma]', e) } }
    for (const { c, input, btns, sub, inline } of rows) {
      let on = true; try { on = c.enabled ? c.enabled() : true } catch { on = false }
      input.disabled = !on
      btns.forEach(b => { b.disabled = !on; b.style.opacity = on ? '' : '.4' })
      if (sub) { try { sub.textContent = c.suffix() } catch {} }
      if (inline) {
        try { inline.textContent = c.inline(); inline.style.color = c.inlineColor ? c.inlineColor() : ''; inline.style.opacity = inline.style.color ? '1' : '.7' } catch {}
      }
      if (document.activeElement === input) continue // don't overwrite what you are typing
      let v; try { v = c.get() } catch {}
      input.value = fmt(v)
    }
  }

  // Button that runs `fn` and refreshes the panel.
  ui.button = (parent, text, fn, tip) => {
    const b = el('button', CTRL_CSS + ';padding:1px 6px;cursor:pointer', parent)
    b.textContent = text
    if (tip) b.title = tip
    b.onclick = () => { try { fn(); ui.refresh(true) } catch (e) { console.warn('[stemma]', e) } }
    return b
  }

  // Full-width dropdown; `onchange(value)` and then refresh.
  ui.select = (parent, onchange) => {
    const s = el('select', CTRL_CSS + ';width:100%;padding:2px;margin:2px 0', parent)
    s.onchange = () => { onchange(s.value); ui.refresh(true) }
    return s
  }

  ui.note = (parent, text) => { const n = el('div', 'font-size:11px;opacity:.7;margin-top:3px', parent); n.textContent = text; return n }
  ui.subheading = (parent, text) => { const h = el('div', 'margin-top:6px;color:#d9bf8c;font-weight:600', parent); h.textContent = text }

  // Everything collapsible in the panel (sections and blocks): { set(collapsed), get() }.
  // Used by the "collapse all" / "expand all" header buttons.
  ui.collapsibles = []

  // Collapsible block inside a section: click the title to open/close.
  // `key` identifies the block to remember whether it is collapsed (e.g. 'family.traits');
  // `folded` = collapsed until the player opens it for the first time.
  // Returns the container to put the content in; its title is body.previousSibling.
  const groupState = ls.get(GROUPS_KEY, {})
  ui.group = (parent, text, key, folded = false) => {
    const head = el('div', 'margin-top:6px;color:#d9bf8c;font-weight:600;cursor:pointer', parent)
    const body = el('div', '', parent)
    const get = () => groupState[key] ?? folded
    const paint = () => { head.textContent = (get() ? '▸ ' : '▾ ') + text; body.style.display = get() ? 'none' : '' }
    const set = v => { groupState[key] = v; ls.set(GROUPS_KEY, groupState); paint() }
    head.onclick = () => set(!get())
    paint()
    ui.collapsibles.push({ set, get })
    return body
  }

  // Row: label, editable field (Enter or leaving the field = apply) and +N buttons.
  //   c = { label, get(), set(v), steps: [n, …] }
  // Optional: c.enabled() disables the row, c.extra = [[text, fn, tip], …] adds
  // buttons, c.suffix() a note below, c.inline() a short text next to the field
  // (with c.inlineColor()), c.wide = flexible label and narrow field (for long
  // names), c.tip = tooltip when hovering over the label.
  ui.addRow = (c, parent) => {
    const row = el('div', 'display:flex;align-items:center;gap:4px;margin:4px 0', parent)
    const label = el('span', c.wide ? 'flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap' : 'width:92px;flex-shrink:0', row)
    label.textContent = c.label
    label.title = c.tip || (c.wide ? c.label : '')
    const input = el('input', CTRL_CSS + ';' + (c.wide ? 'width:72px;flex:none' : 'flex:1;min-width:0') + ';padding:1px 4px;text-align:right;font-variant-numeric:tabular-nums', row)
    const inline = c.inline ? el('span', 'font-size:11px;min-width:44px;font-variant-numeric:tabular-nums', row) : null
    input.type = 'number'
    input.step = 'any'
    input.addEventListener('change', () => {
      const v = parseFloat(input.value)
      if (!Number.isNaN(v)) { try { c.set(v) } catch (e) { console.warn('[stemma]', e) } }
      ui.refresh(true)
    })
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') input.blur()
      else if (e.key === 'Escape') { input.value = fmt(c.get()); input.blur() }
    })
    const short = n => n >= 1000 ? (n / 1000) + 'k' : String(n)
    const btns = (c.steps || []).map(n => ui.button(row, '+' + short(n), () => c.set((c.get() || 0) + n)))
    for (const [text, fn, tip] of c.extra || []) btns.push(ui.button(row, text, fn, tip))
    let sub = null
    if (c.suffix) sub = el('div', 'font-size:11px;opacity:.7;text-align:right;margin:-3px 0 4px', parent)
    rows.push({ c, input, btns, sub, inline })
  }

  // Age row for a character or pet. The game works out age from
  // birthMonth/birthYear, so changing it means moving the birth year (the month
  // is kept). `extraNote(x)` adds text to the note below.
  ui.ageRow = (entity, parent, extraNote) => {
    const years = () => Math.floor(game.ageOf(entity()))
    const setAge = v => {
      const x = entity()
      if (!x) return
      x.birthYear += Math.floor(game.ageOf(x)) - Math.max(0, Math.floor(v))
    }
    ui.addRow({
      label: t('age'),
      get: () => entity() ? years() : undefined,
      set: setAge,
      enabled: () => !!entity(),
      steps: [1, 5],
      extra: [['−1', () => setAge(years() - 1)], ['−5', () => setAge(years() - 5)]],
      suffix: () => {
        const x = entity()
        if (!x) return ''
        const more = extraNote ? extraNote(x) : ''
        return t('bornIn', { year: x.birthYear }) + (more ? ' · ' + more : '')
      },
    }, parent)
  }

  // Trait editor (characters and pets): labels with × to remove and a
  // grouped dropdown to add.
  ui.traitEditor = (parent, { entity, list, title, describe, add, remove, available }) => {
    const chips = el('div', 'display:flex;flex-wrap:wrap;gap:4px;margin:4px 0', parent)
    const line = el('div', 'display:flex;gap:4px;margin-top:4px', parent)
    const pick = el('select', CTRL_CSS + ';flex:1;min-width:0;padding:2px', line)
    ui.button(line, t('add'), () => { const e = entity(); if (e && pick.value) add(e, pick.value) }, t('addTip'))
    ui.note(parent, t('traitNote'))
    if (!available) { chips.textContent = t('notAvailable'); line.style.display = 'none'; return }
    let sig = ''
    ui.onRefresh(force => {
      const e = entity(), owned = e?.traits || []
      const now = (e?.id || '') + ':' + owned.join(',')
      if (now === sig && !force) return
      sig = now
      chips.innerHTML = ''
      if (!e) { chips.innerHTML = '<span style="opacity:.6">—</span>'; pick.innerHTML = ''; return }
      if (!owned.length) { const n = el('span', 'opacity:.6', chips); n.textContent = t('noTraits') }
      for (const id of owned) {
        const chip = el('span', 'display:inline-flex;align-items:center;gap:3px;background:#2a2118;border:1px solid #5a4630;border-radius:10px;padding:0 4px 0 8px', chips)
        chip.title = describe(id)
        chip.append(title(id))
        const x = ui.button(chip, '×', () => remove(e, id), t('removeTrait'))
        x.style.cssText += ';border:none;background:none;padding:0 2px;font-weight:700'
      }
      ui.fillTraitSelect(pick, Object.keys(list()).filter(id => !owned.includes(id)), list(), title, describe)
    })
  }

  // Fills the `pick` dropdown with the traits `ids`, grouped and sorted by
  // name. Keeps the chosen one if it is still in the list.
  ui.fillTraitSelect = (pick, ids, defs, title, describe) => {
    const prev = pick.value
    pick.innerHTML = ''
    const byGroup = {}
    for (const id of ids) { const g = defs[id]?.group; (byGroup[g] = byGroup[g] || []).push(id) }
    for (const g of GROUP_ORDER.concat(Object.keys(byGroup).filter(g => !GROUP_ORDER.includes(g)))) {
      if (!byGroup[g]) continue
      const og = el('optgroup', '', pick)
      og.label = groupName(g)
      byGroup[g].sort((a, b) => title(a).localeCompare(title(b))).forEach(id => {
        const o = el('option', '', og)
        o.value = id
        o.textContent = title(id)
        o.title = describe(id)
      })
    }
    if (prev && ids.includes(prev)) pick.value = prev
  }

  // Fills `sel` with list() and rebuilds it only when the list changes.
  // If the chosen one disappears, picks the first. If another section changes the
  // shared selection, the dropdown follows it.
  ui.rosterSelect = (sel, list, getId, setId, label, emptyText) => {
    let sig = ''
    ui.onRefresh(() => {
      const items = list()
      const now = items.map(x => x.id + label(x)).join('|')
      if (now !== sig) {
        sig = now
        if (!items.some(x => x.id === getId())) setId(items[0]?.id ?? null)
        sel.innerHTML = ''
        if (!items.length) { const o = el('option', '', sel); o.value = ''; o.textContent = emptyText }
        for (const x of items) { const o = el('option', '', sel); o.value = x.id; o.textContent = label(x) }
      }
      if (document.activeElement !== sel && sel.value !== String(getId() ?? '')) sel.value = getId() ?? ''
    })
  }

  return ui
}

module.exports = { createUI }
