// O terminal mora dentro da lousa, que aplica zoom (transform: scale). O xterm calcula a linha
// e a coluna do mouse com a posicao na TELA (ja com zoom) dividida pelo tamanho da letra SEM
// zoom: fora de 100%, a selecao, o duplo clique e o clique em link caem em outra linha
// (print de 20/10/2026). Aqui o evento do mouse e reenviado com a posicao como se o zoom fosse
// 100%, so para o xterm daquele quadro.

/** Escala atual de um elemento: largura na tela / largura sem transformacao. 1 se nao der para medir. */
export function escalaDe(larguraNaTela: number, larguraSemZoom: number): number {
  if (!(larguraNaTela > 0) || !(larguraSemZoom > 0)) return 1
  return larguraNaTela / larguraSemZoom
}

/** Ponto do mouse como se o zoom fosse 100%, a partir do canto de cima do terminal na tela. Puro. */
export function pontoSemZoom(
  cliente: { x: number; y: number },
  origem: { left: number; top: number },
  escala: number,
): { x: number; y: number } {
  if (Math.abs(escala - 1) < 0.001) return cliente
  return { x: origem.left + (cliente.x - origem.left) / escala, y: origem.top + (cliente.y - origem.top) / escala }
}

const EVENTOS = ['mousedown', 'mousemove', 'mouseup', 'click', 'dblclick', 'auxclick', 'contextmenu'] as const

const BOTAO_ESQUERDO = 0
const BOTAO_MEIO = 1
/** Bit do botao do meio em `buttons` (botoes apertados durante um mousemove). */
const APERTADO_MEIO = 4

/**
 * Evento do botao do meio, que nao e corrigido: apertar ou soltar o do meio, ou mover com ele
 * apertado. A selecao do xterm e so com o esquerdo (e o direito no menu). Puro.
 */
export function usaBotaoDoMeio(e: { type: string; button: number; buttons: number }): boolean {
  if (e.type === 'mousemove') return (e.buttons & APERTADO_MEIO) !== 0
  return e.button === BOTAO_MEIO
}

/** Eventos que a propria correcao criou: passam direto, senao ela os corrigiria de novo. */
const corrigidos = new WeakSet<Event>()

function copiaCorrigida(e: MouseEvent, ponto: { x: number; y: number }): MouseEvent {
  return new MouseEvent(e.type, {
    bubbles: e.bubbles,
    cancelable: e.cancelable,
    composed: e.composed,
    view: e.view,
    detail: e.detail,
    screenX: e.screenX,
    screenY: e.screenY,
    clientX: ponto.x,
    clientY: ponto.y,
    ctrlKey: e.ctrlKey,
    shiftKey: e.shiftKey,
    altKey: e.altKey,
    metaKey: e.metaKey,
    button: e.button,
    buttons: e.buttons,
    relatedTarget: e.relatedTarget,
  })
}

/**
 * Liga a correcao para o terminal em `el`. Vale para o mouse dentro dele e, durante um arraste
 * que comecou nele, tambem fora (o xterm segue a selecao pelo documento). Devolve o desligar.
 */
export function ligarEscala(el: HTMLElement): () => void {
  let arrastando = false
  // botao do meio apertado: a lousa esta sendo arrastada (usePanoMeio), que precisa da posicao
  // real da tela em todo movimento, ate soltar (nem todo mousemove traz `buttons` preenchido)
  let meio = false
  /** Lousa sendo arrastada com o botao do meio: nada e corrigido ate soltar. */
  const arrastandoLousa = (e: MouseEvent): boolean => {
    if (e.type === 'mousedown' && e.button === BOTAO_MEIO) meio = true
    const pular = meio || usaBotaoDoMeio(e)
    if (e.type === 'mouseup' && e.button === BOTAO_MEIO) meio = false
    return pular
  }
  /** O evento e deste terminal: dentro dele, ou no documento durante um arraste que comecou nele. */
  const eDesteTerminal = (e: MouseEvent, alvo: Node): boolean => {
    if (arrastandoLousa(e)) return false
    const dentro = el.contains(alvo)
    if (e.type === 'mousedown' && dentro && e.button === BOTAO_ESQUERDO) arrastando = true
    const vale = dentro || (arrastando && (e.type === 'mousemove' || e.type === 'mouseup'))
    if (e.type === 'mouseup') arrastando = false
    return vale
  }
  const corrigir = (e: Event): void => {
    if (!(e instanceof MouseEvent) || corrigidos.has(e) || !(e.target instanceof Node)) return
    const alvo = e.target
    const tela = el.querySelector<HTMLElement>('.xterm-screen')
    if (!eDesteTerminal(e, alvo) || !tela) return
    const caixa = tela.getBoundingClientRect()
    const escala = escalaDe(caixa.width, tela.offsetWidth)
    if (Math.abs(escala - 1) < 0.001) return
    e.stopImmediatePropagation()
    const copia = copiaCorrigida(e, pontoSemZoom({ x: e.clientX, y: e.clientY }, caixa, escala))
    corrigidos.add(copia)
    alvo.dispatchEvent(copia)
    if (copia.defaultPrevented) e.preventDefault()
  }
  for (const tipo of EVENTOS) window.addEventListener(tipo, corrigir, true)
  return () => {
    for (const tipo of EVENTOS) window.removeEventListener(tipo, corrigir, true)
  }
}
