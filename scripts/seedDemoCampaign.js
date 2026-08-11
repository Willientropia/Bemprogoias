// Popula uma campanha existente com os 15 líderes fictícios usados no handoff
// do Painel do Gestor. A operação é idempotente: os documentos usam IDs fixos
// e são atualizados com merge em execuções futuras.
//
// Uso:
//   npm run seed:demo -- <campaignId>
//   npm run seed:demo -- <campaignId> --dry-run
//
// Os líderes não ganham contas no Firebase Auth. Eles são personagens da demo,
// persistidos em members para alimentar mapa, ranking, relatório e cadastro. O
// espelho mínimo em users/{id} existe apenas para manter o CRUD compatível com
// as mesmas Security Rules dos líderes que possuem login.

import { cert, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "node:fs";
import { DEMO_LEADERS } from "../src/data/demoPanelData.js";

const [, , campaignId, ...flags] = process.argv;
const dryRun = flags.includes("--dry-run");

if (!campaignId) {
  console.error("Uso: npm run seed:demo -- <campaignId> [--dry-run]");
  process.exit(1);
}

const serviceAccount = JSON.parse(
  readFileSync(new URL("../serviceAccountKey.json", import.meta.url), "utf8")
);

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

function slugify(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.|\.$/g, "");
}

function demoWhatsapp(index) {
  const number = String(912340000 + index * 137).padStart(9, "0");
  return `(62) ${number.slice(0, 1)} ${number.slice(1, 5)}-${number.slice(5)}`;
}

function buildLeaderDocument(leader, index) {
  return {
    role: "leader",
    campaignId,
    name: leader.nome,
    email: `${slugify(leader.nome)}@demo.bemparagoias.local`,
    whatsapp: demoWhatsapp(index),
    regiao: leader.regiao,
    bairro: leader.bairro,
    lat: leader.lat,
    lng: leader.lng,
    eleitores: leader.eleitores,
    semana: leader.semana,
    perf: leader.perf,
    raioKm: Number(((400 + leader.eleitores * 0.9) / 1000).toFixed(1)),
    isDemo: true,
    demoSource: "painel-gestor-v1",
    updatedAt: FieldValue.serverTimestamp(),
  };
}

async function main() {
  const campaignRef = db.collection("campaigns").doc(campaignId);
  const campaignSnapshot = await campaignRef.get();

  if (!campaignSnapshot.exists) {
    throw new Error(`Campanha não encontrada: ${campaignId}`);
  }

  const campaignName = campaignSnapshot.data().name ?? campaignId;
  console.log(`${dryRun ? "Simulação" : "Seed"}: ${campaignName} (${campaignId})`);
  console.log(`${DEMO_LEADERS.length} líderes fictícios serão gravados em campaigns/${campaignId}/members.`);

  if (dryRun) return;

  const batch = db.batch();
  batch.set(
    campaignRef,
    {
      isDemo: true,
      demoSeedVersion: 1,
      demoLeaderCount: DEMO_LEADERS.length,
      demoSeededAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  DEMO_LEADERS.forEach((leader, index) => {
    const leaderId = `demo-${leader.id}`;
    const memberRef = campaignRef.collection("members").doc(leaderId);
    const userRef = db.collection("users").doc(leaderId);
    batch.set(memberRef, buildLeaderDocument(leader, index), { merge: true });
    batch.set(
      userRef,
      {
        role: "leader",
        campaignId,
        isDemo: true,
        demoSource: "painel-gestor-v1",
      },
      { merge: true }
    );
  });

  await batch.commit();
  console.log(`Seed concluído: ${DEMO_LEADERS.length} líderes fictícios persistidos.`);
}

main().then(() => process.exit(0)).catch((error) => {
  console.error(error.message);
  process.exit(1);
});
