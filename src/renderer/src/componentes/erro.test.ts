import { describe, expect, it } from 'vitest'
import { mensagemDe } from './erro'

describe('mensagemDe', () => {
  it('tira o prefixo do Electron e mantem a mensagem do main', () => {
    const e = new Error("Error invoking remote method 'perfis:criar': Error: Nome reservado")
    expect(mensagemDe(e)).toBe('Nome reservado')
    expect(mensagemDe(new Error('Falhou'))).toBe('Falhou')
    expect(mensagemDe('texto')).toBe('texto')
  })
})
