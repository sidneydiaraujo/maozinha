// Disco de verdade do kanban (D52): so o KANBAN.md e o .git/info/exclude da pasta do projeto.
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { basename } from 'node:path'
import type { Quadro, Repo } from '../../shared/model'
import { log } from '../log'
import { garantirKanban, nomeDoCard, regraDoKanban, repoDoKanban, type DiscoKanban } from './kanban'

export const discoKanban: DiscoKanban = {
  existe: (c) => existsSync(c),
  ehPasta: (c) => existsSync(c) && statSync(c).isDirectory(),
  ler: (c) => readFileSync(c, 'utf8'),
  escrever: (c, t) => writeFileSync(c, t, 'utf8'),
  criarPasta: (c) => mkdirSync(c, { recursive: true }),
}

/**
 * Garante o kanban do projeto do quadro e devolve a regra do agente; falha de disco: null.
 * `aoCriar` recebe o repo do kanban quando o arquivo acabou de nascer (a arvore rele a pasta).
 */
export function prepararKanban(
  quadro: Quadro,
  obterRepo: (id: string) => Repo,
  aoCriar: (repoId: string) => void = () => undefined,
  disco: DiscoKanban = discoKanban,
): string | null {
  try {
    const repo = obterRepo(quadro.repoId)
    const projeto = repoDoKanban(repo, obterRepo)
    const { arquivo, criado } = garantirKanban(projeto.caminho, basename(projeto.caminho), disco)
    if (criado) aoCriar(projeto.id)
    return regraDoKanban(arquivo, nomeDoCard(quadro, repo))
  } catch (e) {
    log('warn', `kanban: não deu para preparar o ${quadro.id}: ${e instanceof Error ? e.message : String(e)}`)
    return null
  }
}
