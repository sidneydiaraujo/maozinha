// Notas na lousa (T26.2, D34): viram nos do React Flow ao lado dos quadros. Puro.
import type { Node } from '@xyflow/react'
import type { EstadoTela, Nota } from '../../../shared/model'
import type { QuadroNo } from './nos'

export interface AcoesNota {
  salvar(notaId: string, texto: string): void
  remover(notaId: string): void
}

export type NotaNo = Node<{ nota: Nota; acoes: AcoesNota }, 'nota'>

/** Todo no da lousa: quadro (terminal ou agente) ou nota. */
export type NoLousa = QuadroNo | NotaNo

/** Tamanho de uma nota nova (igual ao do main): "+ Nota" centraliza na vista. */
export const METADE_NOTA = { x: 190, y: 140 }

export function montarNotas(estado: EstadoTela, acoes: AcoesNota): NotaNo[] {
  return (estado.notas ?? []).map((nota) => ({
    id: nota.id,
    type: 'nota',
    position: { x: nota.caixa.x, y: nota.caixa.y },
    style: { width: nota.caixa.largura, height: nota.caixa.altura },
    dragHandle: '.cabecalho-nota',
    data: { nota, acoes },
  }))
}

/** O estado com o texto novo de uma nota (a tela guarda o que foi salvo no main). */
export function comTextoDaNota(estado: EstadoTela, notaId: string, texto: string): EstadoTela {
  return { ...estado, notas: (estado.notas ?? []).map((n) => (n.id === notaId ? { ...n, texto } : n)) }
}
