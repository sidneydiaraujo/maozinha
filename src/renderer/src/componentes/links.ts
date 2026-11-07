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

interface LinhaLida {
  readonly isWrapped: boolean
  readonly length: number
  getCell(x: number): CelulaLida | undefined
}

/** Celula do buffer (1-based), como o xterm pede no range do link. */
export interface Celula {
  x: number
  y: number
}

/** Uma linha que o terminal quebrou em varias (caminho longo) vira um texto so (T8.3). */
const MAIS_LINHAS = 20

/**
 * Texto de uma linha logica (a primeira e as que continuam nela, `isWrapped`) e, para cada
 * letra, a celula onde ela comeca e onde termina. `y` de cada parte e 1-based.
 */
export function textoDaLinhaLogica(
  partes: Array<{ y: number; linha: LinhaLida }>,
  colunas: number,
): { texto: string; inicio: Celula[]; fim: Celula[] } {
  let texto = ''
  const inicio: Celula[] = []
  const fim: Celula[] = []
  for (const { y, linha } of partes) {
    for (let x = 0; x < Math.min(linha.length, colunas); x++) {
      const celula = linha.getCell(x)
      const largura = celula?.getWidth() ?? 1
      if (largura === 0) continue // segunda metade de uma letra larga (emoji, CJK)
      const letras = celula?.getChars() || ' '
      for (let i = 0; i < letras.length; i++) {
        inicio.push({ x: x + 1, y })
        fim.push({ x: x + largura, y })
      }
      texto += letras
    }
  }
  return { texto, inicio, fim }
}

/** Linhas do buffer (0-based) que formam a linha logica que contem `indice`. */
function partesDaLinha(buffer: { getLine(i: number): LinhaLida | undefined }, indice: number) {
  let primeira = indice
  while (primeira > 0 && buffer.getLine(primeira)?.isWrapped && indice - primeira < MAIS_LINHAS) primeira--
  const partes: Array<{ y: number; linha: LinhaLida }> = []
  for (let i = primeira; partes.length <= MAIS_LINHAS * 2; i++) {
    const linha = buffer.getLine(i)
    if (!linha || (i > primeira && !linha.isWrapped)) break
    partes.push({ y: i + 1, linha })
  }
  return partes
}

export interface AcoesLink {
  abrirUrl(url: string): void
  /**
   * Ausente (terminal de login): caminhos nao viram link. R1.6: `resolver` diz qual arquivo da pasta
   * o texto citado e (null = nao existe ou e de fora: sem sublinhado); `abrir` recebe esse relativo.
   */
  arquivo?: { resolver(texto: string): Promise<string | null>; abrir(relativo: string): void }
}

/** Um link achado na linha vira link do xterm; arquivo so se o main achou o arquivo. */
async function paraXterm(l: LinkAchado, range: ILink['range'], acoes: () => AcoesLink): Promise<ILink | null> {
  if (l.tipo === 'url') return { range, text: l.texto, activate: (_e, t) => acoes().abrirUrl(t) }
  const relativo = await acoes()
    .arquivo?.resolver(l.texto)
    .catch(() => null)
  return relativo ? { range, text: l.texto, activate: () => acoes().arquivo?.abrir(relativo) } : null
}

export function ligarLinks(term: Terminal, acoes: () => AcoesLink): IDisposable {
  return term.registerLinkProvider({
    provideLinks(y, devolver) {
      const partes = partesDaLinha(term.buffer.active, y - 1)
      if (partes.length === 0) return devolver(undefined)
      const { texto, inicio, fim } = textoDaLinhaLogica(partes, term.cols)
      const comArquivo = !!acoes().arquivo
      const achados = acharLinks(texto)
        .filter((l) => l.tipo === 'url' || comArquivo)
        .map((l) => ({ l, range: { start: inicio[l.inicio] ?? { x: 1, y }, end: fim[l.fim - 1] ?? { x: 1, y } } }))
        // o xterm pergunta linha a linha: so os links que passam por esta linha
        .filter(({ range }) => range.start.y <= y && range.end.y >= y)
      if (achados.length === 0) return devolver(undefined)
      void Promise.all(achados.map(({ l, range }) => paraXterm(l, range, acoes))).then((links) => {
        const validos = links.filter((x): x is ILink => x !== null)
        devolver(validos.length > 0 ? validos : undefined)
      })
    },
  })
}
