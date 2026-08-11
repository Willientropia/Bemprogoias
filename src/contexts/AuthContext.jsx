import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "../services/firebase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [campaignId, setCampaignId] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeSession = () => {};
    let unsubscribeMember = () => {};

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      unsubscribeSession();
      unsubscribeMember();

      if (!firebaseUser) {
        setUser(null);
        setRole(null);
        setCampaignId(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      setUser(firebaseUser);
      setLoading(true);
      unsubscribeSession = onSnapshot(
        doc(db, "users", firebaseUser.uid),
        (snapshot) => {
          const sessionProfile = snapshot.exists() ? snapshot.data() : null;
          const nextRole = sessionProfile?.role ?? null;
          const nextCampaignId = sessionProfile?.campaignId ?? null;

          setRole(nextRole);
          setCampaignId(nextCampaignId);
          setProfile(sessionProfile);
          unsubscribeMember();

          if (nextCampaignId) {
            unsubscribeMember = onSnapshot(
              doc(db, "campaigns", nextCampaignId, "members", firebaseUser.uid),
              (memberSnapshot) => {
                setProfile(memberSnapshot.exists() ? memberSnapshot.data() : sessionProfile);
              },
              () => setProfile(sessionProfile)
            );
          }

          setLoading(false);
        },
        () => {
          setProfile(null);
          setRole(null);
          setCampaignId(null);
          setLoading(false);
        }
      );
    });

    return () => {
      unsubscribeSession();
      unsubscribeMember();
      unsubscribeAuth();
    };
  }, []);

  const login = (email, password) => signInWithEmailAndPassword(auth, email, password);
  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider value={{ user, role, campaignId, profile, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// oxlint-disable-next-line react/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
