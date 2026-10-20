// Canais dos agentes (T17.2, D24): o painel que a linha de status de cada agente conta e o
// compactar da conversa (T18.1).
import { z } from 'zod'
import { IPC } from '../../shared/ipc'
import { compactar } from '../agentes/compactar'
import type { Contexto } from '../contexto'
import { handle } from '../ipc'

const DoQuadro = z.object({ quadroId: z.string().min(1).max(80) })

type Servicos = Pick<Contexto, 'agentes' | 'quadros' | 'terminais'>

export function registrarHandlersAgentes({ agentes, quadros, terminais }: Servicos): void {
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
