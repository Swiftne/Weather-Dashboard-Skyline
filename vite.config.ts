import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    tailwindcss(),
  ],
  base: process.env.VITE_BASED_PATH || '/Weather-Dashboard-Skyline',
})
