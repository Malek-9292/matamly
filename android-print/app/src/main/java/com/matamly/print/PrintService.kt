package com.matamly.print

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothManager
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.hardware.usb.UsbConstants
import android.hardware.usb.UsbDevice
import android.hardware.usb.UsbManager
import android.os.Build
import android.os.IBinder
import android.util.Log
import android.text.Layout
import android.text.StaticLayout
import android.text.TextPaint
import java.net.InetSocketAddress
import java.net.Socket
import java.net.HttpURLConnection
import java.net.URL
import java.util.UUID
import java.util.concurrent.atomic.AtomicBoolean
import org.json.JSONObject

class PrintService : Service() {
    private val running = AtomicBoolean(false)
    private val prefs by lazy { getSharedPreferences("matamly_print", Context.MODE_PRIVATE) }
    private val jobStates = JSONObject()
    private val stateLock = Any()

    override fun onCreate() {
        super.onCreate()
        try {
            val saved = JSONObject(prefs.getString("job_states", "{}") ?: "{}")
            val keys = saved.keys()
            while (keys.hasNext()) {
                val key = keys.next()
                val state = saved.optJSONObject(key) ?: continue
                if (state.optString("state") == "printing") {
                    state.put("state", "uncertain")
                    state.put("updatedAt", System.currentTimeMillis())
                    state.put("message", "أُعيد تشغيل التطبيق أثناء محاولة الطباعة؛ يلزم التحقق من الورق قبل إعادة المحاولة")
                }
                jobStates.put(key, state)
            }
        } catch (e: Exception) {
            Log.e("MatamlyPrint", "Could not restore durable print states", e)
        }
        val legacySeen = (prefs.getString("seen_jobs", "") ?: "").split("|").filter { it.isNotBlank() }
        legacySeen.forEach { key ->
            if (!jobStates.has(key)) jobStates.put(key, JSONObject().put("state", "submitted").put("updatedAt", System.currentTimeMillis()).put("message", "سجل طباعة سابق"))
        }
        persistJobStates()
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
        return if (Build.VERSION.SDK_INT >= 26) Notification.Builder(this, "matamly_print").setContentTitle("Matamly").setContentText("خدمة استقبال وطباعة الطلبات تعمل").setSmallIcon(android.R.drawable.ic_menu_manage).build()
        else Notification.Builder(this).setContentTitle("Matamly").setContentText("خدمة استقبال وطباعة الطلبات تعمل").setSmallIcon(android.R.drawable.ic_menu_manage).build()
    }

    private fun api(path: String, body: JSONObject? = null): JSONObject {
        val base = prefs.getString("base", "") ?: ""
        val token = prefs.getString("token", "") ?: ""
        val connection = (URL(base + path).openConnection() as HttpURLConnection).apply {
            requestMethod = if (body == null) "GET" else "POST"
            connectTimeout = 12000
            readTimeout = 20000
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
                val transport = prefs.getString("printer_connection", "usb") ?: "usb"
                val transports = org.json.JSONArray().put("usb-escpos").put("network-escpos").put("bluetooth-spp")
                api("/api/print/v1/devices/heartbeat", JSONObject()
                    .put("appVersion", "1.1.0")
                    .put("capabilities", JSONObject().put("platform", "android").put("transports", transports)))
                if (printerReady(transport)) {
                    val job = api("/api/print/v1/jobs/claim").optJSONObject("job")
                    if (job != null) processJob(job)
                }
            } catch (e: Exception) {
                Log.e("MatamlyPrint", "Print worker loop failed", e)
                prefs.edit().putString("last_print_error", (e.message ?: e.javaClass.simpleName).take(450)).apply()
            }
            try { Thread.sleep(2500) } catch (_: InterruptedException) { Thread.currentThread().interrupt(); break }
        }
    }

    private fun printerReady(transport: String): Boolean = when (transport) {
        "usb" -> {
            val manager = getSystemService(Context.USB_SERVICE) as UsbManager
            val vendor = prefs.getInt("usb_vendor_id", -1)
            val product = prefs.getInt("usb_product_id", -1)
            manager.deviceList.values.any { it.vendorId == vendor && it.productId == product && manager.hasPermission(it) && findBulkOut(it) != null }
        }
        "network" -> !prefs.getString("printer_address", "").isNullOrBlank()
        "bluetooth" -> !prefs.getString("printer_address", "").isNullOrBlank() &&
            (Build.VERSION.SDK_INT < 31 || checkBluetoothPermission())
        else -> false
    }

    private fun checkBluetoothPermission(): Boolean =
        Build.VERSION.SDK_INT < 31 || checkSelfPermission(android.Manifest.permission.BLUETOOTH_CONNECT) == android.content.pm.PackageManager.PERMISSION_GRANTED

    private fun report(id: Int, stage: String, status: String, message: String = "") {
        api("/api/print/v1/jobs/$id/stage", JSONObject().put("stage", stage).put("status", status).put("message", message))
    }

    private fun persistJobStates(): Boolean {
        synchronized(stateLock) {
            val keys = jobStates.keys().asSequence().toList()
            if (keys.size > 500) {
                val remove = keys.sortedBy { jobStates.optJSONObject(it)?.optLong("updatedAt") ?: 0L }.take(keys.size - 500)
                remove.forEach { jobStates.remove(it) }
            }
            return prefs.edit().putString("job_states", jobStates.toString()).commit()
        }
    }

    private fun stateOf(key: String): String = synchronized(stateLock) {
        jobStates.optJSONObject(key)?.optString("state").orEmpty()
    }

    private fun saveJobState(key: String, state: String, message: String = ""): Boolean {
        synchronized(stateLock) {
            jobStates.put(key, JSONObject()
                .put("state", state)
                .put("updatedAt", System.currentTimeMillis())
                .put("message", message.take(450)))
            return persistJobStates()
        }
    }

    private fun processJob(job: JSONObject) {
        val id = job.getInt("jobId")
        val key = job.optString("idempotencyKey", "").ifBlank { "job-$id" }
        when (stateOf(key)) {
            "submitted" -> {
                report(id, "submitted_to_spooler", "ok", "المهمة سبق إرسالها للطابعة؛ تم منع إعادة الإرسال")
                return
            }
            "printing", "uncertain" -> {
                saveJobState(key, "uncertain", "نتيجة المحاولة السابقة غير مؤكدة؛ تحقق من الورق قبل إعادة الطباعة")
                report(id, "uncertain", "uncertain", "تم منع التكرار. تحقق من الطابعة قبل إعادة المحاولة يدويًا.")
                return
            }
        }

        // Persist before any printer bytes can be sent.
        if (!saveJobState(key, "printing", "بدأت محاولة إرسال الإيصال")) {
            report(id, "uncertain", "uncertain", "تعذر حفظ حالة المهمة على الجهاز؛ تم إيقاف الطباعة لتجنب التكرار")
            return
        }

        try {
            report(id, "agent_accepted", "ok", "استلم تطبيق Matamly المهمة")
            val receipt = job.getJSONObject("document").getString("receiptText")
            val printer = job.optJSONObject("printer") ?: JSONObject()
            val transport = printer.optString("connectionType", prefs.getString("printer_connection", "usb"))
            val address = printer.optString("address", prefs.getString("printer_address", "") ?: "")
            when (transport) {
                "usb" -> printUsb(receipt)
                "network" -> printNetwork(receipt, address)
                "bluetooth" -> printBluetooth(receipt, address)
                else -> throw IllegalStateException("طريقة الطباعة غير مدعومة في هذا الإصدار: $transport")
            }
            if (!saveJobState(key, "submitted", "تم إرسال البيانات إلى وسيط الطباعة")) {
                report(id, "uncertain", "uncertain", "تم الإرسال لكن تعذر حفظ تأكيد الجهاز؛ تحقق من الورق")
                return
            }
            report(id, "submitted_to_spooler", "ok", "تم إرسال بيانات ESC/POS إلى الطابعة. لا يتوفر تأكيد خروج الورق.")
        } catch (e: Exception) {
            val message = (e.message ?: "Print result is uncertain").take(450)
            saveJobState(key, "uncertain", message)
            try {
                report(id, "uncertain", "uncertain", "نتيجة الإرسال غير مؤكدة: $message. تحقق من الورق قبل إعادة الطباعة.")
            } catch (reportError: Exception) {
                Log.e("MatamlyPrint", "Could not report uncertain print job $id", reportError)
                throw reportError
            }
        }
    }

    private fun printNetwork(text: String, address: String) {
        val parts = address.trim().split(":")
        val host = parts.firstOrNull().orEmpty()
        val port = if (parts.size > 1) parts.last().toIntOrNull() ?: 9100 else 9100
        if (host.isBlank() || port !in 1..65535) throw IllegalStateException("عنوان طابعة الشبكة غير صحيح؛ استخدم IP:9100")
        Socket().use { socket ->
            socket.connect(InetSocketAddress(host, port), 7000)
            socket.soTimeout = 7000
            socket.getOutputStream().use { it.write(escPosReceipt(text)); it.flush() }
        }
    }

    private fun printBluetooth(text: String, address: String) {
        if (!checkBluetoothPermission()) throw IllegalStateException("يلزم منح إذن Bluetooth من إعدادات التطبيق")
        val adapter = (getSystemService(Context.BLUETOOTH_SERVICE) as BluetoothManager).adapter ?: throw IllegalStateException("Bluetooth غير متوفر على هذا الجهاز")
        val device = adapter.getRemoteDevice(address)
        val uuid = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB")
        val socket = device.createRfcommSocketToServiceRecord(uuid)
        try {
            socket.connect()
            socket.outputStream.use { it.write(escPosReceipt(text)); it.flush() }
        } finally { try { socket.close() } catch (_: Exception) { } }
    }

    private fun printUsb(text: String) {
        val manager = getSystemService(Context.USB_SERVICE) as UsbManager
        val vendor = prefs.getInt("usb_vendor_id", -1)
        val product = prefs.getInt("usb_product_id", -1)
        val device = manager.deviceList.values.firstOrNull { it.vendorId == vendor && it.productId == product }
            ?: throw IllegalStateException("لم يتم العثور على طابعة USB المختارة")
        if (!manager.hasPermission(device)) throw IllegalStateException("إذن USB للطابعة غير متاح؛ افتح التطبيق وامنح الإذن مرة أخرى")
        val pair = findBulkOut(device) ?: throw IllegalStateException("الطابعة لا تعرض USB bulk OUT متوافقًا")
        val connection = manager.openDevice(device) ?: throw IllegalStateException("تعذر فتح اتصال USB")
        try {
            val (intf, endpoint) = pair
            if (!connection.claimInterface(intf, true)) throw IllegalStateException("تعذر حجز واجهة USB")
            val bytes = escPosReceipt(text)
            var offset = 0
            while (offset < bytes.size) {
                val size = minOf(8192, bytes.size - offset)
                val chunk = bytes.copyOfRange(offset, offset + size)
                val sent = connection.bulkTransfer(endpoint, chunk, chunk.size, 10000)
                if (sent <= 0) throw IllegalStateException("فشل إرسال بيانات USB")
                offset += sent
            }
            connection.releaseInterface(intf)
        } finally { connection.close() }
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

    private fun escPosReceipt(text: String): ByteArray {
        val out = java.io.ByteArrayOutputStream()
        out.write(byteArrayOf(0x1b, 0x40))
        out.write(rasterReceipt(text))
        out.write(byteArrayOf(0x0a, 0x0a, 0x0a, 0x1d, 0x56, 0x00))
        return out.toByteArray()
    }

    private fun rasterReceipt(text: String): ByteArray {
        val width = if (prefs.getInt("printer_width", 576) == 384) 384 else 576
        val paint = TextPaint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.BLACK
            textSize = 27f
            typeface = android.graphics.Typeface.create("sans-serif", android.graphics.Typeface.NORMAL)
        }
        val layout = StaticLayout.Builder.obtain(text, 0, text.length, paint, width - 24)
            .setAlignment(Layout.Alignment.ALIGN_NORMAL)
            .setTextDirection(android.text.TextDirectionHeuristics.FIRSTSTRONG_RTL)
            .setIncludePad(true).build()
        val bitmap = Bitmap.createBitmap(width, layout.height + 24, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bitmap)
        canvas.drawColor(Color.WHITE)
        canvas.save()
        canvas.translate(12f, 12f)
        layout.draw(canvas)
        canvas.restore()
        val out = java.io.ByteArrayOutputStream()
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
        bitmap.recycle()
        return out.toByteArray()
    }
}
