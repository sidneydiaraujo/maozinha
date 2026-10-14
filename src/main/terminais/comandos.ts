// O que digitar no terminal para cada provedor (T2.3). \r = Enter.
import type { Provedor } from '../../shared/model'

export function comandoAgente(provedor: Provedor): string {
  return provedor === 'claude' ? 'claude\r' : 'codex\r'
}

export function comandoLogin(provedor: Provedor): string {
  return provedor === 'claude' ? 'claude auth login\r' : 'codex login\r'
}
