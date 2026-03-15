import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.healthbuddy.ai',
  appName: 'HealthBuddy AI',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
