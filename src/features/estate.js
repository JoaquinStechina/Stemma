// Household properties. current.propertyDetails stores how many units you have
// of each type. The game works out a manageable limit (from class and
// stewardship); above 1.2× the limit there are events that make you lose
// properties. It takes the full width of the panel and spreads its groups over columns.
const { el } = require('core/dom')
const { t } = require('core/i18n')
const game = require('game')

const GROUPS = ['land', 'animal', 'boat', 'estate']

module.exports = {
  id: 'estate',
  fullWidth: true,
  build({ body, ui }) {
    const { S, PROPS } = game
    if (!PROPS) { ui.note(body, t('notAvailable')); return }

    const details = () => S().current.propertyDetails
    const setCount = (k, v) => game.setReactive(details(), k, Math.max(0, Math.floor(v)))
    const limit = k => Math.floor(PROPS.max(k) || 0)

    const propBulk = el('div', 'display:flex;gap:4px;justify-content:flex-end;margin:2px 0 4px', body)
    ui.button(propBulk, t('allToLimit'), () => Object.keys(PROPS.types).forEach(k => setCount(k, limit(k))))
    const propGrid = el('div', 'display:grid;grid-template-columns:repeat(auto-fit,minmax(270px,1fr));column-gap:22px;align-items:start', body)
    for (const g of GROUPS) {
      const keys = (PROPS.groups[g]?.properties || []).filter(k => PROPS.types[k])
      if (!keys.length) continue
      const col = ui.group(el('div', 'min-width:0', propGrid), PROPS.groupTitles[g] || g, 'estate.' + g)
      for (const k of keys) ui.addRow({
        label: PROPS.titles[k]?.title || k, wide: true,
        tip: (PROPS.titles[k]?.title || k) + (PROPS.titles[k]?.units ? ' (' + PROPS.titles[k].units + ')' : ''),
        get: () => details()?.[k] || 0,
        set: v => setCount(k, v),
        steps: [10],
        extra: [[t('toLimit'), () => setCount(k, limit(k))]],
        inline: () => '/ ' + limit(k),
        // yellow = above the limit; red = more than 1.2× (the game may take part away)
        inlineColor: () => {
          const n = details()?.[k] || 0, m = limit(k)
          return n > m * 1.2 ? '#e38a7a' : n > m ? '#e0c07a' : ''
        },
      }, col)
    }
    ui.note(body, t('propNote'))
  },
}
