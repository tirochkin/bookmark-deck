import { ref, readonly, computed } from 'vue'

// Singleton state for clipboard
const clipboardBlock = ref(null)
const clipboardSourceTabId = ref(null)
const clipboardFromBuffer = ref(false) // true if block was copied/cut from buffer
const isCut = ref(false) // true if block was cut (will be removed on paste)

export function useClipboard() {
  const hasClipboard = computed(() => clipboardBlock.value !== null)

  // Copy a block to clipboard
  function copy(block, tabId, fromBuffer = false) {
    // Deep clone the block to avoid reference issues
    clipboardBlock.value = JSON.parse(JSON.stringify(block))
    clipboardSourceTabId.value = tabId
    clipboardFromBuffer.value = fromBuffer
    isCut.value = false
  }

  // Cut a block to clipboard (mark for removal on paste)
  function cut(block, tabId, fromBuffer = false) {
    clipboardBlock.value = JSON.parse(JSON.stringify(block))
    clipboardSourceTabId.value = tabId
    clipboardFromBuffer.value = fromBuffer
    isCut.value = true
  }

  // Get clipboard content for pasting
  function getClipboard() {
    if (!clipboardBlock.value) return null

    return {
      block: clipboardBlock.value,
      sourceTabId: clipboardSourceTabId.value,
      fromBuffer: clipboardFromBuffer.value,
      isCut: isCut.value
    }
  }

  // Clear clipboard after paste (only for cut operations)
  function clearAfterPaste() {
    if (isCut.value) {
      clipboardBlock.value = null
      clipboardSourceTabId.value = null
      clipboardFromBuffer.value = false
      isCut.value = false
    }
  }

  // Force clear clipboard
  function clear() {
    clipboardBlock.value = null
    clipboardSourceTabId.value = null
    clipboardFromBuffer.value = false
    isCut.value = false
  }

  return {
    // State
    clipboardBlock: readonly(clipboardBlock),
    clipboardSourceTabId: readonly(clipboardSourceTabId),
    clipboardFromBuffer: readonly(clipboardFromBuffer),
    isCut: readonly(isCut),
    hasClipboard,

    // Actions
    copy,
    cut,
    getClipboard,
    clearAfterPaste,
    clear
  }
}
