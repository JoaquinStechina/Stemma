// Entry point inside the game: builds the panel and registers the global
// shortcuts (only once per page, even if the panel is injected again).
const game = require('game')
const panel = require('core/panel')

panel.build()

// If the game window shrinks, the panel must not end up off screen.
if (!window.__corTrainerResize) {
  window.__corTrainerResize = true
  addEventListener('resize', () => {
    const p = document.getElementById('cor-trainer')
    if (!p) return
    p.style.left = Math.max(0, Math.min(p.offsetLeft, innerWidth - 80)) + 'px'
    p.style.top = Math.max(0, Math.min(p.offsetTop, innerHeight - 40)) + 'px'
  })
}

// F8 shows or hides the panel.
if (!window.__corTrainerKeys) {
  window.__corTrainerKeys = true
  window.addEventListener('keydown', e => {
    if (e.key === 'F8') {
      const p = document.getElementById('cor-trainer')
      if (p) p.style.display = p.style.display === 'none' ? '' : 'none'
    }
  })
}

// The host retries the injection until it receives 'ok' (save loaded).
module.exports = game.store() ? 'ok' : 'store-not-ready'
