import { describe, expect, it } from 'vitest'
import { abririaNaJanela, textoDoSoltar } from './soltar'

describe('textoDoSoltar', () => {
  it('um arquivo: caminho entre aspas e um espaco para seguir digitando', () => {
    expect(textoDoSoltar(['C:\\prints\\tela 1.png'])).toBe('"C:\\prints\\tela 1.png" ')
  })

  it('varios arquivos: separados por espaco, na ordem', () => {
    expect(textoDoSoltar(['C:\\a.png', 'C:\\b.jpg'])).toBe('"C:\\a.png" "C:\\b.jpg" ')
  })

  it('arquivo que nao veio do disco (caminho vazio) fica de fora; nenhum = nada', () => {
    expect(textoDoSoltar(['', 'C:\\a.png'])).toBe('"C:\\a.png" ')
    expect(textoDoSoltar([''])).toBe('')
    expect(textoDoSoltar([])).toBe('')
  })
})

describe('abririaNaJanela', () => {
  it('arquivo e link soltos abririam no lugar da tela (R2.7)', () => {
    expect(abririaNaJanela(['Files'])).toBe(true)
    expect(abririaNaJanela(['text/uri-list', 'text/plain'])).toBe(true)
  })

  it('texto e a conta arrastada para a lousa seguem', () => {
    expect(abririaNaJanela(['text/plain'])).toBe(false)
    expect(abririaNaJanela(['application/lousa-perfil'])).toBe(false)
  })
})
