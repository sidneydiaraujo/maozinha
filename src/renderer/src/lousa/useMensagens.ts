import { useCallback, useEffect, useState } from 'react'
import { mensagemDe } from '../componentes/erro'
import { pedirAviso } from './foco'

// Uma lista so para a barra e o Ctrl+K: quem salva avisa os outros.
const ouvintes = new Set<(lista: string[]) => void>()

/** Mensagens prontas (T25.2, D33): a lista do main e o jeito de guardar e apagar. */
export function useMensagens(): {
  mensagens: string[]
  guardar(texto: string): void
  apagar(texto: string): void
} {
  const [mensagens, setMensagens] = useState<string[]>([])

  useEffect(() => {
    let ativo = true
    window.lousa.mensagens
      .listar()
      .then((l) => ativo && setMensagens(l))
      .catch(() => undefined)
    ouvintes.add(setMensagens)
    return () => {
      ativo = false
      ouvintes.delete(setMensagens)
    }
  }, [])

  const salvar = useCallback((lista: string[]) => {
    window.lousa.mensagens
      .salvar(lista)
      .then((limpa) => ouvintes.forEach((o) => o(limpa)))
      .catch((e: unknown) => pedirAviso(`Não guardei a mensagem: ${mensagemDe(e)}`))
  }, [])

  return {
    mensagens,
    guardar: (texto) => salvar([texto, ...mensagens.filter((m) => m !== texto.trim())]),
    apagar: (texto) => salvar(mensagens.filter((m) => m !== texto)),
  }
}
