// Links de arquivo que existem (R1.6): o terminal so sublinha o caminho que o main achou na pasta
// do quadro. A resposta fica guardada um pouco: o xterm pergunta de novo a cada passada do mouse.

export const VALIDADE_MS = 10_000
const MAXIMO = 500

type Resolver = (repoId: string, relativo: string) => Promise<string | null>

/** Pergunta ao main e guarda a resposta por `VALIDADE_MS` (o arquivo pode nascer depois). */
export function criarResolverComMemoria(resolver: Resolver, agora: () => number = Date.now): Resolver {
  const memoria = new Map<string, { ate: number; valor: Promise<string | null> }>()
  return (repoId, relativo) => {
    const chave = `${repoId}\n${relativo}`
    const guardado = memoria.get(chave)
    if (guardado && guardado.ate > agora()) return guardado.valor
    if (memoria.size >= MAXIMO) memoria.clear()
    const valor = resolver(repoId, relativo).catch(() => null)
    memoria.set(chave, { ate: agora() + VALIDADE_MS, valor })
    return valor
  }
}

/** Um so para a tela inteira: quadros da mesma pasta aproveitam a mesma resposta. */
export const resolverArquivo: Resolver = criarResolverComMemoria((repoId, relativo) =>
  window.lousa.arquivos.resolver(repoId, relativo),
)
