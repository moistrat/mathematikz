import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: './',
  plugins: [react()],
  // The lesson text and the question generators are big, so they get their own files (the browser fetches them in parallel and
  // caches them separately). Learn, Practice and Games all use them, so they still load on the first visit.
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('/src/learn/content/')) return 'lessons'
          if (/\/src\/math\/(calc|cx|seq|trig|power|function|equation|algebra)[A-Za-z]*Questions|\/src\/math\/questions/.test(id)) return 'generators'
        },
      },
    },
  },
  test: { environment: 'node' },
})
