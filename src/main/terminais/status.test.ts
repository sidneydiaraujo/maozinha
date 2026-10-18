import { describe, expect, it } from 'vitest'
import { interpretar, LeitorStatus, mesmoAviso, respostaEmTeclas } from './status'

const b64 = (s: string): string => Buffer.from(s, 'utf8').toString('base64')
const osc = (corpo: string, fim = '\x07'): string => `\x1b]7501;${corpo}${fim}`

describe('interpretar', () => {
  it('estados do Claude em portugues, com motivo e mensagem', () => {
    expect(interpretar('state=working:app=claude-code')).toEqual({ estado: 'trabalhando' })
    expect(interpretar('state=blocked:app=claude-code:kind=permission')).toEqual({
      estado: 'esperando',
      motivo: 'permissao',
    })
    expect(interpretar('state=blocked:app=claude-code:kind=question')?.motivo).toBe('pergunta')
    expect(interpretar('state=blocked:app=claude-code:kind=auth')?.motivo).toBe('login')
    expect(interpretar(`state=done:app=claude-code:msg=${b64('Testes passando ✅')}`)).toEqual({
      estado: 'terminou',
      mensagem: 'Testes passando ✅',
    })
    expect(interpretar('state=idle:app=claude-code')).toEqual({ estado: 'parado' })
    expect(interpretar('state=clear')).toEqual({ estado: 'parado' })
    expect(interpretar('state=error:app=claude-code')).toEqual({ estado: 'erro' })
  })

  it('ignora subagente (id=), estado desconhecido e lixo', () => {
    expect(interpretar('state=working:app=claude-code:id=agente-1')).toBeNull()
    expect(interpretar('state=dancing:app=claude-code')).toBeNull()
    expect(interpretar('')).toBeNull()
  })

  it('mensagem sem caracteres de controle e com no maximo 200 letras', () => {
    const aviso = interpretar(`state=done:msg=${b64('a\x1b[31mb\nc' + 'x'.repeat(300))}`)
    expect(aviso?.mensagem?.startsWith('a [31mb c')).toBe(true)
    expect(aviso?.mensagem?.length).toBe(200)
  })
})

describe('LeitorStatus', () => {
  it('acha a pergunta e os avisos no meio da saida, com BEL ou ST', () => {
    const leitor = new LeitorStatus()
    const r = leitor.ler(`ola${osc('?')}\x1b[2J${osc('state=working:app=claude-code', '\x1b\\')}fim`)
    expect(r.perguntas).toBe(1)
    expect(r.avisos).toEqual([{ estado: 'trabalhando' }])
  })

  it('junta uma sequencia cortada entre dois pedacos', () => {
    const leitor = new LeitorStatus()
    const inteiro = osc('state=blocked:app=claude-code:kind=permission')
    for (const corte of [1, 3, 8, 20, inteiro.length - 1]) {
      const l = new LeitorStatus()
      expect(l.ler(`abc${inteiro.slice(0, corte)}`).avisos).toEqual([])
      expect(l.ler(inteiro.slice(corte)).avisos).toEqual([{ estado: 'esperando', motivo: 'permissao' }])
    }
    expect(leitor.ler('saida comum sem escape').avisos).toEqual([])
  })

  it('nao guarda outras sequencias nem cresce sem limite', () => {
    const leitor = new LeitorStatus()
    expect(leitor.ler('\x1b[31mvermelho\x1b]0;titulo\x07').avisos).toEqual([])
    expect(leitor.ler(`\x1b]7501;${'x'.repeat(5000)}`).avisos).toEqual([])
    // o resto gigante foi descartado: a proxima sequencia inteira e lida normalmente
    expect(leitor.ler(osc('state=done')).avisos).toEqual([{ estado: 'terminou' }])
  })
})

describe('respostaEmTeclas', () => {
  it('cada caractere de "ESC ] 7501 ; ? BEL" vira tecla descendo e subindo', () => {
    const r = respostaEmTeclas()
    const tecla = `${'\x1b'}\\[0;0;(\\d+);([01]);0;1_`
    const teclas = [...r.matchAll(new RegExp(tecla, 'g'))]
    expect(teclas).toHaveLength(9 * 2)
    const descendo = teclas.filter((t) => t[2] === '1').map((t) => String.fromCharCode(Number(t[1])))
    expect(descendo.join('')).toBe('\x1b]7501;?\x07')
    expect(r.replace(new RegExp(tecla, 'g'), '')).toBe('')
  })
})

describe('mesmoAviso', () => {
  it('compara estado, motivo e mensagem', () => {
    expect(mesmoAviso(null, { estado: 'parado' })).toBe(false)
    expect(mesmoAviso({ estado: 'esperando', motivo: 'pergunta' }, { estado: 'esperando', motivo: 'pergunta' })).toBe(
      true,
    )
    expect(mesmoAviso({ estado: 'terminou', mensagem: 'a' }, { estado: 'terminou', mensagem: 'b' })).toBe(false)
  })
})
