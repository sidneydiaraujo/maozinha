import { describe, expect, it } from 'vitest'
import { EVENTOS_DOS_GANCHOS } from '../../shared/contratoClaude'
import { ganchosDeEstado, juntarGanchos, lerGancho } from './estadoPorGancho'

const ler = (o: object) => lerGancho(JSON.stringify(o))

describe('ganchosDeEstado', () => {
  it('um gancho por evento do contrato, todos com o findstr para o arquivo do quadro', () => {
    const g = ganchosDeEstado('C:\\dados\\agentes\\q1.estado.json')
    expect(Object.keys(g)).toEqual([...EVENTOS_DOS_GANCHOS])
    const comandos = Object.values(g).flatMap((l) => (l as { hooks: { command: string }[] }[]).flatMap((x) => x.hooks.map((h) => h.command)))
    expect(new Set(comandos)).toEqual(new Set(['findstr "^" > "C:/dados/agentes/q1.estado.json"']))
  })

  it('so o SessionEnd e sincrono: ao sair o Claude nao espera gancho em segundo plano', () => {
    const g = ganchosDeEstado('x') as Record<string, { hooks: { async?: boolean }[] }[]>
    const sincronos = Object.entries(g)
      .filter(([, l]) => l.some((x) => x.hooks.some((h) => !h.async)))
      .map(([e]) => e)
    expect(sincronos).toEqual(['SessionEnd'])
  })

  it('PreToolUse so para a pergunta ao usuario; PostToolUse para todas as ferramentas', () => {
    const g = ganchosDeEstado('x') as Record<string, { matcher?: string }[]>
    expect(g.PreToolUse?.[0]?.matcher).toBe('AskUserQuestion')
    expect(g.PostToolUse?.[0]?.matcher).toBe('*')
  })
})

describe('juntarGanchos', () => {
  it('soma as listas do mesmo evento, na ordem', () => {
    expect(juntarGanchos({ PostToolUse: ['a'] }, { PostToolUse: ['b'], Stop: ['c'] })).toEqual({ PostToolUse: ['a', 'b'], Stop: ['c'] })
  })
})

describe('lerGancho', () => {
  it('abrir, retomar e /clear: parado; depois de um /compact nao muda nada', () => {
    expect(ler({ hook_event_name: 'SessionStart', source: 'startup' })).toEqual({ aviso: { estado: 'parado' } })
    expect(ler({ hook_event_name: 'SessionStart', source: 'resume' })).toEqual({ aviso: { estado: 'parado' } })
    expect(ler({ hook_event_name: 'SessionStart', source: 'compact' })).toBeNull()
  })

  it('mensagem mandada e ferramenta usada: trabalhando', () => {
    expect(ler({ hook_event_name: 'UserPromptSubmit', prompt: 'oi' })).toEqual({ aviso: { estado: 'trabalhando' } })
    expect(ler({ hook_event_name: 'PostToolUse', tool_name: 'Bash' })).toEqual({ aviso: { estado: 'trabalhando' } })
  })

  it('pedido de permissao e pergunta: esperando, com o motivo e o texto', () => {
    expect(ler({ hook_event_name: 'Notification', notification_type: 'permission_prompt', message: 'Claude needs your permission to use Bash' })).toEqual({
      aviso: { estado: 'esperando', motivo: 'permissao', mensagem: 'Claude needs your permission to use Bash' },
    })
    expect(ler({ hook_event_name: 'PreToolUse', tool_name: 'AskUserQuestion' })).toEqual({ aviso: { estado: 'esperando', motivo: 'pergunta' } })
    expect(ler({ hook_event_name: 'Notification', notification_type: 'elicitation_dialog' })).toEqual({ aviso: { estado: 'esperando', motivo: 'pergunta' } })
  })

  it('parado ha 1 minuto so desfaz um "trabalhando" (o Esc interrompe sem o Stop); outra notificacao nao muda nada', () => {
    expect(ler({ hook_event_name: 'Notification', notification_type: 'idle_prompt' })).toEqual({ aviso: { estado: 'parado' }, seEstiver: ['trabalhando'] })
    expect(ler({ hook_event_name: 'Notification', notification_type: 'auth_success' })).toBeNull()
  })

  it('terminou leva a ultima resposta limpa e curta; falha vira erro; sair do Claude, parado', () => {
    const longa = `Pronto.\n\x1b[31mFeito\x1b[0m ${'x'.repeat(300)}`
    const lido = ler({ hook_event_name: 'Stop', last_assistant_message: longa })
    expect(lido?.aviso.estado).toBe('terminou')
    expect(lido?.aviso.mensagem?.startsWith('Pronto. [31mFeito [0m')).toBe(true)
    expect(lido?.aviso.mensagem).toHaveLength(200)
    expect(ler({ hook_event_name: 'Stop' })).toEqual({ aviso: { estado: 'terminou' } })
    expect(ler({ hook_event_name: 'StopFailure', error: 'rate_limit' })).toEqual({ aviso: { estado: 'erro' } })
    expect(ler({ hook_event_name: 'SessionEnd', reason: 'prompt_input_exit' })).toEqual({ aviso: { estado: 'parado' } })
  })

  it('JSON quebrado, sem evento ou evento de subagente: nada', () => {
    expect(lerGancho('nao e json')).toBeNull()
    expect(lerGancho('null')).toBeNull()
    expect(ler({})).toBeNull()
    expect(ler({ hook_event_name: 'SubagentStop' })).toBeNull()
  })
})

