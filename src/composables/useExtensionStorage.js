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
 * Check if we're running in Chrome extension context
 */
function isChromeExtension() {
  return typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local
}

/**
 * Composable for Chrome extension storage operations with debounce
 * Uses chrome.storage.local instead of localStorage
 */
export function useExtensionStorage() {
  let saveTimeout = null

  /**
   * Load data from chrome.storage.local
   * @returns {Promise<object>} Valid data or initial data on error
   */
  async function load() {
    if (!isChromeExtension()) {
      console.warn('[ExtensionStorage] Not in extension context, using initial data')
      return createInitialData()
    }

    try {
      const result = await chrome.storage.local.get(STORAGE_KEY)
      const data = result[STORAGE_KEY]

      if (!data) {
        console.log('[ExtensionStorage] No saved data, using initial state')
        return createInitialData()
      }

      const validation = validateData(data)

      if (!validation.valid) {
        console.warn('[ExtensionStorage] Invalid data:', validation.error)
        console.warn('[ExtensionStorage] Falling back to initial state')
        return createInitialData()
      }

      console.log('[ExtensionStorage] Data loaded successfully')
      return data
    } catch (error) {
      console.error('[ExtensionStorage] Failed to load data:', error)
      return createInitialData()
    }
  }

  /**
   * Save data to chrome.storage.local immediately
   * @param {object} data
   * @returns {Promise<boolean>} Success status
   */
  async function saveImmediate(data) {
    if (!isChromeExtension()) {
      console.warn('[ExtensionStorage] Not in extension context, cannot save')
      return false
    }

    try {
      const validation = validateData(data)

      if (!validation.valid) {
        console.error('[ExtensionStorage] Cannot save invalid data:', validation.error)
        return false
      }

      await chrome.storage.local.set({ [STORAGE_KEY]: data })
      console.log('[ExtensionStorage] Data saved')
      return true
    } catch (error) {
      console.error('[ExtensionStorage] Failed to save data:', error)
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
  async function clear() {
    if (!isChromeExtension()) {
      return false
    }

    try {
      await chrome.storage.local.remove(STORAGE_KEY)
      console.log('[ExtensionStorage] Data cleared')
      return true
    } catch (error) {
      console.error('[ExtensionStorage] Failed to clear data:', error)
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
  async function flush(data) {
    cancelPendingSave()
    return await saveImmediate(data)
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
