// O que digitar no terminal para cada provedor (T2.3). \r = Enter.
import type { Provedor } from '../../shared/model'
import { FORMATO_SESSAO } from '../quadros/sessoes'

/** Conversa do quadro (T6.1): `existe` = o Claude ja gravou algo com esse id nesta conta. */
export interface SessaoAgente {
  id: string
  existe: boolean
}

/** Com conversa: retoma se ja existe, senao abre uma nova com o id que o Lousa escolheu. */
export function comandoAgente(provedor: Provedor, sessao?: SessaoAgente): string {
  if (provedor === 'codex') return 'codex\r'
  if (!sessao || !FORMATO_SESSAO.test(sessao.id)) return 'claude\r'
  return sessao.existe ? `claude --resume ${sessao.id}\r` : `claude --session-id ${sessao.id}\r`
}

/**
 * O shell sai junto com o login, dando certo ou nao (T6.4): a janela de login nao mostra
 * o terminal, entao o codigo de saida e o que diz se deu certo.
 */
export function comandoLogin(provedor: Provedor): string {
  const comando = provedor === 'claude' ? 'claude auth login' : 'codex login'
  return `${comando}; exit $LASTEXITCODE\r`
}
