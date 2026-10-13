/// <reference types="vite/client" />
import type { LousaApi } from '../../shared/ipc'

declare global {
  interface Window {
    lousa: LousaApi
  }
}

export {}
