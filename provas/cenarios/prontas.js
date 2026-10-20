// estado: git
// Fatia 25 (D33): mensagens prontas. Clicar num terminal e Ctrl+K "Mandar: Rode os testes…" manda
// so para ele ("Enviado para 1 quadro"). Com dois selecionados, o ★ da barra lista as tres padrao,
// guarda a mensagem escrita, preenche a barra ao clicar e apaga. Fotos 1..3.
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
  const cliqueNoCabecalho = (id, comCtrl) => {
    const p = centro(`[data-quadro="${id}"] .quadro-pasta`)
    const modifiers = comCtrl ? ['control'] : []
    const clique = [
      { type: 'mouseMove', x: p.x, y: p.y },
      { type: 'mouseDown', x: p.x, y: p.y, button: 'left', clickCount: 1, modifiers },
      { type: 'mouseUp', x: p.x, y: p.y, button: 'left', clickCount: 1, modifiers },
    ]
    if (!comCtrl) return prova.eventos(clique)
    return prova.eventos([{ type: 'keyDown', keyCode: 'Control', modifiers }, ...clique, { type: 'keyUp', keyCode: 'Control' }])
  }

  await ate(() => ['q1', 'q3'].every((id) => /app>/.test(texto(id))), 120)

  // 1. sem selecao, o alvo e o ultimo terminal usado
  // clique de verdade dentro do terminal (na janela escondida, .focus() sozinho nao gera focusin)
  const dentro = centro('[data-quadro="q3"] .xterm-screen')
  await prova.eventos([
    { type: 'mouseDown', x: dentro.x, y: dentro.y, button: 'left', clickCount: 1 },
    { type: 'mouseUp', x: dentro.x, y: dentro.y, button: 'left', clickCount: 1 },
  ])
  await tecla('K', ['control'])
  await ate(() => q('.paleta'))
  preencher(q('.paleta-campo'), 'rode os testes')
  await espera(400)
  r.itens = todos('.paleta-titulo').map((e) => e.textContent)
  await prova.foto('1-paleta')
  await tecla('Enter')
  await ate(() => texto('q3').includes('Rodeostestes'), 20)
  await ate(() => q('.lousa-aviso'), 20)
  r.pelaPaleta = {
    aviso: q('.lousa-aviso')?.textContent ?? null,
    q3: texto('q3').includes('Rodeostestes'),
    q1: texto('q1').includes('Rodeostestes'),
  }

  // 2. dois selecionados: o ★ da barra
  await cliqueNoCabecalho('q1', false)
  await cliqueNoCabecalho('q3', true)
  await ate(() => q('.barra-envio'))
  q('.botao-prontas').click()
  await ate(() => q('.prontas'))
  r.padrao = todos('.prontas-item button[role="menuitem"]').map((b) => b.textContent)
  preencher(q('.barra-envio textarea'), 'pronta-de-teste')
  await espera(200)
  q('.prontas-guardar').click()
  await ate(() => todos('.prontas-item').some((e) => e.textContent.includes('pronta-de-teste')))
  r.guardou = (await window.lousa.mensagens.listar())[0] === 'pronta-de-teste'
  await prova.foto('2-guardou')
  preencher(q('.barra-envio textarea'), '')
  await espera(200)
  todos('.prontas-item button[role="menuitem"]').find((b) => b.textContent === 'pronta-de-teste')?.click()
  await espera(300)
  r.preencheu = q('.barra-envio textarea').value === 'pronta-de-teste'
  q('.botao-prontas').click()
  await ate(() => q('.prontas'))
  q('.prontas-item .botao-fechar[aria-label*="pronta-de-teste"]')?.click()
  await ate(() => !todos('.prontas-item').some((e) => e.textContent.includes('pronta-de-teste')))
  r.apagou = !(await window.lousa.mensagens.listar()).includes('pronta-de-teste')
  await prova.foto('3-apagou')

  r.ok =
    r.itens.some((t) => t.startsWith('Mandar: Rode os testes')) &&
    r.pelaPaleta.aviso === 'Enviado para 1 quadro' &&
    r.pelaPaleta.q3 &&
    !r.pelaPaleta.q1 &&
    r.padrao.length === 3 &&
    r.guardou &&
    r.preencheu &&
    r.apagou
  return r
})()
