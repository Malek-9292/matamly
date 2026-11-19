package com.matamly.print

import android.Manifest
import android.app.Activity
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager
import android.hardware.usb.UsbDevice
import android.hardware.usb.UsbManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.widget.ArrayAdapter
import android.widget.Button
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.Spinner
import android.widget.TextView
import android.widget.Toast
import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothManager
import java.net.URI

class MainActivity : Activity() {
    private val prefs by lazy { getSharedPreferences("matamly_print", Context.MODE_PRIVATE) }
    private lateinit var base: EditText
    private lateinit var token: EditText
    private lateinit var printerAddress: EditText
    private lateinit var transport: Spinner
    private lateinit var paperWidth: Spinner
    private lateinit var status: TextView
    private var usbReceiverRegistered = false

    private val usbPermissionReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context, intent: Intent) {
            if (intent.action != ACTION_USB_PERMISSION) return
            val granted = intent.getBooleanExtra(UsbManager.EXTRA_PERMISSION_GRANTED, false)
            status.text = if (granted) "تم منح إذن USB للطابعة." else "لم يتم منح إذن USB."
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        showSetup()
    }

    private fun showSetup() {
        val root = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL; setPadding(24, 28, 24, 24) }
        root.addView(TextView(this).apply { text = "Matamly"; textSize = 28f })
        root.addView(TextView(this).apply { text = "تطبيق الكاشير والطباعة — يعمل مع موقع Matamly"; textSize = 14f; setPadding(0, 4, 0, 18) })
        root.addView(label("رابط موقع Matamly"))
        base = EditText(this).apply { hint = "https://your-matamly-host"; setSingleLine(true); setText(prefs.getString("base", "")) }
        root.addView(base)
        root.addView(label("رمز جهاز الطباعة من لوحة الإدارة"))
        token = EditText(this).apply { hint = "Device token"; setSingleLine(true); inputType = android.text.InputType.TYPE_CLASS_TEXT or android.text.InputType.TYPE_TEXT_VARIATION_PASSWORD; setText(prefs.getString("token", "")) }
        root.addView(token)
        root.addView(label("طريقة توصيل الطابعة"))
        transport = Spinner(this).apply {
            adapter = ArrayAdapter(this@MainActivity, android.R.layout.simple_spinner_dropdown_item, arrayOf("USB", "شبكة LAN / Wi-Fi", "Bluetooth"))
            setSelection(when (prefs.getString("printer_connection", "usb")) { "network" -> 1; "bluetooth" -> 2; else -> 0 })
        }
        root.addView(transport)
        root.addView(label("عرض ورق الطابعة"))
        paperWidth = Spinner(this).apply {
            adapter = ArrayAdapter(this@MainActivity, android.R.layout.simple_spinner_dropdown_item, arrayOf("80 مم", "58 مم"))
            setSelection(if (prefs.getInt("printer_width", 576) == 384) 1 else 0)
        }
        root.addView(paperWidth)
        root.addView(label("عنوان الطابعة للشبكة أو Bluetooth"))
        printerAddress = EditText(this).apply { hint = "شبكة: 192.168.1.50:9100 | Bluetooth: MAC"; setSingleLine(true); setText(prefs.getString("printer_address", "")) }
        root.addView(printerAddress)
        root.addView(Button(this).apply { text = "اختيار طابعة USB ومنح الإذن"; setOnClickListener { chooseUsbPrinter() } })
        root.addView(Button(this).apply { text = "اختيار جهاز Bluetooth مقترن"; setOnClickListener { chooseBluetoothPrinter() } })
        status = TextView(this).apply { text = "سجّل الجهاز من لوحة الإدارة أولاً، ثم أدخل رمز الربط هنا."; textSize = 14f; setPadding(0, 12, 0, 12) }
        root.addView(status)
        root.addView(Button(this).apply { text = "حفظ وتشغيل الطباعة التلقائية"; setOnClickListener { saveAndStartPrinter() } })
        root.addView(Button(this).apply { text = "فتح الكاشير"; setOnClickListener { openCashier() } })
        root.addView(Button(this).apply { text = "إيقاف خدمة الطباعة"; setOnClickListener { stopService(Intent(this@MainActivity, PrintService::class.java)); status.text = "تم إيقاف خدمة الطباعة." } })
        setContentView(ScrollView(this).apply { addView(root) })
    }

    private fun label(value: String) = TextView(this).apply { text = value; textSize = 14f; setPadding(0, 12, 0, 4) }
    private fun selectedTransport() = when (transport.selectedItemPosition) { 1 -> "network"; 2 -> "bluetooth"; else -> "usb" }

    private fun saveAndStartPrinter() {
        val server = normalizeBase(base.text.toString())
        val secret = token.text.toString().trim()
        val connection = selectedTransport()
        val address = printerAddress.text.toString().trim()
        if (server == null) { status.text = "أدخل رابط HTTPS صحيحًا للموقع."; return }
        if (secret.length < 40) { status.text = "رمز الجهاز غير صحيح. أنشئ رمزًا من إدارة الطباعة."; return }
        if (connection != "usb" && address.isBlank()) { status.text = "أدخل عنوان الطابعة أولاً."; return }
        prefs.edit().putString("base", server).putString("token", secret).putString("printer_connection", connection).putString("printer_address", address).putInt("printer_width", if (paperWidth.selectedItemPosition == 1) 384 else 576).apply()
        if (connection == "bluetooth" && Build.VERSION.SDK_INT >= 31 && checkSelfPermission(Manifest.permission.BLUETOOTH_CONNECT) != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(arrayOf(Manifest.permission.BLUETOOTH_CONNECT), REQUEST_BLUETOOTH)
            return
        }
        if (connection == "usb" && !hasGrantedUsbPrinter()) { status.text = "اختَر طابعة USB وامنح التطبيق الإذن قبل التشغيل."; chooseUsbPrinter(); return }
        startPrintService()
    }

    private fun startPrintService() {
        val intent = Intent(this, PrintService::class.java)
        if (Build.VERSION.SDK_INT >= 26) startForegroundService(intent) else startService(intent)
        status.text = "تم حفظ الإعدادات وبدء خدمة الطباعة."
        Toast.makeText(this, "خدمة Matamly تعمل", Toast.LENGTH_SHORT).show()
    }

    private fun openCashier() {
        val server = normalizeBase(base.text.toString()) ?: normalizeBase(prefs.getString("base", "") ?: "")
        if (server == null) { status.text = "أدخل رابط الموقع أولاً."; return }
        prefs.edit().putString("base", server).apply()
        // Keep cashier UI in the browser/PWA. This APK is only the local print bridge.
        startActivity(Intent(Intent.ACTION_VIEW, Uri.parse("$server/cashier")))
    }

    private fun chooseUsbPrinter() {
        val manager = getSystemService(Context.USB_SERVICE) as UsbManager
        val devices = manager.deviceList.values.filter { hasBulkOut(it) }
        if (devices.isEmpty()) { status.text = "لم يتم العثور على USB مناسب. تحقق من كابل OTG والطابعة."; return }
        val names = devices.map { (it.productName ?: "USB printer") + " (VID " + it.vendorId + " / PID " + it.productId + ")" }.toTypedArray()
        android.app.AlertDialog.Builder(this).setTitle("اختيار طابعة USB").setItems(names) { _, which -> requestUsbPermission(devices[which]) }.setNegativeButton("إلغاء", null).show()
    }

    private fun hasBulkOut(device: UsbDevice): Boolean {
        for (i in 0 until device.interfaceCount) {
            val intf = device.getInterface(i)
            for (e in 0 until intf.endpointCount) {
                val endpoint = intf.getEndpoint(e)
                if (endpoint.type == android.hardware.usb.UsbConstants.USB_ENDPOINT_XFER_BULK && endpoint.direction == android.hardware.usb.UsbConstants.USB_DIR_OUT) return true
            }
        }
        return false
    }

    private fun requestUsbPermission(device: UsbDevice) {
        val manager = getSystemService(Context.USB_SERVICE) as UsbManager
        if (manager.hasPermission(device)) {
            prefs.edit().putInt("usb_vendor_id", device.vendorId).putInt("usb_product_id", device.productId).apply()
            status.text = "الطابعة جاهزة."
            return
        }
        if (!usbReceiverRegistered) {
            val filter = IntentFilter(ACTION_USB_PERMISSION)
            if (Build.VERSION.SDK_INT >= 33) registerReceiver(usbPermissionReceiver, filter, Context.RECEIVER_NOT_EXPORTED) else registerReceiver(usbPermissionReceiver, filter)
            usbReceiverRegistered = true
        }
        val mutabilityFlag = if (Build.VERSION.SDK_INT >= 31) PendingIntent.FLAG_MUTABLE else 0
        val flags = PendingIntent.FLAG_UPDATE_CURRENT or mutabilityFlag
        val pending = PendingIntent.getBroadcast(this, device.deviceId, Intent(ACTION_USB_PERMISSION).setPackage(packageName), flags)
        manager.requestPermission(device, pending)
        prefs.edit().putInt("usb_vendor_id", device.vendorId).putInt("usb_product_id", device.productId).apply()
        status.text = "وافق على نافذة إذن USB التي يعرضها Android."
    }

    private fun hasGrantedUsbPrinter(): Boolean {
        val manager = getSystemService(Context.USB_SERVICE) as UsbManager
        val vendor = prefs.getInt("usb_vendor_id", -1)
        val product = prefs.getInt("usb_product_id", -1)
        return manager.deviceList.values.any { it.vendorId == vendor && it.productId == product && manager.hasPermission(it) }
    }

    private fun chooseBluetoothPrinter() {
        if (Build.VERSION.SDK_INT >= 31 && checkSelfPermission(Manifest.permission.BLUETOOTH_CONNECT) != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(arrayOf(Manifest.permission.BLUETOOTH_CONNECT), REQUEST_BLUETOOTH); return
        }
        try {
            val adapter: BluetoothAdapter? = (getSystemService(Context.BLUETOOTH_SERVICE) as BluetoothManager).adapter
            val devices = adapter?.bondedDevices?.toList().orEmpty()
            if (devices.isEmpty()) { status.text = "لا توجد أجهزة مقترنة. اربط الطابعة من إعدادات Android أولاً."; return }
            val names = devices.map { (it.name ?: "Bluetooth device") + " — " + it.address }.toTypedArray()
            android.app.AlertDialog.Builder(this).setTitle("اختيار جهاز Bluetooth").setItems(names) { _, which ->
                printerAddress.setText(devices[which].address); transport.setSelection(2)
            }.setNegativeButton("إلغاء", null).show()
        } catch (_: SecurityException) { status.text = "اسمح للتطبيق بالوصول إلى أجهزة Bluetooth." }
    }

    override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<out String>, grantResults: IntArray) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == REQUEST_BLUETOOTH) {
            if (grantResults.isNotEmpty() && grantResults[0] == PackageManager.PERMISSION_GRANTED) chooseBluetoothPrinter()
            else status.text = "إذن Bluetooth مطلوب لهذا النوع من الطابعات."
        }
    }

    override fun onDestroy() {
        if (usbReceiverRegistered) { unregisterReceiver(usbPermissionReceiver); usbReceiverRegistered = false }
        super.onDestroy()
    }

    private fun normalizeBase(value: String): String? {
        val candidate = value.trim().trimEnd('/')
        return try { val uri = URI(candidate); if (uri.scheme == "https" && !uri.host.isNullOrBlank() && uri.userInfo == null) candidate else null } catch (_: Exception) { null }
    }

    companion object {
        private const val ACTION_USB_PERMISSION = "com.matamly.print.USB_PERMISSION"
        private const val REQUEST_BLUETOOTH = 1002
    }
}
