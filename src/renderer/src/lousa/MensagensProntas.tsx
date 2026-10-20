import { useState } from 'react'
import { useMensagens } from './useMensagens'

interface Props {
  /** O que esta escrito na barra agora: "Guardar" guarda isto. */
  texto: string
  /** Clique numa frase: ela vai para a barra (o usuario ainda pode mudar antes de enviar). */
  aoEscolher(texto: string): void
}

/** "★" na barra de varios quadros (T25.2, D33): escolher, guardar e apagar mensagens prontas. */
export function MensagensProntas({ texto, aoEscolher }: Props): React.JSX.Element {
  const { mensagens, guardar, apagar } = useMensagens()
  const [aberta, setAberta] = useState(false)
  const escrito = texto.trim()
  return (
    <>
      <button
        className="botao-pequeno botao-prontas"
        title="Mensagens prontas"
        aria-label="Mensagens prontas"
        aria-expanded={aberta}
        onClick={() => setAberta((a) => !a)}
      >
        ★
      </button>
      {aberta && (
        <div className="prontas" role="menu" aria-label="Mensagens prontas">
          {mensagens.length === 0 && <p className="prontas-vazia">Nenhuma mensagem guardada.</p>}
          {mensagens.map((m) => (
            <div key={m} className="prontas-item">
              <button
                role="menuitem"
                title={m}
                onClick={() => {
                  aoEscolher(m)
                  setAberta(false)
                }}
              >
                {m}
              </button>
              <button className="botao-fechar" aria-label={`Apagar "${m}"`} onClick={() => apagar(m)}>
                ×
              </button>
            </div>
          ))}
          <button className="botao-pequeno prontas-guardar" disabled={escrito === '' || mensagens.includes(escrito)} onClick={() => guardar(escrito)}>
            ★ Guardar a mensagem escrita
          </button>
        </div>
      )}
    </>
  )
}
