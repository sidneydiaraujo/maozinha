// estado: git
// Fatia 27 (D35): Ctrl+K "foco" -> "Guardar vista atual como "foco"". Arrastar o quadro q1 com o
// mouse de verdade e depois Ctrl+K "Vista: foco" devolve o q1 ao lugar e a camera; o lugar fica
// salvo no main. Ctrl+K "apagar foco" apaga a vista. Fotos 1..3.
;(async () => {
  const { espera } = prova
  const q = (s) => document.querySelector(s)
  const todos = (s) => [...document.querySelectorAll(s)]
  const r = {}
  const ate = async (condicao, vezes = 40) => {
    for (let i = 0; i < vezes && !condicao(); i++) await espera(250)
    return !!condicao()
  }
  const tecla = (keyCode, modifiers = []) =>
    prova.eventos([
      { type: 'keyDown', keyCode, modifiers },
      { type: 'keyUp', keyCode, modifiers },
    ])
  const preencher = (campo, valor) => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(campo, valor)
    campo.dispatchEvent(new Event('input', { bubbles: true }))
  }
  const naPaleta = async (consulta, titulo) => {
    await tecla('K', ['control'])
    await ate(() => q('.paleta'))
    preencher(q('.paleta-campo'), consulta)
    await espera(400)
    const i = todos('.paleta-titulo').findIndex((e) => e.textContent.startsWith(titulo))
    if (i < 0) return false
    todos('.paleta-item')[i].click()
    return true
  }
  const lugarQ1 = () => {
    const b = q('[data-quadro="q1"]').getBoundingClientRect()
    return { x: Math.round(b.left), y: Math.round(b.top) }
  }
  const vista = () => q('.react-flow__viewport').style.transform
  const q1Salvo = async () => (await window.lousa.lousa.carregar()).quadros.find((x) => x.id === 'q1').caixa

  await ate(() => q('[data-quadro="q1"] .xterm-rows'), 120)
  await espera(800)
  const antes = { lugar: lugarQ1(), vista: vista(), caixa: await q1Salvo() }

  // 1. guardar
  r.guardar = await naPaleta('foco', 'Guardar vista atual como "foco"')
  await ate(() => q('.lousa-aviso'))
  r.avisoGuardar = q('.lousa-aviso')?.textContent ?? null
  r.vistasSalvas = ((await window.lousa.lousa.carregar()).vistas ?? []).map((v) => v.nome)
  await prova.foto('1-guardou')

  // 2. arrastar o q1 pelo cabecalho, com o mouse de verdade
  const p = q('[data-quadro="q1"] .quadro-pasta').getBoundingClientRect()
  const x0 = Math.round(p.left + p.width / 2)
  const y0 = Math.round(p.top + p.height / 2)
  const passos = [1, 2, 3, 4, 5, 6].map((k) => ({ type: 'mouseMove', x: x0 + k * 40, y: y0 + k * 30, button: 'left' }))
  await prova.eventos([{ type: 'mouseDown', x: x0, y: y0, button: 'left', clickCount: 1 }, ...passos, { type: 'mouseUp', x: x0 + 240, y: y0 + 180, button: 'left', clickCount: 1 }])
  await espera(900)
  r.moveu = lugarQ1().x - antes.lugar.x
  await prova.foto('2-arrastado')

  // 3. voltar a vista
  r.ir = await naPaleta('foco', 'Vista: foco')
  await espera(1200)
  const depois = lugarQ1()
  r.voltou = { dx: depois.x - antes.lugar.x, dy: depois.y - antes.lugar.y, mesmaVista: vista() === antes.vista }
  r.salvoNoMain = JSON.stringify(await q1Salvo()) === JSON.stringify(antes.caixa)
  await prova.foto('3-voltou')

  // 4. apagar
  r.apagar = await naPaleta('apagar foco', 'Apagar vista: foco')
  await espera(600)
  r.vistasDepois = ((await window.lousa.lousa.carregar()).vistas ?? []).length

  r.ok =
    r.guardar &&
    r.avisoGuardar === 'Vista "foco" guardada' &&
    r.vistasSalvas.join() === 'foco' &&
    Math.abs(r.moveu) > 100 &&
    r.ir &&
    Math.abs(r.voltou.dx) <= 2 &&
    Math.abs(r.voltou.dy) <= 2 &&
    r.voltou.mesmaVista &&
    r.salvoNoMain &&
    r.apagar &&
    r.vistasDepois === 0
  return r
})()
