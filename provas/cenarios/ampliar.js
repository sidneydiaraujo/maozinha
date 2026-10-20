// estado: demo
// Botao ⤢ do quadro (T8.4, D38): amplia, volta, amplia de novo; depois de mexer na vista com o
// botao do meio, o ⤢ amplia de novo (antes voltava a uma vista antiga). Antes da D38 o ⤢ usava o
// fitView do React Flow, que as vezes nao rodava nesta janela escondida. Fotos 1..2.
;(async () => {
  const { espera } = prova
  const q = (s) => document.querySelector(s)
  const r = {}
  const zoom = () => Number(Number(q('.react-flow__viewport').style.transform.match(/scale\(([\d.]+)\)/)?.[1]).toFixed(3))
  const ate = async (condicao, vezes = 80) => {
    for (let i = 0; i < vezes && !condicao(); i++) await espera(250)
  }
  /** O quadro ocupa a lousa quase toda (enquadrado pelo ⤢). */
  const enquadrado = (id) => {
    const b = q(`[data-quadro="${id}"]`).getBoundingClientRect()
    const a = q('.lousa').getBoundingClientRect()
    const dentro = b.left >= a.left - 2 && b.right <= a.right + 2 && b.top >= a.top - 2 && b.bottom <= a.bottom + 2
    const ocupa = Math.max(b.width / a.width, b.height / a.height)
    return dentro && ocupa > 0.9
  }
  const ampliar = async (id) => {
    q(`[data-quadro="${id}"] .botao-ampliar`).click()
    await espera(900)
    return { zoom: zoom(), enquadrado: enquadrado(id) }
  }
  const arrastarComMeio = async (id) => {
    const t = q(`[data-quadro="${id}"] .xterm-screen`).getBoundingClientRect()
    const mx = Math.round(t.left + 60)
    const my = Math.round(Math.max(t.top, 80) + 40)
    await prova.eventos([
      { type: 'mouseMove', x: mx, y: my },
      { type: 'mouseDown', x: mx, y: my, button: 'middle', clickCount: 1 },
      ...[50, 100, 150].map((d) => ({ type: 'mouseMove', x: mx + d, y: my + d / 3, button: 'middle' })),
      { type: 'mouseUp', x: mx + 150, y: my + 50, button: 'middle', clickCount: 1 },
    ])
    await espera(600)
  }

  await ate(() => q('[data-quadro="t1"] .xterm-rows'))
  await espera(800)
  r.inicio = zoom()
  r.ampliou = await ampliar('t1')
  await prova.foto('1-ampliado')
  r.voltou = await ampliar('t1')
  r.ampliouDeNovo = await ampliar('t1')
  await arrastarComMeio('t1')
  r.depoisDeMexer = { zoom: zoom(), enquadrado: enquadrado('t1') }
  r.ampliouDepoisDeMexer = await ampliar('t1')
  await prova.foto('2-ampliado-de-novo')
  r.outroQuadro = await ampliar('t2')

  r.ok =
    r.ampliou.enquadrado &&
    Math.abs(r.voltou.zoom - r.inicio) < 0.01 &&
    r.ampliouDeNovo.enquadrado &&
    !r.depoisDeMexer.enquadrado &&
    r.ampliouDepoisDeMexer.enquadrado &&
    r.outroQuadro.enquadrado
  return r
})()
