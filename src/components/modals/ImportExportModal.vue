<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { exportToJson, readJsonFile, validateImportData, prepareDataForImport } from '@/utils/exportImport.js'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  currentData: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close', 'import'])

const activeTab = ref('export') // 'export' or 'import'
const importFile = ref(null)
const importError = ref(null)
const importStats = ref(null)
const importData = ref(null)
const showConfirmOverwrite = ref(false)

const currentStats = computed(() => ({
  tabCount: props.currentData.tabs?.length || 0,
  blockCount: props.currentData.tabs?.reduce((sum, tab) => sum + tab.blocks.length, 0) || 0,
  bufferCount: props.currentData.buffer?.length || 0
}))

function handleExport() {
  const timestamp = new Date().toISOString().slice(0, 10)
  exportToJson(props.currentData, `bookmark-deck-${timestamp}.json`)
}

async function handleFileSelect(event) {
  const file = event.target.files?.[0]
  if (!file) return

  importFile.value = file
  importError.value = null
  importStats.value = null
  importData.value = null
  showConfirmOverwrite.value = false

  const result = await readJsonFile(file)

  if (!result.success) {
    importError.value = result.error
    return
  }

  const validation = validateImportData(result.data)

  if (!validation.valid) {
    importError.value = validation.error
    return
  }

  importStats.value = validation.stats
  importData.value = result.data
}

function handleImportClick() {
  if (!importData.value) return
  showConfirmOverwrite.value = true
}

function handleConfirmImport() {
  if (!importData.value) return

  const preparedData = prepareDataForImport(importData.value)
  emit('import', preparedData)
  handleClose()
}

function handleClose() {
  activeTab.value = 'export'
  importFile.value = null
  importError.value = null
  importStats.value = null
  importData.value = null
  showConfirmOverwrite.value = false
  emit('close')
}

function formatDate(isoString) {
  if (!isoString) return 'Неизвестно'
  try {
    return new Date(isoString).toLocaleString('ru-RU')
  } catch {
    return 'Неизвестно'
  }
}

function handleKeydown(e) {
  if (e.key === 'Escape' && props.show) {
    handleClose()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="show"
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <!-- Backdrop -->
      <div
        class="absolute inset-0 bg-black/70 backdrop-blur-sm"
        @click="handleClose"
      />

      <!-- Modal -->
      <div
        class="relative bg-bg-secondary rounded-xl border border-bg-tertiary shadow-2xl
               w-full max-w-lg animate-in"
      >
        <!-- Header -->
        <div class="flex items-center justify-between p-4 border-b border-bg-tertiary">
          <h2 class="text-lg font-semibold text-text-primary">Импорт / Экспорт</h2>
          <button
            class="p-1 text-text-secondary hover:text-text-primary transition-colors"
            @click="handleClose"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Tabs -->
        <div class="flex border-b border-bg-tertiary">
          <button
            class="flex-1 px-4 py-3 text-sm font-medium transition-colors"
            :class="[
              activeTab === 'export'
                ? 'text-neon-cyan border-b-2 border-neon-cyan'
                : 'text-text-secondary hover:text-text-primary'
            ]"
            @click="activeTab = 'export'"
          >
            Экспорт
          </button>
          <button
            class="flex-1 px-4 py-3 text-sm font-medium transition-colors"
            :class="[
              activeTab === 'import'
                ? 'text-neon-cyan border-b-2 border-neon-cyan'
                : 'text-text-secondary hover:text-text-primary'
            ]"
            @click="activeTab = 'import'"
          >
            Импорт
          </button>
        </div>

        <!-- Content -->
        <div class="p-4">
          <!-- Export Tab -->
          <div v-if="activeTab === 'export'" class="space-y-4">
            <p class="text-sm text-text-secondary">
              Экспортируйте все закладки, вкладки и настройки в JSON-файл.
            </p>

            <!-- Current data stats -->
            <div class="p-3 rounded-lg bg-bg-primary/50 border border-bg-tertiary">
              <div class="text-xs text-text-secondary mb-2">Текущие данные:</div>
              <div class="grid grid-cols-3 gap-2 text-sm">
                <div>
                  <span class="text-neon-cyan font-medium">{{ currentStats.tabCount }}</span>
                  <span class="text-text-secondary ml-1">вкладок</span>
                </div>
                <div>
                  <span class="text-neon-cyan font-medium">{{ currentStats.blockCount }}</span>
                  <span class="text-text-secondary ml-1">закладок</span>
                </div>
                <div>
                  <span class="text-neon-cyan font-medium">{{ currentStats.bufferCount }}</span>
                  <span class="text-text-secondary ml-1">в буфере</span>
                </div>
              </div>
            </div>

            <button
              class="w-full px-4 py-3 rounded-lg bg-neon-cyan/20 text-neon-cyan font-medium
                     hover:bg-neon-cyan/30 transition-colors flex items-center justify-center gap-2"
              @click="handleExport"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Скачать JSON-файл
            </button>
          </div>

          <!-- Import Tab -->
          <div v-if="activeTab === 'import'" class="space-y-4">
            <p class="text-sm text-text-secondary">
              Импортируйте закладки из ранее экспортированного JSON-файла.
            </p>

            <!-- File input -->
            <label
              class="block p-6 rounded-lg border-2 border-dashed border-bg-tertiary
                     hover:border-neon-cyan/50 transition-colors cursor-pointer text-center"
            >
              <input
                type="file"
                accept=".json"
                class="hidden"
                @change="handleFileSelect"
              >
              <svg class="w-8 h-8 mx-auto mb-2 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <span class="text-sm text-text-secondary">
                {{ importFile ? importFile.name : 'Нажмите, чтобы выбрать JSON-файл' }}
              </span>
            </label>

            <!-- Error message -->
            <div
              v-if="importError"
              class="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm"
            >
              {{ importError }}
            </div>

            <!-- Import preview -->
            <div
              v-if="importStats"
              class="p-3 rounded-lg bg-bg-primary/50 border border-bg-tertiary"
            >
              <div class="text-xs text-text-secondary mb-2">Содержимое файла:</div>
              <div class="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span class="text-neon-lime font-medium">{{ importStats.tabCount }}</span>
                  <span class="text-text-secondary ml-1">вкладок</span>
                </div>
                <div>
                  <span class="text-neon-lime font-medium">{{ importStats.blockCount }}</span>
                  <span class="text-text-secondary ml-1">закладок</span>
                </div>
                <div>
                  <span class="text-neon-lime font-medium">{{ importStats.bufferCount }}</span>
                  <span class="text-text-secondary ml-1">в буфере</span>
                </div>
                <div>
                  <span class="text-text-secondary text-xs">
                    Экспорт: {{ formatDate(importStats.exportedAt) }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Confirm overwrite warning -->
            <div
              v-if="showConfirmOverwrite"
              class="p-3 rounded-lg bg-neon-orange/10 border border-neon-orange/30"
            >
              <div class="flex items-start gap-2">
                <svg class="w-5 h-5 text-neon-orange shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <div class="text-sm font-medium text-neon-orange">Все текущие данные будут заменены</div>
                  <div class="text-xs text-text-secondary mt-1">
                    Ваши {{ currentStats.tabCount }} вкладок и {{ currentStats.blockCount }} закладок будут заменены.
                  </div>
                </div>
              </div>

              <div class="flex gap-2 mt-3">
                <button
                  class="flex-1 px-3 py-2 rounded-lg bg-bg-tertiary text-text-secondary
                         hover:text-text-primary transition-colors text-sm"
                  @click="showConfirmOverwrite = false"
                >
                  Отмена
                </button>
                <button
                  class="flex-1 px-3 py-2 rounded-lg bg-neon-orange/20 text-neon-orange
                         hover:bg-neon-orange/30 transition-colors text-sm font-medium"
                  @click="handleConfirmImport"
                >
                  Заменить данные
                </button>
              </div>
            </div>

            <!-- Import button -->
            <button
              v-if="importStats && !showConfirmOverwrite"
              class="w-full px-4 py-3 rounded-lg bg-neon-lime/20 text-neon-lime font-medium
                     hover:bg-neon-lime/30 transition-colors flex items-center justify-center gap-2"
              @click="handleImportClick"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Импортировать данные
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.animate-in {
  animation: modal-in 0.2s ease-out;
}

@keyframes modal-in {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
