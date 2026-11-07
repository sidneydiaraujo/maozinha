// Guarda o estado da Lousa em um JSON pequeno, com gravacao atomica (T1.5, D5).
import { copyFileSync, existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import type { EstadoSalvo } from '../../shared/model'
import { log } from '../log'
import { lerTolerante, SchemaEstado } from './esquema'
import { migrar } from './migrar'

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

/** R1.2: alguns itens sairam; o arquivo como estava fica copiado ao lado e o registro diz quais. */
function guardarAntesDeDescartar(arquivo: string, descartados: string[]): void {
  const destino = `${arquivo}.antes-${Date.now()}`
  try {
    copyFileSync(arquivo, destino)
    log('warn', `Estado salvo com itens fora do formato (${descartados.join(', ')}); o resto abriu. Copia em ${destino}`)
  } catch {
    log('warn', `Estado salvo com itens fora do formato (${descartados.join(', ')}); a copia nao foi possivel`)
  }
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
      const lido = lerTolerante(migrar(bruto))
      if (!lido) return isolarCorrompido(arquivo, 'formato ou versao inesperados')
      if (lido.descartados.length > 0) guardarAntesDeDescartar(arquivo, lido.descartados)
      return lido.estado
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
