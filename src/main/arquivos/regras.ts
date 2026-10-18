// Regras puras das pastas na lateral (T7.1). O jeito de ordenar, o que esconder e
// como reconhecer binario vem do VSCode 1.142 (docs/plano/fatia-7-barra-e-arquivos.md).
import { isAbsolute, relative, resolve, sep } from 'node:path'
import type { ComoAbrir, ItemArquivo } from '../../shared/model'

/** `files.exclude` padrao do VSCode: nunca aparecem na arvore. */
const ESCONDIDOS = new Set(['.git', '.svn', '.hg', '.jj', '.DS_Store', 'Thumbs.db'])

/** Pastas que mudam sozinhas (git, dependencias, builds): mudanca dentro delas nao vira "alterado". */
const SEM_VIGIA = new Set([
  '.git',
  '.svn',
  '.hg',
  'node_modules',
  'out',
  'dist',
  'build',
  'release',
  'coverage',
  '.next',
  '.vite',
  '.turbo',
  '.cache',
  '__pycache__',
  '.venv',
  'venv',
  'target',
  'bin',
  'obj',
])

/** Aberto no leitor da Lousa: texto de desenvolvimento. */
const TEXTO = new Set(
  (
    'md markdown mdx txt log csv tsv json jsonc json5 yml yaml toml ini cfg conf env properties xml ' +
    'html htm css scss sass less svg ts tsx js jsx mjs cjs vue svelte py rb go rs java kt kts cs fs vb ' +
    'c h cpp hpp cc php sql sh bash zsh ps1 psm1 psd1 bat cmd gradle lock gitignore gitattributes ' +
    'editorconfig npmrc nvmrc prettierrc eslintrc dockerfile makefile http graphql gql proto tf'
  ).split(' '),
)

/** Abertos no programa do Windows: documentos e midia. Nada que execute. */
const DOCUMENTO = new Set(
  (
    'pdf doc docx xls xlsx ppt pptx odt ods odp rtf png jpg jpeg gif webp bmp ico tif tiff ' +
    'heic mp4 mov avi mkv webm mp3 wav ogg m4a flac zip'
  ).split(' '),
)

/** Textos que tambem podem ir para fora: o programa padrao so mostra (nunca roda). */
const TEXTO_SEGURO_FORA = new Set('md markdown txt log csv tsv json html htm xml svg'.split(' '))

export const BYTES_AMOSTRA = 512 // o VSCode olha os primeiros 512 bytes
export const LIMITE_TEXTO = 2 * 1024 * 1024

const colador = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' })

/** Ordem padrao do VSCode: pastas primeiro, nome com numeros em ordem natural (a2 antes de a10). */
export function ordenar(itens: ItemArquivo[]): ItemArquivo[] {
  return [...itens].sort((a, b) => {
    if (a.pasta !== b.pasta) return a.pasta ? -1 : 1
    return colador.compare(a.nome, b.nome) || (a.nome < b.nome ? -1 : a.nome > b.nome ? 1 : 0)
  })
}

export function visivel(nome: string): boolean {
  return !ESCONDIDOS.has(nome)
}

/**
 * Caminho absoluto de `relativo` dentro de `raiz`, ou null se sair dela.
 * A tela so manda caminho relativo (com / ou \); absoluto, `..` para fora ou outra unidade = null.
 */
export function caminhoDentro(raiz: string, relativo: string): string | null {
  if (relativo.includes('\0') || isAbsolute(relativo) || /^[a-z]:/i.test(relativo)) return null
  const base = resolve(raiz)
  const alvo = resolve(base, relativo)
  const rel = relative(base, alvo)
  if (rel === '') return alvo
  if (rel === '..' || rel.startsWith(`..${sep}`) || isAbsolute(rel)) return null
  return alvo
}

/** Extensao em minusculas; arquivo sem ponto usa o proprio nome (Dockerfile, Makefile). */
export function extensao(nome: string): string {
  const base = nome.toLowerCase()
  const ponto = base.lastIndexOf('.')
  return ponto <= 0 ? base.replace(/^\./, '') : base.slice(ponto + 1)
}

/** 'leitor' = abre na Lousa; 'fora' = programa do Windows; 'descobrir' = olhar o conteudo. */
export function comoAbrir(nome: string): ComoAbrir {
  const ext = extensao(nome)
  if (TEXTO.has(ext)) return 'leitor'
  if (DOCUMENTO.has(ext)) return 'fora'
  return 'descobrir'
}

/** So documento, midia ou texto que o programa padrao apenas mostra. Script e executavel nunca. */
export function podeAbrirFora(nome: string): boolean {
  const ext = extensao(nome)
  return DOCUMENTO.has(ext) || TEXTO_SEGURO_FORA.has(ext)
}

/** Heuristica do VSCode: byte zero nos primeiros 512 bytes e nao e UTF-16 (zeros alternados) = binario. */
export function pareceBinario(amostra: Uint8Array): boolean {
  const n = Math.min(amostra.length, BYTES_AMOSTRA)
  if (n >= 2 && ((amostra[0] === 0xff && amostra[1] === 0xfe) || (amostra[0] === 0xfe && amostra[1] === 0xff))) {
    return false
  }
  let temZero = false
  let utf16le = true // texto comum em UTF-16 LE: zero so nas posicoes impares
  let utf16be = true // em UTF-16 BE: zero so nas posicoes pares
  for (let i = 0; i < n; i++) {
    const zero = amostra[i] === 0
    const impar = i % 2 === 1
    if (zero) temZero = true
    if (impar !== zero) utf16le = false
    if (impar === zero) utf16be = false
  }
  return temZero && !utf16le && !utf16be
}

/** Texto do arquivo: UTF-16 com marca (BOM) ou UTF-8 (sem a marca no comeco). */
export function decodificar(bytes: Uint8Array): string {
  if (bytes[0] === 0xff && bytes[1] === 0xfe) return new TextDecoder('utf-16le').decode(bytes.subarray(2))
  if (bytes[0] === 0xfe && bytes[1] === 0xff) return new TextDecoder('utf-16be').decode(bytes.subarray(2))
  return new TextDecoder('utf-8').decode(bytes) // o TextDecoder ja tira a marca do UTF-8
}

/** Link de um md: so http(s) vai para o navegador. Devolve a URL normalizada ou null. */
export function linkPermitido(url: string): string | null {
  try {
    const u = new URL(url)
    return u.protocol === 'https:' || u.protocol === 'http:' ? u.toString() : null
  } catch {
    return null
  }
}

/** Caminho vindo do vigia (com \) no formato da tela (com /); null se deve ser ignorado. */
export function mudancaRelevante(nomeDoEvento: string): string | null {
  const relativo = nomeDoEvento.replace(/\\/g, '/').replace(/^\/+|\/+$/g, '')
  if (relativo === '') return null
  const partes = relativo.split('/')
  if (partes.some((p) => SEM_VIGIA.has(p) || ESCONDIDOS.has(p))) return null
  return relativo
}
