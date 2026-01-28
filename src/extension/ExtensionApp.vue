<script setup>
import { onMounted, ref, computed, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import BookmarkGrid from '@/components/grid/BookmarkGrid.vue'
import BufferArea from '@/components/buffer/BufferArea.vue'
import ClipboardPreview from '@/components/buffer/ClipboardPreview.vue'
import TabBar from '@/components/tabs/TabBar.vue'
import BlockEditModal from '@/components/modals/BlockEditModal.vue'
import ConfirmModal from '@/components/modals/ConfirmModal.vue'
import ImportExportModal from '@/components/modals/ImportExportModal.vue'
import HelpModal from '@/components/modals/HelpModal.vue'
import { useExtensionBookmarkStore } from '@/stores/extensionBookmarkStore.js'
import { useEditMode } from '@/composables/useEditMode.js'
import { useDragDrop } from '@/composables/useDragDrop.js'
import { useClipboard } from '@/composables/useClipboard.js'

const store = useExtensionBookmarkStore()
const { activeBlocks, activeTab, activeTabId, sortedTabs, canAddTab, canDeleteTab, buffer, trash, trashBlockCount, trashTabCount, tabs, isInitialized } = storeToRefs(store)
const { startDragFromBuffer, draggedFromBuffer, draggedFromTrash, draggedTrashIndex } = useDragDrop()
const { copy: clipboardCopy, cut: clipboardCut } = useClipboard()

const { isEditMode } = useEditMode()

// Loading state for async init
const isLoading = ref(true)

// Block edit modal state
const showBlockModal = ref(false)
const editingBlock = ref(null)
const editingPosition = ref(null)
const editingFromBuffer = ref(false)

// Confirm modal state
const showConfirmModal = ref(false)
const confirmModalConfig = ref({
  title: '',
  message: '',
  confirmText: 'Подтвердить',
  danger: false,
  onConfirm: () => {}
})

// Import/Export modal state
const showImportExportModal = ref(false)

// Help modal state
const showHelpModal = ref(false)

// New tab tracking for auto-edit
const newlyCreatedTabId = ref(null)

// Toast notification state
const toastMessage = ref('')
const showToast = ref(false)
let toastTimeout = null

function showToastNotification(message) {
  toastMessage.value = message
  showToast.value = true
  if (toastTimeout) clearTimeout(toastTimeout)
  toastTimeout = setTimeout(() => {
    showToast.value = false
  }, 2000)
}

// Current data for export
const currentData = computed(() => ({
  tabs: tabs.value,
  buffer: buffer.value,
  trash: trash.value
}))

// Extension-specific: Send message to parent window (content script)
function sendToParent(action, data = {}) {
  window.parent.postMessage({ action, data }, '*')
}

// Extension-specific: Close overlay
function closeOverlay() {
  sendToParent('close-overlay')
}

// Extension-specific: Open URL and close overlay
function openUrlAndClose(url) {
  sendToParent('open-url', { url })
}

// Extension-specific: Copy URL and close overlay
function copyUrlAndClose(url) {
  sendToParent('copy-url', { url })
}

// Listen for messages from parent
function handleParentMessage(event) {
  const { action } = event.data || {}
  if (action === 'overlay-shown') {
    // Overlay is now visible
  } else if (action === 'overlay-hidden') {
    // Overlay was hidden
  }
}

onMounted(async () => {
  window.addEventListener('message', handleParentMessage)

  // Async init for extension store
  await store.init()
  isLoading.value = false
})

onUnmounted(() => {
  window.removeEventListener('message', handleParentMessage)
})

function handleCellClick(position) {
  if (isEditMode.value) {
    editingBlock.value = null
    editingPosition.value = position
    editingFromBuffer.value = false
    showBlockModal.value = true
  }
}

function handleBlockClick(block) {
  if (!isEditMode.value) {
    // In normal mode, open URL and close overlay
    openUrlAndClose(block.url)
  } else {
    // In edit mode, open modal to edit block
    editingBlock.value = block
    editingPosition.value = block.position
    editingFromBuffer.value = false
    showBlockModal.value = true
  }
}

// Alt+Click - move block to buffer
function handleMoveToBuffer({ block, tabId }) {
  if (buffer.value.length >= 12) {
    return
  }
  store.moveToBuffer(tabId, block.id)
}

// Alt+Shift+Click - move block to trash
function handleMoveToTrash({ block, tabId }) {
  store.deleteBlock(tabId, block.id)
}

// URL copied to system clipboard - close overlay after copying
function handleUrlCopied({ block }) {
  showToastNotification(`Ссылка скопирована: ${block.title}`)
  // Close overlay after short delay to show toast
  setTimeout(() => {
    copyUrlAndClose(block.url)
  }, 500)
}

function handleBlockSave(data) {
  if (editingBlock.value) {
    if (editingFromBuffer.value) {
      store.updateBufferBlock(editingBlock.value.id, data)
    } else {
      store.updateBlock(activeTab.value.id, editingBlock.value.id, data)
    }
  } else {
    store.addBlock(activeTab.value.id, editingPosition.value, data)
  }
  showBlockModal.value = false
  editingBlock.value = null
  editingPosition.value = null
  editingFromBuffer.value = false
}

function handleBlockDelete() {
  if (!editingBlock.value) return

  confirmModalConfig.value = {
    title: 'Удалить закладку',
    message: `Вы уверены, что хотите удалить "${editingBlock.value.title}"?`,
    confirmText: 'Удалить',
    danger: true,
    onConfirm: () => {
      if (editingFromBuffer.value) {
        store.deleteFromBuffer(editingBlock.value.id)
      } else {
        store.deleteBlock(activeTab.value.id, editingBlock.value.id)
      }
      showBlockModal.value = false
      showConfirmModal.value = false
      editingBlock.value = null
      editingPosition.value = null
      editingFromBuffer.value = false
    }
  }
  showConfirmModal.value = true
}

function handleBlockModalCancel() {
  showBlockModal.value = false
  editingBlock.value = null
  editingPosition.value = null
  editingFromBuffer.value = false
}

function handleTabSelect(tabId) {
  store.setActiveTab(tabId)
}

function handleTabCreate() {
  const newTab = store.addTab()
  if (newTab) {
    newlyCreatedTabId.value = newTab.id
  }
}

function handleTabEditComplete() {
  newlyCreatedTabId.value = null
}

function handleTabUpdate({ id, name }) {
  store.updateTab(id, { name })
}

function handleTabDelete(tabId) {
  const tab = sortedTabs.value.find(t => t.id === tabId)
  if (!tab) return

  confirmModalConfig.value = {
    title: 'Удалить вкладку',
    message: `Вы уверены, что хотите удалить "${tab.name}"? Все закладки этой вкладки будут перемещены в корзину.`,
    confirmText: 'Удалить',
    danger: true,
    onConfirm: () => {
      store.deleteTab(tabId)
      showConfirmModal.value = false
    }
  }
  showConfirmModal.value = true
}

function handleTabReorder({ fromIndex, toIndex }) {
  store.reorderTabs(fromIndex, toIndex)
}

// Footer handlers
function handleBufferBlockDragStart(block) {
  startDragFromBuffer(block)
}

function handleBufferDrop(block) {
  if (activeTab.value) {
    store.moveToBuffer(activeTab.value.id, block.id)
  }
}

function handleBufferBlockClick(block) {
  editingBlock.value = block
  editingPosition.value = null
  editingFromBuffer.value = true
  showBlockModal.value = true
}

function handleBufferCopy({ block }) {
  clipboardCopy(block, null, true)
}

function handleBufferCut({ block }) {
  clipboardCut(block, null, true)
}

function handleBufferMoveToTrash({ block }) {
  store.deleteFromBuffer(block.id)
}

function handleBufferDropFromTrash({ trashIndex }) {
  store.restoreBlockToBuffer(trashIndex)
}

function handleTrashDrop(block) {
  if (draggedFromBuffer.value) {
    store.deleteFromBuffer(block.id)
  } else if (activeTab.value) {
    store.deleteBlock(activeTab.value.id, block.id)
  }
}

function handleTrashEmpty() {
  confirmModalConfig.value = {
    title: 'Очистить корзину',
    message: 'Вы уверены, что хотите безвозвратно удалить все элементы из корзины? Это действие нельзя отменить.',
    confirmText: 'Очистить',
    danger: true,
    onConfirm: () => {
      store.emptyTrash()
      showConfirmModal.value = false
    }
  }
  showConfirmModal.value = true
}

// Import/Export handlers
function handleOpenImportExport() {
  showImportExportModal.value = true
}

function handleImport(data) {
  store.importData(data)
}

// Reset handler
function handleResetAll() {
  confirmModalConfig.value = {
    title: 'Сбросить все данные',
    message: 'Вы уверены, что хотите сбросить все данные? Все ваши закладки, вкладки и настройки будут удалены. Это действие нельзя отменить.',
    confirmText: 'Сбросить всё',
    danger: true,
    onConfirm: () => {
      store.reset()
      showConfirmModal.value = false
    }
  }
  showConfirmModal.value = true
}

// Handle Escape key to close overlay
function handleKeydown(e) {
  if (e.key === 'Escape' && !showBlockModal.value && !showConfirmModal.value && !showImportExportModal.value && !showHelpModal.value) {
    closeOverlay()
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
  <div class="extension-overlay min-h-screen flex flex-col bg-bg-primary text-text-primary">
    <!-- Loading state -->
    <div v-if="isLoading" class="flex-1 flex items-center justify-center">
      <div class="text-text-secondary">Загрузка...</div>
    </div>

    <template v-else>
      <!-- Header -->
      <AppHeader
        :is-extension="true"
        @open-import-export="handleOpenImportExport"
        @reset-all="handleResetAll"
        @open-help="showHelpModal = true"
        @close="closeOverlay"
      />

      <!-- Main content area -->
      <main class="flex-1 flex items-start justify-center p-4 pb-16 pt-4 overflow-auto">
        <div class="flex items-start gap-6">
          <!-- Main panel (tabs + grid) -->
          <div>
            <!-- Tab Bar -->
            <div class="mb-3">
              <TabBar
                :tabs="sortedTabs"
                :active-tab-id="activeTabId"
                :can-add-tab="canAddTab"
                :can-delete-tab="canDeleteTab"
                :edit-mode="isEditMode"
                :new-tab-id="newlyCreatedTabId"
                @select="handleTabSelect"
                @create="handleTabCreate"
                @update="handleTabUpdate"
                @delete="handleTabDelete"
                @reorder="handleTabReorder"
                @edit-complete="handleTabEditComplete"
              />
            </div>

            <!-- Bookmark Grid -->
            <BookmarkGrid
              v-if="activeTab"
              :blocks="activeBlocks"
              :tab-id="activeTab.id"
              :edit-mode="isEditMode"
              @cell-click="handleCellClick"
              @block-click="handleBlockClick"
              @move-to-buffer="handleMoveToBuffer"
              @move-to-trash="handleMoveToTrash"
              @url-copied="handleUrlCopied"
            />
          </div>

          <!-- Right side panel (only in edit mode) -->
          <div v-if="isEditMode" class="flex flex-col gap-3">
            <!-- Buffer panel -->
            <BufferArea
              :blocks="buffer"
              @block-drag-start="handleBufferBlockDragStart"
              @drop="handleBufferDrop"
              @drop-from-trash="handleBufferDropFromTrash"
              @block-click="handleBufferBlockClick"
              @copy="handleBufferCopy"
              @cut="handleBufferCut"
              @move-to-trash="handleBufferMoveToTrash"
            />

            <!-- Clipboard preview -->
            <ClipboardPreview />
          </div>
        </div>
      </main>

      <!-- Footer (trash only - in edit mode) -->
      <AppFooter
        v-if="isEditMode"
        :trash-blocks="trash.blocks"
        :trash-tab-count="trashTabCount"
        @trash-drop="handleTrashDrop"
        @trash-empty="handleTrashEmpty"
      />

      <!-- Block Edit Modal -->
      <BlockEditModal
        :show="showBlockModal"
        :block="editingBlock"
        :position="editingPosition"
        @save="handleBlockSave"
        @delete="handleBlockDelete"
        @cancel="handleBlockModalCancel"
      />

      <!-- Confirm Modal -->
      <ConfirmModal
        :show="showConfirmModal"
        :title="confirmModalConfig.title"
        :message="confirmModalConfig.message"
        :confirm-text="confirmModalConfig.confirmText"
        :danger="confirmModalConfig.danger"
        @confirm="confirmModalConfig.onConfirm"
        @cancel="showConfirmModal = false"
      />

      <!-- Import/Export Modal -->
      <ImportExportModal
        :show="showImportExportModal"
        :current-data="currentData"
        @close="showImportExportModal = false"
        @import="handleImport"
      />

      <!-- Help Modal -->
      <HelpModal
        :show="showHelpModal"
        @close="showHelpModal = false"
      />

      <!-- Toast notification -->
      <Transition name="toast">
        <div
          v-if="showToast"
          class="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg
                 bg-bg-secondary ring-1 ring-neon-cyan/50 shadow-lg shadow-neon-cyan/20
                 text-sm text-text-primary"
        >
          {{ toastMessage }}
        </div>
      </Transition>
    </template>
  </div>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: opacity 200ms ease-out, transform 200ms ease-out;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translate(-50%, 20px);
}
</style>
