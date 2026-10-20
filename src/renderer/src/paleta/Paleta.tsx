import { useEffect, useMemo, useState } from 'react'
import type { PerfilComConta, Quadro, Repo } from '../../../shared/model'
import '../estilos/paleta.css'
import { useMensagens } from '../lousa/useMensagens'
import { useListaVistas } from '../lousa/vistas'
import { itemDeArquivo, itensDeAcao, itensDeMensagem, itensDeVista, itensLocais, type ItemPaleta } from './itens'

interface Props {
  repos: Repo[]
  quadros: Quadro[]
  perfis: PerfilComConta[]
  aoEscolher(item: ItemPaleta): void
  aoFechar(): void
}

const ICONE = { quadro: '▣', pasta: '+', arquivo: '📄', mensagem: '★', novaNota: '📝', vista: '◫' } as const

/** Arquivos do main, 150 ms depois da ultima tecla (a busca anda pelas pastas). */
function useArquivos(texto: string, repos: Repo[]): ItemPaleta[] {
  const [achados, setAchados] = useState<ItemPaleta[]>([])
  useEffect(() => {
    if (texto.trim().length < 2) {
      setAchados([])
      return
    }
    let ativo = true
    const relogio = window.setTimeout(() => {
      window.lousa.arquivos
        .buscar(texto)
        .then((r) => ativo && setAchados(r.map((a) => itemDeArquivo(a, repos))))
        .catch(() => ativo && setAchados([]))
    }, 150)
    return () => {
      ativo = false
      window.clearTimeout(relogio)
    }
  }, [texto, repos])
  return achados
}

/** Ctrl+K (T12.1): digitar filtra; setas escolhem; Enter faz; Esc fecha. */
export function Paleta({ repos, quadros, perfis, aoEscolher, aoFechar }: Props): React.JSX.Element {
  const [texto, setTexto] = useState('')
  const [marcado, setMarcado] = useState(0)
  const arquivos = useArquivos(texto, repos)
  const { mensagens } = useMensagens()
  const vistas = useListaVistas()
  const itens = useMemo(
    () => [
      ...itensDeAcao(texto),
      ...itensLocais(repos, quadros, perfis, texto),
      ...itensDeMensagem(mensagens, texto),
      ...arquivos,
      ...itensDeVista(vistas, texto),
    ],
    [repos, quadros, perfis, texto, arquivos, mensagens, vistas],
  )
  const atual = Math.min(marcado, Math.max(0, itens.length - 1))

  function aoTecla(e: React.KeyboardEvent): void {
    if (e.key === 'Escape') aoFechar()
    else if (e.key === 'ArrowDown') setMarcado((atual + 1) % Math.max(1, itens.length))
    else if (e.key === 'ArrowUp') setMarcado((atual - 1 + itens.length) % Math.max(1, itens.length))
    else if (e.key === 'Enter' && itens[atual]) aoEscolher(itens[atual])
    else return
    e.preventDefault()
    // A janelinha "Novo quadro" abre durante este mesmo Enter e escuta Enter na janela:
    // sem parar aqui, ela criaria um agente sozinha.
    e.stopPropagation()
  }

  return (
    <div className="paleta-fundo" onMouseDown={(e) => e.target === e.currentTarget && aoFechar()}>
      <div className="paleta" role="dialog" aria-label="Ir para">
        <input
          autoFocus
          className="paleta-campo"
          placeholder="Quadro, pasta ou arquivo…"
          value={texto}
          onChange={(e) => {
            setTexto(e.target.value)
            setMarcado(0)
          }}
          onKeyDown={aoTecla}
        />
        <ul className="paleta-lista" role="listbox">
          {itens.map((item, i) => (
            <li
              key={item.chave}
              role="option"
              aria-selected={i === atual}
              className={i === atual ? 'paleta-item marcado' : 'paleta-item'}
              onMouseEnter={() => setMarcado(i)}
              onMouseDown={(e) => e.preventDefault()} // o campo nao perde o foco
              onClick={() => aoEscolher(item)}
            >
              <span className="paleta-icone" aria-hidden="true">
                {ICONE[item.tipo]}
              </span>
              <span className="paleta-titulo">{item.titulo}</span>
              <span className="paleta-detalhe">{item.detalhe}</span>
            </li>
          ))}
          {itens.length === 0 && <li className="paleta-vazia">Nada encontrado</li>}
        </ul>
      </div>
    </div>
  )
}
