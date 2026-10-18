// Clique num arquivo da lateral (T7.4): documento vai para o programa do Windows,
// texto abre no leitor. O main decide (lista permitida), a tela so mostra o resultado.
import { useCallback, useEffect, useState } from 'react'
import type { ConteudoArquivo } from '../../../shared/model'
import { mensagemDe } from '../componentes/erro'

export interface ArquivoAberto {
  repoId: string
  relativo: string
  conteudo: ConteudoArquivo
}

const AVISO_MS = 4_000

export function useArquivoAberto() {
  const [aberto, setAberto] = useState<ArquivoAberto | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)

  useEffect(() => {
    if (!aviso) return
    const id = window.setTimeout(() => setAviso(null), AVISO_MS)
    return () => window.clearTimeout(id)
  }, [aviso])

  const abrir = useCallback(async (repoId: string, relativo: string) => {
    const nome = relativo.slice(relativo.lastIndexOf('/') + 1)
    try {
      const r = await window.lousa.arquivos.abrir(repoId, relativo)
      if (r.onde === 'leitor') setAberto({ repoId, relativo, conteudo: r.conteudo })
      else setAviso(`${nome} abriu no programa do Windows.`)
    } catch (e) {
      setAviso(`Não deu para abrir ${nome}: ${mensagemDe(e)}`)
    }
  }, [])

  const fechar = useCallback(() => setAberto(null), [])
  return { aberto, aviso, abrir, fechar, avisar: setAviso }
}
