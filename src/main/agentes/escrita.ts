// Onde o agente esta salvando (A16): um gancho PostToolUse no settings do agente (o mesmo arquivo da
// linha de status) grava o JSON da ferramenta de escrita em <quadroId>.escrita.json. Sem vigiar
// pastas do usuario (D17): so a pasta <userData>\agentes, que a ponte ja vigia. Puro.
import { isAbsolute, resolve } from 'node:path'

/** As ferramentas que salvam arquivo. */
export const FERRAMENTAS_DE_ESCRITA = 'Write|Edit|MultiEdit|NotebookEdit'

/** O gancho que vai no settings: como a linha de status, `findstr` pelo Git Bash (T17.0). */
export function ganchoDeEscrita(arquivoJson: string): Record<string, unknown[]> {
  const comando = `findstr "^" > "${arquivoJson.replace(/\\/g, '/')}"`
  return { PostToolUse: [{ matcher: FERRAMENTAS_DE_ESCRITA, hooks: [{ type: 'command', command: comando }] }] }
}

interface EntradaDoGancho {
  cwd?: unknown
  tool_input?: { file_path?: unknown; notebook_path?: unknown }
}

/** O arquivo que a ferramenta salvou (absoluto); JSON estranho ou sem caminho: null. */
export function caminhoEscrito(texto: string): string | null {
  let entrada: EntradaDoGancho
  try {
    entrada = JSON.parse(texto) as EntradaDoGancho
  } catch {
    return null
  }
  const c = entrada?.tool_input?.file_path ?? entrada?.tool_input?.notebook_path
  if (typeof c !== 'string' || c === '') return null
  if (isAbsolute(c)) return c
  return typeof entrada.cwd === 'string' && isAbsolute(entrada.cwd) ? resolve(entrada.cwd, c) : null
}
