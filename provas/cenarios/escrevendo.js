// estado: time
// A16, rodar com a opcao sem-claude: o PowerShell do a1 faz o papel do gancho de escrita do Claude
// (grava <dados>\agentes\a1.escrita.json, como o PostToolUse do settings do agente).
// - salvar em docs/ do app (a raiz tem .git): a bolinha piscando fica na raiz "app";
// - criar pacotes/web/package.json e salvar em pacotes/web/src: a bolinha vai para "pacotes"
//   (fechada) e, ao abrir, para "web" (o projeto mais proximo); uma so por agente;
// - a bolinha pisca (animacao) e o settings do a1 tem o gancho PostToolUse.
// Fotos: 1-raiz, 2-fechada, 3-projeto.
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
  const escrever = (t) => window.lousa.terminais.escrever('a1', t)
  const linha = (titulo) => todos('.arvore-linha').find((l) => l.title === titulo)
  const bolinhasEm = (titulo) => linha(titulo)?.querySelectorAll('.bolinha-escrevendo').length ?? 0
  const totalDeBolinhas = () => todos('.bolinha-escrevendo').length
  const app = String(prova.dados.app).replace(/\\/g, '/')
  const agentes = String(prova.dados.pastaDemo).replace(/\\/g, '/') + '/../dados/agentes'
  const gancho = (arquivo) =>
    escrever(
      `Set-Content -Encoding utf8 -Path '${agentes}/a1.escrita.json' -Value '{"tool_name":"Write","tool_input":{"file_path":"${arquivo}"}}'\r`,
    )
  try {
    r.semClaude = (prova.dados.opcoes ?? []).includes('sem-claude')
    await ate(() => /app>/.test(limpo()), 120)

    // o settings do agente leva o gancho (o PowerShell le o arquivo que o main gravou)
    await escrever(`Write-Output ('G' + 'ANCHO=' + ((Get-Content '${agentes}/a1.settings.json' -Raw) -match 'PostToolUse'))\r`)
    r.settingsComGancho = await ate(() => /GANCHO=True/.test(limpo()))

    // 1. salvou em docs/ do app: o projeto e a propria raiz
    await gancho(`${app}/docs/plano/fatia-12.md`)
    r.naRaiz = await ate(() => bolinhasEm('app') === 1)
    const estilo = getComputedStyle(q('.bolinha-escrevendo') ?? document.body)
    r.animacao = `${estilo.animationName} ${estilo.animationDuration} reduzido=${matchMedia('(prefers-reduced-motion: reduce)').matches}`
    r.pisca = estilo.animationName === 'piscar-devagar'
    await prova.foto('1-raiz')

    // 2. um projeto dentro do app: pacotes/web com package.json
    if (!linha('docs')) linha('app')?.click()
    await escrever("New-Item -ItemType Directory -Force pacotes/web/src | Out-Null; Set-Content pacotes/web/package.json '{}'\r")
    await ate(() => !!linha('pacotes'))
    await gancho(`${app}/pacotes/web/src/index.ts`)
    r.naFechada = await ate(() => bolinhasEm('pacotes') === 1 && bolinhasEm('app') === 0)
    r.umaSoNaFechada = totalDeBolinhas() === 1
    await prova.foto('2-fechada')
    linha('pacotes')?.click()
    r.noProjeto = await ate(() => bolinhasEm('pacotes/web') === 1 && bolinhasEm('pacotes') === 0)
    r.umaSo = totalDeBolinhas() === 1
    r.dica = linha('pacotes/web')?.querySelector('.arvore-escrevendo')?.title ?? ''
    await prova.foto('3-projeto')

    // 3. node_modules nao e projeto de ninguem: a bolinha fica onde estava
    await gancho(`${app}/node_modules/x/i.js`)
    await espera(1200)
    r.ignorouNodeModules = bolinhasEm('pacotes/web') === 1
  } catch (e) {
    r.erros.push(String((e && e.stack) || e))
  }
  desliga()
  r.ok =
    r.erros.length === 0 &&
    r.semClaude &&
    r.settingsComGancho &&
    r.naRaiz &&
    r.pisca &&
    r.naFechada &&
    r.umaSoNaFechada &&
    r.noProjeto &&
    r.umaSo &&
    r.dica.includes('Claude 1') &&
    r.ignorouNodeModules
  return r
})()
