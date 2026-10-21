// estado: demo
// C1 (D42): engrenagem → cartao Pessoal → "Git e GitHub": nome, e-mail e "GitHub só desta conta".
// Depois de salvar, o terminal da Pessoal (t2) reaberto recebe GIT_AUTHOR_*, GH_CONFIG_DIR na pasta
// de dados da prova e GCM_NAMESPACE; o gh nele nao ve o login do PC. O da Principal (t1) nao recebe
// nada. E-mail invalido mostra o erro e nao grava. Fotos: 1-formulario, 2-terminais.
;(async () => {
  const { espera } = prova
  const q = (s) => document.querySelector(s)
  const r = { erros: [] }
  const texto = (id) =>
    [...document.querySelectorAll(`[data-quadro="${id}"] .xterm-rows > div`)].map((d) => d.textContent.replace(/\s+$/, '')).join('\n')
  const ate = async (condicao, vezes) => {
    for (let i = 0; i < vezes && !condicao(); i++) await espera(250)
    return condicao()
  }
  // input controlado do React: o valor entra pelo setter nativo e o evento avisa o React
  const digitar = (el, valor) => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, valor)
    el.dispatchEvent(new Event('input', { bubbles: true }))
  }
  const passo = async (nome, corpo) => {
    try {
      await corpo()
    } catch (e) {
      r.erros.push(`${nome}: ${String((e && e.stack) || e)}`)
    }
  }
  const MARCA = 'GIT' + 'CONTA='
  // a pasta do gh e longa (quebraria a linha): vai so se ela termina onde devia
  const comando =
    "cls; Write-Output ('GIT' + 'CONTA=' + $env:GIT_AUTHOR_NAME + '|' + $env:GIT_COMMITTER_EMAIL + '|' + " +
    "($env:GH_CONFIG_DIR -like '*\\dados\\contas\\pessoal\\gh') + '|' + $env:GCM_NAMESPACE)\r"
  const linhaMarca = (id) => texto(id).split('\n').filter((l) => l.startsWith(MARCA)).pop() ?? null

  await ate(() => /PS .*>/.test(texto('t1')) && /PS .*>/.test(texto('t2')), 120)

  await passo('1 formulario', async () => {
    q('.topo-engrenagem').click()
    await ate(() => q('.painel-contas [data-git="pessoal"]'), 120)
    const secao = q('.painel-contas [data-git="pessoal"]')
    secao.open = true
    r.resumoAntes = secao.querySelector('summary').textContent
    const [nome, email] = secao.querySelectorAll('.git-campo input')
    digitar(nome, 'Ana Prova')
    digitar(email, 'sem-arroba')
    await espera(100)
    secao.querySelector('.git-marca input').click()
    await espera(100)
    secao.querySelector('.cartao-acoes button').click()
    await ate(() => secao.querySelector('.erro'), 20)
    r.erroEmail = secao.querySelector('.erro')?.textContent ?? null
    r.semGravarComErro = !(await window.lousa.perfis.listar()).find((p) => p.id === 'pessoal').git
    digitar(email, 'ana@prova.dev')
    await espera(100)
    secao.querySelector('.cartao-acoes button').click()
    await ate(() => secao.textContent.includes('Salvo.'), 20)
    r.resumoDepois = secao.querySelector('summary').textContent
    r.gravado = (await window.lousa.perfis.listar()).find((p) => p.id === 'pessoal').git ?? null
    await prova.foto('1-formulario')
    q('.painel-contas .botao-fechar').click()
    await espera(300)
  })

  await passo('2 terminais', async () => {
    // t2 ja estava aberto: o ambiente novo vale ao reabrir
    await window.lousa.terminais.escrever('t2', 'exit\r')
    await ate(() => q('[data-quadro="t2"] .quadro-encerrado'), 40)
    q('[data-quadro="t2"] .quadro-encerrado button').click()
    await ate(() => !q('[data-quadro="t2"] .quadro-encerrado') && /PS .*>/.test(texto('t2')), 60)
    await espera(800)
    await window.lousa.terminais.escrever('t2', comando)
    await window.lousa.terminais.escrever('t1', comando)
    await ate(() => linhaMarca('t2') && linhaMarca('t1'), 40)
    r.pessoal = linhaMarca('t2')
    r.principal = linhaMarca('t1')
    await window.lousa.terminais.escrever('t2', 'gh auth status\r')
    r.ghPessoalSemLogin = await ate(() => /not logged into any GitHub/.test(texto('t2')), 40)
    await prova.foto('2-terminais')
  })

  return r
})()
