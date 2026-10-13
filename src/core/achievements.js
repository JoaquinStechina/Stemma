// Achievements Stemma unlocks: they are marked in the game and, if the "also
// on Steam" option is on (it is by default), unlocked on Steam. Used by the
// Achievements section and the trait ones: some traits have an achievement with the same id
// (the crowns, oneHand, fat, veteran…), and adding them unlocks it.
// The forced outcomes of military events go through the game itself, which
// unlocks its achievements on its own.
const ls = require('core/storage')
const game = require('game')

const STEAM_KEY = 'corTrainerSteam'
const steamOn = () => ls.get(STEAM_KEY, true)
const setSteamOn = v => ls.set(STEAM_KEY, !!v)

// Marks the achievements (ids that aren't achievements are ignored). Returns '' or the reason
// they were not sent to Steam (see game.unlockSteam).
function grant(ids) {
  ids = ids.filter(id => game.ACH?.list[id])
  if (!ids.length) return ''
  game.setAchievements(ids, true)
  return steamOn() ? game.unlockSteam(ids) : ''
}

module.exports = { steamOn, setSteamOn, grant }
