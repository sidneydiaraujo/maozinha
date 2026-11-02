// estado: time
// A26, rodar com as opcoes `ligados sem-claude`: a1 -> a2 (time no app), a3 sozinho no api. Os
// avisos dos agentes vem do `prova.ipc` (sem Claude):
// - "terminou" sai do "esperando você" e entra na pilula verde da mãozinha;
// - membro do time (a2) que terminou nao entra; o lider (a1) so entra quando o a2 para de trabalhar;
// - um pronto: o clique leva direto; dois: abre a fila do mais antigo ao mais novo, com o projeto;
// - clicar numa linha enquadra o quadro e o tira da fila.
// Fotos: 1-um-pronto, 2-fila, 3-depois.
;(async () => {
  const { espera } = prova
  const q = (s) => document.querySelector(s)
  const todos = (s) => [...document.querySelectorAll(s)]
  const r = {}
  const ate = async (condicao, vezes = 40) => {
    for (let i = 0; i < vezes && !condicao(); i++) await espera(250)
    return !!condicao()
  }
  const aviso = async (id, estado) => {
    await prova.ipc('terminais:estado', { terminalId: id, aviso: { estado } })
    await espera(300)
  }
  const vista = () => q('.react-flow__viewport').style.transform
  const botao = () => q('.topo-prontos')
  const linhas = () => todos('.pronto-linha').map((b) => b.innerText.replace(/\s+/g, ' ').trim())

  r.semClaude = (prova.dados.opcoes ?? []).includes('sem-claude')
  r.ligados = (prova.dados.opcoes ?? []).includes('ligados')
  await ate(() => todos('.react-flow__node').length >= 4, 120)
  await espera(1500)
  r.semProntosNoInicio = !botao()

  // time: o membro termina, o lider termina, mas o membro volta a trabalhar -> ninguem
  await aviso('a2', 'terminou')
  r.membroNaoEntra = !botao()
  await aviso('a2', 'trabalhando')
  await aviso('a1', 'terminou')
  r.liderEsperaOTime = !botao()
  r.pilulaSemTerminou = !/esperando/.test(q('.topo-chamadas')?.innerText ?? '')

  // o a3 (outro projeto) termina sozinho: um pronto, o clique leva direto
  await aviso('a3', 'terminou')
  r.umPronto = botao()?.innerText.trim() ?? null
  r.temMao = !!q('.topo-prontos .mao-chamando')
  r.animando = getComputedStyle(q('.topo-prontos .mao-corpo')).animationName
  r.reduzido = matchMedia('(prefers-reduced-motion: reduce)').matches
  await prova.foto('1-um-pronto')
  const antes = vista()
  botao().click()
  r.foiDireto = await ate(() => vista() !== antes, 20)
  r.saiuDaFila = await ate(() => !botao(), 12)

  // o time para: o a1 (lider) entra; o a3 termina de novo -> dois, em ordem
  await aviso('a2', 'terminou')
  await aviso('a3', 'trabalhando')
  await aviso('a3', 'terminou')
  r.doisProntos = botao()?.innerText.trim() ?? null
  botao().click()
  r.abriuFila = await ate(() => !!q('.fila-prontos'), 12)
  await espera(300)
  r.linhas = linhas()
  await prova.foto('2-fila')

  const depois = vista()
  todos('.pronto-linha')[0].click()
  r.fechouFila = await ate(() => !q('.fila-prontos'), 12)
  r.enquadrouLider = await ate(() => vista() !== depois, 20)
  r.sobrou = botao()?.innerText.trim() ?? null
  await espera(600)
  await prova.foto('3-depois')

  r.ok =
    r.semClaude &&
    r.ligados &&
    r.semProntosNoInicio &&
    r.membroNaoEntra &&
    r.liderEsperaOTime &&
    r.pilulaSemTerminou &&
    r.umPronto === '1 pronto' &&
    r.temMao &&
    r.animando === 'mao-acena' &&
    r.foiDireto &&
    r.saiuDaFila &&
    r.doisProntos === '2 prontos' &&
    r.abriuFila &&
    r.linhas.length === 2 &&
    /^Claude 1 app líder · 2 agentes/.test(r.linhas[0]) &&
    /^Claude 3 api/.test(r.linhas[1]) &&
    r.fechouFila &&
    r.enquadrouLider &&
    r.sobrou === '1 pronto'
  return r
})()
