// Cenario de prova na janela real (provas/README.md): o smoke carrega a tela e roda um
// roteiro de provas/cenarios/ dentro dela. So fora do instalador. O roteiro pede ao main
// o que a tela sozinha nao faz: foto da janela, tecla ou clique de verdade e evento do main.
import type { BrowserWindow } from 'electron'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { log } from './log'

const PASSO_MS = 100
const PRAZO_MS = 10 * 60_000

export interface Cenario {
  arquivo: string // roteiro .js que termina numa Promise com o resultado
  saida: string // pasta do resultado.json, das fotos e do dados.json do executor
}

interface Pedido {
  id: number
  tipo: 'foto' | 'eventos' | 'ipc' | 'imagem'
  nome?: string
  eventos?: unknown[]
  canal?: string
  dados?: unknown
}

type EventoDeEntrada = Parameters<BrowserWindow['webContents']['sendInputEvent']>[0]

/** `--cenario=<roteiro.js> --saida=<pasta>`; null sem os dois ou dentro do instalador. */
export function lerCenario(argv: string[], empacotado: boolean): Cenario | null {
  if (empacotado) return null
  const valor = (nome: string): string | undefined =>
    argv.find((a) => a.startsWith(`--${nome}=`))?.slice(nome.length + 3) || undefined
  const arquivo = valor('cenario')
  const saida = valor('saida')
  return arquivo && saida ? { arquivo, saida } : null
}

/**
 * Pasta de dados do smoke: sem `--user-data-dir` (o `npm run smoke`), uma pasta temporaria
 * propria. Antes era a mesma da Lousa instalada: o smoke abria o estado de verdade (quadros e
 * terminais) e brigava com o app aberto pela pasta.
 */
export function pastaDoSmoke(argv: string[], temporaria: string): string | null {
  return argv.some((a) => a.startsWith('--user-data-dir')) ? null : join(temporaria, 'lousa-ia-smoke')
}

/**
 * A pasta de dados real fica fixa em %APPDATA%/lousa-ia (D45) so na abertura normal: no smoke e nas
 * provas (--user-data-dir) vale a pasta de teste, e a real nunca pode ser tocada. Puro.
 */
export function usaPastaReal(argv: string[]): boolean {
  return !argv.some((a) => a === '--smoke' || a.startsWith('--user-data-dir'))
}

/** O `dados.json` que o provas/rodar.mjs grava na saida (caminhos e opcoes da rodada). */
function lerDados(saida: string): unknown {
  const arquivo = join(saida, 'dados.json')
  return existsSync(arquivo) ? JSON.parse(readFileSync(arquivo, 'utf8')) : {}
}

/** Desenho dos terminais na rodada (T15.2): o normal, salvo a opcao `webgl` (`rodar.mjs aparencia webgl`). */
export function desenhoDasOpcoes(dados: unknown): 'dom' | 'webgl' {
  return temOpcao(dados, 'webgl') ? 'webgl' : 'dom'
}

/** A opcao `brilho` (`rodar.mjs desempenho brilho`, T21.2) mede com as animacoes ligadas. */
export const comMovimento = (dados: unknown): boolean => temOpcao(dados, 'brilho')

function temOpcao(dados: unknown, nome: string): boolean {
  const opcoes = dados && typeof dados === 'object' ? (dados as { opcoes?: unknown }).opcoes : undefined
  return Array.isArray(opcoes) && opcoes.includes(nome)
}

export const desenhoDaRodada = (c: Cenario): 'dom' | 'webgl' => desenhoDasOpcoes(lerDados(c.saida))

/**
 * A opcao `sem-claude` (`rodar.mjs time sem-claude`): o agente abre so o PowerShell, sem o
 * claude.exe de verdade, e o cenario usa o Claude falso. Rodada leve: com varios agentes de
 * verdade abertos de uma vez (seis no `time`) o PC ficou sem memoria em 21/10.
 */
export const semClaude = (dados: unknown): boolean => temOpcao(dados, 'sem-claude')

/** `sem-claude` nesta rodada de prova; nunca no instalador nem fora de um cenario. */
export function semClaudeNaRodada(argv: string[], empacotado: boolean): boolean {
  const c = lerCenario(argv, empacotado)
  return c !== null && semClaude(lerDados(c.saida))
}

/** Nome de foto vira nome de arquivo sem caminho: so letras, numeros, - e _. */
export function nomeDaFoto(nome: unknown): string {
  const limpo = String(nome ?? '').replace(/[^\w-]+/g, '-').slice(0, 60)
  return `${limpo || 'foto'}.png`
}

/** `window.prova` dentro da tela: espera, foto, eventos de entrada e evento do main. */
function preludio(dados: unknown): string {
  return `window.prova = (() => {
  let proximo = 0
  const pendentes = new Map()
  window.__provaPedidos = []
  window.__provaFeito = (id) => { pendentes.get(id)?.(); pendentes.delete(id) }
  const pedir = (p) => new Promise((ok) => { const id = ++proximo; pendentes.set(id, ok); window.__provaPedidos.push({ ...p, id }) })
  return {
    dados: ${JSON.stringify(dados)},
    espera: (ms) => new Promise((r) => setTimeout(r, ms)),
    foto: (nome) => pedir({ tipo: 'foto', nome }),
    eventos: (eventos) => pedir({ tipo: 'eventos', eventos }),
    ipc: (canal, dados) => pedir({ tipo: 'ipc', canal, dados }),
    imagemNaArea: () => pedir({ tipo: 'imagem' }),
  }
})();\n`
}

const esperar = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms))

// PNG de 1x1 ponto: o print falso que o cenario `print` poe na area de transferencia (T16.1)
const PRINT_DE_TESTE =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='

/** O electron so e importado aqui dentro: os testes do main rodam fora dele. */
async function imagemNaArea(): Promise<void> {
  const { clipboard, nativeImage } = await import('electron')
  clipboard.writeImage(nativeImage.createFromDataURL(PRINT_DE_TESTE))
}

/** Duas capturas: a primeira as vezes vem com o quadro anterior da janela escondida. */
async function fotografar(janela: BrowserWindow, arquivo: string): Promise<void> {
  const wc = janela.webContents
  await esperar(500)
  wc.invalidate()
  await esperar(400)
  await wc.capturePage()
  wc.invalidate()
  await esperar(300)
  writeFileSync(arquivo, (await wc.capturePage()).toPNG())
}

async function atender(janela: BrowserWindow, saida: string, p: Pedido): Promise<void> {
  const wc = janela.webContents
  if (p.tipo === 'foto') return fotografar(janela, join(saida, nomeDaFoto(p.nome)))
  if (p.tipo === 'ipc' && p.canal) return wc.send(p.canal, p.dados)
  if (p.tipo === 'imagem') return imagemNaArea()
  for (const evento of p.eventos ?? []) {
    wc.sendInputEvent(evento as EventoDeEntrada)
    await esperar(40)
  }
}

/** Fotos sem animacao no meio (brilho, transicoes). */
async function semMovimento(janela: BrowserWindow): Promise<void> {
  try {
    janela.webContents.debugger.attach('1.3')
    await janela.webContents.debugger.sendCommand('Emulation.setEmulatedMedia', {
      features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
    })
  } catch {
    // com o DevTools aberto o debugger ja esta preso: segue com animacao
  }
}

/** Roda o roteiro e grava `resultado.json`. true = o roteiro terminou sem erro. */
export async function rodarCenario(janela: BrowserWindow, c: Cenario): Promise<boolean> {
  mkdirSync(c.saida, { recursive: true })
  const wc = janela.webContents
  wc.setBackgroundThrottling(false)
  const dados = lerDados(c.saida)
  if (!comMovimento(dados)) await semMovimento(janela)
  const estado: { fim: { ok: boolean; texto: string } | null } = { fim: null }
  wc.executeJavaScript(preludio(dados) + readFileSync(c.arquivo, 'utf8')).then(
    (r: unknown) => (estado.fim = { ok: true, texto: typeof r === 'string' ? r : JSON.stringify(r, null, 2) }),
    (e: unknown) => (estado.fim = { ok: false, texto: `ERRO ${String(e)}` }),
  )
  const limite = Date.now() + PRAZO_MS
  while (!estado.fim && Date.now() < limite) {
    await esperar(PASSO_MS)
    const pedidos = (await wc.executeJavaScript('(window.__provaPedidos || []).splice(0)')) as Pedido[]
    for (const p of pedidos) {
      await atender(janela, c.saida, p)
      await wc.executeJavaScript(`window.__provaFeito(${Number(p.id)})`)
    }
  }
  const fim = estado.fim ?? { ok: false, texto: 'ERRO o cenario passou de 10 minutos' }
  writeFileSync(join(c.saida, 'resultado.json'), fim.texto)
  log(fim.ok ? 'info' : 'error', `smoke: cenario ${fim.ok ? 'terminou' : 'FALHOU'} (${c.saida})`)
  return fim.ok
}
