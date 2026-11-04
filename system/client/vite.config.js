import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    allowedHosts: ['.trycloudflare.com'],
    proxy: {
      '/api': {
        target: process.env.API_PROXY_TARGET || 'http://127.0.0.1:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api(?=\/|$)/, '') || '/',
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => proxyReq.removeHeader('origin'));
        },
      },
      '/socket.io': {
        target: process.env.API_PROXY_TARGET || 'http://127.0.0.1:3000',
        changeOrigin: true,
        ws: true,
        configure: (proxy) => {
          const removeOrigin = (proxyReq) => proxyReq.removeHeader('origin');
          proxy.on('proxyReq', removeOrigin);
          proxy.on('proxyReqWs', removeOrigin);
        },
      },
      '/profiles': {
        target: process.env.MINIO_PROXY_TARGET || 'http://127.0.0.1:9000',
      },
      '/courses': {
        target: process.env.MINIO_PROXY_TARGET || 'http://127.0.0.1:9000',
      },
      '/posts': {
        target: process.env.MINIO_PROXY_TARGET || 'http://127.0.0.1:9000',
      },
      '/chat-files': {
        target: process.env.MINIO_PROXY_TARGET || 'http://127.0.0.1:9000',
      },
      '/user-files': {
        target: process.env.MINIO_PROXY_TARGET || 'http://127.0.0.1:9000',
      },
    },
  },
})
