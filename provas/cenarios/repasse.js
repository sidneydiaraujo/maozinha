// estado: repasse
// Fatia 30 (T30.1, D43). Dois agentes da Pessoal no app, ja ligados a1 -> a2. Cada um abre o
// claude.exe de verdade e o cenario responde "No, exit" na confianca (nenhuma mensagem, como o
// cenario `time`). Depois roda o Claude falso (provas/apoio/eco-repasse.mjs, o node copiado como
// claude.exe) nos dois:
// - a1 faz 4 vezes seguidas trabalhando -> terminou: o a2 recebe 3 repasses, um por parada, com
//   o que o a1 disse; no quarto a linha pausa e diz "Limite de 3 repasses: Continuar?";
// - clicar em "Continuar?" retoma a linha e o a2 recebe o quarto;
// - modo "perguntar": a linha diz "▶ Passar para Claude 2" e nada chega ate o clique;
// - a2 fechado (saiu do PowerShell): a linha diz "Claude 2 está fechado".
// Fotos: 1-passou, 2-limite, 3-perguntar, 4-fechado.
;(async () => {
  const { espera } = prova
  const { pastaDemo, apoio } = prova.dados
  const q = (s) => document.querySelector(s)
  const r = { erros: [] }
  const texto = (id) => [...document.querySelectorAll(`[data-quadro="${id}"] .xterm-rows > div`)].map((d) => d.textContent).join('\n')
  const semEspaco = (id) => texto(id).replace(/\s+/g, '')
  const ate = async (condicao, vezes = 40) => {
    for (let i = 0; i < vezes && !condicao(); i++) await espera(250)
    return !!condicao()
  }
  const passo = async (nome, corpo) => {
    try {
      await corpo()
    } catch (e) {
      r.erros.push(`${nome}: ${String((e && e.stack) || e)}`)
    }
  }
  const rotulo = () => q('[data-linha="l1"]')?.textContent ?? null
  // o falso numera o que recebe; no a2 so a Lousa digita
  const recebidos = () => Math.max(0, ...[...semEspaco('a2').matchAll(/RECEBI(\d+):\[Lousa\]/g)].map((m) => Number(m[1])))
  const chegou = (t) => semEspaco('a2').includes(`disse:"${t}"`)
  const linha = async () => (await window.lousa.lousa.carregar()).ligacoes?.find((l) => l.id === 'l1') ?? null

  await passo('0 confianca e Claude falso', async () => {
    await ate(() => /trust/i.test(texto('a1')) && /trust/i.test(texto('a2')), 240)
    for (const id of ['a1', 'a2']) await window.lousa.terminais.escrever(id, '\r')
    // o Claude de verdade precisa ter saido de vez (prompt do PowerShell na ultima linha)
    const noPowerShell = (id) => /PS [^\n]*>\s*$/.test(texto(id).trimEnd() + ' ')
    await ate(() => noPowerShell('a1') && noPowerShell('a2'), 80)
    await espera(3000)
    const falso = `${pastaDemo}\\..\\claude-falso\\claude.exe`
    const MARCA = 'COPI' + 'ADO'
    await window.lousa.terminais.escrever(
      'a1',
      `New-Item -ItemType Directory -Force (Split-Path '${falso}') | Out-Null; Copy-Item (Get-Command node).Source '${falso}'; Write-Output ('COPI' + 'ADO')\r`,
    )
    r.copiado = await ate(() => texto('a1').split('\n').some((l) => l.trim() === MARCA), 40)
    for (const id of ['a1', 'a2']) await window.lousa.terminais.escrever(id, `cls; & '${falso}' '${apoio}\\eco-repasse.mjs'\r`)
    r.falsoPronto = await ate(() => /ECO DO REPASSE PRONTO/.test(texto('a1')) && /ECO DO REPASSE PRONTO/.test(texto('a2')), 80)
    await espera(1500)
  })

  await passo('1 tres repasses e o freio', async () => {
    await window.lousa.terminais.escrever('a1', 'ciclos 4 construi o login\r')
    await ate(() => recebidos() >= 1, 40)
    r.rotuloPassou = rotulo()
    await prova.foto('1-passou')
    await ate(() => /Limite/.test(rotulo() ?? ''), 80)
    await espera(1500)
    r.recebidosAntesDoFreio = recebidos()
    r.textoDoRepasse = semEspaco('a2').includes('RECEBI1:[Salazar]SeucolegaClaude1terminouedisse:"construiologin1".')
    r.rotuloLimite = rotulo()
    r.pausadaNoMain = (await linha())?.pausada === true
    await prova.foto('2-limite')
    q('[data-linha="l1"]').click()
    // depois do freio a prova olha o texto no terminal do a2, nao a resposta do falso: nas rodadas
    // de 21/10 o falso as vezes parou de ler (a linha aparecia so ecoada), fora da Lousa nao
    await ate(() => chegou('construiologin4'), 40)
    r.quartoChegou = chegou('construiologin4')
    r.menuNaoAbriu = !q('.menu-linha')
    r.retomada = (await linha())?.pausada !== true
  })

  await passo('2 perguntar', async () => {
    await window.lousa.time.ajustar('l1', { modo: 'perguntar' })
    await window.lousa.terminais.escrever('a1', 'ciclos 1 revisei\r')
    await ate(() => /Passar para/.test(rotulo() ?? ''), 40)
    r.rotuloPerguntar = rotulo()
    await espera(1500)
    r.semRepasseAntesDoClique = !chegou('revisei1')
    await prova.foto('3-perguntar')
    q('[data-linha="l1"]').click()
    await ate(() => chegou('revisei1'), 40)
    r.passouNoClique = chegou('revisei1')
  })

  await passo('3 colega fechado', async () => {
    await window.lousa.time.ajustar('l1', { modo: 'automatico' })
    await window.lousa.terminais.escrever('a2', '\x03')
    await espera(800)
    await window.lousa.terminais.escrever('a2', 'exit\r')
    await ate(() => q('[data-quadro="a2"] .quadro-encerrado'), 40)
    await window.lousa.terminais.escrever('a1', 'ciclos 1 ultimo\r')
    await ate(() => /fechado/.test(rotulo() ?? ''), 40)
    r.rotuloFechado = rotulo()
    await prova.foto('4-fechado')
    await window.lousa.terminais.escrever('a1', '\x03')
  })

  r.ok =
    r.erros.length === 0 &&
    r.falsoPronto &&
    /passou para Claude 2/.test(r.rotuloPassou ?? '') &&
    r.recebidosAntesDoFreio === 3 &&
    r.textoDoRepasse &&
    r.rotuloLimite === 'Limite de 3 repasses: Continuar?' &&
    r.pausadaNoMain &&
    r.quartoChegou &&
    r.menuNaoAbriu &&
    r.retomada &&
    r.rotuloPerguntar === '▶ Passar para Claude 2' &&
    r.semRepasseAntesDoClique &&
    r.passouNoClique &&
    r.rotuloFechado === 'Claude 2 está fechado'
  return r
})()
