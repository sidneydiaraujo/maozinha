# Fatia 8 — Uma semana sem ajustes

Entrega: o que faltava para o Sidney trabalhar uma semana com a Lousa sem voltar
para ajustes. O agente avisa quando para (quadro brilha e o Windows mostra uma
notificação), o terminal copia, cola e abre links como o Windows Terminal, um
quadro pode ser ampliado, um terminal encerrado reabre com a conversa, os erros
ficam num arquivo e a janela lembra o tamanho.

Origem: pergunta do Sidney em 18/10/2026 ("tem mais alguma que poderíamos
adiantar para que eu possa trabalhar uma semana sem fazer nenhum outro ajuste?")
e o "pode seguir com o recomendado" (D16).

---

## Como o Claude avisa que parou (lido no `claude.exe` instalado)

Lido no próprio executável do Claude Code (`~\.local\bin\claude.exe`, sem rodar):

- **Campainha e notificação:** `preferredNotifChannel = auto` só avisa em
  iTerm2, kitty, Ghostty e Terminal do Mac. Em qualquer outro terminal o modo
  é `no_method_available`: não manda nada.
- **Program Status Protocol (OSC 7501)**, novo na 2.1.295 ("terminals that
  implement it can show whether Claude Code is working, waiting on you, or
  done"). Na abertura o Claude pergunta `ESC ] 7501 ; ? BEL`. Se o terminal
  responder com um OSC 7501 que começa com `?`, ele passa a mandar
  `ESC ] 7501 ; state=<estado>:app=claude-code[:kind=..][:msg=<base64>] BEL`.
  Estados: `working`, `blocked` (`kind` = `permission`, `question` ou `auth`),
  `done`, `idle`, `error`, `clear`. Linha com `id=` é de subagente: ignorada.
- **ConPTY (console do Windows):** provado com um programa simulado.
  - A saída OSC 7501 passa intacta.
  - A resposta crua (`ESC ] 7501 ; ? BEL`) **some** no console antes de chegar ao
    programa, tanto com BEL quanto com ST.
  - A mesma resposta escrita como teclas no modo `win32-input-mode`
    (`ESC [ 0;0;<código>;1;0;1 _` por caractere, o modo que o próprio ConPTY
    pede com `ESC [ ? 9001 h`) chega inteira, tanto no modo VT quanto no modo
    cru do libuv.

## Como a Lousa faz (decisões nossas)

- O main lê a saída de cada terminal de quadro. Viu a pergunta 7501: responde
  na hora, com teclas no `win32-input-mode`. A resposta é sempre o mesmo texto
  fixo, nunca um dado vindo da saída.
- Só o estado do agente principal vale. Muda o estado: o main manda
  `terminais:estado` para a tela. Se o novo estado é `esperando`, `terminou` ou
  `erro` e a janela não está em foco, mostra uma notificação do Windows e pisca
  na barra de tarefas. Clicar na notificação traz a janela e enquadra o quadro.
- Copiar e colar passam pelo main (`clipboard` do Electron), porque a tela não
  tem permissão de área de transferência (o main nega todas).
- Links no terminal usam a API de links do próprio xterm (`registerLinkProvider`
  e `linkHandler`). Não entra dependência nova. Caminho de arquivo abre no
  leitor e só dentro da pasta do quadro (o main confere, como na T7.1).
- Registros num arquivo por dia em `%APPDATA%\lousa-ia\logs`, guardados por
  14 dias, com e-mails mascarados e nunca o conteúdo dos terminais.

---

## T8.1 Aviso do agente no main

**Arquivos:**
- `src/main/terminais/status.ts` (+ teste): leitor do OSC 7501, que aceita
  pedaços cortados, e a resposta em teclas.
- `src/main/terminais/servico.ts` (+ teste): `status: true` no `PedidoAbrir` e
  o ouvinte `aoEstado`.
- `src/main/avisos/notificar.ts`: notificação e barra de tarefas.
- `src/main/avisos/texto.ts` (+ teste): o texto de cada aviso.
- `handlers/terminais.ts`, `contexto.ts`, `src/shared/*`, preload.

**Canais:**

| Canal | Entrada | Saída |
|---|---|---|
| `terminais:abrir` | igual | + `aviso: AvisoAgente \| null` (último estado) |
| `terminais:estado` | evento | `{ terminalId, aviso }` |
| `quadros:focar` | evento | `{ quadroId }` (clique na notificação) |

## T8.2 Aviso na tela

O quadro mostra um selo:
- "trabalhando";
- "esperando você" (borda âmbar pulsando);
- "terminou";
- "erro".

O brilho apaga quando o Sidney clica no quadro. Na barra de cima, "● N
esperando você": cada clique enquadra o próximo quadro que pede atenção. O
minimapa pinta esses quadros de âmbar.

## T8.3 Copiar, colar e links no terminal

- **Ctrl+C:** com texto selecionado copia; sem seleção interrompe, como sempre.
- **Ctrl+Shift+C:** copia.
- **Ctrl+V e Ctrl+Shift+V:** colam.
  - Se a área de transferência não tem texto, o Ctrl+V segue para o programa
    (o Claude cola imagem com ele).
- **Botão direito:** copia a seleção ou, sem seleção, cola (igual ao Windows
  Terminal).
- **Links:** `http(s)` sublinhado abre no navegador. Caminho de arquivo
  (`src/a.ts`, `docs/ESTADO.md:12`, `C:\...\x.md` dentro da pasta) abre no
  leitor, e documento abre no programa do Windows.
  - Caminho longo que o terminal quebrou em duas linhas continua um link só.
- **Canais:** `app:copiar { texto }` e `app:colar` → `string`.

## T8.4 Histórico, ampliar e tamanho da letra

- **Histórico:** 10.000 linhas no terminal (antes 1.000). O main guarda 1 MB
  para remontar (antes 200 KB).
- **Ampliar:** duplo clique no cabeçalho (ou o botão ⤢) enquadra o quadro na
  tela. Outro duplo clique volta para a vista anterior. Posição e tamanho dos
  quadros não mudam.
- **Tamanho da letra:** Ctrl+roda do mouse dentro do terminal muda a letra
  (9 a 24), guardada por quadro.

## T8.5 Reabrir terminal encerrado

Se o processo do terminal sai, o quadro mostra "Terminal encerrado (código N)
· Reabrir". Reabrir remonta o terminal, e o main abre um novo. O agente retoma
a mesma conversa (`--resume`, T6.1).

## T8.6 Registros em arquivo

**Arquivos:** `src/main/registros.ts` (+ teste), `log.ts` (+ teste),
`index.ts`, `ipc.ts`.

**O que vai para o arquivo:**
- abertura e fechamento do app (versão);
- erro de qualquer canal (nome do canal + mensagem);
- erro não tratado no main;
- tela que caiu;
- erro da tela (`app:erroDaTela`);
- terminal que saiu (id + código);
- aviso mostrado (só o estado).

**Canal:** `app:abrirRegistros` abre a pasta, pelo botão "Abrir pasta de
registros" no painel da engrenagem.

## T8.7 Janela lembra tamanho e posição

**Arquivos:** `src/main/janela/estadoJanela.ts` (+ teste) e `window.ts`.

**Regras:**
- Ao fechar, guarda posição, tamanho e "maximizada" em `janela.json`.
- Ao abrir, usa o salvo só se a janela couber em alguma tela ligada.
  - Monitor desligado: tamanho padrão.
- O smoke não lê nem grava `janela.json`.

## T8.8 Aceite

Itens 23 a 30 do `docs/aceite/roteiro.md`.
