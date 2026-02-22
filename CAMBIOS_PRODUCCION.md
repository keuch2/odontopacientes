# 🚀 CAMBIOS PARA PRODUCCIÓN - 5 de Diciembre 2025

## 📋 Resumen de Problemas Resueltos

### 1. ❌ Error 500 Backend - Middleware no registrado
**Problema:** `Target class [demo.auth] does not exist`

**Solución:** Registrado middleware en `bootstrap/app.php`
```php
'demo.auth' => \App\Http\Middleware\DemoAuthMiddleware::class,
```

**Archivos modificados:**
- ✅ `/backend/bootstrap/app.php`
- ✅ `/backend-build/bootstrap/app.php`

---

### 2. ❌ Error CORS - Frontend apuntando a localhost
**Problema:** Frontend compilado con URL incorrecta (`http://localhost/`)

**Solución:** Reconstruido frontend con URL de producción

**Archivos modificados:**
- ✅ Creado `/web-admin/.env.production` con URL correcta
- ✅ Reconstruido build: `npm run build`
- ✅ Actualizado `/web-admin-build/` con nuevo build

**URL configurada:**
```
VITE_API_URL=https://mistercorporation.com/odontopacientes/backend/public/api
```

---

### 3. ⚙️ Configuración CORS Backend
**Problema:** Backend no configurado para aceptar peticiones desde producción

**Solución:** Actualizado `.env.production` con configuración correcta

**Archivo modificado:**
- ✅ `/backend-build/.env.production`

**Configuración aplicada:**
```env
APP_URL=https://mistercorporation.com/odontopacientes/backend/public/
CORS_ALLOWED_ORIGINS="https://mistercorporation.com"
SANCTUM_STATEFUL_DOMAINS="mistercorporation.com"
SESSION_DOMAIN=.mistercorporation.com
```

---

## 📦 Paquetes Actualizados

### Backend (`backend-build/`)
```
✅ bootstrap/app.php - Middleware registrado
✅ .env.production - CORS y Sanctum configurados
✅ FIX_ERROR_500.md - Instrucciones de solución
```

### Frontend (`web-admin-build/`)
```
✅ assets/*.js - URL de API compilada correctamente
✅ .env.production - Referencia con nota explicativa
✅ index.html - Build actualizado
```

---

## 🔄 Pasos para Redeployment

### Opción 1: Resubir Todo (Recomendado)

**Backend:**
```bash
1. Eliminar carpeta backend actual en el servidor
2. Subir todo el contenido de backend-build/
3. Renombrar .env.production a .env
4. Verificar que .env tenga las credenciales de BD correctas
5. Importar database-export.sql (si es primera vez)
6. Configurar permisos: storage/ y bootstrap/cache/ → 775
```

**Frontend:**
```bash
1. Eliminar carpeta web-admin actual en el servidor
2. Subir todo el contenido de web-admin-build/
3. Verificar que .htaccess esté presente
4. Listo!
```

---

### Opción 2: Solo Actualizar Archivos Modificados

**Backend:**
```bash
1. Subir: bootstrap/app.php
2. Editar .env en el servidor:
   - CORS_ALLOWED_ORIGINS="https://mistercorporation.com"
   - SANCTUM_STATEFUL_DOMAINS="mistercorporation.com"
   - SESSION_DOMAIN=.mistercorporation.com
```

**Frontend:**
```bash
1. Eliminar carpeta assets/ actual
2. Subir nueva carpeta assets/
3. Subir nuevo index.html
```

---

## ✅ Verificación Post-Deployment

### 1. Backend Health Check
```bash
curl https://mistercorporation.com/odontopacientes/backend/public/api/health
```

**Respuesta esperada:**
```json
{
    "status": "OK",
    "timestamp": "2025-12-05T...",
    "service": "OdontoPacientes API"
}
```

---

### 2. Login Test
```bash
curl -X POST https://mistercorporation.com/odontopacientes/backend/public/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@demo.test","password":"password"}'
```

**Respuesta esperada:**
```json
{
    "message": "Inicio de sesión exitoso",
    "user": { ... },
    "access_token": "demo-token-...",
    "token_type": "Bearer"
}
```

---

### 3. Frontend Test
1. Abrir: `https://mistercorporation.com/odontopacientes/web-admin/`
2. Intentar login con: `admin@demo.test` / `password`
3. Verificar que NO aparezcan errores CORS en la consola
4. Verificar que el login sea exitoso

---

## 🐛 Troubleshooting

### Si persiste error CORS:
1. Verificar que el `.env` en el servidor tenga:
   ```env
   CORS_ALLOWED_ORIGINS="https://mistercorporation.com"
   ```
2. Limpiar caché de Laravel:
   ```bash
   php artisan config:clear
   php artisan route:clear
   ```

### Si el frontend sigue apuntando a localhost:
1. Verificar que subiste los archivos de `web-admin-build/` y NO de `web-admin/dist/`
2. Limpiar caché del navegador (Ctrl+Shift+R)

### Si aparece error 500:
1. Revisar logs en: `storage/logs/laravel.log`
2. Verificar que `bootstrap/app.php` tenga el middleware registrado
3. Verificar permisos de carpetas `storage/` y `bootstrap/cache/`

---

## 📝 Notas Importantes

- ✅ El middleware `demo.auth` ahora está correctamente registrado
- ✅ El frontend está compilado con la URL de producción
- ✅ CORS está configurado para aceptar peticiones desde `mistercorporation.com`
- ✅ Sanctum está configurado para el dominio correcto
- ⚠️ Recuerda renombrar `.env.production` a `.env` en el servidor
- ⚠️ Verifica las credenciales de base de datos en el `.env`

---

## 🔐 Credenciales Demo

```
admin@demo.test / password        # Administrador
coordinador@demo.test / password  # Coordinador
alumno@demo.test / password       # Estudiante
admision@demo.test / password     # Personal de Admisión
```

---

**Fecha:** 5 de Diciembre, 2025  
**Versión Backend:** 1.0.1 (Fix middleware)  
**Versión Frontend:** 1.0.1 (URL producción)
