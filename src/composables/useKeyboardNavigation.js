import { ref, readonly, onMounted, onUnmounted, computed } from 'vue'

// === Configuration ===
const config = {
  blockSelectionTimeout: 1500,
  showKeyHints: true,
  keyHintOpacity: 0.4
}

// === State machine states ===
const STATES = {
  IDLE: 'IDLE',
  BLOCK_SELECTED: 'BLOCK_SELECTED'
}

// === Key mappings (using event.code for layout independence) ===
const BLOCK_CODES = ['KeyQ', 'KeyW', 'KeyE', 'KeyR', 'KeyA', 'KeyS', 'KeyD', 'KeyF']
const TAB_CODES = ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8']

// Full mapping: blockCode → { cellCodes, cells: { cellCode → {row, col} } }
// Based on spec table (columns and rows are 0-indexed)
const BLOCK_MAPPINGS = {
  // Upper blocks (rows 0-1)
  KeyQ: {
    cellCodes: ['KeyQ', 'KeyW', 'KeyA', 'KeyS'],
    cells: {
      KeyQ: { row: 0, col: 0 },
      KeyW: { row: 0, col: 1 },
      KeyA: { row: 1, col: 0 },
      KeyS: { row: 1, col: 1 }
    },
    labels: { topLeft: 'Q', topRight: 'W', bottomLeft: 'A', bottomRight: 'S' }
  },
  KeyW: {
    cellCodes: ['KeyW', 'KeyE', 'KeyS', 'KeyD'],
    cells: {
      KeyW: { row: 0, col: 2 },
      KeyE: { row: 0, col: 3 },
      KeyS: { row: 1, col: 2 },
      KeyD: { row: 1, col: 3 }
    },
    labels: { topLeft: 'W', topRight: 'E', bottomLeft: 'S', bottomRight: 'D' }
  },
  KeyE: {
    cellCodes: ['KeyE', 'KeyR', 'KeyD', 'KeyF'],
    cells: {
      KeyE: { row: 0, col: 4 },
      KeyR: { row: 0, col: 5 },
      KeyD: { row: 1, col: 4 },
      KeyF: { row: 1, col: 5 }
    },
    labels: { topLeft: 'E', topRight: 'R', bottomLeft: 'D', bottomRight: 'F' }
  },
  KeyR: {
    cellCodes: ['KeyR', 'KeyT', 'KeyF', 'KeyG'],
    cells: {
      KeyR: { row: 0, col: 6 },
      KeyT: { row: 0, col: 7 },
      KeyF: { row: 1, col: 6 },
      KeyG: { row: 1, col: 7 }
    },
    labels: { topLeft: 'R', topRight: 'T', bottomLeft: 'F', bottomRight: 'G' }
  },
  // Lower blocks (rows 2-3)
  KeyA: {
    cellCodes: ['KeyA', 'KeyS', 'KeyZ', 'KeyX'],
    cells: {
      KeyA: { row: 2, col: 0 },
      KeyS: { row: 2, col: 1 },
      KeyZ: { row: 3, col: 0 },
      KeyX: { row: 3, col: 1 }
    },
    labels: { topLeft: 'A', topRight: 'S', bottomLeft: 'Z', bottomRight: 'X' }
  },
  KeyS: {
    cellCodes: ['KeyS', 'KeyD', 'KeyX', 'KeyC'],
    cells: {
      KeyS: { row: 2, col: 2 },
      KeyD: { row: 2, col: 3 },
      KeyX: { row: 3, col: 2 },
      KeyC: { row: 3, col: 3 }
    },
    labels: { topLeft: 'S', topRight: 'D', bottomLeft: 'X', bottomRight: 'C' }
  },
  KeyD: {
    cellCodes: ['KeyD', 'KeyF', 'KeyC', 'KeyV'],
    cells: {
      KeyD: { row: 2, col: 4 },
      KeyF: { row: 2, col: 5 },
      KeyC: { row: 3, col: 4 },
      KeyV: { row: 3, col: 5 }
    },
    labels: { topLeft: 'D', topRight: 'F', bottomLeft: 'C', bottomRight: 'V' }
  },
  KeyF: {
    cellCodes: ['KeyF', 'KeyG', 'KeyV', 'KeyB'],
    cells: {
      KeyF: { row: 2, col: 6 },
      KeyG: { row: 2, col: 7 },
      KeyV: { row: 3, col: 6 },
      KeyB: { row: 3, col: 7 }
    },
    labels: { topLeft: 'F', topRight: 'G', bottomLeft: 'V', bottomRight: 'B' }
  }
}

// Reverse mapping: {row, col} → { blockLabel, cellLabel }
const CELL_HINTS = {}
for (const [blockCode, mapping] of Object.entries(BLOCK_MAPPINGS)) {
  const blockLabel = blockCode.replace('Key', '')
  for (const [cellCode, pos] of Object.entries(mapping.cells)) {
    const cellLabel = cellCode.replace('Key', '')
    const key = `${pos.row}-${pos.col}`
    CELL_HINTS[key] = blockLabel + cellLabel
  }
}

// === Global state (singleton) ===
const state = ref(STATES.IDLE)
const selectedBlock = ref(null) // blockCode
const highlightedCells = ref([]) // Array of { row, col }
const timeoutId = ref(null)

let initialized = false
let listenerCount = 0

// Callbacks set by the app
let onTabSwitch = null
let onCellSelect = null
let getTabCount = null

/**
 * Get all 4 cells that belong to a block
 */
function getBlockCells(blockCode) {
  const mapping = BLOCK_MAPPINGS[blockCode]
  if (!mapping) return []
  return Object.values(mapping.cells)
}

/**
 * Get the key hint for a cell (two-letter combination, always English)
 */
export function getKeyHint(row, col) {
  const key = `${row}-${col}`
  return CELL_HINTS[key] || ''
}

/**
 * Reset state to idle
 */
function resetState() {
  state.value = STATES.IDLE
  selectedBlock.value = null
  highlightedCells.value = []
  clearTimeout(timeoutId.value)
  timeoutId.value = null
}

/**
 * Start block selection timeout
 */
function startTimeout() {
  clearTimeout(timeoutId.value)
  timeoutId.value = setTimeout(() => {
    resetState()
  }, config.blockSelectionTimeout)
}

/**
 * Check if keyboard navigation should be disabled (input focused)
 */
function isInputFocused() {
  const activeElement = document.activeElement
  if (!activeElement) return false

  const tagName = activeElement.tagName.toLowerCase()
  if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') {
    return true
  }

  // Check for contenteditable
  if (activeElement.isContentEditable) {
    return true
  }

  return false
}

/**
 * Handle keydown event
 */
function handleKeyDown(event) {
  // Don't handle if input is focused
  if (isInputFocused()) return

  // Don't handle if modifier keys are pressed (except for our navigation)
  if (event.ctrlKey || event.altKey || event.metaKey) return

  const code = event.code

  // Handle Escape - always reset
  if (code === 'Escape') {
    if (state.value !== STATES.IDLE) {
      event.preventDefault()
      resetState()
    }
    return
  }

  // Handle tab switching (1-8)
  if (TAB_CODES.includes(code) && state.value === STATES.IDLE) {
    const tabIndex = TAB_CODES.indexOf(code) // 0-based index
    const tabCount = getTabCount ? getTabCount() : 0

    if (tabIndex < tabCount) {
      event.preventDefault()
      if (onTabSwitch) {
        onTabSwitch(tabIndex)
      }
    }
    return
  }

  // State machine logic
  switch (state.value) {
    case STATES.IDLE:
      // First keypress - select block
      if (BLOCK_CODES.includes(code)) {
        event.preventDefault()
        state.value = STATES.BLOCK_SELECTED
        selectedBlock.value = code
        highlightedCells.value = getBlockCells(code)
        startTimeout()
      }
      break

    case STATES.BLOCK_SELECTED: {
      // Second keypress - must be valid cell key for selected block
      const mapping = BLOCK_MAPPINGS[selectedBlock.value]
      if (mapping && mapping.cellCodes.includes(code)) {
        event.preventDefault()
        const position = mapping.cells[code]
        if (position && onCellSelect) {
          onCellSelect(position.row, position.col)
        }
        resetState()
      } else {
        // Invalid key - reset
        resetState()
      }
      break
    }
  }
}

/**
 * Setup keyboard listeners
 */
function setupListeners() {
  if (initialized) return

  window.addEventListener('keydown', handleKeyDown)
  initialized = true
}

/**
 * Cleanup keyboard listeners
 */
function cleanupListeners() {
  if (!initialized) return

  window.removeEventListener('keydown', handleKeyDown)
  resetState()
  initialized = false
}

/**
 * Composable for keyboard navigation
 */
export function useKeyboardNavigation(options = {}) {
  // Set callbacks from options
  if (options.onTabSwitch) onTabSwitch = options.onTabSwitch
  if (options.onCellSelect) onCellSelect = options.onCellSelect
  if (options.getTabCount) getTabCount = options.getTabCount

  // Update config if provided
  if (options.blockSelectionTimeout !== undefined) {
    config.blockSelectionTimeout = options.blockSelectionTimeout
  }
  if (options.showKeyHints !== undefined) {
    config.showKeyHints = options.showKeyHints
  }
  if (options.keyHintOpacity !== undefined) {
    config.keyHintOpacity = options.keyHintOpacity
  }

  onMounted(() => {
    listenerCount++
    setupListeners()
  })

  onUnmounted(() => {
    listenerCount--
    if (listenerCount <= 0) {
      cleanupListeners()
      listenerCount = 0
    }
  })

  // Computed for checking if a cell is highlighted
  const isCellHighlighted = (row, col) => {
    return highlightedCells.value.some(cell => cell.row === row && cell.col === col)
  }

  // Computed for checking if we're in block selection mode
  const isBlockSelectionActive = computed(() => state.value !== STATES.IDLE)

  return {
    // State
    state: readonly(state),
    selectedBlock: readonly(selectedBlock),
    highlightedCells: readonly(highlightedCells),
    isBlockSelectionActive,

    // Config
    config: readonly(ref(config)),

    // Methods
    getKeyHint,
    isCellHighlighted,
    resetState,

    // Constants
    STATES
  }
}
