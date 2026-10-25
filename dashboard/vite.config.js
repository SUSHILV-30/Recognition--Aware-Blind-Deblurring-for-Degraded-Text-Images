import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Relative base so the build works from any folder, including GitHub Pages.
export default defineConfig({
  plugins: [react()],
  base: './',
})
