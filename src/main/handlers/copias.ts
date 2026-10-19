import { z } from 'zod'
import { IPC } from '../../shared/ipc'
import type { RodarGit } from '../copias/git'
import { juntarCopia, resumirCopia } from '../copias/juntar'
import { handle } from '../ipc'
import type { ServicoRepos } from '../repos/servico'

// A tela manda so o id da copia; a pasta vem do repo salvo no main (D7).
const Copia = z.object({ repoId: z.string().min(1) })

export function registrarHandlersCopias(repos: ServicoRepos, git: RodarGit): void {
  handle(IPC.copiasResumo, Copia, ({ repoId }) => resumirCopia(git, repos.obter(repoId)))
  handle(IPC.copiasJuntar, Copia, ({ repoId }) => juntarCopia(git, repos.obter(repoId)))
}
