import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Relative paths so the built site works from any folder, e.g. bhavyaanil07.github.io/osmic-portal/
  base: './',
})
