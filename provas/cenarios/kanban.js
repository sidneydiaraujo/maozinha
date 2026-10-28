// estado: time
// Fatia 33 (D52), rodar com a opcao sem-claude: os agentes abrem so o PowerShell.
// - abrir um agente cria o KANBAN.md na pasta do projeto (app e api), com as seis etapas;
// - o kanban fica fora do git: `git check-ignore` o acha e o `git status` nao o lista;
// - o leitor abre o KANBAN.md e mostra a mudanca sozinho quando um "agente" (o PowerShell do a1)
//   cria um card e depois o move;
// - o campo de papel (nome do card) aparece num agente fora de time.
// (A linha de comando com a regra e coberta pelos testes de alvo e comandos.) Fotos: 1-kanban, 2-movido.
;(async () => {
  const { espera } = prova
  const q = (s) => document.querySelector(s)
  const todos = (s) => [...document.querySelectorAll(s)]
  const r = { erros: [] }
  const ate = async (condicao, vezes = 40) => {
    for (let i = 0; i < vezes && !condicao(); i++) await espera(250)
    return !!condicao()
  }
  let saida = ''
  const desliga = window.lousa.terminais.aoDados((id, d) => {
    if (id === 'a1') saida = (saida + d).slice(-8000)
  })
  const CSI = new RegExp(String.fromCharCode(27) + '\\[[0-9;?]*[A-Za-z]', 'g')
  const limpo = () => saida.replace(CSI, '')
  const leitor = () => q('.leitor')?.textContent ?? ''
  try {
    r.semClaude = (prova.dados.opcoes ?? []).includes('sem-claude')
    await ate(() => /app>/.test(limpo()), 120)

    // o arquivo existe e tem as etapas (o PowerShell do a1 esta na pasta app)
    await window.lousa.terminais.escrever(
      'a1',
      "Write-Output ('K' + 'SECOES=' + (Select-String -Path KANBAN.md -Pattern '^## ').Count); " +
        "Write-Output ('K' + 'IGN=' + (git check-ignore KANBAN.md)); " +
        "Write-Output ('K' + 'ST=' + ((git status --porcelain) -join ',') + '|')\r",
    )
    r.secoes = await ate(() => /KSECOES=6/.test(limpo()))
    await ate(() => /KST=[^\n]*\|/.test(limpo()))
    r.foraDoGit = /KIGN=KANBAN\.md/.test(limpo()) && !/KST=[^\n|]*KANBAN/.test(limpo())

    // duas pastas com agente: um KANBAN.md em cada
    await ate(() => todos('.arvore-linha[title="KANBAN.md"]').length >= 2)
    r.kanbansNaArvore = todos('.arvore-linha[title="KANBAN.md"]').length
    if (r.kanbansNaArvore === 0) {
      r.naArvore = todos('.arvore-linha').map((l) => l.title)
      await prova.foto('0-arvore')
    }

    todos('.arvore-linha[title="KANBAN.md"]')[0].click()
    r.abriuNoLeitor = await ate(() => leitor().includes('Esperando o commit'))

    // um "agente" cria um card...
    await window.lousa.terminais.escrever('a1', "Add-Content KANBAN.md '- **Testador** card-da-prova'\r")
    r.cardApareceu = await ate(() => leitor().includes('card-da-prova'))
    await prova.foto('1-kanban')
    // ...e depois o move (aqui, troca o texto do mesmo card)
    await window.lousa.terminais.escrever(
      'a1',
      "(Get-Content KANBAN.md -Encoding utf8) -replace 'card-da-prova', 'card-movido' | Set-Content KANBAN.md -Encoding utf8\r",
    )
    r.cardMudou = await ate(() => leitor().includes('card-movido') && !leitor().includes('card-da-prova'))
    // emoji e acento continuam inteiros depois que um agente mexeu no arquivo
    r.letrasInteiras = leitor().includes('⏳ Esperando o commit') && leitor().includes('Mãozinha')
    r.seloAtualizado = !!q('.leitor-atualizado')
    await prova.foto('2-movido')

    // agente fora de time: tem o campo do papel (o nome nos cards)
    r.papelForaDoTime = !!q('[data-quadro="a3"] .papel-quadro')
  } catch (e) {
    r.erros.push(String((e && e.stack) || e))
  }
  desliga()
  r.ok =
    r.erros.length === 0 &&
    r.semClaude &&
    r.secoes &&
    r.foraDoGit &&
    r.kanbansNaArvore >= 2 &&
    r.abriuNoLeitor &&
    r.cardApareceu &&
    r.cardMudou &&
    r.letrasInteiras &&
    r.papelForaDoTime
  return r
})()
