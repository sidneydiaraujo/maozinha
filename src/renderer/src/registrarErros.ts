// Erro nao tratado na tela vai para o arquivo de registros do main (T8.6).
// No maximo 50 por sessao: um erro em laco nao enche o arquivo.
const MAXIMO = 50
let enviados = 0

function registrar(mensagem: string): void {
  if (enviados >= MAXIMO) return
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
