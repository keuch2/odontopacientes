# 🔥 Guía Completa: Firebase Cloud Messaging para OdontoPacientes

## 📋 Resumen

Esta guía te llevará paso a paso para implementar notificaciones push usando Firebase Cloud Messaging (FCM) en OdontoPacientes.

**Tiempo estimado:** 2-3 horas  
**Nivel:** Intermedio

---

## 🎯 PASO 1: Configurar Firebase Console (15 minutos)

### 1.1 Crear Proyecto Firebase

1. Ve a https://console.firebase.google.com/
2. Click en **"Agregar proyecto"**
3. Nombre del proyecto: `odontopacientes` (o `odontopacientes-dev` para desarrollo)
4. **Desactiva Google Analytics** (opcional para desarrollo)
5. Click **"Crear proyecto"**
6. Espera a que se cree (1-2 minutos)

### 1.2 Agregar App Android

1. En el dashboard de Firebase, click en el **ícono de Android** (robot verde)
2. Completa el formulario:
   - **Package name**: `com.odontopacientes.app`
   - **App nickname**: `OdontoPacientes Mobile`
   - **SHA-1**: Déjalo vacío por ahora
3. Click **"Registrar app"**
4. **IMPORTANTE**: Descarga el archivo `google-services.json`
5. **Guarda este archivo**, lo necesitaremos después
6. Salta los pasos de SDK (los haremos con Expo)
7. Click **"Continuar a la consola"**

### 1.3 Obtener Server Key para Laravel

1. En Firebase Console, click en **⚙️ (Configuración del proyecto)**
2. Ve a la pestaña **"Cloud Messaging"**
3. Busca la sección **"Cloud Messaging API (Legacy)"**
4. Copia el **"Server key"** (empieza con `AAAA...`)
5. **Guárdalo en un lugar seguro** - lo necesitaremos para el `.env` de Laravel

---

## 🔧 PASO 2: Configurar Backend Laravel (30 minutos)

### 2.1 Agregar Variables de Entorno

Edita `/backend/.env` y agrega al final:

```env
# Firebase Cloud Messaging
FCM_SERVER_KEY=AAAA... (pega aquí tu Server Key de Firebase)
FCM_SENDER_ID=123456789 (tu Sender ID de Firebase)
```

### 2.2 Configurar Services

Edita `/backend/config/services.php` y agrega:

```php
'fcm' => [
    'server_key' => env('FCM_SERVER_KEY'),
    'sender_id' => env('FCM_SENDER_ID'),
],
```

### 2.3 Ejecutar Migración

```bash
cd /opt/homebrew/var/www/odontopacientes/backend
php artisan migrate
```

Esto agregará los campos `fcm_token` y `fcm_token_updated_at` a la tabla `users`.

### 2.4 Actualizar Modelo User

Edita `/backend/app/Models/User.php` y agrega a `$fillable`:

```php
protected $fillable = [
    'name',
    'email',
    'password',
    'role',
    'fcm_token',  // ← Agregar
    'fcm_token_updated_at',  // ← Agregar
];
```

### 2.5 Crear Controlador de Notificaciones

Crea `/backend/app/Http/Controllers/Api/NotificationController.php`:

```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class NotificationController extends Controller
{
    public function updateFcmToken(Request $request)
    {
        $request->validate([
            'fcm_token' => 'required|string',
        ]);

        $user = Auth::user();
        $user->fcm_token = $request->fcm_token;
        $user->fcm_token_updated_at = now();
        $user->save();

        return response()->json([
            'message' => 'FCM token actualizado exitosamente',
        ]);
    }
}
```

### 2.6 Agregar Ruta API

Edita `/backend/routes/api.php` y agrega dentro del grupo `auth:sanctum`:

```php
Route::middleware('auth:sanctum')->group(function () {
    // ... rutas existentes ...
    
    // Notificaciones
    Route::post('/notifications/fcm-token', [NotificationController::class, 'updateFcmToken']);
});
```

### 2.7 Crear Evento y Listener

```bash
php artisan make:event ProcedureAssigned
php artisan make:listener SendProcedureAssignedNotification
```

Edita `/backend/app/Events/ProcedureAssigned.php`:

```php
<?php

namespace App\Events;

use App\Models\Assignment;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ProcedureAssigned
{
    use Dispatchable, SerializesModels;

    public Assignment $assignment;

    public function __construct(Assignment $assignment)
    {
        $this->assignment = $assignment;
    }
}
```

Edita `/backend/app/Listeners/SendProcedureAssignedNotification.php`:

```php
<?php

namespace App\Listeners;

use App\Events\ProcedureAssigned;
use App\Services\FirebaseCloudMessaging;
use Illuminate\Support\Facades\Log;

class SendProcedureAssignedNotification
{
    private FirebaseCloudMessaging $fcm;

    public function __construct(FirebaseCloudMessaging $fcm)
    {
        $this->fcm = $fcm;
    }

    public function handle(ProcedureAssigned $event): void
    {
        $assignment = $event->assignment;
        $student = $assignment->student->user;

        if (!$student->fcm_token) {
            Log::info('Usuario sin FCM token', ['user_id' => $student->id]);
            return;
        }

        $procedure = $assignment->patientProcedure;
        $patient = $procedure->patient;

        $notification = [
            'title' => '🦷 Nuevo Procedimiento Asignado',
            'body' => "Paciente: {$patient->first_name} {$patient->last_name} - {$procedure->treatment->name}",
        ];

        $data = [
            'type' => 'procedure_assigned',
            'assignment_id' => (string) $assignment->id,
            'procedure_id' => (string) $procedure->id,
            'patient_id' => (string) $patient->id,
        ];

        $this->fcm->sendToDevice($student->fcm_token, $notification, $data);
    }
}
```

### 2.8 Registrar Evento

Edita `/backend/app/Providers/EventServiceProvider.php`:

```php
protected $listen = [
    ProcedureAssigned::class => [
        SendProcedureAssignedNotification::class,
    ],
];
```

---

## 📱 PASO 3: Configurar App Móvil con Expo (45 minutos)

### 3.1 Instalar Dependencias

```bash
cd /opt/homebrew/var/www/odontopacientes/mobile-app
npx expo install expo-notifications expo-device expo-constants
```

### 3.2 Configurar app.json

Edita `/mobile-app/app.json`:

```json
{
  "expo": {
    "name": "OdontoPacientes",
    "slug": "odontopacientes",
    "android": {
      "package": "com.odontopacientes.app",
      "googleServicesFile": "./google-services.json"
    },
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#ffffff",
          "sounds": ["./assets/notification-sound.wav"]
        }
      ]
    ]
  }
}
```

### 3.3 Copiar google-services.json

Copia el archivo `google-services.json` que descargaste de Firebase a:
```
/mobile-app/google-services.json
```

### 3.4 Crear Servicio de Notificaciones

Crea `/mobile-app/src/services/notificationService.ts`:

```typescript
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { api } from './api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  let token = null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      alert('No se pudo obtener permiso para notificaciones push');
      return null;
    }
    
    token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log('Expo Push Token:', token);
  } else {
    alert('Debes usar un dispositivo físico para notificaciones push');
  }

  return token;
}

export async function sendTokenToBackend(token: string): Promise<void> {
  try {
    await api.post('/notifications/fcm-token', { fcm_token: token });
    console.log('Token FCM enviado al backend');
  } catch (error) {
    console.error('Error enviando token FCM:', error);
  }
}

export function setupNotificationListeners() {
  const notificationListener = Notifications.addNotificationReceivedListener(notification => {
    console.log('Notificación recibida:', notification);
  });

  const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
    console.log('Usuario tocó notificación:', response);
    const data = response.notification.request.content.data;
    
    // Aquí puedes navegar a la pantalla correspondiente
    if (data.type === 'procedure_assigned') {
      // navigation.navigate('ProcedureDetail', { id: data.procedure_id });
    }
  });

  return () => {
    Notifications.removeNotificationSubscription(notificationListener);
    Notifications.removeNotificationSubscription(responseListener);
  };
}
```

### 3.5 Integrar en App.tsx

Edita `/mobile-app/App.tsx` y agrega:

```typescript
import { useEffect } from 'react';
import { registerForPushNotificationsAsync, sendTokenToBackend, setupNotificationListeners } from './src/services/notificationService';

export default function App() {
  useEffect(() => {
    // Registrar notificaciones push
    registerForPushNotificationsAsync().then(token => {
      if (token) {
        sendTokenToBackend(token);
      }
    });

    // Configurar listeners
    const cleanup = setupNotificationListeners();
    return cleanup;
  }, []);

  // ... resto del código ...
}
```

---

## 🧪 PASO 4: Testing (30 minutos)

### 4.1 Probar desde Backend

Crea un comando artisan para testing:

```bash
php artisan make:command TestPushNotification
```

Edita el comando:

```php
<?php

namespace App\Console\Commands;

use App\Services\FirebaseCloudMessaging;
use App\Models\User;
use Illuminate\Console\Command;

class TestPushNotification extends Command
{
    protected $signature = 'test:push {user_id}';
    protected $description = 'Enviar notificación push de prueba';

    public function handle(FirebaseCloudMessaging $fcm)
    {
        $user = User::find($this->argument('user_id'));
        
        if (!$user || !$user->fcm_token) {
            $this->error('Usuario no encontrado o sin FCM token');
            return 1;
        }

        $notification = [
            'title' => '🧪 Notificación de Prueba',
            'body' => 'Si ves esto, ¡FCM funciona correctamente!',
        ];

        $result = $fcm->sendToDevice($user->fcm_token, $notification);
        
        if ($result) {
            $this->info('✅ Notificación enviada exitosamente');
        } else {
            $this->error('❌ Error enviando notificación');
        }

        return 0;
    }
}
```

Ejecutar test:
```bash
php artisan test:push 1
```

### 4.2 Probar Asignación de Procedimiento

En tu código donde asignas un procedimiento, dispara el evento:

```php
use App\Events\ProcedureAssigned;

// Después de crear la asignación
$assignment = Assignment::create([...]);
event(new ProcedureAssigned($assignment));
```

---

## 📝 Checklist Final

- [ ] ✅ Proyecto Firebase creado
- [ ] ✅ App Android registrada en Firebase
- [ ] ✅ `google-services.json` descargado y copiado
- [ ] ✅ Server Key copiado al `.env`
- [ ] ✅ Migración ejecutada
- [ ] ✅ Servicio FCM creado
- [ ] ✅ Controlador y rutas creados
- [ ] ✅ Evento y Listener creados
- [ ] ✅ Dependencias Expo instaladas
- [ ] ✅ `app.json` configurado
- [ ] ✅ Servicio de notificaciones móvil creado
- [ ] ✅ Integrado en `App.tsx`
- [ ] ✅ Testing completado

---

## 🐛 Troubleshooting

### Error: "FCM token not found"
- Verifica que el usuario haya iniciado sesión en la app móvil
- Revisa los logs de la app para ver si el token se registró

### Error: "Invalid Server Key"
- Verifica que copiaste el Server Key correcto de Firebase
- Asegúrate de que está en el `.env` sin espacios

### Notificaciones no llegan
- Verifica que la app esté en primer plano
- Revisa los logs de Laravel (`storage/logs/laravel.log`)
- Verifica que el dispositivo tenga conexión a internet

### Error en Android Build
- Asegúrate de que `google-services.json` esté en la raíz de `/mobile-app`
- Ejecuta `npx expo prebuild --clean`

---

## 📚 Recursos Adicionales

- [Documentación Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
- [Expo Notifications](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [Laravel HTTP Client](https://laravel.com/docs/11.x/http-client)

---

## ✅ Próximos Pasos

Una vez que tengas FCM funcionando:

1. **Personalizar notificaciones** por tipo de evento
2. **Agregar notificaciones programadas** (recordatorios)
3. **Implementar notificaciones en grupo** (por cátedra)
4. **Agregar preferencias de notificación** en la app
5. **Implementar badges** en los íconos de la app

---

**¿Tienes dudas?** Revisa la sección de Troubleshooting o consulta los logs de Laravel y la consola de la app móvil.
