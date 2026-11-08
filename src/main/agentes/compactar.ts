// Compactar a conversa de um agente (T18.1, D24). A tela so manda o id do quadro; o texto que vai
// para o terminal e fixo e quem decide se pode e o main, pelo ultimo estado do OSC 7501 e pelo
// sinal de pronto (D49), e so com o claude.exe rodando (sem ele, o texto cairia no PowerShell).
import { podeDigitar } from '../../shared/compactar'
import { GUARDAR_CAIXA, PAUSA_ENTER_MS, TEXTO_MENU_COMPACT } from '../../shared/contratoClaude'
import { apertarEnter } from '../../shared/digitar'
import type { AvisoAgente, Quadro } from '../../shared/model'

// A pausa antes do Enter (D21) e o Ctrl+S sao itens do contrato com o Claude (R4.21). O rascunho do
// Sidney fica guardado (A28): o Ctrl+S guarda a caixa e a limpa; depois do /compact o proprio Claude
// devolve o rascunho ("Draft restored").
export { GUARDAR_CAIXA }
const COMANDO = '/compact'
/** Backspace, uma vez por letra do comando: desfaz o que a Lousa digitou. */
const APAGAR = '\x7f'.repeat(COMANDO.length)
/** Quanto a Lousa espera o menu do comando aparecer depois de digitar /compact. */
export const ESPERA_MENU_MS = 2000
export const TEXTO_SEM_MENU =
  'Não deu para compactar sem mexer no que está escrito na caixa do agente. Nada foi enviado; tente de novo.'

// sequencias de terminal (OSC e CSI) viram espaco antes de procurar o texto do menu
const ESC = String.fromCharCode(27)
const BEL = String.fromCharCode(7)
const SEQUENCIA = new RegExp(`${ESC}(\\][^${BEL}]*${BEL}|\\[[0-9;?<>=]*[ -/]*[@-~])`, 'g')

/**
 * A caixa ficou so com "/compact"? O Claude abre o menu de comandos com a descricao dele. Com um
 * rascunho antigo devolvido pelo Ctrl+S (caixa vazia e algo guardado antes), o texto nao comeca
 * com "/" e o menu nao abre: a Lousa nao aperta Enter.
 */
export function mostraMenuDoCompact(saida: string): boolean {
  return saida.replace(SEQUENCIA, ' ').replace(/\s+/g, ' ').includes(TEXTO_MENU_COMPACT)
}

export interface DepsCompactar {
  quadro(quadroId: string): Quadro
  /** O terminal do quadro (id = quadroId) esta rodando? */
  aberto(terminalId: string): boolean
  aviso(terminalId: string): AvisoAgente | null
  /** O Claude ja desenhou a linha de status neste terminal (D49). */
  pronto(terminalId: string): boolean
  /** O claude.exe ainda roda no terminal? Ele nao avisa quando sai (D39). */
  temClaude(terminalId: string): Promise<boolean>
  escrever(terminalId: string, dados: string): void
  esperar(ms: number): Promise<void>
  /** Espera a saida do terminal satisfazer `achou` em ate `ms` (so o que chega daqui para a frente). */
  aguardarSaida(terminalId: string, achou: (saida: string) => boolean, ms: number): Promise<boolean>
}

/**
 * Guarda a caixa (Ctrl+S), digita `/compact` e so aperta Enter se o menu do comando aparecer. Sem
 * menu, apaga o que digitou e aperta Ctrl+S de novo: a caixa volta como estava. Lanca com a frase
 * para a tela se nao puder.
 */
export async function compactar(deps: DepsCompactar, quadroId: string): Promise<void> {
  const quadro = deps.quadro(quadroId)
  if (quadro.tipo !== 'agente') throw new Error('Só um agente compacta a conversa')
  if (!deps.aberto(quadro.id)) throw new Error('O terminal do agente não está aberto')
  if (!podeDigitar(deps.aviso(quadro.id)?.estado, deps.pronto(quadro.id))) throw new Error('Espere o agente parar')
  if (!(await deps.temClaude(quadro.id))) throw new Error('O Claude não está rodando neste quadro')
  deps.escrever(quadro.id, GUARDAR_CAIXA)
  await deps.esperar(PAUSA_ENTER_MS)
  const menu = deps.aguardarSaida(quadro.id, mostraMenuDoCompact, ESPERA_MENU_MS)
  deps.escrever(quadro.id, COMANDO)
  if (!(await menu)) {
    deps.escrever(quadro.id, APAGAR)
    await deps.esperar(PAUSA_ENTER_MS)
    deps.escrever(quadro.id, GUARDAR_CAIXA)
    throw new Error(TEXTO_SEM_MENU)
  }
  await apertarEnter({ escrever: (dados) => deps.escrever(quadro.id, dados), esperar: deps.esperar })
}
