// O que rodar no terminal para cada provedor (T2.3). \r = Enter.
import { ESFORCOS, MODELOS, type Esforco, type Modelo, type Provedor } from '../../shared/model'
import { FORMATO_SESSAO } from '../quadros/sessoes'

/** Conversa do quadro (T6.1): `existe` = o Claude ja gravou algo com esse id nesta conta. */
export interface SessaoAgente {
  id: string
  existe: boolean
}

/** Texto literal no PowerShell: aspas simples, e a aspa simples de dentro dobrada. */
const literalPowerShell = (texto: string): string => `'${texto.replace(/'/g, "''")}'`

/** O que mais vai na linha do Claude. `modelo` e `esforco` vem dos enums, nunca de texto livre. */
export interface ExtrasAgente {
  /** Arquivo da Lousa com a linha de status que conta o painel do agente (T17.2). */
  settings?: string
  modelo?: Modelo
  esforco?: Esforco
  /** Texto acrescentado as instrucoes do Claude (o kanban, D52); vira uma linha so. */
  regra?: string
  /** Arquivo da Lousa com o servidor de ferramentas do Mãozinha (A19: criar colegas). */
  mcp?: string
}

/**
 * Aspas duplas viram aspas tipograficas (A25): o PowerShell 5.1 nao as protege ao passar o texto
 * para o claude.exe, que cortava a regra ali e recebia o resto ("**Claude") como primeira mensagem.
 */
function semAspasDuplas(texto: string): string {
  let abertas = false
  return texto.replace(/"/g, () => {
    abertas = !abertas
    return abertas ? '“' : '”'
  })
}

/** `--append-system-prompt` com a regra numa linha so; vazia, nada. */
function argumentoRegra(regra: string | undefined): string | null {
  // caractere de controle no meio viraria Enter: o resto da linha seria outro comando
  // eslint-disable-next-line no-control-regex
  const linha = regra?.replace(/[\u0000-\u001f\u007f]/g, ' ').trim()
  return linha ? `--append-system-prompt ${literalPowerShell(semAspasDuplas(linha))}` : null
}

/** Os arquivos da Lousa que o Claude le: a linha de status (T17.2) e a ferramenta de colegas (A19). */
function argumentosDeArquivo(extras: ExtrasAgente): string[] {
  const args: string[] = []
  if (extras.settings) args.push(`--settings ${literalPowerShell(extras.settings)}`)
  if (extras.mcp) args.push(`--mcp-config ${literalPowerShell(extras.mcp)}`)
  return args
}

/** Com conversa: retoma se ja existe, senao abre uma nova com o id que o Lousa escolheu. */
export function comandoAgente(provedor: Provedor, sessao?: SessaoAgente, extras: ExtrasAgente = {}): string {
  if (provedor === 'codex') return 'codex\r'
  const partes = ['claude', ...argumentosDeArquivo(extras)]
  if (extras.modelo && MODELOS.includes(extras.modelo)) partes.push(`--model ${extras.modelo}`)
  if (extras.esforco && ESFORCOS.includes(extras.esforco)) partes.push(`--effort ${extras.esforco}`)
  const regra = argumentoRegra(extras.regra)
  if (regra) partes.push(regra)
  const base = partes.join(' ')
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
