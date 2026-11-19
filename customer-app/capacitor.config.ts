import type { CapacitorConfig } from "@capacitor/cli";

const serverUrl = process.env.MATAMLY_SERVER_URL?.trim().replace(/\/$/, "");

if (!serverUrl || !/^https:\/\//i.test(serverUrl)) {
  throw new Error("Set MATAMLY_SERVER_URL to the deployed Matamly HTTPS origin before syncing the customer app.");
}

const config: CapacitorConfig = {
  appId: "com.matamly.customer",
  appName: "فتوش الخالدية",
  // The existing customer web app and its relative /api requests must share
  // the same HTTPS origin until a dedicated native API base URL is implemented.
  webDir: "../dist/public",
  server: {
    url: serverUrl,
    cleartext: false,
    androidScheme: "https",
    iosScheme: "https"
  },
  android: {
    allowMixedContent: false
  },
  ios: {
    contentInset: "automatic",
    allowsLinkPreview: false
  }
};

export default config;
