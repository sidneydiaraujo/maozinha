import { describe, expect, it } from 'vitest'
import type { EstadoTela, Quadro, Repo } from '../../../shared/model'
import { comProjeto, projetoDo } from './projeto'

const caixa = { x: 0, y: 0, largura: 640, altura: 420 }
const quadro = (id: string, extra: Partial<Quadro> = {}): Quadro => ({ id, repoId: 'casa', perfilId: 'p', tipo: 'agente', titulo: id, caixa, ...extra })
const repo = (id: string): Repo => ({ id, nome: id, caminho: `C:\${id}`, perfilPadraoId: 'p' })
const estado = (quadros: Quadro[], repos: Repo[]): EstadoTela => ({ perfis: [], repos, quadros, viewport: { x: 0, y: 0, zoom: 1 } })

describe('comProjeto (D65)', () => {
  it('troca o quadro e poe a pasta do projeto na lista uma vez so', () => {
    const e = estado([quadro('a'), quadro('b')], [repo('casa')])
    const depois = comProjeto(e, quadro('a', { projeto: 'app' }), repo('app'))
    expect(depois.quadros.map((q) => q.projeto)).toEqual(['app', undefined])
    expect(depois.repos.map((r) => r.id)).toEqual(['casa', 'app'])
    expect(comProjeto(depois, quadro('b', { projeto: 'app' }), repo('app')).repos).toHaveLength(2)
  })

  it('quadro que ja saiu da lousa: nada muda', () => {
    const e = estado([quadro('a')], [repo('casa')])
    expect(comProjeto(e, quadro('x', { projeto: 'app' }), repo('app'))).toBe(e)
  })
})

describe('projetoDo', () => {
  const repos = new Map([['app', repo('app')]])
  it('o projeto achado; sem projeto ou com a pasta fora da lista, nada', () => {
    expect(projetoDo(quadro('a', { projeto: 'app' }), repos)?.nome).toBe('app')
    expect(projetoDo(quadro('a'), repos)).toBeNull()
    expect(projetoDo(quadro('a', { projeto: 'sumiu' }), repos)).toBeNull()
  })
})
