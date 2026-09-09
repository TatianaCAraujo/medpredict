# MedPredict - MVP funcional

Aplicação acadêmica do Grupo TRAMA para demonstrar como o risco estimado de No-Show pode apoiar confirmações, ações preventivas e recuperação de vagas. O MVP conecta uma experiência mobile do paciente a um painel administrativo usando o mesmo estado compartilhado pela instância local.

> Ambiente demonstrativo: todos os nomes, contatos, consultas, probabilidades e indicadores são fictícios. O aplicativo não utiliza dados pessoais reais nem se conecta a sistemas de saúde ou canais de comunicação externos.

## Como executar

Pré-requisito: Node.js 20 ou superior.

```bash
npm install
npm run dev
```

Acesse no notebook `http://localhost:5173`. No celular conectado à mesma rede, use `http://IP_DO_COMPUTADOR:5173`.

Para gerar e visualizar a versão de produção:

```bash
npm run build
npm run preview
```

## Rotas

| Rota | Experiência |
| --- | --- |
| `/` | Entrada e escolha de perfil |
| `/paciente` | Início mobile do paciente |
| `/paciente/consultas` | Próximas, confirmadas, canceladas e histórico |
| `/paciente/notificacoes` | Central de notificações simuladas |
| `/paciente/preferencias` | Canais e contatos fictícios |
| `/paciente/agendar` | Solicitação demonstrativa de novo agendamento |
| `/admin` | Dashboard administrativo |
| `/admin/agenda` | Agenda inteligente, filtros e detalhe do paciente |
| `/admin/confirmacoes` | Fila priorizada e comunicação simulada |
| `/admin/recuperacao` | Fluxo visual de recuperação de vagas |
| `/admin/fila` | Fila de espera e status |
| `/admin/integracoes` | Arquitetura futura baseada em adapters |
| `/admin/sobre` | Premissas, serviços mock e contrato futuro de risco |

## Modo demonstração

O estado oficial da demonstração é servido em `/api/demo-state` pela própria instância local do Vite e persistido em `.medpredict-demo-state.json`. Os clientes consultam essa fonte periodicamente e as alterações aparecem em outros navegadores/dispositivos em até aproximadamente 1 segundo. `localStorage` e `BroadcastChannel` permanecem apenas como resposta imediata e fallback local.

O botão **Reiniciar demonstração**, disponível no dashboard e em Configurações e sobre, restaura consultas, pacientes, fila, ofertas e comunicações.

### Cenário A - confirmação

1. No dashboard, use o atalho do cenário A para abrir Juliana em outra aba.
2. Observe Juliana com prioridade alta no administrativo.
3. No aplicativo, selecione **Confirmar presença** e confirme no modal.
4. Volte ao administrativo e observe o status **Confirmada**.

### Cenário B - cancelamento e recuperação

1. Reinicie a demonstração.
2. No dashboard, use o atalho do cenário B para abrir Marina.
3. Cancele a consulta das 09:00 e escolha um motivo.
4. O sistema libera a vaga e oferece para Ana Lima, primeira pessoa elegível.
5. Em `/admin/recuperacao`, recuse a primeira oferta.
6. O sistema cria automaticamente uma oferta para Carla Souza.
7. Aceite a segunda oferta.
8. Observe a vaga ocupada novamente e o indicador **Vagas recuperadas** incrementado.

Também é possível selecionar Ana ou Carla no seletor **Perfil demonstrativo** do aplicativo para responder à oferta como paciente.

## Funcionalidades implementadas

- Aplicativo do paciente responsivo e mobile first.
- Entrada demonstrativa sem autenticação.
- Confirmação com data, hora e origem.
- Cancelamento com motivo, protocolo demonstrativo e liberação da vaga.
- Reagendamento demonstrativo com escolha, revisão, confirmação e preservação do horário anterior no histórico.
- Listagem de consultas, notificações e preferências de contato.
- Solicitação demonstrativa de novo agendamento.
- Dashboard, agenda filtrável, detalhe do paciente e fila de confirmação.
- Prioridades baixa, intermediária e alta com texto, ícone e cor.
- `MockRiskService` e contrato `FutureModelRiskService` para futuro `POST /predict`.
- Comunicação registrada por `MockCommunicationService`.
- Fila de espera com 10 pessoas fictícias.
- Seleção transparente por especialidade, unidade, período e posição/prioridade da fila.
- Oferta, aceite, recusa, expiração e avanço automático para o próximo elegível.
- Estado de vaga liberada sem paciente elegível.
- Histórico visual e métricas demonstrativas da recuperação.
- Sincronização entre abas, navegadores e dispositivos conectados à mesma instância local.
- Reinício integral da demonstração.
- Manifesto PWA e service worker básico para a versão de produção.
- Layout responsivo, foco visível, labels, navegação por teclado e suporte a movimento reduzido.

## O que é simulado

- Todas as probabilidades e prioridades de risco.
- WhatsApp, e-mail, ligação telefônica e push.
- Lembretes de 7, 3 e 1 dia e seus históricos.
- Agenda, aprovações e ofertas de vagas.
- Sistema Central da Rede e adapters regionais.
- Solicitação de novo agendamento.
- Probabilidades de risco e comunicações externas; os indicadores são calculados a partir do estado demonstrativo.

Nenhuma mensagem é enviada. Nenhuma integração oficial, API externa, credencial ou serviço pago é utilizado.

## Arquitetura

```text
src/
  components/             Componentes compartilhados
  data/                   Pacientes, consultas e fila fictícios
  pages/
    admin/                Painel da unidade
    paciente/             Aplicativo mobile
  services/
    communication/        Contrato e mock de comunicação
    integrations/         Adapters mock e futuro
    risk/                 RiskService mock e futuro
    waitlist/             Regras da fila e criação de ofertas
  store/                  Contexto, persistência e transições puras
  types/                  Tipos do domínio
  utils/                  Formatação e rótulos
```

## Testes

```bash
npm test
```

A suíte cobre confirmação, cancelamento, reagendamento, sincronização lógica, prioridade visual, preferências, reinício da demo e os fluxos críticos da recuperação de vagas.

## Testar no celular na mesma rede

1. Conecte computador e celular à mesma rede Wi-Fi.
2. Execute `npm run dev`. Esse comando já inicia o Vite com `--host 0.0.0.0` e a API local de estado compartilhado.
3. Identifique o IPv4 do computador no Windows com `ipconfig`.
4. No celular, abra `http://IP_DO_COMPUTADOR:5173`, por exemplo `http://192.168.0.10:5173`.
5. Se necessário, autorize o Node.js no Firewall do Windows apenas para redes privadas.

Notebook e celular devem acessar a mesma instância e porta. O estado é compartilhado pelo processo local; não execute dois servidores Vite separados para a mesma demonstração. O botão **Reiniciar demonstração** substitui também o estado persistido no servidor e todos os clientes o recebem automaticamente.

## Limitações e próximos passos

- Não há backend de produção, autenticação, controle de acesso ou banco institucional. A API embutida existe somente para a demonstração na rede local.
- A sincronização depende de todos os dispositivos alcançarem a mesma instância Vite; operações offline permanecem apenas no navegador até uma nova ação/sincronização.
- O PWA usa cache básico; não há fila offline de operações.
- O modelo oficial de Machine Learning ainda não está conectado ou escolhido.
- Nenhum threshold definitivo está associado a qualquer algoritmo.
- Os limites usados pelo mock servem somente para distribuir os dados fictícios na interface.
- Integrações institucionais dependem de autorização, contratos e definição técnica futura.
- Antes de uso real seriam necessários LGPD, segurança, auditoria, testes clínicos/operacionais e homologação institucional.
