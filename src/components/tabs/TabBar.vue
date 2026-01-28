<script setup>
import { ref } from 'vue'
import TabItem from './TabItem.vue'
import TabCreateButton from './TabCreateButton.vue'

const props = defineProps({
  tabs: {
    type: Array,
    required: true
  },
  activeTabId: {
    type: String,
    default: null
  },
  canAddTab: {
    type: Boolean,
    default: true
  },
  canDeleteTab: {
    type: Boolean,
    default: true
  },
  editMode: {
    type: Boolean,
    default: false
  },
  newTabId: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['select', 'create', 'update', 'delete', 'reorder', 'edit-complete'])

const draggedTab = ref(null)
const dragOverTab = ref(null)

function handleSelect(tabId) {
  emit('select', tabId)
}

function handleCreate() {
  emit('create')
}

function handleUpdate(data) {
  emit('update', data)
  emit('edit-complete')
}

function handleDelete(tabId) {
  emit('delete', tabId)
}

function handleDragStart(tab) {
  draggedTab.value = tab
}

function handleDragEnd() {
  draggedTab.value = null
  dragOverTab.value = null
}

function handleDragOver(tab) {
  dragOverTab.value = tab
}

function handleDrop({ draggedId, targetId }) {
  const fromIndex = props.tabs.findIndex(t => t.id === draggedId)
  const toIndex = props.tabs.findIndex(t => t.id === targetId)

  if (fromIndex !== -1 && toIndex !== -1 && fromIndex !== toIndex) {
    emit('reorder', { fromIndex, toIndex })
  }

  draggedTab.value = null
  dragOverTab.value = null
}
</script>

<template>
  <div class="tab-bar flex items-end gap-1">
    <!-- Tab items -->
    <TabItem
      v-for="tab in tabs"
      :key="tab.id"
      :tab="tab"
      :is-active="tab.id === activeTabId"
      :can-delete="canDeleteTab"
      :draggable="editMode"
      :auto-edit="tab.id === newTabId"
      :class="{
        'opacity-50': draggedTab && draggedTab.id === tab.id,
        'ring-2 ring-neon-cyan/50': dragOverTab && dragOverTab.id === tab.id && draggedTab && draggedTab.id !== tab.id
      }"
      @select="handleSelect"
      @update="handleUpdate"
      @delete="handleDelete"
      @dragstart="handleDragStart"
      @dragend="handleDragEnd"
      @dragover="handleDragOver"
      @drop="handleDrop"
    />

    <!-- Create button (only in edit mode) -->
    <TabCreateButton
      v-if="editMode"
      :disabled="!canAddTab"
      @create="handleCreate"
    />

    <!-- Tab count indicator -->
    <div
      v-if="editMode"
      class="ml-2 text-xs text-text-secondary"
    >
      {{ tabs.length }}/8
    </div>
  </div>
</template>
