// Compactar a conversa de um agente (T18.1, D24). A tela so manda o id do quadro; o texto que vai
// para o terminal e fixo e quem decide se pode e o main, pelo ultimo estado do OSC 7501 e pelo
// sinal de pronto (D48), e so com o claude.exe rodando (sem ele, o texto cairia no PowerShell).
import { podeDigitar } from '../../shared/compactar'
import type { AvisoAgente, Quadro } from '../../shared/model'

/** Pausa entre o comando e o Enter: texto+Enter juntos o Claude trata como colagem (D21). */
export const PAUSA_ENTER_MS = 150

export interface DepsCompactar {
  quadro(quadroId: string): Quadro
  /** O terminal do quadro (id = quadroId) esta rodando? */
  aberto(terminalId: string): boolean
  aviso(terminalId: string): AvisoAgente | null
  /** O Claude ja desenhou a linha de status neste terminal (D48). */
  pronto(terminalId: string): boolean
  /** O claude.exe ainda roda no terminal? Ele nao avisa quando sai (D39). */
  temClaude(terminalId: string): Promise<boolean>
  escrever(terminalId: string, dados: string): void
  esperar(ms: number): Promise<void>
}

/** Manda `/compact` e Enter. Lanca com a frase para a tela se nao puder. */
export async function compactar(deps: DepsCompactar, quadroId: string): Promise<void> {
  const quadro = deps.quadro(quadroId)
  if (quadro.tipo !== 'agente') throw new Error('Só um agente compacta a conversa')
  if (!deps.aberto(quadro.id)) throw new Error('O terminal do agente não está aberto')
  if (!podeDigitar(deps.aviso(quadro.id)?.estado, deps.pronto(quadro.id))) throw new Error('Espere o agente parar')
  if (!(await deps.temClaude(quadro.id))) throw new Error('O Claude não está rodando neste quadro')
  deps.escrever(quadro.id, '/compact')
  await deps.esperar(PAUSA_ENTER_MS)
  deps.escrever(quadro.id, '\r')
}
