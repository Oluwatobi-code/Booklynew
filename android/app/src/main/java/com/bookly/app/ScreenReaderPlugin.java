
package com.bookly.app;

import android.content.Intent;
import android.os.Build;
import android.provider.Settings;
import android.text.TextUtils;
import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;



@CapacitorPlugin(name = "ScreenReader")
public class ScreenReaderPlugin extends Plugin {

    private static final String TAG = "ScreenReaderPlugin";
    private static ScreenReaderPlugin instance;

    @Override
    public void load() {
        super.load();
        instance = this;
    }

    public static ScreenReaderPlugin getInstance() {
        return instance;
    }

    @PluginMethod
    public void requestAccessibilityPermission(PluginCall call) {
        try {
            Intent intent = new Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            startActivitySafely(intent);
            call.resolve();
        } catch (Exception e) {
            Log.e(TAG, "Failed accessibility intent", e);
            try {
                // Fallback: open general phone settings
                Intent fallback = new Intent(Settings.ACTION_SETTINGS);
                fallback.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                startActivitySafely(fallback);
                call.resolve();
            } catch (Exception e2) {
                call.reject("Could not open settings");
            }
        }
    }

    private void startActivitySafely(Intent intent) throws Exception {
        if (getActivity() != null) {
            try {
                getActivity().startActivity(intent);
                return;
            } catch (Exception e) {
                Log.w(TAG, "Activity.startActivity failed, trying context", e);
            }
        }

        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        getContext().getApplicationContext().startActivity(intent);
    }

    @PluginMethod
    public void checkPermissions(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("accessibility", isAccessibilityServiceEnabled(getContext(), ChatReaderService.class));
        call.resolve(ret);
    }

    private boolean isAccessibilityServiceEnabled(Context context, Class<?> service) {
        String prefString = Settings.Secure.getString(context.getContentResolver(), Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES);
        if (prefString != null) {
            TextUtils.SimpleStringSplitter splitter = new TextUtils.SimpleStringSplitter(':');
            splitter.setString(prefString);
            while (splitter.hasNext()) {
                String componentName = splitter.next();
                if (componentName.equalsIgnoreCase(context.getPackageName() + "/" + service.getName())) {
                    return true;
                }
            }
        }
        return false;
    }

    public void onOrderTextCaptured(String text) {
        JSObject ret = new JSObject();
        ret.put("text", text);
        notifyListeners("onOrderTextCaptured", ret, true);
    }
}
