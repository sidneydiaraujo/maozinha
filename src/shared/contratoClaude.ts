// Contrato com o Claude Code (R4.21): tudo que o Mãozinha supoe sobre o claude.exe, num lugar so,
// com a versao em que cada item foi provado. A cada atualizacao do Claude, rode a prova
// `contrato-claude` (Claude de verdade, conta Pessoal, pede o ok do Sidney; nao manda mensagem) e,
// se tudo passar, troque `VERSAO_CONFERIDA`. Item que mudou: corrija aqui e no codigo que o usa.

/** Ultima versao do claude.exe em que a prova `contrato-claude` passou inteira. */
export const VERSAO_CONFERIDA = '2.1.319'

/** Nome do processo filho do PowerShell do quadro (terminais/filhos.ts, perfis/conta.ts). T29.1, 21/10. */
export const PROCESSO_CLAUDE = 'claude.exe'

/**
 * Program Status Protocol, OSC 7501 (terminais/status.ts, D16): os estados e motivos que o Claude
 * manda. Lido no 2.1.295; desde o 2.1.311 so manda estado depois do primeiro trabalho (D49).
 */
export const ESTADOS_OSC_7501 = ['working', 'blocked', 'done', 'idle', 'clear', 'error'] as const
export const MOTIVOS_OSC_7501 = ['permission', 'question', 'auth'] as const

/**
 * Ganchos (hooks) do --settings que dao o estado do agente (agentes/estadoPorGancho.ts, D63). Desde
 * o 2.1.317 o OSC 7501 nao chega: o ConPTY responde o DA1 da sondagem antes da resposta da Lousa e o
 * Claude registra "programStatus=no". Campos lidos: source, notification_type (permission_prompt,
 * elicitation_dialog, idle_prompt), message e last_assistant_message. Provado no 2.1.319 (09/11).
 */
export const EVENTOS_DOS_GANCHOS = [
  'SessionStart',
  'UserPromptSubmit',
  'PreToolUse',
  'PostToolUse',
  'Notification',
  'Stop',
  'StopFailure',
  'SessionEnd',
] as const

/**
 * Pausa entre o texto e o Enter: texto e Enter juntos o Claude trata como colagem e nao envia
 * (D21, 2.1.30x). Vale para tudo que a Lousa digita no agente (tela e main).
 */
export const PAUSA_ENTER_MS = 150

/** Ctrl+S: o "stash" da caixa do Claude; guarda o rascunho e limpa (A28, 2.1.317, 03/11). */
export const GUARDAR_CAIXA = '\x13'

/** Texto da descricao do /compact no menu de comandos (A28, 2.1.317): sem ele, a Lousa nao aperta Enter. */
export const TEXTO_MENU_COMPACT = 'Free up context'

/**
 * Trabalhando, o Claude redesenha o contador da tela ("✻ Hatching… (4s · ↓ 190 tokens") pelo menos
 * uma vez por segundo, ate rodando ferramenta. Esc e Ctrl+C interrompem sem gancho nenhum (e nem
 * sempre escrevem "Interrupted"): terminal quieto por este tempo com o agente "trabalhando" quer
 * dizer que ele parou (D63, 2.1.319, 09/11).
 */
export const SILENCIO_DE_QUEM_PAROU_MS = 30_000

/** Chave do --settings que desliga a aceleracao da roda no Windows (A31, 2.1.318). */
export const SEM_ACELERACAO_DA_RODA = { wheelScrollAccelerationEnabled: false } as const

/** Opcoes da linha de comando que a Lousa usa (`claude --help`). */
export const OPCOES_DA_LINHA = ['--settings', '--resume', '--session-id', '--model', '--effort', '--mcp-config'] as const

export interface ItemDoContrato {
  item: string
  provadoEm: string
  /** O que a prova `contrato-claude` confere (ou "manual" quando so da para ver com mensagem). */
  prova: string
}

/** O contrato inteiro, para a ARQUITETURA e para o teste que barra item sem versao. */
export const CONTRATO_CLAUDE: readonly ItemDoContrato[] = [
  { item: `processo ${PROCESSO_CLAUDE} filho do PowerShell`, provadoEm: '2.1.30x (21/10)', prova: 'temClaude ve o agente aberto' },
  { item: 'OSC 7501: pergunta "?" e resposta em teclas win32-input-mode', provadoEm: '2.1.295 (18/10)', prova: 'o Claude abre e nao reclama do terminal' },
  { item: `OSC 7501: estados ${ESTADOS_OSC_7501.join(', ')}`, provadoEm: '2.1.311', prova: 'manual; desde o 2.1.317 o Claude desliga (programStatus=no)' },
  { item: `ganchos de estado: ${EVENTOS_DOS_GANCHOS.join(', ')}`, provadoEm: '2.1.319 (09/11)', prova: 'o SessionStart traz "parado" ao abrir' },
  { item: 'linha de status em JSON pelo --settings (painel)', provadoEm: '2.1.304 (T17.0)', prova: 'o painel chega com modelo, esforco e limites' },
  { item: `${OPCOES_DA_LINHA.join(', ')} no claude --help`, provadoEm: '2.1.312', prova: 'claude --help lista todas' },
  { item: `menu do /compact com "${TEXTO_MENU_COMPACT}"`, provadoEm: '2.1.317 (03/11)', prova: 'digita /compact sem Enter, ve o texto e apaga' },
  { item: 'Ctrl+S guarda e limpa a caixa', provadoEm: '2.1.317 (03/11)', prova: 'rascunho some da caixa com Ctrl+S' },
  { item: `pausa de ${PAUSA_ENTER_MS} ms antes do Enter (senao vira colagem)`, provadoEm: '2.1.30x (D21)', prova: 'manual (precisa mandar mensagem)' },
  { item: `trabalhando redesenha a tela; ${SILENCIO_DE_QUEM_PAROU_MS / 1000} s quieto = parou (Esc, Ctrl+C)`, provadoEm: '2.1.319 (09/11)', prova: 'manual (precisa mandar mensagem)' },
  { item: 'wheelScrollAccelerationEnabled no --settings', provadoEm: '2.1.318 (04/11)', prova: 'o Claude abre com o settings sem aviso de chave invalida' },
]
