import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import { IPC } from '../../shared/ipc'
import type { Contexto } from '../contexto'
import { handle } from '../ipc'
import { criarColega, separarEmCopia, type DepsColega } from '../time/colega'
import { ServicoTime } from '../time/servico'

const Id = z.string().min(1)
const Numero = z.number().finite()
const Ligar = z.object({ de: Id, para: Id })
const Ajustar = z.object({
  ligacaoId: Id,
  mudanca: z.object({ modo: z.enum(['automatico', 'perguntar']).optional(), pausada: z.boolean().optional() }),
})
const PorLinha = z.object({ ligacaoId: Id })
const Colega = z.object({ quadroId: Id, posicao: z.object({ x: Numero, y: Numero }).optional() })

/**
 * Linhas do time (T28.1, D39) e colega pela bolinha (T28.3): so ids de quadro e de linha. Conta,
 * pasta e copia do colega vem do quadro salvo; nada aqui digita num terminal.
 */
export function registrarHandlersTime(contexto: Pick<Contexto, 'armazem' | 'perfis' | 'quadros'>): void {
  const { armazem, perfis, quadros } = contexto
  const time = new ServicoTime({ armazem, perfis, novoId: randomUUID })
  const deps: DepsColega = {
    armazem,
    quadros,
    time,
    ehClaude: (perfilId) => perfis.obter(perfilId).provedor === 'claude',
  }
  handle(IPC.timeLigar, Ligar, ({ de, para }) => time.ligar(de, para))
  handle(IPC.timeAjustar, Ajustar, ({ ligacaoId, mudanca }) => time.ajustar(ligacaoId, mudanca))
  handle(IPC.timeDesligar, PorLinha, ({ ligacaoId }) => time.desligar(ligacaoId))
  handle(IPC.timeColega, Colega, ({ quadroId, posicao }) => criarColega(deps, quadroId, posicao ? { posicao } : {}))
  handle(IPC.timeSeparar, PorLinha, ({ ligacaoId }) => separarEmCopia(deps, ligacaoId))
}
