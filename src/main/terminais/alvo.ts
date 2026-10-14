// Transforma o que a tela pede ("login da conta X", "o quadro q1") em pasta,
// conta e comando. Quem decide e o main (D7): a tela so manda ids.
import type { AlvoTerminal, Perfil, Quadro, Repo } from '../../shared/model'
import { comandoAgente, comandoLogin } from './comandos'

export interface AlvoResolvido {
  terminalId: string
  cwd: string
  perfil: Perfil
  comandoInicial?: string
}

export interface DepsAlvo {
  home: string
  obterPerfil(id: string): Perfil
  obterQuadro(id: string): Quadro // lanca 'Quadro não encontrado'
  obterRepo(id: string): Repo
}

export function resolverAlvo(alvo: AlvoTerminal, deps: DepsAlvo): AlvoResolvido {
  if (alvo.tipo === 'login') {
    const perfil = deps.obterPerfil(alvo.perfilId)
    return {
      terminalId: `login:${alvo.perfilId}`,
      cwd: deps.home,
      perfil,
      comandoInicial: comandoLogin(perfil.provedor),
    }
  }
  // Pasta vem do repo e conta vem do quadro, ambos salvos no main: nunca da tela.
  const quadro = deps.obterQuadro(alvo.quadroId)
  const perfil = deps.obterPerfil(quadro.perfilId)
  return {
    terminalId: quadro.id,
    cwd: deps.obterRepo(quadro.repoId).caminho,
    perfil,
    comandoInicial: quadro.tipo === 'agente' ? comandoAgente(perfil.provedor) : undefined,
  }
}
