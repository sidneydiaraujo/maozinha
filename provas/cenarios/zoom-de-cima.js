// estado: demo
// D46: com a lousa vista de cima, so redesenha quem alguem consegue ler. O t1 recebe um clique
// (o usuario esta nele) e a lousa vai se afastando pelo botao "-":
// - letra entre 6 e 9 px: o t1 redesenha nitido (desfaz o zoom); o t2 fica na imagem, sem redesenhar;
// - letra abaixo de 6 px: o t2 para de desenhar e mostra a capa (nome grande); o t1 nao pausa;
// - de volta perto: ninguem pausado, sem capa.
// Fotos: 1-meio, 2-de-cima.
;(async () => {
  const { espera } = prova
  const q = (s) => document.querySelector(s)
  const r = { erros: [] }
  const zoom = () => Number(q('.react-flow__viewport').style.transform.match(/scale\(([\d.]+)\)/)?.[1])
  const estado = (id) => {
    const el = q(`[data-quadro="${id}"] .terminal`)
    const xterm = el.querySelector('.xterm')
    return {
      nitido: el.style.transform.startsWith('scale('),
      pausado: xterm.style.display === 'none',
      capa: !!q(`[data-quadro="${id}"] .quadro-capa`),
    }
  }
  const medirCapa = () => {
    const c = q('[data-quadro="t2"] .quadro-capa')
    if (!c) return null
    const b = c.getBoundingClientRect()
    const st = getComputedStyle(c.querySelector('strong'))
    return { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height), cor: st.color, fonte: st.fontSize, vis: st.visibility, op: getComputedStyle(c).opacity, z: getComputedStyle(c).zIndex }
  }
  const afastar = async () => {
    q('.react-flow__controls-zoomout').click()
    await espera(700)
  }
  const ate = async (condicao, vezes = 60) => {
    for (let i = 0; i < vezes && !condicao(); i++) await espera(250)
    return !!condicao()
  }
  try {
    r.abriu = await ate(() => q('[data-quadro="t1"] .xterm-helper-textarea') && q('[data-quadro="t2"] .xterm'), 160)
    r.quadros = [...document.querySelectorAll('[data-quadro]')].map((n) => n.dataset.quadro)
    // clique de verdade no t1 (o foco por script nao dispara evento na janela escondida)
    const b = q('[data-quadro="t1"] .xterm-screen').getBoundingClientRect()
    const p = { x: Math.round(b.left + b.width / 2), y: Math.round(b.top + b.height / 2) }
    await prova.eventos([
      { type: 'mouseDown', x: p.x, y: p.y, button: 'left', clickCount: 1 },
      { type: 'mouseUp', x: p.x, y: p.y, button: 'left', clickCount: 1 },
    ])
    await espera(400)
    // letra base 14 (padrao): 0,8 -> 0,667 -> 0,556 (7,8 px na tela)
    await afastar()
    await afastar()
    r.meio = { zoom: zoom(), t1: estado('t1'), t2: estado('t2') }
    await prova.foto('1-meio')
    // 0,463 -> 0,386 (5,4 px)
    await afastar()
    await afastar()
    r.deCima = { zoom: zoom(), t1: estado('t1'), t2: estado('t2'), capa: q('[data-quadro="t2"] .quadro-capa')?.innerText, medida: medirCapa() }
    await prova.foto('2-de-cima')
    for (let i = 0; i < 5; i++) {
      q('.react-flow__controls-zoomin').click()
      await espera(400)
    }
    await espera(600)
    r.perto = { zoom: zoom(), t1: estado('t1'), t2: estado('t2') }
  } catch (e) {
    r.erros.push(String((e && e.stack) || e))
  }
  r.ok =
    r.erros.length === 0 &&
    r.meio.t1.nitido && !r.meio.t2.nitido && !r.meio.t2.pausado &&
    r.deCima.t2.pausado && r.deCima.t2.capa && !r.deCima.t1.pausado && !r.deCima.t1.capa &&
    !r.perto.t1.pausado && !r.perto.t2.pausado && !r.perto.t2.capa
  return r
})()
