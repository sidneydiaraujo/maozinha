// Mesma mensagem para varios quadros (T13.1, D21). Como o texto vira teclas: shared/digitar.ts (R4.22).

/** "Enviar para 3 quadros" / "Enviado para 1 quadro". */
export function quadrosPorExtenso(n: number): string {
  return n === 1 ? '1 quadro' : `${n} quadros`
}
