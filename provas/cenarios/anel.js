// estado: agente
// Fatia 18 (T18.1 + T18.2). O agente a1 abre o claude.exe de verdade (conta Pessoal), mas o
// cenario responde "No, exit" na confianca da pasta (Enter com a seta no lugar de sempre): o
// Claude fecha sem confiar na pasta e sem mensagem, e o quadro fica com o PowerShell aberto.
// Dai em diante o painel e o estado do agente vem do `prova.ipc`, sem Claude:
// - sem painel, o anel nao aparece; com o padrao (a partir de 50%), 30% tambem nao;
// - na engrenagem, "Sempre": o anel aparece com 30, 75 (ambar) e 95 (vermelho), na hora;
// - trabalhando: o anel fica cinza, o clique nao abre nada e o main recusa o compactar;
// - parado: o clique pergunta "Compactar a conversa agora?" (o cenario cancela).
// Fotos: 1-30, 2-75, 3-95, 4-trabalhando, 5-pergunta.
;(async () => {
  const { espera } = prova
  const q = (s) => document.querySelector(s)
  const r = {}
  const texto = (id) =>
    [...document.querySelectorAll(`[data-quadro="${id}"] .xterm-rows > div`)].map((d) => d.textContent).join('\n')
  const ate = async (condicao, vezes) => {
    for (let i = 0; i < vezes && !condicao(); i++) await espera(250)
    return condicao()
  }
  const anel = () => q('[data-quadro="a1"] .anel-contexto')
  let quando = Date.now()
  const painel = async (usado) => {
    quando += 1000
    await prova.ipc('agentes:painel', {
      quadroId: 'a1',
      painel: { modelo: null, esforco: null, contexto: { usado, tamanho: 200000 }, limites: null, quando },
    })
    await espera(400)
  }
  const estado = async (e) => {
    await prova.ipc('terminais:estado', { terminalId: 'a1', aviso: { estado: e } })
    await espera(400)
  }

  await ate(() => q('[data-quadro="a1"] .xterm-rows'), 200)
  // fecha o Claude na pergunta de confianca, sem dizer "Yes"
  r.perguntouConfianca = await ate(() => /trust/i.test(texto('a1')), 160)
  if (r.perguntouConfianca) await window.lousa.terminais.escrever('a1', '\r')
  r.voltouAoPowerShell = await ate(() => /PS [^\n]*>\s*$/.test(texto('a1').trimEnd() + ' '), 120)
  await espera(800)
  r.terminalAberto = !q('[data-quadro="a1"] .quadro-encerrado')

  r.semPainelSemAnel = !anel()
  await painel(30)
  r.padrao30Escondido = !anel()

  // engrenagem: "Contexto da conversa" -> Sempre
  q('[aria-label="Contas e configurações"]').click()
  await espera(600)
  const secao = [...document.querySelectorAll('details.aparencia')].find((d) => d.textContent.includes('Contexto da conversa'))
  secao.querySelector('summary').click()
  await espera(400)
  r.previa = [...secao.querySelectorAll('.contexto-previa .anel')].map((a) => a.getAttribute('class'))
  ;[...secao.querySelectorAll('[role="radio"]')].find((b) => b.textContent === 'Sempre').click()
  await espera(400)
  r.guardado = JSON.parse(localStorage.getItem('lousa.contexto') ?? 'null')
  q('[aria-label="Contas e configurações"]').click()
  await espera(500)

  r.com30 = { numero: anel()?.textContent, nivel: anel()?.dataset.nivel, balao: anel()?.getAttribute('aria-label') }
  await prova.foto('1-30')
  await painel(75)
  // sem estado do agente ainda: o anel fica com a cor do nivel (cinza e so trabalhando)
  r.com75 = { numero: anel()?.textContent, nivel: anel()?.dataset.nivel, cinza: anel()?.classList.contains('anel-esperar') }
  await prova.foto('2-75')
  await painel(95)
  r.com95 = { numero: anel()?.textContent, nivel: anel()?.dataset.nivel }
  await prova.foto('3-95')

  await estado('trabalhando')
  r.cinzaTrabalhando = anel()?.getAttribute('aria-disabled') === 'true' && anel()?.classList.contains('anel-esperar')
  anel()?.click()
  await espera(300)
  r.cliqueNaoAbre = !q('[data-quadro="a1"] .anel-pergunta')
  try {
    await window.lousa.agentes.compactar('a1')
    r.mainRecusou = false
  } catch (e) {
    r.mainRecusou = /Espere o agente parar/.test(String(e))
  }
  await prova.foto('4-trabalhando')

  await estado('parado')
  anel()?.click()
  await espera(300)
  r.pergunta = q('[data-quadro="a1"] .anel-pergunta span')?.textContent ?? null
  await prova.foto('5-pergunta')
  ;[...document.querySelectorAll('[data-quadro="a1"] .anel-pergunta button')].find((b) => b.textContent === 'Cancelar')?.click()
  await espera(300)
  r.cancelou = !q('[data-quadro="a1"] .anel-pergunta')

  await window.lousa.terminais.escrever('a1', 'exit\r')
  await espera(1500)

  r.ok =
    r.terminalAberto &&
    r.semPainelSemAnel &&
    r.padrao30Escondido &&
    r.guardado?.mostrar === 'sempre' &&
    r.com30.numero === '30' &&
    r.com30.nivel === 'ok' &&
    r.com30.balao === '30% do contexto usado (60 mil de 200 mil)' &&
    r.com75.numero === '75' &&
    r.com75.nivel === 'alerta' &&
    r.com75.cinza === false &&
    r.com95.numero === '95' &&
    r.com95.nivel === 'perigo' &&
    r.cinzaTrabalhando &&
    r.cliqueNaoAbre &&
    r.mainRecusou &&
    r.pergunta === 'Compactar a conversa agora?' &&
    r.cancelou
  return r
})()
