# Dev B — Campo, eleitores e localização ao vivo

Esta integração usa o repositório compartilhado e preserva os painéis do Dev A. O app do líder está em `/leader`.

## Autenticação e perfil

O app segue o contrato atual do Dev A, sem custom claims:

- `users/{uid}` fornece `role` e `campaignId` para montar a sessão;
- `campaigns/{campaignId}/members/{uid}` fornece o perfil completo do líder, incluindo nome,
  WhatsApp, região e raio.

`AuthContext` acompanha os dois documentos em tempo real e expõe o perfil completo em `profile`.

## Eleitores e deduplicação

- `campaigns/{campaignId}/voters/{voterId}` contém nome, RG/título normalizados, zona, seção, WhatsApp, localização, `leaderId`, timestamps e status.
- `campaigns/{campaignId}/voterKeys/rg_{valor}` e `titulo_{valor}` reservam documentos de forma atômica.
- Offline, o eleitor fica no IndexedDB como `pending`. Ao reconectar, uma colisão vira `conflict` e aparece para o líder corrigir.

## Localização em tempo real do líder

O compartilhamento é voluntário e iniciado/parado no painel do líder. O app grava:

```text
campaigns/{campaignId}/leaderLocations/{leaderId}
  campaignId, leaderId
  lat, lng, accuracy, heading, speed
  sharing
  deviceTimestamp, updatedAt, stoppedAt
```

Há limitação de escrita: no máximo aproximadamente uma atualização a cada 10 segundos, salvo deslocamento relevante de 25 metros. O Firestore mantém a última posição na fila quando a rede cai.

O Dev A pode consumir no mapa com:

```js
import {
  subscribeToLeaderLocations,
  isFreshLeaderLocation,
} from '../services/liveLocation';

const unsubscribe = subscribeToLeaderLocations(campaignId, (locations) => {
  const onlineNow = locations.filter((item) => isFreshLeaderLocation(item));
  // atualizar marcadores do mapa
});
```

O marcador só deve ser tratado como **ao vivo** quando `isFreshLeaderLocation` retornar `true` (por padrão, atualização nos últimos 90 segundos). Isso evita posição ativa falsa quando o aparelho é fechado abruptamente.

### Privacidade e plataforma

- A UI informa claramente quando há compartilhamento e oferece botão de parada.
- Somente gestor/super admin da campanha lê; somente o próprio líder escreve.
- Esta versão acompanha em foreground, enquanto o app está aberto. Rastreamento em background exige permissão adicional, política de privacidade específica e revisão de bateria/Play Store.
- Eleitores não são rastreados. O cadastro guarda apenas o local do contato pelos modos GPS, endereço ou pin.

## Antes do deploy

O Dev A deve revisar e então publicar as regras novas:

```bash
npx firebase deploy --only firestore:rules,firestore:indexes
```

Nenhum deploy foi feito automaticamente durante a integração. As regras foram carregadas e testadas no emulador local.
