// Tamanho e posicao da janela entre uma abertura e outra (T8.7). Funcoes puras: o window.ts
// le e grava o arquivo (<userData>\janela.json) e pergunta ao Electron quais telas estao ligadas.
import { z } from 'zod'

export interface EstadoJanela {
  x: number
  y: number
  largura: number
  altura: number
  maximizada: boolean
}

export interface Retangulo {
  x: number
  y: number
  width: number
  height: number
}

const Esquema = z.object({
  x: z.number().int(),
  y: z.number().int(),
  largura: z.number().int().min(400).max(20_000),
  altura: z.number().int().min(300).max(20_000),
  maximizada: z.boolean(),
})

/** Arquivo estragado ou de outra versao = null (abre no tamanho padrao). */
export function lerEstadoJanela(texto: string): EstadoJanela | null {
  try {
    const r = Esquema.safeParse(JSON.parse(texto))
    return r.success ? r.data : null
  } catch {
    return null
  }
}

/** Faixa de cima da janela (onde se arrasta) que precisa aparecer numa tela: 120 x 30 px. */
const VISIVEL = { largura: 120, altura: 30 }

/** O salvo so vale se a barra de titulo cair numa tela ligada (monitor desligado = padrao). */
export function cabeNaTela(e: EstadoJanela, telas: Retangulo[]): boolean {
  return telas.some((t) => {
    const largura = Math.min(e.x + e.largura, t.x + t.width) - Math.max(e.x, t.x)
    const altura = Math.min(e.y + VISIVEL.altura, t.y + t.height) - Math.max(e.y, t.y)
    return largura >= VISIVEL.largura && altura >= VISIVEL.altura
  })
}

export function estadoDe(caixa: Retangulo, maximizada: boolean): EstadoJanela {
  return {
    x: Math.round(caixa.x),
    y: Math.round(caixa.y),
    largura: Math.round(caixa.width),
    altura: Math.round(caixa.height),
    maximizada,
  }
}
