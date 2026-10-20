// Letra nitida com a lousa fora de 100% (A1, aceite 0.2.0). A lousa aplica zoom com
// transform: scale, e o xterm (WebGL ou nao) desenha num canvas no tamanho de 100%: o navegador
// estica ou encolhe a imagem pronta e a letra borra (print de 20/10/2026). Aqui o terminal
// desfaz o zoom da lousa (scale 1/zoom), ocupa o mesmo lugar na tela e desenha a letra ja no
// tamanho final (fonte x zoom). Tambem encosta o canvas no pixel inteiro, senao borra de novo.
import type { Terminal } from '@xterm/xterm'

/** Abaixo disso (lousa bem afastada) a letra nao se le de jeito nenhum: fica a imagem encolhida. */
export const FONTE_MINIMA_NITIDA = 6

/** Margem do terminal a 100% (igual ao terminal.css): em cima e a esquerda, em px. */
const MARGEM = { topo: 6, esquerda: 8 }

/** Zoom a desfazer, ou null quando nao precisa (100%) ou nao adianta (letra miuda demais). Puro. */
export function zoomACompensar(zoom: number, fonte: number): number | null {
  if (!(zoom > 0) || Math.abs(zoom - 1) < 0.005) return null
  return fonte * zoom < FONTE_MINIMA_NITIDA ? null : zoom
}

/** Tamanho da letra ja na tela, em meios pixels (o xterm mede a celula com ele). Puro. */
export function fonteNaTela(fonte: number, zoom: number): number {
  return Math.round(fonte * zoom * 2) / 2
}

/** Quanto mover (em px de tela) para a posicao cair num pixel inteiro do monitor. Puro. */
export function ajusteSubpixel(posicao: number, dpr: number): number {
  const escala = dpr > 0 ? dpr : 1
  return Math.round(posicao * escala) / escala - posicao
}

export interface Nitidez {
  /** O zoom da lousa mudou (ja parado). */
  zoom(zoom: number): void
  /** Tamanho da letra a 100% (Ctrl+roda, Aparencia). */
  fonte(base: number): void
  base(): number
  /** A lousa foi arrastada: encosta o canvas no pixel inteiro de novo. */
  alinhar(): void
}

/** `el` e o recipiente do xterm; `reajustar` recalcula colunas e linhas (acompanharTamanho). */
export function ligarNitidez(el: HTMLElement, term: Terminal, base: number, reajustar: () => void): Nitidez {
  let zoomAtual = 1
  let fonteBase = base
  let compensado: number | null = null
  const transformar = (z: number, dx = 0, dy = 0): void => {
    el.style.transform = `scale(${1 / z}) translate(${dx}px, ${dy}px)`
  }
  const alinhar = (): void => {
    if (compensado === null) return
    transformar(compensado)
    const caixa = el.getBoundingClientRect()
    const dpr = window.devicePixelRatio
    transformar(compensado, ajusteSubpixel(caixa.left, dpr), ajusteSubpixel(caixa.top, dpr))
  }
  const aplicar = (): void => {
    compensado = zoomACompensar(zoomAtual, fonteBase)
    const s = el.style
    if (compensado === null) {
      s.width = s.height = s.padding = s.transform = s.transformOrigin = ''
      term.options.fontSize = fonteBase
    } else {
      const z = compensado
      s.width = s.height = `${100 * z}%`
      s.padding = `${MARGEM.topo * z}px 0 0 ${MARGEM.esquerda * z}px`
      s.transformOrigin = '0 0'
      transformar(z)
      term.options.fontSize = fonteNaTela(fonteBase, z)
    }
    reajustar()
    requestAnimationFrame(alinhar)
  }
  return {
    zoom: (z) => {
      if (z === zoomAtual) return
      zoomAtual = z
      aplicar()
    },
    fonte: (f) => {
      fonteBase = f
      aplicar()
    },
    base: () => fonteBase,
    alinhar,
  }
}

/** A lousa avisa quando parou de mexer (Lousa.tsx, onMoveEnd): cada terminal se realinha. */
export const EVENTO_VISTA_PAROU = 'lousa:vista-parou'
