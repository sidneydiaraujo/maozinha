import { z } from 'zod'
import { IPC } from '../../shared/ipc'
import type { RodarGit } from '../copias/git'
import { diffDoArquivo, juntarCopia, resumirCopia } from '../copias/juntar'
import { raizDaCopia } from '../copias/servico'
import { handle } from '../ipc'
import type { ServicoRepos } from '../repos/servico'

// A tela manda so o id da copia; a pasta vem do repo salvo no main (D7).
const Copia = z.object({ repoId: z.string().min(1) })
// o caminho so serve para escolher um arquivo da lista que o proprio main montou (diffDoArquivo)
const ArquivoDaCopia = Copia.extend({ caminho: z.string().min(1).max(1000) })

export function registrarHandlersCopias(repos: ServicoRepos, git: RodarGit): void {
  handle(IPC.copiasResumo, Copia, ({ repoId }) => resumirCopia(git, repos.obter(repoId)))
  handle(IPC.copiasJuntar, Copia, ({ repoId }) => juntarCopia(git, repos.obter(repoId)))
  handle(IPC.copiasDiff, ArquivoDaCopia, ({ repoId, caminho }) => diffDoArquivo(git, repos.obter(repoId), caminho))
  // a caixa "Copia separada" so vale em pasta git (R1.5): copia de copia sai da original
  handle(IPC.copiasAceita, Copia, async ({ repoId }) => {
    const repo = repos.obter(repoId)
    return (await raizDaCopia(git, repo.copia ? repos.obter(repo.copia.origemId) : repo)) === 'ok'
  })
}
