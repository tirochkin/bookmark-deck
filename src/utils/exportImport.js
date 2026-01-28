import { validateData, getDataVersion } from './validators.js'

/**
 * Export data to JSON file
 * @param {object} data - The data to export
 * @param {string} filename - Optional filename (default: bookmark-deck-export.json)
 */
export function exportToJson(data, filename = 'bookmark-deck-export.json') {
  const exportData = {
    version: getDataVersion(),
    exportedAt: new Date().toISOString(),
    tabs: data.tabs,
    buffer: data.buffer,
    trash: data.trash
  }

  const json = JSON.stringify(exportData, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Read and parse JSON file
 * @param {File} file - The file to read
 * @returns {Promise<{ success: boolean, data?: object, error?: string }>}
 */
export function readJsonFile(file) {
  return new Promise((resolve) => {
    if (!file) {
      resolve({ success: false, error: 'Файл не выбран' })
      return
    }

    if (!file.name.endsWith('.json')) {
      resolve({ success: false, error: 'Файл должен быть в формате JSON' })
      return
    }

    const reader = new FileReader()

    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result)
        resolve({ success: true, data })
      } catch (err) {
        resolve({ success: false, error: 'Ошибка разбора JSON: ' + err.message })
      }
    }

    reader.onerror = () => {
      resolve({ success: false, error: 'Не удалось прочитать файл' })
    }

    reader.readAsText(file)
  })
}

/**
 * Validate imported data
 * @param {object} data - The data to validate
 * @returns {{ valid: boolean, error?: string, stats?: object }}
 */
export function validateImportData(data) {
  const validation = validateData(data)

  if (!validation.valid) {
    return validation
  }

  // Calculate stats for preview
  const stats = {
    tabCount: data.tabs.length,
    blockCount: data.tabs.reduce((sum, tab) => sum + tab.blocks.length, 0),
    bufferCount: data.buffer.length,
    trashBlockCount: data.trash.blocks.length,
    trashTabCount: data.trash.tabs.length,
    exportedAt: data.exportedAt || null
  }

  return { valid: true, stats }
}

/**
 * Prepare data for import (regenerate IDs to avoid conflicts)
 * @param {object} data - The validated data
 * @returns {object} - Data with regenerated IDs
 */
export function prepareDataForImport(data) {
  const idMap = new Map()

  function generateNewId(oldId) {
    if (!idMap.has(oldId)) {
      idMap.set(oldId, crypto.randomUUID())
    }
    return idMap.get(oldId)
  }

  function processBlock(block) {
    return {
      ...block,
      id: generateNewId(block.id)
    }
  }

  function processTab(tab) {
    return {
      ...tab,
      id: generateNewId(tab.id),
      blocks: tab.blocks.map(processBlock)
    }
  }

  return {
    version: data.version,
    tabs: data.tabs.map(processTab),
    buffer: data.buffer.map(processBlock),
    trash: {
      blocks: data.trash.blocks.map(processBlock),
      tabs: data.trash.tabs.map(processTab)
    }
  }
}
