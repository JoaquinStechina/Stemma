// DOM and style utilities shared by the panel and the sections.

// Common style for buttons, fields and dropdowns.
const CTRL_CSS = 'background:#3a2e20;color:#f3e6c8;border:1px solid #b08d57;border-radius:4px'

// Creates an element with inline style and, if given, appends it to `parent`.
const el = (tag, css, parent) => { const e = document.createElement(tag); if (css) e.style.cssText = css; if (parent) parent.appendChild(e); return e }

// Number with up to two decimals; empty if it is not a number.
const fmt = v => typeof v === 'number' ? String(Math.round(v * 100) / 100) : ''

module.exports = { CTRL_CSS, el, fmt }
