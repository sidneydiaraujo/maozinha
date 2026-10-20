import { describe, expect, it } from 'vitest'
import { textoDoSoltar } from './soltar'

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
