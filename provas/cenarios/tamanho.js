// estado: demo
// Tamanho do terminal e o × que pergunta (27/10/2026, Sidney: "mesmo diminuindo e aumentando o
// tamanho do terminal as letras/frases nao reajustava").
// - a area desenhada (.xterm-screen) cabe no recipiente, sem passar por baixo da barra de rolagem
//   nem da borda de baixo, com a lousa a 80% (letra redesenhada no zoom, A1);
// - o PowerShell sabe a largura certa: uma linha de '#' do tamanho que ele diz cabe numa linha so
//   (o programa e o xterm concordam), e ela cresce e diminui ao puxar o canto do quadro;
// - a alca (A23): cantos sem precisar escolher o quadro; a borda responde numa faixa larga, para fora;
// - o × abre "Tem certeza que deseja fechar?"; Cancelar e Esc mantem o quadro; Fechar fecha.
// Fotos: 1-normal, 2-maior, 3-pergunta.
;(async () => {
  const { espera } = prova
  const q = (s) => document.querySelector(s)
  const r = { erros: [] }
  const ate = async (condicao, vezes) => {
    for (let i = 0; i < vezes && !condicao(); i++) await espera(250)
    return condicao()
  }
  const linhas = (id) => [...document.querySelectorAll(`[data-quadro="${id}"] .xterm-rows > div`)].map((d) => d.textContent)
  const cabe = (id) => {
    const el = q(`[data-quadro="${id}"] .terminal`).getBoundingClientRect()
    const tela = q(`[data-quadro="${id}"] .xterm-screen`).getBoundingClientRect()
    // a barra de rolagem do xterm ocupa os ultimos ~14 px (de 100%) da direita
    const barra = 10 * (el.width / q(`[data-quadro="${id}"] .terminal`).offsetWidth)
    return {
      sobraDireita: Math.round(el.right - tela.right),
      sobraBaixo: Math.round(el.bottom - tela.bottom),
      ok: tela.right <= el.right - barra && tela.bottom <= el.bottom + 0.5,
    }
  }
  let marca = 0
  // pede ao PowerShell a largura que ele acha que tem e uma linha de '#' desse tamanho
  const larguraDoPrograma = async (id) => {
    marca += 1
    const m = `LG${marca}`
    await window.lousa.terminais.escrever(
      id,
      `cls; Write-Output ('${m}' + '=' + $Host.UI.RawUI.WindowSize.Width); '#' * $Host.UI.RawUI.WindowSize.Width\r`,
    )
    await ate(() => linhas(id).some((l) => l.startsWith(`${m}=`)), 40)
    await espera(600)
    const ls = linhas(id)
    const i = ls.findIndex((l) => l.startsWith(`${m}=`))
    const largura = Number(/=(\d+)/.exec(ls[i] ?? '')?.[1])
    const hashes = ls.slice(i + 1).filter((l) => /^#+\s*$/.test(l)).map((l) => l.trimEnd().length)
    return { largura, hashes, umaLinha: hashes.length === 1 && hashes[0] === largura }
  }
  try {
    await ate(() => /PS [^\n]*>/.test(linhas('t1').join('\n')), 160)
    await espera(800)
    r.normal = { ...cabe('t1'), ...(await larguraDoPrograma('t1')) }
    await prova.foto('1-normal')

    // A23: sem escolher o quadro, os quatro cantos ja existem e a borda direita responde numa faixa
    // larga, quase toda para fora do quadro; puxar por ela (fora do quadro) alarga o quadro
    const no = q('.react-flow__node:has([data-quadro="t1"])')
    const escala = no.getBoundingClientRect().width / no.offsetWidth
    r.alcasSemEscolher = no.querySelectorAll('.react-flow__resize-control.alca-quadro').length
    const borda = no.querySelector('.react-flow__resize-control.borda-quadro.right')
    const caixaBorda = borda.getBoundingClientRect()
    const caixaQuadro = q('[data-quadro="t1"]').getBoundingClientRect()
    r.faixaDaBorda = Math.round(caixaBorda.width / escala)
    r.bordaParaFora = caixaBorda.right > caixaQuadro.right + 4 * escala
    const larguraAntes = no.offsetWidth
    {
      const x = caixaQuadro.right + 4 * escala
      const y = caixaBorda.top + caixaBorda.height / 2
      const ev = (tipo, alvo, px, py) =>
        alvo.dispatchEvent(new MouseEvent(tipo, { bubbles: true, clientX: px, clientY: py, view: window, buttons: 1 }))
      ev('mousedown', document.elementFromPoint(x, y) ?? borda, x, y)
      for (let i = 1; i <= 8; i++) {
        ev('mousemove', window, x + (80 * i) / 8, y)
        await espera(30)
      }
      ev('mouseup', window, x + 80, y)
      await espera(1200)
    }
    r.pelaBorda = no.offsetWidth - larguraAntes

    // arrasta o canto de baixo a direita do quadro (o NodeResizer aparece com ele selecionado)
    const puxarCanto = async (dx, dy) => {
      q('[data-quadro="t1"] .quadro-pasta').dispatchEvent(new MouseEvent('click', { bubbles: true }))
      await espera(300)
      const canto = q('.react-flow__node:has([data-quadro="t1"]) .react-flow__resize-control.handle.bottom.right')
      const c = canto.getBoundingClientRect()
      const x = c.left + c.width / 2
      const y = c.top + c.height / 2
      const ev = (tipo, alvo, px, py) =>
        alvo.dispatchEvent(new MouseEvent(tipo, { bubbles: true, clientX: px, clientY: py, view: window, buttons: 1 }))
      ev('mousedown', canto, x, y)
      for (let i = 1; i <= 10; i++) {
        ev('mousemove', window, x + (dx * i) / 10, y + (dy * i) / 10)
        await espera(30)
      }
      ev('mouseup', window, x + dx, y + dy)
      await espera(1500)
    }
    await puxarCanto(260, 120)
    r.maior = { ...cabe('t1'), ...(await larguraDoPrograma('t1')) }
    await prova.foto('2-maior')
    await puxarCanto(-420, -60)
    r.menor = { ...cabe('t1'), ...(await larguraDoPrograma('t1')) }

    const fechar = () => q('[data-quadro="t1"] .botao-fechar')
    const pergunta = () => q('[data-quadro="t1"] .fechar-pergunta')
    fechar().click()
    await espera(300)
    r.perguntou = pergunta()?.textContent.includes('Tem certeza que deseja fechar?') ?? false
    await prova.foto('3-pergunta')
    ;[...pergunta().querySelectorAll('button')].find((b) => b.textContent === 'Cancelar').click()
    await espera(300)
    r.cancelarMantem = !pergunta() && !!q('[data-quadro="t1"]')
    fechar().click()
    await espera(300)
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await espera(300)
    r.escMantem = !pergunta() && !!q('[data-quadro="t1"]')
    fechar().click()
    await espera(300)
    q('[data-quadro="t1"] .fechar-botoes .botao-perigo').click()
    r.fechou = await ate(() => !q('[data-quadro="t1"]'), 20)
  } catch (e) {
    r.erros.push(String((e && e.stack) || e))
  }
  r.ok =
    r.erros.length === 0 &&
    r.alcasSemEscolher === 4 &&
    r.faixaDaBorda >= 10 &&
    r.bordaParaFora &&
    r.pelaBorda > 40 &&
    !!r.normal?.ok && !!r.normal?.umaLinha &&
    !!r.maior?.ok && !!r.maior?.umaLinha && r.maior.largura > r.normal.largura &&
    !!r.menor?.ok && !!r.menor?.umaLinha && r.menor.largura < r.normal.largura &&
    r.perguntou && r.cancelarMantem && r.escMantem && r.fechou
  return r
})()
