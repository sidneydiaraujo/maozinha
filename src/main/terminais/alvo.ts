// Transforma o que a tela pede ("login da conta X") em pasta, conta e comando.
// Quem decide e o main (D7): a tela so manda ids.
import type { AlvoTerminal, Perfil } from '../../shared/model'
import { comandoLogin } from './comandos'

export interface AlvoResolvido {
  terminalId: string
  cwd: string
  perfil: Perfil
  comandoInicial?: string
}

export function resolverAlvo(
  alvo: AlvoTerminal,
  deps: { home: string; obterPerfil(id: string): Perfil },
): AlvoResolvido {
  if (alvo.tipo === 'login') {
    const perfil = deps.obterPerfil(alvo.perfilId)
    return {
      terminalId: `login:${alvo.perfilId}`,
      cwd: deps.home,
      perfil,
      comandoInicial: comandoLogin(perfil.provedor),
    }
  }
  throw new Error('Quadros chegam na fatia 3')
}
