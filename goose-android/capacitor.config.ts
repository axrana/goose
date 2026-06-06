import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.goose.whoop",
  appName: "Goose",
  webDir: "dist",
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined,
    },
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: "#0f1619",
      showSpinner: false,
    },
    StatusBar: {
      style: "dark",
      backgroundColor: "#0f1619",
    },
  },
};

export default config;
