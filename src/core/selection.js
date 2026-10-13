// Character and pet chosen in the dropdowns. They live outside the panel so they are
// kept when it is rebuilt (e.g. on a language change) and so other
// sections (Multipliers) use the same selection.
const game = require('game')

const sel = { charId: null, petId: null }
sel.character = () => game.S()?.characters?.[sel.charId]
sel.pet = () => game.pets()[sel.petId]

module.exports = sel
