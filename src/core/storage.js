// Panel preferences in localStorage (language, position, size, order…).
// Never throws: if storage is unavailable, it returns the default value.
module.exports = {
  get: (k, d) => { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v) } catch { return d } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)) } catch {} },
}
