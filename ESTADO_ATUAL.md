# Estado atual do projeto — Bem pro Goiás

Este documento descreve **como o sistema funciona hoje**, sem histórico de como chegou até aqui.
Para o passo a passo de implementação, ver [`PROGRESS.md`](./PROGRESS.md). Para a especificação
completa do produto, ver [`Bem_para_Goias_App_Spec.md`](./Bem_para_Goias_App_Spec.md).

## Stack

React (Vite) + Firebase (Auth + Firestore), plano gratuito (Spark) — sem Cloud Functions.

## Papéis e autenticação

Existem três papéis: `super_admin`, `manager`, `leader`. O papel **não** fica em custom claims do
token — fica no Firestore, em dois lugares com propósitos diferentes:

```
users/{uid}                                  # espelho mínimo, só pra sessão saber quem é
  role: "super_admin" | "manager" | "leader"
  campaignId: string | null                  # null para super_admin

campaigns/{campaignId}/members/{uid}         # perfil completo, isolado por campanha
  role, campaignId, name, email, whatsapp, createdAt
  (líder também tem: regiao, raioKm)
```

`users/{uid}` existe só porque, ao logar, o app ainda não sabe em qual campanha procurar o
usuário — é sempre um `get()` de documento único. Os dados "de verdade" (nome, contato, etc.)
vivem em `members`, cujo isolamento entre campanhas vem da própria estrutura do caminho
(subcoleção dentro de `campaigns/{campaignId}`), não de um filtro de campo.

No client, `AuthContext` (`src/contexts/AuthContext.jsx`) escuta `users/{uid}` em tempo real
(`onSnapshot`) assim que o usuário loga — qualquer mudança de papel feita pelo Super Admin se
reflete na sessão automaticamente, sem precisar relogar. Depois de descobrir a campanha, também
escuta `campaigns/{campaignId}/members/{uid}` e expõe o perfil completo em `profile`.

`ProtectedRoute` (`src/components/ProtectedRoute.jsx`) bloqueia rotas por papel.

## Como usuários são criados

Não existe cadastro público — todo usuário é criado por alguém acima na hierarquia, direto pela
UI (sem Cloud Functions):

- **Super Admin** é criado via script local (`scripts/createSuperAdmin.js`, usa `firebase-admin`
  + `serviceAccountKey.json`, roda com `node scripts/createSuperAdmin.js <email> <senha>`).
- **Gestor** é criado pelo Super Admin, dentro do painel (`/super-admin/campaigns/:campaignId`).
- **Líder** é criado pelo Gestor, dentro do painel dele (`/manager`).

A criação (`src/services/userProvisioning.js`) faz duas coisas:

1. Usa uma **instância secundária do Firebase App** no client só para chamar
   `createUserWithEmailAndPassword` — isso evita que a sessão de quem está criando o usuário
   (Super Admin ou Gestor) seja substituída pela do usuário recém-criado, que é o comportamento
   padrão do SDK do Firebase Auth.
2. Grava o perfil em `users/{uid}` e `campaigns/{campaignId}/members/{uid}` numa mesma
   `writeBatch` (atômico — ou os dois gravam, ou nenhum).

## Regras de acesso (Security Rules)

As regras (`firestore.rules`) são validadas por testes automatizados
(`tests/firestore.rules.test.js`, via `npm run test:rules`, roda no Firestore Emulator local) —
não é só leitura do arquivo, o isolamento entre campanhas foi comprovado em teste.

Resumo do que cada papel pode fazer hoje:

| Coleção | Super Admin | Gestor (própria campanha) | Líder (própria campanha) |
|---|---|---|---|
| `users/{uid}` (o próprio) | leitura/escrita total | cria/edita apenas o espelho de líderes da própria campanha | lê o próprio |
| `campaigns/{id}` | leitura/escrita total | leitura | leitura |
| `campaigns/{id}/members` | leitura/escrita total | lista/lê/cria/edita apenas líderes da própria campanha | lê apenas o próprio (não lista) |
| `campaigns/{id}/voters` | leitura/escrita total | leitura/escrita | lê/escreve apenas os próprios (`leaderId` == uid) |
| `campaigns/{id}/voterKeys` | leitura/escrita total | leitura/escrita | consulta/reserva apenas chaves atribuídas ao próprio líder |
| `campaigns/{id}/leaderLocations` | leitura | leitura/listagem | lê e grava apenas a própria posição |

Todo isolamento entre campanhas em `members` e `voters` vem da estrutura do caminho (subcoleção),
não de filtro de campo — é o padrão seguro confirmado pelos testes.

## Painéis existentes hoje

- **`/login`** — tela de login (email + senha).
- **`/super-admin`** — CRUD completo de campanhas (criar, editar, excluir, listar).
- **`/super-admin/campaigns/:campaignId`** — CRUD completo de gestores daquela campanha (criar,
  editar, remover, listar).
- **`/manager`** — CRUD completo de líderes da própria campanha (criar, editar, remover, listar).
- **`/leader`** — app mobile-first de campo: painel, eleitores, perfil, sincronização e localização
  em tempo real voluntária.

Todo painel autenticado mostra uma barra superior (`TopBar`) com o e-mail, papel do usuário
logado e botão de logout.

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

`npm test` roda tudo: testes de componente (`tests/component/`, Vitest + Testing Library, mockam
os `services/*.js`), testes unitários do Dev B (`test/`) e testes de Security Rules
(`tests/firestore.rules.test.js`, sobem e derrubam o Firestore Emulator sozinhos). Não é preciso
abrir o app manualmente no navegador para validar a maior parte das mudanças de lógica — só para
checar CSS/visual, que os testes não cobrem.

## Ambiente e credenciais

- Projeto Firebase: `bemprogoias-80ab1` (Auth + Firestore, plano Spark/gratuito).
- Credenciais do client ficam em `.env` (não versionado — ver `.env.example` para o template).
- `serviceAccountKey.json` (credencial de admin, usada só pelo script local) também não é
  versionado.
- Repositório: `github.com/Willientropia/Bemprogoias` (público).

## O que ainda não existe

- Ligação das três abas analíticas do gestor aos dados reais. O mapa, a rede e o relatório já
  existem visualmente, mas ainda usam a base de demonstração; o cadastro de líderes já usa o
  Firestore. O serviço `subscribeToLeaderLocations` está pronto para substituir os marcadores
  demonstrativos pelas posições compartilhadas ao vivo.
- Empacotamento Electron e auto-update do desktop.
- Assinatura de produção/publicação do APK e deploy das regras atualizadas.
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
