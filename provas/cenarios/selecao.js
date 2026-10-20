// estado: demo
// Selecao com o mouse com a lousa fora de 100% (print do Sidney, 20/10/2026): arrastar sobre
// "linha-20" tem de pintar a selecao em cima de "linha-20", com a lousa reduzida (80%) e
// ampliada (115%). Antes da correcao, a faixa caia em outra linha. Fotos reduzida e ampliada.
;(async () => {
  const { espera } = prova
  const q = (s) => document.querySelector(s)
  const todos = (s) => [...document.querySelectorAll(s)]
  const r = {}
  const texto = (id) => todos(`[data-quadro="${id}"] .xterm-rows > div`).map((d) => d.textContent).join('').replace(/\s+/g, '')
  const ate = async (condicao, vezes = 40) => {
    for (let i = 0; i < vezes && !condicao(); i++) await espera(250)
    return !!condicao()
  }
  /** Retangulo, na tela, de um trecho de texto visivel no terminal (a ultima ocorrencia). */
  const trecho = (id, alvo) => {
    const andar = document.createTreeWalker(q(`[data-quadro="${id}"] .xterm-rows`), NodeFilter.SHOW_TEXT)
    let achado = null
    for (let no = andar.nextNode(); no; no = andar.nextNode()) {
      const i = no.textContent.indexOf(alvo)
      if (i < 0) continue
      const faixa = document.createRange()
      faixa.setStart(no, i)
      faixa.setEnd(no, i + alvo.length)
      achado = faixa.getBoundingClientRect()
    }
    return achado
  }
  /** Arrasta com o mouse de verdade da esquerda para a direita do trecho e mede a selecao. */
  const selecionar = async (alvo) => {
    const t = trecho('t1', alvo)
    const y = Math.round(t.top + t.height / 2)
    const x0 = Math.round(t.left + 2)
    const x1 = Math.round(t.right - 2)
    await prova.eventos([
      { type: 'mouseMove', x: x0, y },
      { type: 'mouseDown', x: x0, y, button: 'left', clickCount: 1 },
      { type: 'mouseMove', x: Math.round((x0 + x1) / 2), y, button: 'left' },
      { type: 'mouseMove', x: x1, y, button: 'left' },
      { type: 'mouseUp', x: x1, y, button: 'left', clickCount: 1 },
    ])
    await espera(300)
    const faixas = todos('[data-quadro="t1"] .xterm-selection div').map((d) => d.getBoundingClientRect()).filter((b) => b.width > 0)
    const f = faixas[0]
    return {
      faixas: faixas.length,
      // centro vertical da faixa menos o centro do texto: 0 = em cima do texto
      desvioY: f ? Math.round(f.top + f.height / 2 - y) : null,
      desvioX: f ? Math.round(f.left - t.left) : null,
      larguraTexto: Math.round(t.width),
      larguraFaixa: f ? Math.round(f.width) : null,
    }
  }
  /** Uma linha "linha-N fim" que esta inteira na janela (a mais de baixo). */
  const linhaVisivel = () => {
    for (let n = 30; n >= 1; n--) {
      const t = trecho('t1', `linha-${n} fim`)
      if (t && t.top > 60 && t.bottom < window.innerHeight - 20) return `linha-${n} fim`
    }
    return 'linha-1 fim'
  }
  const zoom = () => q('.react-flow__viewport').style.transform.match(/scale\(([\d.]+)\)/)?.[1]

  await ate(() => /pasta-demo>/.test(texto('t1')), 120)
  await window.lousa.terminais.escrever('t1', "cls; 1..30 | % { 'linha-' + $_ + ' fim' }\r")
  await ate(() => texto('t1').includes('linha-30fim'))
  await espera(500)

  r.reduzida = { zoom: zoom(), ...(await selecionar(linhaVisivel())) }
  await prova.foto('reduzida')

  // o botao de ampliar enquadra o quadro inteiro (zoom acima de 100%)
  q('[data-quadro="t1"] .botao-ampliar').click()
  await espera(1200)
  r.ampliada = { zoom: zoom(), ...(await selecionar(linhaVisivel())) }
  await prova.foto('ampliada')

  r.zoomAmpliada = Number(r.ampliada.zoom) > 1

  // botao do meio por cima do terminal arrasta a lousa junto com o mouse: a correcao nao mexe
  // nele (sugestao da outra sessao). Fica no fim: depois de um arraste com o meio, o ⤢ desta
  // prova nao amplia, com ou sem a correcao (achado a investigar a parte).
  const deslocamento = () => Number(q('.react-flow__viewport').style.transform.match(/translate\(([-\d.]+)px/)?.[1])
  const arrastarComMeio = async () => {
    const t = q('[data-quadro="t1"] .xterm-screen').getBoundingClientRect()
    const mx = Math.round(t.left + Math.min(120, t.width / 3))
    const my = Math.round(Math.max(t.top, 80) + 40)
    const antes = deslocamento()
    await prova.eventos([
      { type: 'mouseMove', x: mx, y: my },
      { type: 'mouseDown', x: mx, y: my, button: 'middle', clickCount: 1 },
      ...[50, 100, 150, 200].map((d) => ({ type: 'mouseMove', x: mx + d, y: my, button: 'middle' })),
      { type: 'mouseUp', x: mx + 200, y: my, button: 'middle', clickCount: 1 },
    ])
    await espera(600)
    return { zoom: zoom(), mouse: 200, lousaAndou: Math.round(deslocamento() - antes) }
  }
  r.panoAmpliada = await arrastarComMeio()
  for (let i = 0; i < 6; i++) {
    q('.react-flow__controls-zoomout').click()
    await espera(250)
  }
  await espera(500)
  r.panoReduzida = await arrastarComMeio()
  const certo = (s) => s.faixas >= 1 && Math.abs(s.desvioY) <= 4 && Math.abs(s.desvioX) <= 12 && Math.abs(s.larguraFaixa - s.larguraTexto) <= 16
  r.ok = certo(r.reduzida) && certo(r.ampliada) && r.zoomAmpliada && [r.panoAmpliada, r.panoReduzida].every((p) => Math.abs(p.lousaAndou - 200) <= 4)
  return r
})()
