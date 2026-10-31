// Colegas pedidos pelo proprio agente (A19, D56): "Claude 1 quer criar 2 colegas". So o clique
// aqui cria; a tela manda so o id do pedido e o sim/nao. Fechar (Esc, fora) = recusar. Paralelo (A21):
// o agente ia usar subagentes; a pergunta e ver em quadros ou seguir no mesmo terminal.
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

/** O pedido comum (o usuario pediu colegas) e o paralelo (o agente ia usar subagentes, A21). */
function textosDo(pedido: Pedido): { titulo: string; explica: string; sim: string; nao: string } {
  const n = pedido.colegas.length
  if (pedido.paralelo) {
    return {
      titulo: `${pedido.nome} vai dividir o trabalho em ${n === 1 ? '1 agente' : `${n} agentes`}`,
      explica:
        `Quer ver os agentes trabalhando em quadros? Eles nascem na mesma pasta e na mesma conta, ligados a ${pedido.nome}, ` +
        `que espera todos terminarem. Sem quadros, o trabalho segue escondido no terminal de ${pedido.nome}, como sempre.`,
      sim: 'Ver em quadros',
      nao: 'Seguir no mesmo terminal',
    }
  }
  return {
    titulo: `${pedido.nome} quer criar ${n === 1 ? '1 colega' : `${n} colegas`}`,
    explica: `Cada um nasce na mesma conta, numa cópia própria da pasta, ligado a ${pedido.nome}, e recebe a tarefa abaixo assim que abrir.`,
    sim: n === 1 ? 'Criar o colega' : `Criar os ${n} colegas`,
    nao: 'Recusar',
  }
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
  const textos = textosDo(pedido)
  return (
    <div className="janela-fundo" onMouseDown={(e) => e.target === e.currentTarget && responder(false)}>
      <div className="janela janela-pedido" role="dialog" aria-label="Pedido de colegas">
        <h2 className="janela-titulo">{textos.titulo}</h2>
        <p className="apagado">{textos.explica}</p>
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
            {textos.sim}
          </button>
          <button className="botao-pequeno" disabled={enviando} autoFocus onClick={() => responder(false)}>
            {textos.nao}
          </button>
        </div>
      </div>
    </div>
  )
}
