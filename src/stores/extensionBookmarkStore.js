import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useExtensionStorage, createInitialData } from '@/composables/useExtensionStorage.js'
import { getDefaultColorId } from '@/utils/colors.js'
import { getDataVersion } from '@/utils/validators.js'

export const useExtensionBookmarkStore = defineStore('extensionBookmarks', () => {
  const storage = useExtensionStorage()

  // State
  const tabs = ref([])
  const buffer = ref([])
  const trash = ref({ blocks: [], tabs: [] })
  const activeTabId = ref(null)
  const isInitialized = ref(false)

  // Getters
  const activeTab = computed(() => {
    return tabs.value.find(t => t.id === activeTabId.value) || tabs.value[0] || null
  })

  const activeBlocks = computed(() => {
    return activeTab.value?.blocks || []
  })

  const sortedTabs = computed(() => {
    return [...tabs.value].sort((a, b) => a.order - b.order)
  })

  const tabCount = computed(() => tabs.value.length)

  const canAddTab = computed(() => tabs.value.length < 8)

  const canDeleteTab = computed(() => tabs.value.length > 1)

  const bufferCount = computed(() => buffer.value.length)

  const trashBlockCount = computed(() => trash.value.blocks.length)

  const trashTabCount = computed(() => trash.value.tabs.length)

  // Private helpers
  function getDataSnapshot() {
    return {
      version: getDataVersion(),
      tabs: tabs.value,
      buffer: buffer.value,
      trash: trash.value
    }
  }

  function persistData() {
    storage.save(getDataSnapshot())
  }

  // Force save immediately (for beforeunload/visibilitychange)
  async function flushPendingSaves() {
    if (!isInitialized.value) return
    await storage.flush(getDataSnapshot())
  }

  function generateId() {
    return crypto.randomUUID()
  }

  // Actions - async init for extension
  async function init() {
    if (isInitialized.value) return

    const data = await storage.load()
    tabs.value = data.tabs
    buffer.value = data.buffer
    trash.value = data.trash

    // Try to restore last active tab, fallback to first tab
    const lastTabId = await storage.loadLastActiveTab()
    const tabExists = lastTabId && tabs.value.some(t => t.id === lastTabId)
    activeTabId.value = tabExists ? lastTabId : (data.tabs[0]?.id || null)

    isInitialized.value = true
  }

  // Save current tab as last active (called on URL open/copy)
  async function rememberActiveTab() {
    if (activeTabId.value) {
      await storage.saveLastActiveTab(activeTabId.value)
    }
  }

  async function reset() {
    const data = createInitialData()
    tabs.value = data.tabs
    buffer.value = data.buffer
    trash.value = data.trash
    activeTabId.value = data.tabs[0]?.id || null
    await storage.flush({
      version: getDataVersion(),
      tabs: tabs.value,
      buffer: buffer.value,
      trash: trash.value
    })
  }

  async function importData(data) {
    tabs.value = data.tabs
    buffer.value = data.buffer
    trash.value = data.trash
    activeTabId.value = data.tabs[0]?.id || null
    await storage.flush({
      version: getDataVersion(),
      tabs: tabs.value,
      buffer: buffer.value,
      trash: trash.value
    })
  }

  // Tab actions
  function setActiveTab(tabId) {
    if (tabs.value.some(t => t.id === tabId)) {
      activeTabId.value = tabId
    }
  }

  function addTab(name = 'Новая') {
    if (!canAddTab.value) return null

    const maxOrder = Math.max(...tabs.value.map(t => t.order), -1)
    const newTab = {
      id: generateId(),
      name,
      order: maxOrder + 1,
      blocks: []
    }

    tabs.value.push(newTab)
    activeTabId.value = newTab.id
    persistData()
    return newTab
  }

  function updateTab(tabId, updates) {
    const tab = tabs.value.find(t => t.id === tabId)
    if (!tab) return false

    if (updates.name !== undefined) {
      tab.name = updates.name
    }

    persistData()
    return true
  }

  function deleteTab(tabId) {
    if (!canDeleteTab.value) return false

    const index = tabs.value.findIndex(t => t.id === tabId)
    if (index === -1) return false

    const [deletedTab] = tabs.value.splice(index, 1)

    // Move all blocks from deleted tab to trash
    if (deletedTab.blocks.length > 0) {
      trash.value.blocks.push(...deletedTab.blocks)
    }

    // Switch to another tab if active was deleted
    if (activeTabId.value === tabId) {
      activeTabId.value = tabs.value[0]?.id || null
    }

    // Reorder remaining tabs
    tabs.value.forEach((tab, i) => {
      tab.order = i
    })

    persistData()
    return true
  }

  function reorderTabs(fromIndex, toIndex) {
    const sorted = sortedTabs.value
    const [moved] = sorted.splice(fromIndex, 1)
    sorted.splice(toIndex, 0, moved)

    sorted.forEach((tab, i) => {
      tab.order = i
    })

    persistData()
  }

  // Block actions
  function addBlock(tabId, position, blockData) {
    const tab = tabs.value.find(t => t.id === tabId)
    if (!tab) return null

    const existing = tab.blocks.find(
      b => b.position.row === position.row && b.position.col === position.col
    )
    if (existing) return null

    const newBlock = {
      id: generateId(),
      position: { ...position },
      url: blockData.url,
      title: blockData.title,
      color: blockData.color || getDefaultColorId(),
      icon: null,
      textAlign: blockData.textAlign || 'center'
    }

    tab.blocks.push(newBlock)
    persistData()
    return newBlock
  }

  function updateBlock(tabId, blockId, updates) {
    const tab = tabs.value.find(t => t.id === tabId)
    if (!tab) return false

    const block = tab.blocks.find(b => b.id === blockId)
    if (!block) return false

    if (updates.url !== undefined) block.url = updates.url
    if (updates.title !== undefined) block.title = updates.title
    if (updates.color !== undefined) block.color = updates.color
    if (updates.textAlign !== undefined) block.textAlign = updates.textAlign
    if (updates.position !== undefined) block.position = { ...updates.position }

    persistData()
    return true
  }

  function deleteBlock(tabId, blockId) {
    const tab = tabs.value.find(t => t.id === tabId)
    if (!tab) return false

    const index = tab.blocks.findIndex(b => b.id === blockId)
    if (index === -1) return false

    const [deleted] = tab.blocks.splice(index, 1)
    trash.value.blocks.push(deleted)
    persistData()
    return true
  }

  function moveBlock(fromTabId, blockId, toTabId, toPosition) {
    const fromTab = tabs.value.find(t => t.id === fromTabId)
    const toTab = tabs.value.find(t => t.id === toTabId)
    if (!fromTab || !toTab) return false

    const blockIndex = fromTab.blocks.findIndex(b => b.id === blockId)
    if (blockIndex === -1) return false

    const occupied = toTab.blocks.find(
      b => b.position.row === toPosition.row && b.position.col === toPosition.col
    )
    if (occupied) return false

    const [block] = fromTab.blocks.splice(blockIndex, 1)
    block.position = { ...toPosition }
    toTab.blocks.push(block)

    persistData()
    return true
  }

  function swapBlocks(tabId, blockId1, blockId2) {
    const tab = tabs.value.find(t => t.id === tabId)
    if (!tab) return false

    const block1 = tab.blocks.find(b => b.id === blockId1)
    const block2 = tab.blocks.find(b => b.id === blockId2)
    if (!block1 || !block2) return false

    const tempPosition = { ...block1.position }
    block1.position = { ...block2.position }
    block2.position = tempPosition

    persistData()
    return true
  }

  // Buffer actions
  function moveToBuffer(tabId, blockId) {
    const tab = tabs.value.find(t => t.id === tabId)
    if (!tab) return false

    const index = tab.blocks.findIndex(b => b.id === blockId)
    if (index === -1) return false

    const [block] = tab.blocks.splice(index, 1)
    buffer.value.push(block)
    persistData()
    return true
  }

  function moveFromBuffer(bufferId, tabId, position) {
    const index = buffer.value.findIndex(b => b.id === bufferId)
    if (index === -1) return false

    const tab = tabs.value.find(t => t.id === tabId)
    if (!tab) return false

    const occupied = tab.blocks.find(
      b => b.position.row === position.row && b.position.col === position.col
    )
    if (occupied) return false

    const [block] = buffer.value.splice(index, 1)
    block.position = { ...position }
    tab.blocks.push(block)

    persistData()
    return true
  }

  function clearBuffer() {
    trash.value.blocks.push(...buffer.value)
    buffer.value = []
    persistData()
  }

  function deleteFromBuffer(blockId) {
    const index = buffer.value.findIndex(b => b.id === blockId)
    if (index === -1) return false

    const [deleted] = buffer.value.splice(index, 1)
    trash.value.blocks.push(deleted)
    persistData()
    return true
  }

  function updateBufferBlock(blockId, data) {
    const block = buffer.value.find(b => b.id === blockId)
    if (!block) return false

    if (data.url !== undefined) block.url = data.url
    if (data.title !== undefined) block.title = data.title
    if (data.color !== undefined) block.color = data.color
    if (data.textAlign !== undefined) block.textAlign = data.textAlign

    persistData()
    return true
  }

  // Trash actions
  function restoreBlockFromTrash(trashIndex) {
    if (trashIndex < 0 || trashIndex >= trash.value.blocks.length) return null

    const [block] = trash.value.blocks.splice(trashIndex, 1)
    buffer.value.push(block)
    persistData()
    return block
  }

  function restoreBlockToGrid(trashIndex, tabId, position) {
    if (trashIndex < 0 || trashIndex >= trash.value.blocks.length) return false

    const tab = tabs.value.find(t => t.id === tabId)
    if (!tab) return false

    const occupied = tab.blocks.find(
      b => b.position.row === position.row && b.position.col === position.col
    )
    if (occupied) return false

    const [block] = trash.value.blocks.splice(trashIndex, 1)
    block.position = { ...position }
    tab.blocks.push(block)

    persistData()
    return true
  }

  function restoreBlockToBuffer(trashIndex) {
    if (trashIndex < 0 || trashIndex >= trash.value.blocks.length) return false

    const [block] = trash.value.blocks.splice(trashIndex, 1)
    buffer.value.push(block)
    persistData()
    return true
  }

  function restoreTabFromTrash(trashIndex) {
    if (trashIndex < 0 || trashIndex >= trash.value.tabs.length) return null
    if (!canAddTab.value) return null

    const [tab] = trash.value.tabs.splice(trashIndex, 1)
    const maxOrder = Math.max(...tabs.value.map(t => t.order), -1)
    tab.order = maxOrder + 1
    tabs.value.push(tab)

    persistData()
    return tab
  }

  function emptyTrash() {
    trash.value = { blocks: [], tabs: [] }
    persistData()
  }

  return {
    // State
    tabs,
    buffer,
    trash,
    activeTabId,
    isInitialized,

    // Getters
    activeTab,
    activeBlocks,
    sortedTabs,
    tabCount,
    canAddTab,
    canDeleteTab,
    bufferCount,
    trashBlockCount,
    trashTabCount,

    // Actions
    init,
    flushPendingSaves,
    rememberActiveTab,
    reset,
    importData,
    setActiveTab,
    addTab,
    updateTab,
    deleteTab,
    reorderTabs,
    addBlock,
    updateBlock,
    deleteBlock,
    moveBlock,
    swapBlocks,
    moveToBuffer,
    moveFromBuffer,
    clearBuffer,
    deleteFromBuffer,
    updateBufferBlock,
    restoreBlockFromTrash,
    restoreBlockToGrid,
    restoreBlockToBuffer,
    restoreTabFromTrash,
    emptyTrash
  }
})
