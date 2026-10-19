// Ctrl+F dentro do terminal (T12.2): onde o texto aparece no historico. Funcoes puras.

export interface Ocorrencia {
  linha: number // linha do historico do xterm (0 = a mais antiga)
  coluna: number
}

/** Todas as ocorrencias, da mais antiga para a mais nova, sem diferenciar maiuscula. */
export function acharOcorrencias(linhas: string[], consulta: string): Ocorrencia[] {
  const c = consulta.toLowerCase()
  if (c === '') return []
  const achadas: Ocorrencia[] = []
  linhas.forEach((texto, linha) => {
    const t = texto.toLowerCase()
    for (let coluna = t.indexOf(c); coluna !== -1; coluna = t.indexOf(c, coluna + c.length)) {
      achadas.push({ linha, coluna })
    }
  })
  return achadas
}

/** Proxima (Enter) ou anterior (Shift+Enter), dando a volta nas pontas. */
export function vizinha(total: number, atual: number, passo: 1 | -1): number {
  if (total === 0) return -1
  return (atual + passo + total) % total
}
