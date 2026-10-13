import react from '@vitejs/plugin-react'
import { defineConfig } from 'electron-vite'
import type { Plugin } from 'vite'

// CSP so no build: no modo dev o Vite precisa de script inline (React Refresh)
// e de WebSocket para recarregar a tela.
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'none'",
].join('; ')

const cspNoBuild: Plugin = {
  name: 'lousa-csp',
  apply: 'build',
  transformIndexHtml: () => [
    {
      tag: 'meta',
      attrs: { 'http-equiv': 'Content-Security-Policy', content: CSP },
      injectTo: 'head-prepend',
    },
  ],
}

export default defineConfig({
  main: {},
  preload: {},
  renderer: {
    plugins: [react(), cspNoBuild],
  },
})
