import { describe, expect, it } from 'vitest'
import { cabeNaTela, estadoDe, lerEstadoJanela } from './estadoJanela'

const salvo = { x: 100, y: 50, largura: 1400, altura: 900, maximizada: true }
const telaPrincipal = { x: 0, y: 0, width: 1920, height: 1040 }
const telaDaDireita = { x: 1920, y: 0, width: 1920, height: 1040 }

describe('lerEstadoJanela', () => {
  it('le o que foi gravado; lixo, faltando campo ou tamanho absurdo = null', () => {
    expect(lerEstadoJanela(JSON.stringify(salvo))).toEqual(salvo)
    expect(lerEstadoJanela('{nao e json')).toBeNull()
    expect(lerEstadoJanela(JSON.stringify({ ...salvo, maximizada: undefined }))).toBeNull()
    expect(lerEstadoJanela(JSON.stringify({ ...salvo, largura: 10 }))).toBeNull()
  })
})

describe('cabeNaTela', () => {
  it('janela na tela principal ou na segunda tela vale', () => {
    expect(cabeNaTela(salvo, [telaPrincipal])).toBe(true)
    expect(cabeNaTela({ ...salvo, x: 2100 }, [telaPrincipal, telaDaDireita])).toBe(true)
  })

  it('janela que estava na segunda tela, agora desligada, nao vale', () => {
    expect(cabeNaTela({ ...salvo, x: 2100 }, [telaPrincipal])).toBe(false)
  })

  it('barra de titulo para fora (em cima ou quase toda de lado) nao vale', () => {
    expect(cabeNaTela({ ...salvo, y: -200 }, [telaPrincipal])).toBe(false)
    expect(cabeNaTela({ ...salvo, x: 1850 }, [telaPrincipal])).toBe(false)
    expect(cabeNaTela({ ...salvo, x: -1300 }, [telaPrincipal])).toBe(false)
  })
})

describe('estadoDe', () => {
  it('arredonda a caixa do Electron', () => {
    expect(estadoDe({ x: 10.4, y: 20.6, width: 1399.5, height: 900 }, false)).toEqual({
      x: 10,
      y: 21,
      largura: 1400,
      altura: 900,
      maximizada: false,
    })
  })
})
