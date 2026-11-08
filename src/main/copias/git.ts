// Roda o git pelo main (T10.2, D18): sem shell, argumentos fixos e o ambiente da lista
// permitida (sem token nem variavel de conta). Nunca pede senha: GIT_TERMINAL_PROMPT=0.
import { execFile } from 'node:child_process'
import { ambienteBase } from '../perfis/ambiente'

export interface SaidaGit {
  codigo: number
  saida: string
  erro: string
}

export type RodarGit = (cwd: string, args: string[]) => Promise<SaidaGit>

export const rodarGitReal: RodarGit = (cwd, args) =>
  new Promise((resolve) => {
    execFile(
      'git',
      args,
      {
        cwd,
        // LC_ALL=C (R4.21): mensagens sempre em ingles, que e o que copias/juntar.ts e servico.ts leem
        env: { ...ambienteBase(process.env), GIT_TERMINAL_PROMPT: '0', LC_ALL: 'C' },
        windowsHide: true,
        timeout: 30000,
        maxBuffer: 1_000_000,
        encoding: 'utf8',
      },
      (falha, stdout, stderr) => {
        // git ausente (ENOENT) ou pasta inexistente: codigo -1, nunca excecao
        if (falha && typeof falha.code !== 'number') {
          resolve({ codigo: -1, saida: '', erro: falha.code === 'ENOENT' ? 'Git não encontrado' : falha.message })
          return
        }
        resolve({ codigo: falha ? (falha.code as number) : 0, saida: stdout, erro: stderr })
      },
    )
  })
