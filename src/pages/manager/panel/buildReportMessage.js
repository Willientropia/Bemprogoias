import { DEMO_STATIC_STATS } from "../../../data/demoPanelData";
import { formatNumber, validatedVoters } from "./leaderMetrics";

const DIVIDER = "━━━━━━━━━━━━━━━━";

// Monta a mensagem exatamente como ela chega no WhatsApp (com *negrito* e
// _itálico_ do próprio WhatsApp). Cada bloco só entra se o toggle estiver ligado.
export function buildReportMessage({ leaders, blocks, horario }) {
  const ativos = new Set(blocks.filter((b) => b.ativo).map((b) => b.id));
  const novos = leaders.reduce((acc, leader) => acc + (Number(leader.hoje) || 0), 0);
  const totalValidated = leaders.reduce((acc, leader) => acc + validatedVoters(leader), 0);
  const porCrescimento = [...leaders].sort((a, b) => (
    (Number(b.hoje) || 0) - (Number(a.hoje) || 0)
    || validatedVoters(b) - validatedVoters(a)
    || a.nome.localeCompare(b.nome)
  ));
  const alerta = leaders.filter((l) => l.perf === "alerta");

  let msg = "*BEM PARA GOIÁS — Relatório Expresso*\n";
  msg += `_Diário · ${horario} · Goiânia_\n`;
  msg += `${DIVIDER}\n`;

  if (ativos.has("resumo")) {
    msg += `\n📊 *Eleitores validados hoje:* ${formatNumber(novos)}\n`;
    msg += `Base validada: ${formatNumber(totalValidated)} eleitores\n`;
  }

  msg += `\n📋 *Todos os líderes — produção do dia (${leaders.length})*\n`;
  porCrescimento.forEach((leader, index) => {
    msg += `${index + 1}. ${leader.nome} — +${Number(leader.hoje) || 0} hoje · ${formatNumber(validatedVoters(leader))} validados\n`;
  });

  if (ativos.has("alerta")) {
    msg += `\n⚠️ *Bases em alerta:* ${alerta.length}\n`;
    alerta.forEach((l) => {
      msg += `• ${l.nome} (${l.bairro}) — +${Number(l.hoje) || 0} hoje\n`;
    });
  }

  if (ativos.has("demandas")) {
    msg += `\n📋 *Demandas abertas hoje:* ${DEMO_STATIC_STATS.demandasAbertas}\n`;
    msg += `Críticas: ${DEMO_STATIC_STATS.demandasCriticas} · Em andamento: ${DEMO_STATIC_STATS.demandasAndamento}\n`;
  }

  if (ativos.has("sentimento")) {
    msg += `\n💡 *Rádio Peão IA:* ${DEMO_STATIC_STATS.sentimentoPositivo}% positivo (▲${DEMO_STATIC_STATS.sentimentoDelta} pts)\n`;
  }

  if (ativos.has("presenca")) {
    msg += `\n🤝 *Presença nos conselhos:* ${DEMO_STATIC_STATS.presencaConselhos}% dos líderes\n`;
  }

  msg += `\n${DIVIDER}\nPainel completo: bemparagoias.br/gestor`;
  return msg;
}
