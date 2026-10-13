// Stemma :: companion for Citizen of Rome - Dynasty Ascendant, over the Chrome DevTools Protocol
//
// Requirements: Node 22+ (uses native fetch and WebSocket, no dependencies).
// Usage:
//   1. Steam -> game -> Properties -> Launch options:
//        --remote-debugging-port=9222
//   2. node stemma.mjs (if the game is not open yet, it waits for it)
//        --dev    injects the panel again when you save changes in src/ or locales/
//        --check  validates src/ and locales/ without opening the game
//   3. Open the game and load your save.
//   4. In the game, press F8 to show/hide Stemma's panel.
//
// The script stays connected and injects the panel again if the game reloads
// the page; if the game closes, it waits for it to open again. Ctrl+C to
// quit (the panel disappears when the game reloads).
//
// The panel lives in src/ (it runs INSIDE the game). This file bundles it
// into a single script with a minimal CommonJS-style loader: each file in src/
// is a module whose id is its path without ".js" (e.g. "core/ui"), used with
// require('core/ui') and module.exports. The entry point is src/main.js.
// The texts are in locales/<language>.json and reach the panel as the "locales" module.

import { readFileSync, readdirSync, watch } from 'fs'
import { dirname, join, relative, basename } from 'path'
import { fileURLToPath } from 'url'

const PORT = Number(process.env.CDP_PORT || 9222)
const ROOT = dirname(fileURLToPath(import.meta.url))
const SRC = join(ROOT, 'src')
const LOCALES = join(ROOT, 'locales')
const BASE_LANG = 'en' // reference language: the others must have the same keys

// --- Bundling ----------------------------------------------------------------

function listModules(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap(d => {
    const p = join(dir, d.name)
    if (d.isDirectory()) return listModules(p)
    return d.name.endsWith('.js') ? [p] : []
  })
}

// Reads locales/*.json -> { es: {...}, en: {...}, ... }. A malformed JSON is an
// error with the file name.
function loadLocales() {
  const out = {}
  for (const name of readdirSync(LOCALES).filter(n => n.endsWith('.json')).sort()) {
    try { out[basename(name, '.json')] = JSON.parse(readFileSync(join(LOCALES, name), 'utf8')) } catch (e) {
      throw new Error(`locales/${name}: ${e.message}`)
    }
  }
  if (!out[BASE_LANG]) throw new Error(`missing locales/${BASE_LANG}.json`)
  return out
}

// Warnings (not errors) if a language does not have the same keys as the reference one.
// A missing key is shown in the reference language in the panel.
function localeWarnings(locales) {
  const base = Object.keys(locales[BASE_LANG])
  const warnings = []
  for (const [lang, texts] of Object.entries(locales)) {
    const keys = Object.keys(texts)
    const missing = base.filter(k => !keys.includes(k)), extra = keys.filter(k => !base.includes(k))
    if (missing.length) warnings.push(`locales/${lang}.json: missing ${missing.join(', ')}`)
    if (extra.length) warnings.push(`locales/${lang}.json: extra ${extra.join(', ')}`)
  }
  return warnings
}

// Returns the script to inject: defines each module and runs require('main').
function bundle() {
  const files = listModules(SRC).sort()
  const locales = loadLocales()
  for (const w of localeWarnings(locales)) console.warn('Warning:', w)
  let out = '(() => {\n' +
    'const __mods = {}, __cache = {}\n' +
    'const __def = (id, fn) => { __mods[id] = fn }\n' +
    'const require = id => {\n' +
    '  if (__cache[id]) return __cache[id].exports\n' +
    "  if (!__mods[id]) throw new Error('[stemma] module not found: ' + id)\n" +
    '  const module = { exports: {} }\n' +
    '  __cache[id] = module\n' +
    '  __mods[id](require, module, module.exports)\n' +
    '  return module.exports\n' +
    '}\n' +
    '__def("locales", function (require, module) { module.exports = ' + JSON.stringify(locales) + ' })\n'
  for (const file of files) {
    const id = relative(SRC, file).replace(/\\/g, '/').replace(/\.js$/, '')
    out += '__def(' + JSON.stringify(id) + ', function (require, module, exports) {\n' + readFileSync(file, 'utf8') + '\n})\n'
  }
  return out + "return require('main')\n})()"
}

// Script the game runs at the start of every page load, before its own
// code: src/hook.js (does not use require) and a fake webpack chunk that runs as soon as
// chunk-vendors loads, before the game, and hands hook.js the require function.
function early() {
  return [
    '(() => {',
    'if (window.__corEarly) return',
    'window.__corEarly = true',
    'const module = { exports: {} }',
    ';(function (require, module, exports) {',
    readFileSync(join(SRC, 'hook.js'), 'utf8'),
    '})(null, module, module.exports)',
    "const id = '__corEarly', q = window.webpackJsonp = window.webpackJsonp || []",
    "q.push([[id], { [id]: (m, e, r) => { window.__corReq = r; try { module.exports.install(r) } catch (err) { window.__corEarlyError = String(err) } } }, [[id, 'chunk-vendors']]])",
    '})()',
  ].join('\n')
}

// --check: bundles and compiles (without running) to catch errors without opening the game.
function check() {
  const code = bundle()
  new Function(code)
  new Function(early())
  const locales = loadLocales()
  console.log(`OK: ${listModules(SRC).length} modules, ${Object.keys(locales).length} languages (${Object.keys(locales).join(', ')}), ${(code.length / 1024).toFixed(1)} KB.`)
}

// --- Connection to the game --------------------------------------------------------

async function findGamePage() {
  const res = await fetch(`http://127.0.0.1:${PORT}/json/list`)
  const targets = await res.json()
  const page = targets.find(t => t.type === 'page' && /index\.html/.test(t.url))
    || targets.find(t => t.type === 'page')
  if (!page) throw new Error('Could not find the game window on the debugging port.')
  return page
}

function connect(wsUrl) {
  const ws = new WebSocket(wsUrl)
  let nextId = 1
  const pending = new Map()
  const listeners = new Set()
  ws.onmessage = ev => {
    const msg = JSON.parse(ev.data)
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id)
      pending.delete(msg.id)
      msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result)
    } else if (msg.method) {
      listeners.forEach(fn => fn(msg))
    }
  }
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = nextId++
    pending.set(id, { resolve, reject })
    ws.send(JSON.stringify({ id, method, params }))
  })
  const opened = new Promise((resolve, reject) => {
    ws.onopen = resolve
    ws.onerror = () => reject(new Error('Could not open the debugging WebSocket.'))
  })
  return { ws, send, opened, on: fn => listeners.add(fn) }
}

async function inject(send) {
  // It is bundled on every injection, so changes in src/ apply on reload.
  const expression = bundle()
  // Retries until Vue and the save are ready.
  for (let i = 0; i < 60; i++) {
    const r = await send('Runtime.evaluate', { expression, returnByValue: true })
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || 'injection error')
    if (r.result.value === 'ok') return true
    await new Promise(res => setTimeout(res, 1000))
  }
  return false
}

const sleep = ms => new Promise(res => setTimeout(res, ms))
// A response from the game, or null if it does not answer (e.g. hung).
const within = (p, ms) => Promise.race([p, sleep(ms).then(() => null)])

// Page state: does it already have hook.js's gate? Is a save loaded?
const PROBE = `({ early: !!window.__corEarly, hooked: !!window.__corReq?.c?.baa2?.exports?.__cor,
  loaded: !!document.querySelector('#app')?.__vue__?.$store?.state?.current?.id })`

// One connection to the game, until it closes.
async function session(page, dev) {
  console.log(`Connected to: ${page.title || page.url}`)
  const { ws, send, opened, on } = connect(page.webSocketDebuggerUrl)
  await opened
  const closed = new Promise(res => { ws.onclose = res })

  // hook.js on every page load, before the game: that way a save with
  // buttons from an earlier version of Stemma doesn't hang the game on load.
  // If the game is hung it doesn't answer: carry on anyway (within) and warn below.
  await within(send('Page.addScriptToEvaluateOnNewDocument', { source: early() }), 5000)
  await within(send('Page.enable'), 5000)

  // An error in src/ or locales/ is reported without closing Stemma.
  const tryInject = async () => {
    try { return await inject(send) } catch (e) { console.error('Error injecting the panel:', e.message); return false }
  }
  on(async msg => {
    if (msg.method === 'Page.loadEventFired') {
      console.log('The game reloaded the page, injecting the panel again...')
      if (await tryInject()) console.log('Panel ready (F8).')
    }
  })

  const probe = await within(send('Runtime.evaluate', { expression: PROBE, returnByValue: true }), 5000)
  const state = probe?.result?.value
  if (!state) {
    console.log('The game is not responding. If it hung while loading a save, close it and open it again:')
    console.log('Stemma waits for it and prepares it before the save loads.')
  } else if (!state.early && !state.hooked && !state.loaded) {
    // The game is starting without hook.js: reload once so it has it.
    console.log('Preparing the game before the save loads...')
    await send('Page.reload')
  } else if (await tryInject()) console.log('Panel ready. Press F8 inside the game to show or hide it.')
  else console.log('The game has no save loaded yet; the panel will appear on reload.')

  if (dev) dev.inject = tryInject
  console.log('Leave this window open. Ctrl+C to quit.')
  await closed
}

async function main() {
  if (process.argv.includes('--check')) {
    try { return check() } catch (e) { console.error('Error:', e.message); process.exit(1) }
  }

  // --dev: when a file in src/ or locales/ is saved, inject the panel again (grouping
  // changes that arrive almost at once, e.g. several files saved together).
  const dev = process.argv.includes('--dev') ? { inject: null } : null
  if (dev) {
    let timer, changed = new Set()
    for (const dir of [SRC, LOCALES]) {
      watch(dir, { recursive: true }, (event, file) => {
        if (!file || !/\.(js|json)$/.test(file)) return // ignore editor temp files
        changed.add(relative(ROOT, join(dir, file)).replace(/\\/g, '/'))
        clearTimeout(timer)
        timer = setTimeout(async () => {
          if (!dev.inject) return
          console.log(`Changes in ${[...changed].join(', ') || 'files'}: injecting the panel again...`)
          changed = new Set()
          if (await dev.inject()) console.log('Panel updated.')
        }, 200)
      })
    }
    console.log('Development mode: changes in src/ and locales/ apply when you save.')
  }

  // Wait for the game (if it is not open yet) and wait again if it closes.
  for (let waiting = false; ; ) {
    let page = null
    try { page = await findGamePage() } catch {}
    if (!page) {
      if (!waiting) {
        console.log(`Waiting for the game on port ${PORT}...`)
        console.log('(Steam -> game -> Properties -> Launch options: --remote-debugging-port=9222)')
        waiting = true
      }
      await sleep(250)
      continue
    }
    waiting = false
    try { await session(page, dev) } catch (e) { console.error('Connection error:', e.message) }
    if (dev) dev.inject = null
    console.log('The game closed.')
    await sleep(1000)
  }
}

main()
