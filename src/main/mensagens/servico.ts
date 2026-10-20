// Mensagens prontas (T25.1, D33): frases que o Sidney manda sempre ("rode os testes", "faça
// commit"). Ficam num arquivo proprio, fora do estado.json, com gravacao atomica.
import { z } from 'zod'

export const MAXIMO_MENSAGENS = 30
export const MAXIMO_LETRAS = 2000

export const PADRAO = [
  'Rode os testes e me diga em uma frase o resultado.',
  'Faça commit do que está pronto, com uma mensagem clara.',
  'Resuma em 3 linhas o que você fez até agora e o que falta.',
]

const Lista = z.array(z.string().min(1).max(MAXIMO_LETRAS)).max(MAXIMO_MENSAGENS)

export interface DiscoMensagens {
  /** Conteudo do arquivo, ou null se ele nao existe. */
  ler(): string | null
  /** Grava inteiro (atomico: temporario + renomear). */
  gravar(texto: string): void
}

/** Tira espacos das pontas, vazias e repetidas; corta no maximo. */
export function limparMensagens(lista: string[]): string[] {
  const vistas = new Set<string>()
  const limpas: string[] = []
  for (const bruta of lista) {
    const m = bruta.trim().slice(0, MAXIMO_LETRAS)
    if (m === '' || vistas.has(m)) continue
    vistas.add(m)
    limpas.push(m)
  }
  return limpas.slice(0, MAXIMO_MENSAGENS)
}

export class ServicoMensagens {
  constructor(private readonly disco: DiscoMensagens) {}

  /** Sem arquivo: as tres padrao. Arquivo estragado: tambem as padrao (sem apagar o arquivo). */
  listar(): string[] {
    const texto = this.disco.ler()
    if (texto === null) return [...PADRAO]
    try {
      const lido = Lista.safeParse(JSON.parse(texto))
      return lido.success ? lido.data : [...PADRAO]
    } catch {
      return [...PADRAO]
    }
  }

  /** Grava a lista inteira (a tela manda a lista ja editada) e devolve como ficou. */
  salvar(lista: string[]): string[] {
    const limpas = limparMensagens(lista)
    this.disco.gravar(JSON.stringify(limpas, null, 2))
    return limpas
  }
}
