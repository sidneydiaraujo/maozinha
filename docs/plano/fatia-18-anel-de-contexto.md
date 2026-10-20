# Fatia 18 — Anel de contexto no quadro

Entrega: no cabeçalho de cada agente, um anel mostra quanto do contexto da conversa já foi
usado. Ele é configurável na engrenagem, e o clique oferece compactar a conversa (`/compact`).

Origem: avaliação de 19/10/2026, item "indicador de contexto configurável". Decisão: D24.
O VSCode tem uma pizza que só aparece depois de 50% e não deixa configurar. Aqui o
Sidney escolhe.
Depende de: Fatia 17.

## Orçamento de contexto (teto 35%)

Leia só: `CLAUDE.md`, o topo do `docs/ESTADO.md`, este arquivo, `PainelAgente` em
`src/shared/model.ts`, `lousa/QuadroNode.tsx`, `lousa/useAtencao.ts` (como modelo de hook
que escuta evento), `topo/Aparencia.tsx` (da Fatia 15) e `estilos/quadro.css`.

## T18.1 Anel e regras de exibição

**Arquivos:** `src/renderer/src/lousa/contexto.ts` (+ teste), `lousa/AnelContexto.tsx`,
`lousa/usePainel.ts`, `lousa/QuadroNode.tsx`, `estilos/quadro.css`.

**Interface:**
```ts
export interface PrefContexto { mostrar: 'sempre' | 'apartir' | 'nunca'; aPartirDe: number; mostrarRestante: boolean; alerta: number; perigo: number }
export const PREF_CONTEXTO_PADRAO: PrefContexto // apartir, 50, false, 70, 90
export function vistaDoContexto(usado: number | null, pref: PrefContexto):
  { visivel: false } | { visivel: true; numero: number; texto: string; nivel: 'ok' | 'alerta' | 'perigo' }
```

**Regras:**
- Anel em SVG com o número no meio. Cor normal, âmbar a partir de `alerta` e vermelho a
  partir de `perigo`. O balão diz "62% do contexto usado (124 mil de 200 mil)".
- Sem dado ainda (agente recém-aberto): não aparece.
- Clique: confirma "Compactar a conversa agora?". Só manda `/compact` com o agente parado
  (estado do OSC 7501 `idle` ou `done`); trabalhando, o botão fica cinza com "espere o
  agente parar". Quem escreve no terminal é o main (canal `agentes:compactar { quadroId }`),
  nunca um texto vindo da tela.
- A mudança de número não anima a cada atualização (lição da D17): troca o texto só quando
  muda pelo menos 1 ponto.

**Testes:** `vistaDoContexto` com nunca/sempre/apartir, restante (100 − usado), os dois
limiares e o `null`.

## T18.2 Configurar na engrenagem

**Arquivos:** `topo/Aparencia.tsx` (seção "Contexto"), `lousa/contexto.ts` (ler e guardar
no `localStorage`, como a Aparência).

**Regras:** "Mostrar: sempre / a partir de X% / nunca", "Mostrar o que sobra em vez do
usado" e os dois limiares, com prévia do anel ao lado. Vale na hora para todos os quadros.

**Pronto quando:** `npm run check` e `npm run smoke` verdes; cenário `painel` com fotos do
anel em 30%, 75% e 95% e do "Compactar" recusado com o agente trabalhando.

**Commit (T18.1 + T18.2):** `feat: context ring on agent boards with compact and settings`

## T18.3 Aceite

Item 46: numa conversa longa, o anel aparece, muda de cor e o "Compactar" funciona.
