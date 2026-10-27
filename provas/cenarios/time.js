// estado: time
// Fatia 28 (D39), com Claude de verdade (ok do Sidney em 21/10/2026). Cada agente abre o
// claude.exe e o cenario responde "No, exit" na confianca da pasta: o Claude fecha sem mensagem e
// fica o PowerShell. Com o mouse de verdade:
// - so os agentes tem bolinhas (o terminal t1 nao);
// - a1 -> a3 (outra conta, outro repo) e recusado com o motivo; a1 -> a2 liga, ambar (mesma pasta);
// - a volta a2 -> a1 e recusada; clique na bolinha do a2 cria um colega numa copia, ja ligado;
// - arrastar a bolinha do a3 e soltar no vazio cria um colega ali;
// - menu da linha: perguntar e pausar; "Abrir o colega numa copia" na linha ambar;
// - o salvo no main bate com a tela; fechar um quadro tira as linhas dele.
// Fotos: 1-ligados, 2-colegas, 3-menu, 4-final.
;(async () => {
  const { espera } = prova
  const q = (s) => document.querySelector(s)
  const todos = (s) => [...document.querySelectorAll(s)]
  const r = {}
  const texto = (id) => todos(`[data-quadro="${id}"] .xterm-rows > div`).map((d) => d.textContent).join('\n')
  const ate = async (condicao, vezes = 40) => {
    for (let i = 0; i < vezes && !condicao(); i++) await espera(250)
    return !!condicao()
  }
  const centro = (el) => {
    const c = el.getBoundingClientRect()
    return { x: Math.round(c.left + c.width / 2), y: Math.round(c.top + c.height / 2) }
  }
  const bolinha = (id, lado) => q(`.react-flow__node[data-id="${id}"] .bolinha-${lado}`)
  const arrastar = async (de, ate_) => {
    const passos = [1, 2, 3, 4, 5, 6, 7, 8].map((k) => ({
      type: 'mouseMove',
      x: Math.round(de.x + ((ate_.x - de.x) * k) / 8),
      y: Math.round(de.y + ((ate_.y - de.y) * k) / 8),
      button: 'left',
    }))
    await prova.eventos([
      { type: 'mouseDown', x: de.x, y: de.y, button: 'left', clickCount: 1 },
      ...passos,
      { type: 'mouseUp', x: ate_.x, y: ate_.y, button: 'left', clickCount: 1 },
    ])
    await espera(900)
  }
  const clicar = async (p) => {
    await prova.eventos([
      { type: 'mouseDown', x: p.x, y: p.y, button: 'left', clickCount: 1 },
      { type: 'mouseUp', x: p.x, y: p.y, button: 'left', clickCount: 1 },
    ])
    await espera(900)
  }
  /** Primeiro ponto da lousa (o fundo, sem quadro, menu, minimapa ou botao) numa grade de 40 px. */
  const pontoVazio = () => {
    const area = q('.react-flow__pane').getBoundingClientRect()
    for (let y = area.bottom - 140; y > area.top + 120; y -= 40) {
      for (let x = area.left + 120; x < area.right - 520; x += 40) {
        // uma area de 240 x 160 toda livre (grade de 5 x 5 pontos), e o ponto e o centro dela
        const passos = [0, 1, 2, 3, 4]
        const livre = passos.every((i) => passos.every((j) => document.elementFromPoint(x + i * 60, y - j * 40)?.classList.contains('react-flow__pane')))
        if (livre) return { x: Math.round(x + 120), y: Math.round(y - 80) }
      }
    }
    return null
  }
  // o aviso e o erro da lousa juntos: o aviso do colega novo fica na tela e escondia a recusa
  const aviso = () => [q('.lousa-aviso')?.textContent, q('.lousa-erro')?.textContent].filter(Boolean).join(' | ') || null
  const linhas = () => todos('.react-flow__edge.linha-time').map((g) => g.dataset.id)
  const salvas = async () => (await window.lousa.lousa.carregar()).ligacoes ?? []
  const quadros = () => todos('.react-flow__node-quadro').map((n) => n.dataset.id)
  const respondidos = new Set()
  // opcao sem-claude (rodar.mjs <cenario> sem-claude): os agentes abrem sem o claude.exe de verdade
  const semClaude = (prova.dados.opcoes ?? []).includes('sem-claude')
  // fecha o Claude de cada agente na pergunta de confianca, sem "Yes" e sem mensagem
  const fecharConfianca = async () => {
    for (const id of quadros()) {
      if (respondidos.has(id) || !/trust/i.test(texto(id))) continue
      respondidos.add(id)
      await window.lousa.terminais.escrever(id, '\r')
    }
  }

  const inicio = Date.now()
  r.estados = []
  window.lousa.terminais.aoEstado((id, aviso) => r.estados.push({ id, s: Math.round((Date.now() - inicio) / 1000), ...aviso }))
  r.passos = {}
  const passo = (nome) => (r.passos[nome] = Math.round((Date.now() - inicio) / 1000))
  // sem o Claude, espera a lousa e o PowerShell de cada agente (a espera da confianca fazia isso)
  if (semClaude) {
    await ate(() => ['a1', 'a2', 'a3'].every((id) => /PS .*>/.test(texto(id))), 240)
    await espera(8000) // a lousa termina de enquadrar (com o Claude, a confianca levava ~25 s)
  } else await ate(() => ['a1', 'a2', 'a3'].every((id) => /trust/i.test(texto(id))), 240)
  await fecharConfianca()
  r.confiancaRespondida = [...respondidos]

  // bolinhas so nos agentes
  r.bolinhas = Object.fromEntries(['a1', 'a2', 'a3', 't1'].map((id) => [id, todos(`.react-flow__node[data-id="${id}"] .bolinha-time`).length]))

  // primeiro de tudo, com o zoom de abertura (bolinhas grandes, nada rolou a lousa ainda):
  // arrastar a bolinha do a3 e soltar no vazio cria um colega ali
  const vazio = pontoVazio()
  r.pontoVazio = vazio
  if (vazio) await arrastar(centro(bolinha('a3', 'saida')), vazio)
  await ate(() => quadros().length === 5, 60)
  const c2 = quadros().find((id) => !['a1', 'a2', 'a3', 't1'].includes(id))
  const caixaC2 = c2 ? q(`.react-flow__node[data-id="${c2}"]`).getBoundingClientRect() : null
  r.colegaNoVazio = {
    aviso: aviso(),
    criado: !!c2,
    distancia: caixaC2 ? Math.round(Math.hypot(caixaC2.left - vazio.x, caixaC2.top - vazio.y)) : null,
    ligado: (await salvas()).some((l) => l.de === 'a3' && l.para === c2),
  }

  // a1 -> a3: outra conta em outro repo. As contagens sao a partir daqui: a linha a3 -> colega
  // do passo acima ja esta na lousa (antes ela ficava no fim e as contas comecavam do zero)
  // a linha do quadro novo so e desenhada depois que o React Flow mede o quadro: espera a tela
  // alcancar o salvo antes de contar
  const salvasAntes = (await salvas()).length
  await ate(() => linhas().length === salvasAntes, 40)
  const antes = linhas().length
  await arrastar(centro(bolinha('a1', 'saida')), centro(bolinha('a3', 'entrada')))
  await espera(600)
  r.recusaContas = { aviso: aviso(), linhas: linhas().length - antes, salvas: (await salvas()).length - salvasAntes }

  // a1 -> a2: liga, ambar
  await arrastar(centro(bolinha('a1', 'saida')), centro(bolinha('a2', 'entrada')))
  await ate(() => linhas().length === antes + 1)
  const ab = (await salvas()).find((l) => l.de === 'a1' && l.para === 'a2')?.id
  r.ligou = {
    linhas: linhas().length - antes,
    ambar: !!q(`.react-flow__edge[data-id="${ab}"].linha-time-mesma-pasta`),
    rotulo: q('.rotulo-linha-time')?.textContent ?? null,
  }

  // a volta a2 -> a1
  await arrastar(centro(bolinha('a2', 'saida')), centro(bolinha('a1', 'entrada')))
  r.recusaVolta = { aviso: aviso(), linhas: linhas().length - antes }
  await prova.foto('1-ligados')

  // clique na bolinha do a2: colega numa copia, ja ligado
  await clicar(centro(bolinha('a2', 'saida')))
  await ate(() => quadros().length === 6, 60)
  const c1 = quadros().find((id) => ![...['a1', 'a2', 'a3', 't1'], c2].includes(id))
  r.colegaPeloClique = {
    criado: !!c1,
    aviso: aviso(),
    pasta: c1 ? (q(`[data-quadro="${c1}"] .quadro-pasta`)?.textContent ?? '').trim() : null,
    ligado: (await salvas()).some((l) => l.de === 'a2' && l.para === c1),
  }

  await espera(1500)
  await fecharConfianca()
  passo('colegas')
  await prova.foto('2-colegas')

  // menu da linha a2 -> c1: perguntar, depois pausar
  const linhaC1 = (await salvas()).find((l) => l.para === c1)?.id
  // clique de mouse de verdade num ponto da linha (a 40% do caminho, longe do rotulo do meio)
  const abrirMenu = async (id) => {
    const caminho = q(`.react-flow__edge[data-id="${id}"] .react-flow__edge-path`)
    if (!caminho) return
    const p = caminho.getPointAtLength(caminho.getTotalLength() * 0.4)
    const tela = new DOMPoint(p.x, p.y).matrixTransform(caminho.getScreenCTM())
    await clicar({ x: Math.round(tela.x), y: Math.round(tela.y) })
  }
  await abrirMenu(linhaC1)
  await ate(() => q('.menu-linha'))
  r.menu = todos('.menu-linha button').map((b) => b.textContent.trim())
  await prova.foto('3-menu')
  todos('.menu-linha button').find((b) => b.textContent.includes('perguntar'))?.click()
  await espera(700)
  r.menuFechou = !q('.menu-linha')
  await abrirMenu(linhaC1)
  await ate(() => q('.menu-linha'))
  const pausar = todos('.menu-linha button').find((b) => b.textContent.includes('Pausar'))
  r.pausar = { menuAberto: !!q('.menu-linha'), achou: !!pausar, marcado: q('.menu-linha [aria-checked="true"]')?.textContent.trim() ?? null }
  pausar?.click()
  await espera(700)
  r.pausar.aviso = aviso()
  const ajustada = (await salvas()).find((l) => l.id === linhaC1)
  await espera(800)
  r.ajustes = {
    modo: ajustada?.modo,
    pausada: ajustada?.pausada,
    tracejada: !!q(`.react-flow__edge[data-id="${linhaC1}"].linha-time-pausada`),
    classe: q(`.react-flow__edge[data-id="${linhaC1}"]`)?.getAttribute('class') ?? null,
  }

  // linha ambar a1 -> a2: abrir o colega numa copia
  // a linha ambar: clique no rotulo "mesma pasta" tambem abre o menu
  const rotuloAb = todos('.rotulo-linha-time').find((d) => d.textContent.includes('mesma pasta'))
  if (rotuloAb) await clicar(centro(rotuloAb))
  r.rotuloAbreMenu = !!q('.menu-linha')
  await ate(() => q('.menu-linha'))
  todos('.menu-linha button').find((b) => b.textContent.includes('Abrir o colega'))?.click()
  await ate(() => quadros().length === 7, 60)
  const ligacoes = await salvas()
  const c3 = quadros().find((id) => ![...['a1', 'a2', 'a3', 't1'], c1, c2].includes(id))
  r.separou = {
    novo: !!c3,
    linhaPassou: ligacoes.some((l) => l.de === 'a1' && l.para === c3),
    antigaSaiu: !ligacoes.some((l) => l.id === ab),
    a2Aberto: quadros().includes('a2'),
  }

  // o salvo bate com a tela; fechar o c1 tira a linha dele
  // a linha do quadro novo so e desenhada depois que o React Flow mede o quadro
  const iguais = () => JSON.stringify(ligacoes.map((l) => l.id).sort()) === JSON.stringify(linhas().sort())
  r.salvoIgualTela = await ate(iguais, 20)
  q(`[data-quadro="${c1}"] .botao-fechar`)?.click()
  await ate(() => !quadros().includes(c1), 40)
  await espera(800)
  r.fechouC1 = { linhasDoC1: (await salvas()).filter((l) => l.de === c1 || l.para === c1).length, naTela: linhas().length }
  await espera(1500)
  await fecharConfianca()
  await prova.foto('4-final')

  passo('papel')
  // --- Fatia 29: papel e apresentacao ---
  // papel "Construtor" no a1 pela tela (clique, escreve, Enter)
  q('[data-quadro="a1"] .papel-quadro')?.click()
  await ate(() => q('[data-quadro="a1"] .papel-quadro-campo'))
  const campo = q('[data-quadro="a1"] .papel-quadro-campo')
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(campo, 'Construtor')
  campo.dispatchEvent(new Event('input', { bubbles: true }))
  await prova.eventos([{ type: 'keyDown', keyCode: 'Enter' }, { type: 'keyUp', keyCode: 'Enter' }])
  await ate(() => q('[data-quadro="a1"] .papel-quadro')?.textContent === 'Construtor')
  const a1Salvo = (await window.lousa.lousa.carregar()).quadros.find((x) => x.id === 'a1')
  r.papel = { naTela: q('[data-quadro="a1"] .papel-quadro')?.textContent ?? null, salvo: a1Salvo?.papel ?? null }
  // o a1 esta no PowerShell (o Claude saiu na confianca): nada e digitado
  await espera(3500)
  const semEspaco = (id) => texto(id).replace(/\s+/g, '')
  passo('fimEspera')
  r.apresentacao = { antesDeParar: semEspaco('a1').includes('[Mãozinha]') }
  // o PowerShell imprime o OSC 7501 "idle": o main acha que parou, mas nao ha claude.exe no
  // terminal (T29.1): continua sem digitar
  await window.lousa.terminais.escrever('a1', "Write-Host -NoNewline ([char]27 + ']7501;state=idle' + [char]7)\r")
  await espera(4000)
  r.apresentacao.semClaudeNaoDigita = !semEspaco('a1').includes('[Mãozinha]')
  // Claude falso: o node copiado como claude.exe, filho do PowerShell, diz "parado" e ecoa
  const { pastaDemo, apoio } = prova.dados
  const falso = `${pastaDemo}\\..\\claude-falso\\claude.exe`
  await window.lousa.terminais.escrever(
    'a1',
    `New-Item -ItemType Directory -Force (Split-Path '${falso}') | Out-Null; Copy-Item (Get-Command node).Source '${falso}'; & '${falso}' '${apoio}\\eco-time.mjs'\r`,
  )
  await ate(() => semEspaco('a1').includes('RECEBI:[Mãozinha]'), 80)
  const t = semEspaco('a1')
  r.apresentacao.comClaudeChegou = t.includes('RECEBI:[Mãozinha]VocêéConstrutornumtimede2agentes.')
  r.apresentacao.colega = t.includes('Colegas:')
  r.apresentacao.entrega = t.includes('oseutrabalhovaipara')
  r.apresentacao.semPontoEVirgula = !/RECEBI: \[Lousa\][^\n]*;/.test(texto('a1'))
  await prova.foto('5-apresentacao')
  await window.lousa.terminais.escrever('a1', '\x03')

  r.ok =
    r.papel.salvo === 'Construtor' &&
    r.papel.naTela === 'Construtor' &&
    !r.apresentacao.antesDeParar &&
    r.apresentacao.semClaudeNaoDigita &&
    r.apresentacao.comClaudeChegou &&
    r.apresentacao.colega &&
    r.apresentacao.entrega &&
    r.bolinhas.a1 === 2 &&
    r.bolinhas.a3 === 2 &&
    r.bolinhas.t1 === 0 &&
    /Contas diferentes/.test(r.recusaContas.aviso ?? '') &&
    r.recusaContas.linhas === 0 &&
    r.ligou.linhas === 1 &&
    r.ligou.ambar &&
    /já estão ligados/.test(r.recusaVolta.aviso ?? '') &&
    r.colegaPeloClique.criado &&
    r.colegaPeloClique.ligado &&
    /⑂/.test(r.colegaPeloClique.pasta ?? '') &&
    r.colegaNoVazio.criado &&
    r.colegaNoVazio.distancia !== null &&
    r.colegaNoVazio.distancia < 120 &&
    r.colegaNoVazio.ligado &&
    r.ajustes.modo === 'perguntar' &&
    r.ajustes.pausada === true &&
    r.ajustes.tracejada &&
    r.separou.novo &&
    r.separou.linhaPassou &&
    r.separou.antigaSaiu &&
    r.separou.a2Aberto &&
    r.salvoIgualTela &&
    r.fechouC1.linhasDoC1 === 0
  return r
})()
