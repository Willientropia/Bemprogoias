// Diagnóstico da captura de GPS.
//
// Quando o botão fica em "Obtendo sinal…" sem terminar, a mensagem final não
// diz nada sobre ONDE o Android parou: pode ser o import do plugin, a checagem
// de permissão, o provedor nativo ou o WebView. Este módulo grava cada etapa
// com o tempo decorrido e guarda o último relatório no aparelho, para o líder
// conseguir mostrar à coordenação mesmo depois de fechar o app.

const STORAGE_KEY = 'bem-pro-goias:last-location-trace';
const MAX_STEPS = 60;

function describeDetail(detail) {
  if (detail == null) return '';
  if (typeof detail === 'string') return detail;
  if (detail instanceof Error) {
    const code = detail.code ? ` (${detail.code})` : '';
    return `${detail.name}${code}: ${detail.message}`;
  }
  try {
    return JSON.stringify(detail);
  } catch {
    return String(detail);
  }
}

function persist(report) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(report));
  } catch {
    // O diagnóstico é auxiliar: se o armazenamento falhar, a captura segue.
  }
}

export function createLocationTrace(platform = 'desconhecida') {
  const startedAt = Date.now();
  const steps = [];

  const trace = {
    platform,
    steps,
    outcome: 'em-andamento',
    step(name, detail) {
      if (steps.length < MAX_STEPS) {
        steps.push({ name, ms: Date.now() - startedAt, detail: describeDetail(detail) });
      }
      return trace;
    },
    finish(outcome, detail) {
      trace.step(outcome, detail);
      trace.outcome = outcome;
      trace.totalMs = Date.now() - startedAt;
      persist({
        platform,
        outcome,
        totalMs: trace.totalMs,
        occurredAt: new Date(startedAt).toISOString(),
        steps
      });
      return trace;
    },
    toText() {
      const total = trace.totalMs ?? Date.now() - startedAt;
      return formatReport({ platform, outcome: trace.outcome, totalMs: total, steps });
    }
  };

  return trace;
}

export function formatReport(report) {
  if (!report) return '';
  const header = [
    `plataforma: ${report.platform}`,
    `resultado: ${report.outcome}`,
    `total: ${report.totalMs}ms`,
    report.occurredAt ? `quando: ${report.occurredAt}` : ''
  ].filter(Boolean);
  const lines = (report.steps || []).map(
    (item) => `${String(item.ms).padStart(6)}ms  ${item.name}${item.detail ? ` — ${item.detail}` : ''}`
  );
  return [...header, '', ...lines].join('\n');
}

export function readLastLocationTrace() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
