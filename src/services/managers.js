import { collection, doc, onSnapshot, query, updateDoc, where } from "firebase/firestore";
import { db } from "./firebase";

export function subscribeToManagers(campaignId, onChange) {
  const q = query(
    collection(db, `campaigns/${campaignId}/members`),
    where("role", "==", "manager")
  );
  return onSnapshot(q, (snapshot) => {
    onChange(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

export function updateManager(campaignId, uid, { name, whatsapp }) {
  return updateDoc(doc(db, `campaigns/${campaignId}/members`, uid), { name, whatsapp });
}
