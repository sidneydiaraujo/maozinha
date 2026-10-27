// estado: demo
// D48: aba "Histórico" ao lado de "Pastas". Lista os terminais da sessão; o clique num deles leva
// a lousa até ele, ampliado (de novo: continua ampliado, não volta). Fechar o t1 deixa ele no fim,
// apagado e sem clique. Voltar para "Pastas" mostra a árvore como estava. Fotos: 1-historico,
// 2-ampliado, 3-fechado.
;(async () => {
  const { espera } = prova
  const q = (s) => document.querySelector(s)
  const todos = (s) => [...document.querySelectorAll(s)]
  const r = { erros: [] }
  const aba = (nome) => todos('.aba-lateral').find((b) => b.textContent === nome)
  const itens = () =>
    todos('.historico-item').map((b) => ({ nome: b.querySelector('.historico-nome')?.firstChild?.textContent, fechado: b.disabled }))
  /** O quadro ocupa a lousa quase toda (como no cenário ampliar). */
  const enquadrado = (id) => {
    const b = q(`[data-quadro="${id}"]`).getBoundingClientRect()
    const a = q('.lousa').getBoundingClientRect()
    const dentro = b.left >= a.left - 2 && b.right <= a.right + 2 && b.top >= a.top - 2 && b.bottom <= a.bottom + 2
    return dentro && Math.max(b.width / a.width, b.height / a.height) > 0.9
  }
  const clicarItem = async (nome) => {
    todos('.historico-item').find((b) => b.textContent.includes(nome)).click()
    await espera(1200)
  }
  try {
    for (let i = 0; i < 80 && !q('[data-quadro="t2"] .xterm'); i++) await espera(250)
    r.arvoreAntes = todos('.arvore-linha').length
    aba('Histórico').click()
    await espera(400)
    r.abas = { pastasEscondida: q('.explorador[aria-label="Pastas"]').hidden, historicoVisivel: !q('.historico').hidden }
    r.lista = itens()
    await prova.foto('1-historico')
    await clicarItem('Terminal 2')
    r.primeiro = enquadrado('t2')
    await prova.foto('2-ampliado')
    await clicarItem('Terminal 2')
    r.segundo = enquadrado('t2')
    q('[data-quadro="t1"] .botao-fechar').click()
    // o x pergunta antes (BotaoFechar): espera a pergunta e confirma
    await espera(300)
    q('[data-quadro="t1"] .fechar-botoes .botao-perigo').click()
    await espera(1500)
    r.depoisDeFechar = itens()
    await prova.foto('3-fechado')
    aba('Pastas').click()
    await espera(400)
    r.arvoreDepois = todos('.arvore-linha').length
  } catch (e) {
    r.erros.push(String((e && e.stack) || e))
  }
  const fim = r.depoisDeFechar ?? []
  r.ok =
    r.erros.length === 0 &&
    r.abas.pastasEscondida && r.abas.historicoVisivel &&
    r.lista.length === 2 && r.lista.every((i) => !i.fechado) &&
    r.primeiro && r.segundo &&
    fim.length === 2 && fim[1].nome === 'Terminal 1' && fim[1].fechado && !fim[0].fechado &&
    r.arvoreDepois === r.arvoreAntes && r.arvoreAntes > 0
  return r
})()
