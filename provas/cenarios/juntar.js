// estado: git
// Fatias 11, 22 e 23 (D19, D30, D31): arquivo fora do git na original nao atrapalha; copia com
// commit -> "Juntar" mostra o resumo, clicar no arquivo mostra a diferenca -> "Juntar em main" leva o arquivo
// para a pasta original -> fechar apaga a copia e a branch. Conflito (os dois lados mudam a
// mesma linha) desfaz o merge e deixa a original limpa. Alteracao sem commit na copia: a janela
// avisa e o main recusa juntar. Fotos 1..5.
;(async () => {
  const { espera } = prova
  const q = (s) => document.querySelector(s)
  const todos = (s) => [...document.querySelectorAll(s)]
  const r = {}
  const texto = (id) => todos(`[data-quadro="${id}"] .xterm-rows > div`).map((d) => d.textContent).join('').replace(/\s+/g, '')
  const ids = () => todos('[data-quadro]').map((e) => e.dataset.quadro)
  const ate = async (condicao, vezes = 80) => {
    for (let i = 0; i < vezes && !condicao(); i++) await espera(250)
    return !!condicao()
  }
  let marca = 0
  /** Roda uma expressao do PowerShell no terminal e devolve o resultado, sem espacos. */
  const perguntar = async (id, expressao) => {
    const m = `R${++marca}`
    await window.lousa.terminais.escrever(id, `('<' + '${m}>') + (${expressao}) + ('</' + '${m}>')\r`)
    const achar = () => new RegExp(`<${m}>(.*?)</${m}>`).exec(texto(id))?.[1]
    await ate(() => achar() !== undefined, 60)
    return achar() ?? null
  }
  const clicarTexto = (seletor, alvo) => todos(seletor).find((e) => e.textContent.includes(alvo))?.click()
  const janela = () => todos('.janela-juntar p, .juntar-arquivos li').map((e) => e.textContent.trim())
  const novaCopia = async () => {
    const antes = ids()
    clicarTexto('button', '+ Novo quadro')
    await ate(() => q('.novo-quadro'))
    todos('.pasta-escolha').find((e) => e.querySelector('strong')?.textContent === 'app')?.click()
    await espera(300)
    clicarTexto('.novo-botoes button', 'Abrir terminal')
    await ate(() => ids().length > antes.length)
    const id = ids().find((i) => !antes.includes(i))
    const [caminho, linha2] = (q(`[data-quadro="${id}"] .quadro-pasta`)?.title ?? '').split('\n')
    await ate(() => /app\.copias.*>/.test(texto(id)), 60)
    return { id, caminho, branch: /branch (\S+)/.exec(linha2 ?? '')?.[1] }
  }
  const abrirJuntar = async (id) => {
    q(`[data-quadro="${id}"] .botao-juntar`).click()
    await ate(() => q('.janela-juntar') && !/Lendo|Carregando/.test(q('.janela-juntar').textContent), 40)
    await espera(400)
  }

  await ate(() => /app>/.test(texto('q1')), 120)

  // 1. o terminal da copia faz um commit, como um agente faria
  const c = await novaCopia()
  r.botaoJuntar = !!q(`[data-quadro="${c.id}"] .botao-juntar`)
  await window.lousa.terminais.escrever(c.id, "Set-Content -Path novo.txt -Value oi; git add .; git commit -qm 'trabalho do agente'\r")
  await perguntar(c.id, "'pronto'")
  r.commitsNaBranch = await perguntar('q1', `@(git log --oneline main..${c.branch}).Count`)
  // arquivo novo fora do git na original nao impede de juntar (D30)
  await window.lousa.terminais.escrever('q1', 'Set-Content -Path rascunho.txt -Value meu\r')
  await perguntar('q1', "'pronto'")
  await abrirJuntar(c.id)
  r.resumo = janela()
  await prova.foto('1-resumo')

  // clicar no arquivo mostra o que a copia mudou nele (T22.1)
  todos('.juntar-arquivos button').find((b) => b.textContent.includes('novo.txt'))?.click()
  await ate(() => q('.diff-linhas'), 40)
  r.diff = { mais: todos('.diff-mais').map((e) => e.textContent.trim()) }
  await prova.foto('1b-diff')
  clicarTexto('.diff-topo button', 'Arquivos')
  await ate(() => q('.juntar-arquivos'), 20)
  r.diff.voltou = !!q('.juntar-arquivos')

  clicarTexto('.juntar-botoes button', 'Juntar em main')
  await ate(() => todos('.juntar-botoes button').some((b) => b.textContent.includes('Fechar o quadro')), 40)
  r.depoisDeJuntar = janela()
  r.arquivoNaOriginal = await perguntar('q1', "Get-Content 'novo.txt'")
  await prova.foto('2-juntou')

  clicarTexto('.juntar-botoes button', 'Fechar o quadro')
  await ate(() => !ids().includes(c.id) && q('.lousa-aviso'))
  r.aviso = q('.lousa-aviso')?.textContent ?? null
  r.copiaExiste = await perguntar('q1', `Test-Path '${c.caminho}'`)
  r.branches = await perguntar('q1', "(git branch --list 'lousa/*') -join ','")
  await prova.foto('3-fechou')

  // 2. conflito: copia e original mudam a mesma linha, cada uma com commit
  const k = await novaCopia()
  await window.lousa.terminais.escrever(k.id, "Set-Content -Path leia.md -Value copia; git commit -qam 'lado copia'\r")
  await perguntar(k.id, "'pronto'")
  await window.lousa.terminais.escrever('q1', "Set-Content -Path leia.md -Value original; git commit -qam 'lado original'\r")
  await perguntar('q1', "'pronto'")
  await abrirJuntar(k.id)
  clicarTexto('.juntar-botoes button', 'Juntar em main')
  await ate(() => q('.janela-juntar .erro'), 40)
  r.conflito = {
    erro: q('.janela-juntar .erro')?.textContent ?? null,
    leiaNaOriginal: await perguntar('q1', "Get-Content 'leia.md'"),
    statusDaOriginal: await perguntar('q1', "(git status --porcelain --untracked-files=no) -join ','"),
  }
  await prova.foto('4-conflito')
  clicarTexto('.juntar-botoes button', 'Cancelar')
  await ate(() => !q('.janela-juntar'), 20)

  // 3. alteracao sem commit na copia: avisa e nao junta
  await window.lousa.terminais.escrever(k.id, 'Set-Content -Path sujo.txt -Value x\r')
  await perguntar(k.id, "'pronto'")
  await abrirJuntar(k.id)
  r.sujo = { aviso: q('.juntar-aviso')?.textContent ?? null }
  clicarTexto('.juntar-botoes button', 'Juntar em main')
  await ate(() => q('.janela-juntar .erro'), 40)
  r.sujo.erro = q('.janela-juntar .erro')?.textContent ?? null
  r.sujo.leiaNaOriginal = await perguntar('q1', "Get-Content 'leia.md'")
  await prova.foto('5-sujo')

  r.ok =
    r.botaoJuntar &&
    r.commitsNaBranch === '1' &&
    r.diff.mais.some((t) => t.includes('oi')) &&
    r.diff.voltou &&
    r.arquivoNaOriginal === 'oi' &&
    r.copiaExiste === 'False' &&
    r.branches === '' &&
    /onflito/.test(r.conflito.erro ?? '') &&
    r.conflito.leiaNaOriginal === 'original' &&
    r.conflito.statusDaOriginal === '' &&
    !!r.sujo.aviso &&
    !!r.sujo.erro &&
    r.sujo.leiaNaOriginal === 'original'
  return r
})()
