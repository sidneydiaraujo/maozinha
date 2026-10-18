// Conversas do Claude Code por quadro (T6.1, D14). O Claude guarda cada conversa em
// <pasta da conta>/projects/<pasta do repo com tudo que nao e letra/numero trocado por ->/<id>.jsonl.
// Provado em 17/10/2026: copiar esse arquivo para a pasta de outra conta e rodar
// `claude --resume <id>` nela continua a mesma conversa com os tokens da outra conta.
import { cpSync, existsSync, mkdirSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

/** Id que o Lousa gera (randomUUID). So isso entra no comando digitado no terminal. */
export const FORMATO_SESSAO = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function subpastas(dir: string): string[] {
  try {
    return readdirSync(dir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
  } catch {
    return []
  }
}

/**
 * Subpasta de `projects` onde a conversa esta, ou null. Procura em vez de calcular o
 * nome: o Claude encurta caminhos longos, e o nome que ele usou e o que vale.
 */
export function acharSessao(configDir: string, sessaoId: string): string | null {
  if (!FORMATO_SESSAO.test(sessaoId)) return null
  const projetos = join(configDir, 'projects')
  return subpastas(projetos).find((sub) => existsSync(join(projetos, sub, `${sessaoId}.jsonl`))) ?? null
}

/**
 * Copia a conversa (o .jsonl e a pasta de mesmo nome, com subagentes) da conta `de` para
 * a conta `para`, na mesma subpasta. Sobrescreve: a copia de `de` e a mais nova.
 * Devolve false se a conversa ainda nao existe (quadro aberto e nada digitado).
 */
export function copiarSessao(de: string, para: string, sessaoId: string): boolean {
  const sub = acharSessao(de, sessaoId)
  if (!sub) return false
  const origem = join(de, 'projects', sub)
  const destino = join(para, 'projects', sub)
  mkdirSync(destino, { recursive: true })
  cpSync(join(origem, `${sessaoId}.jsonl`), join(destino, `${sessaoId}.jsonl`))
  const extras = join(origem, sessaoId)
  if (existsSync(extras)) cpSync(extras, join(destino, sessaoId), { recursive: true })
  return true
}
