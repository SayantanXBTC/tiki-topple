// Single source of truth for tiki colors — matches gameEngine.js TIKIS exactly.
// `color`    = flat UI color (board orbs, legend dots)
// `emissive` = brightened glow variant for 3D material emissive channel

export const TIKI_COLORS = {
  hookipa: { color: '#a0a0a0', emissive: '#ffffff', name: 'Hookipa' }, // Silver/Diamond
  lani:    { color: '#a100ff', emissive: '#d946ef', name: 'Lani'    }, // Bright Amethyst
  kai:     { color: '#ff003c', emissive: '#ff4d79', name: 'Kai'     }, // Deep Ruby
  malu:    { color: '#ff00b3', emissive: '#ff66d9', name: 'Malu'    }, // Vibrant Magenta
  nalu:    { color: '#ffcc00', emissive: '#ffe666', name: 'Nalu'    }, // Pure Gold/Topaz
  pele:    { color: '#ff6600', emissive: '#ff9933', name: 'Pele'    }, // Bright Orange/Amber
  honu:    { color: '#00ff66', emissive: '#66ff99', name: 'Honu'    }, // Neon Emerald
  mana:    { color: '#00ccff', emissive: '#66e0ff', name: 'Mana'    }, // Neon Sapphire/Cyan
  koa:     { color: '#cc6600', emissive: '#ff9933', name: 'Koa'     }, // Bright Bronze
}
