
package com.bookly.app;

import android.accessibilityservice.AccessibilityService;
import android.accessibilityservice.AccessibilityServiceInfo;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.view.accessibility.AccessibilityEvent;
import android.view.accessibility.AccessibilityNodeInfo;

import java.util.Arrays;
import java.util.List;

public class ChatReaderService extends AccessibilityService {

    private static ChatReaderService instance;
    private List<String> socialApps = Arrays.asList(
        "com.whatsapp", 
        "com.zhiliaoapp.musically", 
        "com.ss.android.ugc.trill", // TikTok Global
        "com.tiktok.android",      // TikTok Variant
        "com.instagram.android", 
        "com.facebook.katana",
        "com.facebook.orca" // Messenger
    );

    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) {
        if (event.getEventType() == AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) {
            CharSequence packageName = event.getPackageName();
            if (packageName != null && socialApps.contains(packageName.toString())) {
                SharedPreferences sharedPreferences = getSharedPreferences("HoverBotPrefs", Context.MODE_PRIVATE);
                boolean isEnabled = sharedPreferences.getBoolean(packageName.toString(), false);
                if (isEnabled) {
                    HoverBotService.showBubble(this);
                } else {
                    HoverBotService.hideBubble(this);
                }
            } else {
                HoverBotService.hideBubble(this);
            }
        }
    }

    public static void captureCurrentScreen() {
        if (instance != null) {
            AccessibilityNodeInfo rootNode = instance.getRootInActiveWindow();
            if (rootNode != null) {
                // Security Check: Only read if the current app is in our allowed whitelist
                CharSequence packageName = rootNode.getPackageName();
                SharedPreferences sharedPreferences = instance.getSharedPreferences("HoverBotPrefs", Context.MODE_PRIVATE);
                boolean isEnabled = sharedPreferences.getBoolean(packageName.toString(), false);

                if (isEnabled) {
                    StringBuilder capturedText = new StringBuilder();
                    scrapeNodeText(rootNode, capturedText);
                    if (capturedText.length() > 0 && ScreenReaderPlugin.getInstance() != null) {
                        ScreenReaderPlugin.getInstance().onOrderTextCaptured(capturedText.toString());
                    }
                }
                rootNode.recycle();
            }
        }
    }

    private static void scrapeNodeText(AccessibilityNodeInfo node, StringBuilder builder) {
        if (node == null) return;
        if (node.getText() != null) {
            builder.append(node.getText().toString()).append("\n");
        }
        for (int i = 0; i < node.getChildCount(); i++) {
            scrapeNodeText(node.getChild(i), builder);
        }
    }

    @Override
    public void onInterrupt() {
    }

    @Override
    protected void onServiceConnected() {
        super.onServiceConnected();
        instance = this;

        // Start the HoverBotService to ensure it's running
        Intent intent = new Intent(this, HoverBotService.class);
        startService(intent);

        AccessibilityServiceInfo info = new AccessibilityServiceInfo();
        info.eventTypes = AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED;
        info.feedbackType = AccessibilityServiceInfo.FEEDBACK_GENERIC;
        info.flags = AccessibilityServiceInfo.FLAG_REPORT_VIEW_IDS;
        info.packageNames = null; // Monitor all apps
        setServiceInfo(info);
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        Intent intent = new Intent(this, HoverBotService.class);
        stopService(intent);
        instance = null;
    }
}
