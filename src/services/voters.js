import {
  Timestamp,
  collection,
  getCountFromServer,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  where,
} from "firebase/firestore";
import { db } from "./firebase";

export const VOTERS_PAGE_SIZE = 50;

function votersRef(campaignId) {
  return collection(db, `campaigns/${campaignId}/voters`);
}

export async function fetchVoterStats(campaignId) {
  const ref = votersRef(campaignId);
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [totalSnapshot, weekSnapshot, validatedSnapshot] = await Promise.all([
    getCountFromServer(ref),
    getCountFromServer(query(ref, where("createdAt", ">=", Timestamp.fromDate(sevenDaysAgo)))),
    getCountFromServer(query(ref, where("validationStatus", "==", "validado"))),
  ]);

  const total = totalSnapshot.data().count;
  const week = weekSnapshot.data().count;
  const validated = validatedSnapshot.data().count;

  return {
    total,
    week,
    validated,
    validationRate: total === 0 ? 0 : Math.round((validated / total) * 100),
  };
}

export async function fetchVotersPage({
  campaignId,
  leaderId = "todos",
  validationStatus = "todos",
  cursor = null,
  pageSize = VOTERS_PAGE_SIZE,
}) {
  const constraints = [];

  if (leaderId !== "todos") constraints.push(where("leaderId", "==", leaderId));
  if (validationStatus !== "todos") {
    constraints.push(where("validationStatus", "==", validationStatus));
  }

  constraints.push(orderBy("createdAt", "desc"));
  if (cursor) constraints.push(startAfter(cursor));
  constraints.push(limit(pageSize));

  const snapshot = await getDocs(query(votersRef(campaignId), ...constraints));
  return {
    voters: snapshot.docs.map((document) => ({ id: document.id, ...document.data() })),
    cursor: snapshot.docs.at(-1) ?? null,
    hasMore: snapshot.size === pageSize,
  };
}
