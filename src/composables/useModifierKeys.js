import { ref, onMounted, onUnmounted } from 'vue'

// Global state - shared across all components
const altKey = ref(false)
const shiftKey = ref(false)
const ctrlKey = ref(false)
const metaKey = ref(false)

let initialized = false
let listenerCount = 0

function updateKeys(event) {
  altKey.value = event.altKey
  shiftKey.value = event.shiftKey
  ctrlKey.value = event.ctrlKey
  metaKey.value = event.metaKey
}

function resetKeys() {
  altKey.value = false
  shiftKey.value = false
  ctrlKey.value = false
  metaKey.value = false
}

function setupListeners() {
  if (initialized) return

  window.addEventListener('keydown', updateKeys)
  window.addEventListener('keyup', updateKeys)
  window.addEventListener('blur', resetKeys)

  initialized = true
}

function cleanupListeners() {
  if (!initialized) return

  window.removeEventListener('keydown', updateKeys)
  window.removeEventListener('keyup', updateKeys)
  window.removeEventListener('blur', resetKeys)

  initialized = false
  resetKeys()
}

export function useModifierKeys() {
  onMounted(() => {
    listenerCount++
    setupListeners()
  })

  onUnmounted(() => {
    listenerCount--
    if (listenerCount <= 0) {
      cleanupListeners()
      listenerCount = 0
    }
  })

  return {
    altKey,
    shiftKey,
    ctrlKey,
    metaKey
  }
}
