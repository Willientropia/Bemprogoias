import { useEffect, useRef } from 'react';
import L from 'leaflet';

const DEFAULT_CENTER = [-16.6869, -49.2648];

function pinIcon() {
  return L.divIcon({ className: 'map-pin', html: '<span></span>', iconSize: [28, 36], iconAnchor: [14, 34] });
}

export function MapPicker({ value, onChange, online, readOnly = false }) {
  const container = useRef(null);
  const map = useRef(null);
  const marker = useRef(null);
  const initialValue = useRef(value);
  const onChangeRef = useRef(onChange);
  const readOnlyRef = useRef(readOnly);

  useEffect(() => {
    onChangeRef.current = onChange;
    readOnlyRef.current = readOnly;
  }, [onChange, readOnly]);

  useEffect(() => {
    if (!container.current || map.current || !online) return undefined;
    const startingValue = initialValue.current;
    const center = Number.isFinite(startingValue?.lat) ? [startingValue.lat, startingValue.lng] : DEFAULT_CENTER;
    map.current = L.map(container.current, { zoomControl: true, attributionControl: true }).setView(center, startingValue?.lat ? 16 : 7);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap'
    }).addTo(map.current);
    if (Number.isFinite(startingValue?.lat)) marker.current = L.marker(center, { icon: pinIcon() }).addTo(map.current);
    map.current.on('click', ({ latlng }) => {
      if (readOnlyRef.current) return;
      if (!marker.current) marker.current = L.marker(latlng, { icon: pinIcon() }).addTo(map.current);
      else marker.current.setLatLng(latlng);
      onChangeRef.current({ lat: latlng.lat, lng: latlng.lng, accuracy: null, capturedAt: new Date().toISOString() });
    });
    window.setTimeout(() => map.current?.invalidateSize(), 100);
    return () => {
      map.current?.remove();
      map.current = null;
      marker.current = null;
    };
  }, [online]); // o mapa mantém o próprio estado após a montagem

  // Acompanha a posição vinda do GPS: cada nova captura reposiciona o pino
  // sem recriar o mapa.
  useEffect(() => {
    if (!map.current || !Number.isFinite(value?.lat) || !Number.isFinite(value?.lng)) return;
    const point = [value.lat, value.lng];
    if (!marker.current) marker.current = L.marker(point, { icon: pinIcon() }).addTo(map.current);
    else marker.current.setLatLng(point);
    map.current.setView(point, Math.max(map.current.getZoom(), 16));
  }, [value?.lat, value?.lng]);

  if (!online) {
    return (
      <div className="map-offline">
        <IconOffline />
        <b>Mapa indisponível sem internet</b>
        <span>Use o GPS, que continua funcionando offline, ou digite o endereço.</span>
      </div>
    );
  }
  return <div ref={container} className="map-picker" aria-label="Mapa para marcar a localização" />;
}

function IconOffline() {
  return <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3Z"/><path d="M9 3v15M15 6v15"/><path d="m3 3 18 18"/></svg>;
}
