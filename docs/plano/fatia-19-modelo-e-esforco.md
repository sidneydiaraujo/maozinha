# Fatia 19 — Trocar modelo e esforço no quadro

Entrega: no cabeçalho de cada agente, "Opus ▾" e "alto ▾" trocam o modelo (Opus, Sonnet,
Haiku) e o nível de esforço da conversa sem sair dela. A escolha fica guardada no quadro e
volta na próxima abertura.

Origem: avaliação de 19/10/2026, item "trocar o modelo e os níveis de esforço". Decisão: D24.
Depende de: Fatia 17 (o que está valendo de fato vem do painel do agente).

## Orçamento de contexto (teto 35%)

Leia só: `CLAUDE.md`, o topo do `docs/ESTADO.md`, este arquivo, `Quadro` em
`src/shared/model.ts`, `terminais/comandos.ts` (+ teste), `terminais/alvo.ts`,
`quadros/servico.ts`, o trecho `quadros:*` de `src/shared/ipc.ts` e o handler dele,
`estado/armazem.ts` (só o schema), `lousa/QuadroNode.tsx` e `lousa/ContaDoQuadro.tsx` (como
modelo de menu no cabeçalho).

## T19.1 Modelo e esforço no quadro (main)

**Arquivos:** `src/shared/model.ts`, `estado/armazem.ts` (schema), `terminais/comandos.ts`
(+ teste), `quadros/servico.ts` (+ teste), `src/shared/ipc.ts` (`agentes:ajustar`), handler
com zod, preload, `docs/ARQUITETURA.md`.

**Interface:**
```ts
export const MODELOS = ['opus', 'sonnet', 'haiku'] as const      // aliases do CLI
export const ESFORCOS = ['low', 'medium', 'high', 'xhigh', 'max'] as const
// Quadro ganha: modelo?: Modelo; esforco?: Esforco   (opcionais: estado antigo continua valendo, sem migração)
agentes: { ajustar(quadroId: string, mudanca: { modelo?: Modelo; esforco?: Esforco }): Promise<void> }
```

**Regras:**
- `comandoAgente` acrescenta `--model <x>` e `--effort <y>` quando o quadro tem.
- `agentes:ajustar` guarda no quadro e, com o agente aberto e parado, o main escreve
  `/model <x>\r` ou `/effort <y>\r` no terminal (as duas existem no CLI 2.1.304). Trabalhando,
  só guarda e avisa "vale quando o agente parar". Quem monta o texto é o main, a partir do enum.
- Terminal comum ou Codex: recusa.

**Testes:** `comandoAgente` com e sem modelo/esforço, junto com `--resume`; `ajustar` recusa
valor fora da lista; estado sem os campos carrega.

## T19.2 Seletores no cabeçalho

**Arquivos:** `lousa/ModeloDoQuadro.tsx`, `lousa/QuadroNode.tsx`, `estilos/quadro.css`.

**Regras:**
- O rótulo mostra o que o **painel do agente** diz estar valendo (Fatia 17). Antes do
  primeiro painel, mostra o guardado no quadro, em cinza.
- Esforço em português: baixo, médio, alto, muito alto, máximo. Se depois de mudar o painel
  continuar com o valor antigo (nível que o modelo não aceita), o rótulo avisa "este modelo
  não aceita esse nível".
- Menu igual ao da conta do quadro (mesmo componente de lista, em portal).

**Pronto quando:** `npm run check` e `npm run smoke` verdes; cenário `painel` com o Claude
falso recebendo `/model sonnet` e `/effort high` e foto dos rótulos.

**Commit (T19.1 + T19.2):** `feat: pick the model and effort of each agent board`

## T19.3 Aceite

Item 47: trocar Opus → Sonnet e alto → médio no meio da conversa; fechar e abrir o app: o
quadro volta com Sonnet/médio.
