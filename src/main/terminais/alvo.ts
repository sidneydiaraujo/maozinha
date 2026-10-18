// Transforma o que a tela pede ("login da conta X", "o quadro q1") em pasta,
// conta e comando. Quem decide e o main (D7): a tela so manda ids.
import type { AlvoTerminal, Perfil, Quadro, Repo } from '../../shared/model'
import { comandoAgente, shellLogin } from './comandos'

export interface AlvoResolvido {
  terminalId: string
  cwd: string
  perfil: Perfil
  comandoInicial?: string
  /** Outro shell no lugar do PowerShell interativo (o login roda como -Command). */
  shell?: { arquivo: string; args: string[] }
}

export interface DepsAlvo {
  home: string
  obterPerfil(id: string): Perfil
  obterQuadro(id: string): Quadro // lanca 'Quadro não encontrado'
  obterRepo(id: string): Repo
  /** A conversa do quadro ja esta gravada na pasta desta conta? */
  existeSessao(configDir: string, sessaoId: string): boolean
}

export function resolverAlvo(alvo: AlvoTerminal, deps: DepsAlvo): AlvoResolvido {
  if (alvo.tipo === 'login') {
    const perfil = deps.obterPerfil(alvo.perfilId)
    return {
      terminalId: `login:${alvo.perfilId}`,
      cwd: deps.home,
      perfil,
      shell: shellLogin(perfil.provedor),
    }
  }
  // Pasta vem do repo e conta vem do quadro, ambos salvos no main: nunca da tela.
  const quadro = deps.obterQuadro(alvo.quadroId)
  const perfil = deps.obterPerfil(quadro.perfilId)
  const sessao = quadro.sessaoId
    ? { id: quadro.sessaoId, existe: deps.existeSessao(perfil.configDir, quadro.sessaoId) }
    : undefined
  return {
    terminalId: quadro.id,
    cwd: deps.obterRepo(quadro.repoId).caminho,
    perfil,
    comandoInicial: quadro.tipo === 'agente' ? comandoAgente(perfil.provedor, sessao) : undefined,
  }
}
