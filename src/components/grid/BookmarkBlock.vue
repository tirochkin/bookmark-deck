<script setup>
import { computed } from 'vue'
import { getColorById, getDefaultColorId } from '@/utils/colors.js'

const props = defineProps({
  block: {
    type: Object,
    required: true
  },
  editMode: {
    type: Boolean,
    default: false
  }
})

const colorConfig = computed(() => {
  return getColorById(props.block.color) || getColorById(getDefaultColorId())
})

const backgroundStyle = computed(() => {
  const bg = colorConfig.value.background
  if (bg.startsWith('linear-gradient')) {
    return { background: bg }
  }
  return { backgroundColor: bg }
})

const glowStyle = computed(() => {
  return `0 0 20px ${colorConfig.value.glow}40, 0 0 40px ${colorConfig.value.glow}20`
})

const alignmentClass = computed(() => {
  switch (props.block.textAlign) {
    case 'top':
      return 'items-start pt-2'
    case 'bottom':
      return 'items-end pb-2'
    default:
      return 'items-center'
  }
})
</script>

<template>
  <div
    class="bookmark-block group relative w-full h-full rounded-lg flex justify-center px-2
           cursor-pointer select-none overflow-hidden"
    :class="[
      alignmentClass,
      editMode ? 'ring-2 ring-transparent hover:ring-neon-magenta/50' : ''
    ]"
    :style="backgroundStyle"
    role="button"
    :tabindex="0"
    :aria-label="editMode ? `Редактировать: ${block.title}` : `Открыть: ${block.title}`"
    :title="block.title"
  >
    <span class="text-sm font-medium text-white text-center leading-tight break-words line-clamp-3">
      {{ block.title }}
    </span>

    <!-- Edit mode overlay -->
    <div
      v-if="editMode"
      class="absolute inset-0 bg-black/0 group-hover:bg-black/40
             flex items-center justify-center opacity-0 group-hover:opacity-100
             transition-opacity duration-150"
      aria-hidden="true"
    >
      <svg
        class="w-6 h-6 text-white drop-shadow-lg"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
        />
      </svg>
    </div>
  </div>
</template>

<style scoped>
.bookmark-block {
  --glow-color: v-bind('colorConfig.glow');
  /* GPU acceleration for smooth 60fps animations */
  transform: translateZ(0) scale(1);
  transition: transform 150ms ease-out, box-shadow 150ms ease-out;
  will-change: transform, box-shadow;
}

.bookmark-block:hover {
  box-shadow: v-bind('glowStyle');
  transform: translateZ(0) scale(1.02);
}

.bookmark-block:focus-visible {
  outline: none;
  box-shadow: v-bind('glowStyle'), 0 0 0 2px var(--color-neon-cyan);
}

.bookmark-block:active {
  transform: translateZ(0) scale(0.98);
}
</style>
