// Stemma's events inside the game. The game's buttons (actions) and windows
// call their methods by event name: invokeMethod [bc91] looks them up in
// the events context [baa2] and calls methods[method](ctx, context).
//
// The buttons are saved with the game, so they have to work without
// Stemma too. If an event does not exist, bc91 logs it with console.warn, and the game stores
// every warning in current.sessionErrorLog [9b31]: since the preCheck is evaluated when
// the button is drawn [c29c], the warning redraws it and the game hangs in a loop.
// That is why everything goes through a "gate": lifeAndDeath/birth.preCheckIfAlive, a
// side-effect-free game check (characters[characterId] alive). Without characterId
// in the context it returns undefined, with no warnings: without Stemma, the buttons and the
// options of their windows do nothing. (The button isn't hidden either: the game uses
// the result of dispatch, which is a Promise and always counts as true.)
// With Stemma, the gate carries { trainer: { event, method, context } } to
// window.__corEvents (updated on every injection).
// Errors in Stemma's events do not go to console.warn (the same loop).
//
// Games saved earlier used 'trainer/<name>' events and, without Stemma, they
// hang the game on load. This file does not use require: stemma.mjs also runs it
// at the start of every page load (before the game), so those events
// already exist when the game loads the save, and sync() swaps them for the gate.
const GATE = { event: 'lifeAndDeath/birth', method: 'preCheckIfAlive' }
const PREFIX = './trainer/'

function run(name, method, ctx, context) {
  const fn = window.__corEvents[name]?.methods[method]
  if (!fn) return false // Stemma not injected yet, or an event from another version
  try { return fn(ctx, context) } catch (e) {
    window.__corErrors.push({ event: name, method, error: String(e && e.stack || e) })
    if (window.__corErrors.length > 50) window.__corErrors.shift()
    return false
  }
}

function patchGate(methods) {
  if (methods[GATE.method].__cor) return
  const orig = methods[GATE.method]
  const gate = function (ctx, c) {
    const tr = c && c.trainer
    if (!tr) return orig.apply(this, arguments)
    const { trainer, ...params } = c // e.g. { option } from a dropdown
    return run(tr.event, tr.method, ctx, { ...tr.context, ...params })
  }
  gate.__cor = true
  methods[GATE.method] = gate
}

// req: the game's webpack require function.
function install(req) {
  window.__corEvents = window.__corEvents || {}
  window.__corErrors = window.__corErrors || []
  req('baa2')
  const mod = req.c.baa2
  if (!mod.exports.__cor) {
    const orig = mod.exports
    const legacy = name => ({ default: { methods: new Proxy({}, { get: (_, m) => (ctx, c) => run(name, m, ctx, c) }) } })
    // The gate is installed when its event is requested (not before: at the start of the page, the game
    // hasn't loaded its modules yet).
    const wrap = key => {
      if (typeof key === 'string' && key.startsWith(PREFIX)) return legacy(key.slice(PREFIX.length))
      const m = orig(key)
      if (key === './' + GATE.event) patchGate(m.default.methods)
      return m
    }
    Object.assign(wrap, { keys: orig.keys, resolve: orig.resolve, id: orig.id, __cor: true })
    mod.exports = wrap
  }
}

module.exports = {
  install,
  // Reference to a Stemma method for the game's actions and windows.
  call: (event, method, context) => ({ ...GATE, context: { trainer: { event, method, context } } }),
  // Is it a Stemma method? (including those from earlier saves)
  ours: ref => !!ref?.context?.trainer || (typeof ref?.event === 'string' && ref.event.startsWith('trainer/')),
}
