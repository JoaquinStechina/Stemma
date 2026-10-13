// Panel sections, in their default order (the player can reorder them).
// To add a section: create features/<name>.js (see docs/development.md) and add it here.
module.exports = [
  require('features/resources'),
  require('features/family'),
  require('features/traitStacks'),
  require('features/pets'),
  require('features/estate'),
  require('features/multipliers'),
  require('features/achievements'),
  require('features/warEvents'),
  require('features/extras'),
]
