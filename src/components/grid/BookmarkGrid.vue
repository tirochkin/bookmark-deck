<script setup>
import { computed, ref, inject } from 'vue'
import BookmarkCell from './BookmarkCell.vue'
import ContextMenu from '@/components/ui/ContextMenu.vue'
import { useBookmarkStore } from '@/stores/bookmarkStore.js'
import { useDragDrop } from '@/composables/useDragDrop.js'
import { useClipboard } from '@/composables/useClipboard.js'

const COLS = 8
const ROWS = 4

const props = defineProps({
  blocks: {
    type: Array,
    default: () => []
  },
  tabId: {
    type: String,
    required: true
  },
  editMode: {
    type: Boolean,
    default: false
  },
  // Keyboard navigation props
  highlightedCells: {
    type: Array,
    default: () => []
  },
  showKeyHints: {
    type: Boolean,
    default: true
  },
  keyHintOpacity: {
    type: Number,
    default: 0.4
  }
})

// Check if a cell is highlighted by keyboard navigation
function isCellHighlighted(row, col) {
  return props.highlightedCells.some(cell => cell.row === row && cell.col === col)
}

// Check if a cell should be dimmed (some cells are highlighted, but not this one)
function isCellDimmed(row, col) {
  return props.highlightedCells.length > 0 && !isCellHighlighted(row, col)
}

const emit = defineEmits(['cell-click', 'block-click', 'move-to-buffer', 'move-to-trash', 'url-copied'])

// Use injected store (from extension) or fallback to regular store
const store = inject('bookmarkStore', useBookmarkStore())
const { draggedFromBuffer, draggedFromTabId, draggedFromTrash, draggedTrashIndex } = useDragDrop()
const { copy, cut, getClipboard, clearAfterPaste } = useClipboard()

// Context menu state
const showContextMenu = ref(false)
const contextMenuPosition = ref({ x: 0, y: 0 })
const pendingConflict = ref(null)

const contextMenuOptions = [
  { id: 'swap', label: 'Поменять местами', icon: 'swap' },
  { id: 'buffer', label: 'В буфер', icon: 'buffer' },
  { id: 'delete', label: 'Удалить целевой', icon: 'delete', danger: true },
  { id: 'cancel', label: 'Отмена', icon: 'cancel' }
]

// Create a map for quick block lookup by position
const blockMap = computed(() => {
  const map = new Map()
  for (const block of props.blocks) {
    const key = `${block.position.row}-${block.position.col}`
    map.set(key, block)
  }
  return map
})

// Generate all cells as a flat array for the grid
const cells = computed(() => {
  const result = []
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const key = `${row}-${col}`
      result.push({
        row,
        col,
        key,
        block: blockMap.value.get(key) || null
      })
    }
  }
  return result
})

function handleCellClick(position) {
  emit('cell-click', position)
}

function handleBlockClick(block) {
  emit('block-click', block)
}

// Handle drop on empty cell - simple move or move from buffer/trash
function handleDrop({ draggedBlock, targetPosition }) {
  if (draggedFromTrash.value) {
    // Restoring from trash to grid
    store.restoreBlockToGrid(draggedTrashIndex.value, props.tabId, targetPosition)
  } else if (draggedFromBuffer.value) {
    // Moving from buffer to grid
    store.moveFromBuffer(draggedBlock.id, props.tabId, targetPosition)
  } else {
    // Moving within grid
    const sourceTabId = draggedFromTabId.value || props.tabId
    store.moveBlock(sourceTabId, draggedBlock.id, props.tabId, targetPosition)
  }
}

// Handle drop conflict - show context menu
function handleDropConflict({ draggedBlock, targetBlock, targetPosition, menuPosition }) {
  pendingConflict.value = {
    draggedBlock,
    targetBlock,
    targetPosition,
    fromBuffer: draggedFromBuffer.value,
    fromTrash: draggedFromTrash.value,
    trashIndex: draggedTrashIndex.value,
    fromTabId: draggedFromTabId.value
  }
  contextMenuPosition.value = menuPosition
  showContextMenu.value = true
}

// Handle context menu selection
function handleContextMenuSelect(action) {
  if (!pendingConflict.value) {
    closeContextMenu()
    return
  }

  const { draggedBlock, targetBlock, targetPosition, fromBuffer, fromTrash, trashIndex, fromTabId, isPaste, wasCut } = pendingConflict.value

  // Helper to place dragged block at target position
  function placeDraggedBlock() {
    if (isPaste) {
      // Paste operation
      if (wasCut) {
        // Cut - move the original block
        if (fromBuffer) {
          store.moveFromBuffer(draggedBlock.id, props.tabId, targetPosition)
        } else {
          store.moveBlock(fromTabId, draggedBlock.id, props.tabId, targetPosition)
        }
        clearAfterPaste()
      } else {
        // Copy - create a new block
        store.addBlock(props.tabId, targetPosition, {
          url: draggedBlock.url,
          title: draggedBlock.title,
          color: draggedBlock.color,
          textAlign: draggedBlock.textAlign
        })
      }
    } else if (fromTrash) {
      store.restoreBlockToGrid(trashIndex, props.tabId, targetPosition)
    } else if (fromBuffer) {
      store.moveFromBuffer(draggedBlock.id, props.tabId, targetPosition)
    } else {
      const sourceTabId = fromTabId || props.tabId
      store.moveBlock(sourceTabId, draggedBlock.id, props.tabId, targetPosition)
    }
  }

  switch (action) {
    case 'swap':
      if (fromBuffer || fromTrash || isPaste) {
        // Can't swap with buffer/trash/paste - move target to buffer, then place dragged
        store.moveToBuffer(props.tabId, targetBlock.id)
        placeDraggedBlock()
      } else {
        // Swap the two blocks
        store.swapBlocks(props.tabId, draggedBlock.id, targetBlock.id)
      }
      break

    case 'buffer':
      // Move target block to buffer, then move dragged block to target position
      store.moveToBuffer(props.tabId, targetBlock.id)
      placeDraggedBlock()
      break

    case 'delete':
      // Delete target block, then move dragged block to target position
      store.deleteBlock(props.tabId, targetBlock.id)
      placeDraggedBlock()
      break

    case 'cancel':
    default:
      // Do nothing
      break
  }

  closeContextMenu()
}

function closeContextMenu() {
  showContextMenu.value = false
  pendingConflict.value = null
}

// Clipboard operations
function handleCopy({ block }) {
  copy(block, props.tabId)
}

function handleCut({ block }) {
  cut(block, props.tabId)
}

function handlePaste({ position, menuPosition }) {
  const clipboard = getClipboard()
  if (!clipboard) return

  const { block: clipboardBlock, sourceTabId, fromBuffer, isCut: wasCut } = clipboard

  // Check if target position is occupied
  const targetKey = `${position.row}-${position.col}`
  const existingBlock = blockMap.value.get(targetKey)

  if (existingBlock) {
    // Position is occupied - show conflict menu
    pendingConflict.value = {
      draggedBlock: clipboardBlock,
      targetBlock: existingBlock,
      targetPosition: position,
      fromBuffer: fromBuffer,
      fromTrash: false,
      trashIndex: null,
      fromTabId: sourceTabId,
      isPaste: true,
      wasCut: wasCut
    }
    contextMenuPosition.value = menuPosition
    showContextMenu.value = true
    return
  }

  if (wasCut) {
    // Move the original block
    if (fromBuffer) {
      // Cut from buffer - use moveFromBuffer
      store.moveFromBuffer(clipboardBlock.id, props.tabId, position)
    } else {
      // Cut from grid - use moveBlock
      store.moveBlock(sourceTabId, clipboardBlock.id, props.tabId, position)
    }
    clearAfterPaste()
  } else {
    // Create a copy of the block
    store.addBlock(props.tabId, position, {
      url: clipboardBlock.url,
      title: clipboardBlock.title,
      color: clipboardBlock.color,
      textAlign: clipboardBlock.textAlign
    })
  }
}

// Alt+Click - move to buffer
function handleMoveToBuffer({ block }) {
  emit('move-to-buffer', { block, tabId: props.tabId })
}

// Alt+Shift+Click - move to trash
function handleMoveToTrash({ block }) {
  emit('move-to-trash', { block, tabId: props.tabId })
}

// URL copied to system clipboard (normal mode)
function handleUrlCopied({ block }) {
  emit('url-copied', { block })
}
</script>

<template>
  <div
    class="bookmark-grid inline-grid grid-cols-8 gap-3 p-4 rounded-xl transition-all duration-300"
    :class="[
      editMode
        ? 'bg-bg-secondary/50 ring-2 ring-neon-magenta/30'
        : 'bg-transparent ring-2 ring-bg-tertiary/50'
    ]"
    role="grid"
    aria-label="Сетка закладок"
  >
    <BookmarkCell
      v-for="cell in cells"
      :key="cell.key"
      :block="cell.block"
      :row="cell.row"
      :col="cell.col"
      :tab-id="tabId"
      :edit-mode="editMode"
      :is-highlighted="isCellHighlighted(cell.row, cell.col)"
      :is-dimmed="isCellDimmed(cell.row, cell.col)"
      :show-key-hints="showKeyHints"
      :key-hint-opacity="keyHintOpacity"
      @click="handleCellClick"
      @block-click="handleBlockClick"
      @drop="handleDrop"
      @drop-conflict="handleDropConflict"
      @copy="handleCopy"
      @cut="handleCut"
      @paste="handlePaste"
      @move-to-buffer="handleMoveToBuffer"
      @move-to-trash="handleMoveToTrash"
      @url-copied="handleUrlCopied"
    />
  </div>

  <!-- Context menu for drop conflicts -->
  <ContextMenu
    v-if="showContextMenu"
    :x="contextMenuPosition.x"
    :y="contextMenuPosition.y"
    :options="contextMenuOptions"
    @select="handleContextMenuSelect"
    @close="closeContextMenu"
  />
</template>
