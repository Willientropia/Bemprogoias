import { beforeEach, describe, expect, it, vi } from 'vitest';
import { startLeaderLocationSharing } from '../../src/services/liveLocation';
import { prepareNativeGeolocation } from '../../src/services/location';

// Mesmo Proxy-armadilha do plugin: qualquer propriedade responde com função,
// inclusive `then`. Compartilhar a localização passa pelo mesmo caminho da
// captura avulsa, então precisa da mesma proteção.
const geolocation = vi.hoisted(() => ({
  watchPosition: vi.fn(),
  clearWatch: vi.fn(),
  then: vi.fn()
}));

vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: vi.fn(() => true) } }));
vi.mock('../../src/services/firebase', () => ({ db: {} }));
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(() => ({})),
  onSnapshot: vi.fn(),
  serverTimestamp: vi.fn(() => 'agora'),
  setDoc: vi.fn(() => Promise.resolve())
}));
vi.mock('../../src/services/location', () => ({ prepareNativeGeolocation: vi.fn() }));

const session = { campaignId: 'campanha-1', uid: 'lider-1' };

beforeEach(() => {
  vi.clearAllMocks();
  prepareNativeGeolocation.mockResolvedValue({ geolocation });
  geolocation.watchPosition.mockResolvedValue('watch-1');
});

describe('compartilhamento de localização do líder', () => {
  it('começa a observar a posição sem travar no Proxy do plugin', async () => {
    const onPosition = vi.fn();

    const tracker = await startLeaderLocationSharing(session, { onPosition });

    expect(geolocation.watchPosition).toHaveBeenCalledTimes(1);
    expect(geolocation.then).not.toHaveBeenCalled();
    expect(tracker.stop).toBeInstanceOf(Function);
  });

  it('encerra a observação ao parar o compartilhamento', async () => {
    const tracker = await startLeaderLocationSharing(session, {});

    await tracker.stop();

    expect(geolocation.clearWatch).toHaveBeenCalledWith({ id: 'watch-1' });
  });

  it('entrega ao app cada posição recebida do GPS', async () => {
    const onPosition = vi.fn();
    await startLeaderLocationSharing(session, { onPosition });

    const callback = geolocation.watchPosition.mock.calls[0][1];
    callback({ coords: { latitude: -16.67, longitude: -49.25, accuracy: 8 }, timestamp: 1_770_000_000_000 });

    expect(onPosition).toHaveBeenCalledWith(expect.objectContaining({ lat: -16.67, lng: -49.25, accuracy: 8 }));
  });
});
