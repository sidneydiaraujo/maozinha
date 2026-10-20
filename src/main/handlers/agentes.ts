// Canais dos agentes (T17.2, D24): o painel que a linha de status de cada agente conta, o
// compactar da conversa (T18.1) e o modelo e o esforco do quadro (T19.1).
import { z } from 'zod'
import { IPC } from '../../shared/ipc'
import { ESFORCOS, MODELOS } from '../../shared/model'
import { compactar } from '../agentes/compactar'
import type { Contexto } from '../contexto'
import { handle } from '../ipc'

const DoQuadro = z.object({ quadroId: z.string().min(1).max(80) })
// so valores da lista: o texto que vai para o terminal e montado no main a partir deles
const Ajustar = DoQuadro.extend({
  mudanca: z
    .object({ modelo: z.enum(MODELOS).optional(), esforco: z.enum(ESFORCOS).optional() })
    .refine((m) => m.modelo !== undefined || m.esforco !== undefined, 'Nada para mudar'),
})

type Servicos = Pick<Contexto, 'agentes' | 'quadros' | 'terminais' | 'ajustes'>

export function registrarHandlersAgentes({ agentes, quadros, terminais, ajustes }: Servicos): void {
  // guarda no quadro (vale na proxima abertura) e, com o agente aberto, digita /model e /effort
  handle(IPC.agentesAjustar, Ajustar, ({ quadroId, mudanca }) => {
    quadros.ajustar(quadroId, mudanca)
    return ajustes.pedir(quadroId, mudanca)
  })
  handle(IPC.agentesUltimoPainel, DoQuadro, ({ quadroId }) => agentes.ultimo(quadroId))
  // a tela manda so o id; o texto e fixo e o main confere se o agente esta parado
  handle(IPC.agentesCompactar, DoQuadro, ({ quadroId }) =>
    compactar(
      {
        quadro: (id) => quadros.obter(id),
        aberto: (id) => terminais.estaAberto(id),
        aviso: (id) => terminais.aviso(id),
        escrever: (id, dados) => terminais.escrever(id, dados),
        esperar: (ms) => new Promise((r) => setTimeout(r, ms)),
      },
      quadroId,
    ),
  )
}
