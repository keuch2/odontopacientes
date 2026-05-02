# Guía de Deployment — OdontoPacientes Mobile

Guía completa para publicar la app en **Apple App Store** y **Google Play Store** usando **EAS (Expo Application Services)**.

---

## Índice

1. [Prerrequisitos](#1-prerrequisitos)
2. [Configuración inicial (una sola vez)](#2-configuración-inicial-una-sola-vez)
3. [Preparar un release](#3-preparar-un-release)
4. [Build de producción con EAS](#4-build-de-producción-con-eas)
5. [Apple App Store](#5-apple-app-store)
6. [Google Play Store](#6-google-play-store)
7. [Actualizaciones OTA (sin nuevo build)](#7-actualizaciones-ota-sin-nuevo-build)
8. [Versiones y versionado](#8-versiones-y-versionado)
9. [Checklist final antes de publicar](#9-checklist-final-antes-de-publicar)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Prerrequisitos

### Herramientas locales

```bash
# Node.js 18+ y npm
node --version   # >= 18

# EAS CLI (global)
npm install -g eas-cli

# Verificar versión instalada
eas --version   # >= 16.27.0 requerido por eas.json
```

### Cuentas necesarias

| Plataforma | Cuenta | Link | Costo |
|---|---|---|---|
| Expo / EAS | expo.dev (ya configurado) | https://expo.dev | Gratis con límites |
| Apple | Apple Developer Program | https://developer.apple.com/programs/ | USD 99/año |
| Google | Google Play Console | https://play.google.com/console | USD 25 único pago |

### Login en EAS

```bash
eas login
# Ingresar credenciales de expo.dev
# Proyecto ya vinculado: ID 8ac47712-6a75-4ba1-be43-eabe80417ad6
```

---

## 2. Configuración inicial (una sola vez)

> Saltar esta sección si ya se realizó anteriormente.

### Apple (iOS)

1. **Crear App ID en Apple Developer:**
   - Ir a https://developer.apple.com/account/resources/identifiers/list
   - Click en **+** → App IDs → App
   - Bundle ID: `com.keuch2.odontopacientes-mobile`
   - Capabilities: habilitar si se usan Push Notifications

2. **Crear la app en App Store Connect:**
   - Ir a https://appstoreconnect.apple.com/apps
   - Click en **+** → Nueva app
   - Plataforma: iOS
   - Bundle ID: `com.keuch2.odontopacientes-mobile`
   - SKU: `odontopacientes-mobile` (identificador interno, no se muestra)

3. **Certificados y profiles (EAS lo gestiona automáticamente):**
   ```bash
   cd mobile-app
   eas credentials --platform ios
   # Seleccionar "Managed by EAS" para que genere certificados automáticamente
   ```

### Android

1. **Crear la app en Google Play Console:**
   - Ir a https://play.google.com/console/u/0/developers
   - Click en **Crear aplicación**
   - Nombre: `OdontoPacientes`
   - Idioma predeterminado: Español (España) o Español (Argentina)
   - App o juego: App
   - Gratuita o de pago: Gratuita

2. **Keystore (EAS lo gestiona automáticamente):**
   ```bash
   eas credentials --platform android
   # Seleccionar "Managed by EAS"
   # EAS genera y almacena el keystore de forma segura
   ```
   > **IMPORTANTE:** El keystore es permanente. Si lo perdés, no podés actualizar la app. EAS lo guarda en sus servidores, pero también exportá una copia local:
   ```bash
   eas credentials --platform android
   # Opción: "Download keystore"
   # Guardar en lugar seguro (no en el repositorio)
   ```

---

## 3. Preparar un release

### 3.1 Verificar el `.env` de producción

```bash
# mobile-app/.env debe tener:
EXPO_PUBLIC_API_URL=https://codexpy.com/odontopacientes/api
```

### 3.2 Actualizar la versión

En `app.config.js`, la versión está en `version: '1.0.0'`. Con `"appVersionSource": "remote"` en `eas.json`, el build number (iOS `buildNumber`, Android `versionCode`) se incrementa automáticamente en EAS.

Para subir la versión semántica de forma manual:
```bash
# Editar app.config.js
version: '1.1.0'   # Cambiar según semver: mayor.menor.parche
```

### 3.3 Commit de los cambios

```bash
git add -A
git commit -m "chore: bump version to 1.1.0 for App Store release"
git push origin main
```

---

## 4. Build de producción con EAS

```bash
cd mobile-app

# Build para ambas plataformas (recomendado)
eas build --platform all --profile production

# O por separado:
eas build --platform ios --profile production
eas build --platform android --profile production
```

El build se ejecuta en servidores de Expo. Se puede seguir el progreso en:
- Terminal (muestra URL del build)
- https://expo.dev/accounts/[tu-usuario]/projects/odontopacientes-mobile/builds

**Tiempo estimado:** 10–20 minutos por plataforma.

Una vez terminado, EAS muestra links para descargar el artefacto:
- iOS → archivo `.ipa`
- Android → archivo `.aab` (Android App Bundle)

---

## 5. Apple App Store

### 5.1 Enviar el build con EAS Submit

```bash
eas submit --platform ios --profile production
# EAS sube automáticamente el último build de producción a App Store Connect
```

Si preferís subir manualmente, descargá el `.ipa` desde expo.dev y usá **Transporter** (app gratuita de Mac App Store: https://apps.apple.com/app/transporter/id1450874784).

### 5.2 Completar la ficha en App Store Connect

Ir a https://appstoreconnect.apple.com/apps → seleccionar la app → **Distribución** → **+** en la versión.

**Campos obligatorios:**

| Campo | Valor sugerido |
|---|---|
| Nombre de la app | OdontoPacientes |
| Subtítulo | Gestión de pacientes odontológicos |
| Categoría | Medicina / Educación |
| Descripción | (ver ejemplo abajo) |
| Palabras clave | odontología, pacientes, universidad, dental, cátedra |
| URL de soporte | URL de contacto o repositorio |
| Capturas de pantalla | Mínimo 1 por tamaño requerido (ver §5.3) |

**Descripción de ejemplo:**
```
OdontoPacientes es una plataforma de gestión clínica diseñada para 
estudiantes y docentes de odontología universitaria. Permite registrar 
pacientes, asignar tratamientos, documentar procedimientos y hacer 
seguimiento de la historia clínica desde el dispositivo móvil.
```

**Información de privacidad:**
- Ir a https://appstoreconnect.apple.com/apps → tu app → **Privacidad de la app**
- Declarar qué datos se recopilan. Para esta app: datos de salud de usuarios (registros odontológicos), vinculados a la cuenta. No se vende información a terceros.

**URL de Política de Privacidad:** obligatorio. Crear una página simple o usar https://app-privacy-policy-generator.nisrulz.com/

### 5.3 Capturas de pantalla requeridas

Apple requiere capturas para tamaños específicos. Las más importantes:

| Dispositivo | Resolución |
|---|---|
| iPhone 6.9" (iPhone 16 Pro Max) | 1320 × 2868 px |
| iPhone 6.7" (iPhone 14 Plus) | 1284 × 2778 px |
| iPad Pro 13" (opcional) | 2064 × 2752 px |

Podés tomar screenshots desde el simulador de Xcode o usar herramientas como:
- **Simulator** (Xcode): `Cmd + S` para capturar
- **Rotato / Previewed**: https://previewed.app para mockups profesionales
- **Screenshot.rocks**: https://screenshot.rocks

Mínimo: 1 screenshot por tamaño. Máximo: 10.

### 5.4 Notas para revisión de Apple

En el campo **Notas para el equipo de revisión** de App Store Connect, incluir:
```
Cuenta de prueba:
Email: alumno@demo.test
Password: password

Esta es una app institucional para gestión de pacientes odontológicos 
en entorno universitario. Requiere cuenta de usuario registrada por 
un administrador. Se proveen credenciales de demostración arriba.
```

### 5.5 Enviar para revisión

1. Completar todos los campos obligatorios (la interfaz muestra errores en rojo)
2. En **Compilaciones**, seleccionar el build subido
3. Click en **Agregar para revisión**
4. Responder el cuestionario de exportación (cifrado): seleccionar **No** si la app no usa cifrado propio (usa HTTPS estándar → respuesta estándar: Sí, exento)
5. Click en **Enviar para revisión**

**Tiempo de revisión:** 1–3 días hábiles. Seguimiento en https://appstoreconnect.apple.com

---

## 6. Google Play Store

### 6.1 Enviar el build con EAS Submit

```bash
eas submit --platform android --profile production
# EAS sube automáticamente el .aab a Play Console como Internal Testing
```

Para subir a un track diferente:
```bash
eas submit --platform android --profile production \
  --track internal      # Pruebas internas (default)
  --track alpha         # Pruebas cerradas
  --track beta          # Pruebas abiertas
  --track production    # Producción
```

Si preferís subir manualmente: Play Console → tu app → **Producción** → **Crear nueva versión** → subir el `.aab`.

### 6.2 Completar la ficha en Play Console

Ir a https://play.google.com/console → tu app → **Presencia en Play Store** → **Ficha de Play Store principal**.

**Campos obligatorios:**

| Campo | Valor sugerido |
|---|---|
| Título | OdontoPacientes |
| Descripción corta | Gestión de pacientes para estudiantes de odontología |
| Descripción completa | (igual a App Store, puede ser más larga) |
| Categoría | Medicina |
| Capturas de pantalla | Mínimo 2 para teléfono |
| Ícono de alta resolución | 512 × 512 px PNG |
| Imagen destacada | 1024 × 500 px PNG/JPG |

### 6.3 Capturas de pantalla para Android

| Tipo | Resolución mínima | Máximo |
|---|---|---|
| Teléfono | 320 × 568 px (JPEG/PNG) | 8 |
| Tablet 7" | 600 × 1024 px | 8 |
| Tablet 10" | 1200 × 1600 px | 8 |

Formato: JPEG o PNG, sin alpha, máx. 8 MB cada una.

### 6.4 Configuración de contenido

En **Calificación de contenido** (obligatorio):
- Completar el cuestionario → la app recibirá automáticamente la calificación (probablemente **Everyone** o **PEGI 3**)

En **Público objetivo:**
- Edad mínima: 18+ (es una app profesional/universitaria)

En **Política de privacidad:**
- Misma URL que para Apple

### 6.5 Acceso a la app

En **Acceso a la app** → completar que requiere cuenta:
```
Para probar la app, usar:
Email: alumno@demo.test
Password: password
```

### 6.6 Pasar a producción

1. **Internal Testing** → agregar testers (correos de Google) para probar primero
2. Una vez validado: **Producción** → **Crear nueva versión** → seleccionar el release
3. Definir % de lanzamiento (se puede hacer rollout gradual: 10% → 50% → 100%)
4. Click en **Enviar para revisión**

**Tiempo de revisión:** horas a 3 días. Primera vez puede tardar más (hasta 7 días).

---

## 7. Actualizaciones OTA (sin nuevo build)

Para cambios en JavaScript/TypeScript que **no requieren** modificar código nativo:

```bash
cd mobile-app

# Verificar que .env apunta a producción
cat .env   # EXPO_PUBLIC_API_URL=https://codexpy.com/odontopacientes/api

# Publicar actualización OTA
eas update --branch preview --message "fix: descripción del cambio"
```

Los usuarios con la app instalada recibirán la actualización automáticamente al abrir la app (política `runtimeVersion` basada en `appVersion`).

**Limitaciones OTA:** no sirve para cambios que modifiquen:
- Módulos nativos (plugins de Expo)
- `app.config.js` (permisos, bundle ID, etc.)
- Dependencias con código nativo

Para esos casos, se requiere un nuevo build y release en las tiendas.

---

## 8. Versiones y versionado

| Campo | Archivo | Control |
|---|---|---|
| Versión semántica (`1.0.0`) | `app.config.js` → `version` | Manual |
| Build number iOS | EAS remoto | Automático (`autoIncrement: true`) |
| Version code Android | EAS remoto | Automático (`autoIncrement: true`) |
| Runtime version (OTA) | Basado en `appVersion` | Automático |

Convención sugerida:
- `1.0.x` → parches y fixes (deploy OTA preferido)
- `1.x.0` → nuevas features (requiere nuevo build)
- `x.0.0` → cambios mayores o breaking

---

## 9. Checklist final antes de publicar

### General
- [ ] `.env` apunta a `https://codexpy.com/odontopacientes/api`
- [ ] Versión actualizada en `app.config.js`
- [ ] Cambios commiteados y pusheados a `main`
- [ ] Build de producción generado con EAS sin errores
- [ ] App probada en device físico (no solo simulador)

### iOS
- [ ] App ID creado en developer.apple.com
- [ ] App creada en App Store Connect
- [ ] Certificados gestionados por EAS
- [ ] Capturas de pantalla subidas (al menos iPhone 6.9")
- [ ] Descripción, categoría y palabras clave completadas
- [ ] URL de política de privacidad añadida
- [ ] Credenciales de prueba en notas de revisión
- [ ] Build subido y seleccionado en la versión

### Android
- [ ] App creada en Play Console
- [ ] Keystore respaldado en lugar seguro
- [ ] Capturas de pantalla subidas (al menos 2 para teléfono)
- [ ] Ficha de Play Store completada
- [ ] Calificación de contenido completada
- [ ] Público objetivo configurado (18+)
- [ ] URL de política de privacidad añadida
- [ ] Credenciales de prueba añadidas en "Acceso a la app"
- [ ] Probado en Internal Testing antes de producción

---

## 10. Troubleshooting

### "Bundle ID already exists" (iOS)
El bundle ID `com.keuch2.odontopacientes-mobile` ya está registrado en otra cuenta Apple. Verificar en https://developer.apple.com/account/resources/identifiers/list

### "Package name already taken" (Android)
El package `com.keuch2.odontopacientes_mobile` ya existe en otra cuenta de Play Console. Cambiar en `app.config.js` → `android.package`.

### Error de certificados en EAS (iOS)
```bash
eas credentials --platform ios
# Seleccionar "Clear credentials" y dejar que EAS regenere
```

### Build falla por dependencia nativa
Verificar que no se instalaron paquetes que rompan la compatibilidad con Expo Go. Ver versiones críticas en CLAUDE.md:
```
expo: ~54.0.0
react: 19.1.0
react-native: 0.81.5
```

### OTA update no llega a los usuarios
Verificar que la `runtimeVersion` del update coincide con la del build instalado. Si se cambió `version` en `app.config.js`, los usuarios con versiones anteriores no reciben el OTA hasta que actualicen la app desde la tienda.

### Revisión rechazada por Apple
Causas comunes:
- **4.0 Design**: funcionalidad incompleta. Asegurarse de que todas las features funcionen con las credenciales de prueba.
- **2.1 Performance**: crashes en el build. Probar en device real antes de subir.
- **5.1.1 Privacy**: falta política de privacidad o descripción de uso de datos de salud.

---

## Links de referencia rápida

| Recurso | URL |
|---|---|
| EAS Build Docs | https://docs.expo.dev/build/introduction/ |
| EAS Submit Docs | https://docs.expo.dev/submit/introduction/ |
| EAS Update (OTA) | https://docs.expo.dev/eas-update/introduction/ |
| App Store Connect | https://appstoreconnect.apple.com |
| Apple Developer | https://developer.apple.com/account |
| Apple Review Guidelines | https://developer.apple.com/app-store/review/guidelines/ |
| Google Play Console | https://play.google.com/console |
| Play Store Policy | https://play.google.com/about/developer-content-policy/ |
| Expo Dashboard | https://expo.dev |
| Transporter (Mac) | https://apps.apple.com/app/transporter/id1450874784 |
