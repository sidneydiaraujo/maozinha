// Arrastar arquivos do Explorador para o terminal (T16.2): cola os caminhos entre aspas, sem
// Enter. Tem de ser colado (term.paste): o Claude transforma o caminho colado de uma imagem em
// anexo, e o digitado letra a letra fica como texto (T16.0).

/** Caminhos entre aspas, separados por espaco, com um espaco no fim para seguir digitando. */
export function textoDoSoltar(caminhos: readonly string[]): string {
  const validos = caminhos.filter((c) => c.trim() !== '')
  return validos.length ? `${validos.map((c) => `"${c}"`).join(' ')} ` : ''
}

const temArquivos = (e: DragEvent): boolean => e.dataTransfer?.types.includes('Files') ?? false

/** Liga o soltar no terminal: borda tracejada enquanto arrasta por cima, colar ao soltar. */
export function ligarSoltar(el: HTMLElement, colar: (texto: string) => void): () => void {
  const sobre = (e: DragEvent): void => {
    if (!temArquivos(e)) return // conta arrastada para a lousa (T5.2) segue para a lousa
    e.preventDefault()
    e.stopPropagation()
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy'
    el.classList.add('soltando')
  }
  const saiu = (e: DragEvent): void => {
    if (!el.contains(e.relatedTarget as Node | null)) el.classList.remove('soltando')
  }
  const soltou = (e: DragEvent): void => {
    el.classList.remove('soltando')
    if (!temArquivos(e)) return
    e.preventDefault()
    e.stopPropagation()
    const arquivos = [...(e.dataTransfer?.files ?? [])]
    const texto = textoDoSoltar(arquivos.map((f) => window.lousa.app.caminhoDoArquivo(f)))
    if (texto) colar(texto)
  }
  el.addEventListener('dragover', sobre)
  el.addEventListener('dragleave', saiu)
  el.addEventListener('drop', soltou)
  return () => {
    el.removeEventListener('dragover', sobre)
    el.removeEventListener('dragleave', saiu)
    el.removeEventListener('drop', soltou)
  }
}

/** Arrastando algo que o Chromium abriria no lugar da tela: arquivo ou link (R2.7). */
export const abririaNaJanela = (tipos: readonly string[]): boolean =>
  tipos.includes('Files') || tipos.includes('text/uri-list')

/**
 * Arquivo ou link solto fora de um terminal: sem isto o Chromium abre o que foi solto NO LUGAR
 * da Lousa (o main tambem recusa a navegacao, R2.7). Ligado uma vez, no inicio da tela.
 */
export function impedirAbrirArquivoSolto(): void {
  const parar = (e: DragEvent): void => {
    if (abririaNaJanela(e.dataTransfer?.types ?? [])) e.preventDefault()
  }
  document.addEventListener('dragover', parar)
  document.addEventListener('drop', parar)
}
