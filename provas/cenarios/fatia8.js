// estado: demo
// Fatia 8 (D16): aviso do agente pelo OSC 7501 (com o Claude falso), botao "esperando voce",
// links no terminal, copiar e colar, ampliar, Ctrl+roda na letra, terminal encerrado + Reabrir,
// "terminou" e o botao de registros. Fotos a..i.
// Efeito no PC: usa a area de transferencia e devolve o TEXTO que estava nela (imagem se perde).
;(async () => {
  const { espera } = prova
  const { pastaDemo, apoio } = prova.dados
  const q = (s) => document.querySelector(s)
  const r = { erros: [] }
  const linhas = (id) => [...document.querySelectorAll(`[data-quadro="${id}"] .xterm-rows > div`)].map((d) => d.textContent)
  const texto = (id) => linhas(id).map((l) => l.replace(/\s+$/, '')).join('')
  const vista = () => q('.react-flow__viewport').style.transform
  // sem espacos: a linha quebrada logo depois de um espaco perde esse espaco na tela
  const contar = (t, s) => t.replace(/\s+/g, '').split(s.replace(/\s+/g, '')).length - 1
  /** Espera o texto aparecer (ate 6 s) e devolve em quantos ms; a contagem era feita uma vez so,
   * 0,9 s depois, e oscilava entre 0 e 1 com o PC ocupado (desde 19/10). */
  const esperarTexto = async (id, s) => {
    const inicio = Date.now()
    for (let i = 0; i < 60 && contar(texto(id), s) === 0; i++) await espera(100)
    return Date.now() - inicio
  }
  const focar = (id) => q(`[data-quadro="${id}"] .xterm-helper-textarea`).focus()
  // centro de um trecho de texto na tela do terminal (a ocorrencia pedida)
  const ponto = (id, alvo, ocorrencia = 0) => {
    const andar = document.createTreeWalker(q(`[data-quadro="${id}"] .xterm-rows`), NodeFilter.SHOW_TEXT)
    let n = 0
    for (let no = andar.nextNode(); no; no = andar.nextNode()) {
      const i = no.textContent.indexOf(alvo)
      if (i < 0 || n++ < ocorrencia) continue
      const faixa = document.createRange()
      faixa.setStart(no, i + 1)
      faixa.setEnd(no, i + 3)
      const c = faixa.getBoundingClientRect()
      return { x: Math.round(c.left + c.width / 2), y: Math.round(c.top + c.height / 2) }
    }
    return null
  }
  const pontoUltimo = (id, alvo) => {
    let ultimo = null
    for (let i = 0, p = ponto(id, alvo); p && i < 20; p = ponto(id, alvo, ++i)) ultimo = p
    return ultimo
  }
  const clicar = (p, button = 'left', clickCount = 1) => [
    { type: 'mouseMove', x: p.x, y: p.y },
    { type: 'mouseDown', x: p.x, y: p.y, button, clickCount },
    { type: 'mouseUp', x: p.x, y: p.y, button, clickCount },
  ]
  const tecla = (keyCode, modifiers = []) => [
    { type: 'keyDown', keyCode, modifiers },
    { type: 'keyUp', keyCode, modifiers },
  ]
  const passo = async (nome, corpo) => {
    try {
      await corpo()
    } catch (e) {
      r.erros.push(`${nome}: ${String((e && e.stack) || e)}`)
    }
  }

  for (let i = 0; i < 80 && !q('[data-quadro="t2"] .xterm-rows'); i++) await espera(500)
  for (let i = 0; i < 60 && !(/PS .*>/.test(texto('t1')) && /PS .*>/.test(texto('t2'))); i++) await espera(300)
  await espera(800)

  await passo('1 aviso do agente', async () => {
    await window.lousa.terminais.escrever('t1', `node "${apoio}\\falso-claude.mjs" "${pastaDemo}"\r`)
    for (let i = 0; i < 60 && !q('[data-quadro="t1"] .selo-esperando'); i++) await espera(250)
    r.resposta = /RESPOSTA OK/.test(texto('t1')) ? 'RESPOSTA OK' : texto('t1').slice(-400)
    r.selo = q('[data-quadro="t1"] .selo-agente')?.innerText ?? null
    r.seloTitulo = q('[data-quadro="t1"] .selo-agente')?.title ?? null
    r.chamando = q('[data-quadro="t1"]').classList.contains('quadro-chamando')
    r.pilula = q('.topo-chamadas')?.innerText ?? null
    await prova.foto('a-esperando')
  })

  await passo('2 botao esperando voce', async () => {
    const antes = vista()
    q('.topo-chamadas').click()
    await espera(3000)
    r.enquadrou = antes !== vista()
    await prova.foto('b-enquadrado')
  })

  await passo('3 links', async () => {
    // R1.6: o link de arquivo chega depois que o main confere que o arquivo existe; como uma pessoa,
    // a prova passa o mouse, espera e so entao clica (antes clicava no mesmo instante do movimento)
    const passar = async (alvo) => {
      const p = ponto('t1', alvo)
      await prova.eventos([{ type: 'mouseMove', x: p.x - 40, y: p.y + 120 }, { type: 'mouseMove', x: p.x, y: p.y }])
      await espera(800)
      return p
    }
    const ponteiro = () => !!q('[data-quadro="t1"] .xterm-cursor-pointer')
    const titulo = () => q('.leitor-titulo')?.innerText.replace(/\n/g, ' | ') ?? null
    let p = await passar('docs/notas.md')
    r.ponteiroNoArquivo = ponteiro()
    await prova.foto('c-link-arquivo')
    await prova.eventos(clicar(p))
    await espera(1500)
    r.leitorRelativo = titulo()
    p = await passar('src\\app.ts:2')
    await prova.eventos(clicar(p))
    await espera(1500)
    r.leitorAbsoluto = titulo()
    // so vira link o arquivo que existe; o nome solto acha o unico da pasta
    await passar('sumiu.md')
    r.ponteiroNoQueFalta = ponteiro()
    p = await passar('notas.md; falta')
    await prova.eventos(clicar(p))
    await espera(1500)
    r.leitorSolto = titulo()
    await passar('example.com/guia')
    r.ponteiroNaUrl = ponteiro()
    await prova.foto('d-link-url')
    q('.leitor-topo button:last-child')?.click()
    await espera(500)
  })

  await passo('4 copiar e colar', async () => {
    const original = await window.lousa.app.colar()
    await window.lousa.app.copiar('echo colado-ok')
    focar('t2')
    await espera(200)
    await prova.eventos(tecla('V', ['control']))
    r.msColarCtrlV = await esperarTexto('t2', 'echo colado-ok')
    r.colarCtrlV = contar(texto('t2'), 'echo colado-ok')
    await window.lousa.terminais.escrever('t2', '\r')
    await espera(1500)
    await prova.eventos(clicar(pontoUltimo('t2', 'colado-ok'), 'left', 2))
    await espera(500)
    focar('t2')
    await prova.eventos(tecla('C', ['control']))
    await espera(700)
    r.copiado = await window.lousa.app.colar()
    // botao direito: o clique injetado pelo main nao gera contextmenu, entao o evento vem da tela
    await window.lousa.app.copiar('echo direito-ok')
    const tela = q('[data-quadro="t2"] .xterm-screen')
    const c = tela.getBoundingClientRect()
    const evento = { bubbles: true, cancelable: true, button: 2, clientX: c.left + 50, clientY: c.top + 50 }
    tela.dispatchEvent(new MouseEvent('contextmenu', evento))
    r.msColarDireito = await esperarTexto('t2', 'echo direito-ok')
    r.colarDireito = contar(texto('t2'), 'echo direito-ok')
    await window.lousa.terminais.escrever('t2', '\r')
    await espera(1200)
    if (original) await window.lousa.app.copiar(original)
    await prova.foto('e-colado')
  })

  await passo('5 ampliar e voltar', async () => {
    const antes = vista()
    const cabecalho = q('[data-quadro="t2"] .cabecalho-quadro')
    // duplo clique no cabecalho nao amplia mais (A2): ampliava sem querer
    cabecalho.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }))
    await espera(1000)
    r.duploCliqueNaoAmplia = vista() === antes
    const botao = q('[data-quadro="t2"] .botao-ampliar')
    botao.click()
    await espera(3000)
    r.ampliou = vista() !== antes
    await prova.foto('f-ampliado')
    botao.click()
    await espera(3000)
    r.voltouExato = vista() === antes
  })

  await passo('6 Ctrl+roda na letra', async () => {
    const fonte = () => getComputedStyle(q('[data-quadro="t2"] .xterm-rows')).fontSize
    const antes = fonte()
    const v = vista()
    const p = ponto('t2', 'PS ')
    const roda = { type: 'mouseWheel', x: p.x + 60, y: p.y, deltaX: 0, deltaY: 120, modifiers: ['control'] }
    await prova.eventos([roda])
    await espera(500)
    await prova.eventos([roda])
    await espera(800)
    r.fonte = `${antes} -> ${fonte()}`
    r.lousaSemZoom = vista() === v
  })

  await passo('7 encerrado e Reabrir', async () => {
    await window.lousa.terminais.escrever('t2', 'exit\r')
    for (let i = 0; i < 40 && !q('[data-quadro="t2"] .quadro-encerrado'); i++) await espera(250)
    r.encerrado = q('[data-quadro="t2"] .quadro-encerrado')?.innerText.replace(/\n/g, ' | ') ?? null
    await prova.foto('g-encerrado')
    q('[data-quadro="t2"] .quadro-encerrado button').click()
    // o prompt antigo continua na tela ate remontar: espera a barra sumir E um prompt
    const reaberto = () => !q('[data-quadro="t2"] .quadro-encerrado') && /PS .*>/.test(texto('t2'))
    for (let i = 0; i < 60 && !reaberto(); i++) await espera(300)
    r.reabriu = reaberto()
  })

  await passo('8 terminou e brilho apaga', async () => {
    await window.lousa.terminais.escrever('t1', 's')
    for (let i = 0; i < 40 && !q('[data-quadro="t1"] .selo-terminou'); i++) await espera(250)
    const selo = q('[data-quadro="t1"] .selo-agente')
    r.seloFinal = selo ? `${selo.innerText} / ${selo.title}` : null
    await prova.foto('h-terminou')
    q('[data-quadro="t1"] .quadro-corpo').dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    await espera(400)
    r.brilhoApagou = !q('[data-quadro="t1"]').classList.contains('quadro-chamando')
    r.pilulaSumiu = !q('.topo-chamadas')
  })

  await passo('9 abrir pasta de registros', async () => {
    q('.topo-engrenagem').click()
    await espera(500)
    const botao = [...document.querySelectorAll('.painel-contas-rodape button')].find((b) => b.innerText.includes('registros'))
    r.botaoRegistros = !!botao
    botao.click()
    await espera(800)
    // no smoke nao ha pasta de registros: o certo e mostrar o erro sem abrir nada
    r.registros = q('.painel-contas-rodape .erro')?.innerText ?? 'abriu'
    await prova.foto('i-registros')
  })

  r.t1 = linhas('t1').filter((l) => l.trim()).slice(-6)
  return r
})()
