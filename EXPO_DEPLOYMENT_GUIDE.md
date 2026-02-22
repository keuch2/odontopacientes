# 📱 Guía de Deployment - OdontoPacientes Mobile (Expo)

## 🎯 Objetivo

Esta guía te ayudará a configurar y ejecutar la aplicación móvil de OdontoPacientes en Expo Go y preparar builds para producción, asegurando que todos los datos e imágenes reales se carguen correctamente.

---

## 📋 Requisitos Previos

### Software Necesario
- Node.js 18+ instalado
- Expo CLI: `npm install -g expo-cli`
- Expo Go app instalada en tu dispositivo móvil (iOS/Android)
- Backend Laravel corriendo y accesible en tu red

### Verificar Backend
```bash
# El backend debe estar corriendo en:
http://localhost/odontopacientes/backend/public/api

# Verificar que responde:
curl http://localhost/odontopacientes/backend/public/api/health
```

---

## 🔧 Configuración Inicial

### 1. Obtener tu IP LAN

**macOS/Linux:**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
# Busca algo como: inet 192.168.1.100
```

**Windows:**
```bash
ipconfig
# Busca "Dirección IPv4"
```

**Ejemplo de salida:**
```
inet 192.168.1.100 netmask 0xffffff00 broadcast 192.168.1.255
```

Tu IP LAN es: `192.168.1.100` (en este ejemplo)

---

### 2. Configurar Variables de Entorno

**Crear archivo `.env`:**
```bash
cd mobile-app
cp .env.example .env
```

**Editar `.env` con tu IP LAN:**
```bash
# Reemplazar 192.168.1.100 con TU IP LAN real
EXPO_PUBLIC_API_URL=http://192.168.1.100/odontopacientes/backend/public/api
APP_VARIANT=development
```

⚠️ **IMPORTANTE:** 
- NO usar `localhost` o `127.0.0.1` - no funcionará en dispositivos móviles
- Usar tu IP LAN real (ej: `192.168.1.100`)
- Tu dispositivo móvil debe estar en la MISMA red WiFi que tu computadora

---

### 3. Verificar Configuración de CORS

El backend ya está configurado para aceptar requests desde IPs LAN privadas:

**Archivo:** `/backend/config/cors.php`
```php
'allowed_origins_patterns' => [
    '/^http:\/\/192\.168\.\d{1,3}\.\d{1,3}(:\d+)?$/',  // 192.168.x.x
    '/^http:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?$/', // 10.x.x.x
    '/^http:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\.\d{1,3}\.\d{1,3}(:\d+)?$/', // 172.16-31.x.x
],
```

✅ Esto permite que tu app móvil se conecte al backend desde cualquier IP privada.

---

## 🚀 Ejecutar en Desarrollo

### Opción 1: Expo Go (Recomendado para desarrollo)

```bash
cd mobile-app

# Instalar dependencias (primera vez)
npm install

# Iniciar Expo
npx expo start
```

**Opciones disponibles:**
- Presiona `i` para abrir en iOS Simulator
- Presiona `a` para abrir en Android Emulator
- Escanea el QR con Expo Go app en tu dispositivo físico

### Opción 2: Túnel (Si tienes problemas de red)

```bash
npx expo start --tunnel
```

Esto usa ngrok para crear un túnel y funciona incluso si no estás en la misma red.

---

## 🔍 Verificación de Conectividad

### Test 1: Ping al Backend desde el Móvil

1. Abre el navegador de tu móvil
2. Navega a: `http://TU_IP_LAN/odontopacientes/backend/public/api/health`
3. Deberías ver: `{"status":"ok"}`

### Test 2: Verificar en la App

1. Abre la app en Expo Go
2. Ve a la pantalla de Login
3. Intenta hacer login con: `alumno@demo.test` / `password`
4. Si funciona, la conexión está OK ✅

### Test 3: Revisar Console Logs

En la terminal donde corre `expo start`, verás logs como:
```
🔧 API Configuration: {
  baseURL: 'http://192.168.1.100/odontopacientes/backend/public/api',
  environment: 'development'
}
```

---

## 🐛 Troubleshooting

### Problema: "Network Error" o "Request Failed"

**Causa:** El dispositivo no puede alcanzar el backend

**Soluciones:**
1. Verifica que estés en la misma red WiFi
2. Verifica tu IP LAN: `ifconfig` o `ipconfig`
3. Actualiza `.env` con la IP correcta
4. Reinicia Expo: `Ctrl+C` y `npx expo start`
5. Verifica firewall (debe permitir conexiones en puerto 80)

### Problema: "CORS Error"

**Causa:** Backend rechaza la petición por CORS

**Solución:**
```bash
# Limpiar cache de Laravel
cd backend
php artisan config:clear
php artisan cache:clear
```

### Problema: Imágenes no cargan (404)

**Causa:** URLs de imágenes no son absolutas

**Verificar en Laravel:**
```php
// Las URLs deben ser absolutas:
'image_url' => url('/storage/images/patient.jpg')
// NO relativas: '/storage/images/patient.jpg'
```

**Verificar storage link:**
```bash
cd backend
php artisan storage:link
```

---

## 📦 Build para Producción

### Configurar Entorno de Producción

**Crear `.env.production`:**
```bash
EXPO_PUBLIC_API_URL=https://api.odontopacientes.com/api
APP_VARIANT=production
```

### Build con EAS (Expo Application Services)

```bash
# Instalar EAS CLI
npm install -g eas-cli

# Login a Expo
eas login

# Configurar proyecto
eas build:configure

# Build para Android
eas build --platform android --profile production

# Build para iOS
eas build --platform ios --profile production
```

### Configurar Perfiles de Build

**Archivo:** `eas.json`
```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "env": {
        "APP_VARIANT": "development"
      }
    },
    "preview": {
      "distribution": "internal",
      "env": {
        "APP_VARIANT": "preview"
      }
    },
    "production": {
      "env": {
        "APP_VARIANT": "production"
      }
    }
  }
}
```

---

## 🌐 Configuración por Entorno

La app soporta 3 entornos:

### 1. Development (Local)
```bash
EXPO_PUBLIC_API_URL=http://192.168.1.100/odontopacientes/backend/public/api
APP_VARIANT=development
```

### 2. Staging/Preview
```bash
EXPO_PUBLIC_API_URL=https://staging-api.odontopacientes.com/api
APP_VARIANT=preview
```

### 3. Production
```bash
EXPO_PUBLIC_API_URL=https://api.odontopacientes.com/api
APP_VARIANT=production
```

---

## 📸 Permisos de Cámara/Galería

Los permisos ya están configurados en `app.config.js`:

**iOS:**
- `NSCameraUsageDescription`: Acceso a cámara
- `NSPhotoLibraryUsageDescription`: Acceso a galería
- `NSPhotoLibraryAddUsageDescription`: Guardar fotos

**Android:**
- `CAMERA`
- `READ_EXTERNAL_STORAGE`
- `WRITE_EXTERNAL_STORAGE`
- `READ_MEDIA_IMAGES`

**Plugin configurado:**
```javascript
plugins: [
  [
    'expo-image-picker',
    {
      photosPermission: 'Esta app necesita acceso a tu galería...',
      cameraPermission: 'Esta app necesita acceso a la cámara...',
    },
  ],
]
```

---

## 🖼️ Manejo de Imágenes

### Componente ImageWithFallback

Usa el componente `ImageWithFallback` para imágenes que pueden fallar:

```typescript
import { ImageWithFallback } from '../components/ImageWithFallback';

<ImageWithFallback
  source={{ uri: patient.profile_image_url }}
  fallbackIcon="account-circle"
  fallbackIconSize={64}
  fallbackIconColor="#ccc"
  style={styles.avatar}
/>
```

**Características:**
- Fallback automático si la imagen falla
- Muestra ícono de Material Icons
- Maneja imágenes locales y remotas
- Console warning si falla la carga

---

## 🔐 Seguridad

### Variables de Entorno

✅ **Hacer:**
- Usar `EXPO_PUBLIC_*` para variables que necesita el cliente
- Nunca commitear `.env` (ya está en `.gitignore`)
- Usar `.env.example` como template

❌ **No hacer:**
- Hardcodear URLs en el código
- Commitear API keys o secrets
- Usar `localhost` en producción

### HTTPS en Producción

Para producción, SIEMPRE usar HTTPS:
```bash
EXPO_PUBLIC_API_URL=https://api.odontopacientes.com/api
```

---

## 📊 Monitoreo y Logs

### Ver logs en tiempo real

```bash
# Terminal 1: Expo
npx expo start

# Terminal 2: Logs del dispositivo
npx expo start --dev-client
```

### Logs importantes

El cliente API logea automáticamente:
```javascript
console.log('🔧 API Configuration:', {
  baseURL: API_BASE_URL,
  environment: Constants.expoConfig?.extra?.environment
});
```

---

## ✅ Checklist Pre-Deploy

Antes de hacer un build de producción:

- [ ] `.env` configurado con URL correcta
- [ ] Backend accesible desde la red
- [ ] CORS configurado correctamente
- [ ] Storage link creado (`php artisan storage:link`)
- [ ] URLs de imágenes son absolutas
- [ ] Permisos configurados en `app.config.js`
- [ ] Probado en Expo Go
- [ ] Probado login/logout
- [ ] Probado carga de imágenes
- [ ] Probado en iOS y Android
- [ ] Variables de entorno de producción configuradas

---

## 🆘 Soporte

### Comandos Útiles

```bash
# Limpiar cache de Expo
npx expo start -c

# Limpiar cache de Metro
npx expo start --clear

# Ver configuración actual
npx expo config

# Diagnosticar problemas
npx expo-doctor
```

### Recursos

- [Expo Docs](https://docs.expo.dev/)
- [React Native Docs](https://reactnative.dev/)
- [EAS Build Docs](https://docs.expo.dev/build/introduction/)

---

## 📝 Notas Finales

### Desarrollo Local
1. Usar IP LAN (no localhost)
2. Misma red WiFi
3. Backend corriendo
4. CORS configurado

### Producción
1. HTTPS obligatorio
2. Dominio real
3. Certificados SSL válidos
4. CDN para imágenes (recomendado)

---

**Última actualización:** 2026-01-05  
**Versión:** 1.0.0  
**Autor:** Equipo OdontoPacientes
