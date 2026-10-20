import { useEffect, useState } from 'react'
import type { DiffArquivo } from '../../../shared/model'
import { mensagemDe } from '../componentes/erro'

const MARCA = { trecho: '', mais: '+', menos: '−', igual: ' ' } as const

/**
 * O que a copia mudou num arquivo (T22.1, D31): verde entrou, vermelho saiu, cinza ficou igual.
 * Aparece dentro da janela "Juntar", no lugar da lista; "← Arquivos" volta.
 */
export function VistaDiff(p: { repoId: string; caminho: string; aoVoltar(): void }): React.JSX.Element {
  const { repoId, caminho, aoVoltar } = p
  const [diff, setDiff] = useState<DiffArquivo | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    let ativo = true
    window.lousa.copias
      .diff(repoId, caminho)
      .then((d) => ativo && setDiff(d))
      .catch((e: unknown) => ativo && setErro(mensagemDe(e)))
    return () => {
      ativo = false
    }
  }, [repoId, caminho])

  return (
    <div className="diff">
      <div className="diff-topo">
        <button className="botao-pequeno" onClick={aoVoltar}>
          ← Arquivos
        </button>
        <span className="diff-caminho" title={caminho}>
          {caminho}
        </span>
      </div>
      {erro && (
        <p className="erro" role="alert">
          {erro}
        </p>
      )}
      {!diff && !erro && <p>Lendo a diferença…</p>}
      {diff && (
        <pre className="diff-linhas">
          {diff.linhas.map((l, i) => (
            <div key={i} className={`diff-${l.tipo}`}>
              <span className="diff-marca">{MARCA[l.tipo]}</span>
              {l.tipo === 'trecho' ? `··· ${l.texto}` : l.texto}
            </div>
          ))}
          {diff.linhas.length === 0 && <div className="diff-trecho">Sem diferença de texto (arquivo binário ou só renomeado).</div>}
        </pre>
      )}
      {diff?.cortada && <p className="juntar-aviso">Diferença grande: mostrando só o começo.</p>}
    </div>
  )
}
