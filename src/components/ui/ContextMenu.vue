<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'

const props = defineProps({
  x: {
    type: Number,
    required: true
  },
  y: {
    type: Number,
    required: true
  },
  options: {
    type: Array,
    required: true
    // Array of { id: string, label: string, icon?: string, danger?: boolean }
  }
})

const emit = defineEmits(['select', 'close'])

const menuRef = ref(null)
const adjustedX = ref(props.x)
const adjustedY = ref(props.y)

// Adjust position to keep menu within viewport
async function adjustPosition() {
  await nextTick()

  if (!menuRef.value) return

  const rect = menuRef.value.getBoundingClientRect()
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight
  const padding = 8

  // Adjust horizontal position
  if (rect.right > viewportWidth - padding) {
    adjustedX.value = viewportWidth - rect.width - padding
  }
  if (rect.left < padding) {
    adjustedX.value = padding
  }

  // Adjust vertical position
  if (rect.bottom > viewportHeight - padding) {
    adjustedY.value = viewportHeight - rect.height - padding
  }
  if (rect.top < padding) {
    adjustedY.value = padding
  }
}

function handleSelect(option) {
  emit('select', option.id)
}

function handleClickOutside(event) {
  if (menuRef.value && !menuRef.value.contains(event.target)) {
    emit('close')
  }
}

function handleKeydown(event) {
  if (event.key === 'Escape') {
    emit('close')
  }
}

onMounted(() => {
  adjustPosition()
  document.addEventListener('mousedown', handleClickOutside)
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('mousedown', handleClickOutside)
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <Teleport to="body">
    <div
      ref="menuRef"
      class="context-menu fixed z-50 min-w-40 py-1 bg-bg-secondary border border-bg-tertiary
             rounded-lg shadow-xl shadow-black/50 animate-in"
      :style="{ left: `${adjustedX}px`, top: `${adjustedY}px` }"
    >
      <button
        v-for="option in options"
        :key="option.id"
        class="w-full px-3 py-2 text-left text-sm flex items-center gap-2 transition-colors"
        :class="[
          option.danger
            ? 'text-red-400 hover:bg-red-500/20'
            : 'text-text-primary hover:bg-bg-tertiary'
        ]"
        @click="handleSelect(option)"
      >
        <!-- Swap icon -->
        <svg
          v-if="option.icon === 'swap'"
          class="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
          />
        </svg>

        <!-- Buffer icon -->
        <svg
          v-if="option.icon === 'buffer'"
          class="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>

        <!-- Delete icon -->
        <svg
          v-if="option.icon === 'delete'"
          class="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        </svg>

        <!-- Cancel icon -->
        <svg
          v-if="option.icon === 'cancel'"
          class="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>

        <span>{{ option.label }}</span>
      </button>
    </div>
  </Teleport>
</template>

<style scoped>
.animate-in {
  animation: context-menu-in 0.15s ease-out;
}

@keyframes context-menu-in {
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
