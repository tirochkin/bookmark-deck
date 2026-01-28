<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { getColorById, getDefaultColorId } from '@/utils/colors.js'
import { useDragDrop } from '@/composables/useDragDrop.js'

const props = defineProps({
  blocks: {
    type: Array,
    default: () => []
  },
  tabCount: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['drop', 'drag-to-buffer', 'drag-to-grid', 'empty'])

const {
  isDragging,
  draggedBlock,
  draggedFromTrash,
  setDropTarget,
  clearDropTarget,
  dropTargetPosition,
  startDragFromTrash,
  endDrag
} = useDragDrop()

const isExpanded = ref(false)
const popupRef = ref(null)
const buttonRef = ref(null)

// Check if trash is drop target
const isDropTarget = computed(() => {
  return dropTargetPosition.value?.isTrash === true
})

const blockCount = computed(() => props.blocks.length)
const totalCount = computed(() => blockCount.value + props.tabCount)
const isEmpty = computed(() => totalCount.value === 0)

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

// Handle drag over trash
function handleDragOver(event) {
  if (!isDragging.value || !draggedBlock.value) return
  // Don't allow dropping trash blocks back to trash
  if (draggedFromTrash.value) return

  event.preventDefault()
  setDropTarget({ isTrash: true })
}

// Handle drag enter
function handleDragEnter(event) {
  if (!isDragging.value || !draggedBlock.value) return
  if (draggedFromTrash.value) return

  event.preventDefault()
  setDropTarget({ isTrash: true })
}

// Handle drag leave
function handleDragLeave(event) {
  const rect = event.currentTarget.getBoundingClientRect()
  const x = event.clientX
  const y = event.clientY

  if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
    clearDropTarget()
  }
}

// Handle drop on trash
function handleDrop(event) {
  event.preventDefault()

  if (!isDragging.value || !draggedBlock.value) return
  if (draggedFromTrash.value) return

  emit('drop', draggedBlock.value)
  clearDropTarget()
}

// Toggle expanded state
function toggleExpanded() {
  if (!isEmpty.value) {
    isExpanded.value = !isExpanded.value
  }
}

// Handle drag start from trash block
function handleBlockDragStart(block, index, event) {
  startDragFromTrash(block, index, event)
}

// Handle drag end
function handleBlockDragEnd() {
  endDrag()
}

// Handle empty trash
function handleEmpty() {
  emit('empty')
  isExpanded.value = false
}

// Close popup when clicking outside
function handleClickOutside(event) {
  if (!isExpanded.value) return

  const popup = popupRef.value
  const button = buttonRef.value

  if (popup && button) {
    if (!popup.contains(event.target) && !button.contains(event.target)) {
      isExpanded.value = false
    }
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <div class="trash-bin relative">
    <!-- Main trash button -->
    <div
      ref="buttonRef"
      class="trash-button flex items-center gap-2 px-3 py-2 rounded-lg border-2 border-dashed
             transition-all duration-200 cursor-pointer"
      :class="[
        isDropTarget
          ? 'border-red-500 bg-red-500/20 text-red-400'
          : isEmpty
            ? 'border-bg-tertiary text-text-secondary hover:border-red-500/30 hover:text-red-400'
            : 'border-red-500/30 text-red-400 hover:border-red-500/50'
      ]"
      @dragover="handleDragOver"
      @dragenter="handleDragEnter"
      @dragleave="handleDragLeave"
      @drop="handleDrop"
      @click="toggleExpanded"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
        />
      </svg>
      <span class="text-xs">Корзина</span>

      <!-- Badge -->
      <span
        v-if="totalCount > 0"
        class="flex items-center justify-center min-w-5 h-5 px-1 rounded-full
               bg-red-500 text-white text-xs font-medium"
      >
        {{ totalCount }}
      </span>
    </div>

    <!-- Expanded panel -->
    <div
      v-if="isExpanded && !isEmpty"
      ref="popupRef"
      class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-4 rounded-xl bg-bg-secondary border border-bg-tertiary
             shadow-xl shadow-black/50 z-50 w-max"
    >
      <div class="flex items-center justify-between mb-3">
        <span class="text-sm font-medium text-text-primary">Корзина</span>
        <button
          class="text-xs text-red-400 hover:text-red-300 transition-colors px-2 py-1 rounded hover:bg-red-500/10"
          @click.stop="handleEmpty"
        >
          Очистить
        </button>
      </div>

      <!-- Blocks grid -->
      <div v-if="blockCount > 0" class="mb-3">
        <div class="text-xs text-text-secondary mb-2">
          Перетащите на панель или в буфер для восстановления
        </div>
        <div class="grid grid-cols-4 gap-3 max-h-[388px] overflow-y-auto">
          <div
            v-for="(block, index) in blocks"
            :key="block.id"
            class="trash-block w-[88px] h-[88px] rounded-lg cursor-grab active:cursor-grabbing
                   flex items-center justify-center overflow-hidden
                   ring-2 ring-transparent hover:ring-red-400/50
                   transition-colors duration-200"
            :style="getBlockBackground(block)"
            :title="block.title"
            draggable="true"
            @dragstart="handleBlockDragStart(block, index, $event)"
            @dragend="handleBlockDragEnd"
          >
            <span class="text-sm font-medium text-white text-center leading-tight break-words line-clamp-3 px-2">
              {{ block.title }}
            </span>
          </div>
        </div>
      </div>

      <!-- Tabs section -->
      <div v-if="tabCount > 0" class="pt-3 border-t border-bg-tertiary">
        <div class="text-xs text-text-secondary">
          Удалённые вкладки: {{ tabCount }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.trash-bin {
  user-select: none;
}

.trash-block {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.trash-block:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
}
</style>
