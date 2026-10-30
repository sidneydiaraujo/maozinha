// Canais dos agentes (T17.2, D24): o painel que a linha de status de cada agente conta, o
// compactar da conversa (T18.1), o modelo e o esforco do quadro (T19.1) e o uso de cada conta,
// que vem dos mesmos paineis (T20.1).
import { z } from 'zod'
import { IPC } from '../../shared/ipc'
import { ESFORCOS, MODELOS } from '../../shared/model'
import type { Contexto } from '../contexto'
import { handle } from '../ipc'

const DoQuadro = z.object({ quadroId: z.string().min(1).max(80) })
// so valores da lista: o texto que vai para o terminal e montado no main a partir deles
const Ajustar = DoQuadro.extend({
  mudanca: z
    .object({ modelo: z.enum(MODELOS).optional(), esforco: z.enum(ESFORCOS).optional() })
    .refine((m) => m.modelo !== undefined || m.esforco !== undefined, 'Nada para mudar'),
})

// a escolha de compactar sozinho (A17): limite de 10 a 90% em passos da engrenagem
const PrefCompactar = z.object({ ligado: z.boolean(), limite: z.number().int().min(10).max(90) })

type Servicos = Pick<
  Contexto,
  'agentes' | 'quadros' | 'ajustes' | 'usos' | 'repasse' | 'compactarSozinho' | 'compactarAgora'
>

export function registrarHandlersAgentes(s: Servicos): void {
  const { agentes, quadros, ajustes, usos, repasse, compactarSozinho, compactarAgora } = s
  handle(IPC.perfisUso, z.undefined(), () => usos.todos(Date.now()))
  // guarda no quadro (vale na proxima abertura) e, com o agente aberto e parado, reabre ele com o
  // modelo novo na mesma conversa (D49: o /model gravaria o padrao da conta toda)
  handle(IPC.agentesAjustar, Ajustar, ({ quadroId, mudanca }) => {
    quadros.ajustar(quadroId, mudanca)
    return ajustes.pedir(quadroId, mudanca)
  })
  handle(IPC.agentesUltimoPainel, DoQuadro, ({ quadroId }) => agentes.ultimo(quadroId))
  // a tela manda so o id; o texto e fixo e o main confere se o agente esta parado
  handle(IPC.agentesCompactar, DoQuadro, async ({ quadroId }) => {
    await compactarAgora(quadroId)
    // o resumo do /compact nao e trabalho para passar ao colega (A17)
    repasse.aoDigitar(quadroId, 'compactar')
  })
  handle(IPC.agentesPrefCompactar, PrefCompactar, (pref) => compactarSozinho.definir(pref))
}
