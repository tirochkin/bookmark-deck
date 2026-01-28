<script setup>
import { useEditMode } from '@/composables/useEditMode.js'
import { useClipboard } from '@/composables/useClipboard.js'

defineProps({
  isExtension: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['open-import-export', 'reset-all', 'open-help', 'close'])

const { isEditMode, toggle } = useEditMode()
const { hasClipboard, clipboardBlock, isCut, clear: clearClipboard } = useClipboard()

function openImportExport() {
  emit('open-import-export')
}

function resetAll() {
  emit('reset-all')
}
</script>

<template>
  <header
    class="flex items-center justify-between p-4 border-b transition-colors duration-300"
    :class="[
      isEditMode
        ? 'bg-bg-secondary border-neon-magenta/30'
        : 'bg-bg-secondary border-bg-tertiary'
    ]"
  >
    <div class="flex items-center gap-3">
      <h1 class="text-xl font-semibold text-neon-cyan">Bookmark Deck</h1>

      <!-- Edit mode indicator -->
      <span
        v-if="isEditMode"
        class="px-2 py-0.5 text-xs font-medium rounded bg-neon-magenta/20 text-neon-magenta
               animate-pulse"
      >
        РЕДАКТИРОВАНИЕ
      </span>

      <!-- Clipboard indicator -->
      <div
        v-if="isEditMode && hasClipboard"
        class="flex items-center gap-2 px-2 py-1 rounded bg-neon-lime/10 border border-neon-lime/30"
      >
        <svg
          class="w-3.5 h-3.5 text-neon-lime"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
        <span class="text-xs text-neon-lime">
          {{ isCut ? 'Вырезано' : 'Скопировано' }}: {{ clipboardBlock?.title?.slice(0, 15) }}{{ clipboardBlock?.title?.length > 15 ? '...' : '' }}
        </span>
        <button
          class="text-neon-lime/60 hover:text-neon-lime transition-colors"
          title="Очистить буфер"
          @click="clearClipboard"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>

    <div class="flex items-center gap-2" role="toolbar" aria-label="Actions">
      <!-- Reset button (only in edit mode) -->
      <button
        v-if="isEditMode"
        class="p-2 rounded-lg text-red-400/70 hover:text-red-400
               hover:bg-red-500/10 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/50"
        title="Сбросить все данные"
        aria-label="Сбросить все данные"
        @click="resetAll"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
      </button>

      <!-- Help button -->
      <button
        class="p-2 rounded-lg text-text-secondary hover:text-text-primary
               hover:bg-bg-tertiary transition-colors focus:outline-none focus:ring-2 focus:ring-neon-cyan/50"
        title="Справка"
        aria-label="Открыть справку"
        @click="emit('open-help')"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </button>

      <!-- Import/Export button -->
      <button
        class="p-2 rounded-lg text-text-secondary hover:text-text-primary
               hover:bg-bg-tertiary transition-colors focus:outline-none focus:ring-2 focus:ring-neon-cyan/50"
        title="Импорт / Экспорт"
        aria-label="Импорт или экспорт закладок"
        @click="openImportExport"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
          />
        </svg>
      </button>

      <!-- Edit mode toggle -->
      <button
        class="px-4 py-2 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2"
        :class="[
          isEditMode
            ? 'bg-neon-magenta/20 text-neon-magenta ring-1 ring-neon-magenta/50 hover:bg-neon-magenta/30 focus:ring-neon-magenta/50'
            : 'bg-bg-tertiary text-text-secondary hover:text-text-primary hover:bg-bg-tertiary/80 focus:ring-neon-cyan/50'
        ]"
        :aria-pressed="isEditMode"
        aria-label="Переключить режим редактирования"
        @click="toggle"
      >
        <span class="flex items-center gap-2">
          <!-- Edit icon -->
          <svg
            v-if="!isEditMode"
            class="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
          <!-- Check icon -->
          <svg
            v-else
            class="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M5 13l4 4L19 7"
            />
          </svg>
          {{ isEditMode ? 'Готово' : 'Изменить' }}
        </span>
      </button>

      <!-- Close button (extension mode only) -->
      <button
        v-if="isExtension"
        class="ml-2 p-2 rounded-lg text-text-secondary hover:text-text-primary
               hover:bg-bg-tertiary transition-colors focus:outline-none focus:ring-2 focus:ring-neon-cyan/50"
        title="Закрыть (Esc)"
        aria-label="Закрыть"
        @click="emit('close')"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  </header>
</template>
