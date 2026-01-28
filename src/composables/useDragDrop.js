import { ref, readonly } from 'vue'

// Singleton state for drag and drop
const isDragging = ref(false)
const draggedBlock = ref(null)
const draggedFromTabId = ref(null)
const draggedFromBuffer = ref(false)
const draggedFromTrash = ref(false)
const draggedTrashIndex = ref(null)
const dropTargetPosition = ref(null)
const dropTargetBlock = ref(null)

export function useDragDrop() {
  // Start dragging a block from grid
  function startDrag(block, tabId, event) {
    isDragging.value = true
    draggedBlock.value = block
    draggedFromTabId.value = tabId
    draggedFromBuffer.value = false

    // Set drag data for HTML5 API
    if (event?.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move'
      event.dataTransfer.setData('text/plain', block.id)
    }
  }

  // Start dragging a block from buffer
  function startDragFromBuffer(block, event) {
    isDragging.value = true
    draggedBlock.value = block
    draggedFromTabId.value = null
    draggedFromBuffer.value = true
    draggedFromTrash.value = false
    draggedTrashIndex.value = null

    // Set drag data for HTML5 API
    if (event?.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move'
      event.dataTransfer.setData('text/plain', block.id)
    }
  }

  // Start dragging a block from trash
  function startDragFromTrash(block, trashIndex, event) {
    isDragging.value = true
    draggedBlock.value = block
    draggedFromTabId.value = null
    draggedFromBuffer.value = false
    draggedFromTrash.value = true
    draggedTrashIndex.value = trashIndex

    // Set drag data for HTML5 API
    if (event?.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move'
      event.dataTransfer.setData('text/plain', block.id)
    }
  }

  // End dragging (cleanup)
  function endDrag() {
    isDragging.value = false
    draggedBlock.value = null
    draggedFromTabId.value = null
    draggedFromBuffer.value = false
    draggedFromTrash.value = false
    draggedTrashIndex.value = null
    dropTargetPosition.value = null
    dropTargetBlock.value = null
  }

  // Set drop target when hovering over a cell
  function setDropTarget(position, block = null) {
    dropTargetPosition.value = position
    dropTargetBlock.value = block
  }

  // Clear drop target
  function clearDropTarget() {
    dropTargetPosition.value = null
    dropTargetBlock.value = null
  }

  // Check if position is valid drop target
  function isValidDropTarget(position) {
    if (!isDragging.value || !draggedBlock.value) return false

    // If dragging from buffer or trash, any grid position is valid
    if (draggedFromBuffer.value || draggedFromTrash.value) return true

    // Can't drop on same position
    const samePosition =
      draggedBlock.value.position?.row === position.row &&
      draggedBlock.value.position?.col === position.col

    return !samePosition
  }

  // Check if dropping would cause a conflict (target has a block)
  function wouldCauseConflict() {
    return dropTargetBlock.value !== null
  }

  return {
    // Readonly state
    isDragging: readonly(isDragging),
    draggedBlock: readonly(draggedBlock),
    draggedFromTabId: readonly(draggedFromTabId),
    draggedFromBuffer: readonly(draggedFromBuffer),
    draggedFromTrash: readonly(draggedFromTrash),
    draggedTrashIndex: readonly(draggedTrashIndex),
    dropTargetPosition: readonly(dropTargetPosition),
    dropTargetBlock: readonly(dropTargetBlock),

    // Actions
    startDrag,
    startDragFromBuffer,
    startDragFromTrash,
    endDrag,
    setDropTarget,
    clearDropTarget,
    isValidDropTarget,
    wouldCauseConflict
  }
}
