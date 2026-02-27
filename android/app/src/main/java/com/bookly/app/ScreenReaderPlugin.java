
package com.bookly.app;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import android.text.TextUtils;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.Iterator;

@CapacitorPlugin(name = "ScreenReader")
public class ScreenReaderPlugin extends Plugin {

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
    public void syncSettings(PluginCall call) {
        JSObject hoverBotApps = call.getObject("hoverBotApps");
        if (hoverBotApps != null) {
            SharedPreferences sharedPreferences = getContext().getSharedPreferences("HoverBotPrefs", Context.MODE_PRIVATE);
            SharedPreferences.Editor editor = sharedPreferences.edit();
            editor.clear(); // Clear old settings
            Iterator<String> keys = hoverBotApps.keys();
            while (keys.hasNext()) {
                String key = keys.next();
                Boolean value = hoverBotApps.getBool(key);
                if (value != null) {
                    editor.putBoolean(key, value);
                }
            }
            editor.apply();
            call.resolve();
        } else {
            call.reject("hoverBotApps object is null");
        }
    }

    @PluginMethod
    public void requestOverlayPermission(PluginCall call) {
        Context context = getContext();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.canDrawOverlays(context)) {
            Intent intent = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                    Uri.parse("package:" + context.getPackageName()));
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            try {
                context.startActivity(intent);
            } catch (Exception e) {
                // Fallback for some devices that don't support the package URI
                Intent fallbackIntent = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION);
                fallbackIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                try {
                    context.startActivity(fallbackIntent);
                } catch (Exception e2) {
                    call.reject("Could not open overlay settings: " + e2.getMessage());
                    return;
                }
            }
        }
        call.resolve();
    }

    @PluginMethod
    public void requestAccessibilityPermission(PluginCall call) {
        Context context = getContext();
        Intent intent = new Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        try {
            context.startActivity(intent);
        } catch (Exception e) {
            call.reject("Could not open accessibility settings: " + e.getMessage());
            return;
        }
        call.resolve();
    }

    @PluginMethod
    public void checkPermissions(PluginCall call) {
        JSObject ret = new JSObject();
        boolean overlay = true;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            overlay = Settings.canDrawOverlays(getContext());
        }
        ret.put("overlay", overlay);
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
