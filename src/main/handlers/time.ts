import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import { IPC } from '../../shared/ipc'
import type { Contexto } from '../contexto'
import { handle } from '../ipc'
import { rodarGitReal } from '../copias/git'
import { criarColega, separarEmCopia, type DepsColega } from '../time/colega'
import { juntarTime } from '../time/juntar'
import { provedoresDos, ServicoTime } from '../time/servico'

const Id = z.string().min(1)
const Numero = z.number().finite()
const Ligar = z.object({ de: Id, para: Id })
const Ajustar = z.object({
  ligacaoId: Id,
  mudanca: z.object({ modo: z.enum(['automatico', 'perguntar']).optional(), pausada: z.boolean().optional() }),
})
const PorLinha = z.object({ ligacaoId: Id })
const Colega = z.object({ quadroId: Id, posicao: z.object({ x: Numero, y: Numero }).optional() })
const Resposta = z.object({ pedidoId: Id, aceitar: z.boolean() })

/**
 * Linhas do time (T28.1, D39) e colega pela bolinha (T28.3): so ids de quadro e de linha. Conta,
 * pasta e copia do colega vem do quadro salvo; nada aqui digita num terminal.
 */
export function registrarHandlersTime(
  contexto: Pick<Contexto, 'armazem' | 'perfis' | 'quadros' | 'repos' | 'time' | 'repasse' | 'pedidos'>,
): void {
  const { armazem, perfis, quadros } = contexto
  // toda mudanca de linha ou colega: o time ouve de novo quem e quem (T29.1)
  const eAvisa = <T>(feito: T): T => {
    contexto.time.mudou()
    return feito
  }
  const time = new ServicoTime({ armazem, perfis, novoId: randomUUID })
  const deps: DepsColega = {
    armazem,
    quadros,
    time,
    ehClaude: (perfilId) => perfis.obter(perfilId).provedor === 'claude',
  }
  handle(IPC.timeLigar, Ligar, ({ de, para }) => eAvisa(time.ligar(de, para)))
  handle(IPC.timeAjustar, Ajustar, ({ ligacaoId, mudanca }) => time.ajustar(ligacaoId, mudanca))
  handle(IPC.timeDesligar, PorLinha, ({ ligacaoId }) => eAvisa(time.desligar(ligacaoId)))
  handle(IPC.timeColega, Colega, async ({ quadroId, posicao }) =>
    eAvisa(await criarColega(deps, quadroId, posicao ? { posicao } : {})),
  )
  handle(IPC.timeJuntar, PorLinha, ({ ligacaoId }) => {
    const e = armazem.carregar()
    const linha = (e.ligacoes ?? []).find((l) => l.id === ligacaoId)
    if (!linha) throw new Error('Linha não encontrada')
    const dados = () => ({ quadros: e.quadros, repos: e.repos, ligacoes: e.ligacoes ?? [], provedores: provedoresDos(e.quadros, (id) => perfis.obter(id)) })
    return juntarTime({ git: rodarGitReal, dados, obterRepo: (id) => contexto.repos.obter(id) }, linha.de)
  })
  handle(IPC.timePassar, PorLinha, ({ ligacaoId }) => contexto.repasse.passar(ligacaoId))
  handle(IPC.timeSeparar, PorLinha, async ({ ligacaoId }) => eAvisa(await separarEmCopia(deps, ligacaoId)))
  // colegas que o agente pediu (A19): so o clique do usuario cria; a tela manda so o id e o sim/nao
  handle(IPC.timeResponderPedido, Resposta, ({ pedidoId, aceitar }) => contexto.pedidos.responder(pedidoId, aceitar))
}
