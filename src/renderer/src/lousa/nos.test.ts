import { describe, expect, it } from 'vitest'
import type { EstadoTela, PerfilComConta } from '../../../shared/model'
import { montarNos, type AcoesLousa } from './nos'

const acoes: AcoesLousa = { criarQuadro: () => undefined, removerQuadro: () => undefined }
const caixa = { x: 10, y: 20, largura: 300, altura: 200 }
const perfil = (id: string): PerfilComConta => ({
  id, provedor: 'claude', nome: id, cor: '#123456', configDir: '', ehPadrao: false, raizes: [],
  conta: { logado: true, email: null, plano: null, erro: null },
})

const estado: EstadoTela = {
  perfis: [perfil('principal'), perfil('pessoal')],
  repos: [{ id: 'r1', nome: 'app', caminho: 'C:\\app', perfilPadraoId: 'principal', caixa }],
  quadros: [
    { id: 'q1', repoId: 'r1', perfilId: 'principal', tipo: 'agente', titulo: 'Claude 1', caixa },
    { id: 'q2', repoId: 'r1', perfilId: 'pessoal', tipo: 'agente', titulo: 'Claude 2', caixa },
    { id: 'orfao', repoId: 'sumiu', perfilId: 'principal', tipo: 'terminal', titulo: 'Terminal 1', caixa },
  ],
  viewport: { x: 0, y: 0, zoom: 1 },
}

describe('montarNos', () => {
  const nos = montarNos(estado, acoes)

  it('a moldura do repo vem antes dos quadros e quadro de repo inexistente some', () => {
    expect(nos.map((n) => n.id)).toEqual(['repo:r1', 'q1', 'q2'])
  })

  it('quadros sao filhos presos a moldura', () => {
    const q = nos[1]
    expect(q).toMatchObject({ type: 'quadro', parentId: 'repo:r1', extent: 'parent' })
  })

  it('cada quadro leva a sua propria conta, mesmo dentro do mesmo repo', () => {
    const contas = nos.filter((n) => n.type === 'quadro').map((n) => (n.data as { perfil?: PerfilComConta }).perfil?.id)
    expect(contas).toEqual(['principal', 'pessoal'])
  })

  it('posicao e tamanho vem da caixa salva', () => {
    expect(nos[0]).toMatchObject({ position: { x: 10, y: 20 }, style: { width: 300, height: 200 } })
  })
})
