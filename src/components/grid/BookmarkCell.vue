<script setup>
import { computed } from 'vue'
import BookmarkBlock from './BookmarkBlock.vue'
import { useDragDrop } from '@/composables/useDragDrop.js'
import { useClipboard } from '@/composables/useClipboard.js'
import { useModifierKeys } from '@/composables/useModifierKeys.js'

const props = defineProps({
  block: {
    type: Object,
    default: null
  },
  row: {
    type: Number,
    required: true
  },
  col: {
    type: Number,
    required: true
  },
  editMode: {
    type: Boolean,
    default: false
  },
  tabId: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['click', 'block-click', 'drop', 'drop-conflict', 'copy', 'cut', 'paste', 'move-to-buffer', 'move-to-trash', 'url-copied'])

const {
  isDragging,
  draggedBlock,
  dropTargetPosition,
  startDrag,
  endDrag,
  setDropTarget,
  clearDropTarget,
  isValidDropTarget
} = useDragDrop()

const { clipboardBlock, isCut, hasClipboard } = useClipboard()
const { altKey, shiftKey, ctrlKey, metaKey } = useModifierKeys()

const position = computed(() => ({ row: props.row, col: props.col }))

// Cursor class based on modifiers (only in edit mode with a block)
const cursorClass = computed(() => {
  if (!props.editMode || isDragging.value) return ''

  if (props.block) {
    // Alt+Shift = trash (not-allowed style indicates destructive action)
    if (altKey.value && shiftKey.value) return 'cursor-not-allowed'
    // Alt = move to buffer
    if (altKey.value) return 'cursor-move'
    // Ctrl/Cmd = copy
    if (ctrlKey.value || metaKey.value) return 'cursor-copy'
    // Shift = cut
    if (shiftKey.value) return 'cursor-grab'
  } else {
    // Empty cell with clipboard and Ctrl/Cmd = paste
    if ((ctrlKey.value || metaKey.value) && hasClipboard.value) return 'cursor-cell'
  }

  return 'cursor-pointer'
})

// Check if this block is cut to clipboard
const isCutToClipboard = computed(() => {
  if (!props.block || !clipboardBlock.value || !isCut.value) return false
  return clipboardBlock.value.id === props.block.id
})

// Check if this cell is currently a valid drop target
const isDropTarget = computed(() => {
  if (!dropTargetPosition.value) return false
  // Only highlight if drop target is on the main grid (not buffer or trash)
  if (dropTargetPosition.value.isBuffer || dropTargetPosition.value.isTrash) return false
  return (
    dropTargetPosition.value.row === props.row &&
    dropTargetPosition.value.col === props.col
  )
})

// Check if this cell is being dragged
const isBeingDragged = computed(() => {
  if (!isDragging.value || !draggedBlock.value || !props.block) return false
  return draggedBlock.value.id === props.block.id
})

async function handleClick(event) {
  // Handle clipboard operations with modifiers (only in edit mode)
  if (props.editMode) {
    // Alt+Shift+Click on block = move to trash
    if (event.altKey && event.shiftKey && props.block) {
      emit('move-to-trash', { block: props.block })
      return
    }

    // Alt+Click on block = move to buffer
    if (event.altKey && props.block) {
      emit('move-to-buffer', { block: props.block })
      return
    }

    // Ctrl+Click = copy or paste
    if (event.ctrlKey || event.metaKey) {
      if (hasClipboard.value) {
        // Has clipboard - paste (emit paste event, grid will handle conflict if needed)
        emit('paste', { position: position.value, menuPosition: { x: event.clientX, y: event.clientY } })
        return
      } else if (props.block) {
        // No clipboard, has block - copy
        emit('copy', { block: props.block, position: position.value })
        return
      }
    }

    // Shift+Click on block = cut
    if (event.shiftKey && props.block) {
      emit('cut', { block: props.block, position: position.value })
      return
    }

    // Any modifier on empty cell = do nothing (don't open modal)
    if (!props.block && (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey)) {
      return
    }
  } else {
    // Normal mode: Ctrl+Click copies URL to system clipboard
    if ((event.ctrlKey || event.metaKey) && props.block) {
      try {
        await navigator.clipboard.writeText(props.block.url)
        emit('url-copied', { block: props.block })
      } catch (err) {
        console.error('Failed to copy URL:', err)
      }
      return
    }
  }

  // Default click behavior
  if (props.block) {
    emit('block-click', props.block)
  } else {
    emit('click', { row: props.row, col: props.col })
  }
}

// Keyboard support
function handleKeydown(event) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    handleClick(event)
  }
}

// Drag start - only blocks can be dragged, only in edit mode
function handleDragStart(event) {
  if (!props.editMode || !props.block) {
    event.preventDefault()
    return
  }

  startDrag(props.block, props.tabId, event)

  // Add custom drag image
  if (event.dataTransfer) {
    const target = event.target
    event.dataTransfer.setDragImage(target, 40, 40)
  }
}

// Drag end - cleanup
function handleDragEnd() {
  endDrag()
}

// Drag over - allow drop
function handleDragOver(event) {
  if (!props.editMode || !isDragging.value) return

  if (isValidDropTarget(position.value)) {
    event.preventDefault()
    setDropTarget({ ...position.value, isGrid: true }, props.block)
  }
}

// Drag enter
function handleDragEnter(event) {
  if (!props.editMode || !isDragging.value) return

  if (isValidDropTarget(position.value)) {
    event.preventDefault()
    setDropTarget({ ...position.value, isGrid: true }, props.block)
  }
}

// Drag leave
function handleDragLeave(event) {
  // Only clear if we're actually leaving the cell (not entering a child)
  const rect = event.currentTarget.getBoundingClientRect()
  const x = event.clientX
  const y = event.clientY

  if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
    clearDropTarget()
  }
}

// Drop - handle the drop action
function handleDrop(event) {
  event.preventDefault()

  if (!props.editMode || !isDragging.value || !draggedBlock.value) return

  if (!isValidDropTarget(position.value)) {
    endDrag()
    return
  }

  // Get drop position for context menu
  const dropPosition = {
    x: event.clientX,
    y: event.clientY
  }

  if (props.block) {
    // Conflict - target cell has a block
    emit('drop-conflict', {
      draggedBlock: draggedBlock.value,
      targetBlock: props.block,
      targetPosition: position.value,
      menuPosition: dropPosition
    })
  } else {
    // No conflict - move to empty cell
    emit('drop', {
      draggedBlock: draggedBlock.value,
      targetPosition: position.value
    })
  }

  endDrag()
}
</script>

<template>
  <div
    class="bookmark-cell w-[88px] h-[88px] rounded-lg transition-all duration-200"
    :class="[
      block
        ? ''
        : editMode
          ? 'border-2 border-dashed border-neon-magenta/30 hover:border-neon-magenta/60 hover:bg-neon-magenta/5'
          : 'border border-dashed border-bg-tertiary',
      // Drag states
      isBeingDragged ? 'opacity-40 scale-95' : '',
      isDropTarget && !block ? 'ring-2 ring-neon-cyan bg-neon-cyan/10 border-neon-cyan' : '',
      isDropTarget && block ? 'ring-2 ring-neon-orange bg-neon-orange/10' : '',
      // Cut to clipboard state
      isCutToClipboard ? 'opacity-50 ring-2 ring-dashed ring-neon-lime' : '',
      // Paste target hint (empty cell with clipboard content)
      !block && editMode && hasClipboard && !isDropTarget ? 'hover:ring-2 hover:ring-neon-lime/50' : '',
      // Dynamic cursor based on modifiers
      cursorClass
    ]"
    :draggable="editMode && !!block"
    :tabindex="block || editMode ? 0 : -1"
    :role="block ? 'button' : editMode ? 'button' : 'presentation'"
    :aria-label="block ? block.title : editMode ? `Добавить закладку в строку ${row + 1}, столбец ${col + 1}` : undefined"
    @click="handleClick"
    @keydown="handleKeydown"
    @dragstart="handleDragStart"
    @dragend="handleDragEnd"
    @dragover="handleDragOver"
    @dragenter="handleDragEnter"
    @dragleave="handleDragLeave"
    @drop="handleDrop"
  >
    <BookmarkBlock v-if="block" :block="block" :edit-mode="editMode" />

    <!-- Plus icon for empty cells in edit mode -->
    <div
      v-if="!block && editMode && !isDropTarget"
      class="w-full h-full flex items-center justify-center text-neon-magenta/30
             hover:text-neon-magenta/60 transition-colors"
      aria-hidden="true"
    >
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
      </svg>
    </div>

    <!-- Drop indicator for empty cells -->
    <div
      v-if="!block && isDropTarget"
      class="w-full h-full flex items-center justify-center text-neon-cyan"
      aria-hidden="true"
    >
      <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
      </svg>
    </div>
  </div>
</template>
