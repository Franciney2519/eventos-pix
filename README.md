# App Ingresso

Aplicação completa para gerenciamento de eventos, inscrições, confirmação manual de pagamento via PIX, emissão de ingressos com QR Code e check-in no dia do evento.

## Visão geral

Três perfis de acesso:

- **CUSTOMER** (participante) — compra ingressos, envia comprovante, acompanha status, acessa seus ingressos.
- **ADMIN** — gerencia eventos, analisa e aprova/rejeita pagamentos, acompanha indicadores e exporta relatórios.
- **CHECKIN** — acessa somente a área de check-in: leitura de QR Code, busca manual e histórico.

Fluxo principal: participante escolhe evento e quantidade → envia comprovante PIX → pedido fica `WAITING_PAYMENT_REVIEW` → admin aprova → sistema emite N tickets com token único cada → e-mail é enviado via SendGrid → operador valida o QR Code de cada ticket na entrada, bloqueando reuso.

## Stack

- Next.js 14 (App Router) + TypeScript + React
- Tailwind CSS
- Supabase (Postgres, Auth, Storage)
- SendGrid (e-mail transacional)
- `react-qr-code` (exibição de QR) / `html5-qrcode` (leitura via câmera)
- `zod` + `react-hook-form` (validação de formulários)
- `date-fns`, `lucide-react`
- `vitest` (testes)

## Arquitetura

```
src/
  app/                  rotas (App Router), Server Components por padrão
    (customer)/         layout protegido do participante (grupo de rotas)
    admin/               layout protegido do administrador
    checkin/              layout protegido do operador de check-in
    api/                  Route Handlers (check-in em tempo real, export CSV)
  features/              lógica de negócio por domínio
    auth/                 cadastro, login, logout, recuperação de senha
    events/                CRUD de eventos
    orders/                 criação de pedidos, aprovação/rejeição (RPC)
    tickets/                 emissão, cancelamento, reenvio de e-mail
    checkin/                  validação e confirmação de entrada
    reports/                    indicadores e exportação CSV
    participants/, profile/, users/
    cada feature separa repository.ts (acesso a dados) de actions.ts
    (Server Actions — regras sensíveis nunca rodam no cliente) e components/
  lib/                    auth/session, supabase clients, validação (zod),
                          regras de negócio puras e testáveis (orders/rules,
                          checkin/rules, tickets/token)
  emails/                 templates HTML + sendTicketsIssuedEmail/sendOrderRejectedEmail
  middleware.ts           proteção de rotas por sessão + papel
supabase/
  migrations/             schema completo, RLS e funções RPC transacionais
scripts/seed.ts           dados de desenvolvimento
```

### Decisões importantes

- **Regras críticas vivem no Postgres, não no frontend.** `approve_order`,
  `reject_order`, `confirm_checkin` e `cancel_ticket` são funções `SECURITY
  DEFINER` que fazem locking de linha (`FOR UPDATE`) e updates condicionais
  (`WHERE status = 'AVAILABLE'`), garantindo que aprovação dupla não gere
  tickets duplicados e que dois check-ins simultâneos do mesmo QR não passem
  os dois. Cada função também revalida o papel do usuário internamente.
- **RLS em todas as tabelas.** Participantes só leem os próprios dados;
  ADMIN e CHECKIN têm políticas específicas por tabela. As Server Actions
  chamam o Postgres com o client vinculado à sessão do usuário (não o
  service role), então a RLS é a segunda camada de defesa mesmo que uma
  verificação de papel no código falhe.
- **Tokens de ingresso** são 32 bytes aleatórios (`crypto.randomBytes`),
  nunca derivados de IDs sequenciais — impossível de adivinhar.
- **Comprovantes** ficam em bucket privado do Storage; o admin só os vê via
  URL assinada com expiração de 10 minutos, gerada sob demanda.
- **Server Actions vs. Route Handlers:** operações de formulário (criar
  evento, aprovar pedido, etc.) usam Server Actions. O scanner de check-in
  usa Route Handlers (`/api/checkin/*`) porque precisa ser chamado
  repetidamente por um componente client-side de forma independente de
  navegação de página. Exportação de CSV também é um Route Handler (streaming
  de download).

## Banco de dados

Ver `supabase/migrations/0001_init.sql` (schema + RLS + funções) e
`0002_storage.sql` (buckets `payment-proofs` privado e `event-images`
público).

Tabelas: `profiles`, `events`, `orders`, `payment_proofs`, `tickets`,
`checkins`, `email_logs`.

## Variáveis de ambiente

Copie `.env.example` para `.env.local` e preencha:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SENDGRID_API_KEY=
SENDGRID_FROM_EMAIL=
SENDGRID_FROM_NAME=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

`SUPABASE_SERVICE_ROLE_KEY` e `SENDGRID_API_KEY` só são usados em código
server-only (`import "server-only"`) — nunca chegam ao bundle do cliente.

## Configuração do Supabase

1. Crie um projeto em https://supabase.com.
2. Em **Project Settings → API**, copie a URL, a `anon key` e a
   `service_role key` para o `.env.local`.
3. Rode as migrations (veja a seção abaixo).
4. Em **Authentication → URL Configuration**, defina o Site URL como
   `http://localhost:3000` (ou a URL da Vercel em produção) e adicione
   `.../**` em Redirect URLs.
5. Os buckets de Storage são criados automaticamente pela migration
   `0002_storage.sql` — nada a fazer manualmente.

### Como criar/rodar as migrations

Com a [Supabase CLI](https://supabase.com/docs/guides/cli) instalada:

```bash
supabase login
supabase link --project-ref <seu-project-ref>
supabase db push
```

Ou cole o conteúdo de `supabase/migrations/0001_init.sql` e
`0002_storage.sql`, nessa ordem, no SQL Editor do painel Supabase.

## Configuração do SendGrid

1. Crie uma conta em https://sendgrid.com e gere uma API Key com permissão
   de envio (**Mail Send**).
2. Verifique um remetente (Single Sender ou domínio autenticado) — o
   endereço usado deve bater com `SENDGRID_FROM_EMAIL`.
3. Preencha `SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL` e `SENDGRID_FROM_NAME`
   no `.env.local`.

Sem essas variáveis, a aprovação de pedidos continua funcionando
normalmente (é transacional e independente do e-mail), mas o envio falha e
fica registrado em `email_logs` com `status = FAILED` — o admin pode usar
"Reenviar e-mail" depois de corrigir a configuração.

## Como instalar e executar

```bash
npm install
cp .env.example .env.local   # preencha com suas credenciais
npm run dev
```

Acesse http://localhost:3000.

## Como rodar o seed

Com `.env.local` preenchido (precisa da `SUPABASE_SERVICE_ROLE_KEY`):

```bash
npm run seed
```

Cria (idempotente — pode rodar de novo sem duplicar usuários/evento):

- **Admin:** `admin@demo.com` / `Senha123!`
- **Check-in:** `checkin@demo.com` / `Senha123!`
- **Participante:** `participante@demo.com` / `Senha123!` — já tem 3 ingressos aprovados, 1 já utilizado (check-in)
- **Participante 2 e 3:** `participante2@demo.com` / `participante3@demo.com` — pedidos pendentes de análise
- 1 evento (`Workshop de Inovação`) com inscrições abertas

## Como rodar os testes

```bash
npm test          # roda uma vez
npm run test:watch
```

Os testes cobrem as regras de negócio críticas como funções puras
(`src/lib/**/*.test.ts`), sem depender de banco: cálculo de total, controle
de capacidade (incluindo o mesmo guard usado por `approve_order`), geração
de token único, transições de status de check-in (bloqueio de reuso de QR,
ingresso cancelado, ingresso inexistente) e extração de token a partir da
URL escaneada.

```bash
npm run lint
npm run typecheck
```

## Como testar o fluxo completo manualmente

1. `npm run seed` para ter um evento e usuários prontos.
2. Acesse `/cadastro`, crie uma conta nova (ou use `participante2@demo.com`).
3. Vá em `/eventos`, abra o evento, escolha 3 ingressos, clique em
   Continuar, copie a chave PIX, envie qualquer imagem/PDF como comprovante
   e clique em Enviar solicitação.
4. Faça login como `admin@demo.com`, acesse `/admin/solicitacoes`, abra o
   pedido, visualize o comprovante (URL assinada) e clique em **Aprovar
   pagamento**.
5. O sistema cria exatamente 3 tickets e envia o e-mail (ou registra a
   falha em `email_logs`, se o SendGrid não estiver configurado).
6. Logado como o participante, acesse `/meus-ingressos` — 3 QR Codes
   diferentes.
7. Faça login como `checkin@demo.com`, acesse `/checkin`, selecione o
   evento, abra a câmera (ou use a busca manual) e confirme a entrada do
   primeiro ticket.
8. Tente validar o mesmo QR novamente — o sistema deve mostrar "Ingresso já
   utilizado" e bloquear. Os outros 2 tickets continuam `AVAILABLE`.

## Deploy na Vercel

1. Importe o repositório na Vercel.
2. Configure as mesmas variáveis de ambiente do `.env.local` em
   **Project Settings → Environment Variables** (produção e preview).
3. Atualize `NEXT_PUBLIC_APP_URL` para o domínio final antes do primeiro
   deploy (ele é usado nos links de e-mail e na URL codificada no QR Code).
4. Atualize o Site URL / Redirect URLs no Supabase Auth para o domínio da
   Vercel.
5. Deploy automático a cada push — o build (`next build`) falha se houver
   erro de tipo, então o typecheck já roda implicitamente.

## Como configurar o primeiro administrador

Não existe cadastro de admin pela UI (por segurança). Duas opções:

- Rode `npm run seed` (cria `admin@demo.com` com papel `ADMIN`).
- Ou, em produção: crie a conta normalmente pela tela de cadastro
  (`/cadastro`) e depois promova o papel diretamente no Supabase, no SQL
  Editor:
  ```sql
  update profiles set role = 'ADMIN' where email = 'seu-email@dominio.com';
  ```
  A partir daí, esse admin pode promover outros usuários a `ADMIN` ou
  `CHECKIN` em `/admin/usuarios`.

## Limitações conhecidas (MVP)

- A reserva de capacidade só acontece na aprovação (não há "hold" temporário
  enquanto um pedido está pendente), conforme especificado — em picos de
  demanda extrema múltiplos pedidos pendentes podem, juntos, exceder a
  capacidade; a checagem final e definitiva acontece de forma atômica dentro
  de `approve_order`, então nunca há overbooking real, mas um admin pode
  precisar rejeitar pedidos pendentes que não couberem mais.
- Rate limiting está delegado à infraestrutura (Vercel/Supabase) — não há um
  limitador de requisições customizado no código.
- E-mails de "pedido rejeitado" e reenvio de ingressos são melhor esforço:
  se o SendGrid falhar, a operação de negócio (aprovação/rejeição) já foi
  commitada e não é desfeita; a falha fica em `email_logs` para reenvio.
- A busca de participantes no check-in carrega os tickets do evento e
  filtra em memória — adequado para a escala alvo (~100–a few hundred
  participantes por evento), não para volumes muito maiores.

## Sugestões para uma v2

- Fila de retry automático para e-mails com `status = FAILED`.
- Reserva temporária (hold) de capacidade enquanto um pedido está pendente,
  com expiração automática.
- Multi-organização (múltiplos organizadores com seus próprios eventos e
  times).
- Webhook de confirmação automática de PIX (integração com provedor de
  pagamento) reduzindo a análise manual a exceções.
- Notificações push/SMS além de e-mail.
- Testes end-to-end (Playwright) cobrindo o fluxo completo pela UI.
