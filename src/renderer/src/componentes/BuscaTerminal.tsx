import type { Terminal } from '@xterm/xterm'
import { useEffect, useRef, useState } from 'react'
import { acharOcorrencias, vizinha, type Ocorrencia } from './procurar'

interface Props {
  term: Terminal
  aoFechar(): void
}

function linhasDo(term: Terminal): string[] {
  const buffer = term.buffer.active
  const linhas: string[] = []
  for (let i = 0; i < buffer.length; i++) linhas.push(buffer.getLine(i)?.translateToString(true) ?? '')
  return linhas
}

/** Seleciona a ocorrencia e rola para ela ficar no meio da tela. */
function mostrar(term: Terminal, o: Ocorrencia, tamanho: number): void {
  term.select(o.coluna, o.linha, tamanho)
  term.scrollToLine(Math.max(0, o.linha - Math.floor(term.rows / 2)))
}

/**
 * Ctrl+F no terminal (T12.2): procura no historico (ate 10 mil linhas). Comeca pela mais nova
 * (a de baixo); Enter sobe para a anterior, Shift+Enter desce (T24.2, D32), Esc fecha e devolve o foco ao terminal.
 */
export function BuscaTerminal({ term, aoFechar }: Props): React.JSX.Element {
  const [texto, setTexto] = useState('')
  const [achadas, setAchadas] = useState<Ocorrencia[]>([])
  const [atual, setAtual] = useState(-1)
  const campo = useRef<HTMLInputElement>(null)

  useEffect(() => campo.current?.focus(), [])

  function procurar(novo: string): void {
    setTexto(novo)
    const lista = acharOcorrencias(linhasDo(term), novo)
    setAchadas(lista)
    const ultima = lista.length - 1
    setAtual(ultima)
    const o = lista[ultima]
    if (o) mostrar(term, o, novo.length)
    else term.clearSelection()
  }

  function andar(passo: 1 | -1): void {
    const i = vizinha(achadas.length, atual, passo)
    const o = achadas[i]
    if (!o) return
    setAtual(i)
    mostrar(term, o, texto.length)
  }

  function fechar(): void {
    term.clearSelection()
    aoFechar()
    term.focus()
  }

  return (
    <div className="busca-terminal nodrag" role="search">
      <input
        ref={campo}
        value={texto}
        placeholder="Procurar no terminal"
        aria-label="Procurar no terminal"
        onChange={(e) => procurar(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') fechar()
          else if (e.key === 'Enter') andar(e.shiftKey ? 1 : -1) // Enter sobe (mais antigo), T24.2
          else return
          e.preventDefault()
        }}
      />
      <span className="busca-contagem">{texto ? `${achadas.length ? atual + 1 : 0} de ${achadas.length}` : ''}</span>
      <button className="botao-fechar" aria-label="Fechar a busca" onClick={fechar}>
        ×
      </button>
    </div>
  )
}
