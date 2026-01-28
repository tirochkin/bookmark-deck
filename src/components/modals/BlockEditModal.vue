<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import ColorPalette from '@/components/ui/ColorPalette.vue'
import AlignmentPicker from '@/components/ui/AlignmentPicker.vue'
import BookmarkBlock from '@/components/grid/BookmarkBlock.vue'
import { getDefaultColorId } from '@/utils/colors.js'
import { isValidUrl, isValidTitle } from '@/utils/validators.js'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  block: {
    type: Object,
    default: null
  },
  position: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['save', 'delete', 'cancel'])

const isEditMode = computed(() => !!props.block)

// Form data
const url = ref('')
const title = ref('')
const color = ref(getDefaultColorId())
const textAlign = ref('center')

// Validation
const urlError = ref('')
const titleError = ref('')

const isValid = computed(() => {
  return !urlError.value && !titleError.value && url.value && title.value
})

// Preview block
const previewBlock = computed(() => ({
  id: 'preview',
  url: url.value,
  title: title.value || 'Preview',
  color: color.value,
  textAlign: textAlign.value,
  position: { row: 0, col: 0 }
}))

// Initialize form when modal opens
watch(() => props.show, (newVal) => {
  if (newVal) {
    if (props.block) {
      url.value = props.block.url
      title.value = props.block.title
      color.value = props.block.color
      textAlign.value = props.block.textAlign
    } else {
      url.value = ''
      title.value = ''
      color.value = getDefaultColorId()
      textAlign.value = 'center'
    }
    urlError.value = ''
    titleError.value = ''
  }
})

function validateUrl() {
  if (!url.value) {
    urlError.value = 'URL обязателен'
  } else if (!isValidUrl(url.value)) {
    urlError.value = 'Неверный формат URL'
  } else {
    urlError.value = ''
  }
}

function validateTitle() {
  if (!title.value) {
    titleError.value = 'Название обязательно'
  } else if (!isValidTitle(title.value)) {
    titleError.value = 'Название должно быть 1-50 символов'
  } else {
    titleError.value = ''
  }
}

function handleSave() {
  validateUrl()
  validateTitle()

  if (!isValid.value) return

  emit('save', {
    url: url.value,
    title: title.value,
    color: color.value,
    textAlign: textAlign.value
  })
}

function handleDelete() {
  emit('delete')
}

function handleOverlayClick(e) {
  if (e.target === e.currentTarget) {
    emit('cancel')
  }
}

function handleKeydown(e) {
  if (e.key === 'Escape' && props.show) {
    emit('cancel')
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
    <Transition name="modal">
      <div
        v-if="show"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="isEditMode ? 'edit-bookmark-title' : 'add-bookmark-title'"
        @click="handleOverlayClick"
      >
        <div
          class="bg-bg-secondary rounded-xl shadow-2xl w-full max-w-lg
                 border border-bg-tertiary overflow-hidden"
        >
          <!-- Header -->
          <div class="px-6 py-4 border-b border-bg-tertiary">
            <h2
              :id="isEditMode ? 'edit-bookmark-title' : 'add-bookmark-title'"
              class="text-lg font-semibold text-text-primary"
            >
              {{ isEditMode ? 'Редактировать закладку' : 'Добавить закладку' }}
            </h2>
          </div>

          <!-- Content -->
          <div class="px-6 py-4 space-y-4">
            <!-- URL Field -->
            <div>
              <label for="bookmark-url" class="block text-sm font-medium text-text-secondary mb-1">
                Адрес (URL)
              </label>
              <input
                id="bookmark-url"
                v-model="url"
                type="url"
                placeholder="https://example.com"
                autocomplete="url"
                class="w-full px-3 py-2 bg-bg-tertiary border rounded-lg text-text-primary
                       placeholder-text-secondary/50 outline-none transition-colors
                       focus:ring-2 focus:ring-neon-cyan/50"
                :class="[
                  urlError
                    ? 'border-red-500 focus:border-red-500'
                    : 'border-bg-tertiary focus:border-neon-cyan'
                ]"
                :aria-invalid="!!urlError"
                :aria-describedby="urlError ? 'url-error' : undefined"
                @blur="validateUrl"
              />
              <p v-if="urlError" id="url-error" class="mt-1 text-xs text-red-400" role="alert">{{ urlError }}</p>
            </div>

            <!-- Title Field -->
            <div>
              <label for="bookmark-title" class="block text-sm font-medium text-text-secondary mb-1">
                Название
                <span class="text-text-secondary/50">({{ title.length }}/50)</span>
              </label>
              <input
                id="bookmark-title"
                v-model="title"
                type="text"
                maxlength="50"
                placeholder="Моя закладка"
                autocomplete="off"
                class="w-full px-3 py-2 bg-bg-tertiary border rounded-lg text-text-primary
                       placeholder-text-secondary/50 outline-none transition-colors
                       focus:ring-2 focus:ring-neon-cyan/50"
                :class="[
                  titleError
                    ? 'border-red-500 focus:border-red-500'
                    : 'border-bg-tertiary focus:border-neon-cyan'
                ]"
                :aria-invalid="!!titleError"
                :aria-describedby="titleError ? 'title-error' : undefined"
                @blur="validateTitle"
              />
              <p v-if="titleError" id="title-error" class="mt-1 text-xs text-red-400" role="alert">{{ titleError }}</p>
            </div>

            <!-- Color Picker -->
            <div>
              <label class="block text-sm font-medium text-text-secondary mb-2">
                Цвет
              </label>
              <ColorPalette v-model="color" />
            </div>

            <!-- Alignment Picker -->
            <div>
              <label class="block text-sm font-medium text-text-secondary mb-2">
                Выравнивание текста
              </label>
              <AlignmentPicker v-model="textAlign" />
            </div>

            <!-- Preview -->
            <div>
              <label class="block text-sm font-medium text-text-secondary mb-2">
                Превью
              </label>
              <div class="flex justify-center">
                <div class="w-20 h-20">
                  <BookmarkBlock :block="previewBlock" />
                </div>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex justify-between px-6 py-4 bg-bg-tertiary/30">
            <div>
              <button
                v-if="isEditMode"
                type="button"
                class="px-4 py-2 rounded-lg bg-red-500/20 text-red-400
                       hover:bg-red-500/30 transition-colors"
                @click="handleDelete"
              >
                Удалить
              </button>
            </div>
            <div class="flex gap-3">
              <button
                type="button"
                class="px-4 py-2 rounded-lg bg-bg-tertiary text-text-secondary
                       hover:text-text-primary transition-colors"
                @click="emit('cancel')"
              >
                Отмена
              </button>
              <button
                type="button"
                class="px-4 py-2 rounded-lg font-medium transition-colors"
                :class="[
                  isValid
                    ? 'bg-neon-cyan/20 text-neon-cyan hover:bg-neon-cyan/30'
                    : 'bg-bg-tertiary text-text-secondary/50 cursor-not-allowed'
                ]"
                :disabled="!isValid"
                @click="handleSave"
              >
                {{ isEditMode ? 'Сохранить' : 'Добавить' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-active > div,
.modal-leave-active > div {
  transition: transform 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from > div,
.modal-leave-to > div {
  transform: scale(0.95);
}
</style>
