<script setup>
import { computed } from 'vue'
import { getColorById, getDefaultColorId } from '@/utils/colors.js'
import { useDragDrop } from '@/composables/useDragDrop.js'
import { useClipboard } from '@/composables/useClipboard.js'

const COLS = 3
const ROWS = 4
const MAX_BUFFER_SIZE = COLS * ROWS

const props = defineProps({
  blocks: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['block-drag-start', 'drop', 'drop-from-trash', 'block-click', 'copy', 'cut', 'move-to-trash'])

const {
  isDragging,
  draggedBlock,
  draggedFromBuffer,
  draggedFromTrash,
  draggedTrashIndex,
  dropTargetPosition,
  startDragFromBuffer,
  endDrag,
  setDropTarget,
  clearDropTarget
} = useDragDrop()

const { clipboardBlock, isCut, hasClipboard } = useClipboard()

// Create a map for quick block lookup by position in buffer
const blockMap = computed(() => {
  const map = new Map()
  props.blocks.forEach((block, index) => {
    const row = Math.floor(index / COLS)
    const col = index % COLS
    map.set(`${row}-${col}`, { block, index })
  })
  return map
})

// Generate all cells as a flat array for the grid
const cells = computed(() => {
  const result = []
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const key = `${row}-${col}`
      const data = blockMap.value.get(key)
      result.push({
        row,
        col,
        key,
        block: data?.block || null,
        index: data?.index ?? null
      })
    }
  }
  return result
})

// Check if buffer has space
const hasSpace = computed(() => props.blocks.length < MAX_BUFFER_SIZE)

// Next available position (where new block will be inserted)
const nextAvailablePosition = computed(() => {
  if (!hasSpace.value) return null
  const index = props.blocks.length
  return {
    row: Math.floor(index / COLS),
    col: index % COLS
  }
})

// Check if cell is the next available slot
function isNextAvailable(row, col) {
  if (!nextAvailablePosition.value) return false
  return nextAvailablePosition.value.row === row && nextAvailablePosition.value.col === col
}

// Check if this block is cut to clipboard
function isCutToClipboard(block) {
  if (!block || !clipboardBlock.value || !isCut.value) return false
  return clipboardBlock.value.id === block.id
}

// Check if cell is drop target (always next available when dragging over buffer)
function isDropTarget(row, col) {
  if (!dropTargetPosition.value?.isBuffer) return false
  // When dragging over buffer, highlight next available position
  if (!nextAvailablePosition.value) return false
  return nextAvailablePosition.value.row === row && nextAvailablePosition.value.col === col
}

// Check if block is being dragged
function isBeingDragged(block) {
  if (!isDragging.value || !draggedBlock.value || !block) return false
  return draggedBlock.value.id === block.id
}

// Get color config for a block
function getBlockColor(block) {
  return getColorById(block.color) || getColorById(getDefaultColorId())
}

// Get background style for a block
function getBlockBackground(block) {
  const color = getBlockColor(block)
  if (color.background.startsWith('linear-gradient')) {
    return { background: color.background }
  }
  return { backgroundColor: color.background }
}

// Get glow style
function getGlowStyle(block) {
  const color = getBlockColor(block)
  return `0 0 20px ${color.glow}40, 0 0 40px ${color.glow}20`
}

// Handle drag start from buffer block
function handleDragStart(block, event) {
  startDragFromBuffer(block, event)
  emit('block-drag-start', block)
}

// Handle drag end
function handleDragEnd() {
  endDrag()
}

// Handle drag over buffer area (entire grid)
function handleBufferDragOver(event) {
  if (!isDragging.value) return
  // Don't allow dropping buffer blocks back to buffer
  if (draggedFromBuffer.value) return
  // Only allow drop when buffer has space
  if (!hasSpace.value) return

  event.preventDefault()
  // Set drop target to signal buffer is active (we always use next available position)
  setDropTarget({ isBuffer: true, row: 0, col: 0 })
}

// Handle drag enter on buffer area
function handleBufferDragEnter(event) {
  if (!isDragging.value) return
  if (draggedFromBuffer.value) return
  if (!hasSpace.value) return

  event.preventDefault()
  setDropTarget({ isBuffer: true, row: 0, col: 0 })
}

// Handle drag leave from buffer area
function handleBufferDragLeave(event) {
  const rect = event.currentTarget.getBoundingClientRect()
  const x = event.clientX
  const y = event.clientY

  if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
    clearDropTarget()
  }
}

// Handle drop on buffer cell
function handleDrop(event) {
  event.preventDefault()

  if (!isDragging.value || !draggedBlock.value) return
  if (draggedFromBuffer.value) return

  if (draggedFromTrash.value) {
    emit('drop-from-trash', { trashIndex: draggedTrashIndex.value })
  } else {
    emit('drop', draggedBlock.value)
  }
  clearDropTarget()
}

// Handle click on buffer block
function handleBlockClick(event, block) {
  // Alt+Shift+Click = move to trash
  if (event.altKey && event.shiftKey) {
    emit('move-to-trash', { block })
    return
  }

  // Alt+Click = do nothing (block is already in buffer)
  if (event.altKey) {
    return
  }

  // Handle clipboard operations with modifiers
  if (event.ctrlKey || event.metaKey) {
    emit('copy', { block })
    return
  }
  if (event.shiftKey) {
    emit('cut', { block })
    return
  }

  emit('block-click', block)
}
</script>

<template>
  <div class="buffer-panel">
    <!-- Header aligned with tabs -->
    <div class="mb-4 h-[34px] flex items-end">
      <span class="text-sm font-medium text-text-secondary">Буфер</span>
    </div>

    <!-- Buffer grid 3x4 -->
    <div
      class="buffer-grid inline-grid grid-cols-3 gap-3 p-4 rounded-xl bg-bg-secondary/50 ring-2 ring-neon-cyan/30"
      @dragover="handleBufferDragOver"
      @dragenter="handleBufferDragEnter"
      @dragleave="handleBufferDragLeave"
      @drop="handleDrop"
    >
      <div
        v-for="cell in cells"
        :key="cell.key"
        class="buffer-cell w-[88px] h-[88px] rounded-lg transition-all duration-200"
        :class="[
          isNextAvailable(cell.row, cell.col) && !cell.block
            ? 'border-2 border-dashed border-neon-cyan/30'
            : '',
          isDropTarget(cell.row, cell.col) && !cell.block
            ? 'ring-2 ring-neon-cyan bg-neon-cyan/10 border-neon-cyan'
            : '',
          cell.block && isBeingDragged(cell.block) ? 'opacity-40 scale-95' : '',
          cell.block && isCutToClipboard(cell.block) ? 'opacity-50 ring-2 ring-dashed ring-neon-lime' : ''
        ]"
      >
        <!-- Block content -->
        <div
          v-if="cell.block"
          class="buffer-block group relative w-full h-full rounded-lg flex justify-center items-center px-2
                 cursor-grab active:cursor-grabbing select-none overflow-hidden
                 ring-2 ring-transparent hover:ring-neon-cyan/50"
          :style="getBlockBackground(cell.block)"
          :title="cell.block.title"
          draggable="true"
          @dragstart="handleDragStart(cell.block, $event)"
          @dragend="handleDragEnd"
          @click="handleBlockClick($event, cell.block)"
        >
          <span class="text-sm font-medium text-white text-center leading-tight break-words line-clamp-3">
            {{ cell.block.title }}
          </span>

          <!-- Hover overlay -->
          <div
            class="absolute inset-0 bg-black/0 group-hover:bg-black/40
                   flex items-center justify-center opacity-0 group-hover:opacity-100
                   transition-opacity duration-150"
          >
            <svg class="w-6 h-6 text-white drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
        </div>

        <!-- Drop indicator -->
        <div
          v-else-if="isDropTarget(cell.row, cell.col)"
          class="w-full h-full flex items-center justify-center text-neon-cyan"
        >
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.buffer-block {
  transform: translateZ(0) scale(1);
  transition: transform 150ms ease-out, box-shadow 150ms ease-out;
  will-change: transform, box-shadow;
}

.buffer-block:hover {
  transform: translateZ(0) scale(1.02);
}

.buffer-block:active {
  transform: translateZ(0) scale(0.98);
}
</style>
