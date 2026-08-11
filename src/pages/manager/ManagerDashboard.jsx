import { useEffect, useState } from "react";
import { TopBar } from "../../components/TopBar";
import { useAuth } from "../../contexts/AuthContext";
import { subscribeToLeaders } from "../../services/leaders";
import LeaderForm from "./LeaderForm";
import LeaderListItem from "./LeaderListItem";

export default function ManagerDashboard() {
  const { campaignId } = useAuth();
  const [leaders, setLeaders] = useState([]);

  useEffect(() => {
    if (!campaignId) return;
    return subscribeToLeaders(campaignId, setLeaders);
  }, [campaignId]);

  return (
    <div>
      <TopBar />
      <h1>Painel do Gestor</h1>

      {campaignId && <LeaderForm campaignId={campaignId} onCreated={() => {}} />}

      <h2>Líderes cadastrados</h2>
      {leaders.length === 0 && <p>Nenhum líder cadastrado ainda.</p>}
      <ul>
        {leaders.map((leader) => (
          <LeaderListItem key={leader.id} campaignId={campaignId} leader={leader} />
        ))}
      </ul>

      <p>Mapa de influência — em construção.</p>
    </div>
  );
}
