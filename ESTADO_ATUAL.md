# Estado atual do projeto — Bem pro Goiás

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
Depois de descobrir a campanha, também escuta `campaigns/{campaignId}/members/{uid}` e expõe o
perfil completo em `profile`.
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
  que `leaderId == request.auth.uid`. Gravar outro valor é rejeitado pelo servidor. No `update`,
  a regra checa o valor **antes e depois** — o líder não pode "adotar" eleitor alheio nem passar
  o próprio para terceiros.
- **Não existe campo `campaignId` dentro do documento**, e as regras não o exigem: o isolamento
  já vem do path (`campaigns/{campaignId}/voters/...`). Chegou a ser proposto exigi-lo, mas seria
  consistência de dado e não permissão, e travaria os 298 registros que já existem. Se um dia
  aparecer necessidade de `collectionGroup('voters')`, aí o campo passa a ser necessário.
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
| `campaigns/{id}/voterKeys` | leitura/escrita total | leitura/escrita | **consulta qualquer chave** (`get`), escreve só as próprias, não lista |
| `campaigns/{id}/leaderLocations` | leitura total | leitura | escreve **apenas o próprio** documento (id = uid) |

### Coleções preparadas para o app do líder

Duas coleções já têm regras publicadas e testadas, mas **ainda não são usadas por nenhum
código** — foram criadas para o Dev B:

- **`voterKeys/{keyId}`** — reserva de RG/título para a deduplicação. O líder pode fazer `get`
  de qualquer chave (é assim que ele descobre se um eleitor já existe na campanha, mesmo que
  seja de outro líder), mas só cria e altera as próprias. `list` é bloqueado para o líder, então
  ele não consegue varrer a coleção inteira. O `keyId` deve ser derivado do documento
  (ex.: `rg-123456789`), e o documento guarda ao menos `leaderId` e `voterId`.
  Isso resolve a limitação que existia antes: o líder não pode ler `voters` alheios, mas pode
  consultar a chave — que não expõe dado pessoal, só a existência.
- **`leaderLocations/{leaderId}`** — posição compartilhada voluntariamente pelo líder durante o
  trabalho. O id do documento **é** o uid do líder, então cada um só escreve o próprio. O gestor
  lê e lista; não escreve. O líder pode apagar o próprio documento para parar de compartilhar.

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
    filtro de desempenho, card do líder selecionado e atalho para o WhatsApp dele. Mostra também
    quem está em campo agora, via `leaderLocations`.
  - **Rede de Indicações** — pódio e ranking por eleitores validados, com rating em estrelas.
  - **Eleitores** — KPIs, produção por líder, busca, filtros e tabela com evidência de validação.
  - **Relatório Expresso** — fechamento diário no WhatsApp do gestor, com horário configurável.
  - **Cadastro de Líderes** — o CRUD real (única seção que não é demonstrativa).
- **`/leader`** — app mobile-first de campo (Android/Capacitor): painel, cadastro de eleitores,
  perfil, fila offline com sincronização e compartilhamento voluntário de localização.

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

## Como o app de campo sobrevive a dado ruim

Um cadastro antigo do Firestore pode guardar objeto, booleano ou nulo num campo que a tela
imprime como texto. Renderizar isso derruba a árvore inteira do React (`Objects are not valid as
a React child`) e o líder cai na tela "Não foi possível abrir esta tela" — foi exatamente o que
acontecia ao abrir um eleitor legado e voltar pela seta. Três camadas evitam isso hoje:

1. **`toDisplayText()`** (`src/utils/normalizers.js`) — tudo que vem do banco passa por ela antes
   de virar JSX. Texto e número viram string; qualquer outra coisa vira `''`, e a tela mostra
   "Não informado" em vez de quebrar. Usada em `VoterDetail`, `VoterCard`, `VoterForm`, `Home`,
   `Profile` e `Toast`.
2. **`FieldErrorBoundary`** — protege as telas internas do app de campo. Ao recuperar, ela troca
   a rota **antes** de limpar o erro; se limpasse primeiro, a mesma tela quebrada renderizaria de
   novo e o líder ficaria preso no aviso.
3. **`AppErrorBoundary`** (`src/components/AppErrorBoundary.jsx`) — envolve o `App` inteiro em
   `main.jsx`. É a rede que impede tela branca no Android quando a falha acontece fora do app de
   campo (login, roteador, painel do gestor). Guarda o diagnóstico em
   `localStorage['bem-pro-goias:last-app-error']`.

Ao mexer em componente que imprime dado do Firestore, passe o valor por `toDisplayText()`.

Regra relacionada: **o corpo de um `useEffect` precisa ser um bloco**. O valor devolvido pelo
efeito vira a função de limpeza do React, e alguns WebView do Android não devolvem `undefined` em
`window.scrollTo` — o app quebrava com `destroy is not a function` (`l is not a function` no
bundle minificado) ao sair do formulário de eleitor.

## Localização: captura, diagnóstico e endereço

`captureCurrentLocation()` (`src/services/location.js`) aceita `{ onStep }` e grava cada etapa —
import do plugin, checagem de permissão, pedido de permissão, provedor nativo, provedor do
WebView — com o tempo decorrido. Todas as etapas têm timeout próprio e há um teto absoluto de 45s,
para o botão nunca ficar preso em "Obtendo sinal…".

O relatório fica em `localStorage['bem-pro-goias:last-location-trace']` e aparece no formulário em
"Ver diagnóstico da última captura" (`src/services/locationDiagnostics.js`). É por aí que se
descobre em qual etapa um aparelho específico trava.

**Armadilha do Capacitor, aprendida na marra:** `registerPlugin()` devolve um `Proxy` que responde
com uma função para *qualquer* propriedade acessada — inclusive `then`. Se uma `async function`
der `return` nesse objeto, o JavaScript o trata como Promise e chama `plugin.then(resolve, reject)`,
que vira uma chamada nativa a um método inexistente: ninguém responde e o `await` fica pendurado
para sempre. Era exatamente isso que travava o botão em "Obtendo sinal…". Por isso
`prepareNativeGeolocation()` devolve `{ geolocation }`, nunca o plugin direto. **Nunca resolva uma
Promise com um objeto de plugin do Capacitor.**

O endereço vem de `src/services/geocoding.js`, em duas etapas: **Nominatim** (OpenStreetMap)
converte a coordenada em endereço + CEP e o **ViaCEP** normaliza esse CEP no padrão dos Correios.
Os Correios/ViaCEP resolvem apenas CEP → endereço; nenhum dos dois aceita coordenada como entrada,
por isso o Nominatim é obrigatório na primeira etapa. Falhou? A captura continua válida com as
coordenadas e o líder digita o endereço.

O Nominatim é gratuito mas pede uso moderado (cerca de 1 chamada por segundo por origem). Se a
campanha crescer a ponto de tomar bloqueio, a troca é só nesse arquivo.

## Testes

`npm test` roda três suítes: testes de componente (`tests/component/`, Vitest + Testing Library,
mockam os `services/*.js`), testes unitários (`test/`, `node --test`) e testes de Security Rules
(`tests/firestore.rules.test.js`, sobem e derrubam o Firestore Emulator sozinhos). Não é preciso
abrir o app no navegador para validar mudança de lógica — só para checar CSS/visual, que os testes
não cobrem.

`test:rules` exige **JDK 21** no `JAVA_HOME`; com uma versão anterior o `firebase-tools` recusa
subir o emulador. Se falhar com "port taken", o `pretest:rules` já mata o emulador travado
automaticamente. Se os testes de componente falharem com "Vitest failed to find the current
suite" logo após editar um arquivo, é cache do Vite:
`rm -rf node_modules/.vite node_modules/.vitest`.

## Ambiente e credenciais

- Projeto Firebase: `bemprogoias-80ab1` (Auth + Firestore, plano Spark/gratuito).
- Credenciais do client em `.env` (não versionado — ver `.env.example`).
- `serviceAccountKey.json` (credencial de admin dos scripts) também não é versionado.
- Repositório: `github.com/Willientropia/Bemprogoias` (público) — `main` está sincronizado.

## O que ainda não existe

- Ligação das três abas analíticas do gestor aos dados reais. O mapa, a rede e o relatório já
  existem visualmente, mas ainda usam a base de demonstração; o cadastro de líderes já usa o
  Firestore.
- Classificação de desempenho (`alto`/`medio`/`alerta`) ainda é atribuída no seed, não calculada
  por regra auditável.
- Números estáticos da demo (demandas, Rádio Peão IA, presença nos conselhos) seguem fixos em
  `DEMO_STATIC_STATS` — nenhum tem origem no sistema.
- Disparo automático do relatório: o botão abre o WhatsApp com a mensagem pronta; o agendamento
  sem intervenção exige provedor/API.
- Validação visual do painel nos breakpoints (desktop/tablet/celular).
- Empacotamento Electron e auto-update do desktop.
- Localização do líder em background; a versão atual funciona em foreground, enquanto o app está
  aberto, para evitar permissões invasivas sem política de privacidade aprovada.
- Publicação do APK assinado na Play Store; a versão atual é um APK de teste assinado com a chave
  de depuração do Android.

## Integração do Dev B — Campo & Eleitores

- CRUD completo de eleitores com busca, edição e exclusão.
- Deduplicação por RG/título usando reservas transacionais em `voterKeys`.
- Localização do cadastro por GPS, endereço manual ou pin no mapa Leaflet/OpenStreetMap.
- IndexedDB, persistência offline do Firestore e reconciliação de cadastros pendentes.
- Contato por WhatsApp usando `wa.me`.
- PWA instalável e app Android Capacitor; APK de depuração gerado localmente.
- Identidade visual oficial branca, verde e amarela aplicada ao login, aos painéis e ao app de
  campo, com a marca fornecida no ícone e na abertura do Android.
- Login integrado ao Firebase Authentication (e-mail/senha) e perfil/roteamento obtidos de
  `users/{uid}` e `members/{uid}` no Firestore.
- Permissões nativas `ACCESS_COARSE_LOCATION` e `ACCESS_FINE_LOCATION` declaradas no Android; o
  botão GPS solicita a autorização durante o uso do app.
- Captura GPS e operações do Firestore possuem limite externo de tempo, impedindo carregamento
  infinito quando o Android, a rede ou o GPS não respondem.
- A captura pontual no Android 1.0.1 consulta em paralelo um plugin próprio baseado no
  `LocationManager` (GPS/rede) e o provedor do WebView; usa a primeira coordenada válida e encerra
  ambos os caminhos após 12 segundos sem resposta.
- Botão/gesto Voltar do Android integrado às telas internas pelo plugin `@capacitor/app`.
- Cadastros de versões antigas são normalizados antes de abrir; uma barreira de erro recuperável
  impede que uma falha isolada produza uma tela totalmente branca.
- Atualização mobile via GitHub Releases e `minAppVersion` da campanha.
- Compartilhamento voluntário da localização do líder em foreground, com atualização limitada por
  tempo/distância e indicador de frescor para o mapa do gestor.

Contrato técnico e instruções para o Dev A: [`docs/DEV_B_HANDOFF.md`](./docs/DEV_B_HANDOFF.md).

## Onboarding

1. `git clone https://github.com/Willientropia/Bemprogoias && cd Bemprogoias && npm install`
2. `cp .env.example .env` e preencher com as credenciais (enviadas por fora do git).
3. Pedir acesso ao Firebase Console (Project Settings → Users and permissions → Editor).
4. `npm test` para confirmar que o ambiente está sadio antes de mexer em código (precisa de
   JDK 21 para a suíte de rules).
5. `npm run dev` e entrar como gestor para ver a seção Eleitores — é o consumidor dos dados que
   o app do líder grava.
