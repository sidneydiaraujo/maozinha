import { describe, expect, it } from 'vitest'
import { CicloDosQuadros } from './ciclo'

function servico(nome: string, registro: string[]) {
  return { esquecer: (id: string) => void registro.push(`${nome}:${id}`) }
}

describe('CicloDosQuadros (R4.18)', () => {
  it('cada momento chama so quem se inscreveu nele, na ordem da inscricao', () => {
    const feito: string[] = []
    const ciclo = new CicloDosQuadros(() => {})
    ciclo.inscrever('terminal', servico('terminal', feito), ['saiu', 'reabriu', 'dormiu'])
    ciclo.inscrever('painel', servico('painel', feito), ['saiu', 'dormiu'])
    ciclo.inscrever('fila', servico('fila', feito))

    ciclo.aconteceu('reabriu', 'q1')
    expect(feito).toEqual(['terminal:q1'])
    feito.length = 0
    ciclo.aconteceu('dormiu', 'q2')
    expect(feito).toEqual(['terminal:q2', 'painel:q2'])
    feito.length = 0
    ciclo.aconteceu('saiu', 'q3')
    expect(feito).toEqual(['terminal:q3', 'painel:q3', 'fila:q3'])
  })

  it('um servico que lanca nao impede os seguintes e vira aviso', () => {
    const feito: string[] = []
    const falhas: string[] = []
    const ciclo = new CicloDosQuadros((nome, id) => falhas.push(`${nome}:${id}`))
    ciclo.inscrever('ruim', {
      esquecer: () => {
        throw new Error('quebrou')
      },
    })
    ciclo.inscrever('bom', servico('bom', feito))
    ciclo.aconteceu('saiu', 'q1')
    expect(falhas).toEqual(['ruim:q1'])
    expect(feito).toEqual(['bom:q1'])
  })

  it('recusa o mesmo nome duas vezes e inscricao sem momento', () => {
    const ciclo = new CicloDosQuadros(() => {})
    ciclo.inscrever('painel', servico('painel', []))
    expect(() => ciclo.inscrever('painel', servico('painel', []))).toThrow(/já está/)
    expect(() => ciclo.inscrever('vazio', servico('vazio', []), [])).toThrow(/pelo menos/)
  })

  it('nomes lista quem esquece em cada momento', () => {
    const ciclo = new CicloDosQuadros(() => {})
    ciclo.inscrever('a', servico('a', []), ['saiu', 'dormiu'])
    ciclo.inscrever('b', servico('b', []))
    expect(ciclo.nomes('saiu')).toEqual(['a', 'b'])
    expect(ciclo.nomes('dormiu')).toEqual(['a'])
    expect(ciclo.nomes('reabriu')).toEqual([])
  })
})
