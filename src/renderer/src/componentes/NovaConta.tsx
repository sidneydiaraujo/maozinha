// "+ Nova conta" (T1.8): escolhe o provedor e o nome; o main cria a pasta vazia da conta.
import { useState, type FormEvent, type KeyboardEvent } from 'react'
import type { Provedor } from '../../../shared/model'
import { mensagemDe } from './erro'

interface Props {
  aoCriar(provedor: Provedor, nome: string): Promise<void>
  aoCancelar(): void
}

const OPCOES: Array<{ provedor: Provedor; rotulo: string; dica: string }> = [
  { provedor: 'claude', rotulo: 'Claude', dica: 'Claude Code' },
  { provedor: 'codex', rotulo: 'ChatGPT (Codex)', dica: 'Codex CLI' },
]

export function NovaConta({ aoCriar, aoCancelar }: Props): React.JSX.Element {
  const [provedor, setProvedor] = useState<Provedor>('claude')
  const [nome, setNome] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [criando, setCriando] = useState(false)

  async function criar(e: FormEvent): Promise<void> {
    e.preventDefault()
    if (nome.trim() === '' || criando) return
    setCriando(true)
    setErro(null)
    try {
      await aoCriar(provedor, nome.trim())
    } catch (falha) {
      setErro(mensagemDe(falha))
      setCriando(false)
    }
  }

  function teclou(e: KeyboardEvent<HTMLInputElement>): void {
    if (e.key !== 'Escape') return
    e.stopPropagation() // Esc cancela so o formulario, nao fecha o painel
    aoCancelar()
  }

  return (
    <form className="nova-conta" onSubmit={(e) => void criar(e)}>
      <h3 className="nova-conta-titulo">Nova conta</h3>
      <div className="nova-conta-provedores" role="radiogroup" aria-label="Provedor">
        {OPCOES.map((o) => (
          <button
            key={o.provedor}
            type="button"
            role="radio"
            aria-checked={provedor === o.provedor}
            className="nova-conta-provedor"
            onClick={() => setProvedor(o.provedor)}
          >
            <strong>{o.rotulo}</strong>
            <small>{o.dica}</small>
          </button>
        ))}
      </div>
      <label className="nova-conta-campo">
        Nome da conta
        <input
          value={nome}
          maxLength={40}
          autoFocus
          placeholder="Ex.: Trabalho"
          onChange={(e) => setNome(e.target.value)}
          onKeyDown={teclou}
        />
      </label>
      {provedor === 'codex' && (
        <p className="apagado">O e-mail e o plano de contas Codex ainda não aparecem no Salazar.</p>
      )}
      {erro && (
        <p className="erro" role="alert">
          {erro}
        </p>
      )}
      <div className="nova-conta-botoes">
        <button className="botao-pequeno botao-principal" type="submit" disabled={criando || nome.trim() === ''}>
          {criando ? 'Criando…' : 'Criar'}
        </button>
        <button className="botao-pequeno" type="button" onClick={aoCancelar}>
          Cancelar
        </button>
      </div>
    </form>
  )
}
