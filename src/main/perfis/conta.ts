// Le o e-mail e o plano de uma conta do Claude Code com `claude auth status --json` (T1.4).
// Nao consome uso do plano. Nunca registre o stdout no log: tem e-mail e id da organizacao.
import { execFile } from 'node:child_process'
import { join } from 'node:path'
import { z } from 'zod'
import type { StatusConta } from '../../shared/model'

export interface ResultadoExec {
  codigo: number | null
  stdout: string
  stderr: string
}

export type Executar = (arquivo: string, args: string[], env: Record<string, string>) => Promise<ResultadoExec>

const SaidaStatus = z.object({
  loggedIn: z.boolean(),
  email: z.string().optional(),
  subscriptionType: z.string().optional(),
})

/** Prefere ~/.local/bin (instalador nativo); senao procura no PATH (`;`). */
export function localizarClaude(home: string, path: string, existe: (c: string) => boolean): string | null {
  const nativo = join(home, '.local', 'bin', 'claude.exe')
  if (existe(nativo)) return nativo
  const pastas = path.split(';').filter((p) => p !== '')
  for (const nome of ['claude.exe', 'claude.cmd']) {
    for (const pasta of pastas) {
      const candidato = join(pasta, nome)
      if (existe(candidato)) return candidato
    }
  }
  return null
}

const RESPOSTA_INESPERADA: StatusConta = {
  logado: false,
  email: null,
  plano: null,
  erro: 'Resposta inesperada do claude auth status',
}

/** O JSON vem no stdout, as vezes com texto antes (avisos); pega do primeiro { ao ultimo }. */
export function interpretarStatus(stdout: string): StatusConta {
  const inicio = stdout.indexOf('{')
  const fim = stdout.lastIndexOf('}')
  if (inicio < 0 || fim < inicio) return RESPOSTA_INESPERADA
  let bruto: unknown
  try {
    bruto = JSON.parse(stdout.slice(inicio, fim + 1))
  } catch {
    return RESPOSTA_INESPERADA
  }
  const lido = SaidaStatus.safeParse(bruto)
  if (!lido.success) return RESPOSTA_INESPERADA
  const { loggedIn, email, subscriptionType } = lido.data
  return { logado: loggedIn, email: email ?? null, plano: subscriptionType ?? null, erro: null }
}

export async function lerStatusConta(
  exe: string | null,
  ambiente: Record<string, string>,
  executar: Executar,
): Promise<StatusConta> {
  if (exe === null) {
    return { logado: false, email: null, plano: null, erro: 'Claude Code não encontrado' }
  }
  try {
    const r = await executar(exe, ['auth', 'status', '--json'], ambiente)
    return interpretarStatus(r.stdout)
  } catch (e) {
    const mensagem = e instanceof Error ? e.message : String(e)
    return { logado: false, email: null, plano: null, erro: `Falha ao consultar a conta: ${mensagem}` }
  }
}

/** Devolve a saida mesmo com codigo diferente de zero; rejeita se nem iniciou ou estourou o tempo. */
export const executarReal: Executar = (arquivo, args, env) =>
  new Promise((resolve, reject) => {
    execFile(
      arquivo,
      args,
      { env, windowsHide: true, timeout: 15000, maxBuffer: 1_000_000, encoding: 'utf8' },
      (erro, stdout, stderr) => {
        if (erro && (erro.killed || typeof erro.code !== 'number')) {
          reject(erro)
          return
        }
        resolve({ codigo: erro ? (erro.code as number) : 0, stdout, stderr })
      },
    )
  })
