// Links no terminal (T8.3): URL abre no navegador; caminho de arquivo dentro da pasta do quadro
// abre no leitor. Usa a API de links do proprio xterm (sem addon). As regras sao puras.
import type { IDisposable, ILink, Terminal } from '@xterm/xterm'

export type TipoLink = 'url' | 'arquivo'

export interface LinkAchado {
  inicio: number
  fim: number // exclusivo
  texto: string
  tipo: TipoLink
}

const URL_WEB = /https?:\/\/[^\s"'<>`]+/g
const PONTUACAO_NO_FIM = /[.,;:!?)\]}'"]+$/
// C:\x\y.md, ./a.ts, docs/ESTADO.md:12, package.json. Nao comeca no meio de outra palavra.
const CAMINHO =
  /(?<![\w./\\:@-])((?:[A-Za-z]:[\\/]|\.{1,2}[\\/])?(?:[\w@.+-]+[\\/])*[\w@+-][\w@.+-]*\.([A-Za-z][A-Za-z0-9]{0,7}))((?::\d+){0,2})(?![\w\\/])/g
/** Nome solto (sem pasta) so vira link com estas extensoes: "e.g." e "v1.2" ficam de fora. */
const EXTENSOES_SOLTAS = new Set(
  (
    'md markdown txt log csv json jsonc yml yaml toml ini env ts tsx js jsx mjs cjs css scss html ' +
    'py cs java go rs rb php sql sh ps1 bat lock pdf docx xlsx pptx png jpg jpeg svg'
  ).split(' '),
)

/** URLs e caminhos de arquivo de uma linha do terminal, sem sobrepor. */
export function acharLinks(linha: string): LinkAchado[] {
  const links: LinkAchado[] = []
  for (const achou of linha.matchAll(URL_WEB)) {
    const texto = achou[0].replace(PONTUACAO_NO_FIM, '')
    links.push({ inicio: achou.index, fim: achou.index + texto.length, texto, tipo: 'url' })
  }
  for (const achou of linha.matchAll(CAMINHO)) {
    const caminho = achou[1] ?? ''
    const extensao = (achou[2] ?? '').toLowerCase()
    if (!/[\\/]/.test(caminho) && !EXTENSOES_SOLTAS.has(extensao)) continue
    const inicio = achou.index
    const fim = inicio + achou[0].length
    if (links.some((l) => inicio < l.fim && fim > l.inicio)) continue
    links.push({ inicio, fim, texto: achou[0], tipo: 'arquivo' })
  }
  return links.sort((a, b) => a.inicio - b.inicio)
}

/** Caminho relativo a pasta do quadro (com /), sem ":linha"; null se for de fora da pasta. */
export function caminhoNoRepo(raiz: string, texto: string): string | null {
  const normal = texto.replace(/(?::\d+){1,2}$/, '').replace(/\\/g, '/')
  if (/^[A-Za-z]:\//.test(normal)) {
    const base = `${raiz.replace(/\\/g, '/').replace(/\/+$/, '')}/`
    if (!normal.toLowerCase().startsWith(base.toLowerCase())) return null
    return normal.slice(base.length) || null
  }
  if (normal.startsWith('/')) return null
  return normal.replace(/^(\.\/)+/, '') || null
}

/** Link OSC 8 com file:///C:/... vira o caminho do Windows; outro protocolo = null. */
export function arquivoDeUri(uri: string): string | null {
  try {
    const u = new URL(uri)
    if (u.protocol !== 'file:') return null
    return decodeURIComponent(u.pathname).replace(/^\/(?=[A-Za-z]:)/, '')
  } catch {
    return null
  }
}

interface CelulaLida {
  getWidth(): number
  getChars(): string
}

/** Texto da linha e, para cada letra, a coluna (1-based) onde ela comeca e onde termina. */
export function textoComColunas(
  linha: { length: number; getCell(x: number): CelulaLida | undefined },
  colunas: number,
): { texto: string; inicio: number[]; fim: number[] } {
  let texto = ''
  const inicio: number[] = []
  const fim: number[] = []
  for (let x = 0; x < Math.min(linha.length, colunas); x++) {
    const celula = linha.getCell(x)
    const largura = celula?.getWidth() ?? 1
    if (largura === 0) continue // segunda metade de uma letra larga (emoji, CJK)
    const letras = celula?.getChars() || ' '
    for (let i = 0; i < letras.length; i++) {
      inicio.push(x + 1)
      fim.push(x + largura)
    }
    texto += letras
  }
  return { texto, inicio, fim }
}

export interface AcoesLink {
  abrirUrl(url: string): void
  /** Ausente (terminal de login): caminhos nao viram link. */
  arquivo?: { aceita(texto: string): boolean; abrir(texto: string): void }
}

export function ligarLinks(term: Terminal, acoes: () => AcoesLink): IDisposable {
  return term.registerLinkProvider({
    provideLinks(y, devolver) {
      const linha = term.buffer.active.getLine(y - 1)
      if (!linha) return devolver(undefined)
      const { texto, inicio, fim } = textoComColunas(linha, term.cols)
      const atuais = acoes()
      const links: ILink[] = acharLinks(texto)
        .filter((l) => l.tipo === 'url' || atuais.arquivo?.aceita(l.texto))
        .map((l) => ({
          range: { start: { x: inicio[l.inicio] ?? 1, y }, end: { x: fim[l.fim - 1] ?? 1, y } },
          text: l.texto,
          activate: (_evento, t) => (l.tipo === 'url' ? acoes().abrirUrl(t) : acoes().arquivo?.abrir(t)),
        }))
      devolver(links.length > 0 ? links : undefined)
    },
  })
}
