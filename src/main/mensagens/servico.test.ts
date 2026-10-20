import { describe, expect, it } from 'vitest'
import { limparMensagens, MAXIMO_MENSAGENS, PADRAO, ServicoMensagens, type DiscoMensagens } from './servico'

function discoNaMemoria(inicial: string | null): DiscoMensagens & { conteudo: string | null } {
  const d = {
    conteudo: inicial,
    ler: () => d.conteudo,
    gravar: (t: string) => {
      d.conteudo = t
    },
  }
  return d
}

describe('ServicoMensagens', () => {
  it('sem arquivo: as tres padrao', () => {
    expect(new ServicoMensagens(discoNaMemoria(null)).listar()).toEqual(PADRAO)
  })

  it('arquivo estragado ou fora do formato: padrao, sem quebrar', () => {
    expect(new ServicoMensagens(discoNaMemoria('{nao e json')).listar()).toEqual(PADRAO)
    expect(new ServicoMensagens(discoNaMemoria('[1, 2]')).listar()).toEqual(PADRAO)
  })

  it('salvar grava limpo e listar devolve o salvo', () => {
    const disco = discoNaMemoria(null)
    const s = new ServicoMensagens(disco)
    expect(s.salvar(['  rode o lint ', '', 'rode o lint', 'faça deploy?'])).toEqual(['rode o lint', 'faça deploy?'])
    expect(s.listar()).toEqual(['rode o lint', 'faça deploy?'])
  })

  it('lista vazia salva continua vazia (o usuario apagou todas)', () => {
    const s = new ServicoMensagens(discoNaMemoria(null))
    s.salvar([])
    expect(s.listar()).toEqual([])
  })
})

describe('limparMensagens', () => {
  it('corta na quantidade maxima', () => {
    const muitas = Array.from({ length: 40 }, (_, i) => `m${i}`)
    expect(limparMensagens(muitas)).toHaveLength(MAXIMO_MENSAGENS)
  })
})
