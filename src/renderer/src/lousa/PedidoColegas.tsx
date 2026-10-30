// Colegas pedidos pelo proprio agente (A19, D56): "Claude 1 quer criar 2 colegas". So o clique
// aqui cria; a tela manda so o id do pedido e o sim/nao. Fechar (Esc, fora) = recusar.
import { useEffect, useState } from 'react'
import type { PedidoColegas as Pedido } from '../../../shared/model'
import { mensagemDe } from '../componentes/erro'
import '../estilos/pedidos.css'

/** Os pedidos abertos, na ordem em que chegaram; o main tira os que acabaram. */
function usePedidos(): Pedido[] {
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  useEffect(
    () =>
      window.lousa.time.aoPedidoColegas((aviso) =>
        setPedidos((lista) =>
          aviso.tipo === 'novo' ? [...lista, aviso.pedido] : lista.filter((p) => p.pedidoId !== aviso.pedidoId),
        ),
      ),
    [],
  )
  return pedidos
}

export function PedidoColegas(): React.JSX.Element | null {
  const [pedido] = usePedidos()
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const id = pedido?.pedidoId

  useEffect(() => {
    setEnviando(false)
    setErro(null)
  }, [id])

  const responder = (aceitar: boolean): void => {
    if (!id || enviando) return
    setEnviando(true)
    window.lousa.time.responderPedido(id, aceitar).catch((e: unknown) => {
      setEnviando(false)
      setErro(mensagemDe(e))
    })
  }

  useEffect(() => {
    if (!id) return
    const tecla = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') responder(false)
    }
    window.addEventListener('keydown', tecla)
    return () => window.removeEventListener('keydown', tecla)
  })

  if (!pedido) return null
  const n = pedido.colegas.length
  return (
    <div className="janela-fundo" onMouseDown={(e) => e.target === e.currentTarget && responder(false)}>
      <div className="janela janela-pedido" role="dialog" aria-label="Pedido de colegas">
        <h2 className="janela-titulo">
          {pedido.nome} quer criar {n === 1 ? '1 colega' : `${n} colegas`}
        </h2>
        <p className="apagado">
          Cada um nasce na mesma conta, numa cópia própria da pasta, ligado a {pedido.nome}, e recebe a tarefa abaixo
          assim que abrir.
        </p>
        <ol className="pedido-lista">
          {pedido.colegas.map((c, i) => (
            <li key={i}>
              <strong>{c.papel}</strong>
              <span className="pedido-tarefa">{c.tarefa}</span>
            </li>
          ))}
        </ol>
        {erro && (
          <p className="erro" role="alert">
            {erro}
          </p>
        )}
        <div className="juntar-botoes">
          <button className="botao-principal" disabled={enviando} onClick={() => responder(true)}>
            {n === 1 ? 'Criar o colega' : `Criar os ${n} colegas`}
          </button>
          <button className="botao-pequeno" disabled={enviando} autoFocus onClick={() => responder(false)}>
            Recusar
          </button>
        </div>
      </div>
    </div>
  )
}
