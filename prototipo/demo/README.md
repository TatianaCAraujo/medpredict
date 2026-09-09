# Demonstração automatizada do MedPredict

Camada de apresentação local e independente. Os overlays e controles são injetados apenas pelo Playwright e não fazem parte da aplicação normal.

## Executar

Pré-requisitos: Node.js 20 ou superior e dependências instaladas.

```bash
npm install
npm run demo
```

`npm run demo` garante que o Chromium do Playwright esteja disponível, inicia o Vite automaticamente e grava somente a área do aplicativo. Se já houver um `npm run dev` ativo em `http://127.0.0.1:5173`, a demo reutiliza esse servidor.

O vídeo final é salvo em `demo/output/medpredict-demo-final.webm`, com resolução de 1440 × 900 pixels. As versões anteriores não são sobrescritas.

## Controles

- `ESPAÇO`: pausar ou continuar
- `SETA DIREITA`: avançar imediatamente para a próxima pausa ou ação
- `R`: reiniciar o roteiro e restaurar os dados fictícios
- `ESC`: interromper a apresentação

As teclas são reconhecidas quando a janela do Chromium está em foco. Ao pausar durante um overlay, o tempo de leitura também é pausado.

## Roteiro

O fluxo restaura o estado inicial antes da gravação, apresenta as áreas do portal da Marina, cancela sua consulta e registra o histórico. Em seguida, mostra a vaga no ADM, a recusa de Ana Lima, o aceite de Carla Souza, a consulta e o histórico da Carla, e encerra com a recuperação e o dashboard atualizados.

Nenhum canal externo é acionado. Toda a execução usa a aplicação local e os serviços mockados existentes.
