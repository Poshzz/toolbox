import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// base './' + HashRouter => ใช้กับ GitHub Pages ได้ทุก subpath โดยไม่ต้องแก้ config
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
})
