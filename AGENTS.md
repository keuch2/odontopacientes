# OdontoPacientes Mobile - Guía para Agentes de IA

## 🎯 Objetivo del Proyecto
Sistema de gestión odontológica para estudiantes universitarios que conecta alumnos con pacientes para prácticas clínicas.

## 🚀 Cómo Ejecutar el Proyecto

### Prerrequisitos
- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- Expo Go app en dispositivo móvil
- Backend Laravel corriendo en `http://localhost/odontopacientes/backend/public`

### Instalación
```bash
cd /opt/homebrew/var/www/odontopacientes/mobile-app
npm install --legacy-peer-deps  # Importante: usar legacy-peer-deps
```

### Ejecución
```bash
# Desarrollo con Expo Go
npm start

# iOS Simulator
npm run ios

# Android Emulator  
npm run android

# Web (experimental)
npm run web
```

### Variables de Entorno
Configurar en `app.config.js`:
```javascript
const getApiUrl = () => {
  if (IS_DEV) {
    return 'http://192.168.1.100/odontopacientes/backend/public/api'; // Tu IP local
  }
  return 'https://api.odontopacientes.com/api';
}
```

## ⚠️ RESTRICCIONES CRÍTICAS

### NUNCA MODIFICAR VERSIONES DE:
```json
{
  "expo": "~54.0.0",
  "react": "19.1.0", 
  "react-native": "0.81.5"
}
```

**Razón:** La app debe funcionar en Expo Go sin necesidad de build nativo. Cambiar versiones rompe compatibilidad.

### Alternativas Permitidas si algo requiere versión diferente:
1. Buscar polyfills compatibles
2. Reimplementar funcionalidad con código propio
3. Usar librerías alternativas ya instaladas
4. Hacer refactor del código existente

## 📁 Estructura del Proyecto

```
mobile-app/
├── App.tsx                 # Entry point con autenticación
├── app.config.js          # Configuración dinámica Expo
├── src/
│   ├── screens/          # Pantallas de la app
│   │   ├── CatedrasScreen.tsx    ⚠️ USA MOCK DATA
│   │   ├── ChairPatientsScreen.tsx ⚠️ USA MOCK DATA  
│   │   ├── PatientDetailScreen.tsx ⚠️ USA MOCK DATA
│   │   ├── MyPatientsScreen.tsx   ✅ USA API REAL
│   │   └── ...
│   ├── components/       # Componentes reutilizables
│   ├── navigation/       # Configuración de navegación
│   ├── services/        # Clientes API
│   │   └── api.ts       # ⚠️ DUPLICADO con /lib/api.ts
│   ├── lib/
│   │   └── api.ts       # ⚠️ DUPLICADO con /services/api.ts
│   ├── store/           # Estado global (Zustand)
│   │   └── auth.ts     
│   └── theme/           # Colores y espaciado
```

## 🐛 Problemas Conocidos

### P0 - CRÍTICOS
1. **Inconsistencia de Datos:** Pantallas usan diferentes fuentes (mock vs API)
   - `CatedrasScreen` → mock data hardcodeado
   - `MyPatientsScreen` → API real
   - **Solución:** Migrar todas a API real

2. **Servicios API Duplicados:** Dos implementaciones diferentes
   - `/src/services/api.ts` vs `/src/lib/api.ts`
   - **Solución:** Unificar en uno solo

### P1 - IMPORTANTES  
1. **Ficha médica no editable** - Falta conectar EditPatientScreen
2. **Odontograma no persiste** - Falta endpoint de guardado
3. **Sin validación de permisos** - Edición de procedimientos sin verificar participación

## 🧪 Pruebas

### Checklist de QA Manual
- [ ] Login funciona con credenciales válidas
- [ ] Navegación entre tabs no tiene crashes
- [ ] Búsqueda de pacientes retorna resultados
- [ ] Datos consistentes entre Cátedras y Mis Pacientes
- [ ] Crear paciente guarda en BD
- [ ] Asignarse procedimiento actualiza estado
- [ ] Completar/Abandonar asignación funciona
- [ ] Odontograma muestra dientes correctamente

### Usuarios de Prueba
```
email: alumno@test.com
password: password
role: alumno
```

## 🔧 Convenciones de Código

### TypeScript
- Interfaces para tipos de datos
- Props tipadas en componentes
- Evitar `any` excepto para librerías externas

### React Native
- Functional components con hooks
- Estilos con StyleSheet.create()
- SafeAreaView para notch de iOS

### API Calls
- Siempre con try/catch
- Loading states obligatorios
- Manejo de errores con Alert o Toast

### Estado
- Zustand para estado global (auth)
- React Query para cache de API
- useState para estado local

## 📋 Definición de "Done"

Una funcionalidad se considera completa cuando:
- ✅ Conectada a API real (sin mock data)
- ✅ Loading states implementados
- ✅ Manejo de errores con feedback
- ✅ Compatible con Expo Go
- ✅ Sin warnings en consola
- ✅ Probada en iOS y Android
- ✅ Datos consistentes con otras pantallas

## 🚦 Flujo de Verificación

1. **Antes de empezar:**
   - Verificar que backend está corriendo
   - Confirmar URL de API en `app.config.js`
   - Limpiar cache: `expo start -c`

2. **Durante desarrollo:**
   - Hot reload activo
   - Consola abierta para ver logs
   - React DevTools para debugging

3. **Antes de commit:**
   - Sin errores TypeScript
   - Sin warnings de React
   - Prettier/ESLint pasando
   - Funcionalidad probada en dispositivo real

## 📚 Recursos

- [Expo SDK 54 Docs](https://docs.expo.dev/)
- [React Navigation 6](https://reactnavigation.org/)
- [React Native Paper](https://callstack.github.io/react-native-paper/)
- [Zustand](https://github.com/pmndrs/zustand)
- [React Query](https://tanstack.com/query)

## ⚡ Comandos Útiles

```bash
# Limpiar cache y reiniciar
expo start -c

# Ver logs de dispositivo
adb logcat | grep ReactNative  # Android
xcrun simctl spawn booted log stream | grep React  # iOS

# Actualizar Expo Go
expo client:install:ios
expo client:install:android

# Build para producción (requiere EAS)
eas build --platform ios
eas build --platform android
```
