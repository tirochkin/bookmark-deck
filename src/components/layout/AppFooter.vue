<script setup>
import TrashBin from '@/components/buffer/TrashBin.vue'

defineProps({
  trashBlocks: {
    type: Array,
    default: () => []
  },
  trashTabCount: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits([
  'trash-drop',
  'trash-empty'
])

function handleTrashDrop(block) {
  emit('trash-drop', block)
}

function handleTrashEmpty() {
  emit('trash-empty')
}
</script>

<template>
  <footer
    class="fixed bottom-0 left-0 right-0 p-4 bg-bg-secondary/95 backdrop-blur-sm
           border-t border-neon-magenta/30 z-40"
  >
    <div class="flex items-center justify-center gap-6">
      <!-- Trash Bin -->
      <TrashBin
        :blocks="trashBlocks"
        :tab-count="trashTabCount"
        @drop="handleTrashDrop"
        @empty="handleTrashEmpty"
      />
    </div>
  </footer>
</template>
