// estado: demo
// D47: cabecalho do quadro 10% maior (antes ~28 px de altura a 100%), letra Bahnschrift, botoes
// ⤢ (azul) e × (vermelho) com fundo; borda do quadro de 2 px (4 px em cima). Mede a 100% de
// zoom (altura na tela / zoom) e tira a foto com o t1 ampliado. Foto: 1-cabecalho.
;(async () => {
  const { espera } = prova
  const q = (s) => document.querySelector(s)
  const r = { erros: [] }
  const zoom = () => Number(q('.react-flow__viewport').style.transform.match(/scale\(([\d.]+)\)/)?.[1])
  try {
    for (let i = 0; i < 80 && !q('[data-quadro="t1"] .xterm'); i++) await espera(250)
    const cab = q('[data-quadro="t1"] .cabecalho-quadro')
    const z = zoom()
    const css = (el) => getComputedStyle(el)
    const ampliar = q('[data-quadro="t1"] .botao-acao-ampliar')
    const fechar = q('[data-quadro="t1"] .botao-acao-fechar')
    r.medidas = {
      zoom: z,
      altura: Math.round((cab.getBoundingClientRect().height / z) * 10) / 10,
      fonte: css(cab).fontFamily,
      pasta: css(q('[data-quadro="t1"] .quadro-pasta')).fontSize,
      ampliar: { fundo: css(ampliar).backgroundColor, cor: css(ampliar).color },
      fechar: { fundo: css(fechar).backgroundColor, cor: css(fechar).color },
      borda: css(q('[data-quadro="t1"]')).borderLeftWidth + ' / ' + css(q('[data-quadro="t1"]')).borderTopWidth,
    }
    ampliar.click()
    await espera(3000)
    await prova.foto('1-cabecalho')
  } catch (e) {
    r.erros.push(String((e && e.stack) || e))
  }
  const m = r.medidas
  r.ok =
    r.erros.length === 0 &&
    m.altura >= 30 && m.altura <= 32.5 &&
    m.fonte.startsWith('Bahnschrift') &&
    m.ampliar.fundo !== 'rgba(0, 0, 0, 0)' && m.fechar.fundo !== 'rgba(0, 0, 0, 0)' &&
    m.borda === '2px / 4px'
  return r
})()
