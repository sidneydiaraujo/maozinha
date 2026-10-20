// estado: git
// Fatia 10 (D18): "+ Novo quadro" numa pasta que ja tem quadro vem com "Copia separada" marcada;
// o quadro novo mostra "app ⑂ terminal-N", com pasta e branch proprias. Fechar a copia limpa
// apaga a pasta e a branch; fechar a copia com arquivo novo mantem tudo. Fotos 1..5.
;(async () => {
  const { espera } = prova
  const q = (s) => document.querySelector(s)
  const todos = (s) => [...document.querySelectorAll(s)]
  const r = {}
  // sem espacos: a linha quebrada logo depois de um espaco perde esse espaco na tela
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
  /** Abre um terminal na pasta app pela janelinha e devolve o id, a pasta e a branch dele. */
  const novoTerminal = async (foto) => {
    const antes = ids()
    clicarTexto('button', '+ Novo quadro')
    await ate(() => q('.novo-quadro'))
    todos('.pasta-escolha').find((e) => e.querySelector('strong')?.textContent === 'app')?.click()
    await espera(300)
    const janelinha = { marcada: q('.novo-copia input')?.checked, dica: q('.novo-copia small')?.textContent ?? null }
    if (foto) await prova.foto(foto)
    clicarTexto('.novo-botoes button', 'Abrir terminal')
    await ate(() => ids().length > antes.length)
    const id = ids().find((i) => !antes.includes(i))
    const pasta = q(`[data-quadro="${id}"] .quadro-pasta`)
    const [caminho, linha2] = (pasta?.title ?? '').split('\n')
    await ate(() => /app\.copias.*>/.test(texto(id)), 60)
    return { id, janelinha, rotulo: pasta?.textContent.trim(), caminho, branch: /branch (\S+)/.exec(linha2 ?? '')?.[1] }
  }
  const fechar = async (id) => {
    q(`[data-quadro="${id}"] .botao-fechar`).click()
    await ate(() => !ids().includes(id) && q('.lousa-aviso'))
    return q('.lousa-aviso')?.textContent ?? null
  }

  await ate(() => /app>/.test(texto('q1')), 120)
  await prova.foto('1-inicio')

  const c1 = await novoTerminal('2-janelinha')
  r.janelinha = c1.janelinha
  r.copia1 = { rotulo: c1.rotulo, caminho: c1.caminho, branch: c1.branch }
  r.copia1.existe = await perguntar('q1', `Test-Path '${c1.caminho}'`)
  r.copia1.branchNaPasta = await perguntar(c1.id, 'git branch --show-current')
  await prova.foto('3-copia-criada')

  const c2 = await novoTerminal()
  await window.lousa.terminais.escrever(c2.id, 'Set-Content -Path novo.txt -Value oi\r')
  r.copia2 = { rotulo: c2.rotulo, arquivoNovo: await perguntar(c2.id, "Test-Path 'novo.txt'") }

  // quadros novos nascem no centro da vista, mas nunca em cima de outro (T24.1)
  const caixas = todos('[data-quadro]').map((e) => e.getBoundingClientRect())
  r.quadrosSobrepostos = caixas.some((a, i) =>
    caixas.some((b, j) => j > i && a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom),
  )
  await prova.foto('3b-lado-a-lado')

  r.fecharLimpa = { aviso: await fechar(c1.id) }
  r.fecharLimpa.pastaExiste = await perguntar('q1', `Test-Path '${c1.caminho}'`)
  r.fecharLimpa.branches = await perguntar('q1', "(git branch --list 'lousa/*') -join ','")
  await prova.foto('4-apagada')

  r.fecharSuja = { aviso: await fechar(c2.id) }
  r.fecharSuja.pastaExiste = await perguntar('q1', `Test-Path '${c2.caminho}'`)
  r.fecharSuja.arquivoExiste = await perguntar('q1', `Test-Path '${c2.caminho}\\novo.txt'`)
  r.fecharSuja.branches = await perguntar('q1', "(git branch --list 'lousa/*') -join ','")

  // a copia mantida volta a lista de pastas; sem quadro nela, a janelinha nao sugere copia
  clicarTexto('button', '+ Novo quadro')
  await ate(() => q('.novo-quadro'))
  r.pastasNaJanelinha = todos('.pasta-escolha strong').map((e) => e.textContent)
  await prova.foto('5-lista')
  q('.novo-fundo')?.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))

  r.ok =
    r.janelinha.marcada === true &&
    !r.quadrosSobrepostos &&
    /⑂/.test(r.copia1.rotulo ?? '') &&
    r.copia1.existe === 'True' &&
    r.copia1.branchNaPasta === r.copia1.branch &&
    r.fecharLimpa.pastaExiste === 'False' &&
    r.fecharSuja.pastaExiste === 'True' &&
    r.fecharSuja.arquivoExiste === 'True'
  return r
})()
