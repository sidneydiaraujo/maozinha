// Compactar sozinho (A17): a escolha mora na tela (localStorage, como o resto do anel), mas quem
// age e o main. Conta na abertura e a cada mudanca na engrenagem.
import { useEffect } from 'react'
import { mensagemDe } from '../componentes/erro'
import { aoMudarPrefContexto, lerPrefContexto, prefCompactarDe, type PrefContexto } from './contexto'

export function useContarCompactar(aoErro: (texto: string) => void): void {
  useEffect(() => {
    const contar = (p: PrefContexto): void =>
      void window.lousa.agentes.prefCompactar(prefCompactarDe(p)).catch((e: unknown) => aoErro(mensagemDe(e)))
    contar(lerPrefContexto())
    return aoMudarPrefContexto(contar)
  }, [aoErro])
}
