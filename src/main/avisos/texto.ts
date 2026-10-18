// Texto da notificacao do Windows quando o agente de um quadro para (T8.1). Funcao pura.
import type { AvisoAgente } from '../../shared/model'

/** Estados que chamam o Sidney: notificacao e barra de tarefas piscando. */
export function pedeAtencao(aviso: AvisoAgente): boolean {
  return aviso.estado === 'esperando' || aviso.estado === 'terminou' || aviso.estado === 'erro'
}

function frase(aviso: AvisoAgente): string {
  if (aviso.estado === 'terminou') return 'Terminou'
  if (aviso.estado === 'erro') return 'Parou com erro'
  if (aviso.motivo === 'permissao') return 'Pedindo sua permissão'
  if (aviso.motivo === 'pergunta') return 'Tem uma pergunta para você'
  if (aviso.motivo === 'login') return 'Precisa entrar na conta de novo'
  return 'Esperando você'
}

/** `onde` = "pasta · Claude 1". O corpo traz a frase curta do Claude, quando ele mandou. */
export function textoDoAviso(aviso: AvisoAgente, onde: string): { titulo: string; corpo: string } {
  return { titulo: `${frase(aviso)} · ${onde}`, corpo: aviso.mensagem ?? 'Clique para ver o quadro.' }
}
