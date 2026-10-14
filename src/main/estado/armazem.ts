// Guarda o estado da Lousa em um JSON pequeno, com gravacao atomica (T1.5, D5).
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { z } from 'zod'
import type { EstadoSalvo } from '../../shared/model'
import { log } from '../log'
import { migrar } from './migrar'

const Caixa = z.object({ x: z.number(), y: z.number(), largura: z.number(), altura: z.number() })

const SchemaEstado = z.object({
  versao: z.literal(2),
  perfis: z.record(
    z.string(),
    z.object({
      nome: z.string().optional(),
      cor: z.string().optional(),
      raizes: z.array(z.string()).optional(),
      provedor: z.enum(['claude', 'codex']).optional(),
      criada: z.boolean().optional(),
    }),
  ),
  repos: z.array(
    z.object({
      id: z.string(),
      nome: z.string(),
      caminho: z.string(),
      perfilPadraoId: z.string(),
    }),
  ),
  quadros: z.array(
    z.object({
      id: z.string(),
      repoId: z.string(),
      perfilId: z.string(),
      tipo: z.enum(['terminal', 'agente']),
      titulo: z.string(),
      caixa: Caixa,
    }),
  ),
  viewport: z.object({ x: z.number(), y: z.number(), zoom: z.number() }),
  ultimoPerfilId: z.string().nullable(),
})

export const ESTADO_PADRAO: EstadoSalvo = {
  versao: 2,
  perfis: {},
  repos: [],
  quadros: [],
  viewport: { x: 0, y: 0, zoom: 1 },
  ultimoPerfilId: null,
}

export interface Armazem {
  carregar(): EstadoSalvo
  salvar(estado: EstadoSalvo): void
}

function padrao(): EstadoSalvo {
  return structuredClone(ESTADO_PADRAO)
}

/** Guarda o arquivo estragado ao lado, para nao perder nada, e segue do padrao. */
function isolarCorrompido(arquivo: string, motivo: string): EstadoSalvo {
  const destino = `${arquivo}.corrompido-${Date.now()}`
  try {
    renameSync(arquivo, destino)
    log('warn', `Estado salvo invalido (${motivo}); guardado em ${destino}`)
  } catch {
    log('warn', `Estado salvo invalido (${motivo}) e nao foi possivel guarda-lo`)
  }
  return padrao()
}

export function criarArmazem(arquivo: string): Armazem {
  return {
    carregar() {
      if (!existsSync(arquivo)) return padrao()
      let bruto: unknown
      try {
        bruto = JSON.parse(readFileSync(arquivo, 'utf8'))
      } catch {
        return isolarCorrompido(arquivo, 'JSON quebrado')
      }
      const lido = SchemaEstado.safeParse(migrar(bruto))
      if (!lido.success) return isolarCorrompido(arquivo, 'formato ou versao inesperados')
      return lido.data
    },
    salvar(estado) {
      const valido = SchemaEstado.parse(estado)
      mkdirSync(dirname(arquivo), { recursive: true })
      const temporario = `${arquivo}.tmp`
      writeFileSync(temporario, JSON.stringify(valido, null, 2), 'utf8')
      renameSync(temporario, arquivo)
    },
  }
}
