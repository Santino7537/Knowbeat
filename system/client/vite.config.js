import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  envDir: fileURLToPath(new URL('..', import.meta.url)),
  plugins: [react()],
})
