# Estado atual do projeto — Bem para Goiás

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
reflete na sessão do usuário automaticamente, sem precisar relogar.

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

Todo isolamento entre campanhas em `members` e `voters` vem da estrutura do caminho (subcoleção),
não de filtro de campo — é o padrão seguro confirmado pelos testes.

## Painéis existentes hoje

- **`/login`** — tela de login (email + senha).
- **`/super-admin`** — CRUD completo de campanhas (criar, editar, excluir, listar).
- **`/super-admin/campaigns/:campaignId`** — CRUD de gestores daquela campanha (criar, editar,
  listar; excluir ainda não implementado na UI).
- **`/manager`** — CRUD de líderes da própria campanha (criar, listar; editar/excluir ainda não
  implementados).

Todo painel autenticado mostra uma barra superior (`TopBar`) com o e-mail, papel do usuário
logado e botão de logout.

## Ambiente e credenciais

- Projeto Firebase: `bemprogoias-80ab1` (Auth + Firestore, plano Spark/gratuito).
- Credenciais do client ficam em `.env` (não versionado — ver `.env.example` para o template).
- `serviceAccountKey.json` (credencial de admin, usada só pelo script local) também não é
  versionado.
- Repositório: `github.com/Willientropia/Bemprogoias` (público).

## O que ainda não existe

- Editar/remover líder (só criar/listar por enquanto).
- Excluir gestor pela UI.
- CRUD de Eleitores, deduplicação por RG/título, os três modos de localização, offline-first,
  integração com WhatsApp — tudo isso é escopo do Dev B (trilha "Campo & Eleitores").
- Mapa com líderes/raio de influência.
- Empacotamento Electron, Capacitor (APK) e PWA.
- Auto-update / OTA via GitHub Releases.
- Identidade visual "Universe Deep Space" aplicada ao código (há mockups de referência em
  `docs/design-reference/`, mas as páginas atuais são só estrutura funcional, sem estilo).

## Relevante para o Dev B (trilha "Campo & Eleitores")

- O login do líder já funciona (criado pelo Gestor) e o perfil dele — incluindo `regiao` e
  `raioKm` — já está disponível em `campaigns/{campaignId}/members/{uid}`. Não é preciso mexer
  nesse fluxo, só consumir os dados de lá.
- A subcoleção `campaigns/{campaignId}/voters/{voterId}` já está prevista nas Security Rules
  (leitura/escrita restrita ao próprio líder, via `leaderId == uid`), mas **nenhum código de
  cadastro de eleitor existe ainda** — é o ponto de partida do Dev B.
- Ao criar a UI do líder, usar `useAuth()` (`src/contexts/AuthContext.jsx`) para obter `user.uid`
  e `campaignId` — mesmo padrão já usado em `ManagerDashboard.jsx`.
- Onboarding completo (acesso ao repo, `.env`, Firebase Console) está no
  [`README.md`](./README.md), seção "Onboarding de um novo colaborador".
- Antes de mexer no schema do Firestore, ver a seção "Contrato com o Dev B" em
  [`PROGRESS.md`](./PROGRESS.md).
