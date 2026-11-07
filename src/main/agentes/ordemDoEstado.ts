// Quem recebe cada estado novo do agente (OSC 7501), e em que ordem (R4.19). A ordem e regra, nao
// detalhe da fiacao; cada ouvinte e chamado na hora (a parte sincrona dele roda antes do proximo).
import type { AvisoAgente } from '../../shared/model'

/**
 * 1. `tela`: o selo do quadro muda primeiro.
 * 2. `notificacao`: o aviso do Windows (terminou, esperando voce).
 * 3. `trocaDeModelo`: troca pedida com o agente trabalhando reabre quando ele para (D49); vem antes
 *    do compactar e da fila, que perguntam se ha troca pendente (ocupado/segurar).
 * 4. `repasse`: o fim da vez passa adiante no time (T30.1). Antes do compactar: o /compact digitado
 *    agora marca a vez seguinte como da Lousa, nao esta.
 * 5. `esperaDeColegas`: o colega acabou a tarefa e quem pediu segue (A21).
 * 6. `compactarSozinho`: digita /compact ao fim da tarefa (A17). Antes da fila, que espera o /compact
 *    terminar (segurando).
 * 7. `filaDoTime`: a apresentacao e as mensagens do time saem com o agente parado (T29.1).
 */
export const ORDEM_DO_ESTADO = [
  'tela',
  'notificacao',
  'trocaDeModelo',
  'repasse',
  'esperaDeColegas',
  'compactarSozinho',
  'filaDoTime',
] as const

export type OuvinteDoEstado = (typeof ORDEM_DO_ESTADO)[number]

export type AoEstado = (terminalId: string, aviso: AvisoAgente) => void | Promise<unknown>

/** Junta os ouvintes numa funcao so; quem lanca (ou rejeita depois) vira aviso e nao para os outros. */
export function distribuirEstado(
  ouvintes: Record<OuvinteDoEstado, AoEstado>,
  aoFalhar: (ouvinte: OuvinteDoEstado, terminalId: string, erro: unknown) => void,
): (terminalId: string, aviso: AvisoAgente) => void {
  return (terminalId, aviso) => {
    for (const nome of ORDEM_DO_ESTADO) {
      try {
        const feito = ouvintes[nome](terminalId, aviso)
        if (feito instanceof Promise) feito.catch((erro: unknown) => aoFalhar(nome, terminalId, erro))
      } catch (erro) {
        aoFalhar(nome, terminalId, erro)
      }
    }
  }
}
