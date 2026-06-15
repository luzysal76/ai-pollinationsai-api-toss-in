import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: '/ai-pollinationsai-api-toss-in/',
  plugins: [
    react(),
    tailwindcss(),
  ],
})
