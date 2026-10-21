import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import { IPC } from '../../shared/ipc'
import type { Armazem } from '../estado/armazem'
import { handle } from '../ipc'
import type { ServicoPerfis } from '../perfis/servico'
import { ServicoTime } from '../time/servico'

const Id = z.string().min(1)
const Ligar = z.object({ de: Id, para: Id })
const Ajustar = z.object({
  ligacaoId: Id,
  mudanca: z.object({ modo: z.enum(['automatico', 'perguntar']).optional(), pausada: z.boolean().optional() }),
})
const Desligar = z.object({ ligacaoId: Id })

/** Linhas do time (T28.1, D39): so ids de quadro e de linha; nada aqui digita num terminal. */
export function registrarHandlersTime(armazem: Armazem, perfis: Pick<ServicoPerfis, 'obter'>): void {
  const time = new ServicoTime({ armazem, perfis, novoId: randomUUID })
  handle(IPC.timeLigar, Ligar, ({ de, para }) => time.ligar(de, para))
  handle(IPC.timeAjustar, Ajustar, ({ ligacaoId, mudanca }) => time.ajustar(ligacaoId, mudanca))
  handle(IPC.timeDesligar, Desligar, ({ ligacaoId }) => time.desligar(ligacaoId))
}
