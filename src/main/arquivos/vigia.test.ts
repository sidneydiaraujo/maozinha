import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Repo } from '../../shared/model'
import { ATRASO_MS, VigiaArquivos, type Observar } from './vigia'

const repo = (id: string, caminho = `C:\\${id}`): Repo => ({ id, nome: id, caminho, perfilPadraoId: 'principal' })

function montar() {
  const ativos = new Map<string, { mudar(nome: string): void; falhar(): void }>()
  const fechados: string[] = []
  const observar: Observar = (caminho, aoMudar, aoFalhar) => {
    ativos.set(caminho, { mudar: aoMudar, falhar: aoFalhar })
    return {
      fechar: () => {
        fechados.push(caminho)
        ativos.delete(caminho)
      },
    }
  }
  const avisos: Array<[string, string[]]> = []
  const vigia = new VigiaArquivos(observar, (repoId, caminhos) => avisos.push([repoId, caminhos]))
  return { vigia, ativos, fechados, avisos }
}

describe('VigiaArquivos', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('junta os eventos de 75 ms num lote, sem repetidos e sem .git/node_modules', () => {
    const { vigia, ativos, avisos } = montar()
    vigia.sincronizar([repo('a')])
    const a = ativos.get('C:\\a')
    a?.mudar('docs\\x.md')
    a?.mudar('docs\\x.md')
    a?.mudar('.git\\index')
    a?.mudar('node_modules\\p\\i.js')
    a?.mudar('src\\b.ts')
    expect(avisos).toEqual([])
    vi.advanceTimersByTime(ATRASO_MS)
    expect(avisos).toEqual([['a', ['docs/x.md', 'src/b.ts']]])
  })

  it('so mudanca ignorada nao gera aviso', () => {
    const { vigia, ativos, avisos } = montar()
    vigia.sincronizar([repo('a')])
    ativos.get('C:\\a')?.mudar('.git\\HEAD')
    vi.advanceTimersByTime(ATRASO_MS)
    expect(avisos).toEqual([])
  })

  it('sincronizar abre as novas, fecha as que sairam e reabre a que mudou de caminho', () => {
    const { vigia, ativos, fechados } = montar()
    vigia.sincronizar([repo('a'), repo('b')])
    vigia.sincronizar([repo('b', 'C:\\b2'), repo('c')])
    expect(fechados).toEqual(['C:\\a', 'C:\\b'])
    expect([...ativos.keys()].sort()).toEqual(['C:\\b2', 'C:\\c'])
  })

  it('pasta que falha para de ser vigiada e o que estava pendente dela some', () => {
    const { vigia, ativos, avisos } = montar()
    vigia.sincronizar([repo('a')])
    const a = ativos.get('C:\\a')
    a?.mudar('x.md')
    a?.falhar()
    vi.advanceTimersByTime(ATRASO_MS)
    expect(avisos).toEqual([])
    expect(ativos.size).toBe(0)
  })

  it('fecharTodos fecha tudo e descarta o pendente', () => {
    const { vigia, ativos, avisos } = montar()
    vigia.sincronizar([repo('a'), repo('b')])
    ativos.get('C:\\a')?.mudar('x.md')
    vigia.fecharTodos()
    vi.advanceTimersByTime(ATRASO_MS)
    expect(avisos).toEqual([])
    expect(ativos.size).toBe(0)
  })
})
