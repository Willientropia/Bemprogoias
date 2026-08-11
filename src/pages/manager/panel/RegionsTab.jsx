import { useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Circle, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { GOIANIA_CENTER, PERF_COLORS, PERF_LABELS } from "../../../data/demoPanelData";
import { formatNumber } from "./leaderMetrics";
import { Avatar, Chip, FilterButton, KpiCard, SectionLabel, Stars } from "./PanelBits";
import { useAuth } from "../../../contexts/AuthContext";
import { useLiveLeaderLocations } from "../../../hooks/useLiveLeaderLocations";

const FILTERS = [
  { id: "todos", label: "Todos" },
  { id: "alto", label: "Alto" },
  { id: "medio", label: "Médio" },
  { id: "alerta", label: "Em alerta" },
];

function pinIcon(leader) {
  const size = 30 + Math.round(leader.eleitores / 220);
  const color = PERF_COLORS[leader.perf];
  return L.divIcon({
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    html: `<div class="map-pin" style="width:${size}px;height:${size}px;background:${color}"><span>${leader.nome.charAt(0)}</span></div>`,
  });
}

// Marcador de quem está em campo AGORA. Cor viva e halo pulsante para se
// distinguir do pino cinza da região cadastrada — no mapa os dois convivem.
function liveIcon(nome) {
  const inicial = (nome || "?").charAt(0).toUpperCase();
  return L.divIcon({
    className: "",
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    html: `<div class="live-pin"><span>${inicial}</span></div>`,
  });
}

function minutosDesde(iso) {
  const quando = Date.parse(iso || "");
  if (!Number.isFinite(quando)) return null;
  return Math.max(0, Math.round((Date.now() - quando) / 60_000));
}

// Dá acesso à instância do mapa para o "voar até o líder" da lista lateral.
function MapRef({ mapRef }) {
  mapRef.current = useMap();
  return null;
}

export default function RegionsTab({ leaders }) {
  const [perfFilter, setPerfFilter] = useState("todos");
  const [selectedId, setSelectedId] = useState(null);
  const [mostrarAoVivo, setMostrarAoVivo] = useState(true);
  const mapRef = useRef(null);
  const markerRefs = useRef({});
  const { campaignId } = useAuth();
  const { ativos: aoVivo, error: erroAoVivo } = useLiveLeaderLocations(campaignId);

  // O documento de posição é indexado pelo uid do líder, então dá para casar
  // com a lista já carregada e mostrar o nome em vez de um código.
  const nomePorId = useMemo(() => {
    const mapa = {};
    leaders.forEach((l) => { mapa[l.id] = l.nome; });
    return mapa;
  }, [leaders]);

  const visible = useMemo(
    () => (perfFilter === "todos" ? leaders : leaders.filter((l) => l.perf === perfFilter)),
    [leaders, perfFilter]
  );

  const listed = useMemo(() => [...visible].sort((a, b) => b.eleitores - a.eleitores), [visible]);

  const totalEleitores = leaders.reduce((acc, l) => acc + l.eleitores, 0);
  const regioes = new Set(leaders.map((l) => l.regiao)).size;
  const emAlerta = leaders.filter((l) => l.perf === "alerta").length;

  const selected = leaders.find((l) => l.id === selectedId) ?? null;

  function focusLeader(leader) {
    setSelectedId(leader.id);
    mapRef.current?.setView([leader.lat, leader.lng], 14, { animate: true });
    markerRefs.current[leader.id]?.openPopup();
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
        <div>
          <h1>Regiões de Goiânia</h1>
          <p style={{ marginTop: 8, fontSize: 15 }}>
            Mapa interativo com a localização dos líderes regionais e o alcance de cada base
          </p>
        </div>
      </div>

      <div className="kpi-grid" style={{ marginTop: 22 }}>
        <KpiCard value={leaders.length} label="LÍDERES NO MAPA" />
        <KpiCard value={formatNumber(totalEleitores)} label="ELEITORES MAPEADOS" color="var(--brand-700)" />
        <KpiCard value={regioes} label="REGIÕES COBERTAS" />
        <KpiCard value={emAlerta} label="BASES EM ALERTA" color="var(--danger)" />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 9, margin: "22px 0 14px", flexWrap: "wrap" }}>
        <SectionLabel style={{ marginRight: 4 }}>DESEMPENHO</SectionLabel>
        {FILTERS.map((f) => (
          <FilterButton key={f.id} active={perfFilter === f.id} onClick={() => setPerfFilter(f.id)}>
            {f.label}
          </FilterButton>
        ))}
      </div>

      <div className="panel-split" style={{ display: "grid", gridTemplateColumns: "1fr 336px", gap: 18, alignItems: "start" }}>
        <div className="panel-card" style={{ overflow: "hidden", padding: 0 }}>
          <MapContainer center={GOIANIA_CENTER} zoom={11} scrollWheelZoom style={{ height: 540, width: "100%" }}>
            <MapRef mapRef={mapRef} />
            <TileLayer
              url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              maxZoom={19}
            />
            {visible.map((leader) => (
              <Circle
                key={`c-${leader.id}`}
                center={[leader.lat, leader.lng]}
                radius={400 + leader.eleitores * 0.9}
                pathOptions={{
                  color: PERF_COLORS[leader.perf],
                  weight: 1.4,
                  opacity: 0.55,
                  fillColor: PERF_COLORS[leader.perf],
                  fillOpacity: 0.13,
                }}
              />
            ))}
            {visible.map((leader) => (
              <Marker
                key={leader.id}
                position={[leader.lat, leader.lng]}
                icon={pinIcon(leader)}
                title={leader.nome}
                ref={(ref) => {
                  if (ref) markerRefs.current[leader.id] = ref;
                }}
                eventHandlers={{ click: () => setSelectedId(leader.id) }}
              >
                <Popup>
                  <div style={{ minWidth: 190 }}>
                    <div style={{ fontFamily: "var(--heading)", fontWeight: 700, fontSize: 16, color: "var(--ink-strong)" }}>
                      {leader.nome}
                    </div>
                    <div style={{ fontSize: 12, color: "#8a8b80", margin: "2px 0 9px" }}>
                      {leader.bairro} · {leader.regiao}
                    </div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                      <b style={{ fontFamily: "var(--heading)", fontSize: 20, color: PERF_COLORS[leader.perf] }}>
                        {formatNumber(leader.eleitores)}
                      </b>
                      <span style={{ fontSize: 12, color: "var(--ink-muted)" }}>eleitores</span>
                    </div>
                    <div style={{ marginTop: 8 }}>
                      <Stars eleitores={leader.eleitores} />
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* Quem está compartilhando a posição agora. Desenhado por último
                para ficar ACIMA dos pinos de região — é a informação que muda
                e a que o gestor procura. */}
            {mostrarAoVivo && aoVivo.map((posicao) => {
              const nome = nomePorId[posicao.id] || "Líder em campo";
              const minutos = minutosDesde(posicao.deviceTimestamp);
              return (
                <Marker
                  key={`live-${posicao.id}`}
                  position={[posicao.lat, posicao.lng]}
                  icon={liveIcon(nome)}
                  title={`${nome} — em campo agora`}
                  zIndexOffset={1000}
                >
                  <Popup>
                    <div style={{ minWidth: 180 }}>
                      <div style={{ fontFamily: "var(--heading)", fontWeight: 700, fontSize: 15 }}>
                        {nome}
                      </div>
                      <div style={{ fontSize: 12, color: "#1a7f37", fontWeight: 600, margin: "3px 0 8px" }}>
                        Em campo agora
                      </div>
                      <div style={{ fontSize: 12, color: "#8a8b80" }}>
                        {minutos === null
                          ? "Posição recebida"
                          : minutos < 1 ? "Atualizado agora mesmo"
                          : `Atualizado há ${minutos} min`}
                        {Number.isFinite(posicao.accuracy) && posicao.accuracy > 0
                          ? ` · precisão ~${posicao.accuracy} m` : ""}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>

          <div style={{ display: "flex", alignItems: "center", gap: 20, padding: "13px 20px", borderTop: "1px solid var(--border)", flexWrap: "wrap" }}>
            <SectionLabel style={{ fontSize: 11.5, letterSpacing: 1 }}>LEGENDA</SectionLabel>
            {Object.entries(PERF_LABELS).map(([key, label]) => (
              <span key={key} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12.5, color: "#5c6657" }}>
                <span style={{ width: 11, height: 11, borderRadius: "50%", background: PERF_COLORS[key] }} />
                {label}
              </span>
            ))}
            <button
              type="button"
              onClick={() => setMostrarAoVivo((v) => !v)}
              title="Mostrar ou esconder quem está compartilhando a posição agora"
              style={{
                display: "flex", alignItems: "center", gap: 7, fontSize: 12.5,
                border: "1px solid var(--border)", borderRadius: 999,
                padding: "4px 11px", cursor: "pointer",
                background: mostrarAoVivo ? "#e8f5ec" : "transparent",
                color: mostrarAoVivo ? "#1a7f37" : "#5c6657",
                fontWeight: mostrarAoVivo ? 600 : 500,
              }}
            >
              <span className={mostrarAoVivo ? "live-dot" : ""} style={{
                width: 9, height: 9, borderRadius: "50%",
                background: mostrarAoVivo ? "#1a7f37" : "#b9bdb2",
              }} />
              {aoVivo.length > 0
                ? `${aoVivo.length} em campo agora`
                : "Ninguém em campo agora"}
            </button>
            <span style={{ fontSize: 12, color: "var(--ink-soft)", marginLeft: "auto" }}>
              {erroAoVivo
                ? "Não consegui ler as posições ao vivo"
                : "O círculo representa o alcance estimado da base"}
            </span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="panel-card" style={{ padding: "18px 20px" }}>
            <SectionLabel style={{ display: "block", marginBottom: 12 }}>LÍDER SELECIONADO</SectionLabel>
            {!selected && (
              <p style={{ fontSize: 13.5, color: "#8a8b80", lineHeight: 1.55 }}>
                Clique em um marcador do mapa para ver o líder da região, sua base de eleitores e o
                histórico de atividade.
              </p>
            )}
            {selected && (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                  <Avatar name={selected.nome} color={PERF_COLORS[selected.perf]} />
                  <div>
                    <div style={{ fontFamily: "var(--heading)", fontWeight: 700, fontSize: 17, color: "var(--ink-strong)", lineHeight: 1.1 }}>
                      {selected.nome}
                    </div>
                    <div style={{ fontSize: 12, color: "#8a8b80", marginTop: 2 }}>
                      {selected.bairro} · {selected.regiao}
                    </div>
                  </div>
                </div>
                <Chip background={`${PERF_COLORS[selected.perf]}1f`} color={PERF_COLORS[selected.perf]}>
                  {PERF_LABELS[selected.perf]}
                </Chip>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 14 }}>
                  <div style={{ background: "#f7f7f3", borderRadius: 10, padding: 12 }}>
                    <div style={{ fontFamily: "var(--heading)", fontWeight: 700, fontSize: 20, color: "var(--ink-strong)" }}>
                      {formatNumber(selected.eleitores)}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--ink-soft)", fontWeight: 600, marginTop: 3 }}>ELEITORES</div>
                  </div>
                  <div style={{ background: "#f7f7f3", borderRadius: 10, padding: 12 }}>
                    <div style={{ fontFamily: "var(--heading)", fontWeight: 700, fontSize: 20, color: "var(--brand-700)" }}>
                      +{selected.semana}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--ink-soft)", fontWeight: 600, marginTop: 3 }}>NA SEMANA</div>
                  </div>
                </div>
                <div style={{ marginTop: 14 }}>
                  <SectionLabel style={{ display: "block", fontSize: 11, letterSpacing: 0.7, marginBottom: 6 }}>
                    RATING DE INDICAÇÕES
                  </SectionLabel>
                  <Stars eleitores={selected.eleitores} />
                </div>
              </div>
            )}
          </div>

          <div className="panel-card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "16px 20px 12px" }}>
              <SectionLabel>LÍDERES POR REGIÃO</SectionLabel>
            </div>
            <div style={{ maxHeight: 300, overflowY: "auto" }}>
              {listed.length === 0 && (
                <div style={{ padding: 22, textAlign: "center", fontSize: 13, color: "var(--ink-soft)" }}>
                  Nenhum líder neste filtro.
                </div>
              )}
              {listed.map((leader) => (
                <button key={leader.id} type="button" className="leader-row" onClick={() => focusLeader(leader)}>
                  <span style={{ width: 9, height: 9, borderRadius: "50%", background: PERF_COLORS[leader.perf], flexShrink: 0 }} />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "block", fontSize: 13.5, fontWeight: 600, color: "#243528" }}>{leader.nome}</span>
                    <span style={{ display: "block", fontSize: 11.5, color: "var(--ink-soft)" }}>{leader.bairro}</span>
                  </span>
                  <b style={{ fontSize: 13, color: PERF_COLORS[leader.perf] }}>{formatNumber(leader.eleitores)}</b>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
