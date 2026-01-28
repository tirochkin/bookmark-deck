import { validateData, getDataVersion } from '@/utils/validators.js'

const STORAGE_KEY = 'bookmarkDeck'
const DEBOUNCE_DELAY = 400

/**
 * Create initial/default data structure
 * @returns {object}
 */
export function createInitialData() {
  return {
    version: getDataVersion(),
    tabs: [
      {
        id: crypto.randomUUID(),
        name: 'Основное',
        order: 0,
        blocks: []
      }
    ],
    buffer: [],
    trash: {
      blocks: [],
      tabs: []
    }
  }
}

/**
 * Composable for localStorage operations with debounce
 */
export function useStorage() {
  let saveTimeout = null

  /**
   * Load data from localStorage
   * @returns {object} Valid data or initial data on error
   */
  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)

      if (!raw) {
        console.log('[Storage] No saved data, using initial state')
        return createInitialData()
      }

      const data = JSON.parse(raw)
      const validation = validateData(data)

      if (!validation.valid) {
        console.warn('[Storage] Invalid data:', validation.error)
        console.warn('[Storage] Falling back to initial state')
        return createInitialData()
      }

      console.log('[Storage] Data loaded successfully')
      return data
    } catch (error) {
      console.error('[Storage] Failed to load data:', error)
      return createInitialData()
    }
  }

  /**
   * Save data to localStorage immediately
   * @param {object} data
   * @returns {boolean} Success status
   */
  function saveImmediate(data) {
    try {
      const validation = validateData(data)

      if (!validation.valid) {
        console.error('[Storage] Cannot save invalid data:', validation.error)
        return false
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
      console.log('[Storage] Data saved')
      return true
    } catch (error) {
      console.error('[Storage] Failed to save data:', error)
      return false
    }
  }

  /**
   * Save data with debounce
   * @param {object} data
   */
  function save(data) {
    if (saveTimeout) {
      clearTimeout(saveTimeout)
    }

    saveTimeout = setTimeout(() => {
      saveImmediate(data)
      saveTimeout = null
    }, DEBOUNCE_DELAY)
  }

  /**
   * Clear all saved data
   */
  function clear() {
    try {
      localStorage.removeItem(STORAGE_KEY)
      console.log('[Storage] Data cleared')
      return true
    } catch (error) {
      console.error('[Storage] Failed to clear data:', error)
      return false
    }
  }

  /**
   * Cancel pending save operation
   */
  function cancelPendingSave() {
    if (saveTimeout) {
      clearTimeout(saveTimeout)
      saveTimeout = null
    }
  }

  /**
   * Flush pending save immediately
   * @param {object} data
   */
  function flush(data) {
    cancelPendingSave()
    return saveImmediate(data)
  }

  return {
    load,
    save,
    saveImmediate,
    flush,
    clear,
    cancelPendingSave
  }
}
