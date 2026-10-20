// estado: agente
// Fatia 19 (T19.1 + T19.2). Como o `anel`: o claude.exe de verdade abre (conta Pessoal) e o
// cenario responde "No, exit" na confianca da pasta; fica o PowerShell. O "estado do agente" que o
// main le (OSC 7501) e impresso pelo proprio PowerShell, com o ESC montado por [char]27 (o eco do
// comando nao tem o ESC). O painel vem do `prova.ipc`. O que o main digitar (/model, /effort) cai
// no PowerShell, que so reclama do comando: e assim que o cenario ve o que chegou.
// - antes do painel: "modelo ▾" e "esforço ▾" em cinza; com o painel: "Opus 5.5 ▾" e "médio ▾";
// - trabalhando: escolher Sonnet so guarda ("Vale quando o agente parar") e nada e digitado;
// - parado: o main digita /model sonnet; escolher "alto" com ele parado digita /effort high na hora;
// - um painel bem depois ainda com "médio": "⚠ médio" (este modelo nao aceita esse nivel);
// - o quadro salvo no main fica com sonnet/high (volta na proxima abertura, com --model/--effort).
// Fotos: 1-painel, 2-ajustado, 3-recusado.
;(async () => {
  const { espera } = prova
  const q = (s) => document.querySelector(s)
  const r = {}
  const texto = () => [...document.querySelectorAll('[data-quadro="a1"] .xterm-rows > div')].map((d) => d.textContent).join('\n')
  const ate = async (condicao, vezes) => {
    for (let i = 0; i < vezes && !condicao(); i++) await espera(250)
    return condicao()
  }
  const botoes = () => [...document.querySelectorAll('[data-quadro="a1"] .quadro-modelo')]
  const rotulos = () => botoes().map((b) => ({ texto: b.textContent, cinza: b.classList.contains('quadro-modelo-guardado') }))
  const estado = async (s) => {
    await window.lousa.terminais.escrever('a1', `Write-Host -NoNewline ([char]27 + ']7501;state=${s}' + [char]7)\r`)
    await espera(1200)
  }
  const escolher = async (qual, nome) => {
    botoes()[qual].click()
    await espera(300)
    ;[...document.querySelectorAll('.conta-menu .conta-menu-item')].find((b) => b.textContent.includes(nome))?.click()
    await espera(1500)
  }
  let quando = Date.now()
  const painel = async (esforco) => {
    quando = Math.max(quando + 1000, Date.now())
    await prova.ipc('agentes:painel', {
      quadroId: 'a1',
      painel: { modelo: { id: 'claude-opus-5-5', nome: 'Opus 5.5 (1M context)' }, esforco, contexto: null, limites: null, quando },
    })
    await espera(400)
  }

  await ate(() => q('[data-quadro="a1"] .xterm-rows'), 200)
  r.perguntouConfianca = await ate(() => /trust/i.test(texto()), 160)
  if (r.perguntouConfianca) await window.lousa.terminais.escrever('a1', '\r')
  r.voltouAoPowerShell = await ate(() => /PS [^\n]*>\s*$/.test(texto().trimEnd() + ' '), 120)
  await espera(800)

  r.antesDoPainel = rotulos()
  await painel('medium')
  r.comPainel = rotulos()
  await prova.foto('1-painel')

  await estado('working')
  await escolher(0, 'Sonnet')
  r.avisoTrabalhando = botoes()[0]?.title.includes('Vale quando o agente parar')
  r.naoDigitouTrabalhando = !texto().includes('/model sonnet')
  await estado('idle')
  r.digitouModeloAoParar = await ate(() => texto().includes('/model sonnet'), 20)

  await escolher(1, 'alto')
  r.digitouEsforcoNaHora = await ate(() => texto().includes('/effort high'), 20)
  r.rotuloGuardadoAntesDoPainel = rotulos()[1]
  await prova.foto('2-ajustado')

  // o painel chega bem depois do pedido e continua "medium": o modelo nao aceitou
  quando = Date.now() + 5000
  await painel('medium')
  r.recusado = { texto: botoes()[1]?.textContent, alerta: botoes()[1]?.classList.contains('quadro-modelo-alerta') }
  await prova.foto('3-recusado')

  const salvo = (await window.lousa.lousa.carregar()).quadros.find((x) => x.id === 'a1')
  r.salvo = { modelo: salvo?.modelo, esforco: salvo?.esforco }

  await window.lousa.terminais.escrever('a1', 'exit\r')
  await espera(1500)

  r.ok =
    r.voltouAoPowerShell &&
    r.antesDoPainel.length === 2 &&
    r.antesDoPainel.every((x) => x.cinza) &&
    r.comPainel[0]?.texto === 'Opus 5.5 ▾' &&
    r.comPainel[1]?.texto === 'médio ▾' &&
    !r.comPainel[0]?.cinza &&
    r.avisoTrabalhando &&
    r.naoDigitouTrabalhando &&
    r.digitouModeloAoParar &&
    r.digitouEsforcoNaHora &&
    r.recusado.alerta &&
    r.recusado.texto === '⚠ médio ▾' &&
    r.salvo.modelo === 'sonnet' &&
    r.salvo.esforco === 'high'
  return r
})()
