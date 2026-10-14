// Contrato entre o processo principal (main) e a tela (renderer).
// Todo canal novo nasce aqui: nome, entrada e saida. O preload so repassa,
// e o main valida a entrada com zod (src/main/ipc.ts).
// Regra: este arquivo nao importa nada (nem electron, nem node), so tipos de ./model.

import type { PerfilComConta, StatusConta } from './model'

export const IPC = {
  appInfo: 'app:info',
  perfisListar: 'perfis:listar',
  perfisRenomear: 'perfis:renomear',
  perfisAtualizarConta: 'perfis:atualizarConta',
} as const

export interface AppInfo {
  version: string
  electron: string
  platform: string
}

/** O que a tela enxerga em `window.lousa`. */
export interface LousaApi {
  appInfo(): Promise<AppInfo>
  perfis: {
    listar(): Promise<PerfilComConta[]>
    renomear(perfilId: string, nome: string): Promise<PerfilComConta>
    atualizarConta(perfilId: string): Promise<StatusConta>
  }
}
