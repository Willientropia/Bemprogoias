# Estado atual do projeto — Bem para Goiás

Este documento descreve **como o sistema funciona hoje**, sem histórico de como chegou até aqui.
Para o passo a passo de implementação, ver [`PROGRESS.md`](./PROGRESS.md). Para o status do
painel do gestor, ver [`PAINEL_GESTOR_STATUS.md`](./PAINEL_GESTOR_STATUS.md). Para a
especificação do produto, ver [`Bem_para_Goias_App_Spec.md`](./Bem_para_Goias_App_Spec.md).

> **Para o Dev B:** as seções que mais te interessam são
> [Coleção `voters`](#coleção-voters--o-contrato-mais-importante-para-o-dev-b) (o schema que o
> app do líder precisa gravar) e [O que ainda não existe](#o-que-ainda-não-existe).

## Stack

React (Vite) + Firebase (Auth + Firestore), plano gratuito (Spark) — sem Cloud Functions.
Mapa com Leaflet + react-leaflet (OpenStreetMap, sem chave de API).

## Papéis e autenticação

Três papéis: `super_admin`, `manager`, `leader`. O papel **não** fica em custom claims do token —
fica no Firestore, em dois lugares com propósitos diferentes:

```
users/{uid}                            # espelho mínimo, só pra sessão saber quem é
  role: "super_admin" | "manager" | "leader"
  campaignId: string | null            # null para super_admin

campaigns/{campaignId}/members/{uid}   # perfil completo, isolado por campanha
  role, campaignId, name, email, whatsapp, createdAt
  # líder também tem: regiao, bairro, lat, lng, raioKm
  # e as métricas agregadas: eleitores, eleitoresValidados, hoje, semana, perf
```

`users/{uid}` existe só porque, ao logar, o app ainda não sabe em qual campanha procurar o
usuário — é sempre um `get()` de documento único. Os dados "de verdade" vivem em `members`, cujo
isolamento entre campanhas vem da própria estrutura do caminho (subcoleção dentro de
`campaigns/{campaignId}`), não de um filtro de campo.

No client, `AuthContext` (`src/contexts/AuthContext.jsx`) escuta `users/{uid}` em tempo real
(`onSnapshot`) — qualquer mudança de papel se reflete na sessão automaticamente, sem relogar.
`ProtectedRoute` (`src/components/ProtectedRoute.jsx`) bloqueia rotas por papel.

## Como usuários são criados

Não existe cadastro público — todo usuário é criado por alguém acima na hierarquia, pela UI
(sem Cloud Functions):

- **Super Admin** — script local (`node scripts/createSuperAdmin.js <email> <senha>`, usa
  `firebase-admin` + `serviceAccountKey.json`).
- **Gestor** — criado pelo Super Admin em `/super-admin/campaigns/:campaignId`.
- **Líder** — criado pelo Gestor em `/manager` (seção "Cadastro de Líderes"). Hoje o cadastro
  **exige WhatsApp** e um ponto de atuação no mapa (região, bairro, coordenadas e raio).

A criação (`src/services/userProvisioning.js`):

1. Usa uma **instância secundária do Firebase App** no client para chamar
   `createUserWithEmailAndPassword` — evita que a sessão de quem está criando seja substituída
   pela do usuário recém-criado (comportamento padrão do SDK).
2. Grava `users/{uid}` e `campaigns/{campaignId}/members/{uid}` numa mesma `writeBatch`.

## Coleção `voters` — o contrato mais importante para o Dev B

`campaigns/{campaignId}/voters/{voterId}` já existe, tem Security Rules, índices publicados e é
consumida pelo painel do gestor (seção Eleitores). **O app do líder ainda não grava nada aqui** —
esse é o ponto de partida do Dev B.

O schema abaixo é o que o painel do gestor espera hoje. Ele foi definido pelo gerador de dados
demonstrativos (`scripts/demoVoterFactory.js`) e é a referência a seguir:

```
campaigns/{campaignId}/voters/{voterId}
  # identificação (spec seção 2.3)
  name, normalizedName        # normalizedName = minúsculo sem acentos, para busca
  rg                          # string
  titulo                      # string | null  (opcional pelo spec)
  zona, secao                 # string
  whatsapp                    # "(62) 9 1234-5678"

  # vínculo e localização
  leaderId                    # uid do líder dono — as rules dependem disto
  leaderName, regiao, bairro, endereco
  lat, lng                    # number
  locationMode                # "gps" | "manual" | "pin"
  locationModeLabel           # rótulo legível do modo acima

  # origem e validação
  source                      # como o contato aconteceu
  validationStatus            # "validado" | "pendente" | "revisao"
  validationMethod            # ex.: "documento_contato", "auditoria_manual"
  validationReason            # texto explicando o resultado
  validationChecks            # { requiredFields, uniqueDocument, contactConfirmed, geoCoherent }
  validatedAt                 # Date | null

  # controle
  syncStatus                  # "sincronizado" — usar para a fila offline
  createdAt                   # Date
  isDemo                      # true apenas nos registros de seed
```

**Pontos de atenção:**

- `leaderId` é o que as Security Rules usam para isolar: o líder só lê e escreve documentos em
  que `leaderId == request.auth.uid`. Gravar outro valor é rejeitado pelo servidor.
- `validationStatus` alimenta o ranking e as estrelas do gestor — **apenas `validado` conta**.
  Quem define o status é o processo de validação, não o líder.
- `normalizedName` existe porque o Firestore não faz busca case/acento-insensitive. Se o app do
  líder gravar sem esse campo, a busca do gestor não encontra o eleitor.
- `isDemo: true` marca registros de seed. Os scripts de limpeza só removem documentos com essa
  marca — registros reais nunca são apagados por engano.
- A **deduplicação por RG/título** (spec 2.3) ainda não está implementada em lugar nenhum.

### O fluxo de escrita já está coberto por testes

`tests/firestore.rules.test.js` cobre o ciclo completo que o app do líder vai executar —
cadastrar, editar, remover e ler eleitores — **inclusive as tentativas que devem falhar**:

| Cenário | Resultado esperado |
|---|---|
| Líder cadastra eleitor com o próprio `leaderId` | permitido |
| Líder cadastra em nome de outro líder | **bloqueado** |
| Líder cadastra em outra campanha | **bloqueado** |
| Líder edita / remove eleitor próprio | permitido |
| Líder edita / remove eleitor de outro líder | **bloqueado** |
| Líder lê eleitor próprio (`get` direto) | permitido |
| Líder lê eleitor de outro líder | **bloqueado** |
| Usuário não autenticado cadastra | **bloqueado** |
| Gestor cadastra/remove na própria campanha | permitido |
| Gestor cadastra em outra campanha | **bloqueado** |

Ou seja: o servidor já rejeita as escritas indevidas — o app do líder não precisa (e não deve)
confiar em validação só no client. Se uma escrita falhar com `permission-denied`, o motivo mais
provável é `leaderId` diferente do uid autenticado.

### Serviço de leitura já pronto

`src/services/voters.js` já resolve paginação e contagens, e pode ser reusado:

- `fetchVoterStats(campaignId)` — total, últimos 7 dias, validados e taxa de validação
  (usa `getCountFromServer`, não baixa os documentos).
- `fetchVotersPage({ campaignId, leaderId, validationStatus, cursor })` — página de 50 com
  cursor, filtrável por líder e status.

## Regras de acesso (Security Rules)

Validadas por testes automatizados (`tests/firestore.rules.test.js`, via `npm run test:rules`,
no Firestore Emulator) — o isolamento entre campanhas foi comprovado em teste, não só lido.

| Coleção | Super Admin | Gestor (própria campanha) | Líder (própria campanha) |
|---|---|---|---|
| `users/{uid}` | leitura/escrita total | cria/edita apenas o espelho de líderes da própria campanha | lê o próprio |
| `campaigns/{id}` | leitura/escrita total | leitura + **apenas** WhatsApp e horário do relatório | leitura |
| `campaigns/{id}/members` | leitura/escrita total | lista/lê/cria/edita apenas líderes da própria campanha | lê apenas o próprio (não lista) |
| `campaigns/{id}/voters` | leitura/escrita total | leitura/escrita | lê/escreve **apenas os próprios** (`leaderId == uid`) |

O isolamento em `members` e `voters` vem da estrutura do caminho (subcoleção), não de filtro de
campo — padrão confirmado pelos testes.

### Índices publicados

Compostos em `voters`, necessários para as consultas do painel:
`leaderId + createdAt`, `validationStatus + createdAt`, `leaderId + validationStatus + createdAt`.

## Painéis existentes hoje

- **`/login`** — login por e-mail e senha, com mensagens de erro específicas por caso.
- **`/super-admin`** — CRUD completo de campanhas.
- **`/super-admin/campaigns/:campaignId`** — CRUD completo de gestores + lista dos líderes.
- **`/manager`** — painel do gestor, com sidebar de cinco seções:
  - **Regiões** — mapa Leaflet com os líderes plotados (marcador + círculo de raio), KPIs,
    filtro de desempenho, card do líder selecionado e atalho para o WhatsApp dele.
  - **Rede de Indicações** — pódio e ranking por eleitores validados, com rating em estrelas.
  - **Eleitores** — KPIs, produção por líder, busca, filtros e tabela com evidência de validação.
  - **Relatório Expresso** — fechamento diário no WhatsApp do gestor, com horário configurável.
  - **Cadastro de Líderes** — o CRUD real (única seção que não é demonstrativa).

A sidebar recolhe no desktop (preferência persistida) e vira drawer no celular.

## Campanha de demonstração

Existe uma campanha marcada com `isDemo: true` no Firestore, populada por seeds idempotentes:

- `scripts/seedDemoCampaign.js` — 15 líderes fictícios em `members` (+ espelhos em `users`).
  Somados ao líder real já cadastrado, são 16 no mapa.
- `scripts/seedDemoVoters.js` — no máximo 300 eleitores, distribuídos de forma desigual entre os
  líderes (de 44 a 3 cadastros), 273 deles validados. Remove apenas registros `isDemo`.

Quando `campaign.isDemo` é true, o painel exibe um aviso no topo das seções analíticas, para
ninguém confundir número ilustrativo com dado real. **O painel lê tudo do Firestore** — a
constante `DEMO_LEADERS` só é importada pelo script de seed, nunca pela UI. Ou seja: uma campanha
real percorre exatamente o mesmo caminho de dados.

## Como o rating é calculado

O rating é **relativo à campanha**, não absoluto (`src/pages/manager/panel/leaderMetrics.js`):
o líder com mais eleitores validados recebe 5,0; o com menos recebe 1,0; os demais são
interpolados. Empates recebem a mesma nota. Só `validationStatus == "validado"` entra na conta.

Isso diverge do handoff original (que usava uma escala fixa por volume) — a escala relativa foi
escolhida para a nota continuar significando alguma coisa em campanhas de qualquer tamanho.
Pela mesma razão, as faixas de cor de `weeklyColor` estão calibradas para a base demonstrativa de
300 eleitores e **vão precisar ser recalibradas** quando o volume real chegar.

## Testes

`npm test` roda tudo: **63 testes de componente** (`tests/component/`, Vitest + Testing Library,
mockam os `services/*.js`, ~6s) e **34 testes de Security Rules**
(`tests/firestore.rules.test.js`, sobem e derrubam o Firestore Emulator sozinhos).

Se `test:rules` falhar com "port taken", o `pretest:rules` já mata o emulador travado
automaticamente. Se os testes de componente falharem com "Vitest failed to find the current
suite" logo após editar um arquivo, é cache do Vite:
`rm -rf node_modules/.vite node_modules/.vitest`.

## Ambiente e credenciais

- Projeto Firebase: `bemprogoias-80ab1` (Auth + Firestore, plano Spark/gratuito).
- Credenciais do client em `.env` (não versionado — ver `.env.example`).
- `serviceAccountKey.json` (credencial de admin dos scripts) também não é versionado.
- Repositório: `github.com/Willientropia/Bemprogoias` (público) — `main` está sincronizado.

## O que ainda não existe

### Escopo do Dev B (trilha "Campo & Eleitores")
- **App do líder** — não existe nenhuma tela para o papel `leader`. Hoje ele consegue logar, mas
  não há rota para onde ir.
- **Cadastro de eleitor pelo líder** — a coleção, as rules e os índices estão prontos; falta o
  formulário e a escrita.
- **Deduplicação por RG/título** — nada implementado.
- **Os três modos de localização** — o schema já prevê `locationMode`, mas a captura por GPS,
  digitação e pin no mapa não existe. O componente de mapa do gestor
  (`panel/RegionsTab.jsx`) pode servir de base para o "pin no mapa".
- **Offline-first** — a persistência do Firestore já está ligada em `services/firebase.js`, mas
  a fila de sync, o tratamento de conflito e a dedup no reconecte não existem.
- **Capacitor (APK) e PWA** — nenhum empacotamento configurado.

### Escopo do Dev A
- Validação visual do painel nos breakpoints (desktop/tablet/celular).
- Classificação de desempenho (`alto`/`medio`/`alerta`) ainda é atribuída no seed, não calculada
  por regra auditável.
- Números estáticos da demo (demandas, Rádio Peão IA, presença nos conselhos) seguem fixos em
  `DEMO_STATIC_STATS` — nenhum tem origem no sistema.
- Disparo automático do relatório: o botão abre o WhatsApp com a mensagem pronta; o agendamento
  sem intervenção exige provedor/API.
- Empacotamento Electron e auto-update via GitHub Releases.

## Onboarding do Dev B

1. `git clone https://github.com/Willientropia/Bemprogoias && cd Bemprogoias && npm install`
2. `cp .env.example .env` e preencher com as credenciais (enviadas por fora do git).
3. Pedir acesso ao Firebase Console (Project Settings → Users and permissions → Editor).
4. `npm test` para confirmar que o ambiente está sadio antes de mexer em código.
5. `npm run dev` e entrar como gestor para ver a seção Eleitores — é o consumidor dos dados que
   o app do líder vai gravar.
