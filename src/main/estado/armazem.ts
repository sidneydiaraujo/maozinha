// Guarda o estado da Lousa em um JSON pequeno, com gravacao atomica (T1.5, D5).
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'node:fs'
import { basename, dirname, join } from 'node:path'
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
    apagarCopiasVelhas(arquivo)
  } catch {
    log('warn', `Estado salvo invalido (${motivo}) e nao foi possivel guarda-lo`)
  }
  return padrao()
}

/** R3.14: copias guardadas ao lado do estado (.antes-, .corrompido-) que ficam; as mais velhas saem. */
export const COPIAS_GUARDADAS = 5

/** As copias de `base` (estado.json.antes-<ms>, .corrompido-<ms>) alem das `manter` mais novas. */
export function copiasVelhas(nomes: string[], base: string, manter = COPIAS_GUARDADAS): string[] {
  const quando = (nome: string): number => Number(/-(\d+)$/.exec(nome)?.[1] ?? 0)
  const copia = new RegExp(`^${base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\.(antes|corrompido)-\\d+$`)
  return nomes
    .filter((n) => copia.test(n))
    .sort((a, b) => quando(b) - quando(a))
    .slice(manter)
}

function apagarCopiasVelhas(arquivo: string): void {
  const pasta = dirname(arquivo)
  try {
    for (const nome of copiasVelhas(readdirSync(pasta), basename(arquivo))) unlinkSync(join(pasta, nome))
  } catch {
    // copia presa em outro programa: fica para a proxima vez
  }
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
  apagarCopiasVelhas(arquivo)
}

export function criarArmazem(arquivo: string): Armazem {
  // o carregar roda a cada operacao: o mesmo arquivo com item ruim e copiado uma vez so (R3.14)
  let jaCopiado = ''
  return {
    carregar() {
      if (!existsSync(arquivo)) return padrao()
      let texto: string
      let bruto: unknown
      try {
        texto = readFileSync(arquivo, 'utf8')
        bruto = JSON.parse(texto)
      } catch {
        return isolarCorrompido(arquivo, 'JSON quebrado')
      }
      const lido = lerTolerante(migrar(bruto))
      if (!lido) return isolarCorrompido(arquivo, 'formato ou versao inesperados')
      if (lido.descartados.length > 0 && texto !== jaCopiado) {
        jaCopiado = texto
        guardarAntesDeDescartar(arquivo, lido.descartados)
      }
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
