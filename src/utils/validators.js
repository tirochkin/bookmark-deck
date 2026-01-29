import { isValidColorId } from './colors.js'

const DATA_VERSION = '1.0'

/**
 * Validate URL format
 * @param {string} url
 * @returns {boolean}
 */
export function isValidUrl(url) {
  if (!url || typeof url !== 'string') return false
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * Validate title
 * @param {string} title
 * @returns {boolean}
 */
export function isValidTitle(title) {
  return typeof title === 'string' && title.length > 0 && title.length <= 50
}

/**
 * Validate text alignment
 * @param {string} align
 * @returns {boolean}
 */
export function isValidTextAlign(align) {
  return ['top', 'center', 'bottom'].includes(align)
}

/**
 * Validate grid position
 * @param {object} position
 * @returns {boolean}
 */
export function isValidPosition(position) {
  if (!position || typeof position !== 'object') return false
  const { row, col } = position
  return (
    typeof row === 'number' &&
    typeof col === 'number' &&
    row >= 0 && row <= 3 &&
    col >= 0 && col <= 7
  )
}

/**
 * Validate a single block
 * @param {object} block
 * @returns {boolean}
 */
export function isValidBlock(block) {
  if (!block || typeof block !== 'object') return false

  return (
    typeof block.id === 'string' &&
    block.id.length > 0 &&
    isValidPosition(block.position) &&
    isValidUrl(block.url) &&
    isValidTitle(block.title) &&
    isValidColorId(block.color) &&
    isValidTextAlign(block.textAlign)
  )
}

/**
 * Validate tab name
 * @param {string} name
 * @returns {boolean}
 */
export function isValidTabName(name) {
  return typeof name === 'string' && name.length > 0 && name.length <= 50
}

/**
 * Validate a single tab
 * @param {object} tab
 * @returns {boolean}
 */
export function isValidTab(tab) {
  if (!tab || typeof tab !== 'object') return false

  return (
    typeof tab.id === 'string' &&
    tab.id.length > 0 &&
    isValidTabName(tab.name) &&
    typeof tab.order === 'number' &&
    tab.order >= 0 &&
    Array.isArray(tab.blocks) &&
    tab.blocks.every(isValidBlock)
  )
}

/**
 * Validate the entire data structure
 * @param {object} data
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateData(data) {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Данные должны быть объектом' }
  }

  if (data.version !== DATA_VERSION) {
    return { valid: false, error: `Неверная версия: ожидалась ${DATA_VERSION}` }
  }

  if (!Array.isArray(data.tabs)) {
    return { valid: false, error: 'Вкладки должны быть массивом' }
  }

  if (data.tabs.length < 1 || data.tabs.length > 8) {
    return { valid: false, error: 'Количество вкладок должно быть от 1 до 8' }
  }

  for (let i = 0; i < data.tabs.length; i++) {
    if (!isValidTab(data.tabs[i])) {
      return { valid: false, error: `Некорректная вкладка #${i + 1}` }
    }
  }

  if (!Array.isArray(data.buffer)) {
    return { valid: false, error: 'Буфер должен быть массивом' }
  }

  for (let i = 0; i < data.buffer.length; i++) {
    if (!isValidBlock(data.buffer[i])) {
      return { valid: false, error: `Некорректный блок в буфере #${i + 1}` }
    }
  }

  if (!data.trash || typeof data.trash !== 'object') {
    return { valid: false, error: 'Корзина должна быть объектом' }
  }

  if (!Array.isArray(data.trash.blocks) || !Array.isArray(data.trash.tabs)) {
    return { valid: false, error: 'Корзина должна содержать массивы блоков и вкладок' }
  }

  return { valid: true }
}

/**
 * Get data version
 * @returns {string}
 */
export function getDataVersion() {
  return DATA_VERSION
}
