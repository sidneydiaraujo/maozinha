// Leitor ao lado da lateral (T7.4): md formatado (ou o codigo), outros textos com
// numero de linha. Recarrega sozinho quando um terminal mexe no arquivo.
import { useEffect, useMemo, useState } from 'react'
import type { ConteudoArquivo } from '../../../shared/model'
import { mensagemDe } from '../componentes/erro'
import '../estilos/leitor.css'
import { renderizarMarkdown, resolverLink } from './markdown'
import type { ArquivoAberto } from './useArquivoAberto'
import { useLargura } from './useLargura'

interface Props {
  arquivo: ArquivoAberto
  repoNome: string
  aoFechar(): void
  aoAbrir(repoId: string, relativo: string): void
  aoAvisar(texto: string): void
}

const FLASH_MS = 3_000
const ehMarkdown = (relativo: string): boolean => /\.(md|markdown|mdx)$/i.test(relativo)

function tamanhoLegivel(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1).replace('.', ',')} KB`
  return `${(bytes / 1024 / 1024).toFixed(1).replace('.', ',')} MB`
}

/** Conteudo atual do arquivo; relido quando o vigia avisa que ele mudou. */
function useConteudo(arquivo: ArquivoAberto) {
  const [conteudo, setConteudo] = useState<ConteudoArquivo>(arquivo.conteudo)
  const [erro, setErro] = useState<string | null>(null)
  const [atualizado, setAtualizado] = useState(false)
  const { repoId, relativo } = arquivo

  useEffect(
    () =>
      window.lousa.arquivos.aoMudar((repo, caminhos) => {
        if (repo !== repoId || !caminhos.includes(relativo)) return
        window.lousa.arquivos
          .ler(repoId, relativo)
          .then((c) => {
            setConteudo(c)
            setErro(null)
            setAtualizado(true)
          })
          .catch((e: unknown) => setErro(mensagemDe(e)))
      }),
    [repoId, relativo],
  )

  useEffect(() => {
    if (!atualizado) return
    const id = window.setTimeout(() => setAtualizado(false), FLASH_MS)
    return () => window.clearTimeout(id)
  }, [atualizado])

  return { conteudo, erro, atualizado }
}

function Codigo({ texto }: { texto: string }): React.JSX.Element {
  const numeros = useMemo(() => {
    const n = texto.split('\n').length
    return Array.from({ length: n }, (_, i) => i + 1).join('\n')
  }, [texto])
  return (
    <div className="leitor-codigo">
      <pre className="leitor-numeros" aria-hidden="true">
        {numeros}
      </pre>
      <pre className="leitor-texto">{texto}</pre>
    </div>
  )
}

interface CorpoProps {
  arquivo: ArquivoAberto
  conteudo: ConteudoArquivo
  formatado: boolean
  aoAbrir(repoId: string, relativo: string): void
  aoAvisar(texto: string): void
}

function Corpo({ arquivo, conteudo, formatado, aoAbrir, aoAvisar }: CorpoProps): React.JSX.Element {
  const html = useMemo(
    () => (formatado && conteudo.tipo === 'texto' ? renderizarMarkdown(conteudo.texto) : ''),
    [formatado, conteudo],
  )
  if (conteudo.tipo === 'binario') return <p className="leitor-vazio">Este arquivo não é texto.</p>
  if (conteudo.tipo === 'grande') {
    return <p className="leitor-vazio">Arquivo grande demais para o leitor ({tamanhoLegivel(conteudo.tamanho)}).</p>
  }
  if (!formatado) return <Codigo texto={conteudo.texto} />

  // links: http(s) no navegador; relativos abrem aqui; o resto e ignorado
  function aoClicar(e: React.MouseEvent): void {
    const link = (e.target as HTMLElement).closest('a')
    if (!link) return
    e.preventDefault()
    const href = link.getAttribute('href') ?? ''
    if (/^https?:/i.test(href)) {
      window.lousa.arquivos.abrirLink(href).catch((falha: unknown) => aoAvisar(mensagemDe(falha)))
      return
    }
    const destino = resolverLink(arquivo.relativo, href)
    if (destino) aoAbrir(arquivo.repoId, destino)
  }
  return <div className="leitor-md" onClick={aoClicar} dangerouslySetInnerHTML={{ __html: html }} />
}

export function Leitor({ arquivo, repoNome, aoFechar, aoAbrir, aoAvisar }: Props): React.JSX.Element {
  const { conteudo, erro, atualizado } = useConteudo(arquivo)
  const { largura, aoApertarAlca } = useLargura()
  const md = ehMarkdown(arquivo.relativo)
  const [formatado, setFormatado] = useState(md)
  const nome = arquivo.relativo.slice(arquivo.relativo.lastIndexOf('/') + 1)
  const pasta = [repoNome, ...arquivo.relativo.split('/').slice(0, -1)].join(' / ')
  const falhar = (e: unknown): void => aoAvisar(mensagemDe(e))

  return (
    <section className="leitor" style={{ width: largura }} aria-label={`Leitor: ${nome}`}>
      <header className="leitor-topo">
        <div className="leitor-titulo">
          <strong title={arquivo.relativo}>{nome}</strong>
          <small>{pasta}</small>
        </div>
        {atualizado && <span className="leitor-atualizado">atualizado agora</span>}
        {md && conteudo.tipo === 'texto' && (
          <button className="botao-pequeno" onClick={() => setFormatado((f) => !f)}>
            {formatado ? 'Ver código' : 'Ver formatado'}
          </button>
        )}
        {conteudo.podeAbrirFora && (
          <button
            className="botao-pequeno"
            title="Abrir no programa do Windows"
            onClick={() => void window.lousa.arquivos.abrirFora(arquivo.repoId, arquivo.relativo).catch(falhar)}
          >
            Abrir fora
          </button>
        )}
        <button
          className="botao-pequeno"
          title="Mostrar no Explorador de Arquivos do Windows"
          onClick={() => void window.lousa.arquivos.mostrarNaPasta(arquivo.repoId, arquivo.relativo).catch(falhar)}
        >
          Mostrar na pasta
        </button>
        <button className="botao-fechar" aria-label="Fechar o leitor" onClick={aoFechar}>
          ×
        </button>
      </header>
      {erro && (
        <p className="erro leitor-erro" role="alert">
          {erro}
        </p>
      )}
      <div className="leitor-corpo">
        <Corpo arquivo={arquivo} conteudo={conteudo} formatado={formatado} aoAbrir={aoAbrir} aoAvisar={aoAvisar} />
      </div>
      <div className="leitor-alca" onMouseDown={aoApertarAlca} title="Arraste para mudar a largura" />
    </section>
  )
}
