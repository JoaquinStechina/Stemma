// Panel translations. The texts are in locales/<language>.json; the host
// injects them as the "locales" module ({ es: {...}, en: {...}, ... }).
// The names of traits, jobs and properties come from the game (it only has English).
const ls = require('core/storage')
const LOCALES = require('locales')

const DEFAULT = 'en'
let lang = ls.get('corTrainerLang', DEFAULT)
if (!LOCALES[lang]) lang = DEFAULT

// t('key', { variable: value }) -> text in the current language. If it is missing in that
// language it uses the default one, and if that is missing too it returns the key.
const t = (key, vars) => {
  let s = LOCALES[lang][key] ?? LOCALES[DEFAULT][key] ?? key
  for (const k in vars || {}) s = s.replace('{' + k + '}', vars[k])
  return s
}

module.exports = {
  t,
  lang: () => lang,
  setLang: code => { if (LOCALES[code]) { lang = code; ls.set('corTrainerLang', lang) } },
  langName: code => LOCALES[code]?.langName || code,
}
