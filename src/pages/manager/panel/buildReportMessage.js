import { DEMO_STATIC_STATS } from "../../../data/demoPanelData";
import { formatNumber } from "./leaderMetrics";

const DIVIDER = "━━━━━━━━━━━━━━━━";

// Monta a mensagem exatamente como ela chega no WhatsApp (com *negrito* e
// _itálico_ do próprio WhatsApp). Cada bloco só entra se o toggle estiver ligado.
export function buildReportMessage({ leaders, blocks, frequencia, horario }) {
  const ativos = new Set(blocks.filter((b) => b.ativo).map((b) => b.id));
  const novos = leaders.reduce((acc, l) => acc + l.semana, 0);
  const total = leaders.reduce((acc, l) => acc + l.eleitores, 0);
  const porCrescimento = [...leaders].sort((a, b) => b.semana - a.semana);
  const alerta = leaders.filter((l) => l.perf === "alerta");

  let msg = "*BEM PARA GOIÁS — Relatório Expresso*\n";
  msg += `_${frequencia} · ${horario} · Goiânia_\n`;
  msg += `${DIVIDER}\n`;

  if (ativos.has("resumo")) {
    msg += `\n📊 *Eleitores indicados hoje:* ${formatNumber(novos)}\n`;
    msg += `Base total: ${formatNumber(total)} eleitores\n`;
  }

  if (ativos.has("ranking")) {
    msg += "\n🏆 *Top líderes do dia*\n";
    porCrescimento.slice(0, 5).forEach((l, i) => {
      msg += `${i + 1}. ${l.nome} — +${l.semana}\n`;
    });
  }

  if (ativos.has("alerta")) {
    msg += `\n⚠️ *Bases em alerta:* ${alerta.length}\n`;
    alerta.forEach((l) => {
      msg += `• ${l.nome} (${l.bairro}) — +${l.semana}\n`;
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
