// Regras de seguranca da janela. Arquivo puro (sem electron) para ser testavel.

/** webPreferences obrigatorias de toda janela. Nunca afrouxe sem decisao registrada. */
export const secureWebPreferences = {
  contextIsolation: true,
  sandbox: true,
  nodeIntegration: false,
  nodeIntegrationInWorker: false,
  webSecurity: true,
  allowRunningInsecureContent: false,
  webviewTag: false,
  spellcheck: false,
} as const

/**
 * A tela so pode navegar (e so pode chamar o IPC) a partir do proprio app:
 * o servidor de desenvolvimento do Vite ou os arquivos locais do build.
 */
export function isTrustedUrl(url: string, devServerUrl: string | undefined): boolean {
  if (devServerUrl && url.startsWith(devServerUrl)) return true
  return url.startsWith('file://')
}
