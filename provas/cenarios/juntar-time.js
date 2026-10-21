// estado: juntar-time
// Fatia 31 (T31.1). Tres agentes da Pessoal, cada um numa copia do app (git worktree), ligados
// a1 -> a2 -> a3. Cada um abre o claude.exe de verdade e o cenario responde "No, exit" na
// confianca (nenhuma mensagem, como o cenario `time`). Menu da linha -> "Juntar o time":
// - a janela lista c1, c2, c3 nessa ordem (quem entrega antes);
// - c1 entra; c2 tem arquivo nao salvo e fica de fora; c3 mexeu no mesmo trecho que a c1 e para
//   no conflito com "Pedir ao agente de c3 para resolver" (nao clicado: o Claude ja saiu);
// - a original fica com o trabalho da c1 e sem merge pela metade.
// Fotos: 1-lista, 2-resultado.
;(async () => {
  const { espera } = prova
  const q = (s) => document.querySelector(s)
  const todos = (s) => [...document.querySelectorAll(s)]
  const r = { erros: [] }
  const texto = (id) => todos(`[data-quadro="${id}"] .xterm-rows > div`).map((d) => d.textContent).join('\n')
  const ate = async (condicao, vezes = 40) => {
    for (let i = 0; i < vezes && !condicao(); i++) await espera(250)
    return !!condicao()
  }
  const clicar = async (p) => {
    await prova.eventos([
      { type: 'mouseDown', x: p.x, y: p.y, button: 'left', clickCount: 1 },
      { type: 'mouseUp', x: p.x, y: p.y, button: 'left', clickCount: 1 },
    ])
    await espera(900)
  }
  const abrirMenu = async (id) => {
    const caminho = q(`.react-flow__edge[data-id="${id}"] .react-flow__edge-path`)
    if (!caminho) return
    const p = caminho.getPointAtLength(caminho.getTotalLength() * 0.4)
    const tela = new DOMPoint(p.x, p.y).matrixTransform(caminho.getScreenCTM())
    await clicar({ x: Math.round(tela.x), y: Math.round(tela.y) })
  }
  const passo = async (nome, corpo) => {
    try {
      await corpo()
    } catch (e) {
      r.erros.push(`${nome}: ${String((e && e.stack) || e)}`)
    }
  }

  await passo('0 confianca', async () => {
    await ate(() => ['a1', 'a2', 'a3'].every((id) => /trust/i.test(texto(id))), 240)
    for (const id of ['a1', 'a2', 'a3']) await window.lousa.terminais.escrever(id, '\r')
    await espera(3000)
  })

  await passo('1 lista', async () => {
    await abrirMenu('l2')
    await ate(() => q('.menu-linha'))
    const item = todos('.menu-linha button').find((b) => b.textContent.includes('Juntar o time'))
    r.noMenu = !!item
    item?.click()
    await ate(() => q('.janela-juntar-time'))
    r.lista = todos('.juntar-time-lista li').map((li) => li.textContent)
    r.botao = q('.janela-juntar-time .botao-principal')?.textContent ?? null
    await prova.foto('1-lista')
  })

  await passo('2 juntar', async () => {
    q('.janela-juntar-time .botao-principal').click()
    await ate(() => q('.juntar-time-resultado'), 80)
    r.resultado = todos('.juntar-time-resultado li').map((li) => li.textContent)
    r.botaoResolver = todos('.janela-juntar-time button').map((b) => b.textContent).find((t) => t.includes('resolver')) ?? null
    await prova.foto('2-resultado')
    // a original: a c1 entrou (nada mais a juntar dela); a c3 continua com o commit dela
    r.c1Resumo = await window.lousa.copias.resumo('c1')
    r.c3Resumo = await window.lousa.copias.resumo('c3')
  })

  r.ok =
    r.erros.length === 0 &&
    r.noMenu &&
    JSON.stringify(r.lista) === JSON.stringify(['c1', 'c2', 'c3']) &&
    r.botao === 'Juntar 3 cópias' &&
    r.resultado?.[0] === '✓ c1 juntada em main' &&
    r.resultado?.some((f) => f === 'Ficou de fora (tem alteração não salva): c2') &&
    r.resultado?.some((f) => f.startsWith('Parou em c3: Conflito:')) &&
    r.botaoResolver === 'Pedir ao agente de c3 para resolver' &&
    r.c1Resumo?.commits === 0 &&
    r.c3Resumo?.commits === 1
  return r
})()
