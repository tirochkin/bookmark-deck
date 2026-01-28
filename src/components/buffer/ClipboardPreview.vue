<script setup>
import { computed } from 'vue'
import { useClipboard } from '@/composables/useClipboard.js'
import { getColorById, getDefaultColorId } from '@/utils/colors.js'

const { clipboardBlock, isCut, hasClipboard, clear } = useClipboard()

// Detect macOS for correct modifier key display
const isMac = computed(() => {
  return typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform)
})

const cmdKey = computed(() => isMac.value ? '⌘' : 'Ctrl')

// Get color config for the clipboard block
const blockColor = computed(() => {
  if (!clipboardBlock.value) return null
  return getColorById(clipboardBlock.value.color) || getColorById(getDefaultColorId())
})

// Get background style for the block
const blockBackground = computed(() => {
  if (!blockColor.value) return {}
  if (blockColor.value.background.startsWith('linear-gradient')) {
    return { background: blockColor.value.background }
  }
  return { backgroundColor: blockColor.value.background }
})

// Operation label
const operationLabel = computed(() => {
  return isCut.value ? 'Вырезано' : 'Скопировано'
})

// Handle clear clipboard
function handleClear() {
  clear()
}
</script>

<template>
  <div v-if="hasClipboard" class="clipboard-preview w-[320px]">
    <!-- Header -->
    <div class="flex items-center justify-between mb-2">
      <span class="text-sm font-medium text-text-secondary">{{ operationLabel }}</span>
      <button
        @click="handleClear"
        class="text-text-muted hover:text-text-secondary transition-colors p-1 -mr-1"
        title="Очистить буфер обмена"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- Block preview -->
    <div class="preview-container p-3 rounded-lg bg-bg-secondary/50 ring-1"
         :class="isCut ? 'ring-neon-lime/30' : 'ring-neon-cyan/30'">
      <div class="flex items-center gap-3 overflow-hidden">
        <!-- Mini block preview -->
        <div
          class="preview-block w-12 h-12 rounded-md flex items-center justify-center shrink-0"
          :style="blockBackground"
          :class="isCut ? 'ring-2 ring-dashed ring-neon-lime/50' : 'ring-1 ring-white/20'"
        >
          <span class="text-[10px] font-medium text-white text-center leading-tight break-words line-clamp-2 px-1">
            {{ clipboardBlock.title }}
          </span>
        </div>

        <!-- Block info -->
        <div class="min-w-0 flex-1">
          <div class="text-sm font-medium text-text-primary truncate" :title="clipboardBlock.title">
            {{ clipboardBlock.title }}
          </div>
          <div class="text-xs text-text-muted truncate mt-0.5" :title="clipboardBlock.url">
            {{ clipboardBlock.url }}
          </div>
        </div>
      </div>

      <!-- Hint -->
      <div class="mt-2 pt-2 border-t border-white/5 text-xs text-text-muted">
        {{ cmdKey }}+клик на пустую ячейку для вставки
      </div>
    </div>
  </div>
</template>

<style scoped>
.preview-block {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}
</style>
