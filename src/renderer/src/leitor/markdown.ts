// Markdown do leitor (T7.4). html: false = HTML escrito dentro do md vira texto, entao
// nada que um terminal grave no arquivo roda na tela. Imagens viram texto: a tela nao
// carrega nada de fora nem do disco.
import MarkdownIt from 'markdown-it'

const md = new MarkdownIt({ html: false, linkify: true, typographer: false })

md.renderer.rules.image = (tokens, i) => {
  const alt = tokens[i]?.content || 'imagem'
  return `<span class="md-imagem">[${md.utils.escapeHtml(alt)}]</span>`
}

/** Caixas de tarefa "- [ ]" e "- [x]" do GitHub viram ☐ e ☑ (lista junta ou com linha em branco). */
function caixas(html: string): string {
  return html
    .replace(/<li>(\s*<p>)?\[ \] /g, '<li class="md-tarefa">$1☐ ')
    .replace(/<li>(\s*<p>)?\[[xX]\] /g, '<li class="md-tarefa md-feita">$1☑ ')
}

export function renderizarMarkdown(texto: string): string {
  return caixas(md.render(texto))
}

/**
 * Link relativo de um md -> caminho relativo ao repo, ou null se sair dele.
 * `base` e o arquivo onde o link esta (ex.: 'docs/plano/README.md').
 */
export function resolverLink(base: string, href: string): string | null {
  const semAncora = href.split('#')[0]?.split('?')[0] ?? ''
  if (semAncora === '' || /^[a-z][a-z0-9+.-]*:/i.test(semAncora)) return null
  const caminho = decodificar(semAncora)
  if (caminho === null) return null
  return andar(caminho.startsWith('/') ? [] : base.split('/').slice(0, -1), caminho.split('/'))
}

function decodificar(texto: string): string | null {
  try {
    return decodeURIComponent(texto)
  } catch {
    return null
  }
}

/** Aplica os trechos (com . e ..) a partir de `partes`; null se subir alem da raiz do repo. */
function andar(partes: string[], trechos: string[]): string | null {
  for (const trecho of trechos) {
    if (trecho === '' || trecho === '.') continue
    if (trecho !== '..') partes.push(trecho)
    else if (partes.pop() === undefined) return null
  }
  return partes.length > 0 ? partes.join('/') : null
}
