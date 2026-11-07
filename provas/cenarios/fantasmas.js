// estado: fantasmas
// R3.16: na abertura, as copias sem quadro cuja pasta sumiu (c-sumiu, c-trabalho) ou ficou vazia
// (c-vazia) saem da lista; a viva fica. O git esquece os registros e a pasta vazia sai. A faixa
// oferece apagar so as branches ja juntadas e sem copia viva (c-sumiu, c-vazia); "Apagar" usa
// `git branch -d`, e a c-trabalho (com commit nunca juntado) e a c-viva continuam.
// Efeito no PC: nenhum fora da pasta da rodada.
;(async () => {
  const { espera } = prova
  const { app } = prova.dados
  const q = (s) => document.querySelector(s)
  const r = {}
  const texto = () => [...document.querySelectorAll('[data-quadro="q1"] .xterm-rows > div')].map((d) => d.textContent).join('').replace(/\s+/g, '')
  const ate = async (condicao, vezes = 60) => {
    for (let i = 0; i < vezes && !condicao(); i++) await espera(250)
    return !!condicao()
  }
  let marca = 0
  const perguntar = async (expressao) => {
    const m = `R${++marca}`
    await window.lousa.terminais.escrever('q1', `('<' + '${m}>') + (${expressao}) + ('</' + '${m}>')\r`)
    const achar = () => new RegExp(`<${m}>(.*?)</${m}>`).exec(texto())?.[1]
    await ate(() => achar() !== undefined)
    return achar() ?? null
  }
  await ate(() => /PS.*>/.test(texto()), 80)

  const estado = await window.lousa.lousa.carregar()
  r.naLista = estado.repos.map((x) => x.copia?.apelido ?? x.nome)
  r.temFaixa = await ate(() => !!q('.aviso-branches'), 40)
  r.faixa = q('.aviso-branches')?.textContent ?? null
  await prova.foto('1-faixa')

  r.worktrees = await perguntar("((git worktree list) -replace '.*[\\\\/]', '') -join ','")
  r.vaziaSaiu = await perguntar(`-not (Test-Path '${app}.copias\\c-vazia')`)

  q('.aviso-branches .botao-principal')?.click()
  r.faixaSumiu = await ate(() => !q('.aviso-branches'), 40)
  r.branches = await perguntar("(git branch --list 'lousa/*' --format='%(refname:short)') -join ','")
  await prova.foto('2-depois')

  r.ok =
    r.naLista.join(',') === 'app,c-viva' &&
    r.temFaixa &&
    /c-sumiu/.test(r.faixa) &&
    /c-vazia/.test(r.faixa) &&
    !/c-trabalho|c-viva/.test(r.faixa) &&
    !/c-sumiu|c-vazia|c-trabalho/.test(r.worktrees ?? '') &&
    r.vaziaSaiu === 'True' &&
    r.faixaSumiu &&
    r.branches === 'lousa/c-trabalho,lousa/c-viva'
  return r
})()
