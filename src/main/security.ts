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

/** Onde a tela do app mora: o servidor do Vite (dev) ou o index.html do build. */
export interface PaginaDoApp {
  dev?: string | undefined
  /** URL file:// do index.html do build. */
  arquivo: string
}

function lerUrl(texto: string): URL | null {
  try {
    return new URL(texto)
  } catch {
    return null
  }
}

/** Caminho de um file:// sem host (o com host e pasta de rede), comparavel no Windows. */
function caminhoLocal(url: URL): string | null {
  if (url.protocol !== 'file:' || url.host !== '') return null
  try {
    return decodeURIComponent(url.pathname).replace(/\\/g, '/').toLowerCase()
  } catch {
    return null
  }
}

/**
 * A tela so pode navegar (e so pode chamar o IPC) a partir do proprio app: a mesma origem do
 * servidor do Vite ou exatamente o index.html do build (R2.7). Antes valia qualquer file://,
 * inclusive pasta de rede: um link solto na janela carregava outra pagina com o window.lousa.
 */
export function isTrustedUrl(url: string, pagina: PaginaDoApp): boolean {
  const alvo = lerUrl(url)
  if (!alvo) return false
  const dev = pagina.dev ? lerUrl(pagina.dev) : null
  if (dev) return alvo.origin === dev.origin
  const esperado = lerUrl(pagina.arquivo)
  const caminho = caminhoLocal(alvo)
  return caminho !== null && esperado !== null && caminho === caminhoLocal(esperado)
}
