// Juntar uma copia com o git de verdade, numa pasta temporaria (T11.1).
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { beforeEach, describe, expect, it } from 'vitest'
import type { Repo } from '../../shared/model'
import { rodarGitReal } from './git'
import { diffDoArquivo, explicarRecusa, juntarCopia, lerDiff, lerNumstat, resumirCopia } from './juntar'
import { ServicoCopias } from './servico'

const AUTOR = ['-c', 'user.email=t@t', '-c', 'user.name=t', '-c', 'commit.gpgsign=false']
const copias = new ServicoCopias({ git: rodarGitReal, existe: existsSync, esperar: async () => undefined })

async function git(cwd: string, ...args: string[]): Promise<string> {
  const r = await rodarGitReal(cwd, args)
  if (r.codigo !== 0) throw new Error(`git ${args.join(' ')}: ${r.erro}`)
  return r.saida.trim()
}

async function commitar(pasta: string, arquivo: string, texto: string, msg: string): Promise<void> {
  writeFileSync(join(pasta, arquivo), texto)
  await git(pasta, 'add', '.')
  await git(pasta, ...AUTOR, 'commit', '-qm', msg)
}

let origem: Repo
let copia: Repo

beforeEach(async () => {
  const caminho = join(mkdtempSync(join(tmpdir(), 'lousa-juntar-')), 'app')
  mkdirSync(caminho)
  await git(caminho, 'init', '-q', '-b', 'main')
  // o merge cria commit e precisa de autor: a pasta de teste tem o seu
  await git(caminho, 'config', 'user.email', 't@t')
  await git(caminho, 'config', 'user.name', 't')
  await git(caminho, 'config', 'commit.gpgsign', 'false')
  await git(caminho, 'config', 'core.autocrlf', 'false') // o git do PC pode trocar \n por \r\n
  await commitar(caminho, 'a.txt', 'um\n', 'init')
  origem = { id: 'r1', nome: 'app', caminho, perfilPadraoId: 'p' }
  const criada = await copias.criar(origem, 'Claude 1', [])
  copia = { id: 'r2', nome: 'app ⑂ claude-1', caminho: criada.caminho, perfilPadraoId: 'p', copia: criada.copia }
})

describe('lerNumstat', () => {
  it('le mais, menos e caminho; binario vira zero', () => {
    expect(lerNumstat('12\t3\tsrc/a.ts\n-\t-\timg.png\n')).toEqual([
      { caminho: 'src/a.ts', mais: 12, menos: 3 },
      { caminho: 'img.png', mais: 0, menos: 0 },
    ])
  })
})

describe('juntar com git real', () => {
  it('resumo mostra commits e arquivos da copia', async () => {
    await commitar(copia.caminho, 'b.txt', 'b\nb\n', 'trabalho')
    const r = await resumirCopia(rodarGitReal, copia)
    expect(r).toMatchObject({ branch: 'lousa/claude-1', branchAlvo: 'main', commits: 1, totalArquivos: 1, pendente: false })
    expect(r.arquivos).toEqual([{ caminho: 'b.txt', mais: 2, menos: 0 }])
  }, 20000)

  it('junta na branch da pasta original e depois a copia limpa apaga a branch', async () => {
    await commitar(copia.caminho, 'b.txt', 'b\n', 'trabalho')
    expect(await juntarCopia(rodarGitReal, copia)).toEqual({ branchAlvo: 'main' })
    expect(readFileSync(join(origem.caminho, 'b.txt'), 'utf8')).toBe('b\n')
    expect(await copias.limpar(copia)).toEqual({ copia: 'apagada' })
  }, 20000)

  it('conflito desfaz o merge e explica', async () => {
    await commitar(copia.caminho, 'a.txt', 'copia\n', 'lado copia')
    await commitar(origem.caminho, 'a.txt', 'original\n', 'lado original')
    await expect(juntarCopia(rodarGitReal, copia)).rejects.toThrow('Conflito: os dois lados mudaram a.txt')
    expect(readFileSync(join(origem.caminho, 'a.txt'), 'utf8')).toBe('original\n')
    expect(await git(origem.caminho, 'status', '--porcelain')).toBe('')
  }, 20000)

  it('alteracao sem commit, na copia ou na original, recusa antes de mexer', async () => {
    writeFileSync(join(copia.caminho, 'x.txt'), 'x')
    expect((await resumirCopia(rodarGitReal, copia)).pendente).toBe(true)
    await expect(juntarCopia(rodarGitReal, copia)).rejects.toThrow('A cópia tem alterações sem commit')
    await git(copia.caminho, 'add', '.')
    await git(copia.caminho, ...AUTOR, 'commit', '-qm', 'x')
    writeFileSync(join(origem.caminho, 'a.txt'), 'mexido sem commit\n')
    await expect(juntarCopia(rodarGitReal, copia)).rejects.toThrow('A pasta original tem alterações sem commit')
  }, 20000)

  it('arquivo novo fora do git na original nao impede de juntar (D30)', async () => {
    writeFileSync(join(origem.caminho, 'rascunho.txt'), 'meu')
    await commitar(copia.caminho, 'b.txt', 'b\n', 'trabalho')
    expect(await juntarCopia(rodarGitReal, copia)).toEqual({ branchAlvo: 'main' })
    expect(readFileSync(join(origem.caminho, 'rascunho.txt'), 'utf8')).toBe('meu')
  }, 20000)

  it('arquivo fora do git com o mesmo nome do que a copia traz: recusa explicando e nada muda', async () => {
    writeFileSync(join(origem.caminho, 'b.txt'), 'meu')
    await commitar(copia.caminho, 'b.txt', 'b\n', 'trabalho')
    await expect(juntarCopia(rodarGitReal, copia)).rejects.toThrow('A pasta original tem b.txt fora do git')
    expect(readFileSync(join(origem.caminho, 'b.txt'), 'utf8')).toBe('meu')
  }, 20000)

  it('diff de um arquivo que a copia mudou; caminho fora da lista e recusado', async () => {
    await commitar(copia.caminho, 'a.txt', 'um\ndois\n', 'trabalho')
    const d = await diffDoArquivo(rodarGitReal, copia, 'a.txt')
    expect(d.cortada).toBe(false)
    expect(d.linhas.filter((l) => l.tipo !== 'trecho')).toEqual([
      { tipo: 'igual', texto: 'um' },
      { tipo: 'mais', texto: 'dois' },
    ])
    await expect(diffDoArquivo(rodarGitReal, copia, '../fora.txt')).rejects.toThrow('não está entre os que a cópia mudou')
  }, 20000)
})

describe('lerDiff', () => {
  const saida = [
    'diff --git a/x b/x',
    'index 1..2 100644',
    '--- a/x',
    '+++ b/x',
    '@@ -1,2 +1,2 @@ function f()',
    ' igual',
    '-velho',
    '+novo',
    '\\ No newline at end of file',
  ].join('\n')

  it('pula o cabecalho e o aviso de fim de linha; separa trecho, menos, mais e igual', () => {
    expect(lerDiff(saida)).toEqual({
      cortada: false,
      linhas: [
        { tipo: 'trecho', texto: 'function f()' },
        { tipo: 'igual', texto: 'igual' },
        { tipo: 'menos', texto: 'velho' },
        { tipo: 'mais', texto: 'novo' },
      ],
    })
  })

  it('corta no maximo e avisa', () => {
    expect(lerDiff(saida, 2)).toMatchObject({ cortada: true, linhas: [{ tipo: 'trecho' }, { tipo: 'igual' }] })
  })
})

describe('explicarRecusa', () => {
  it('arquivo fora do git que seria sobrescrito vira frase com os nomes', () => {
    const erro = [
      'error: The following untracked working tree files would be overwritten by merge:',
      '\tb.txt',
      '\tsrc/c.ts',
      'Please move or remove them before you merge.',
    ].join('\n')
    expect(explicarRecusa(erro)).toMatch(/^A pasta original tem b\.txt, src\/c\.ts fora do git/)
  })

  it('outro erro: primeira linha do git', () => {
    expect(explicarRecusa('fatal: algo\nmais')).toBe('O git não juntou: fatal: algo')
  })
})
