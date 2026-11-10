// estado: livre
// D65, rodar com a opcao sem-claude: a conta Pessoal tem pasta livre (a pasta da rodada, com o app e
// a api dentro, que nao e projeto). O PowerShell do agente faz o papel dos ganchos do Claude
// (grava <dados>\agentes\<id>.estado.json e .escrita.json, como o PostToolUse do settings).
// - o Novo quadro mostra "✦ Livre" ja marcado, sem copia separada; "Abrir agente" abre na pasta livre;
// - ler um arquivo do app: o app entra na lateral aberto e marcado, o cabecalho diz "✦ app";
// - ler a api depois: nada muda (consulta); salvar na api: o projeto vira a api;
// - a pasta livre nao ganha o ⚠ de pasta ampla.
// Fotos: 1-novo, 2-app, 3-api.
;(async () => {
  const { espera } = prova
  const q = (s) => document.querySelector(s)
  const todos = (s) => [...document.querySelectorAll(s)]
  const r = { erros: [] }
  const ate = async (condicao, vezes = 40) => {
    for (let i = 0; i < vezes && !condicao(); i++) await espera(250)
    return !!condicao()
  }
  const barra = (c) => String(c).replace(/\\/g, '/')
  const app = barra(prova.dados.app)
  const api = barra(prova.dados.api)
  const agentes = barra(prova.dados.pastaDemo) + '/../dados/agentes'
  try {
    r.semClaude = (prova.dados.opcoes ?? []).includes('sem-claude')
    const conta = (await window.lousa.perfis.listar()).find((p) => p.id === 'pessoal')
    r.pastaLivreNaConta = barra(conta?.pastaLivre ?? '') === barra(prova.dados.app).replace(/\/app$/, '')

    // 1. Novo quadro: "Livre" ja vem marcado
    todos('button').find((e) => e.textContent.includes('+ Novo quadro'))?.click()
    await ate(() => q('.novo-quadro'))
    todos('.chip-escolha').find((e) => e.textContent === 'Pessoal')?.click()
    r.livreMarcado = await ate(() => q('.novo-livre [role="radio"]')?.getAttribute('aria-checked') === 'true')
    r.semCopia = !q('.novo-copia input[type="checkbox"]:not(.novo-kanban input)') || !todos('.novo-copia').some((e) => /Cópia separada/.test(e.textContent))
    await prova.foto('1-novo')
    todos('.novo-botoes button').find((e) => e.textContent.includes('Abrir agente'))?.click()
    r.nasceu = await ate(() => todos('[data-quadro]').length === 1, 60)
    const id = q('[data-quadro]')?.getAttribute('data-quadro') ?? ''
    const estado1 = await window.lousa.lousa.carregar()
    const quadro = estado1.quadros.find((x) => x.id === id)
    const pasta = estado1.repos.find((x) => x.id === quadro?.repoId)
    r.naPastaLivre = barra(pasta?.caminho ?? '') === app.replace(/\/app$/, '')
    r.semAviso = !q('.quadro-pasta-ampla')

    let saida = ''
    const desliga = window.lousa.terminais.aoDados((t, d) => {
      if (t === id) saida = (saida + d).slice(-8000)
    })
    const escrever = (t) => window.lousa.terminais.escrever(id, t)
    await ate(() => />\s*$/.test(saida), 120)
    const gancho = (ferramenta, arquivo) =>
      escrever(
        `Set-Content -Encoding utf8 -Path '${agentes}/${id}.estado.json' -Value '{"hook_event_name":"PostToolUse","tool_name":"${ferramenta}","tool_input":{"file_path":"${arquivo}"}}'\r`,
      )
    const salvou = (arquivo) =>
      escrever(
        `Set-Content -Encoding utf8 -Path '${agentes}/${id}.escrita.json' -Value '{"tool_name":"Write","tool_input":{"file_path":"${arquivo}"}}'\r`,
      )
    const raiz = (nome) => todos('.arvore-raiz').find((l) => l.querySelector('.arvore-nome')?.textContent === nome)
    const cabecalho = () => q(`[data-quadro="${id}"] .quadro-pasta`)?.textContent ?? ''

    // 2. leu um arquivo do app: o app vira o projeto
    await gancho('Read', `${app}/leia.md`)
    r.appNaLateral = await ate(() => !!raiz('app'), 40)
    r.appMarcado = await ate(() => raiz('app')?.classList.contains('arvore-projeto') ?? false)
    r.appAberto = raiz('app')?.getAttribute('aria-expanded') === 'true'
    r.cabecalhoApp = await ate(() => /✦\s*app/.test(cabecalho()))
    await prova.foto('2-app')

    // 3. ler a api nao muda; salvar nela muda
    await gancho('Read', `${api}/leia.md`)
    await espera(1500)
    r.lerNaoTroca = /✦\s*app/.test(cabecalho()) && !raiz('api')
    await salvou(`${api}/novo.md`)
    r.salvarTroca = await ate(() => /✦\s*api/.test(cabecalho()) && (raiz('api')?.classList.contains('arvore-projeto') ?? false))
    const estado2 = await window.lousa.lousa.carregar()
    r.salvo = estado2.repos.find((x) => x.id === estado2.quadros.find((y) => y.id === id)?.projeto)?.nome === 'api'
    await prova.foto('3-api')
    desliga()
  } catch (e) {
    r.erros.push(String((e && e.stack) || e))
  }
  r.ok =
    r.erros.length === 0 &&
    r.semClaude &&
    r.pastaLivreNaConta &&
    r.livreMarcado &&
    r.semCopia &&
    r.nasceu &&
    r.naPastaLivre &&
    r.semAviso &&
    r.appNaLateral &&
    r.appMarcado &&
    r.appAberto &&
    r.cabecalhoApp &&
    r.lerNaoTroca &&
    r.salvarTroca &&
    r.salvo
  return r
})()
