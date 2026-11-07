import { describe, expect, it } from 'vitest'
import { CicloDosQuadros, MOMENTOS } from './ciclo'
import { inscreverNoCiclo, type QuemGuardaPorQuadro } from './inscricoes'

function montar() {
  const feito: string[] = []
  const anota = (nome: string) => ({ esquecer: (id: string) => void feito.push(`${nome}:${id}`) })
  const s: QuemGuardaPorQuadro = {
    terminais: { fechar: (id) => void feito.push(`terminal:${id}`) },
    agentes: anota('painel'),
    compactarSozinho: anota('compactar'),
    avisos: anota('notificação'),
    ajustes: anota('ajustes'),
    ondeEscreve: anota('ondeEscreve'),
    pedidos: anota('pedidos'),
    mcp: anota('mcp'),
    mensagens: anota('mensagens'),
    repasse: anota('repasse'),
    espera: anota('espera'),
  }
  const ciclo = new CicloDosQuadros(() => {})
  inscreverNoCiclo(ciclo, s)
  return { ciclo, feito, s }
}

describe('inscreverNoCiclo (R4.18)', () => {
  it('quadro que sai da lousa: todos esquecem, o terminal primeiro', () => {
    const { ciclo, feito, s } = montar()
    ciclo.aconteceu('saiu', 'q')
    expect(feito[0]).toBe('terminal:q')
    // um servico novo em QuemGuardaPorQuadro sem inscricao quebra esta conta
    expect(feito).toHaveLength(Object.keys(s).length)
  })

  it('troca de modelo: so terminal, painel e compactar (a fila espera o agente reaberto)', () => {
    const { ciclo, feito } = montar()
    ciclo.aconteceu('reabriu', 'q')
    expect(feito).toEqual(['terminal:q', 'painel:q', 'compactar:q'])
  })

  it('dormiu: terminal, painel, compactar e a notificacao; fila, espera e chave ficam', () => {
    const { ciclo, feito } = montar()
    ciclo.aconteceu('dormiu', 'q')
    expect(feito).toEqual(['terminal:q', 'painel:q', 'compactar:q', 'notificação:q'])
  })

  it('todo momento tem o terminal', () => {
    const { ciclo } = montar()
    for (const m of MOMENTOS) expect(ciclo.nomes(m)[0]).toBe('terminal')
  })
})
