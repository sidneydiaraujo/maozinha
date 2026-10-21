// Git e GitHub de cada conta (C1, D42). So variaveis de ambiente: a Lousa nao escreve gitconfig
// nem nada nas pastas das contas. Nome e e-mail vencem o ~/.gitconfig; com "GitHub proprio" o gh
// le o login de uma pasta da Lousa e o gerenciador de credenciais do git guarda o login numa
// gaveta so desta conta (GCM_NAMESPACE), sem enxergar o do PC.
import type { GitDaConta, PerfilId } from '../../shared/model'

const EMAIL = /^[^\s@]+@[^\s@]+$/

/** Quebra de linha, tab e outros caracteres de controle nao entram em variavel de ambiente. */
function temControle(texto: string): boolean {
  return [...texto].some((c) => c.charCodeAt(0) < 32 || c.charCodeAt(0) === 127)
}

/** Texto aparado; vazio vira null. */
function limpar(texto: string | null): string | null {
  return texto?.trim() || null
}

/** Limpa o que veio da tela: texto vazio vira null; tudo vazio e sem GitHub proprio vira null. Puro. */
export function normalizarGit(git: GitDaConta | null): GitDaConta | null {
  if (!git) return null
  const nome = limpar(git.nome)
  const email = limpar(git.email)
  if (nome && temControle(nome)) throw new Error('Nome com caractere inválido')
  if (email && !EMAIL.test(email)) throw new Error('E-mail inválido')
  if (!nome && !email && !git.githubProprio) return null
  return { nome, email, githubProprio: git.githubProprio }
}

/** Pasta do login do gh desta conta, dentro dos dados da Lousa ('cx:x' vira 'cx-x'). Puro. */
export function pastaGithub(dados: string, perfilId: PerfilId): string {
  return `${dados}\\contas\\${perfilId.replace(/[^a-z0-9-]/gi, '-')}\\gh`
}

/** Variaveis que o git da conta acrescenta ao terminal. `dados` = pasta de dados da Lousa. Puro. */
export function variaveisDoGit(perfilId: PerfilId, git: GitDaConta | undefined, dados: string | null): Record<string, string> {
  const env: Record<string, string> = {}
  if (!git) return env
  if (git.nome) env.GIT_AUTHOR_NAME = env.GIT_COMMITTER_NAME = git.nome
  if (git.email) env.GIT_AUTHOR_EMAIL = env.GIT_COMMITTER_EMAIL = git.email
  if (git.githubProprio && dados) {
    env.GH_CONFIG_DIR = pastaGithub(dados, perfilId)
    env.GCM_NAMESPACE = `lousa-${perfilId.replace(/[^a-z0-9-]/gi, '-')}`
  }
  return env
}
