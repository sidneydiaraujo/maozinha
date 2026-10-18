import { describe, expect, it } from 'vitest'
import { pedeAtencao, textoDoAviso } from './texto'

describe('pedeAtencao', () => {
  it('esperando, terminou e erro chamam; trabalhando e parado nao', () => {
    expect(
      (['esperando', 'terminou', 'erro', 'trabalhando', 'parado'] as const).map((estado) => pedeAtencao({ estado })),
    ).toEqual([true, true, true, false, false])
  })
})

describe('textoDoAviso', () => {
  const onde = 'lousa-ia · Claude 1'

  it('frase pelo motivo, com a pasta e o quadro no titulo', () => {
    expect(textoDoAviso({ estado: 'esperando', motivo: 'permissao' }, onde)).toEqual({
      titulo: 'Pedindo sua permissão · lousa-ia · Claude 1',
      corpo: 'Clique para ver o quadro.',
    })
    expect(textoDoAviso({ estado: 'esperando', motivo: 'pergunta' }, onde).titulo).toMatch(/^Tem uma pergunta/)
    expect(textoDoAviso({ estado: 'esperando', motivo: 'login' }, onde).titulo).toMatch(/^Precisa entrar/)
    expect(textoDoAviso({ estado: 'esperando' }, onde).titulo).toMatch(/^Esperando você/)
    expect(textoDoAviso({ estado: 'erro' }, onde).titulo).toMatch(/^Parou com erro/)
  })

  it('a frase do Claude vira o corpo', () => {
    expect(textoDoAviso({ estado: 'terminou', mensagem: 'Testes passando' }, onde)).toEqual({
      titulo: 'Terminou · lousa-ia · Claude 1',
      corpo: 'Testes passando',
    })
  })
})
