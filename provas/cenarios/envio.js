// estado: git
// Fatia 13 (D21): um quadro selecionado nao mostra a barra; Ctrl+clique de verdade no cabecalho
// de um segundo mostra "Para 2 quadros". Shift+Enter quebra a linha sem enviar; Enter manda a
// mesma mensagem para os dois e o terceiro quadro nao recebe nada. Fotos 1..2.
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
  const centro = (s) => {
    const c = q(s).getBoundingClientRect()
    return { x: Math.round(c.left + c.width / 2), y: Math.round(c.top + c.height / 2) }
  }
  // o React Flow so soma a selecao com o Control apertado de verdade (keydown antes do clique)
  const cliqueNoCabecalho = (id, comCtrl) => {
    const p = centro(`[data-quadro="${id}"] .quadro-pasta`)
    const modifiers = comCtrl ? ['control'] : []
    const clique = [
      { type: 'mouseMove', x: p.x, y: p.y },
      { type: 'mouseDown', x: p.x, y: p.y, button: 'left', clickCount: 1, modifiers },
      { type: 'mouseUp', x: p.x, y: p.y, button: 'left', clickCount: 1, modifiers },
    ]
    if (!comCtrl) return prova.eventos(clique)
    return prova.eventos([
      { type: 'keyDown', keyCode: 'Control', modifiers },
      ...clique,
      { type: 'keyUp', keyCode: 'Control' },
    ])
  }
  const preencher = (campo, valor) => {
    Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set.call(campo, valor)
    campo.dispatchEvent(new Event('input', { bubbles: true }))
  }
  const tecla = (keyCode, modifiers = []) =>
    prova.eventos([
      { type: 'keyDown', keyCode, modifiers },
      { type: 'keyUp', keyCode, modifiers },
    ])

  await ate(() => ['q1', 'q2', 'q3'].every((id) => /(app|api)>/.test(texto(id))), 120)

  await cliqueNoCabecalho('q1', false)
  await espera(300)
  r.umSelecionadoMostraBarra = !!q('.barra-envio')
  await cliqueNoCabecalho('q3', true)
  await ate(() => q('.barra-envio'))
  r.rotulo = q('.barra-envio-rotulo')?.textContent ?? null
  await prova.foto('1-barra')

  const campo = q('.barra-envio textarea')
  campo.focus()
  preencher(campo, 'primeira')
  // a quebra de linha vem do evento de caractere, como no teclado de verdade
  await prova.eventos([
    { type: 'keyDown', keyCode: 'Enter', modifiers: ['shift'] },
    { type: 'char', keyCode: 'Enter', modifiers: ['shift'] },
    { type: 'keyUp', keyCode: 'Enter', modifiers: ['shift'] },
  ])
  await espera(300)
  r.shiftEnter = { quebrouLinha: campo.value.includes('\n'), enviou: texto('q1').includes('primeira') }

  preencher(campo, "'enviado-' + (2 * 21)")
  campo.focus()
  await tecla('Enter')
  await ate(() => texto('q1').includes('enviado-42') && texto('q3').includes('enviado-42'), 20)
  await espera(800)
  r.aviso = q('.barra-envio-aviso')?.textContent ?? null
  r.recebeu = Object.fromEntries(['q1', 'q2', 'q3'].map((id) => [id, texto(id).includes('enviado-42')]))
  await prova.foto('2-enviado')

  r.ok =
    !r.umSelecionadoMostraBarra &&
    r.rotulo === 'Para 2 quadros' &&
    r.shiftEnter.quebrouLinha &&
    !r.shiftEnter.enviou &&
    r.recebeu.q1 &&
    r.recebeu.q3 &&
    !r.recebeu.q2
  return r
})()
