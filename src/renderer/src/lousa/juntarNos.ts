// Nos novos da lousa contra os que estao na tela (R4.23). Puro.
//
// Antes, cada mudanca no estado (um quadro renomeado, uma linha do time) refazia o `data` de TODOS
// os quadros e o React Flow redesenhava todos (pesa com 20+). Agora o quadro sem mudanca fica com o
// mesmo objeto na tela e o React Flow pula ele. Posicao e tamanho que o usuario acabou de ajustar
// continuam valendo quando o estado e recarregado.
import type { Node } from '@xyflow/react'

/** Igual para a tela: campo a campo pelo mesmo objeto; lista (as contas do quadro), item a item. */
export function mesmoDado(a: Record<string, unknown>, b: Record<string, unknown>): boolean {
  const chaves = Object.keys(a)
  if (chaves.length !== Object.keys(b).length) return false
  return chaves.every((k) => {
    const x = a[k]
    const y = b[k]
    if (x === y) return true
    return Array.isArray(x) && Array.isArray(y) && x.length === y.length && x.every((v, i) => v === y[i])
  })
}

export function juntarComAtuais<N extends Node>(novos: N[], atuais: Node[]): N[] {
  const porId = new Map(atuais.map((a) => [a.id, a]))
  return novos.map((no) => {
    const antigo = porId.get(no.id) as N | undefined
    if (!antigo) return no
    const igual = antigo.type === no.type && mesmoDado(antigo.data, no.data)
    // selecionado: o no novo sai sem selecao, como sempre foi ao recarregar
    if (igual && !antigo.selected) return antigo
    return {
      ...no,
      data: igual ? antigo.data : no.data,
      position: antigo.position,
      width: antigo.width,
      height: antigo.height,
      style: antigo.style,
    }
  })
}
