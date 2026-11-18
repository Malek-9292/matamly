package com.matamly.print

import android.app.Activity
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.hardware.usb.UsbManager
import android.os.Build
import android.os.Bundle
import android.view.ViewGroup
import android.widget.Button
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.TextView

class MainActivity : Activity() {
    private val prefs by lazy { getSharedPreferences("matamly_print", Context.MODE_PRIVATE) }
    private lateinit var base: EditText
    private lateinit var token: EditText
    private lateinit var status: TextView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val root = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL; setPadding(28, 32, 28, 24) }
        root.addView(TextView(this).apply { text = "Matamly Universal Print"; textSize = 24f })
        root.addView(TextView(this).apply { text = "عنوان HTTPS الخاص بالموقع" })
        base = EditText(this).apply { hint = "https://your-matamly-host"; setText(prefs.getString("base", "")) }
        root.addView(base)
        root.addView(TextView(this).apply { text = "رمز الجهاز الذي أنشأته لوحة الإدارة" })
        token = EditText(this).apply { hint = "Device token"; setSingleLine(true); setText(prefs.getString("token", "")) }
        root.addView(token)
        status = TextView(this).apply { text = "يلزم منح إذن USB للطابعة قبل بدء التشغيل."; textSize = 14f }
        root.addView(status)
        root.addView(Button(this).apply {
            text = "طلب إذن USB للطابعة"
            setOnClickListener { requestUsbPermission() }
        })
        root.addView(Button(this).apply {
            text = "حفظ وتشغيل خدمة الطباعة"
            setOnClickListener {
                val server = base.text.toString().trim().trimEnd('/')
                val secret = token.text.toString().trim()
                if (!server.startsWith("https://") || secret.length < 24) {
                    status.text = "أدخل رابط HTTPS ورمز جهاز صحيحًا."
                    return@setOnClickListener
                }
                prefs.edit().putString("base", server).putString("token", secret).apply()
                val intent = Intent(this@MainActivity, PrintService::class.java)
                if (Build.VERSION.SDK_INT >= 26) startForegroundService(intent) else startService(intent)
                status.text = "خدمة الطباعة تعمل. ستستقبل المهام عند توفر طابعة USB."
            }
        })
        root.addView(Button(this).apply {
            text = "إيقاف الخدمة"
            setOnClickListener { stopService(Intent(this@MainActivity, PrintService::class.java)); status.text = "تم إيقاف الخدمة." }
        })
        setContentView(root, ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT))
    }

    private fun requestUsbPermission() {
        val manager = getSystemService(Context.USB_SERVICE) as UsbManager
        val device = manager.deviceList.values.firstOrNull()
        if (device == null) { status.text = "لم يتم اكتشاف جهاز USB. تحقق من كابل OTG والطابعة."; return }
        val permissionIntent = PendingIntent.getBroadcast(this, 0, Intent("com.matamly.print.USB_PERMISSION"), PendingIntent.FLAG_IMMUTABLE)
        manager.requestPermission(device, permissionIntent)
        status.text = "تم إرسال طلب إذن USB. وافق على الرسالة التي تظهر من Android."
    }
}
