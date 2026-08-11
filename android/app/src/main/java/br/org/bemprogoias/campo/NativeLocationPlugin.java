package br.org.bemprogoias.campo;

import android.Manifest;
import android.content.Context;
import android.content.pm.PackageManager;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;

import androidx.core.content.ContextCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicBoolean;

@CapacitorPlugin(name = "NativeLocation")
public class NativeLocationPlugin extends Plugin {
    private final Handler mainHandler = new Handler(Looper.getMainLooper());
    private final Set<LocationCapture> activeCaptures = Collections.newSetFromMap(new ConcurrentHashMap<>());

    @PluginMethod
    public void getCurrentPosition(PluginCall call) {
        mainHandler.post(() -> startCapture(call));
    }

    private void startCapture(PluginCall call) {
        Context context = getContext();
        boolean coarseGranted = ContextCompat.checkSelfPermission(
            context,
            Manifest.permission.ACCESS_COARSE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED;
        boolean fineGranted = ContextCompat.checkSelfPermission(
            context,
            Manifest.permission.ACCESS_FINE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED;

        if (!coarseGranted && !fineGranted) {
            call.reject("Permita a localização durante o uso do app.", "LOCATION_PERMISSION_DENIED");
            return;
        }

        LocationManager manager = (LocationManager) context.getSystemService(Context.LOCATION_SERVICE);
        if (manager == null) {
            call.reject("O serviço de localização não está disponível neste celular.", "LOCATION_UNAVAILABLE");
            return;
        }

        List<String> providers = new ArrayList<>();
        if (coarseGranted && isEnabled(manager, LocationManager.NETWORK_PROVIDER)) {
            providers.add(LocationManager.NETWORK_PROVIDER);
        }
        if (fineGranted && isEnabled(manager, LocationManager.GPS_PROVIDER)) {
            providers.add(LocationManager.GPS_PROVIDER);
        }

        if (providers.isEmpty()) {
            call.reject("Ative a Localização/GPS do celular e tente novamente.", "LOCATION_DISABLED");
            return;
        }

        long timeout = Math.max(3_000L, Math.min(call.getLong("timeout", 10_000L), 20_000L));
        long maximumAge = Math.max(0L, call.getLong("maximumAge", 300_000L));
        Location cached = bestLastKnown(manager, providers);
        if (cached != null && System.currentTimeMillis() - cached.getTime() <= maximumAge) {
            call.resolve(toResult(cached));
            return;
        }

        LocationCapture capture = new LocationCapture(manager, providers, call, timeout, cached);
        activeCaptures.add(capture);
        capture.start();
    }

    private boolean isEnabled(LocationManager manager, String provider) {
        try {
            return manager.isProviderEnabled(provider);
        } catch (Exception ignored) {
            return false;
        }
    }

    private Location bestLastKnown(LocationManager manager, List<String> providers) {
        Location best = null;
        for (String provider : providers) {
            try {
                Location candidate = manager.getLastKnownLocation(provider);
                if (candidate == null) continue;
                if (best == null || candidate.getTime() > best.getTime()
                    || (candidate.getTime() == best.getTime() && candidate.getAccuracy() < best.getAccuracy())) {
                    best = candidate;
                }
            } catch (SecurityException ignored) {
                // A permissão é conferida antes; um fabricante ainda pode revogá-la neste intervalo.
            }
        }
        return best;
    }

    private JSObject toResult(Location location) {
        JSObject coords = new JSObject();
        coords.put("latitude", location.getLatitude());
        coords.put("longitude", location.getLongitude());
        coords.put("accuracy", location.hasAccuracy() ? location.getAccuracy() : 0);
        JSObject result = new JSObject();
        result.put("coords", coords);
        result.put("timestamp", location.getTime());
        result.put("provider", location.getProvider());
        return result;
    }

    private class LocationCapture implements LocationListener {
        private final LocationManager manager;
        private final List<String> providers;
        private final PluginCall call;
        private final long timeout;
        private final Location staleFallback;
        private final AtomicBoolean finished = new AtomicBoolean(false);
        private final Runnable timeoutTask = this::timeout;

        LocationCapture(LocationManager manager, List<String> providers, PluginCall call, long timeout, Location staleFallback) {
            this.manager = manager;
            this.providers = providers;
            this.call = call;
            this.timeout = timeout;
            this.staleFallback = staleFallback;
        }

        void start() {
            boolean listening = false;
            for (String provider : providers) {
                try {
                    manager.requestLocationUpdates(provider, 0L, 0f, this, Looper.getMainLooper());
                    listening = true;
                } catch (SecurityException | IllegalArgumentException ignored) {
                    // Tenta o próximo provedor disponível.
                }
            }
            if (!listening) {
                finishWithError("Não foi possível iniciar o GPS neste celular.", "LOCATION_UNAVAILABLE");
                return;
            }
            mainHandler.postDelayed(timeoutTask, timeout);
        }

        @Override
        public void onLocationChanged(Location location) {
            if (location != null) finishWithLocation(location);
        }

        @Override
        public void onProviderDisabled(String provider) {
            boolean anyEnabled = providers.stream().anyMatch(item -> isEnabled(manager, item));
            if (!anyEnabled) finishWithError("Ative a Localização/GPS do celular e tente novamente.", "LOCATION_DISABLED");
        }

        @Override public void onProviderEnabled(String provider) {}
        @Override public void onStatusChanged(String provider, int status, Bundle extras) {}

        private void timeout() {
            if (staleFallback != null) finishWithLocation(staleFallback);
            else finishWithError("Nenhum provedor de localização respondeu em 10 segundos.", "LOCATION_TIMEOUT");
        }

        private void finishWithLocation(Location location) {
            if (!finish()) return;
            call.resolve(toResult(location));
        }

        private void finishWithError(String message, String code) {
            if (!finish()) return;
            call.reject(message, code);
        }

        private boolean finish() {
            if (!finished.compareAndSet(false, true)) return false;
            mainHandler.removeCallbacks(timeoutTask);
            try {
                manager.removeUpdates(this);
            } catch (SecurityException ignored) {}
            activeCaptures.remove(this);
            return true;
        }

        void cancel() {
            finish();
        }
    }

    @Override
    protected void handleOnDestroy() {
        for (LocationCapture capture : new ArrayList<>(activeCaptures)) capture.cancel();
        super.handleOnDestroy();
    }
}
