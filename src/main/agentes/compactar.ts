// Compactar a conversa de um agente (T18.1, D24). A tela so manda o id do quadro; o texto que vai
// para o terminal e fixo e quem decide se pode e o main, pelo ultimo estado do OSC 7501.
import { podeCompactar } from '../../shared/compactar'
import type { AvisoAgente, Quadro } from '../../shared/model'

/** Pausa entre o comando e o Enter: texto+Enter juntos o Claude trata como colagem (D21). */
export const PAUSA_ENTER_MS = 150

export interface DepsCompactar {
  quadro(quadroId: string): Quadro
  /** O terminal do quadro (id = quadroId) esta rodando? */
  aberto(terminalId: string): boolean
  aviso(terminalId: string): AvisoAgente | null
  escrever(terminalId: string, dados: string): void
  esperar(ms: number): Promise<void>
}

/** Manda `/compact` e Enter. Lanca com a frase para a tela se nao puder. */
export async function compactar(deps: DepsCompactar, quadroId: string): Promise<void> {
  const quadro = deps.quadro(quadroId)
  if (quadro.tipo !== 'agente') throw new Error('Só um agente compacta a conversa')
  if (!deps.aberto(quadro.id)) throw new Error('O terminal do agente não está aberto')
  if (!podeCompactar(deps.aviso(quadro.id)?.estado)) throw new Error('Espere o agente parar')
  deps.escrever(quadro.id, '/compact')
  await deps.esperar(PAUSA_ENTER_MS)
  deps.escrever(quadro.id, '\r')
}
