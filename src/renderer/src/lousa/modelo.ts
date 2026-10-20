// Seletores de modelo e esforco no cabecalho do agente (T19.2, D25). Puro: o que o rotulo diz.
import { MODELOS, type Esforco, type Modelo, type PainelAgente } from '../../../shared/model'

export const NOME_MODELO: Record<Modelo, string> = { fable: 'Fable', opus: 'Opus', sonnet: 'Sonnet', haiku: 'Haiku' }

export const NOME_ESFORCO: Record<Esforco, string> = {
  low: 'baixo',
  medium: 'médio',
  high: 'alto',
  xhigh: 'muito alto',
  max: 'máximo',
}

/** Depois de pedir, quanto esperar o painel novo antes de dizer que o nivel nao pegou. */
export const ESPERA_CONFIRMAR_MS = 4000

/** "claude-opus-5-5" -> 'opus'. null se nao for de uma familia conhecida. */
export function familiaDoModelo(id: string): Modelo | null {
  const minusculo = id.toLowerCase()
  return MODELOS.find((m) => minusculo.includes(m)) ?? null
}

/** "Opus 5.5 (1M context)" -> "Opus 5.5": o cabecalho e estreito. */
export const nomeCurto = (nome: string): string => nome.replace(/\s*\(.*\)\s*$/, '').trim()

export interface Rotulo {
  texto: string
  /** true = o que o painel do agente diz valer agora; false = so o guardado no quadro (cinza). */
  valendo: boolean
}

interface Guardado {
  modelo?: Modelo
  esforco?: Esforco
}

export function rotuloDoModelo(guardado: Guardado, painel: PainelAgente | undefined): Rotulo {
  if (painel?.modelo) return { texto: nomeCurto(painel.modelo.nome), valendo: true }
  return { texto: guardado.modelo ? NOME_MODELO[guardado.modelo] : 'modelo', valendo: false }
}

export function rotuloDoEsforco(guardado: Guardado, painel: PainelAgente | undefined): Rotulo {
  if (painel?.esforco) return { texto: NOME_ESFORCO[painel.esforco], valendo: true }
  return { texto: guardado.esforco ? NOME_ESFORCO[guardado.esforco] : 'esforço', valendo: false }
}

/**
 * O nivel pedido nao pegou: um painel chegou bem depois do pedido e continua com outro nivel
 * (o modelo nao aceita esse nivel). `pedido.quando` em ms.
 */
export function esforcoRecusado(pedido: { esforco: Esforco; quando: number } | null, painel: PainelAgente | undefined): boolean {
  if (!pedido || !painel?.esforco) return false
  return painel.quando >= pedido.quando + ESPERA_CONFIRMAR_MS && painel.esforco !== pedido.esforco
}
