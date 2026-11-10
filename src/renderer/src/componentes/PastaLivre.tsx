// "Pasta livre" no cartao da conta (D65): onde nasce o quadro livre desta conta, aberto sem escolher
// pasta. O seletor do Windows roda no main e entrega uma ficha (R2.11); a tela nunca manda caminho.
import { useState } from 'react'
import type { PerfilComConta } from '../../../shared/model'
import { mensagemDe } from './erro'

interface Props {
  perfil: PerfilComConta
  /** A ficha do seletor de pasta; null tira a pasta livre. */
  aoSalvar(ficha: string | null): Promise<void>
}

export function PastaLivreSecao({ perfil, aoSalvar }: Props): React.JSX.Element {
  const [erro, setErro] = useState<string | null>(null)
  const [ocupado, setOcupado] = useState(false)

  async function fazer(acao: () => Promise<void>): Promise<void> {
    setErro(null)
    setOcupado(true)
    try {
      await acao()
    } catch (e) {
      setErro(mensagemDe(e))
    } finally {
      setOcupado(false)
    }
  }

  const escolher = (): Promise<void> =>
    fazer(async () => {
      const escolha = await window.lousa.repos.escolherPasta()
      if (escolha) await aoSalvar(escolha.ficha)
    })

  return (
    <details className="git-conta pasta-livre" data-pasta-livre={perfil.id}>
      <summary>
        Pasta livre <span className="apagado">{perfil.pastaLivre ?? 'nenhuma'}</span>
      </summary>
      <p className="apagado git-dica">
        Onde nasce o quadro livre desta conta: abre sem escolher pasta, e o projeto em que o agente mexer
        aparece sozinho na lateral.
      </p>
      <div className="cartao-acoes">
        <button className="botao-pequeno" disabled={ocupado} onClick={() => void escolher()}>
          {perfil.pastaLivre ? 'Trocar pasta…' : 'Escolher pasta…'}
        </button>
        {perfil.pastaLivre && (
          <button className="botao-pequeno" disabled={ocupado} onClick={() => void fazer(() => aoSalvar(null))}>
            Tirar
          </button>
        )}
      </div>
      {erro && (
        <p className="erro" role="alert">
          {erro}
        </p>
      )}
    </details>
  )
}
