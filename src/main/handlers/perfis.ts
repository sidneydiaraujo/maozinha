import { z } from 'zod'
import { IPC } from '../../shared/ipc'
import { handle } from '../ipc'
import type { ServicoPerfis } from '../perfis/servico'

const PerfilAlvo = z.object({ perfilId: z.string().min(1) })
const Renomear = PerfilAlvo.extend({ nome: z.string().trim().min(1).max(40) })
const Texto = (max: number) => z.string().max(max).nullable()
const DefinirGit = PerfilAlvo.extend({
  git: z.object({ nome: Texto(100), email: Texto(200), githubProprio: z.boolean() }).nullable(),
})
const Criar = z.object({ provedor: z.enum(['claude', 'codex']), nome: z.string().trim().min(1).max(40) })

export function registrarHandlersPerfis(perfis: ServicoPerfis): void {
  handle(IPC.perfisListar, z.undefined(), () => perfis.listar())
  handle(IPC.perfisRenomear, Renomear, ({ perfilId, nome }) => perfis.renomear(perfilId, nome))
  handle(IPC.perfisAtualizarConta, PerfilAlvo, ({ perfilId }) => perfis.atualizarConta(perfilId))
  handle(IPC.perfisDefinirGit, DefinirGit, ({ perfilId, git }) => perfis.definirGit(perfilId, git))
  handle(IPC.perfisCriar, Criar, ({ provedor, nome }) => perfis.criar(provedor, nome))
}
