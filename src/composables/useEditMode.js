import { ref, readonly } from 'vue'

// Global state (singleton)
const isEditMode = ref(false)

/**
 * Composable for managing edit mode state globally
 */
export function useEditMode() {
  function enable() {
    isEditMode.value = true
  }

  function disable() {
    isEditMode.value = false
  }

  function toggle() {
    isEditMode.value = !isEditMode.value
  }

  return {
    isEditMode: readonly(isEditMode),
    enable,
    disable,
    toggle
  }
}
