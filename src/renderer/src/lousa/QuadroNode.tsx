import { NodeResizer, type NodeProps } from '@xyflow/react'
import { useEffect, useState } from 'react'
import type { Quadro, Repo } from '../../../shared/model'
import { caminhoNoRepo } from '../componentes/links'
import { Terminal } from '../componentes/Terminal'
import '../estilos/quadro.css'
import { chamaAtencao, seloDoAviso } from './atencao'
import { BotaoPrint } from './BotaoPrint'
import { ContaDoQuadro } from './ContaDoQuadro'
import { JanelaJuntar } from './JanelaJuntar'
import type { AcoesLousa, QuadroNo } from './nos'
import { atencao, useAtencao } from './useAtencao'

/** "esperando você", "terminou"... no cabecalho (T8.2); a frase do Claude aparece ao parar o mouse. */
function SeloAgente({ quadroId }: { quadroId: string }): React.JSX.Element | null {
  const aviso = useAtencao(quadroId)?.aviso
  const selo = aviso ? seloDoAviso(aviso) : null
  if (!selo) return null
  return (
    <span className={`selo-agente ${selo.classe}`} title={aviso?.mensagem}>
      {selo.texto}
    </span>
  )
}

/**
 * O terminal do quadro. Se o processo sair (T8.5), aparece "Terminal encerrado · Reabrir":
 * reabrir remonta o terminal e o main abre um novo (o agente retoma a conversa, T6.1).
 */
interface PropsCorpo {
  quadro: Quadro
  repo: Repo
  acoes: AcoesLousa
  /** O cabecalho so mostra o 📎 com o terminal aberto (T16.1). */
  aoEncerrado(encerrado: boolean): void
}

function CorpoQuadro({ quadro, repo, acoes, aoEncerrado }: PropsCorpo): React.JSX.Element {
  const [geracao, setGeracao] = useState(0)
  const [saida, setSaida] = useState<{ chave: string; codigo: number } | null>(null)
  // trocar a conta tambem remonta: a saida de um terminal antigo nao vale para o novo
  const chave = `${quadro.perfilId}:${geracao}`
  const encerrado = saida?.chave === chave
  useEffect(() => aoEncerrado(encerrado), [encerrado, aoEncerrado])
  // caminho citado no terminal: so os de dentro da pasta do quadro viram link (T8.3)
  const arquivos = {
    aceita: (texto: string) => caminhoNoRepo(repo.caminho, texto) !== null,
    abrir: (texto: string) => {
      const relativo = caminhoNoRepo(repo.caminho, texto)
      if (relativo) acoes.abrirArquivo(repo.id, relativo)
    },
  }
  return (
    <div className="quadro-corpo">
      <Terminal
        key={chave}
        alvo={{ tipo: 'quadro', quadroId: quadro.id }}
        aoSair={(codigo) => setSaida({ chave, codigo })}
        aoAviso={(aviso) => atencao.aplicar(quadro.id, aviso)}
        arquivos={arquivos}
      />
      {encerrado && (
        <div className="quadro-encerrado nodrag" role="status">
          <span>Terminal encerrado (código {saida.codigo})</span>
          <button className="botao-pequeno botao-principal" onClick={() => setGeracao((g) => g + 1)}>
            Reabrir
          </button>
        </div>
      )}
    </div>
  )
}

/**
 * Quadro solto na lousa (D13, D14): a pasta da o nome (onde o trabalho fica) e o selo
 * diz a conta (quem paga). Trocar a conta remonta o terminal, que retoma a conversa.
 */
export function QuadroNode({ data, selected }: NodeProps<QuadroNo>): React.JSX.Element {
  const { quadro, perfil, repo, rotulo, contas, acoes } = data
  const chamando = chamaAtencao(useAtencao(quadro.id))
  const [juntando, setJuntando] = useState(false)
  const [encerrado, setEncerrado] = useState(false)
  return (
    <div
      className={chamando ? 'quadro quadro-chamando' : 'quadro'}
      data-quadro={quadro.id}
      style={{ '--cor': perfil?.cor ?? '#555' } as React.CSSProperties}
      onMouseDownCapture={() => chamando && atencao.marcarVisto(quadro.id)}
    >
      <NodeResizer minWidth={360} minHeight={220} isVisible={selected} />
      <header
        className="cabecalho-quadro"
        title="Duplo clique amplia o quadro na tela · Ctrl+clique seleciona vários (para mandar a mesma mensagem)"
        onDoubleClick={(e) => {
          if (!(e.target as Element).closest('button')) acoes.ampliar(quadro.id)
        }}
      >
        <span
          className="quadro-pasta"
          title={repo.copia ? `${repo.caminho}\nCópia separada · branch ${repo.copia.branch}` : repo.caminho}
        >
          <span aria-hidden="true">📁</span> {rotulo}
        </span>
        {quadro.tipo === 'terminal' && <span className="etiqueta">terminal</span>}
        <SeloAgente quadroId={quadro.id} />
        {quadro.tipo === 'agente' && !encerrado && <BotaoPrint quadroId={quadro.id} />}
        <ContaDoQuadro
          perfil={perfil}
          contas={contas}
          tipo={quadro.tipo}
          aoTrocar={(perfilId) => acoes.trocarConta(quadro.id, perfilId)}
        />
        {repo.copia && (
          <button
            className="botao-pequeno botao-juntar nodrag"
            title={`Juntar o trabalho da branch ${repo.copia.branch} na pasta original`}
            onClick={() => setJuntando(true)}
          >
            Juntar
          </button>
        )}
        <button
          className="botao-ampliar nodrag"
          title="Ampliar na tela (de novo para voltar)"
          aria-label={`Ampliar ${rotulo}`}
          onClick={() => acoes.ampliar(quadro.id)}
        >
          ⤢
        </button>
        <button
          className="botao-fechar nodrag"
          aria-label={`Fechar ${rotulo}`}
          onClick={() => acoes.removerQuadro(quadro.id)}
        >
          ×
        </button>
      </header>
      <CorpoQuadro quadro={quadro} repo={repo} acoes={acoes} aoEncerrado={setEncerrado} />
      {juntando && (
        <JanelaJuntar
          repo={repo}
          cor={perfil?.cor ?? '#555'}
          quadro={quadro}
          aoFechar={() => setJuntando(false)}
          aoFecharQuadro={() => {
            setJuntando(false)
            acoes.removerQuadro(quadro.id)
          }}
        />
      )}
    </div>
  )
}
