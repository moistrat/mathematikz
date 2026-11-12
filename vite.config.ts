import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: './',
  plugins: [react()],
  // The course content and generators ship in the main bundle on purpose (Practice, Learn and Games all share them); revisit if it passes 1 MB.
  build: { chunkSizeWarningLimit: 1000 },
  test: { environment: 'node' },
})
