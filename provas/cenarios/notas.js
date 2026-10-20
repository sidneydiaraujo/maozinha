// estado: git
// Fatia 26 (D34): "+ Nota" cria uma nota fora de cima dos quadros, ja escrevendo; o texto e
// guardado no main; "Pronto" mostra o markdown; clicar num terminal e "➤ Mandar" escreve o texto
// nele; Ctrl+K "Nova nota" cria outra; apagar uma nota vazia nao pede confirmacao. Fotos 1..3.
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
  const tecla = (keyCode, modifiers = []) =>
    prova.eventos([
      { type: 'keyDown', keyCode, modifiers },
      { type: 'keyUp', keyCode, modifiers },
    ])
  const preencher = (campo, valor) => {
    const proto = campo instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype
    Object.getOwnPropertyDescriptor(proto, 'value').set.call(campo, valor)
    campo.dispatchEvent(new Event('input', { bubbles: true }))
  }
  const centro = (s) => {
    const c = q(s).getBoundingClientRect()
    return { x: Math.round(c.left + c.width / 2), y: Math.round(c.top + c.height / 2) }
  }
  const notasSalvas = async () => (await window.lousa.lousa.carregar()).notas ?? []

  await ate(() => ['q1', 'q3'].every((id) => /app>/.test(texto(id))), 120)

  // 1. "+ Nota": nasce escrevendo e fora de cima dos quadros
  q('.botao-nova-nota').click()
  await ate(() => q('.nota textarea'))
  r.nasceuEscrevendo = !!q('.nota textarea')
  const n = q('.nota').getBoundingClientRect()
  r.emCimaDeQuadro = todos('[data-quadro]').some((e) => {
    const b = e.getBoundingClientRect()
    return n.left < b.right && b.left < n.right && n.top < b.bottom && b.top < n.bottom
  })
  preencher(q('.nota textarea'), '# Plano\n- [ ] testar a nota')
  await espera(900)
  r.salvo = (await notasSalvas())[0]?.texto ?? null
  todos('.cabecalho-nota button').find((b) => b.textContent === 'Pronto')?.click()
  await ate(() => q('.nota-md h1'))
  r.markdown = { titulo: q('.nota-md h1')?.textContent ?? null, tarefa: q('.nota-md .md-tarefa')?.textContent.trim() ?? null }
  await prova.foto('1-nota')

  // 2. clique de verdade no terminal q3 e "➤ Mandar"
  const dentro = centro('[data-quadro="q3"] .xterm-screen')
  await prova.eventos([
    { type: 'mouseDown', x: dentro.x, y: dentro.y, button: 'left', clickCount: 1 },
    { type: 'mouseUp', x: dentro.x, y: dentro.y, button: 'left', clickCount: 1 },
  ])
  todos('.cabecalho-nota button').find((b) => b.textContent.includes('Mandar'))?.click()
  await ate(() => texto('q3').includes('testaranota'), 20)
  await ate(() => q('.lousa-aviso'), 20)
  r.mandou = { aviso: q('.lousa-aviso')?.textContent ?? null, q3: texto('q3').includes('testaranota'), q1: texto('q1').includes('testaranota') }
  await prova.foto('2-mandou')

  // 3. Ctrl+K "Nova nota" e apagar a nota vazia
  await tecla('K', ['control'])
  await ate(() => q('.paleta'))
  preencher(q('.paleta-campo'), 'nova nota')
  await espera(300)
  await tecla('Enter')
  await ate(() => todos('.nota').length === 2)
  r.pelaPaleta = todos('.nota').length
  await prova.foto('3-duas')
  const vazia = todos('.nota').find((e) => e.querySelector('textarea')?.value === '')
  vazia?.querySelector('.botao-fechar')?.click()
  await ate(() => todos('.nota').length === 1)
  r.depoisDeApagar = { naTela: todos('.nota').length, salvas: (await notasSalvas()).length }

  r.ok =
    r.nasceuEscrevendo &&
    !r.emCimaDeQuadro &&
    r.salvo === '# Plano\n- [ ] testar a nota' &&
    r.markdown.titulo === 'Plano' &&
    r.markdown.tarefa?.startsWith('☐') &&
    r.mandou.aviso === 'Enviado para 1 quadro' &&
    r.mandou.q3 &&
    !r.mandou.q1 &&
    r.pelaPaleta === 2 &&
    r.depoisDeApagar.naTela === 1 &&
    r.depoisDeApagar.salvas === 1
  return r
})()
