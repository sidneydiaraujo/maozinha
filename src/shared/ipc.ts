// Contrato entre o processo principal (main) e a tela (renderer).
// Todo canal novo nasce aqui: nome, entrada e saida. O preload so repassa,
// e o main valida a entrada com zod (src/main/ipc.ts).
// Regra: este arquivo nao importa nada (nem electron, nem node).

export const IPC = {
  appInfo: 'app:info',
} as const

export interface AppInfo {
  version: string
  electron: string
  platform: string
}

/** O que a tela enxerga em `window.lousa`. */
export interface LousaApi {
  appInfo(): Promise<AppInfo>
}
