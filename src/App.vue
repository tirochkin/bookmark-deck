<script setup>
// Bookmark Deck - Visual Bookmark Manager
</script>

<template>
  <div class="min-h-screen bg-bg-primary text-text-primary">
    <!-- Header placeholder -->
    <header class="p-4 bg-bg-secondary border-b border-bg-tertiary">
      <h1 class="text-xl font-semibold text-neon-cyan">Bookmark Deck</h1>
    </header>

    <!-- Main content area -->
    <main class="p-6">
      <!-- Tabs placeholder -->
      <div class="mb-4 text-text-secondary text-sm">
        Tabs will be here
      </div>

      <!-- Grid placeholder -->
      <div class="grid grid-cols-8 gap-2">
        <template v-for="i in 32" :key="i">
          <div
            class="aspect-square rounded-lg border border-dashed border-bg-tertiary
                   hover:border-neon-cyan/50 transition-colors cursor-pointer
                   flex items-center justify-center text-text-secondary text-xs"
          >
            {{ i }}
          </div>
        </template>
      </div>
    </main>

    <!-- Footer placeholder (buffer/trash - only in edit mode) -->
    <footer class="fixed bottom-0 left-0 right-0 p-4 bg-bg-secondary border-t border-bg-tertiary">
      <div class="text-text-secondary text-sm">
        Buffer and Trash (edit mode only)
      </div>
    </footer>
  </div>
</template>
