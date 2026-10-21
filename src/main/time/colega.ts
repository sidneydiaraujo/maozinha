// Colega novo, ja ligado (T28.3, D39): clicar na bolinha de saida de um agente cria outro na
// mesma conta e no mesmo repositorio, numa copia propria (D18), sem escolher nada.
import type { ColegaNovo, Posicao, Quadro, Repo } from '../../shared/model'
import { raizDoRepo, TEXTO_RECUSA } from '../../shared/time'
import type { Armazem } from '../estado/armazem'
import type { ServicoQuadros } from '../quadros/servico'
import type { ServicoTime } from './servico'

/** Folga entre o quadro e o colega que nasce a direita dele. */
const FOLGA = 40

/** Erros da copia que querem dizer "esta pasta nao aceita copia": o colega fica na mesma pasta. */
const SEM_COPIA = ['não é um repositório git', 'só na pasta raiz de um repositório git']

export interface DepsColega {
  armazem: Armazem
  quadros: Pick<ServicoQuadros, 'obter' | 'criar' | 'criarEmCopia' | 'ajustar'>
  time: Pick<ServicoTime, 'ligar' | 'desligar'>
  /** A conta e de agente Claude? (so ele entra num time) */
  ehClaude(perfilId: string): boolean
}

/**
 * Cria o colega e liga `quadroId -> colega`. Sem `posicao`, nasce a direita do quadro. A copia
 * sai da pasta original (copia de copia copia a original). Pasta sem git: mesma pasta.
 * `exigirCopia`: sem copia possivel, lanca em vez de cair na mesma pasta.
 */
export async function criarColega(
  deps: DepsColega,
  quadroId: string,
  opcoes: { posicao?: Posicao; exigirCopia?: boolean } = {},
): Promise<ColegaNovo> {
  const origem = deps.quadros.obter(quadroId)
  if (origem.tipo !== 'agente' || !deps.ehClaude(origem.perfilId)) throw new Error(TEXTO_RECUSA.naoAgente)
  const raiz = raizDoRepo(deps.armazem.carregar().repos, origem.repoId)
  const posicao = opcoes.posicao ?? { x: origem.caixa.x + origem.caixa.largura + FOLGA, y: origem.caixa.y }

  const criado = await naCopiaOuNaPasta(deps, origem, { raiz, posicao, exigirCopia: !!opcoes.exigirCopia })
  const quadro = herdarAjustes(deps, origem, criado.quadro)
  return { quadro, repo: criado.repo, ligacao: deps.time.ligar(origem.id, quadro.id) }
}

async function naCopiaOuNaPasta(
  deps: DepsColega,
  origem: Quadro,
  { raiz, posicao, exigirCopia }: { raiz: string; posicao: Posicao; exigirCopia: boolean },
): Promise<{ quadro: Quadro; repo: Repo | null }> {
  try {
    return await deps.quadros.criarEmCopia(raiz, 'agente', origem.perfilId, posicao)
  } catch (e) {
    const texto = e instanceof Error ? e.message : String(e)
    if (exigirCopia || !SEM_COPIA.some((s) => texto.includes(s))) throw e
    return { quadro: deps.quadros.criar(origem.repoId, 'agente', origem.perfilId, posicao), repo: null }
  }
}

/** O colega abre com o mesmo modelo e esforco de quem o criou (T19.1). */
function herdarAjustes(deps: DepsColega, origem: Quadro, quadro: Quadro): Quadro {
  if (!origem.modelo && !origem.esforco) return quadro
  return deps.quadros.ajustar(quadro.id, {
    ...(origem.modelo ? { modelo: origem.modelo } : {}),
    ...(origem.esforco ? { esforco: origem.esforco } : {}),
  })
}

/**
 * Linha ambar (os dois na mesma pasta): cria um colega numa copia a partir do `de`, liga o `de`
 * a ele e tira a linha antiga. O quadro antigo fica aberto: a conversa dele nao iria junto.
 */
export async function separarEmCopia(deps: DepsColega, ligacaoId: string): Promise<ColegaNovo> {
  const ligacao = (deps.armazem.carregar().ligacoes ?? []).find((l) => l.id === ligacaoId)
  if (!ligacao) throw new Error('Linha não encontrada')
  const antigo = deps.quadros.obter(ligacao.para)
  const posicao = { x: antigo.caixa.x, y: antigo.caixa.y + antigo.caixa.altura + FOLGA }
  const colega = await criarColega(deps, ligacao.de, { posicao, exigirCopia: true })
  deps.time.desligar(ligacaoId)
  return colega
}
