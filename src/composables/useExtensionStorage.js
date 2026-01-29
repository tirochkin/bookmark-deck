import { validateData, getDataVersion } from '@/utils/validators.js'

const STORAGE_KEY = 'bookmarkDeck'
const LAST_TAB_KEY = 'bookmarkDeck_lastActiveTab'
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
 * Convert object with numeric keys back to array
 * Fixes data corrupted by chrome.storage serialization of Vue Proxy
 */
function objectToArray(obj) {
  if (Array.isArray(obj)) return obj
  if (!obj || typeof obj !== 'object') return []

  const keys = Object.keys(obj)
  if (keys.length === 0) return []

  // Check if all keys are numeric
  const isNumericKeys = keys.every(k => /^\d+$/.test(k))
  if (!isNumericKeys) return obj

  // Convert to array
  return keys.sort((a, b) => Number(a) - Number(b)).map(k => obj[k])
}

/**
 * Repair data structure corrupted by chrome.storage serialization
 */
function repairData(data) {
  if (!data || typeof data !== 'object') return data

  // Repair tabs array
  if (data.tabs && !Array.isArray(data.tabs)) {
    data.tabs = objectToArray(data.tabs)
  }

  // Repair blocks in each tab
  if (Array.isArray(data.tabs)) {
    data.tabs.forEach(tab => {
      if (tab.blocks && !Array.isArray(tab.blocks)) {
        tab.blocks = objectToArray(tab.blocks)
      }
    })
  }

  // Repair buffer
  if (data.buffer && !Array.isArray(data.buffer)) {
    data.buffer = objectToArray(data.buffer)
  }

  // Repair trash
  if (data.trash) {
    if (data.trash.blocks && !Array.isArray(data.trash.blocks)) {
      data.trash.blocks = objectToArray(data.trash.blocks)
    }
    if (data.trash.tabs && !Array.isArray(data.trash.tabs)) {
      data.trash.tabs = objectToArray(data.trash.tabs)
    }
  }

  return data
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
        return createInitialData()
      }

      // Repair data structure if corrupted by chrome.storage serialization
      const repairedData = repairData(data)
      const validation = validateData(repairedData)

      if (!validation.valid) {
        console.warn('[ExtensionStorage] Invalid data:', validation.error)
        return createInitialData()
      }

      return repairedData
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
      // Deep clone to remove Vue Proxy and ensure proper array serialization
      const plainData = JSON.parse(JSON.stringify(data))

      const validation = validateData(plainData)

      if (!validation.valid) {
        console.error('[ExtensionStorage] Cannot save invalid data:', validation.error)
        return false
      }

      await chrome.storage.local.set({ [STORAGE_KEY]: plainData })
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

  /**
   * Save last active tab ID (for remembering tab between sessions)
   * @param {string} tabId
   */
  async function saveLastActiveTab(tabId) {
    if (!isChromeExtension()) return false
    try {
      await chrome.storage.local.set({ [LAST_TAB_KEY]: tabId })
      return true
    } catch (error) {
      console.error('[ExtensionStorage] Failed to save last active tab:', error)
      return false
    }
  }

  /**
   * Load last active tab ID
   * @returns {Promise<string|null>}
   */
  async function loadLastActiveTab() {
    if (!isChromeExtension()) return null
    try {
      const result = await chrome.storage.local.get(LAST_TAB_KEY)
      return result[LAST_TAB_KEY] || null
    } catch (error) {
      console.error('[ExtensionStorage] Failed to load last active tab:', error)
      return null
    }
  }

  return {
    load,
    save,
    saveImmediate,
    flush,
    clear,
    cancelPendingSave,
    saveLastActiveTab,
    loadLastActiveTab
  }
}
