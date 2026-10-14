// O que digitar no terminal para cada provedor (T2.3). \r = Enter.
// O login fecha o shell so se der certo (`if ($?) { exit }`): assim a tela sabe quando
// terminou, e se falhar o terminal fica aberto para o usuario ler o erro.
import type { Provedor } from '../../shared/model'

export function comandoAgente(provedor: Provedor): string {
  return provedor === 'claude' ? 'claude\r' : 'codex\r'
}

export function comandoLogin(provedor: Provedor): string {
  const comando = provedor === 'claude' ? 'claude auth login' : 'codex login'
  return `${comando}; if ($?) { exit }\r`
}
