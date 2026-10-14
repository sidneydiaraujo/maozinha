// Acha as contas de Claude Code e Codex que ja existem no PC (T1.2).
// Regra pura: tudo que toca o disco entra por DepsDeteccao.
import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import type { EstadoSalvo, Perfil, Provedor } from '../../shared/model'

export interface DepsDeteccao {
  home: string // USERPROFILE
  listarPastas(caminho: string): string[] // nomes das subpastas diretas
  existe(caminho: string): boolean // arquivo ou pasta existe
}

export const PALETA = ['#3b82f6', '#22c55e', '#f59e0b', '#a855f7', '#ef4444'] as const

interface Familia {
  provedor: Provedor
  padrao: RegExp
  marcadores: string[]
  idPadrao: string
  nomePadrao: string
  id(sufixo: string): string
  nome(sufixo: string): string
}

const maiuscula = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1)

const FAMILIAS: Familia[] = [
  {
    provedor: 'claude',
    padrao: /^\.claude(-[a-z0-9][a-z0-9-]*)?$/i,
    marcadores: ['settings.json', '.credentials.json', 'projects'],
    idPadrao: 'principal',
    nomePadrao: 'Principal',
    id: (s) => s,
    nome: maiuscula,
  },
  {
    provedor: 'codex',
    padrao: /^\.codex(-[a-z0-9][a-z0-9-]*)?$/i,
    marcadores: ['auth.json', 'config.toml', 'sessions'],
    idPadrao: 'cx:padrao',
    nomePadrao: 'Codex',
    id: (s) => `cx:${s}`,
    nome: (s) => `Codex ${maiuscula(s)}`,
  },
]

type Ajustes = EstadoSalvo['perfis']

function perfisDaFamilia(deps: DepsDeteccao, ajustes: Ajustes, familia: Familia): Omit<Perfil, 'cor'>[] {
  const achados: Omit<Perfil, 'cor'>[] = []
  for (const pasta of deps.listarPastas(deps.home)) {
    const m = familia.padrao.exec(pasta)
    if (!m) continue
    const sufixo = m[1] ? m[1].slice(1).toLowerCase() : null
    const id = sufixo === null ? familia.idPadrao : familia.id(sufixo)
    const configDir = join(deps.home, pasta)
    const temMarcador = familia.marcadores.some((nome) => deps.existe(join(configDir, nome)))
    if (!temMarcador && ajustes[id]?.criada !== true) continue
    const raiz = sufixo === null ? null : join(deps.home, sufixo)
    achados.push({
      id,
      provedor: familia.provedor,
      nome: sufixo === null ? familia.nomePadrao : familia.nome(sufixo),
      configDir,
      ehPadrao: sufixo === null,
      raizes: raiz !== null && deps.existe(raiz) ? [raiz] : [],
    })
  }
  // padrao primeiro, depois os outros em ordem alfabetica do id
  return achados.sort((a, b) => {
    if (a.ehPadrao !== b.ehPadrao) return a.ehPadrao ? -1 : 1
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0
  })
}

export function detectarPerfis(deps: DepsDeteccao, ajustes: Ajustes): Perfil[] {
  const todos = FAMILIAS.flatMap((familia) => perfisDaFamilia(deps, ajustes, familia))
  return todos.map((p, posicao) => {
    const ajuste = ajustes[p.id]
    return {
      ...p,
      nome: ajuste?.nome ?? p.nome,
      cor: ajuste?.cor ?? PALETA[posicao % PALETA.length] ?? PALETA[0],
      raizes: ajuste?.raizes ?? p.raizes,
    }
  })
}

export function depsReais(home: string): DepsDeteccao {
  return {
    home,
    listarPastas: (caminho) => {
      try {
        return readdirSync(caminho, { withFileTypes: true })
          .filter((e) => e.isDirectory())
          .map((e) => e.name)
      } catch {
        return []
      }
    },
    existe: (caminho) => existsSync(caminho),
  }
}
