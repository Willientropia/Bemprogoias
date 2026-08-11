import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "./firebase";

export function subscribeToLeaders(campaignId, onChange) {
  const q = query(
    collection(db, `campaigns/${campaignId}/members`),
    where("role", "==", "leader")
  );
  return onSnapshot(q, (snapshot) => {
    onChange(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}
