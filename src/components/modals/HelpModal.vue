<script setup>
import { computed, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close'])

// Detect macOS for correct modifier key display
const isMac = computed(() => {
  return typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform)
})

// Get modifier key names for current platform
const cmdKey = computed(() => isMac.value ? '⌘' : 'Ctrl')
const altKey = computed(() => isMac.value ? '⌥' : 'Alt')
const shiftKey = '⇧'

// Handle Escape key
function handleKeydown(event) {
  if (event.key === 'Escape' && props.show) {
    emit('close')
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})

function handleBackdropClick(event) {
  if (event.target === event.currentTarget) {
    emit('close')
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="show"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        @click="handleBackdropClick"
      >
        <div
          class="help-modal bg-bg-secondary rounded-2xl shadow-2xl ring-1 ring-neon-cyan/30
                 w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col"
          role="dialog"
          aria-modal="true"
          aria-labelledby="help-title"
        >
          <!-- Header -->
          <div class="flex items-center justify-between p-5 border-b border-bg-tertiary">
            <h2 id="help-title" class="text-lg font-semibold text-neon-cyan flex items-center gap-2">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Справка
            </h2>
            <button
              class="p-1.5 rounded-lg text-text-secondary hover:text-text-primary
                     hover:bg-bg-tertiary transition-colors"
              aria-label="Закрыть"
              @click="emit('close')"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Content -->
          <div class="flex-1 overflow-y-auto p-5">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Normal mode section -->
              <section class="space-y-3">
                <h3 class="text-sm font-semibold text-neon-purple uppercase tracking-wide">
                  Обычный режим
                </h3>
                <div class="space-y-4 text-sm">
                  <div>
                    <h4 class="text-text-primary font-medium mb-2">Навигация</h4>
                    <ul class="space-y-1.5 text-text-secondary">
                      <li class="flex justify-between gap-4">
                        <span>Открыть ссылку</span>
                        <kbd class="kbd">Клик</kbd>
                      </li>
                      <li class="flex justify-between gap-4">
                        <span>Скопировать URL</span>
                        <kbd class="kbd">{{ cmdKey }}+клик</kbd>
                      </li>
                    </ul>
                  </div>
                </div>
              </section>

              <!-- Edit mode section -->
              <section class="space-y-3">
                <h3 class="text-sm font-semibold text-neon-magenta uppercase tracking-wide">
                  Режим редактирования
                </h3>
                <div class="space-y-4 text-sm">
                  <div>
                    <h4 class="text-text-primary font-medium mb-2">Блоки</h4>
                    <ul class="space-y-1.5 text-text-secondary">
                      <li class="flex justify-between gap-4">
                        <span>Редактировать</span>
                        <kbd class="kbd">Клик</kbd>
                      </li>
                      <li class="flex justify-between gap-4">
                        <span>Переместить</span>
                        <kbd class="kbd">Перетащить</kbd>
                      </li>
                      <li class="flex justify-between gap-4">
                        <span>Копировать</span>
                        <kbd class="kbd">{{ cmdKey }}+клик</kbd>
                      </li>
                      <li class="flex justify-between gap-4">
                        <span>Вырезать</span>
                        <kbd class="kbd">{{ shiftKey }}+клик</kbd>
                      </li>
                      <li class="flex justify-between gap-4">
                        <span>В буфер</span>
                        <kbd class="kbd">{{ altKey }}+клик</kbd>
                      </li>
                      <li class="flex justify-between gap-4">
                        <span>В корзину</span>
                        <kbd class="kbd">{{ altKey }}+{{ shiftKey }}+клик</kbd>
                      </li>
                    </ul>
                  </div>
                </div>
              </section>

              <!-- Empty cells -->
              <section class="space-y-3">
                <h3 class="text-sm font-semibold text-neon-cyan uppercase tracking-wide">
                  Пустые ячейки
                </h3>
                <div class="text-sm">
                  <ul class="space-y-1.5 text-text-secondary">
                    <li class="flex justify-between gap-4">
                      <span>Создать блок</span>
                      <kbd class="kbd">Клик</kbd>
                    </li>
                    <li class="flex justify-between gap-4">
                      <span>Вставить</span>
                      <kbd class="kbd">{{ cmdKey }}+клик</kbd>
                    </li>
                  </ul>
                </div>
              </section>

              <!-- Drag & Drop -->
              <section class="space-y-3">
                <h3 class="text-sm font-semibold text-neon-cyan uppercase tracking-wide">
                  Перетаскивание
                </h3>
                <div class="text-sm">
                  <ul class="space-y-1.5 text-text-secondary">
                    <li class="flex justify-between gap-4">
                      <span>На пустую ячейку</span>
                      <span class="text-text-primary/60">переместить</span>
                    </li>
                    <li class="flex justify-between gap-4">
                      <span>На занятую ячейку</span>
                      <span class="text-text-primary/60">меню действий</span>
                    </li>
                    <li class="flex justify-between gap-4">
                      <span>В корзину</span>
                      <span class="text-text-primary/60">удалить</span>
                    </li>
                  </ul>
                </div>
              </section>

              <!-- Tabs -->
              <section class="space-y-3">
                <h3 class="text-sm font-semibold text-neon-lime uppercase tracking-wide">
                  Вкладки
                </h3>
                <div class="text-sm">
                  <ul class="space-y-1.5 text-text-secondary">
                    <li class="flex justify-between gap-4">
                      <span>Переименовать</span>
                      <kbd class="kbd">Двойной клик</kbd>
                    </li>
                    <li class="flex justify-between gap-4">
                      <span>Изменить порядок</span>
                      <kbd class="kbd">Перетащить</kbd>
                    </li>
                    <li class="flex justify-between gap-4">
                      <span>Удалить</span>
                      <kbd class="kbd">✕</kbd>
                    </li>
                  </ul>
                </div>
              </section>

              <!-- Keyboard -->
              <section class="space-y-3">
                <h3 class="text-sm font-semibold text-neon-orange uppercase tracking-wide">
                  Клавиатура
                </h3>
                <div class="text-sm">
                  <ul class="space-y-1.5 text-text-secondary">
                    <li class="flex justify-between gap-4">
                      <span>Закрыть окно</span>
                      <kbd class="kbd">Esc</kbd>
                    </li>
                  </ul>
                </div>
              </section>
            </div>

            <!-- Platform note -->
            <div class="mt-6 pt-4 border-t border-bg-tertiary">
              <p class="text-xs text-text-secondary text-center">
                {{ isMac ? 'macOS' : 'Windows/Linux' }} — модификаторы:
                <span class="text-text-primary">{{ cmdKey }}</span>,
                <span class="text-text-primary">{{ altKey }}</span>,
                <span class="text-text-primary">{{ shiftKey }}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.kbd {
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  background-color: var(--color-bg-tertiary);
  color: var(--color-text-primary);
  font-size: 0.75rem;
  font-family: ui-monospace, monospace;
  white-space: nowrap;
}

/* Modal animations */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 200ms ease-out;
}

.modal-enter-active .help-modal,
.modal-leave-active .help-modal {
  transition: transform 200ms ease-out, opacity 200ms ease-out;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .help-modal,
.modal-leave-to .help-modal {
  transform: scale(0.95);
  opacity: 0;
}
</style>
