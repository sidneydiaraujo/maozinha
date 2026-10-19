// Ultima parte da saida de um terminal, para a tela remontada mostrar a sessao (T2.1, T8.4).
// Guarda em pedacos e so junta de vez em quando: juntar a cada pedaco copiava o historico
// inteiro (1 MB) a cada eco de tecla, e o main atrasava a digitacao.

export class Historico {
  private pedacos: string[] = []
  private tamanho = 0

  constructor(private readonly limite: number) {}

  anotar(dados: string): void {
    this.pedacos.push(dados)
    this.tamanho += dados.length
    // junta so quando passa do dobro: no maximo 2 caracteres copiados por caractere que chega
    if (this.tamanho > this.limite * 2) this.juntar()
  }

  /** Os ultimos `limite` caracteres. */
  texto(): string {
    this.juntar()
    return this.pedacos[0] ?? ''
  }

  private juntar(): void {
    const texto = this.pedacos.join('').slice(-this.limite)
    this.pedacos = texto === '' ? [] : [texto]
    this.tamanho = texto.length
  }
}
