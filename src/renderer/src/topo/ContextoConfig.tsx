// Secao "Contexto da conversa" do painel da engrenagem (T18.2): quando o anel aparece, usado ou
// restante, e os dois limiares. Vale na hora para todos os quadros (guardarPrefContexto avisa).
import { useRef, useState } from 'react'
import '../estilos/contexto.css'
import { DesenhoAnel } from '../lousa/AnelContexto'
import {
  guardarPrefContexto,
  lerPrefContexto,
  PREF_CONTEXTO_PADRAO,
  vistaDoContexto,
  type PrefContexto,
  type QuandoMostrar,
} from '../lousa/contexto'
import { Passo } from './Aparencia'

const QUANDO: Array<{ valor: QuandoMostrar; rotulo: string }> = [
  { valor: 'sempre', rotulo: 'Sempre' },
  { valor: 'apartir', rotulo: 'A partir de…' },
  { valor: 'nunca', rotulo: 'Nunca' },
]

/** Amostras da previa: uma em cada cor com os limiares padrao. */
const AMOSTRAS = [30, 75, 95]

function Previa({ pref }: { pref: PrefContexto }): React.JSX.Element {
  return (
    <div className="contexto-previa" aria-label="Prévia do anel">
      {AMOSTRAS.map((usado) => {
        const v = vistaDoContexto(usado, { ...pref, mostrar: 'sempre' })
        return v.visivel ? <DesenhoAnel key={usado} numero={v.numero} nivel={v.nivel} /> : null
      })}
      <span className="apagado">30 · 75 · 95% usados</span>
    </div>
  )
}

function Opcoes({ pref, mudar }: { pref: PrefContexto; mudar(parte: Partial<PrefContexto>): void }): React.JSX.Element {
  const { aPartirDe, alerta, perigo } = pref
  return (
    <div className="contexto-opcoes">
      <div className="aparencia-fontes" role="radiogroup" aria-label="Mostrar o anel">
        {QUANDO.map((q) => (
          <button
            key={q.valor}
            type="button"
            role="radio"
            aria-checked={pref.mostrar === q.valor}
            className="aparencia-opcao"
            onClick={() => mudar({ mostrar: q.valor })}
          >
            {q.rotulo}
          </button>
        ))}
      </div>
      {pref.mostrar === 'apartir' && (
        <Passo
          rotulo="Aparece com"
          texto={`${aPartirDe}%`}
          menos={aPartirDe > 10 ? () => mudar({ aPartirDe: aPartirDe - 10 }) : null}
          mais={aPartirDe < 90 ? () => mudar({ aPartirDe: aPartirDe + 10 }) : null}
        />
      )}
      <label className="aparencia-linha">
        <span className="aparencia-rotulo">Mostrar o que sobra em vez do usado</span>
        <input
          type="checkbox"
          checked={pref.mostrarRestante}
          onChange={(e) => mudar({ mostrarRestante: e.target.checked })}
        />
      </label>
      <Passo
        rotulo="Âmbar com"
        texto={`${alerta}%`}
        menos={alerta > 5 ? () => mudar({ alerta: alerta - 5 }) : null}
        mais={alerta + 5 < perigo ? () => mudar({ alerta: alerta + 5 }) : null}
      />
      <Passo
        rotulo="Vermelho com"
        texto={`${perigo}%`}
        menos={perigo - 5 > alerta ? () => mudar({ perigo: perigo - 5 }) : null}
        mais={perigo < 100 ? () => mudar({ perigo: perigo + 5 }) : null}
      />
      <CompactarSozinho pref={pref} mudar={mudar} />
    </div>
  )
}

const DICA_SOZINHO = 'Nunca no meio do trabalho: uma tarefa grande passa do limite e só compacta quando acaba.'

/** A17: marcada, o agente compacta sozinho quando termina a tarefa acima do limite. */
function CompactarSozinho({ pref, mudar }: { pref: PrefContexto; mudar(parte: Partial<PrefContexto>): void }): React.JSX.Element {
  const limite = pref.limiteCompactar
  return (
    <>
      <label className="aparencia-linha" title={DICA_SOZINHO}>
        <span className="aparencia-rotulo">Compactar sozinho ao fim da tarefa</span>
        <input
          type="checkbox"
          checked={pref.compactarSozinho}
          onChange={(e) => mudar({ compactarSozinho: e.target.checked })}
        />
      </label>
      {pref.compactarSozinho && (
        <Passo
          rotulo="Compacta com"
          texto={`${limite}%`}
          menos={limite > 10 ? () => mudar({ limiteCompactar: limite - 10 }) : null}
          mais={limite < 90 ? () => mudar({ limiteCompactar: limite + 10 }) : null}
        />
      )}
    </>
  )
}

export function ContextoConfig(): React.JSX.Element {
  const [pref, setPref] = useState(lerPrefContexto)
  // dois cliques antes de redesenhar: o segundo parte do primeiro (como a Aparencia)
  const ultima = useRef(pref)
  const mudar = (parte: Partial<PrefContexto>): void => {
    const nova = { ...ultima.current, ...parte }
    ultima.current = nova
    setPref(nova)
    guardarPrefContexto(nova)
  }
  const padrao = JSON.stringify(pref) === JSON.stringify(PREF_CONTEXTO_PADRAO)
  const resumo = pref.mostrar === 'nunca' ? 'escondido' : pref.mostrar === 'sempre' ? 'sempre' : `a partir de ${pref.aPartirDe}%`

  return (
    <details className="aparencia">
      <summary>
        Contexto da conversa
        <span className="apagado">anel {resumo}</span>
      </summary>
      <div className="contexto-config">
        <Opcoes pref={pref} mudar={mudar} />
        <Previa pref={pref} />
      </div>
      <p className="aparencia-dica apagado">
        O anel fica no cabeçalho de cada agente. O clique oferece compactar a conversa.
        {pref.compactarSozinho && ' Com o compactar sozinho, o Claude compacta quando termina a tarefa acima do limite.'}
        {!padrao && (
          <button className="botao-pequeno" onClick={() => mudar(PREF_CONTEXTO_PADRAO)}>
            Voltar ao padrão
          </button>
        )}
      </p>
    </details>
  )
}
