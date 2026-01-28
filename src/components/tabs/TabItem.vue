<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  tab: {
    type: Object,
    required: true
  },
  isActive: {
    type: Boolean,
    default: false
  },
  canDelete: {
    type: Boolean,
    default: true
  },
  draggable: {
    type: Boolean,
    default: false
  },
  autoEdit: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['select', 'delete', 'update', 'dragstart', 'dragend', 'dragover', 'drop'])

const isEditing = ref(false)
const editName = ref('')
const inputRef = ref(null)

// Auto-start editing when autoEdit prop becomes true
watch(() => props.autoEdit, (newVal) => {
  if (newVal) {
    startEdit()
  }
}, { immediate: true })

function startEdit() {
  editName.value = props.tab.name
  isEditing.value = true
  setTimeout(() => {
    inputRef.value?.focus()
    inputRef.value?.select()
  }, 0)
}

function saveEdit() {
  const newName = editName.value.trim()
  if (newName && newName !== props.tab.name) {
    emit('update', { id: props.tab.id, name: newName })
  }
  isEditing.value = false
}

function cancelEdit() {
  isEditing.value = false
}

function handleKeydown(e) {
  if (e.key === 'Enter') {
    saveEdit()
  } else if (e.key === 'Escape') {
    cancelEdit()
  }
}

function handleDragStart(e) {
  if (!props.draggable) return
  e.dataTransfer.effectAllowed = 'move'
  e.dataTransfer.setData('text/plain', props.tab.id)
  emit('dragstart', props.tab)
}

function handleDragEnd() {
  emit('dragend')
}

function handleDragOver(e) {
  if (!props.draggable) return
  e.preventDefault()
  e.dataTransfer.dropEffect = 'move'
  emit('dragover', props.tab)
}

function handleDrop(e) {
  if (!props.draggable) return
  e.preventDefault()
  const draggedId = e.dataTransfer.getData('text/plain')
  if (draggedId !== props.tab.id) {
    emit('drop', { draggedId, targetId: props.tab.id })
  }
}
</script>

<template>
  <div
    class="tab-item relative group flex items-center gap-1 px-4 py-1.5 rounded-full
           transition-all duration-200 cursor-pointer select-none"
    :class="[
      isActive
        ? 'bg-bg-tertiary text-neon-cyan'
        : 'bg-bg-secondary text-text-secondary hover:text-text-primary hover:bg-bg-tertiary/50'
    ]"
    :draggable="draggable"
    @click="!isEditing && emit('select', tab.id)"
    @dblclick="draggable && startEdit()"
    @dragstart="handleDragStart"
    @dragend="handleDragEnd"
    @dragover="handleDragOver"
    @drop="handleDrop"
  >
    <!-- Tab name / Edit input -->
    <template v-if="isEditing">
      <input
        ref="inputRef"
        v-model="editName"
        type="text"
        maxlength="50"
        class="w-24 px-1 py-0.5 bg-bg-primary border border-neon-cyan/50 rounded
               text-sm text-text-primary outline-none focus:border-neon-cyan"
        @blur="saveEdit"
        @keydown="handleKeydown"
        @click.stop
      />
    </template>
    <template v-else>
      <span class="text-sm font-medium truncate max-w-32">{{ tab.name }}</span>
    </template>

    <!-- Delete button (visible on hover in edit mode) -->
    <button
      v-if="canDelete && draggable && !isEditing"
      class="tab-delete-btn absolute -top-1 -right-1 w-4 h-4 rounded-full
             bg-deep-rose text-white text-xs flex items-center justify-center
             opacity-0 group-hover:opacity-100 transition-opacity
             hover:bg-neon-magenta"
      @click.stop="emit('delete', tab.id)"
    >
      ×
    </button>

  </div>
</template>

<style scoped>
.tab-item:active {
  transform: scale(0.98);
}

.tab-delete-btn:hover {
  transform: scale(1.1);
}
</style>
