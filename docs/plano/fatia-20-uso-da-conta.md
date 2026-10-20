# Fatia 20 — Uso da sessão e da semana em cada conta

Entrega: cada ícone de conta na barra de cima ganha duas barras finas, uma para as 5 horas
e outra para os 7 dias, com o percentual usado. O balão da conta mostra "Sessão 42% · zera
em 2h10" e "Semana 18% · zera sex 09:00", como o "Account & Usage" do VSCode.

Origem: avaliação de 19/10/2026, item "uso de sessão e da semana". Decisão: D24.
Depende de: Fatia 17.
**Diferença do VSCode:** o VSCode mostra também o limite semanal só do Sonnet; a linha de
status do Claude não traz esse número.

## Orçamento de contexto (teto 35%)

Leia só: `CLAUDE.md`, o topo do `docs/ESTADO.md`, este arquivo, `PainelAgente` em
`src/shared/model.ts`, `src/main/agentes/ponte.ts` (Fatia 17), `topo/IconeConta.tsx`,
`topo/useContas.ts`, `topo/BarraTopo.tsx` e `estilos/topo.css`.

## T20.1 Uso por conta (main)

**Arquivos:** `src/main/agentes/uso.ts` (+ teste), `agentes/ponte.ts`, `src/shared/ipc.ts`
(`perfis:uso` e o evento `perfis:usoMudou`), preload.

**Interface:**
```ts
export interface UsoConta { perfilId: PerfilId; cincoHoras: Limite | null; semana: Limite | null; quando: number }
export function juntarUso(atual: UsoConta | undefined, novo: PainelAgente, perfilId: PerfilId): UsoConta
```

**Regras:**
- Cada conta fica com o painel mais novo de qualquer agente dela (o quadro sabe a conta).
- Limite com `zeraEm` no passado vira "zerado" (0%), sem precisar de um agente aberto.
- Só em memória: ao abrir o app, aparece "sem dado ainda" até um agente daquela conta falar.

**Testes:** o mais novo vence; outra conta não mistura; o que já zerou; painel sem limites
mantém o anterior.

## T20.2 Barras no alto

**Arquivos:** `topo/UsoConta.tsx`, `topo/uso.ts` (+ teste: "zera em 2h10", "zera sex
09:00", "há 12 min"), `topo/IconeConta.tsx`, `estilos/topo.css`.

**Regras:**
- Duas barras de 2 px sob o ícone. A cor muda em 70% e 90% (os mesmos limiares do anel).
- O balão diz há quanto tempo o dado chegou ("visto há 12 min"). Dado com mais de 1 h fica
  em cinza.
- Conta Codex: nada (fica para a Fatia 9).

**Pronto quando:** `npm run check` e `npm run smoke` verdes; cenário `painel` com duas
contas e fotos das barras e do balão.

**Commit (T20.1 + T20.2):** `feat: session and weekly usage bars on each account`

## T20.3 Aceite

Item 48: depois de uma resposta de um agente da conta, as barras aparecem e batem com o
"Account & Usage" do VSCode na mesma conta.
