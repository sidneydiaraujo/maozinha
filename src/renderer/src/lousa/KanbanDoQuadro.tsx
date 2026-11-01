// Ligar e desligar o kanban do agente pelo cabecalho (A24, D58). A escolha fica no quadro; a regra
// vai na linha de comando do Claude, entao o main reabre o agente na mesma conversa quando ele
// parar (como a troca de modelo, D49). Ligado num projeto sem kanban, o KANBAN.md nasce na reabertura.
import { useEffect, useState } from 'react'
import type { Quadro, QuandoAjusta } from '../../../shared/model'
import { mensagemDe } from '../componentes/erro'

const AVISO: Record<QuandoAjusta, string> = {
  agora: 'O agente reabriu na mesma conversa, já com a mudança.',
  quandoParar: 'Vale quando o agente parar: ele reabre na mesma conversa.',
  naAbertura: 'Vale na próxima abertura do agente.',
}

/** Quadro de antes da A22 (sem escolha): segue o kanban que o projeto ja tiver. */
function useLigado(quadro: Quadro): boolean {
  const [doProjeto, setDoProjeto] = useState(false)
  useEffect(() => {
    if (quadro.kanban !== undefined) return
    let valendo = true
    window.lousa.repos
      .temKanban(quadro.repoId)
      .then((sim) => valendo && setDoProjeto(sim))
      .catch(() => undefined)
    return () => {
      valendo = false
    }
  }, [quadro.kanban, quadro.repoId])
  return quadro.kanban ?? doProjeto
}

export function KanbanDoQuadro(p: {
  quadro: Quadro
  aoLigar(quadroId: string, ligado: boolean): Promise<QuandoAjusta>
}): React.JSX.Element {
  const ligado = useLigado(p.quadro)
  const [aviso, setAviso] = useState<string | null>(null)
  const [ocupado, setOcupado] = useState(false)

  const alternar = (): void => {
    if (ocupado) return
    setOcupado(true)
    p.aoLigar(p.quadro.id, !ligado)
      .then((quando) => setAviso(AVISO[quando]))
      .catch((e: unknown) => setAviso(mensagemDe(e)))
      .finally(() => setOcupado(false))
  }

  const dica = ligado
    ? 'Kanban ligado: este agente atualiza o KANBAN.md do projeto. Clique para desligar.'
    : 'Kanban desligado. Clique para ligar: o agente passa a atualizar o KANBAN.md do projeto (um só por projeto).'
  return (
    <button
      className={`quadro-kanban nodrag${ligado ? ' quadro-kanban-ligado' : ''}`}
      aria-pressed={ligado}
      disabled={ocupado}
      title={[dica, aviso].filter(Boolean).join('\n')}
      onClick={alternar}
    >
      ▦ kanban
    </button>
  )
}
