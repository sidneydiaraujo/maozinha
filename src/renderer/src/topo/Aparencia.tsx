// Secao "Aparencia do terminal" do painel da engrenagem (T15.1): fonte, tamanho, entrelinha e
// paleta. Vale na hora para todos os terminais abertos (eles escutam guardarAparencia).
import { useRef, useState } from 'react'
import '../estilos/aparencia.css'
import {
  APARENCIA_PADRAO,
  ENTRELINHA_MAIOR,
  ENTRELINHA_MENOR,
  familiaDaFonte,
  FONTES,
  guardarAparencia,
  lerAparencia,
  PALETAS,
  TAMANHO_MAIOR,
  TAMANHO_MENOR,
  temaDoXterm,
  type Aparencia as Escolha,
  type NomePaleta,
} from '../componentes/tema'

const NOME_PALETA: Record<NomePaleta, { rotulo: string; dica: string }> = {
  lousa: { rotulo: 'Lousa', dica: 'ardósia e giz' },
  abyss: { rotulo: 'Abyss', dica: 'o tema do VSCode' },
}

const AMOSTRA_ANSI = ['red', 'green', 'yellow', 'blue', 'magenta', 'cyan'] as const

const decimal = (n: number): string => n.toFixed(1).replace('.', ',')

interface PropsPasso {
  rotulo: string
  texto: string
  /** null = no limite: o botao fica desligado */
  menos: (() => void) | null
  mais: (() => void) | null
}

/** Valor com − e + (tambem usado na secao do contexto, T18.2). */
export function Passo({ rotulo, texto, menos, mais }: PropsPasso): React.JSX.Element {
  return (
    <div className="aparencia-linha">
      <span className="aparencia-rotulo">{rotulo}</span>
      <span className="aparencia-passo">
        <button className="botao-pequeno" aria-label={`${rotulo} menor`} disabled={!menos} onClick={menos ?? undefined}>
          −
        </button>
        <output className="aparencia-valor">{texto}</output>
        <button className="botao-pequeno" aria-label={`${rotulo} maior`} disabled={!mais} onClick={mais ?? undefined}>
          +
        </button>
      </span>
    </div>
  )
}

function AmostraPaleta({ paleta }: { paleta: NomePaleta }): React.JSX.Element {
  const t = temaDoXterm(paleta)
  return (
    <span className="aparencia-amostra" style={{ background: t.background, color: t.foreground }}>
      <span>
        PS <span style={{ color: t.blue }}>C:\repo</span>&gt; <span style={{ color: t.yellow }}>claude</span>
      </span>
      <span className="aparencia-cores">
        {AMOSTRA_ANSI.map((cor) => (
          <i key={cor} style={{ background: t[cor] }} />
        ))}
      </span>
    </span>
  )
}

function Opcoes({ aparencia, mudar }: { aparencia: Escolha; mudar(parte: Partial<Escolha>): void }): React.JSX.Element {
  const { tamanho, entrelinha } = aparencia
  const linha = (n: number): number => Math.round(n * 10) / 10
  return (
    <>
      <div className="aparencia-fontes" role="radiogroup" aria-label="Fonte">
        {FONTES.map((f) => (
          <button
            key={f}
            type="button"
            role="radio"
            aria-checked={aparencia.fonte === f}
            className="aparencia-opcao"
            style={{ fontFamily: familiaDaFonte(f) }}
            onClick={() => mudar({ fonte: f })}
          >
            {f}
          </button>
        ))}
      </div>
      <Passo
        rotulo="Tamanho"
        texto={String(tamanho)}
        menos={tamanho > TAMANHO_MENOR ? () => mudar({ tamanho: tamanho - 1 }) : null}
        mais={tamanho < TAMANHO_MAIOR ? () => mudar({ tamanho: tamanho + 1 }) : null}
      />
      <Passo
        rotulo="Entrelinha"
        texto={decimal(entrelinha)}
        menos={entrelinha > ENTRELINHA_MENOR ? () => mudar({ entrelinha: linha(entrelinha - 0.1) }) : null}
        mais={entrelinha < ENTRELINHA_MAIOR ? () => mudar({ entrelinha: linha(entrelinha + 0.1) }) : null}
      />
      <div className="aparencia-paletas" role="radiogroup" aria-label="Cores">
        {PALETAS.map((p) => (
          <button
            key={p}
            type="button"
            role="radio"
            aria-checked={aparencia.paleta === p}
            className="aparencia-opcao aparencia-paleta"
            onClick={() => mudar({ paleta: p })}
          >
            <AmostraPaleta paleta={p} />
            <strong>{NOME_PALETA[p].rotulo}</strong>
            <small>{NOME_PALETA[p].dica}</small>
          </button>
        ))}
      </div>
    </>
  )
}

export function Aparencia(): React.JSX.Element {
  const [aparencia, setAparencia] = useState(lerAparencia)
  // Dois cliques antes de a tela redesenhar: o segundo parte do primeiro, nao do valor antigo.
  const ultima = useRef(aparencia)
  const mudar = (parte: Partial<Escolha>): void => {
    const nova = { ...ultima.current, ...parte }
    ultima.current = nova
    setAparencia(nova)
    guardarAparencia(nova)
  }
  const padrao = JSON.stringify(aparencia) === JSON.stringify(APARENCIA_PADRAO)

  return (
    <details className="aparencia">
      <summary>
        Aparência do terminal
        <span className="apagado">
          {aparencia.fonte} {aparencia.tamanho} · {NOME_PALETA[aparencia.paleta].rotulo}
        </span>
      </summary>
      <Opcoes aparencia={aparencia} mudar={mudar} />
      <p className="aparencia-dica apagado">
        Vale para todos os quadros. Ctrl+roda num quadro muda só a letra dele.
        {!padrao && (
          <button className="botao-pequeno" onClick={() => mudar(APARENCIA_PADRAO)}>
            Voltar ao padrão
          </button>
        )}
      </p>
    </details>
  )
}
