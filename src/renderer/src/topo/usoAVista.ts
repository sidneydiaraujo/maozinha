// Mostrar o uso das contas Claude a vista na barra de cima (A4, aceite 0.2.0): "como ver a hora
// num relogio de parede", sem clicar. Escolha deste PC (localStorage; se falhar, fica a vista).
import { useSyncExternalStore } from 'react'

const CHAVE = 'lousa.usoAVista'
const ouvintes = new Set<() => void>()

/** Padrao: a vista. So "nao" guardado esconde (volta as barrinhas sob o icone). */
export function lerUsoAVista(): boolean {
  try {
    return localStorage.getItem(CHAVE) !== 'nao'
  } catch {
    return true
  }
}

export function guardarUsoAVista(aVista: boolean): void {
  try {
    localStorage.setItem(CHAVE, aVista ? 'sim' : 'nao')
  } catch {
    // sem localStorage: vale so ate fechar
  }
  for (const ouvinte of ouvintes) ouvinte()
}

function inscrever(ouvinte: () => void): () => void {
  ouvintes.add(ouvinte)
  return () => ouvintes.delete(ouvinte)
}

export function useUsoAVista(): boolean {
  return useSyncExternalStore(inscrever, lerUsoAVista)
}
