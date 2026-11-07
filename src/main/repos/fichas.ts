// R2.11: a tela so manda ids (CLAUDE.md). A pasta nova vem do seletor do Windows, que roda no main:
// ele guarda o caminho e entrega a tela uma ficha de uso unico; "adicionar" troca a ficha pelo
// caminho. Antes a tela mandava o caminho, e qualquer pasta do PC podia virar repo sem o seletor.

/** Poucas fichas vivas: o usuario escolhe uma pasta por vez. */
const MAXIMO = 20

export class FichasDePasta {
  private readonly caminhos = new Map<string, string>()

  constructor(private readonly novoId: () => string) {}

  emitir(caminho: string): string {
    const ficha = this.novoId()
    this.caminhos.set(ficha, caminho)
    // a mais antiga sai primeiro (o Map guarda a ordem de entrada)
    for (const antiga of this.caminhos.keys()) {
      if (this.caminhos.size <= MAXIMO) break
      this.caminhos.delete(antiga)
    }
    return ficha
  }

  /** O caminho da ficha, uma vez so; ficha desconhecida ou ja usada lanca. */
  usar(ficha: string): string {
    const caminho = this.caminhos.get(ficha)
    if (caminho === undefined) throw new Error('Escolha a pasta de novo')
    this.caminhos.delete(ficha)
    return caminho
  }
}
