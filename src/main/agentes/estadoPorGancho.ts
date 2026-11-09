// Estado do agente pelos ganchos do Claude (D63, 09/11/2026). O OSC 7501 (terminais/status.ts) parou
// de chegar: o Claude pergunta "?" e, no mesmo pacote, manda um DA1 que o proprio ConPTY responde na
// hora; a resposta da Lousa (em teclas) chega depois e o Claude conclui "programStatus=no" (log de
// --debug, 2.1.317 e 2.1.319). Sem estado, o selo, a pilula "X trabalhando", o repasse do time e a
// hibernacao ficavam presos no ultimo estado ou sem nenhum. Os ganchos do --settings da Lousa gravam
// o JSON de cada evento em <quadroId>.estado.json (o mesmo `findstr` da linha de status, T17.0) e a
// ponte traduz aqui. Puro.
import { EVENTOS_DOS_GANCHOS } from '../../shared/contratoClaude'
import type { AvisoAgente, EstadoAgente } from '../../shared/model'

const MAIOR_MENSAGEM = 200

type Evento = (typeof EVENTOS_DOS_GANCHOS)[number]

/** Os ganchos que vao no settings, juntos com os de escrita (A16). Async: o Claude nao espera o findstr. */
export function ganchosDeEstado(arquivoJson: string): Record<Evento, unknown[]> {
  const comando = `findstr "^" > "${arquivoJson.replace(/\\/g, '/')}"`
  const gancho = (matcher?: string, async = true): unknown => ({
    ...(matcher ? { matcher } : {}),
    hooks: [{ type: 'command', command: comando, ...(async ? { async: true } : {}) }],
  })
  return {
    SessionStart: [gancho()],
    UserPromptSubmit: [gancho()],
    PreToolUse: [gancho('AskUserQuestion')],
    PostToolUse: [gancho('*')],
    Notification: [gancho()],
    Stop: [gancho()],
    StopFailure: [gancho()],
    // ao sair o Claude nao espera gancho em segundo plano: este roda antes dele fechar
    SessionEnd: [gancho(undefined, false)],
  }
}

/** Junta dois blocos de ganchos (o de escrita e o de estado) sem um apagar o outro. */
export function juntarGanchos(...blocos: Record<string, unknown[]>[]): Record<string, unknown[]> {
  const junto: Record<string, unknown[]> = {}
  for (const bloco of blocos) for (const [evento, lista] of Object.entries(bloco)) junto[evento] = [...(junto[evento] ?? []), ...lista]
  return junto
}

export interface LidoDoGancho {
  aviso: AvisoAgente
  /** So vale se o agente estiver num destes estados (o "parado" do idle_prompt). */
  seEstiver?: readonly EstadoAgente[]
}

interface Entrada {
  hook_event_name?: unknown
  source?: unknown
  notification_type?: unknown
  message?: unknown
  last_assistant_message?: unknown
}

function limpar(texto: unknown): string | undefined {
  if (typeof texto !== 'string') return undefined
  const limpo = texto.replace(/[\p{Cc}\p{Cf}]+/gu, ' ').replace(/\s+/g, ' ').trim()
  return limpo === '' ? undefined : limpo.slice(0, MAIOR_MENSAGEM)
}

function comMensagem(estado: EstadoAgente, mensagem: string | undefined): AvisoAgente {
  return mensagem ? { estado, mensagem } : { estado }
}

/** A notificacao do Claude: pedido de permissao, pergunta ou parado ha 1 minuto. */
function daNotificacao(e: Entrada): LidoDoGancho | null {
  const mensagem = limpar(e.message)
  const comTexto = mensagem ? { mensagem } : {}
  if (e.notification_type === 'permission_prompt') return { aviso: { estado: 'esperando', motivo: 'permissao', ...comTexto } }
  if (e.notification_type === 'elicitation_dialog') return { aviso: { estado: 'esperando', motivo: 'pergunta', ...comTexto } }
  // o Esc interrompe sem o Stop: so desfaz um "trabalhando" que ficou para tras
  if (e.notification_type === 'idle_prompt') return { aviso: { estado: 'parado' }, seEstiver: ['trabalhando'] }
  return null
}

const POR_EVENTO: Record<string, (e: Entrada) => LidoDoGancho | null> = {
  // depois de um /compact no meio do trabalho ele segue trabalhando
  SessionStart: (e) => (e.source === 'compact' ? null : { aviso: { estado: 'parado' } }),
  UserPromptSubmit: () => ({ aviso: { estado: 'trabalhando' } }),
  PostToolUse: () => ({ aviso: { estado: 'trabalhando' } }),
  PreToolUse: () => ({ aviso: { estado: 'esperando', motivo: 'pergunta' } }),
  Notification: daNotificacao,
  Stop: (e) => ({ aviso: comMensagem('terminou', limpar(e.last_assistant_message)) }),
  StopFailure: () => ({ aviso: { estado: 'erro' } }),
  SessionEnd: () => ({ aviso: { estado: 'parado' } }),
}

/** O JSON que o gancho gravou -> estado novo; null quando o evento nao muda nada. */
export function lerGancho(texto: string): LidoDoGancho | null {
  let e: Entrada
  try {
    e = JSON.parse(texto) as Entrada
  } catch {
    return null
  }
  if (!e || typeof e !== 'object' || typeof e.hook_event_name !== 'string') return null
  return Object.hasOwn(POR_EVENTO, e.hook_event_name) ? (POR_EVENTO[e.hook_event_name]?.(e) ?? null) : null
}
