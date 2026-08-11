// Gera uma base enxuta de eleitores fictícios e a persiste na campanha demo.
// Os IDs são determinísticos e o processo pode ser executado novamente.
//
// Uso:
//   npm run seed:demo-voters -- <campaignId>
//   npm run seed:demo-voters -- <campaignId> --count=300 --dry-run

import { cert, initializeApp } from "firebase-admin/app";
import { FieldValue, Timestamp, getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "node:fs";
import { buildDemoVoterRecords } from "./demoVoterFactory.js";

const [, , campaignId, ...flags] = process.argv;
const dryRun = flags.includes("--dry-run");
const countFlag = flags.find((flag) => flag.startsWith("--count="));
const voterCount = Number(countFlag?.split("=")[1] ?? 300);

if (!campaignId || !Number.isInteger(voterCount) || voterCount < 1 || voterCount > 300) {
  console.error("Uso: npm run seed:demo-voters -- <campaignId> [--count=300] [--dry-run]");
  process.exit(1);
}

const serviceAccount = JSON.parse(
  readFileSync(new URL("../serviceAccountKey.json", import.meta.url), "utf8")
);
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

function isMapReady(leader) {
  return Boolean(
    leader.name && leader.regiao && leader.bairro
      && Number.isFinite(leader.lat) && Number.isFinite(leader.lng)
  );
}

async function main() {
  const campaignRef = db.collection("campaigns").doc(campaignId);
  const [campaignSnapshot, leadersSnapshot, existingDemoSnapshot] = await Promise.all([
    campaignRef.get(),
    campaignRef.collection("members").where("role", "==", "leader").get(),
    campaignRef.collection("voters").where("demoSource", "==", "voters-demo-v1").get(),
  ]);

  if (!campaignSnapshot.exists) throw new Error(`Campanha não encontrada: ${campaignId}`);
  if (campaignSnapshot.data().isDemo !== true) {
    throw new Error("O seed de eleitores só pode ser executado em campanha marcada com isDemo=true.");
  }

  const leaders = leadersSnapshot.docs
    .map((document) => ({ id: document.id, ...document.data() }))
    .filter(isMapReady)
    .sort((a, b) => a.id.localeCompare(b.id));

  if (leaders.length === 0) throw new Error("Nenhum líder com localização foi encontrado.");

  const { records, summaries } = buildDemoVoterRecords(leaders, voterCount, new Date());
  const desiredIds = new Set(records.map((record) => record.id));
  const staleDocuments = existingDemoSnapshot.docs.filter((document) => !desiredIds.has(document.id));
  console.log(`${dryRun ? "Simulação" : "Seed"}: ${voterCount} eleitores para ${leaders.length} líderes; ${staleDocuments.length} excedentes a remover.`);

  if (dryRun) {
    console.log(JSON.stringify({
      total: records.length,
      firstId: records[0]?.id,
      lastId: records.at(-1)?.id,
      leaders: Object.keys(summaries).length,
      existingDemoVoters: existingDemoSnapshot.size,
      staleDemoVoters: staleDocuments.length,
      distribution: leaders
        .map((leader) => ({
          leader: leader.name,
          total: summaries[leader.id].eleitores,
          validated: summaries[leader.id].eleitoresValidados,
        }))
        .sort((a, b) => b.validated - a.validated),
    }, null, 2));
    return;
  }

  const writer = db.bulkWriter();
  let completed = 0;
  const totalOperations = records.length + staleDocuments.length;
  writer.onWriteError((error) => error.failedAttempts < 3);
  writer.onWriteResult(() => {
    completed += 1;
    if (completed % 1000 === 0 || completed === totalOperations) {
      console.log(`${completed}/${totalOperations} operações concluídas`);
    }
  });

  staleDocuments.forEach((document) => writer.delete(document.ref));

  records.forEach((record) => {
    const { id, createdAt, validatedAt, ...data } = record;
    writer.set(
      campaignRef.collection("voters").doc(id),
      {
        ...data,
        createdAt: Timestamp.fromDate(createdAt),
        validatedAt: validatedAt ? Timestamp.fromDate(validatedAt) : null,
      }
    );
  });
  await writer.close();

  const summaryBatch = db.batch();
  leaders.forEach((leader) => {
    summaryBatch.update(campaignRef.collection("members").doc(leader.id), summaries[leader.id]);
  });
  summaryBatch.set(campaignRef, {
    demoVoterCount: voterCount,
    demoVoterLeaderCount: leaders.length,
    demoVotersSeededAt: FieldValue.serverTimestamp(),
  }, { merge: true });
  await summaryBatch.commit();

  console.log(`Seed concluído: ${voterCount} eleitores mantidos, ${staleDocuments.length} removidos e métricas de ${leaders.length} líderes atualizadas.`);
}

main().then(() => process.exit(0)).catch((error) => {
  console.error(error.message);
  process.exit(1);
});
