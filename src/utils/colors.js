/**
 * Color palette for bookmark blocks
 * Each color has an id (used in data), CSS styles, and display name
 */

export const colors = [
  // Solid deep colors
  {
    id: 'deep-blue',
    name: 'Deep Blue',
    background: '#1e3a5f',
    glow: '#3b82f6'
  },
  {
    id: 'deep-purple',
    name: 'Deep Purple',
    background: '#3b1f5c',
    glow: '#a855f7'
  },
  {
    id: 'deep-emerald',
    name: 'Deep Emerald',
    background: '#064e3b',
    glow: '#10b981'
  },
  {
    id: 'deep-rose',
    name: 'Deep Rose',
    background: '#4c0519',
    glow: '#f43f5e'
  },

  // Neon accents
  {
    id: 'neon-cyan',
    name: 'Neon Cyan',
    background: '#0d4f52',
    glow: '#00f5ff'
  },
  {
    id: 'neon-magenta',
    name: 'Neon Magenta',
    background: '#4a1942',
    glow: '#ff00ff'
  },
  {
    id: 'neon-lime',
    name: 'Neon Lime',
    background: '#1a3d1a',
    glow: '#84cc16'
  },
  {
    id: 'neon-orange',
    name: 'Neon Orange',
    background: '#4a2512',
    glow: '#f97316'
  },

  // Gradients
  {
    id: 'gradient-cyan-purple',
    name: 'Cyan → Purple',
    background: 'linear-gradient(135deg, #0d4f52 0%, #3b1f5c 100%)',
    glow: '#00f5ff'
  },
  {
    id: 'gradient-purple-rose',
    name: 'Purple → Rose',
    background: 'linear-gradient(135deg, #3b1f5c 0%, #4c0519 100%)',
    glow: '#a855f7'
  },
  {
    id: 'gradient-blue-emerald',
    name: 'Blue → Emerald',
    background: 'linear-gradient(135deg, #1e3a5f 0%, #064e3b 100%)',
    glow: '#3b82f6'
  },
  {
    id: 'gradient-orange-magenta',
    name: 'Orange → Magenta',
    background: 'linear-gradient(135deg, #4a2512 0%, #4a1942 100%)',
    glow: '#f97316'
  },

  // Additional variants
  {
    id: 'midnight',
    name: 'Midnight',
    background: '#1a1a2e',
    glow: '#6366f1'
  },
  {
    id: 'charcoal',
    name: 'Charcoal',
    background: '#1f1f28',
    glow: '#71717a'
  },
  {
    id: 'gradient-lime-cyan',
    name: 'Lime → Cyan',
    background: 'linear-gradient(135deg, #1a3d1a 0%, #0d4f52 100%)',
    glow: '#84cc16'
  },
  {
    id: 'gradient-rose-orange',
    name: 'Rose → Orange',
    background: 'linear-gradient(135deg, #4c0519 0%, #4a2512 100%)',
    glow: '#f43f5e'
  },

  // Extended palette - Deep colors
  {
    id: 'deep-amber',
    name: 'Deep Amber',
    background: '#4a3728',
    glow: '#f59e0b'
  },
  {
    id: 'deep-teal',
    name: 'Deep Teal',
    background: '#134e4a',
    glow: '#14b8a6'
  },
  {
    id: 'deep-indigo',
    name: 'Deep Indigo',
    background: '#312e81',
    glow: '#6366f1'
  },
  {
    id: 'deep-sky',
    name: 'Deep Sky',
    background: '#0c4a6e',
    glow: '#0ea5e9'
  },

  // Extended palette - Neon colors
  {
    id: 'neon-yellow',
    name: 'Neon Yellow',
    background: '#3d3d1a',
    glow: '#facc15'
  },
  {
    id: 'neon-pink',
    name: 'Neon Pink',
    background: '#4a1a3d',
    glow: '#ec4899'
  },
  {
    id: 'neon-violet',
    name: 'Neon Violet',
    background: '#3b1a4a',
    glow: '#8b5cf6'
  },
  {
    id: 'neon-red',
    name: 'Neon Red',
    background: '#4a1a1a',
    glow: '#ef4444'
  },

  // Extended palette - Gradients
  {
    id: 'gradient-amber-rose',
    name: 'Amber → Rose',
    background: 'linear-gradient(135deg, #4a3728 0%, #4c0519 100%)',
    glow: '#f59e0b'
  },
  {
    id: 'gradient-teal-blue',
    name: 'Teal → Blue',
    background: 'linear-gradient(135deg, #134e4a 0%, #1e3a5f 100%)',
    glow: '#14b8a6'
  },
  {
    id: 'gradient-indigo-purple',
    name: 'Indigo → Purple',
    background: 'linear-gradient(135deg, #312e81 0%, #3b1f5c 100%)',
    glow: '#6366f1'
  },
  {
    id: 'gradient-pink-violet',
    name: 'Pink → Violet',
    background: 'linear-gradient(135deg, #4a1a3d 0%, #3b1a4a 100%)',
    glow: '#ec4899'
  },

  // Extended palette - Additional
  {
    id: 'slate',
    name: 'Slate',
    background: '#1e293b',
    glow: '#94a3b8'
  },
  {
    id: 'stone',
    name: 'Stone',
    background: '#292524',
    glow: '#a8a29e'
  },
  {
    id: 'gradient-sky-cyan',
    name: 'Sky → Cyan',
    background: 'linear-gradient(135deg, #0c4a6e 0%, #0d4f52 100%)',
    glow: '#0ea5e9'
  },
  {
    id: 'gradient-yellow-lime',
    name: 'Yellow → Lime',
    background: 'linear-gradient(135deg, #3d3d1a 0%, #1a3d1a 100%)',
    glow: '#facc15'
  }
]

/**
 * Get color config by id
 * @param {string} colorId
 * @returns {object|undefined}
 */
export function getColorById(colorId) {
  return colors.find(c => c.id === colorId)
}

/**
 * Get default color id
 * @returns {string}
 */
export function getDefaultColorId() {
  return 'gradient-cyan-purple'
}

/**
 * Check if color id is valid
 * @param {string} colorId
 * @returns {boolean}
 */
export function isValidColorId(colorId) {
  return colors.some(c => c.id === colorId)
}
