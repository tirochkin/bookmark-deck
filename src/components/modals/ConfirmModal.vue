<script setup>
import { onMounted, onUnmounted } from 'vue'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: 'Подтверждение'
  },
  message: {
    type: String,
    default: 'Вы уверены?'
  },
  confirmText: {
    type: String,
    default: 'Подтвердить'
  },
  cancelText: {
    type: String,
    default: 'Отмена'
  },
  danger: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['confirm', 'cancel'])

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
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
        @click="handleOverlayClick"
      >
        <div
          class="bg-bg-secondary rounded-xl shadow-2xl w-full max-w-sm
                 border border-bg-tertiary overflow-hidden"
        >
          <!-- Header -->
          <div class="px-6 py-4 border-b border-bg-tertiary">
            <h2 class="text-lg font-semibold text-text-primary">{{ title }}</h2>
          </div>

          <!-- Content -->
          <div class="px-6 py-4">
            <p class="text-text-secondary">{{ message }}</p>
          </div>

          <!-- Actions -->
          <div class="flex justify-end gap-3 px-6 py-4 bg-bg-tertiary/30">
            <button
              type="button"
              class="px-4 py-2 rounded-lg bg-bg-tertiary text-text-secondary
                     hover:text-text-primary transition-colors"
              @click="emit('cancel')"
            >
              {{ cancelText }}
            </button>
            <button
              type="button"
              class="px-4 py-2 rounded-lg font-medium transition-colors"
              :class="[
                danger
                  ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                  : 'bg-neon-cyan/20 text-neon-cyan hover:bg-neon-cyan/30'
              ]"
              @click="emit('confirm')"
            >
              {{ confirmText }}
            </button>
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
