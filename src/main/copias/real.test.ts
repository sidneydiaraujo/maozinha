// Copias com o git de verdade, numa pasta temporaria (T10.2): prova que nada com trabalho se perde.
import { existsSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { beforeEach, describe, expect, it } from 'vitest'
import type { Repo } from '../../shared/model'
import { rodarGitReal } from './git'
import { ServicoCopias } from './servico'

const AUTOR = ['-c', 'user.email=t@t', '-c', 'user.name=t', '-c', 'commit.gpgsign=false']
const servico = new ServicoCopias({ git: rodarGitReal, existe: existsSync, esperar: async () => undefined })

async function git(cwd: string, ...args: string[]): Promise<string> {
  const r = await rodarGitReal(cwd, args)
  if (r.codigo !== 0) throw new Error(`git ${args.join(' ')}: ${r.erro}`)
  return r.saida.trim()
}

let origem: Repo

beforeEach(async () => {
  const caminho = join(mkdtempSync(join(tmpdir(), 'lousa-copias-')), 'app')
  mkdirSync(caminho)
  await git(caminho, 'init', '-q', '-b', 'main')
  writeFileSync(join(caminho, '.gitignore'), 'node_modules/\n')
  writeFileSync(join(caminho, 'a.txt'), 'a\n')
  await git(caminho, 'add', '.')
  await git(caminho, ...AUTOR, 'commit', '-qm', 'init')
  origem = { id: 'r1', nome: 'app', caminho, perfilPadraoId: 'p' }
})

async function criarCopia(): Promise<Repo> {
  const { caminho, copia } = await servico.criar(origem, 'Claude 1', [])
  return { id: 'r2', nome: 'app', caminho, perfilPadraoId: 'p', copia }
}

const branches = (): Promise<string> => git(origem.caminho, 'branch', '--list', 'lousa/*')

describe('copias com git real', () => {
  it('cria a pasta ao lado com a branch lousa/claude-1', async () => {
    const repo = await criarCopia()
    expect(repo.caminho).toBe(`${origem.caminho}.copias\\claude-1`)
    expect(existsSync(join(repo.caminho, 'a.txt'))).toBe(true)
    expect(await git(repo.caminho, 'branch', '--show-current')).toBe('lousa/claude-1')
  }, 20000)

  it('arquivo novo na copia: mantem pasta e branch', async () => {
    const repo = await criarCopia()
    writeFileSync(join(repo.caminho, 'b.txt'), 'b\n')
    expect((await servico.limpar(repo)).copia).toBe('mantida')
    expect(existsSync(join(repo.caminho, 'b.txt'))).toBe(true)
    expect(await branches()).toContain('lousa/claude-1')
  }, 20000)

  it('limpa (so arquivo ignorado): apaga pasta e branch', async () => {
    const repo = await criarCopia()
    mkdirSync(join(repo.caminho, 'node_modules'))
    writeFileSync(join(repo.caminho, 'node_modules', 'x.js'), '')
    expect(await servico.limpar(repo)).toEqual({ copia: 'apagada' })
    expect(existsSync(repo.caminho)).toBe(false)
    expect(await branches()).toBe('')
  }, 20000)

  it('commit na copia: apaga a pasta e guarda a branch', async () => {
    const repo = await criarCopia()
    writeFileSync(join(repo.caminho, 'b.txt'), 'b\n')
    await git(repo.caminho, 'add', '.')
    await git(repo.caminho, ...AUTOR, 'commit', '-qm', 'trabalho')
    expect(await servico.limpar(repo)).toEqual({ copia: 'branchGuardada', branch: 'lousa/claude-1' })
    expect(existsSync(repo.caminho)).toBe(false)
    expect(await git(origem.caminho, 'log', '-1', '--format=%s', 'lousa/claude-1')).toBe('trabalho')
  }, 20000)

  it('subpasta do repositorio nao aceita copia', async () => {
    const sub = join(origem.caminho, 'src')
    mkdirSync(sub)
    await expect(servico.criar({ ...origem, caminho: sub }, 'Claude 1', [])).rejects.toThrow('pasta raiz')
  }, 20000)
})
