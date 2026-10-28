// Kanban em md (Fatia 33, D52): um KANBAN.md na raiz da pasta original do projeto, que os
// proprios agentes atualizam. O Mãozinha so cria o arquivo e entrega a regra a cada agente; o
// leitor (T7.4) ja recarrega quando ele muda.
import { join } from 'node:path'
import type { Quadro, Repo } from '../../shared/model'

export const ARQUIVO_KANBAN = 'KANBAN.md'

/** As etapas ate a espera do commit, na ordem: cada uma e uma secao `##` do arquivo. */
export const ETAPAS = [
  '📋 A fazer',
  '🔍 Entendendo',
  '🛠️ Fazendo',
  '🧪 Testando',
  '⏳ Esperando o commit',
  '✅ Feito',
] as const

/** O arquivo novo: titulo, como ler e as secoes vazias. Puro. */
export function modeloKanban(projeto: string): string {
  const secoes = ETAPAS.map((etapa) => `## ${etapa}\n`).join('\n')
  return (
    `# Kanban · ${projeto}\n\n` +
    '> Atualizado pelos agentes do Mãozinha. Cada card: `- **nome do terminal** · tarefa · hora`.\n' +
    '> Fora do git: está no `.git/info/exclude` desta pasta.\n\n' +
    secoes
  )
}

/** Cópia separada (D18) escreve no kanban da pasta original: um arquivo só por projeto. Puro. */
export function repoDoKanban(repo: Repo, obterRepo: (id: string) => Repo): Repo {
  if (!repo.copia) return repo
  try {
    return obterRepo(repo.copia.origemId)
  } catch {
    return repo // a original saiu da lista: fica na propria copia
  }
}

// eslint-disable-next-line no-control-regex
const CONTROLE = /[\u0000-\u001f\u007f]/g

/**
 * A regra que vai para o agente (`--append-system-prompt`). Uma linha so: vai na linha de comando,
 * e caractere de controle viraria Enter no terminal. Puro.
 */
export function regraDoKanban(caminho: string, nome: string): string {
  const etapas = ETAPAS.map((e) => e.replace(/^\S+\s/, '')).join(', ')
  const texto =
    `Quadro de tarefas do projeto (Mãozinha): mantenha o arquivo ${caminho} sempre atualizado. ` +
    `Seu nome nos cards: ${nome}. ` +
    `Ao começar uma tarefa, crie um card na seção da etapa, no formato "- **${nome}** · tarefa em poucas palavras · HH:MM". ` +
    'Antes de criar, procure um card seu da mesma tarefa: se existir, mova esse em vez de criar outro. ' +
    `A cada mudança de etapa, mova o card para a seção certa e atualize a hora. Etapas, na ordem: ${etapas}. ` +
    'Ao terminar e esperar o commit do usuário, deixe o card em "Esperando o commit"; depois do commit, em "Feito". ' +
    'Releia o arquivo antes de editar, mexa só nos seus cards e nunca apague os dos outros. ' +
    'O arquivo é UTF-8: edite com a ferramenta de edição (no PowerShell, sempre com -Encoding utf8). ' +
    'Não faça commit deste arquivo nem crie outro kanban.'
  return texto.replace(CONTROLE, ' ')
}

/** O `.git/info/exclude` com o kanban; null se ja tem. Puro. */
export function comExclusao(texto: string): string | null {
  const linhas = texto.split(/\r?\n/).map((l) => l.trim())
  if (linhas.includes(`/${ARQUIVO_KANBAN}`) || linhas.includes(ARQUIVO_KANBAN)) return null
  const base = texto === '' || texto.endsWith('\n') ? texto : `${texto}\n`
  return `${base}# kanban do Mãozinha (D52)\n/${ARQUIVO_KANBAN}\n`
}

export interface DiscoKanban {
  existe(caminho: string): boolean
  ehPasta(caminho: string): boolean
  ler(caminho: string): string
  escrever(caminho: string, texto: string): void
  criarPasta(caminho: string): void
}

/**
 * Cria o KANBAN.md se ainda nao existe e o tira do git (so o exclude local: o `.gitignore` e do
 * usuario e iria nos commits). `.git` arquivo (a pasta ja e um worktree) fica sem exclude.
 * Devolve o caminho do kanban e se ele acabou de ser criado.
 */
export function garantirKanban(
  pasta: string,
  projeto: string,
  disco: DiscoKanban,
): { arquivo: string; criado: boolean } {
  const arquivo = join(pasta, ARQUIVO_KANBAN)
  const criado = !disco.existe(arquivo)
  if (criado) disco.escrever(arquivo, modeloKanban(projeto))
  const git = join(pasta, '.git')
  if (disco.ehPasta(git)) {
    const info = join(git, 'info')
    const exclude = join(info, 'exclude')
    const novo = comExclusao(disco.existe(exclude) ? disco.ler(exclude) : '')
    if (novo !== null) {
      disco.criarPasta(info)
      disco.escrever(exclude, novo)
    }
  }
  return { arquivo, criado }
}

/** Nome do card: o mesmo do time (`nomeNoTime`): papel, senao apelido da copia, senao o titulo. */
export function nomeDoCard(quadro: Quadro, repo: Repo): string {
  return quadro.papel || repo.copia?.apelido || quadro.titulo
}
