<script setup>
import { colors, getColorById } from '@/utils/colors.js'

const props = defineProps({
  modelValue: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['update:modelValue'])

function selectColor(colorId) {
  emit('update:modelValue', colorId)
}

function getBackgroundStyle(color) {
  if (color.background.startsWith('linear-gradient')) {
    return { background: color.background }
  }
  return { backgroundColor: color.background }
}
</script>

<template>
  <div class="color-palette">
    <div class="grid grid-cols-8 gap-2">
      <button
        v-for="color in colors"
        :key="color.id"
        type="button"
        class="w-8 h-8 rounded-lg transition-all duration-200 hover:scale-110"
        :class="[
          modelValue === color.id
            ? 'ring-2 ring-white ring-offset-2 ring-offset-bg-primary'
            : 'hover:ring-1 hover:ring-white/50'
        ]"
        :style="getBackgroundStyle(color)"
        :title="color.name"
        @click="selectColor(color.id)"
      />
    </div>
  </div>
</template>
