package br.org.bemprogoias.campo;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(MobileUpdaterPlugin.class);
        registerPlugin(NativeLocationPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
