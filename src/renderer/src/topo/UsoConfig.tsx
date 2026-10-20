// Secao "Uso das contas" do painel da engrenagem (A4): o uso fica a vista na barra de cima ou so
// no clique do icone (as barrinhas da T20.2). Vale na hora para todas as contas.
import { guardarUsoAVista, useUsoAVista } from './usoAVista'

const OPCOES = [
  { aVista: true, rotulo: 'À vista' },
  { aVista: false, rotulo: 'Só no clique' },
]

export function UsoConfig(): React.JSX.Element {
  const aVista = useUsoAVista()
  return (
    <details className="aparencia">
      <summary>
        Uso das contas
        <span className="apagado">{aVista ? 'à vista' : 'só no clique'}</span>
      </summary>
      <div className="aparencia-fontes" role="radiogroup" aria-label="Uso das contas na barra de cima">
        {OPCOES.map((o) => (
          <button
            key={o.rotulo}
            type="button"
            role="radio"
            aria-checked={aVista === o.aVista}
            className="aparencia-opcao"
            onClick={() => guardarUsoAVista(o.aVista)}
          >
            {o.rotulo}
          </button>
        ))}
      </div>
      <p className="aparencia-dica apagado">
        À vista: sessão e semana de cada conta Claude ao lado do ícone, como um relógio. Âmbar a partir de 70%,
        vermelho a partir de 90%.
      </p>
    </details>
  )
}
