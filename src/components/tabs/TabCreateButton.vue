<script setup>
defineProps({
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['create'])
</script>

<template>
  <button
    class="tab-create-btn flex items-center justify-center w-8 h-8 rounded-lg
           transition-all duration-200"
    :class="[
      disabled
        ? 'bg-bg-secondary/50 text-text-secondary/50 cursor-not-allowed'
        : 'bg-bg-secondary text-text-secondary hover:text-neon-cyan hover:bg-bg-tertiary cursor-pointer'
    ]"
    :disabled="disabled"
    :title="disabled ? 'Максимум 8 вкладок' : 'Добавить вкладку'"
    @click="!disabled && emit('create')"
  >
    <svg
      class="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M12 4v16m8-8H4"
      />
    </svg>
  </button>
</template>

<style scoped>
.tab-create-btn:not(:disabled):hover {
  box-shadow: 0 0 10px rgba(0, 245, 255, 0.3);
}

.tab-create-btn:not(:disabled):active {
  transform: scale(0.95);
}
</style>
