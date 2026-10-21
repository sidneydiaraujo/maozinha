// Time de agentes ligado por linhas (T28.1, D39). Funcoes puras: o main decide com elas e a tela
// so as usa para pintar a linha enquanto arrasta.
import type { Ligacao, PerfilId, Provedor, Quadro, Repo } from './model'

export type MotivoRecusa = 'mesmoQuadro' | 'repetida' | 'ciclo' | 'naoAgente' | 'contas'

export const TEXTO_RECUSA: Record<MotivoRecusa, string> = {
  mesmoQuadro: 'Um quadro não se liga a ele mesmo',
  repetida: 'Esses dois quadros já estão ligados',
  ciclo: 'Essa linha fecharia um círculo no time',
  naoAgente: 'Só agentes Claude entram num time',
  contas: 'Contas diferentes só se ligam no mesmo repositório',
}

/** O que as regras precisam saber da lousa. */
export interface DadosTime {
  quadros: Quadro[]
  repos: Repo[]
  ligacoes: Ligacao[]
  provedores: Record<PerfilId, Provedor>
}

/** A pasta original de uma copia, ou a propria pasta. */
export function raizDoRepo(repos: Repo[], repoId: string): string {
  return repos.find((r) => r.id === repoId)?.copia?.origemId ?? repoId
}

export function mesmaPasta(quadros: Quadro[], a: string, b: string): boolean {
  const qa = quadros.find((q) => q.id === a)
  const qb = quadros.find((q) => q.id === b)
  return !!qa && !!qb && qa.repoId === qb.repoId
}

function ehAgenteClaude(dados: DadosTime, quadro: Quadro | undefined): quadro is Quadro {
  return !!quadro && quadro.tipo === 'agente' && dados.provedores[quadro.perfilId] === 'claude'
}

/** D39: mesma conta, ou contas diferentes no mesmo repositorio (original ou copias dele). */
function contasCombinam(repos: Repo[], a: Quadro, b: Quadro): boolean {
  return a.perfilId === b.perfilId || raizDoRepo(repos, a.repoId) === raizDoRepo(repos, b.repoId)
}

/** `de` alcanca `para` seguindo as setas? */
function alcanca(ligacoes: Ligacao[], de: string, para: string): boolean {
  const vistos = new Set<string>()
  const fila = [de]
  while (fila.length > 0) {
    const atual = fila.shift() as string
    if (atual === para) return true
    if (vistos.has(atual)) continue
    vistos.add(atual)
    for (const l of ligacoes) if (l.de === atual) fila.push(l.para)
  }
  return false
}

export function podeLigar(
  dados: DadosTime,
  de: string,
  para: string,
): { ok: true } | { ok: false; motivo: MotivoRecusa } {
  if (de === para) return { ok: false, motivo: 'mesmoQuadro' }
  const qde = dados.quadros.find((q) => q.id === de)
  const qpara = dados.quadros.find((q) => q.id === para)
  if (!ehAgenteClaude(dados, qde) || !ehAgenteClaude(dados, qpara)) return { ok: false, motivo: 'naoAgente' }
  const ja = dados.ligacoes.some((l) => (l.de === de && l.para === para) || (l.de === para && l.para === de))
  if (ja) return { ok: false, motivo: 'repetida' }
  if (!contasCombinam(dados.repos, qde, qpara)) return { ok: false, motivo: 'contas' }
  if (alcanca(dados.ligacoes, para, de)) return { ok: false, motivo: 'ciclo' }
  return { ok: true }
}

/** Ligacoes que ainda valem: os dois quadros existem, sao agentes Claude e as contas combinam. */
export function ligacoesValidas(dados: DadosTime): Ligacao[] {
  return dados.ligacoes.filter((l) => {
    const qde = dados.quadros.find((q) => q.id === l.de)
    const qpara = dados.quadros.find((q) => q.id === l.para)
    return ehAgenteClaude(dados, qde) && ehAgenteClaude(dados, qpara) && contasCombinam(dados.repos, qde, qpara)
  })
}

/** Os quadros do time de `quadroId` (ligados direta ou indiretamente), a partir dele. */
export function timeDe(ligacoes: Ligacao[], quadroId: string): string[] {
  const time: string[] = []
  const fila = [quadroId]
  while (fila.length > 0) {
    const atual = fila.shift() as string
    if (time.includes(atual)) continue
    time.push(atual)
    for (const l of ligacoes) {
      if (l.de === atual) fila.push(l.para)
      if (l.para === atual) fila.push(l.de)
    }
  }
  return time
}

// --- Apresentacao do time (T29.1) ---

export const MAXIMO_LETRAS_PAPEL = 40
export const TEXTO_SAIU_DO_TIME = '[Lousa] Você não faz mais parte do time. Siga só com o que eu pedir aqui. Responda só "ok".'
// eslint-disable-next-line no-control-regex
const CONTROLE = /[\u0000-\u001f\u007f-\u009f]+/g

/** Papel livre ("Revisor"): sem quebra de linha nem caractere de controle, ate 40 letras. */
export function limparPapel(papel: string): string {
  return papel.replace(CONTROLE, ' ').replace(/\s+/g, ' ').trim().slice(0, MAXIMO_LETRAS_PAPEL).trim()
}

/** Nome do agente no time: o papel, senao o apelido da copia, senao o titulo ("Claude 3"). */
export function nomeNoTime(dados: DadosTime, quadroId: string): string {
  const q = dados.quadros.find((x) => x.id === quadroId)
  if (!q) return quadroId
  return q.papel || dados.repos.find((r) => r.id === q.repoId)?.copia?.apelido || q.titulo
}

function ondeTrabalha(dados: DadosTime, quadroId: string): string {
  const q = dados.quadros.find((x) => x.id === quadroId)
  const repo = dados.repos.find((r) => r.id === q?.repoId)
  return repo?.copia ? `branch ${repo.copia.branch}` : `pasta original ${repo?.nome ?? '?'}`
}

const lista = (nomes: string[]): string => nomes.join(', ')

/**
 * O que a Lousa diz ao agente quando o time dele muda: quem ele e, onde trabalha, quem sao os
 * colegas e para quem entrega. Uma linha so, sem caractere de controle. null = sem time.
 */
export function textoDoTime(dados: DadosTime, quadroId: string): string | null {
  const time = timeDe(dados.ligacoes, quadroId)
  if (time.length < 2) return null
  const eu = dados.quadros.find((q) => q.id === quadroId)
  const pasta = dados.repos.find((r) => r.id === eu?.repoId)?.caminho ?? '?'
  const colegas = time.filter((id) => id !== quadroId).map((id) => `${nomeNoTime(dados, id)} (${ondeTrabalha(dados, id)})`)
  const recebe = dados.ligacoes.filter((l) => l.para === quadroId).map((l) => nomeNoTime(dados, l.de))
  const entrega = dados.ligacoes.filter((l) => l.de === quadroId).map((l) => nomeNoTime(dados, l.para))
  const partes = [
    `[Lousa] Você é ${nomeNoTime(dados, quadroId)} num time de ${time.length} agentes.`,
    `Você trabalha em ${pasta} (${ondeTrabalha(dados, quadroId)}).`,
    `Colegas: ${colegas.join(' · ')}.`,
    recebe.length ? `Você recebe o trabalho de ${lista(recebe)}.` : '',
    entrega.length ? `Quando terminar, o seu trabalho vai para ${lista(entrega)}.` : '',
    'Mexa só na sua pasta. Para ver o trabalho de um colega, use git log ou git diff na branch dele.',
    'Responda só "ok".',
  ]
  return inerte(partes.filter(Boolean).join(' '))
}

// --- Repasse (T30.1) ---

/** Freio: repasses automaticos seguidos num time sem o Sidney digitar em algum quadro dele. */
export const LIMITE_REPASSES = 3

/**
 * O que o `para` recebe quando o `de` termina: quem terminou, o que disse (a mensagem do OSC 7501,
 * ate 200 letras, vem do agente: passa pelo inerte) e onde esta o trabalho. Uma linha so.
 */
export function textoDoRepasse(dados: DadosTime, de: string, mensagem?: string): string {
  const disse = mensagem ? ` e disse: "${mensagem}"` : ''
  const partes = [
    `[Lousa] Seu colega ${nomeNoTime(dados, de)} terminou${disse}.`,
    `O trabalho dele está na ${ondeTrabalha(dados, de)}.`,
    'Veja o que mudou (git log e git diff nessa branch) e continue a sua parte.',
  ]
  return inerte(partes.join(' '))
}

/**
 * Sem caractere de controle nem os que um shell usa para encadear ou expandir (; & | $ e o
 * acento grave): se o Claude tiver saido e o quadro estiver no PowerShell, a linha nao vira
 * comando (comecar com "[Lousa] Voce" ja e erro de sintaxe; isto e a segunda trava).
 */
function inerte(texto: string): string {
  return texto.replace(CONTROLE, ' ').replace(/[;&|$`]/g, ' ').replace(/ {2,}/g, ' ')
}
