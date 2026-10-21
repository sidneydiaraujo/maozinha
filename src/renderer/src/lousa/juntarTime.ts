// O que a janela "Juntar o time" diz depois de juntar (T31.1).
import type { ResultadoJuntarTime } from '../../../shared/model'

/** Frases do resultado, uma por linha. Puro. */
export function frasesDoResultado(r: ResultadoJuntarTime): string[] {
  const frases: string[] = []
  for (const j of r.juntadas) frases.push(`✓ ${j.apelido} juntada em ${j.branchAlvo}`)
  if (r.semNovidade.length) frases.push(`Sem nada novo: ${r.semNovidade.join(', ')}`)
  if (r.deFora.length) frases.push(`Ficou de fora (tem alteração não salva): ${r.deFora.join(', ')}`)
  if (r.parou) frases.push(`Parou em ${r.parou.apelido}: ${r.parou.erro}`)
  if (r.faltam.length) frases.push(`Não tentadas: ${r.faltam.join(', ')}`)
  if (!r.parou && r.juntadas.length) frases.push('As cópias continuam abertas: feche os quadros para apagá-las.')
  return frases
}
