<script setup>
const props = defineProps({
  modelValue: {
    type: String,
    default: 'center'
  }
})

const emit = defineEmits(['update:modelValue'])

const alignments = [
  { id: 'top', label: 'Top', icon: 'align-top' },
  { id: 'center', label: 'Center', icon: 'align-center' },
  { id: 'bottom', label: 'Bottom', icon: 'align-bottom' }
]

function select(alignId) {
  emit('update:modelValue', alignId)
}
</script>

<template>
  <div class="alignment-picker flex gap-2">
    <button
      v-for="align in alignments"
      :key="align.id"
      type="button"
      class="flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all duration-200"
      :class="[
        modelValue === align.id
          ? 'bg-neon-cyan/20 text-neon-cyan ring-1 ring-neon-cyan/50'
          : 'bg-bg-tertiary text-text-secondary hover:text-text-primary hover:bg-bg-tertiary/80'
      ]"
      :title="align.label"
      @click="select(align.id)"
    >
      <!-- Alignment icons -->
      <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <!-- Container -->
        <rect x="4" y="4" width="16" height="16" rx="2" stroke-width="1.5" />
        <!-- Lines representing text alignment -->
        <template v-if="align.id === 'top'">
          <line x1="7" y1="8" x2="17" y2="8" stroke-width="2" stroke-linecap="round" />
          <line x1="7" y1="12" x2="14" y2="12" stroke-width="1.5" stroke-linecap="round" opacity="0.5" />
        </template>
        <template v-else-if="align.id === 'center'">
          <line x1="7" y1="10" x2="17" y2="10" stroke-width="2" stroke-linecap="round" />
          <line x1="7" y1="14" x2="14" y2="14" stroke-width="1.5" stroke-linecap="round" opacity="0.5" />
        </template>
        <template v-else-if="align.id === 'bottom'">
          <line x1="7" y1="12" x2="14" y2="12" stroke-width="1.5" stroke-linecap="round" opacity="0.5" />
          <line x1="7" y1="16" x2="17" y2="16" stroke-width="2" stroke-linecap="round" />
        </template>
      </svg>
      <span class="text-xs">{{ align.label }}</span>
    </button>
  </div>
</template>
