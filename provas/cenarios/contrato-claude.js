// estado: contrato
// R4.21, COM CLAUDE DE VERDADE (conta Pessoal, pede o ok do Sidney; NAO manda mensagem nenhuma).
// Rode a cada atualizacao do Claude Code: confere o que src/shared/contratoClaude.ts supoe.
// - o agente abre com o --settings da Lousa (com wheelScrollAccelerationEnabled) sem reclamar dele;
// - a linha de status chega (painel com modelo, esforco e limites);
// - o t1 (mesma conta) ve um processo claude.exe rodando;
// - "/compact" digitado sem Enter mostra "Free up context" no menu; os Backspaces apagam;
// - Ctrl+S tira o rascunho da caixa;
// - depois de sair do Claude, o `claude --help` no t1 lista as opcoes que a Lousa usa.
// Fotos: 1-aberto, 2-menu, 3-guardado, 4-ajuda.
;(async () => {
  const { espera } = prova
  const q = (s) => document.querySelector(s)
  const r = {}
  const texto = (id) =>
    [...document.querySelectorAll(`[data-quadro="${id}"] .xterm-rows > div`)].map((d) => d.textContent).join('\n')
  const ate = async (condicao, vezes) => {
    for (let i = 0; i < vezes && !condicao(); i++) await espera(250)
    return !!condicao()
  }
  // as mesmas de OPCOES_DA_LINHA e TEXTO_MENU_COMPACT em src/shared/contratoClaude.ts
  const OPCOES = ['--settings', '--resume', '--session-id', '--model', '--effort', '--mcp-config']
  const MENU = 'Free up context'
  const RASCUNHO = 'rascunho-da-prova-contrato'
  const recebidos = []
  const parar = window.lousa.agentes.aoPainel((quadroId, painel) => recebidos.push({ quadroId, painel }))

  await ate(() => q('[data-quadro="a1"] .xterm-rows') && /PS .*>/.test(texto('t1')), 200)
  r.abriuComSettings = await ate(() => /--settings\s*'[^']*a1\.settings\.json'/.test(texto('a1').replace(/\n/g, '')), 80)
  r.perguntouConfianca = await ate(() => /trust/i.test(texto('a1')), 120)
  if (r.perguntouConfianca) {
    await window.lousa.terminais.escrever('a1', '\x1b[B')
    await espera(800)
    r.setaNoSim = /❯\s*(\d\.\s*)?Yes/.test(texto('a1'))
    if (r.setaNoSim) await window.lousa.terminais.escrever('a1', '\r')
  }
  r.linhaDeStatus = await ate(() => recebidos.some((x) => x.quadroId === 'a1' && x.painel?.modelo), 160)
  r.semAvisoDeSettings = !/invalid settings|unknown (setting|key)|settings error/i.test(texto('a1'))
  await prova.foto('1-aberto')

  // o processo que terminais/filhos.ts procura
  await window.lousa.terminais.escrever(
    't1',
    "('PRO' + 'CESSO=') + @(Get-CimInstance Win32_Process | Where-Object { $_.Name -eq 'claude.exe' }).Count\r",
  )
  await ate(() => /PROCESSO=\d+/.test(texto('t1')), 40)
  r.processos = Number((texto('t1').match(/PROCESSO=(\d+)/) ?? [])[1] ?? 0)

  // menu do /compact, sem Enter, e apaga
  await window.lousa.terminais.escrever('a1', '/compact')
  r.menuDoCompact = await ate(() => texto('a1').replace(/\s+/g, ' ').includes(MENU), 20)
  await prova.foto('2-menu')
  await window.lousa.terminais.escrever('a1', '\x7f'.repeat('/compact'.length))
  await espera(600)

  // Ctrl+S guarda a caixa e a limpa
  await window.lousa.terminais.escrever('a1', RASCUNHO)
  r.rascunhoNaCaixa = await ate(() => texto('a1').includes(RASCUNHO), 20)
  await window.lousa.terminais.escrever('a1', '\x13')
  r.ctrlSGuardou = await ate(() => !texto('a1').includes(RASCUNHO), 20)
  await prova.foto('3-guardado')

  // sai do Claude sem mandar nada
  await window.lousa.terminais.escrever('a1', '\x03')
  await espera(500)
  await window.lousa.terminais.escrever('a1', '\x03')
  await espera(2500)

  // as opcoes da linha de comando
  const lista = OPCOES.map((o) => `'${o}'`).join(',')
  await window.lousa.terminais.escrever(
    't1',
    `cls; $h = claude --help | Out-String; ('OPC' + 'OES=') + @(${lista} | Where-Object { $h.Contains($_) }).Count\r`,
  )
  await ate(() => /OPCOES=\d+/.test(texto('t1')), 80)
  r.opcoes = Number((texto('t1').match(/OPCOES=(\d+)/) ?? [])[1] ?? 0)
  await window.lousa.terminais.escrever('t1', "('VER' + 'SAO=') + (claude --version)\r")
  await ate(() => /VERSAO=\S+/.test(texto('t1')), 40)
  // a versao que vai para VERSAO_CONFERIDA se tudo passar
  r.versao = (texto('t1').match(/VERSAO=(\d+\.\d+\.\d+)/) ?? [])[1] ?? null
  await prova.foto('4-ajuda')
  await window.lousa.terminais.escrever('a1', 'exit\r')
  parar()

  r.ok =
    r.abriuComSettings &&
    r.linhaDeStatus &&
    r.semAvisoDeSettings &&
    r.processos > 0 &&
    r.menuDoCompact &&
    r.rascunhoNaCaixa &&
    r.ctrlSGuardou &&
    r.opcoes === OPCOES.length
  return r
})()
