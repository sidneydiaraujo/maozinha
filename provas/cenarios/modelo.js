// estado: agente
// Fatia 19 (T19.1 + T19.2), refeita na D49: trocar o modelo ou o esforco REABRE o agente com
// --model/--effort na mesma conversa; a Lousa nunca digita /model nem /effort (o Claude gravaria
// a escolha como padrao da conta). O claude.exe de verdade abre (conta Pessoal) na pasta de
// teste, que ele nao conhece: fica na pergunta de confianca e o cenario responde "No, exit".
// Nenhuma mensagem vai ao modelo. Depois roda o Claude falso (provas/apoio/eco-modelo.mjs, o node
// copiado como claude.exe), que diz parado/trabalhando quando o cenario manda.
// - na pergunta de confianca: escolher Sonnet so guarda ("Vale quando o agente parar"), nao reabre;
// - a primeira linha de status (o painel gravado em <dados>\agentes\a1.json) diz que ele ficou
//   pronto: a troca guardada vale e o agente reabre com --model sonnet;
// - falso parado: escolher "alto" reabre na hora com --model sonnet --effort high;
// - falso trabalhando: escolher Haiku so guarda; ao parar, reabre com --model haiku;
// - em nenhum momento /model ou /effort chega ao agente; o rotulo e o "⚠ médio" seguem do painel.
// Fotos: 1-painel, 2-reaberto, 3-recusado.
;(async () => {
  const { espera } = prova
  const { pastaDemo, apoio } = prova.dados
  const r = { passos: [] }
  const texto = () => [...document.querySelectorAll('[data-quadro="a1"] .xterm-rows > div')].map((d) => d.textContent).join('\n')
  const escrever = (dados) => window.lousa.terminais.escrever('a1', dados)
  const ate = async (condicao, vezes) => {
    for (let i = 0; i < vezes && !condicao(); i++) await espera(250)
    return condicao()
  }
  const botoes = () => [...document.querySelectorAll('[data-quadro="a1"] .quadro-modelo')]
  const rotulos = () => botoes().map((b) => ({ texto: b.textContent, cinza: b.classList.contains('quadro-modelo-guardado') }))
  const escolher = async (qual, nome) => {
    botoes()[qual].click()
    await espera(300)
    ;[...document.querySelectorAll('.conta-menu .conta-menu-item')].find((b) => b.textContent.includes(nome))?.click()
    await espera(1500)
  }
  let digitouComando = false
  const vigiar = () => (digitouComando ||= /RECEBI: \/(model|effort)|^\s*>\s*\/(model|effort)/m.test(texto()))
  const confianca = () => /trust/i.test(texto())
  const powershell = () => /PS [^\n]*>\s*$/.test(texto().trimEnd() + ' ')
  /** A pergunta de confianca de um Claude que (re)abriu: "No, exit" e volta ao PowerShell. */
  const sairDaConfianca = async () => {
    const perguntou = await ate(confianca, 160)
    if (perguntou) await escrever('\r')
    return perguntou && (await ate(powershell, 120))
  }
  const falso = `${pastaDemo}\\..\\claude-falso\\claude.exe`
  const rodarFalso = async () => {
    await escrever(`cls; & '${falso}' '${apoio}\\eco-modelo.mjs'\r`)
    return ate(() => /ECO DO MODELO PRONTO/.test(texto()), 80)
  }
  let quando = Date.now()
  const painelNaTela = async (esforco) => {
    quando = Math.max(quando + 1000, Date.now())
    await prova.ipc('agentes:painel', {
      quadroId: 'a1',
      painel: { modelo: { id: 'claude-opus-5-5', nome: 'Opus 5.5 (1M context)' }, esforco, contexto: null, limites: null, quando },
    })
    await espera(400)
  }

  await ate(() => document.querySelector('[data-quadro="a1"] .xterm-rows'), 200)
  r.antesDoPainel = rotulos()

  // 1. na pergunta de confianca (claude.exe rodando, sem estado, sem linha de status): so guarda
  r.perguntouConfianca = await ate(confianca, 160)
  await escolher(0, 'Sonnet')
  // a resposta chega depois de o main perguntar ao Windows se ha um claude.exe (alguns segundos)
  r.avisoNaConfianca = await ate(() => botoes()[0]?.title.includes('Vale quando o agente parar'), 40)
  await espera(2500)
  r.naoReabriuNaConfianca = confianca() && !/--model sonnet/.test(texto())
  r.passos.push('1 confianca')

  // 2. "No, exit"; o painel gravado pelo PowerShell = a primeira linha de status: reabre
  await escrever('\r')
  r.voltouAoPowerShell = await ate(powershell, 120)
  await escrever(`cls; New-Item -ItemType Directory -Force (Split-Path '${falso}') | Out-Null; Copy-Item (Get-Command node).Source '${falso}'\r`)
  await espera(2500)
  const json = '{"model":{"id":"claude-opus-5-5","display_name":"Opus 5.5 (1M context)"},"effort":{"level":"medium"}}'
  await escrever(`Set-Content -Encoding utf8 -Path '${pastaDemo}\\..\\dados\\agentes\\a1.json' -Value '${json}'\r`)
  r.reabriuAoFicarPronto = await ate(() => /--model sonnet/.test(texto()), 80)
  r.saiuDeNovo = await sairDaConfianca()
  await painelNaTela('medium')
  r.comPainel = rotulos()
  await prova.foto('1-painel')
  r.passos.push('2 pronto')

  // 3. falso parado: escolher "alto" reabre na hora com os dois
  r.falsoPronto = await rodarFalso()
  await espera(1200)
  vigiar()
  await escolher(1, 'alto')
  r.reabriuParado = await ate(() => /--model sonnet --effort high/.test(texto()), 80)
  r.saiuDepoisDoAlto = await sairDaConfianca()
  r.passos.push('3 parado')

  // 4. falso trabalhando: Haiku so guarda; ao parar, reabre com --model haiku
  r.falsoDeNovo = await rodarFalso()
  await espera(1200)
  await escrever('trabalhe\r')
  await espera(800)
  await escolher(0, 'Haiku')
  r.avisoTrabalhando = await ate(() => botoes()[0]?.title.includes('Vale quando o agente parar'), 40)
  vigiar()
  await espera(1500)
  r.naoReabriuTrabalhando = /ECO DO MODELO PRONTO/.test(texto()) && !/--model haiku/.test(texto())
  await escrever('pare\r')
  r.reabriuAoParar = await ate(() => /--model haiku --effort high/.test(texto()), 80)
  r.saiuNoFim = await sairDaConfianca()
  await prova.foto('2-reaberto')
  r.passos.push('4 trabalhando')

  // 5. o painel chega bem depois do pedido e continua "medium": o modelo nao aceitou o "alto"
  quando = Date.now() + 5000
  await painelNaTela('medium')
  r.recusado = { texto: botoes()[1]?.textContent, alerta: botoes()[1]?.classList.contains('quadro-modelo-alerta') }
  await prova.foto('3-recusado')

  const salvo = (await window.lousa.lousa.carregar()).quadros.find((x) => x.id === 'a1')
  r.salvo = { modelo: salvo?.modelo, esforco: salvo?.esforco }
  r.nuncaDigitouModel = !digitouComando

  await escrever('exit\r')
  await espera(1500)

  r.ok =
    r.antesDoPainel.length === 2 &&
    r.antesDoPainel.every((x) => x.cinza) &&
    r.perguntouConfianca &&
    r.avisoNaConfianca &&
    r.naoReabriuNaConfianca &&
    r.voltouAoPowerShell &&
    r.reabriuAoFicarPronto &&
    r.saiuDeNovo &&
    r.comPainel[0]?.texto === 'Opus 5.5 ▾' &&
    !r.comPainel[0]?.cinza &&
    r.falsoPronto &&
    r.reabriuParado &&
    r.saiuDepoisDoAlto &&
    r.falsoDeNovo &&
    r.avisoTrabalhando &&
    r.naoReabriuTrabalhando &&
    r.reabriuAoParar &&
    r.recusado.alerta &&
    r.recusado.texto === '⚠ médio ▾' &&
    r.salvo.modelo === 'haiku' &&
    r.salvo.esforco === 'high' &&
    r.nuncaDigitouModel
  return r
})()
