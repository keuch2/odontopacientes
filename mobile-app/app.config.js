// app.config.js - Configuración dinámica de Expo
// Soporta diferentes entornos: local, staging, production

const IS_DEV = process.env.APP_VARIANT === 'development';
const IS_PREVIEW = process.env.APP_VARIANT === 'preview';

// Detectar el entorno basado en variables de entorno
const getApiUrl = () => {
  // Prioridad: variable de entorno > default por variante
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // Para desarrollo local, usar IP de la máquina (cambiar según tu red)
  // IMPORTANTE: Reemplazar con tu IP LAN real
  // Para obtener tu IP: 
  // - macOS/Linux: ifconfig | grep "inet " | grep -v 127.0.0.1
  // - Windows: ipconfig
  if (IS_DEV) {
    return 'http://192.168.0.2/odontopacientes/backend/public/api';
  }

  // Para preview/staging
  if (IS_PREVIEW) {
    return 'https://staging-api.odontopacientes.com/api';
  }

  // Para producción
  return 'https://codexpy.com/odontopacientes/api';
};

const getAppName = () => {
  if (IS_DEV) return 'OdontoPacientes (DEV)';
  if (IS_PREVIEW) return 'OdontoPacientes (Preview)';
  return 'OdontoPacientes';
};

export default {
  expo: {
    name: getAppName(),
    slug: 'odontopacientes-mobile',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    runtimeVersion: {
      policy: 'appVersion',
    },
    updates: {
      url: 'https://u.expo.dev/8ac47712-6a75-4ba1-be43-eabe80417ad6',
    },
    extra: {
      apiUrl: getApiUrl(),
      storageUrl: getApiUrl().replace('/api', '/storage'),
      environment: IS_DEV ? 'development' : IS_PREVIEW ? 'preview' : 'production',
      eas: {
        projectId: '8ac47712-6a75-4ba1-be43-eabe80417ad6',
      },
    },
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: IS_DEV
        ? 'com.keuch2.odontopacientes-mobile-dev'
        : 'com.keuch2.odontopacientes-mobile',
      infoPlist: {
        NSCameraUsageDescription: 'Esta app necesita acceso a la cámara para tomar fotos de documentos y odontogramas.',
        NSPhotoLibraryUsageDescription: 'Esta app necesita acceso a tu galería para seleccionar imágenes de documentos.',
        NSPhotoLibraryAddUsageDescription: 'Esta app necesita permiso para guardar imágenes en tu galería.',
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      package: IS_DEV
        ? 'com.keuch2.odontopacientes_mobile_dev'
        : 'com.keuch2.odontopacientes_mobile',
      permissions: [
        'CAMERA',
        'READ_EXTERNAL_STORAGE',
        'WRITE_EXTERNAL_STORAGE',
        'READ_MEDIA_IMAGES',
      ],
    },
    web: {
      favicon: './assets/favicon.png',
    },
    plugins: [
      'expo-font',
      '@react-native-community/datetimepicker',
      [
        'expo-image-picker',
        {
          photosPermission: 'Esta app necesita acceso a tu galería para seleccionar imágenes.',
          cameraPermission: 'Esta app necesita acceso a la cámara para tomar fotos.',
        },
      ],
    ],
  },
};
