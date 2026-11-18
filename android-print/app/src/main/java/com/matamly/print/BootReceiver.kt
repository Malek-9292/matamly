package com.matamly.print

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build

class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent?) {
        if (intent?.action != Intent.ACTION_BOOT_COMPLETED) return
        val prefs = context.getSharedPreferences("matamly_print", Context.MODE_PRIVATE)
        if (prefs.getString("base", "").isNullOrBlank() || prefs.getString("token", "").isNullOrBlank()) return
        val service = Intent(context, PrintService::class.java)
        if (Build.VERSION.SDK_INT >= 26) context.startForegroundService(service) else context.startService(service)
    }
}
