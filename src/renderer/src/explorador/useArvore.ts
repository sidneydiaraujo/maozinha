// Estado da arvore (T7.3): quais pastas estao abertas e o que ja foi lido do disco.
// Como o VSCode, uma pasta so e lida quando abre; quando algo muda dentro de uma pasta
// aberta (o main vigia so essas, D17), ela e relida.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ItemArquivo, Repo } from '../../../shared/model'
import { mensagemDe } from '../componentes/erro'
import { chavePasta, linhasVisiveis, pastaDe, type Filhos, type Linha } from './arvore'

const GUARDA = 'lousa.explorador'
const RELER_MS = 150

interface Guardado {
  abertas: string[]
  vistos: string[] // repos que ja apareceram: repo novo nasce aberto, fechado pelo usuario continua fechado
}

function lerGuardado(): Guardado {
  try {
    const bruto = JSON.parse(localStorage.getItem(GUARDA) ?? '{}') as Partial<Guardado>
    return { abertas: bruto.abertas ?? [], vistos: bruto.vistos ?? [] }
  } catch {
    return { abertas: [], vistos: [] }
  }
}

function guardar(g: Guardado): void {
  try {
    localStorage.setItem(GUARDA, JSON.stringify(g))
  } catch {
    // sem localStorage a arvore so nao lembra o que estava aberto
  }
}

export function useArvore(repos: Repo[]) {
  const [filhos, setFilhos] = useState<Map<string, ItemArquivo[] | 'carregando' | { erro: string }>>(new Map())
  const [guardado, setGuardado] = useState(lerGuardado)
  const abertas = useMemo(() => new Set(guardado.abertas), [guardado.abertas])
  const pendentes = useRef(new Set<string>())
  const relogio = useRef<number | null>(null)
  const lidas = useRef(filhos)
  useEffect(() => {
    lidas.current = filhos
  }, [filhos])

  const mudarGuardado = useCallback((f: (g: Guardado) => Guardado) => {
    setGuardado((g) => {
      const novo = f(g)
      guardar(novo)
      return novo
    })
  }, [])

  const ler = useCallback((repoId: string, relativo: string) => {
    const k = chavePasta(repoId, relativo)
    setFilhos((m) => (m.has(k) ? m : new Map(m).set(k, 'carregando')))
    window.lousa.arquivos
      .listar(repoId, relativo)
      .then((itens) => setFilhos((m) => new Map(m).set(k, itens)))
      .catch((e: unknown) => setFilhos((m) => new Map(m).set(k, { erro: mensagemDe(e) })))
  }, [])

  // repo que nunca apareceu nasce aberto
  useEffect(() => {
    const novos = repos.filter((r) => !guardado.vistos.includes(r.id))
    if (novos.length === 0) return
    mudarGuardado((g) => ({
      abertas: [...g.abertas, ...novos.map((r) => chavePasta(r.id, ''))],
      vistos: [...g.vistos, ...novos.map((r) => r.id)],
    }))
  }, [repos, guardado.vistos, mudarGuardado])

  // toda pasta aberta de um repo que existe e ainda nao foi lida
  useEffect(() => {
    for (const repo of repos) {
      for (const k of abertas) {
        if (k.startsWith(`${repo.id}|`) && !filhos.has(k)) ler(repo.id, k.slice(repo.id.length + 1))
      }
    }
  }, [repos, abertas, filhos, ler])

  const alternar = useCallback(
    (repoId: string, relativo: string) => {
      const k = chavePasta(repoId, relativo)
      mudarGuardado((g) => ({
        ...g,
        abertas: g.abertas.includes(k) ? g.abertas.filter((a) => a !== k) : [...g.abertas, k],
      }))
    },
    [mudarGuardado],
  )

  // so abre (D65: a pasta do projeto que o agente achou); aberta, fica como esta
  const abrir = useCallback(
    (repoId: string, relativo: string) =>
      mudarGuardado((g) => (g.abertas.includes(chavePasta(repoId, relativo)) ? g : { ...g, abertas: [...g.abertas, chavePasta(repoId, relativo)] })),
    [mudarGuardado],
  )
  const recolherTudo = useCallback(() => mudarGuardado((g) => ({ ...g, abertas: [] })), [mudarGuardado])

  /** Junta por 150 ms e rele a pasta (ja lida) de cada coisa que mudou. */
  const aoMudarArquivos = useCallback(
    (repoId: string, caminhos: string[]) => {
      for (const c of caminhos) pendentes.current.add(chavePasta(repoId, pastaDe(c)))
      relogio.current ??= window.setTimeout(() => {
        relogio.current = null
        const lote = [...pendentes.current]
        pendentes.current.clear()
        for (const k of lote) {
          const i = k.indexOf('|')
          if (lidas.current.has(k)) ler(k.slice(0, i), k.slice(i + 1))
        }
      }, RELER_MS)
    },
    [ler],
  )

  useEffect(
    () => () => {
      if (relogio.current !== null) window.clearTimeout(relogio.current)
    },
    [],
  )

  const linhas: Linha[] = useMemo(() => linhasVisiveis(repos, filhos as Filhos, abertas), [repos, filhos, abertas])
  return { linhas, alternar, abrir, recolherTudo, aoMudarArquivos }
}
