// Le a saida do `claude auth login` sem mostrar o terminal (T6.4). Funcoes puras, testaveis.

const ESC = '\u001b'
const BEL = '\u0007'
// Montadas com new RegExp a partir de constantes: a regra no-control-regex barra o ESC literal.
const OSC = new RegExp(`${ESC}\\][^${BEL}${ESC}]*(?:${BEL}|${ESC}\\\\)`, 'g')
const CSI = new RegExp(`${ESC}\\[[0-9;?]*[ -/]*[@-~]`, 'g')
const OUTROS_ESC = new RegExp(`${ESC}[@-Z\\\\-_]`, 'g')
const LINK_OSC8 = new RegExp(`${ESC}\\]8;[^;]*;(https://[^${BEL}${ESC}]+)`)

/** Tira cores, movimentos de cursor e titulos: sobra o texto que a pessoa leria. */
export function limparTerminal(bruto: string): string {
  return bruto.replace(OSC, '').replace(CSI, '').replace(OUTROS_ESC, '').replace(/\r/g, '')
}

/**
 * O link de login. Primeiro o hiperlink embutido (OSC 8), que vem inteiro; senao o texto
 * depois de "visit:", juntando as linhas que o terminal quebrou (link nao tem espaco).
 */
export function extrairLink(bruto: string): string | null {
  const embutido = LINK_OSC8.exec(bruto)?.[1]
  if (embutido) return embutido
  const texto = limparTerminal(bruto)
  const inicio = texto.indexOf('https://', Math.max(0, texto.search(/visit/i)))
  if (inicio < 0) return null
  const resto = texto.slice(inicio)
  const fim = resto.search(/\n\s*\n|Paste code|\n[A-Z][a-z]+ /)
  const link = (fim < 0 ? resto : resto.slice(0, fim)).replace(/\s+/g, '')
  return link.length > 'https://'.length ? link : null
}

/** O CLI ja mandou abrir o navegador (ou mostrou o link para abrir na mao). */
export function viuNavegador(bruto: string): boolean {
  return /opening browser|browser|visit:/i.test(limparTerminal(bruto)) || extrairLink(bruto) !== null
}

/** Ultimas linhas com texto, para o "ver detalhes" quando o login falha. */
export function ultimasLinhas(bruto: string, quantas = 12): string {
  return limparTerminal(bruto)
    .split('\n')
    .map((l) => l.trimEnd())
    .filter((l) => l.trim() !== '')
    .slice(-quantas)
    .join('\n')
}
