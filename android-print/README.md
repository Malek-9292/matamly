# Matamly Android Print

This is the native Android USB adapter source project.

## Build

Requires JDK 17 and Gradle 8.9:

```sh
cd android-print
gradle :app:assembleDebug
```

GitHub Actions builds a debug APK for pushes to `development` that change this folder. The APK is uploaded as the `matamly-print-android-debug` workflow artifact when the workflow succeeds.

## Setup

1. Register an Android device in Admin → إدارة الطباعة.
2. Add an enabled USB printer as its default printer (initial target: Epson TM-T20II).
3. Install the APK on the Android phone/tablet.
4. Enter the Matamly development HTTPS URL and the one-time device token.
5. Connect the printer using a supported USB OTG cable and tap **طلب إذن USB للطابعة**. Approve the Android permission prompt.
6. Tap **حفظ وتشغيل خدمة الطباعة**. The foreground service sends heartbeats and polls the server over HTTPS.

The service waits without claiming jobs when no USB device with a bulk OUT endpoint and granted USB permission is available. It persists completed job IDs to avoid duplicate printing after process restarts. It restarts after device boot if it was configured, but Android may require the user to reopen the app and grant USB permission again after reboot or reconnection.

## Important verification boundary

The adapter renders the Arabic receipt to a monochrome bitmap using Android's text layout engine, then sends ESC/POS raster-image commands over USB. This avoids relying on a printer's Arabic code-page shaping for the first version.

The server records `submitted_to_spooler` after USB bulk transfer succeeds. This is **not proof that paper physically exited the printer**. The current Android adapter does not yet read Epson real-time status or paper sensors. A real Epson TM-T20II USB hardware test is still required before production use.

The APK is a debug build until signing and release distribution are configured. Do not install an APK artifact until the corresponding GitHub Actions build succeeds.
