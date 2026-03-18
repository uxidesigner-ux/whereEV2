import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/safemap-api': {
        target: 'https://www.safemap.go.kr',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/safemap-api/, '/openapi2'),
      },
    },
  },
})
