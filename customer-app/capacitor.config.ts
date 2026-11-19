import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.matamly.customer",
  appName: "فتوش الخالدية",
  webDir: "../dist/public",
  server: {
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
