import { describe, expect, it } from 'vitest'
import type { EstadoTela, Quadro } from '../../../shared/model'
import { frasesDoResumo, semQuadro, sugerirSeparado, textoDoFim } from './copia'

const caixa = { x: 0, y: 0, largura: 1, altura: 1 }
const quadro = (id: string, repoId: string): Quadro => ({
  id, repoId, perfilId: 'p', tipo: 'agente', titulo: id, caixa,
})

describe('sugerirSeparado', () => {
  it('so quando a pasta ja tem quadro', () => {
    const quadros = [quadro('q1', 'r1')]
    expect(sugerirSeparado(quadros, 'r1')).toBe(true)
    expect(sugerirSeparado(quadros, 'r2')).toBe(false)
    expect(sugerirSeparado(quadros, null)).toBe(false)
  })
})

describe('textoDoFim', () => {
  it('uma frase por caso, nada quando nao era copia', () => {
    expect(textoDoFim({ copia: 'nenhuma' })).toBeNull()
    expect(textoDoFim({ copia: 'apagada' })).toContain('apagada')
    expect(textoDoFim({ copia: 'branchGuardada', branch: 'lousa/claude-1' })).toContain('branch lousa/claude-1')
    expect(textoDoFim({ copia: 'mantida', caminho: 'C:\\a.copias\\c', motivo: 'Tem alterações' })).toBe(
      'Cópia mantida em C:\\a.copias\\c: tem alterações.',
    )
  })
})

describe('frasesDoResumo', () => {
  const base = { branch: 'lousa/claude-1', branchAlvo: 'main', pendente: false }
  it('soma as linhas e fala no singular quando e um', () => {
    const r = { ...base, commits: 1, totalArquivos: 1, arquivos: [{ caminho: 'a', mais: 3, menos: 1 }] }
    expect(frasesDoResumo(r)).toEqual({
      titulo: '1 commit da branch lousa/claude-1, 1 arquivo (+3 −1), para juntar em main.',
      aviso: null,
    })
  })
  it('sem commit e com pendencia', () => {
    const r = { ...base, commits: 0, totalArquivos: 0, arquivos: [], pendente: true }
    expect(frasesDoResumo(r).titulo).toContain('não tem commit novo')
    expect(frasesDoResumo(r).aviso).toContain('sem commit')
  })
})

describe('semQuadro', () => {
  const estado: EstadoTela = {
    perfis: [],
    repos: [
      { id: 'r1', nome: 'app', caminho: 'C:\\app', perfilPadraoId: 'p' },
      { id: 'c1', nome: 'app ⑂ claude-1', caminho: 'C:\\app.copias\\claude-1', perfilPadraoId: 'p' },
    ],
    quadros: [quadro('q1', 'r1'), quadro('q2', 'c1')],
    viewport: { x: 0, y: 0, zoom: 1 },
  }

  it('copia apagada leva a pasta junto', () => {
    const e = semQuadro(estado, 'q2', { copia: 'apagada' })
    expect(e.quadros.map((q) => q.id)).toEqual(['q1'])
    expect(e.repos.map((r) => r.id)).toEqual(['r1'])
  })

  it('copia mantida fica na lista; pasta comum nunca sai', () => {
    expect(semQuadro(estado, 'q2', { copia: 'mantida', caminho: 'x', motivo: 'y' }).repos).toHaveLength(2)
    expect(semQuadro(estado, 'q1', { copia: 'nenhuma' }).repos).toHaveLength(2)
  })
})
