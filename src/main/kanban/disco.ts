// Disco de verdade do kanban (D52): so o KANBAN.md e o .git/info/exclude da pasta do projeto.
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { basename, join } from 'node:path'
import type { Quadro, Repo } from '../../shared/model'
import { log } from '../log'
import {
  ARQUIVO_KANBAN,
  garantirKanban,
  nomeDoCard,
  regraDoKanban,
  regraDoKanbanNoProjeto,
  repoDoKanban,
  type DiscoKanban,
} from './kanban'
import { ehProjeto, localDoKanban } from './projeto'

export const discoKanban: DiscoKanban = {
  existe: (c) => existsSync(c),
  ehPasta: (c) => existsSync(c) && statSync(c).isDirectory(),
  ler: (c) => readFileSync(c, 'utf8'),
  escrever: (c, t) => writeFileSync(c, t, 'utf8'),
  criarPasta: (c) => mkdirSync(c, { recursive: true }),
}

/**
 * O kanban do quadro e a regra do agente; sem kanban ou falha de disco: null. Um kanban so por
 * projeto (A22): vale o que ja existe na pasta ou acima, ate a raiz do repositorio git. `quadro.kanban`
 * falso: nenhum. Verdadeiro: usa o existente ou cria. Ausente (quadros de antes da A22): so usa o
 * existente, nunca cria. `aoCriar` recebe o repo quando o arquivo nasceu na pasta dele.
 */
export function prepararKanban(
  quadro: Quadro,
  obterRepo: (id: string) => Repo,
  aoCriar: (repoId: string) => void = () => undefined,
  disco: DiscoKanban = discoKanban,
): string | null {
  if (quadro.kanban === false) return null
  try {
    const repo = obterRepo(quadro.repoId)
    const projeto = repoDoKanban(repo, obterRepo)
    const nome = nomeDoCard(quadro, repo)
    const local = localDoKanban(projeto.caminho, disco.existe)
    if (local.existe) return regraDoKanban(join(local.pasta, ARQUIVO_KANBAN), nome)
    if (quadro.kanban !== true) return null
    // a home ou uma pasta de varios projetos: o kanban nasce na pasta do projeto, na 1a escrita (A16)
    if (!local.git && !ehProjeto(projeto.caminho, disco.existe)) return regraDoKanbanNoProjeto(projeto.caminho, nome)
    const { arquivo, criado } = garantirKanban(local.pasta, basename(local.pasta), disco)
    if (criado && local.pasta === projeto.caminho) aoCriar(projeto.id)
    return regraDoKanban(arquivo, nome)
  } catch (e) {
    log('warn', `kanban: não deu para preparar o ${quadro.id}: ${e instanceof Error ? e.message : String(e)}`)
    return null
  }
}

/** A janela "Novo quadro" (A22): o projeto desta pasta ja tem kanban? Marca a caixa sozinha. */
export function temKanban(repo: Repo, obterRepo: (id: string) => Repo, disco: DiscoKanban = discoKanban): boolean {
  try {
    return localDoKanban(repoDoKanban(repo, obterRepo).caminho, disco.existe).existe
  } catch {
    return false
  }
}

/**
 * O agente salvou num projeto dentro de uma pasta que nao e projeto: o kanban nasce la (A16), ou
 * na raiz do repositorio dele, se ja nao tem um (A22). Devolve a pasta onde nasceu; null = nada novo.
 */
export function kanbanNaPastaDoProjeto(pasta: string, disco: DiscoKanban = discoKanban): string | null {
  try {
    const local = localDoKanban(pasta, disco.existe)
    if (local.existe) return null
    return garantirKanban(local.pasta, basename(local.pasta), disco).criado ? local.pasta : null
  } catch (e) {
    log('warn', `kanban: não deu para criar em ${pasta}: ${e instanceof Error ? e.message : String(e)}`)
    return null
  }
}
