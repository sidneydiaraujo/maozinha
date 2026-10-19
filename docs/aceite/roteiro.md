# Roteiro de aceite da primeira versão (Claude e Claude, lousa livre)

Quem executa: Sidney. Marque cada item e anote o que falhou. O que falhar vira tarefa no `docs/ESTADO.md`.
Item 8 (Claude e ChatGPT) fica para depois: depende de T1.4b e T1.8.

- [ ] 1. Instalar `release/Lousa.ia Setup 0.0.1.exe` e abrir pelo Menu Iniciar. (Windows pode avisar "editor desconhecido": não há assinatura.)
- [ ] 2. A barra de cima mostra um ícone por conta (bolinha verde = logada). Clique no ícone: aparece o cartão com o e-mail. Renomear "Principal" para "Empresa" (duplo clique no nome).
- [ ] 3. "Entrar"/"Trocar login": a janela não mostra terminal; anima "Abrindo o navegador" → "Autorize no navegador" → ✓ com o e-mail e fecha sozinha. Para outro e-mail: "Copiar link", janela anônima e, se pedir, colar o código.
- [ ] 4. "+ Novo quadro" (ou arrastar o cartão "Pessoal" para a lousa) → "Outra pasta…" → uma pasta em `C:\Users\sidne\pessoal\` → "Abrir agente": o cabeçalho mostra 📁 a pasta e o selo da conta.
- [ ] 5. Duplo clique no vazio → marcar "Empresa" → pasta da empresa → Enter.
- [ ] 6. Duas contas, pastas diferentes: `/status` mostra a conta certa em cada quadro; o cabeçalho mostra conta e pasta.
- [ ] 7. Duas contas, mesma pasta: "+ Novo quadro", outra conta, mesma pasta; o segundo vira "<pasta> 2"; `/status` confere.
- [ ] 8. (adiado) Claude e ChatGPT.
- [ ] 9. Num terminal da conta pessoal: `$env:GITHUB_TOKEN`, `$env:HOME` vazios e `$env:CLAUDE_CONFIG_DIR` = pasta pessoal. Na empresa: tudo vazio. (A Lousa já prova isso em teste automático; aqui é conferir com os olhos.)
- [ ] 10. Arrastar a lousa pelo vazio (ou com o botão do meio, até por cima dos quadros), arrastar quadros pelo cabeçalho, redimensionar, mexer no zoom, fechar e abrir: tudo no lugar, cada quadro na sua conta.
- [ ] 11. "Outra pasta…" com uma pasta que já está na lista: não duplica, só marca a existente.
- [ ] 12. Na janela "Novo quadro", "×" numa pasta → "Tirar": fecha os quadros daquela pasta, arquivos intactos.
- [ ] 13. Abrir a Lousa pela primeira vez depois da atualização: os quadros antigos aparecem no mesmo lugar, sem moldura.
- [ ] 14. Num agente com conversa: selo da conta → outra conta → "Trocar": o Claude reinicia na mesma pasta e continua a mesma conversa (pergunte algo que só a conversa sabe).
- [ ] 15. Fechar e abrir a Lousa: cada agente retoma a sua conversa.
- [ ] 16. Uma resposta do Claude com tabela e emoji (❌ 🟡 ✅): nenhuma palavra quebrada ou misturada.
- [ ] 17. Engrenagem (canto de cima, à esquerda): painel com todas as contas. "+ Nova conta" → Claude → "Teste" cria o ícone e o cartão "Teste" (sem login); "Entrar" nele abre o login. (Para apagar depois: a pasta `C:\Users\sidne\.claude-teste`.)
- [ ] 18. Arrastar o ícone de uma conta (no alto) para a lousa abre a janela "Novo quadro" com essa conta.
- [ ] 19. Lateral "Pastas": cada pasta em uso aparece com bolinhas das contas dos quadros dela; clicar abre e fecha em cascata; `.git` não aparece.
- [ ] 20. Peça a um agente para criar um `.md` numa pasta aberta na árvore: ele aparece sozinho. Abra esse `.md` no leitor, feche a pasta na árvore e peça para mudar o arquivo: o leitor recarrega com "atualizado agora". (Não existe mais "Alterados agora" nem marca amarela, D17.)
- [ ] 20b. Com a pasta `C:\Users\sidne` na lateral e um agente trabalhando por alguns minutos, digitar em outro terminal responde na hora, e nenhum erro "A JavaScript error occurred in the main process" aparece.
- [ ] 21. Clicar num `.md` abre o leitor ao lado, formatado ("Ver código" mostra o texto puro); clicar num `.ts`/`.json` mostra o código com número de linha; a borda direita do leitor muda a largura.
- [ ] 22. Clicar num `.pdf`/`.docx`/`.xlsx` abre no programa do Windows; um `.exe` ou `.bat` nunca abre (só "Mostrar na pasta").
- [ ] 23. Num agente, peça algo que precise de permissão (ex.: "crie um arquivo teste.md"). Quando o Claude perguntar, o quadro fica com borda âmbar, o selo diz "pedindo permissão" e aparece "● 1 esperando você" no alto. Com a Lousa minimizada, aparece uma notificação do Windows e a barra de tarefas pisca; clicar na notificação traz a Lousa e mostra o quadro.
- [ ] 24. Quando o Claude termina, o selo diz "terminou" (e o quadro brilha até você clicar nele). Com dois agentes esperando, cada clique em "● 2 esperando você" mostra um deles.
- [ ] 25. No terminal: selecione um texto e aperte Ctrl+C (copia; sem seleção, o Ctrl+C continua interrompendo). Ctrl+V cola. Botão direito: com seleção copia, sem seleção cola.
- [ ] 26. Um link `https://...` que o Claude escrever abre no navegador; um caminho de arquivo da pasta (ex.: `docs/ESTADO.md`) abre no leitor ao lado.
- [ ] 27. Duplo clique no cabeçalho de um quadro (ou ⤢) amplia o quadro na tela; de novo volta. Ctrl+roda do mouse dentro do terminal aumenta e diminui a letra, e o tamanho fica guardado.
- [ ] 28. Rolar para cima num agente com uma conversa longa mostra bem mais que antes (até 10 mil linhas).
- [ ] 29. Num quadro de terminal, digite `exit`: aparece "Terminal encerrado · Reabrir"; "Reabrir" volta com um terminal novo (num agente, o Claude retoma a conversa).
- [ ] 30. Feche a Lousa maximizada e abra de novo: volta maximizada. Engrenagem → "Abrir pasta de registros" abre a pasta com o arquivo do dia.

## Fatia 10 — cópia separada (git worktree)

- [ ] 31. Com um agente já aberto numa pasta que é repositório git (ex.: `lousa-ia`), "+ Novo quadro" na mesma pasta: a caixa "Cópia separada (branch própria)" já vem marcada, com a frase "Já tem um quadro nesta pasta". "Abrir agente": o quadro novo mostra 📁 `lousa-ia ⑂ claude-N`; passando o mouse no nome aparece a pasta `...\lousa-ia.copias\claude-N` e a branch `lousa/claude-N`. No agente, `git branch --show-current` confirma.
- [ ] 32. Peça ao agente da cópia para mudar um arquivo: o agente da pasta original não vê a mudança (`git status` limpo lá). Feche o quadro da cópia sem commit: aparece "Cópia mantida em …: tem alterações…" e a pasta continua na lista e no disco.
- [ ] 33. Abra um quadro nessa cópia de novo (ela aparece na lista de pastas), peça um commit e feche: aparece "Cópia apagada; os commits ficaram na branch lousa/claude-N". Na pasta original, `git log lousa/claude-N` mostra o commit e `git merge lousa/claude-N` junta o trabalho.
- [ ] 34. Abra uma cópia e feche sem mexer em nada: "Cópia separada apagada: todo o trabalho dela já estava na pasta original." A pasta `...\lousa-ia.copias\claude-N` sumiu e `git branch` não lista a branch.

## Fatia 11 — juntar a cópia

- [ ] 35. Numa cópia separada, peça ao agente para mudar algo e fazer commit. "Juntar" no cabeçalho do quadro: a janela diz quantos commits e arquivos (+/−) e "para juntar em main" (ou a branch em que a pasta original estiver). "Juntar em main" → ✓; o arquivo aparece na pasta original. "Fechar o quadro e apagar a cópia" → a cópia e a branch somem.
- [ ] 36. Conflito: mude a mesma linha do mesmo arquivo na cópia e na original (com commit nos dois). "Juntar" mostra "Conflito: os dois lados mudaram …" e a pasta original fica igual (`git status` limpo). Com alteração sem commit na cópia, a janela avisa e não junta.

## Fatia 12 — achar rápido

- [ ] 37. Ctrl+K (até com o cursor dentro de um terminal): abre a caixa "Quadro, pasta ou arquivo…". Digite parte do nome de uma pasta: aparecem os quadros dela e "Novo quadro em <pasta>". Enter num quadro leva a lousa até ele; Enter em "Novo quadro em…" abre a janelinha com a pasta já marcada (e não cria nada sozinho).
- [ ] 38. Ctrl+K e digite parte do nome de um arquivo (ex.: `estado`): aparece `ESTADO.md` com a pasta embaixo; Enter abre no leitor. Nada de dentro de `node_modules` aparece.
- [ ] 39. Num terminal com bastante texto, Ctrl+F: digite uma palavra; aparece "N de M" e a palavra fica selecionada; Enter vai para a próxima, Shift+Enter volta, Esc fecha e o cursor volta ao terminal.

## Fatia 13 — a mesma mensagem para vários quadros

- [ ] 40. Com dois ou três agentes abertos, segure Ctrl e clique no cabeçalho de dois deles (ou Shift+arrastar no vazio em volta): aparece no pé da lousa "Para 2 quadros". Escreva "diga oi" e Enter: os dois agentes recebem e respondem; o terceiro não. Shift+Enter quebra a linha sem enviar.
