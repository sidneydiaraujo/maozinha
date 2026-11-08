// Ligacao feita depois, as claras (R4.20). O terminal avisa o estado do agente antes de existirem os
// servicos de agentes e do time que o recebem; antes, a fiacao usava variaveis declaradas mais abaixo
// (funcionava so porque ninguem chamava cedo). Agora a volta e uma tomada: criada vazia, ligada uma vez
// no fim da montagem, com erro claro se alguem a usar antes.
export class Tomada<T extends object> {
  private alvo: T | null = null

  constructor(private readonly nome: string) {}

  ligar(alvo: T): void {
    if (this.alvo) throw new Error(`${this.nome} já está ligada`)
    this.alvo = alvo
  }

  get ligada(): boolean {
    return this.alvo !== null
  }

  usar(): T {
    if (!this.alvo) throw new Error(`${this.nome} usada antes de ser ligada`)
    return this.alvo
  }
}
