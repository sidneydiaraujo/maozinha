import { describe, expect, it } from 'vitest'
import type { EstadoTela, PerfilComConta } from '../../../shared/model'
import { algumQuadroVisivel, caixaDoNo, montarNos, type AcoesLousa } from './nos'

const acoes: AcoesLousa = { removerQuadro: () => undefined, trocarConta: async () => {}, abrirArquivo: () => undefined, ampliar: () => undefined, definirPapel: async () => {} }
const caixa = { x: 10, y: 20, largura: 300, altura: 200 }
const perfil = (id: string): PerfilComConta => ({
  id, provedor: 'claude', nome: id, cor: '#123456', configDir: '', ehPadrao: false, raizes: [],
  conta: { logado: true, email: null, plano: null, erro: null },
})

const estado: EstadoTela = {
  perfis: [perfil('principal'), perfil('pessoal')],
  repos: [{ id: 'r1', nome: 'app', caminho: 'C:\\app', perfilPadraoId: 'principal' }],
  quadros: [
    { id: 'q1', repoId: 'r1', perfilId: 'principal', tipo: 'agente', titulo: 'Claude 1', caixa },
    { id: 'q2', repoId: 'r1', perfilId: 'pessoal', tipo: 'agente', titulo: 'Claude 2', caixa },
    { id: 'orfao', repoId: 'sumiu', perfilId: 'principal', tipo: 'terminal', titulo: 'Terminal 1', caixa },
  ],
  viewport: { x: 0, y: 0, zoom: 1 },
}

describe('montarNos', () => {
  const nos = montarNos(estado, acoes)

  it('so quadros, soltos na lousa (sem pai); quadro de pasta inexistente some', () => {
    expect(nos.map((n) => n.id)).toEqual(['q1', 'q2'])
    expect(nos.every((n) => n.parentId === undefined)).toBe(true)
  })

  it('cada quadro leva a sua conta e a pasta, mesmo na mesma pasta', () => {
    expect(nos.map((n) => n.data.perfil?.id)).toEqual(['principal', 'pessoal'])
    expect(nos.map((n) => n.data.repo.nome)).toEqual(['app', 'app'])
  })

  it('o nome e a pasta, numerada a partir do segundo quadro nela (D14)', () => {
    expect(nos.map((n) => n.data.rotulo)).toEqual(['app', 'app 2'])
  })

  it('o quadro pode ir para qualquer conta do mesmo provedor', () => {
    const comCodex = { ...estado, perfis: [...estado.perfis, { ...perfil('cx:x'), provedor: 'codex' as const }] }
    expect(montarNos(comCodex, acoes)[0]?.data.contas.map((p) => p.id)).toEqual(['principal', 'pessoal'])
  })

  it('posicao e tamanho vem da caixa salva', () => {
    expect(nos[0]).toMatchObject({ position: { x: 10, y: 20 }, style: { width: 300, height: 200 } })
  })
})

describe('caixaDoNo', () => {
  it('le posicao e o tamanho do style', () => {
    expect(caixaDoNo({ id: 'a', position: { x: 1, y: 2 }, data: {}, style: { width: 300, height: 200 } })).toEqual({
      x: 1, y: 2, largura: 300, altura: 200,
    })
  })

  it('depois de redimensionar width/height mandam no style', () => {
    const no = { id: 'a', position: { x: 0, y: 0 }, data: {}, style: { width: 300, height: 200 }, width: 640, height: 480 }
    expect(caixaDoNo(no)).toMatchObject({ largura: 640, altura: 480 })
  })
})

describe('algumQuadroVisivel', () => {
  it('vista em cima do quadro: visivel; vista longe (caso real de 14/10): nao', () => {
    expect(algumQuadroVisivel(estado.quadros, { x: 0, y: 0, zoom: 1 })).toBe(true)
    expect(algumQuadroVisivel(estado.quadros, { x: -223, y: 1368, zoom: 0.35 })).toBe(false)
  })
})
