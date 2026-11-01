import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { ehProjeto, localDoKanban, pastaDoProjeto } from './projeto'

const HOME = 'C:\\Users\\x'
const existe =
  (...caminhos: string[]) =>
  (c: string): boolean =>
    caminhos.includes(c)

describe('pastaDoProjeto (A16)', () => {
  it('home com varios projetos: a pasta com .git mais proxima do arquivo', () => {
    const e = existe(join(HOME, 'pessoal', 'app', '.git'))
    expect(pastaDoProjeto(join(HOME, 'pessoal', 'app', 'src', 'a.ts'), HOME, e)).toBe('pessoal/app')
  })

  it('projeto dentro de projeto (monorepo): o mais proximo', () => {
    const e = existe(join(HOME, 'mono', '.git'), join(HOME, 'mono', 'pacotes', 'web', 'package.json'))
    expect(pastaDoProjeto(join(HOME, 'mono', 'pacotes', 'web', 'src', 'b.ts'), HOME, e)).toBe('mono/pacotes/web')
  })

  it('a raiz e o projeto: ela mesma (a bolinha fica na raiz)', () => {
    const raiz = join(HOME, 'app')
    const e = existe(join(raiz, 'package.json'))
    expect(pastaDoProjeto(join(raiz, 'src', 'x', 'c.ts'), raiz, e)).toBe('')
    expect(pastaDoProjeto(join(raiz, 'README.md'), raiz, e)).toBe('')
  })

  it('nada com cara de projeto numa pasta grande: a primeira pasta abaixo da raiz', () => {
    expect(pastaDoProjeto(join(HOME, 'notas', '2026', 'n.md'), HOME, existe())).toBe('notas')
  })

  it('fora da raiz, em node_modules, .git, dist ou pasta escondida: nada', () => {
    const e = existe()
    expect(pastaDoProjeto('D:\\outro\\a.ts', HOME, e)).toBeNull()
    expect(pastaDoProjeto(join(HOME, 'app', 'node_modules', 'x', 'i.js'), HOME, e)).toBeNull()
    expect(pastaDoProjeto(join(HOME, 'app', 'dist', 'i.js'), HOME, e)).toBeNull()
    expect(pastaDoProjeto(join(HOME, '.claude', 'settings.json'), HOME, e)).toBeNull()
  })

  it('o KANBAN.md nao faz da pasta um projeto (e o Mãozinha que cria)', () => {
    expect(ehProjeto(HOME, existe(join(HOME, 'KANBAN.md')))).toBe(false)
    expect(ehProjeto(HOME, existe(join(HOME, 'CLAUDE.md')))).toBe(true)
  })
})

describe('localDoKanban (A22)', () => {
  const MONO = join(HOME, 'mono')
  const WEB = join(MONO, 'pacotes', 'web')

  it('dentro de um repositorio: o kanban que ja existe acima, ate a raiz', () => {
    const e = existe(join(MONO, '.git'), join(MONO, 'KANBAN.md'))
    expect(localDoKanban(WEB, e)).toEqual({ pasta: MONO, existe: true, git: true })
  })

  it('o mais perto vale primeiro; sem nenhum, a raiz do repositorio', () => {
    expect(localDoKanban(WEB, existe(join(MONO, '.git'), join(WEB, 'KANBAN.md'))).pasta).toBe(WEB)
    expect(localDoKanban(WEB, existe(join(MONO, '.git')))).toEqual({ pasta: MONO, existe: false, git: true })
  })

  it('fora de git: so a propria pasta (um KANBAN.md na home nao conta)', () => {
    expect(localDoKanban(WEB, existe(join(HOME, 'KANBAN.md')))).toEqual({ pasta: WEB, existe: false, git: false })
  })

  it('nao passa da raiz do repositorio', () => {
    const e = existe(join(MONO, '.git'), join(HOME, 'KANBAN.md'))
    expect(localDoKanban(WEB, e)).toEqual({ pasta: MONO, existe: false, git: true })
  })
})
