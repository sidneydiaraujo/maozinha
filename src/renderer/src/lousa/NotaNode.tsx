import { NodeResizer, type NodeProps } from '@xyflow/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import '../estilos/nota.css'
import { renderizarMarkdown } from '../leitor/markdown'
import { mandarAosAlvos } from './mandar'
import type { NotaNo } from './notas'

const ESPERA_SALVAR_MS = 500

/** Guarda o texto 500 ms depois da ultima tecla, e na hora ao sair da edicao. */
function useTextoSalvo(inicial: string, salvar: (texto: string) => void) {
  const [texto, setTexto] = useState(inicial)
  const salvo = useRef(inicial)
  // a funcao muda a cada desenho do no; o relogio so reinicia quando o TEXTO muda
  const salvarAtual = useRef(salvar)
  useEffect(() => {
    salvarAtual.current = salvar
  }, [salvar])
  useEffect(() => {
    if (texto === salvo.current) return
    const relogio = window.setTimeout(() => {
      salvo.current = texto
      salvarAtual.current(texto)
    }, ESPERA_SALVAR_MS)
    return () => window.clearTimeout(relogio)
  }, [texto])
  const salvarJa = (): void => {
    if (texto === salvo.current) return
    salvo.current = texto
    salvarAtual.current(texto)
  }
  return { texto, setTexto, salvarJa }
}

/**
 * Nota solta na lousa (T26.2, D34): markdown ao lado dos agentes, para o plano, a lista de
 * tarefas ou o rascunho de um pedido. Duplo clique escreve; "Mandar" leva o texto ao agente.
 */
export function NotaNode({ data, selected }: NodeProps<NotaNo>): React.JSX.Element {
  const { nota, acoes } = data
  const { texto, setTexto, salvarJa } = useTextoSalvo(nota.texto, (t) => acoes.salvar(nota.id, t))
  const [editando, setEditando] = useState(nota.texto === '')
  const html = useMemo(() => (editando ? '' : renderizarMarkdown(texto)), [editando, texto])

  const parar = (): void => {
    salvarJa()
    setEditando(false)
  }
  const apagar = (): void => {
    if (texto.trim() === '' || window.confirm('Apagar esta nota?')) acoes.remover(nota.id)
  }

  return (
    <div className="nota" data-nota={nota.id}>
      <NodeResizer minWidth={220} minHeight={140} isVisible={selected} />
      <header className="cabecalho-nota">
        <span className="nota-rotulo">📝 Nota</span>
        <button className="botao-pequeno nodrag" onClick={() => (editando ? parar() : setEditando(true))}>
          {editando ? 'Pronto' : 'Editar'}
        </button>
        <button
          className="botao-pequeno nodrag"
          disabled={texto.trim() === ''}
          title="Manda o texto da nota aos quadros selecionados ou ao último em que você clicou"
          onClick={() => void mandarAosAlvos(texto)}
        >
          ➤ Mandar
        </button>
        <button className="botao-fechar nodrag" aria-label="Apagar a nota" onClick={apagar}>
          ×
        </button>
      </header>
      {editando ? (
        <textarea
          className="nota-texto nodrag nowheel"
          value={texto}
          autoFocus
          placeholder="Escreva em markdown: # título, - [ ] tarefa, **negrito**…"
          onChange={(e) => setTexto(e.target.value)}
          onBlur={salvarJa}
          onKeyDown={(e) => e.key === 'Escape' && parar()}
        />
      ) : (
        <div
          className="nota-md nowheel"
          title="Duplo clique para escrever"
          onDoubleClick={() => setEditando(true)}
          // link dentro da nota nao troca a pagina da Lousa
          onClick={(e) => (e.target as Element).closest('a') && e.preventDefault()}
          dangerouslySetInnerHTML={{ __html: html || '<p class="nota-vazia">Duplo clique para escrever</p>' }}
        />
      )}
    </div>
  )
}
