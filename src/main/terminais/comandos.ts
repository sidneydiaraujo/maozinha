// O que rodar no terminal para cada provedor (T2.3). \r = Enter.
import type { Provedor } from '../../shared/model'
import { FORMATO_SESSAO } from '../quadros/sessoes'

/** Conversa do quadro (T6.1): `existe` = o Claude ja gravou algo com esse id nesta conta. */
export interface SessaoAgente {
  id: string
  existe: boolean
}

/** Texto literal no PowerShell: aspas simples, e a aspa simples de dentro dobrada. */
const literalPowerShell = (texto: string): string => `'${texto.replace(/'/g, "''")}'`

/**
 * Com conversa: retoma se ja existe, senao abre uma nova com o id que o Lousa escolheu.
 * `settings` (T17.2): arquivo da Lousa com a linha de status que conta o painel do agente.
 */
export function comandoAgente(provedor: Provedor, sessao?: SessaoAgente, settings?: string): string {
  if (provedor === 'codex') return 'codex\r'
  const base = settings ? `claude --settings ${literalPowerShell(settings)}` : 'claude'
  if (!sessao || !FORMATO_SESSAO.test(sessao.id)) return `${base}\r`
  return sessao.existe ? `${base} --resume ${sessao.id}\r` : `${base} --session-id ${sessao.id}\r`
}

/**
 * O login roda direto no PowerShell (-Command), sem prompt nem eco do comando, e o shell
 * sai junto com ele (T6.4): a janela de login nao mostra o terminal, entao o codigo de
 * saida diz se deu certo e o "ver detalhes" mostra so o que o CLI escreveu.
 */
export function shellLogin(provedor: Provedor): { arquivo: string; args: string[] } {
  const comando = provedor === 'claude' ? 'claude auth login' : 'codex login'
  return { arquivo: 'powershell.exe', args: ['-NoLogo', '-NoProfile', '-Command', `${comando}; exit $LASTEXITCODE`] }
}
