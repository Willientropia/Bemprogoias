import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "./firebase";

const campaignsRef = collection(db, "campaigns");

export function subscribeToCampaigns(onChange) {
  const q = query(campaignsRef, orderBy("createdAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    onChange(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

export function subscribeToCampaign(campaignId, onChange, onError) {
  return onSnapshot(
    doc(db, "campaigns", campaignId),
    (snapshot) => onChange(snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null),
    onError
  );
}

export function createCampaign({ name, minAppVersion }) {
  return addDoc(campaignsRef, {
    name,
    minAppVersion: minAppVersion || null,
    createdAt: serverTimestamp(),
  });
}

export function updateCampaign(campaignId, { name, minAppVersion }) {
  return updateDoc(doc(db, "campaigns", campaignId), {
    name,
    minAppVersion: minAppVersion || null,
  });
}

export function deleteCampaign(campaignId) {
  return deleteDoc(doc(db, "campaigns", campaignId));
}
