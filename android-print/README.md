# Matamly Android Cashier

This is the Android companion app for the existing Matamly restaurant project. It opens the existing `/cashier` page inside a native Android WebView and runs the native print worker in the same app. Customer ordering, administration, authentication, and data remain on the existing Matamly HTTPS server; this APK is not an offline replacement for the server.

## Android compatibility

- Minimum Android: 6.0 (API 23).
- Built with Java 17, Kotlin 2.0, Android Gradle Plugin 8.7.
- Uses Android platform APIs rather than manufacturer-specific UI frameworks.
- Intended to run on Samsung, Xiaomi, Oppo, Vivo, Huawei, Honor, Lenovo, Sunmi, iMin and generic Android POS devices, subject to the device exposing standard Android WebView, USB Host, Bluetooth or network APIs.
- Chinese POS devices that expose their built-in printer only through a proprietary SDK need a separate OEM adapter. No generic Android application can silently control every vendor's internal printer without that SDK.

## Supported printer transports in this build

- USB host + ESC/POS bulk OUT (OTG where required).
- LAN / Wi-Fi TCP ESC/POS, default port 9100; enter `IP:PORT` in printer setup.
- Bluetooth Classic SPP ESC/POS; pair the printer in Android settings first, then select its MAC address.
- The Android system print framework and vendor-specific internal printer SDKs are not silently driven by this ESC/POS worker yet.

## Setup

1. Deploy the current Matamly branch and open Admin → إدارة الطباعة.
2. Register a device with platform Android and a recognizable name, then add its default printer.
3. For network printers, enter the printer's IP address and port (usually `192.168.1.50:9100`). For Bluetooth, enter/select the paired device MAC address. For USB, leave the address empty.
4. Install the APK on the cashier Android device.
5. Enter the Matamly HTTPS base URL and the one-time device token shown by the admin pairing screen.
6. Select the same printer transport configured in Admin. Choose the matching paper width (58mm or 80mm). For USB, choose the device and approve Android's USB permission. For Bluetooth, pair it in Android settings and grant Nearby devices permission when requested.
7. Tap **حفظ وتشغيل الطباعة التلقائية**, then **فتح الكاشير** and sign in with the cashier account.

The WebView shares the Android app's cookie store, so the normal cashier login session is retained by the existing site. The print service makes outbound HTTPS requests only; the server never needs to connect inbound to the Android device.

## Background operation

The app uses a foreground connected-device service and requests restart after device boot. Android vendors may apply extra battery/background restrictions. On Sunmi, iMin and other POS builds, allow Matamly to run automatically / in the background and disable battery optimization for the app where the device settings provide those controls. After USB reconnection or a reboot, some Android versions require the cashier to reopen the app and grant USB permission again.

## Delivery and verification boundary

The app reports `submitted_to_spooler` after the bytes are accepted by the USB, TCP or Bluetooth output stream. This is not proof that paper physically exited the printer. A printer that exposes reliable status or paper sensors can support a stronger acknowledgement in a future model-specific adapter.

A successful GitHub Actions build verifies compilation only. Before production use, test the actual printer and Android device combination, including Arabic receipt layout, paper width, disconnect/reconnect, duplicate prevention, and background restart. Proprietary built-in printers require their manufacturer's SDK and a dedicated tested adapter.
