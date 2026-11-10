import { z } from 'zod'
import { IPC } from '../../shared/ipc'
import { handle } from '../ipc'
import type { ServicoPerfis } from '../perfis/servico'
import type { ServicoQuadros } from '../quadros/servico'
import type { ServicoRepos } from '../repos/servico'
import type { ApresentadorTime } from '../time/apresentar'

const Criar = z.object({
  repoId: z.string().min(1),
  tipo: z.enum(['terminal', 'agente']),
  perfilId: z.string().min(1),
  posicao: z.object({ x: z.number().finite(), y: z.number().finite() }).optional(),
  separado: z.boolean().optional(),
  kanban: z.boolean().optional(),
})
const CriarLivre = z.object({
  tipo: z.enum(['terminal', 'agente']),
  perfilId: z.string().min(1),
  posicao: z.object({ x: z.number().finite(), y: z.number().finite() }).optional(),
  kanban: z.boolean().optional(),
})
const Remover = z.object({ quadroId: z.string().min(1) })
const TrocarConta = z.object({ quadroId: z.string().min(1), perfilId: z.string().min(1) })
const DefinirPapel = z.object({ quadroId: z.string().min(1), papel: z.string().max(200) })

/** `time.mudou()`: fechar, trocar a conta ou dar papel muda o que o time ouve (T29.1). */
export function registrarHandlersQuadros(
  quadros: ServicoQuadros,
  time: Pick<ApresentadorTime, 'mudou'>,
  pastas: { perfis: Pick<ServicoPerfis, 'obter'>; repos: Pick<ServicoRepos, 'adicionar'> },
): void {
  const eAvisa = <T>(feito: T): T => {
    time.mudou()
    return feito
  }
  handle(IPC.quadrosCriar, Criar, async ({ repoId, tipo, perfilId, posicao, separado, kanban }) => {
    const criado = separado
      ? await quadros.criarEmCopia(repoId, tipo, perfilId, posicao)
      : { quadro: quadros.criar(repoId, tipo, perfilId, posicao), repo: null }
    // a escolha da caixa "Kanban do projeto" (A22); o agente ainda nao abriu, entao vale ja na abertura
    return kanban === undefined ? criado : { ...criado, quadro: quadros.definirKanban(criado.quadro.id, kanban) }
  })
  // D65: o main acha a pasta livre da conta; a tela so manda a conta
  handle(IPC.quadrosCriarLivre, CriarLivre, ({ tipo, perfilId, posicao, kanban }) => {
    const { pastaLivre } = pastas.perfis.obter(perfilId)
    if (!pastaLivre) throw new Error('Esta conta ainda não tem pasta livre: escolha uma na engrenagem, no cartão da conta.')
    const repo = pastas.repos.adicionar(pastaLivre, perfilId)
    const quadro = quadros.criar(repo.id, tipo, perfilId, posicao)
    return { quadro: kanban === undefined ? quadro : quadros.definirKanban(quadro.id, kanban), repo }
  })
  handle(IPC.quadrosRemover, Remover, async ({ quadroId }) => eAvisa(await quadros.remover(quadroId)))
  handle(IPC.quadrosTrocarConta, TrocarConta, async ({ quadroId, perfilId }) =>
    eAvisa(await quadros.trocarConta(quadroId, perfilId)),
  )
  handle(IPC.quadrosDefinirPapel, DefinirPapel, ({ quadroId, papel }) => eAvisa(quadros.definirPapel(quadroId, papel)))
}
