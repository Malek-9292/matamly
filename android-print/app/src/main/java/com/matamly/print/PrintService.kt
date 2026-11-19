package com.matamly.print

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.hardware.usb.UsbConstants
import android.hardware.usb.UsbDevice
import android.hardware.usb.UsbDeviceConnection
import android.hardware.usb.UsbManager
import android.os.Build
import android.os.IBinder
import android.text.Layout
import android.text.StaticLayout
import android.text.TextPaint
import java.net.HttpURLConnection
import java.net.URL
import java.util.concurrent.atomic.AtomicBoolean
import org.json.JSONObject

class PrintService : Service() {
    private val running = AtomicBoolean(false)
    private val prefs by lazy { getSharedPreferences("matamly_print", Context.MODE_PRIVATE) }
    private val seen = LinkedHashSet<String>()

    override fun onCreate() {
        super.onCreate()
        val saved = prefs.getString("seen_jobs", "") ?: ""
        saved.split("|").filter { it.isNotBlank() }.forEach { seen.add(it) }
    }

    override fun onBind(intent: Intent?): IBinder? = null
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        startForeground(7, notification())
        if (running.compareAndSet(false, true)) Thread { workLoop() }.start()
        return START_STICKY
    }
    override fun onDestroy() { running.set(false); super.onDestroy() }

    private fun notification(): Notification {
        val manager = getSystemService(NotificationManager::class.java)
        if (Build.VERSION.SDK_INT >= 26) manager.createNotificationChannel(NotificationChannel("matamly_print", "Matamly Print", NotificationManager.IMPORTANCE_LOW))
        return if (Build.VERSION.SDK_INT >= 26) Notification.Builder(this, "matamly_print").setContentTitle("Matamly Print").setContentText("خدمة الطباعة التلقائية تعمل").setSmallIcon(android.R.drawable.ic_menu_manage).build()
        else Notification.Builder(this).setContentTitle("Matamly Print").setContentText("خدمة الطباعة التلقائية تعمل").setSmallIcon(android.R.drawable.ic_menu_manage).build()
    }

    private fun api(path: String, body: JSONObject? = null): JSONObject {
        val base = prefs.getString("base", "") ?: ""
        val token = prefs.getString("token", "") ?: ""
        val connection = (URL(base + path).openConnection() as HttpURLConnection).apply {
            requestMethod = if (body == null) "GET" else "POST"
            connectTimeout = 12000; readTimeout = 20000
            setRequestProperty("Authorization", "Bearer $token")
            setRequestProperty("Content-Type", "application/json")
            if (body != null) { doOutput = true; outputStream.use { it.write(body.toString().toByteArray(Charsets.UTF_8)) } }
        }
        try {
            val code = connection.responseCode
            val stream = if (code in 200..299) connection.inputStream else connection.errorStream
            val text = stream.bufferedReader(Charsets.UTF_8).use { it.readText() }
            if (code !in 200..299) throw IllegalStateException("HTTP $code: $text")
            return JSONObject(text)
        } finally { connection.disconnect() }
    }

    private fun workLoop() {
        while (running.get()) {
            try {
                api("/api/print/v1/devices/heartbeat", JSONObject().put("appVersion", "1.0.0").put("capabilities", JSONObject().put("platform", "android").put("transports", org.json.JSONArray().put("usb-escpos"))))
                if (hasUsbPrinterPermission()) {
                    val job = api("/api/print/v1/jobs/claim").optJSONObject("job")
                    if (job != null) processJob(job)
                }
            } catch (_: Exception) { }
            try { Thread.sleep(2500) } catch (_: InterruptedException) { Thread.currentThread().interrupt(); break }
        }
    }

    private fun report(id: Int, stage: String, status: String, message: String = "") {
        api("/api/print/v1/jobs/$id/stage", JSONObject().put("stage", stage).put("status", status).put("message", message))
    }

    private fun processJob(job: JSONObject) {
        val id = job.getInt("jobId")
        val key = job.optString("idempotencyKey", "job-$id")
        if (seen.contains(key)) { report(id, "uncertain", "uncertain", "المهمة موجودة في سجل الجهاز؛ تم منع التكرار"); return }
        report(id, "agent_accepted", "ok", "استلم تطبيق Android المهمة")
        try {
            val envelope = job.getJSONObject("document")
            val receipt = envelope.getString("receiptText")
            printUsb(receipt)
            seen.add(key)
            prefs.edit().putString("seen_jobs", seen.toList().takeLast(500).joinToString("|")).apply()
            report(id, "submitted_to_spooler", "ok", "تم إرسال بيانات ESC/POS إلى منفذ USB؛ لم يتوفر تأكيد حساس خروج الورق")
        } catch (e: Exception) {
            report(id, "failed", "failed", (e.message ?: "USB print failed").take(450))
        }
    }

    private fun printUsb(text: String) {
        val manager = getSystemService(Context.USB_SERVICE) as UsbManager
        val device = manager.deviceList.values.firstOrNull() ?: throw IllegalStateException("لم يتم اكتشاف طابعة USB")
        if (!manager.hasPermission(device)) throw IllegalStateException("لم يتم منح إذن USB للطابعة")
        val pair = findBulkOut(device) ?: throw IllegalStateException("الطابعة لا تعرض USB bulk OUT متوافقًا")
        val connection = manager.openDevice(device) ?: throw IllegalStateException("تعذر فتح اتصال USB")
        try {
            val (intf, endpoint) = pair
            if (!connection.claimInterface(intf, true)) throw IllegalStateException("تعذر حجز واجهة USB")
            val bytes = rasterReceipt(text)
            var offset = 0
            while (offset < bytes.size) {
                val size = minOf(16384, bytes.size - offset)
                val chunk = bytes.copyOfRange(offset, offset + size)
                val sent = connection.bulkTransfer(endpoint, chunk, chunk.size, 10000)
                if (sent <= 0) throw IllegalStateException("فشل إرسال بيانات USB")
                offset += sent
            }
            connection.releaseInterface(intf)
        } finally { connection.close() }
    }

    private fun hasUsbPrinterPermission(): Boolean {
        val manager = getSystemService(Context.USB_SERVICE) as UsbManager
        return manager.deviceList.values.any { manager.hasPermission(it) && findBulkOut(it) != null }
    }

    private fun findBulkOut(device: UsbDevice): Pair<android.hardware.usb.UsbInterface, android.hardware.usb.UsbEndpoint>? {
        for (i in 0 until device.interfaceCount) {
            val intf = device.getInterface(i)
            for (e in 0 until intf.endpointCount) {
                val endpoint = intf.getEndpoint(e)
                if (endpoint.type == UsbConstants.USB_ENDPOINT_XFER_BULK && endpoint.direction == UsbConstants.USB_DIR_OUT) return Pair(intf, endpoint)
            }
        }
        return null
    }

    private fun rasterReceipt(text: String): ByteArray {
        val width = 576
        val paint = TextPaint(Paint.ANTI_ALIAS_FLAG).apply { color = Color.BLACK; textSize = 27f; typeface = android.graphics.Typeface.create("sans-serif", android.graphics.Typeface.NORMAL) }
        val layout = StaticLayout.Builder.obtain(text, 0, text.length, paint, width - 24)
            .setAlignment(Layout.Alignment.ALIGN_NORMAL)
            .setTextDirection(android.text.TextDirectionHeuristics.FIRSTSTRONG_RTL)
            .setIncludePad(true).build()
        val bitmap = Bitmap.createBitmap(width, layout.height + 24, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bitmap); canvas.drawColor(Color.WHITE); canvas.save(); canvas.translate(12f, 12f); layout.draw(canvas); canvas.restore()
        val out = java.io.ByteArrayOutputStream()
        out.write(byteArrayOf(0x1b, 0x40))
        val rowBytes = width / 8
        for (y in 0 until bitmap.height step 256) {
            val rows = minOf(256, bitmap.height - y)
            out.write(byteArrayOf(0x1d, 0x76, 0x30, 0x00, (rowBytes and 0xff).toByte(), ((rowBytes shr 8) and 0xff).toByte(), (rows and 0xff).toByte(), ((rows shr 8) and 0xff).toByte()))
            val row = IntArray(width)
            for (yy in y until y + rows) {
                bitmap.getPixels(row, 0, width, 0, yy, width, 1)
                for (x in 0 until width step 8) {
                    var value = 0
                    for (bit in 0..7) {
                        val color = row[x + bit]
                        val gray = (Color.red(color) * 299 + Color.green(color) * 587 + Color.blue(color) * 114) / 1000
                        if (gray < 160) value = value or (1 shl (7 - bit))
                    }
                    out.write(value)
                }
            }
        }
        out.write(byteArrayOf(0x0a, 0x0a, 0x0a, 0x1d, 0x56, 0x00))
        bitmap.recycle()
        return out.toByteArray()
    }
}
