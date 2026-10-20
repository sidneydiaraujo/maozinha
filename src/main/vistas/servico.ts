// Vistas salvas (T27.1, D35): guardar a arrumacao da lousa com um nome e voltar a ela depois.
import type { EstadoSalvo, VistaSalva } from '../../shared/model'
import type { Armazem } from '../estado/armazem'
import type { Layout } from '../lousa/layout'

export const MAXIMO_VISTAS = 20
export const MAXIMO_NOME = 60

export interface DepsServicoVistas {
  armazem: Armazem
  novoId(): string
}

/** So guarda caixa de quadro ou nota que existe agora: a tela nao inventa ids. */
function caixasQueExistem(estado: EstadoSalvo, layout: Layout): VistaSalva['caixas'] {
  const ids = new Set([...estado.quadros, ...(estado.notas ?? [])].map((q) => q.id))
  return Object.fromEntries(layout.quadros.filter((q) => ids.has(q.id)).map((q) => [q.id, q.caixa]))
}

export class ServicoVistas {
  constructor(private readonly deps: DepsServicoVistas) {}

  /**
   * Guarda (ou substitui, pelo mesmo nome sem diferenciar maiuscula) e devolve a lista nova.
   * Lanca com nome vazio ou com 20 vistas ja guardadas e um nome novo.
   */
  salvar(nomeBruto: string, layout: Layout): VistaSalva[] {
    const nome = nomeBruto.trim().slice(0, MAXIMO_NOME)
    if (nome === '') throw new Error('Dê um nome à vista')
    const estado = this.deps.armazem.carregar()
    const vistas = estado.vistas ?? []
    const igual = vistas.find((v) => v.nome.toLowerCase() === nome.toLowerCase())
    if (!igual && vistas.length >= MAXIMO_VISTAS) throw new Error(`Já há ${MAXIMO_VISTAS} vistas: apague uma antes`)
    const vista: VistaSalva = {
      id: igual?.id ?? this.deps.novoId(),
      nome,
      viewport: layout.viewport,
      caixas: caixasQueExistem(estado, layout),
    }
    const novas = igual ? vistas.map((v) => (v.id === igual.id ? vista : v)) : [...vistas, vista]
    this.deps.armazem.salvar({ ...estado, vistas: novas })
    return novas
  }

  /** Apagar uma vista que ja nao existe nao e erro. */
  remover(vistaId: string): VistaSalva[] {
    const estado = this.deps.armazem.carregar()
    const novas = (estado.vistas ?? []).filter((v) => v.id !== vistaId)
    this.deps.armazem.salvar({ ...estado, vistas: novas })
    return novas
  }
}
