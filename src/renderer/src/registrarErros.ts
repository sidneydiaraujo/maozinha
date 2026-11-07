// Erro nao tratado na tela vai para o arquivo de registros do main (T8.6).
// No maximo 50 por sessao: um erro em laco nao enche o arquivo.
const MAXIMO = 50
let enviados = 0

/**
 * R3.15: avisos do navegador que nao sao erro. O do ResizeObserver aparece quando um quadro muda de
 * tamanho no meio do desenho (inofensivo): 324 linhas ERROR em duas semanas, gastando a cota acima.
 */
export function avisoInofensivo(mensagem: string): boolean {
  return /ResizeObserver loop (completed with undelivered notifications|limit exceeded)/.test(mensagem)
}

function registrar(mensagem: string): void {
  if (enviados >= MAXIMO || avisoInofensivo(mensagem)) return
  enviados++
  window.lousa.app.erroDaTela(mensagem.slice(0, 4000)).catch(() => undefined)
}

export function registrarErrosDaTela(): void {
  window.addEventListener('error', (e) => registrar(`${e.message} (${e.filename}:${e.lineno})`))
  window.addEventListener('unhandledrejection', (e) => {
    const motivo: unknown = e.reason
    registrar(`promessa rejeitada: ${motivo instanceof Error ? (motivo.stack ?? motivo.message) : String(motivo)}`)
  })
}
