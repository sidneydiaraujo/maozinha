# Fatia 34 — O agente cria colegas (A19, D56)

Pedido do Sidney (29/10/2026): "além do usuário do programa abrir os terminais pra gerar um time,
quero que a partir do pedido dentro de um terminal ele consiga criar novos quadros e direcionar a
eles o que precisa ser feito se o usuário pedir." Em 30/10: "pode seguir com a implementação".

## Como funciona

1. Cada agente Claude abre com `--mcp-config <dados>\agentes\<id>.mcp.json`: um servidor MCP do
   próprio Mãozinha, HTTP só em `127.0.0.1`, porta do Windows, **uma chave por quadro**.
2. A ferramenta é uma só: `criar_colegas({ colegas: [{ papel, tarefa }] })`, de 1 a 4 por pedido.
   O settings do agente a libera (`permissions.allow`), para o Claude não perguntar duas vezes.
3. O main mostra na tela "Claude 1 quer criar N colegas", com o papel e a tarefa de cada um.
   Só o clique cria; Esc, clique fora ou "Recusar" recusa; sem resposta em 5 minutos, nada nasce.
   Um pedido aberto por agente.
4. Aceito: cada colega nasce como o da bolinha (`criarColega`: mesma conta, cópia própria quando a
   pasta é git, ligado a quem pediu, mesmo modelo e esforço), empilhado à direita, com o papel. A
   tarefa vai para a fila do colega (`FilaMensagens.enfileirar`) e é digitada quando ele fica pronto,
   depois da apresentação do time.
5. A resposta volta ao agente: quem nasceu, ou que o usuário recusou ou não respondeu.

## Segurança

- Quem pode falar com o servidor (`conferirPedido`): só `POST /mcp`, `Host` do próprio PC (contra
  DNS rebinding), sem `Origin` (nenhuma página da web) e com a chave de um quadro aberto. Pedido de
  até 64 KB. A chave morre quando o quadro sai da lousa.
- O agente só escolhe o papel e o texto da tarefa. Conta, pasta e comando continuam do main (D11).
- A chave fica em `<dados>\agentes`, nunca nas pastas das contas.

## Arquivos

`src/main/mcp/protocolo.ts` (puro: JSON-RPC e conferência do pedido), `mcp/servidor.ts` (HTTP),
`time/pedidos.ts` (puro: a espera pelo clique), `montagens.ts` (`montarPedidos`), `agentes/ponte.ts`
(`prepararMcp`, permissão), `terminais/comandos.ts` (`--mcp-config`), `terminais/alvo.ts`
(`mcpDoQuadro`), `handlers/time.ts` (`time:responderPedido`), tela `lousa/PedidoColegas.tsx`.

**Pronto quando:** testes do protocolo, do servidor por HTTP de verdade e dos pedidos verdes; prova
`pedir-colegas` (sem Claude: o PowerShell chama a ferramenta) mostra a pergunta, cria o colega
ligado com o papel no clique e recusa no Esc.

## Fora desta fatia

- O Codex (também aceita MCP, mas precisa de teste próprio).
- O resultado do colega voltar sozinho a quem pediu (a linha vai de quem pediu para o colega).
- Teste com o Claude de verdade: fica para o aceite (o Sidney não autorizou gastar a conta antes).
