import { describe, expect, it } from 'vitest'
import type { Ligacao, Quadro } from '../../shared/model'
import { colegasLivres } from './reaproveitar'

const quadro = (id: string, extra: Partial<Quadro> = {}): Quadro =>
  ({ id, repoId: 'r1', tipo: 'agente', perfilId: 'p', titulo: id, caixa: { x: 0, y: 0, largura: 1, altura: 1 }, ...extra }) as Quadro
const linha = (para: string, extra: Partial<Ligacao> = {}): Ligacao => ({ id: `l-${para}`, de: 'lider', para, modo: 'automatico', pedida: true, ...extra })

describe('colegasLivres', () => {
  const quadros = [quadro('lider'), quadro('c1'), quadro('c2', { repoId: 'copia' }), quadro('c3', { dormindo: true }), quadro('t1', { tipo: 'terminal' })]
  const ligacoes = [linha('c1'), linha('c2'), linha('c3'), linha('t1')]
  const ids = (paralelo: boolean, livre = (_: string) => true) =>
    colegasLivres({ quadros, ligacoes }, 'lider', paralelo, livre).map((x) => x.quadro.id)

  it('so os colegas acordados que o lider pediu; dormindo e terminal ficam de fora', () => {
    expect(ids(false)).toEqual(['c1', 'c2'])
  })

  it('paralelo so reaproveita quem esta na pasta do lider', () => {
    expect(ids(true)).toEqual(['c1'])
  })

  it('colega ocupado ou com o terminal fechado nao serve', () => {
    expect(ids(false, (id) => id !== 'c1')).toEqual(['c2'])
  })

  it('linha feita pelo usuario (sem `pedida`) ou de outro lider: nada', () => {
    const outras = [linha('c1', { pedida: undefined }), linha('c2', { de: 'outro' })]
    expect(colegasLivres({ quadros, ligacoes: outras }, 'lider', false, () => true)).toEqual([])
    expect(colegasLivres({ quadros, ligacoes }, 'sumiu', false, () => true)).toEqual([])
  })
})
