import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ustago.app',
  appName: 'Usta Go',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
      backgroundColor: '#1F2937',
      showSpinner: false,
      spinnerColor: 'white'
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#1F2937'
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    },
    Camera: {
      cameraDirection: 'REAR'
    },
    Keyboard: {
      hideFormAccessoryBar: false,
      resize: 'body'
    }
  }
};

export default config;
