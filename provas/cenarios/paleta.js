// estado: git
// Fatia 12 (D20): Ctrl+K de verdade com o terminal em foco abre a paleta; "api" leva ate o quadro
// de api (fora da tela); "fatia" acha o arquivo da subpasta e nao o de node_modules, e abre no
// leitor; "novo api" abre a janelinha com a pasta api marcada (sem abrir agente sozinho).
// Ctrl+F no terminal: 11 achados de "linha 1", comeca no mais recente, Enter sobe para o anterior,
// Esc fecha. Fotos 1..5.
;(async () => {
  const { espera } = prova
  const q = (s) => document.querySelector(s)
  const todos = (s) => [...document.querySelectorAll(s)]
  const r = { erros: [] }
  window.addEventListener('error', (e) => r.erros.push(String(e.message)))
  const texto = (id) => todos(`[data-quadro="${id}"] .xterm-rows > div`).map((d) => d.textContent).join('').replace(/\s+/g, '')
  const textos = (s) => todos(s).map((e) => e.textContent.trim())
  const vista = () => q('.react-flow__viewport').style.transform
  const ate = async (condicao, vezes = 40) => {
    for (let i = 0; i < vezes && !condicao(); i++) await espera(250)
    return !!condicao()
  }
  const tecla = (keyCode, modifiers = []) =>
    prova.eventos([
      { type: 'keyDown', keyCode, modifiers },
      { type: 'keyUp', keyCode, modifiers },
    ])
  // o campo e controlado pelo React: muda o valor pelo setter nativo e avisa com 'input'
  const preencher = (campo, valor) => {
    const proto = campo instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype
    Object.getOwnPropertyDescriptor(proto, 'value').set.call(campo, valor)
    campo.dispatchEvent(new Event('input', { bubbles: true }))
  }
  const focarTerminal = (id) => q(`[data-quadro="${id}"] .xterm-helper-textarea`).focus()

  await ate(() => /app>/.test(texto('q1')), 120)

  // 1. Ctrl+K com o terminal em foco
  focarTerminal('q1')
  await tecla('K', ['control'])
  await ate(() => q('.paleta'))
  r.abriuComTerminalEmFoco = !!q('.paleta')
  r.itensSemTexto = textos('.paleta-titulo')
  await prova.foto('1-vazia')

  // 2. ir ao quadro de api, fora da tela
  preencher(q('.paleta-campo'), 'api')
  await espera(400)
  r.itensApi = textos('.paleta-titulo')
  const antes = vista()
  await tecla('Enter')
  await espera(900)
  r.irAoQuadro = { fechou: !q('.paleta'), vistaMudou: vista() !== antes }
  await prova.foto('2-foi-ao-quadro')

  // 3. arquivo em subpasta; o de node_modules fica de fora
  await tecla('K', ['control'])
  await ate(() => q('.paleta'))
  preencher(q('.paleta-campo'), 'fatia')
  await ate(() => textos('.paleta-item').some((t) => t.includes('fatia-12.md')))
  r.itensFatia = textos('.paleta-item')
  r.nodeModulesFora = !r.itensFatia.some((t) => t.includes('node_modules'))
  await prova.foto('3-arquivo')
  todos('.paleta-item').find((e) => e.textContent.includes('fatia-12.md'))?.click()
  r.leitorAbriu = await ate(() => document.body.innerText.includes('Ctrl+K e Ctrl+F.'))

  // 4. novo quadro em api: a janelinha vem com a pasta marcada e nao abre agente sozinha
  await tecla('K', ['control'])
  await ate(() => q('.paleta'))
  preencher(q('.paleta-campo'), 'novo api')
  await espera(400)
  r.itensNovoApi = textos('.paleta-titulo')
  const quadrosAntes = todos('[data-quadro]').length
  await tecla('Enter')
  await ate(() => q('.novo-quadro'))
  await espera(700)
  r.novoEmApi = {
    janelinha: !!q('.novo-quadro'),
    pastaMarcada: textos('.pasta-escolha[aria-checked="true"] strong'),
    abriuQuadroSozinho: todos('[data-quadro]').length !== quadrosAntes,
  }
  await prova.foto('4-novo-em-api')
  await tecla('Escape')
  await ate(() => !q('.novo-quadro'), 20)

  // 5. Ctrl+F no historico do terminal
  await window.lousa.terminais.escrever('q1', "1..40 | % { 'linha ' + $_ + ' ok' }; 'ERRO final'\r")
  await ate(() => texto('q1').includes('ERROfinal'))
  focarTerminal('q1')
  await tecla('F', ['control'])
  await ate(() => q('.busca-terminal input'))
  preencher(q('.busca-terminal input'), 'linha 1')
  await espera(400)
  r.busca = { contagem: q('.busca-contagem')?.textContent ?? null }
  await tecla('Enter')
  await espera(300)
  r.busca.depoisDeEnter = q('.busca-contagem')?.textContent ?? null
  await prova.foto('5-busca')
  await tecla('Escape')
  await espera(300)
  r.busca.fechou = !q('.busca-terminal')

  r.ok =
    r.abriuComTerminalEmFoco &&
    r.itensApi[0]?.includes('api') &&
    r.irAoQuadro.fechou &&
    r.irAoQuadro.vistaMudou &&
    r.nodeModulesFora &&
    r.leitorAbriu &&
    r.novoEmApi.janelinha &&
    r.novoEmApi.pastaMarcada.includes('api') &&
    !r.novoEmApi.abriuQuadroSozinho &&
    // comeca na ocorrencia mais recente (a de baixo); Enter sobe para a anterior (T24.2)
    r.busca.contagem === '11 de 11' &&
    r.busca.depoisDeEnter === '10 de 11' &&
    r.busca.fechou &&
    r.erros.length === 0
  return r
})()
