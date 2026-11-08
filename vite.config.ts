import path from "path"
import { readFileSync } from "fs"
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

const pkg = JSON.parse(readFileSync(path.resolve(__dirname, './package.json'), 'utf-8')) as { version: string }

// https://vite.dev/config/
// ネイティブ（Capacitor iOS/Android）専用構成。相対パス base で配信する。
// 旧 Web 版（GitHub Pages / PWA）は廃止したため base: '/GohanLog/' と vite-plugin-pwa は撤去済み。
export default defineConfig({
  base: './',
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
  },
})
