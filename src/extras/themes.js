// Color themes from Prahlad's "theme" mod (github.com/prahlad-swarnkar/CORmods):
// the same stylesheet with 4 colors per theme. It is applied with its own
// <style> tag (Stemma does not use the game's mods) and remembered in
// localStorage to apply it again on reload.
const ls = require('core/storage')

const KEY = 'corTrainerTheme'
const STYLE_ID = 'cor-trainer-theme'

// light = background, main = buttons and bars, accent = windows and labels, ink = text and borders.
// Green, Mono Mix and Vestalia are the mod's; the rest are Stemma's. The text of
// screens and windows becomes `ink` (the game's dark mode makes it light by
// inheritance), so each theme is readable with or without dark mode. dark = dark theme (dark
// background and light text; marked with ☾ in the lists).
const LIST = {
  baseGreen: { name: 'Green', light: 'lightgreen', main: 'darkgreen', accent: 'limegreen', ink: 'black' },
  monoMix: { name: 'Mono Mix', light: '#cad2c5', main: '#05668d', accent: '#bc8da0', ink: '#51344d' },
  vesta: { name: 'Vestalia', light: '#e6cdb8', main: '#01806e', accent: '#99dbd3', ink: '#b33921' },
  purple: { name: 'Imperial Purple', light: '#efe6f0', main: '#5b1a4a', accent: '#c9a0c0', ink: '#2a0a22' },
  marble: { name: 'Marble & Gold', light: '#f4f1ea', main: '#8a6d1f', accent: '#d9c88f', ink: '#3b3226' },
  pompeii: { name: 'Pompeian Red', light: '#f3dfc8', main: '#9e2a1b', accent: '#e0a07a', ink: '#4a1a10' },
  mare: { name: 'Mare Nostrum', light: '#dff0f4', main: '#0f4c6b', accent: '#8cc6d6', ink: '#0a2a3a' },
  olive: { name: 'Olive Grove', light: '#e8ead4', main: '#556b2f', accent: '#b5c27a', ink: '#2c3315' },
  legion: { name: 'Legion', light: '#efe2cf', main: '#7a1712', accent: '#c89a5a', ink: '#3a2414' },
  contrast: { name: 'High Contrast', light: '#ffffff', main: '#000000', accent: '#ffe14d', ink: '#000000' },
  // Dark ones: `deep` is a deep shade of `main` for the background of buttons, figures,
  // skills and bars, with the text in `ink` (contrast 8:1, AAA level); `main`
  // is kept for the borders. High Contrast Dark does not need it: black on yellow.
  saturnalia: { name: 'Saturnalia', light: '#2b2620', main: '#b8862b', deep: '#533c13', accent: '#4a3f30', ink: '#f0e2c0', dark: true },
  nox: { name: 'Nox', light: '#1b2333', main: '#6fa8dc', deep: '#2f475c', accent: '#2c3a52', ink: '#e3ecf7', dark: true },
  vesuvius: { name: 'Vesuvius', light: '#231f1e', main: '#e0662f', deep: '#672f16', accent: '#3d3331', ink: '#f2ddd2', dark: true },
  catacombs: { name: 'Catacombs', light: '#222222', main: '#c9b27c', deep: '#463e2b', accent: '#383838', ink: '#e8e2d4', dark: true },
  tyrianNight: { name: 'Tyrian Night', light: '#241628', main: '#c58bd0', deep: '#513955', accent: '#3c2742', ink: '#f1e2f3', dark: true },
  sacredGrove: { name: 'Sacred Grove', light: '#18241b', main: '#8fbf7a', deep: '#36492e', accent: '#2a3b2d', ink: '#e0eedb', dark: true },
  bronze: { name: 'Bronze Age', light: '#2a1f17', main: '#cd8f4f', deep: '#563c21', accent: '#45342a', ink: '#f3e3d1', dark: true },
  neptune: { name: 'Neptune', light: '#0f2229', main: '#4fc1c5', deep: '#204d4f', accent: '#1d3a44', ink: '#d9f2f3', dark: true },
  contrastDark: { name: 'High Contrast Dark', light: '#000000', main: '#ffe14d', accent: '#1a1a1a', ink: '#ffffff', dark: true },
}

// Name for the lists: dark ones with ☾.
const label = id => (LIST[id].dark ? '☾ ' : '') + LIST[id].name

// fill/text = background and text of buttons, figures, skills and bars; edge = their borders.
const css = ({ light, main, deep, accent, ink, dark }, bg) => {
  const fill = deep || main, text = deep ? ink : light, edge = deep ? main : ink
  return `
.container-main,.modal-content,.interaction-modal-content-message,.popover-body,.list-group-item{color:${ink} !important}
.container-main .text-muted,.modal-content .text-muted{color:${ink} !important;opacity:${dark ? '.85' : '.65'}}
${bg ? `#app{background:linear-gradient(hsla(0,0%,20%,.9),hsla(0,0%,20%,.9)),url("${bg}") !important}` : ''}
.container-main{background:${light} !important}
.btn{background:${fill} !important;color:${text} !important;border-color:${edge} !important}
.modal-title{background:${light} !important;color:${ink} !important;border-color:${accent} !important}
.modal-content{background:${light} !important}
.interaction-modal-content{background:${accent} !important}
.interaction-modal-content-message{background:${light} !important}
.progress{background:${deep ? light : accent} !important${deep ? `;box-shadow:inset 0 0 0 1px ${main}` : ''}}
.progress-bar{background:${fill} !important;color:${text} !important}
.stats-number{background:${fill} !important;color:${text} !important}
.img-thumbnail{background:${accent} !important;border-color:${ink} !important}
.character-tree-family-wrapper{border-color:${main} !important}
.badge-skills{background:${fill} !important;color:${text} !important}
.badge-light{background:${accent} !important}
.popover{background:${accent}}
.alert{background:${accent} !important;color:${ink} !important;border-color:${ink} !important}
.list-group-item{background:${accent} !important}
.active{background:${accent} !important;color:${ink} !important;border-color:${ink} !important}
.nav-link:hover{border-color:${ink} !important}
.nav{border-color:${ink} !important}
`
}

const current = () => { const id = ls.get(KEY, ''); return LIST[id] ? id : '' }

// Applies theme `id` ('' = the game's) and remembers it.
function apply(id) {
  document.getElementById(STYLE_ID)?.remove()
  if (!LIST[id]) { ls.set(KEY, ''); return }
  ls.set(KEY, id)
  // The game's background image (read without the theme applied), to darken it as the mod does.
  const app = document.getElementById('app')
  const bg = app ? (getComputedStyle(app).backgroundImage.match(/url\("?([^")]+)"?\)/) || [])[1] : ''
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = css(LIST[id], bg)
  document.head.appendChild(style)
}

module.exports = { LIST, label, current, apply }
