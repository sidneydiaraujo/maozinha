// estado: time
// A19, rodar com a opcao sem-claude: o PowerShell do a1 faz o papel do Claude chamando a ferramenta
// `criar_colegas` no servidor do Mãozinha, com a url e a chave do <dados>\agentes\a1.mcp.json.
// - o settings do a1 libera a ferramenta (permissions.allow) e o arquivo do --mcp-config existe;
// - a tela pergunta "Claude 1 quer criar 1 colega" com o papel e a tarefa; nada nasce antes do clique;
// - "Criar o colega": nasce um quadro novo, ligado ao a1, com o papel; a resposta volta ao "agente";
// - num segundo pedido, Esc recusa: nada nasce e a resposta diz que o usuario recusou.
// Fotos: 1-pergunta, 2-criado.
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
    if (id === 'a1') saida = (saida + d).slice(-12000)
  })
  const CSI = new RegExp(String.fromCharCode(27) + '\\[[0-9;?]*[A-Za-z]', 'g')
  const limpo = () => saida.replace(CSI, '').replace(/\r?\n/g, '')
  const escrever = (t) => window.lousa.terminais.escrever('a1', t)
  const agentes = String(prova.dados.pastaDemo).replace(/\\/g, '/') + '/../dados/agentes'
  const quadros = () => todos('[data-quadro]').length
  const pedir = (marca, papel, procura) =>
    escrever(
      `$c = (Get-Content '${agentes}/a1.mcp.json' -Raw | ConvertFrom-Json).mcpServers.maozinha; ` +
        `$b = '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"criar_colegas","arguments":{"colegas":[{"papel":"${papel}","tarefa":"testar o login"}]}}}'; ` +
        `$r = Invoke-RestMethod -Method Post -Uri $c.url -Headers @{ Authorization = $c.headers.Authorization } -ContentType 'application/json' -Body $b; ` +
        `Write-Output ('${marca}' + '=' + ($r.result.content[0].text -match '${procura}') + '|')\r`,
    )
  try {
    r.semClaude = (prova.dados.opcoes ?? []).includes('sem-claude')
    await ate(() => /app>/.test(limpo()), 120)

    await escrever(
      `Write-Output ('L' + 'IBERA=' + ((Get-Content '${agentes}/a1.settings.json' -Raw) -match 'mcp__maozinha__criar_colegas') + (Test-Path '${agentes}/a1.mcp.json'))\r`,
    )
    r.liberadaEConfigurada = await ate(() => /LIBERA=TrueTrue/.test(limpo()))

    // 1. o "agente" pede um colega: a tela pergunta, nada nasce ainda
    const antes = quadros()
    await pedir('RESP1', 'Testador', 'criei 1 colega.*Testador')
    r.perguntou = await ate(() => !!q('.janela-pedido'), 60)
    r.textoDaPergunta = q('.janela-pedido')?.textContent ?? ''
    r.naoCriouAntes = quadros() === antes
    await prova.foto('1-pergunta')

    q('.janela-pedido .botao-principal')?.click()
    r.nasceu = await ate(() => quadros() === antes + 1, 80)
    r.respostaAceite = await ate(() => /RESP1=True/.test(limpo()), 80)
    r.perguntaSumiu = !q('.janela-pedido')
    const estado = await window.lousa.lousa.carregar()
    const novo = estado.quadros.find((x) => x.papel === 'Testador')
    r.comPapel = !!novo
    r.ligado = (estado.ligacoes ?? []).some((l) => l.de === 'a1' && l.para === novo?.id)
    r.mesmaConta = novo?.perfilId === 'pessoal'
    await espera(1500)
    await prova.foto('2-criado')

    // 2. outro pedido: Esc recusa
    const depois = quadros()
    await pedir('RESP2', 'Revisor', 'recusou')
    await ate(() => !!q('.janela-pedido'), 60)
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    r.respostaRecusa = await ate(() => /RESP2=True/.test(limpo()), 80)
    r.naoCriouNaRecusa = quadros() === depois
  } catch (e) {
    r.erros.push(String((e && e.stack) || e))
  }
  if (!r.respostaAceite || !r.respostaRecusa) r.saida = limpo().slice(-1500)
  desliga()
  r.ok =
    r.erros.length === 0 &&
    r.semClaude &&
    r.liberadaEConfigurada &&
    r.perguntou &&
    r.textoDaPergunta.includes('Claude 1 quer criar 1 colega') &&
    r.textoDaPergunta.includes('Testador') &&
    r.naoCriouAntes &&
    r.nasceu &&
    r.respostaAceite &&
    r.perguntaSumiu &&
    r.comPapel &&
    r.ligado &&
    r.mesmaConta &&
    r.respostaRecusa &&
    r.naoCriouNaRecusa
  return r
})()
