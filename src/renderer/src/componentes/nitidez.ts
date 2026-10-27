// Letra nitida com a lousa fora de 100% (A1, aceite 0.2.0). A lousa aplica zoom com
// transform: scale, e o xterm (WebGL ou nao) desenha num canvas no tamanho de 100%: o navegador
// estica ou encolhe a imagem pronta e a letra borra (print de 20/10/2026). Aqui o terminal
// desfaz o zoom da lousa (scale 1/zoom), ocupa o mesmo lugar na tela e desenha a letra ja no
// tamanho final (fonte x zoom). Tambem encosta o canvas no pixel inteiro, senao borra de novo.
// D46: so redesenha quando alguem consegue ler; com a lousa vista de cima, o terminal para.
import type { Terminal } from '@xterm/xterm'

/**
 * Letra na tela (px) abaixo da qual ninguem le (A1). O quadro em que o usuario esta ainda desenha
 * nitido ate aqui; os outros param de desenhar (D46).
 */
export const FONTE_MINIMA_NITIDA = 6
/** Quadro sem o foco so redesenha nitido no zoom com a letra legivel; abaixo, so a imagem (D46). */
export const LETRA_LEGIVEL = 9

/**
 * Como o terminal se desenha neste zoom (D46). Puro.
 * - nitido: desfaz o zoom da lousa e redesenha com a letra no tamanho da tela (A1);
 * - imagem: a imagem de 100% esticada ou encolhida, sem redesenhar a cada zoom;
 * - pausado: letra miuda demais (lousa vista de cima): o xterm para de desenhar e o quadro mostra
 *   a capa. O quadro com o foco (onde o usuario esta) nunca pausa e e nitido desde a minima.
 */
export type Desenho = 'nitido' | 'imagem' | 'pausado'

export function desenhoNoZoom(zoom: number, fonte: number, ativo: boolean): Desenho {
  if (!(zoom > 0)) return 'imagem'
  const naTela = fonte * zoom
  if (naTela < FONTE_MINIMA_NITIDA) return ativo ? 'imagem' : 'pausado'
  if (Math.abs(zoom - 1) < 0.005) return 'imagem'
  return naTela >= (ativo ? FONTE_MINIMA_NITIDA : LETRA_LEGIVEL) ? 'nitido' : 'imagem'
}

/** Margem do terminal a 100% (igual ao terminal.css): em cima e a esquerda, em px. */
const MARGEM = { topo: 6, esquerda: 8 }

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
  /** O usuario entrou ou saiu deste terminal (foco do teclado). */
  ativo(ativo: boolean): void
  /** A lousa foi arrastada: encosta o canvas no pixel inteiro de novo. */
  alinhar(): void
}

/**
 * `el` e o recipiente do xterm; `reajustar` recalcula colunas e linhas (acompanharTamanho);
 * `aoPausar` avisa a tela para mostrar ou tirar a capa do quadro.
 */
export function ligarNitidez(
  el: HTMLElement,
  term: Terminal,
  base: number,
  { reajustar, aoPausar }: { reajustar(): void; aoPausar(pausado: boolean): void },
): Nitidez {
  let zoomAtual = 1
  let fonteBase = base
  let comFoco = false
  let pausado = false
  let compensado: number | null = null
  let aplicado = ''
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
  // escondido, o xterm para de desenhar sozinho (ele observa se a tela dele aparece); o recipiente
  // fica do mesmo tamanho, entao colunas e linhas nao mudam e o programa nao e avisado
  const pausar = (sim: boolean): void => {
    if (sim === pausado) return
    pausado = sim
    if (term.element) term.element.style.display = sim ? 'none' : ''
    aoPausar(sim)
  }
  const aplicar = (): void => {
    const desenho = desenhoNoZoom(zoomAtual, fonteBase, comFoco)
    pausar(desenho === 'pausado')
    compensado = desenho === 'nitido' ? zoomAtual : null
    // imagem (ou pausa) com a mesma letra nao precisa de nada: e o que poupa o zoom afastado
    const chave = `${compensado ?? '-'}|${fonteBase}`
    if (chave === aplicado) return
    aplicado = chave
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
    ativo: (a) => {
      if (a === comFoco) return
      comFoco = a
      aplicar()
    },
    alinhar,
  }
}

/** A lousa avisa quando parou de mexer (Lousa.tsx, onMoveEnd): cada terminal se realinha. */
export const EVENTO_VISTA_PAROU = 'lousa:vista-parou'
