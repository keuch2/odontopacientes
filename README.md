# OdontoPacientes

Sistema de gestión de pacientes odontológicos para estudiantes universitarios. Permite conectar alumnos de odontología con pacientes fichados por facultades, facilitando la búsqueda por cátedra/tratamientos y la gestión completa del flujo clínico.

## Características principales

- **Backend API**: Laravel 11 con autenticación Sanctum
- **Administración Web**: React + Vite + TypeScript + Tailwind CSS
- **App Móvil**: React Native con Expo + TypeScript
- **Base de datos**: MySQL con Redis opcional
- **Documentación**: Contratos OpenAPI y tipos TypeScript compartidos

## Requisitos del entorno

**Software requerido:**
- PHP 8.3 o superior
- Composer 2.x
- Node.js 20 o superior 
- pnpm 9 o superior
- Apache con mod_rewrite habilitado
- MySQL 5.7+ o MariaDB 10.3+

**Opcional:**
- Redis (para cache y colas mejoradas)

## Instalación rápida

### 1. Preparar base de datos

Crear la base de datos en MySQL:

```sql
CREATE DATABASE odontopacientes CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Configurar variables de entorno

```bash
# Copiar archivos de ejemplo
cp .env.example .env
cp backend/.env.example backend/.env
```

Editar `.env` y `backend/.env` según tu configuración local.

### 3. Instalar dependencias

```bash
# Backend (Laravel)
cd backend
composer install
php artisan key:generate
cd ..

# Frontend (pnpm workspaces)
pnpm install
```

### 4. Configurar Apache

**Opción A: DocumentRoot (más simple)**

Cambiar el DocumentRoot de Apache para apuntar a:
```
DocumentRoot "/ruta/a/odontopacientes/backend/public"
```

**Opción B: VirtualHost (recomendado)**

Agregar al archivo de configuración de Apache:

```apache
<VirtualHost *:80>
    ServerName odontopacientes.local
    DocumentRoot "/ruta/completa/a/odontopacientes/backend/public"
    
    <Directory "/ruta/completa/a/odontopacientes/backend/public">
        AllowOverride All
        Require all granted
        Options Indexes FollowSymLinks
        DirectoryIndex index.php
    </Directory>
    
    ErrorLog logs/odontopacientes_error.log
    CustomLog logs/odontopacientes_access.log common
</VirtualHost>
```

Agregar a `/etc/hosts`:
```
127.0.0.1 odontopacientes.local
```

**Opción C: Servidor de desarrollo PHP (solo para pruebas)**

```bash
cd backend
php artisan serve --host=0.0.0.0 --port=8000
```

### 5. Ejecutar migraciones y seeders

```bash
cd backend
php artisan migrate --seed
cd ..
```

### 6. Iniciar aplicaciones de desarrollo

**Terminal 1 - Web Admin:**
```bash
pnpm dev:web
```

**Terminal 2 - App Móvil:**
```bash
pnpm dev:mobile
```

## Estructura del proyecto

```
odontopacientes/
├── backend/                    # API Laravel 11
│   ├── app/
│   ├── database/
│   ├── routes/
│   └── public/
├── web-admin/                  # Admin React + Vite
│   ├── src/
│   ├── public/
│   └── package.json
├── mobile-app/                 # React Native + Expo
│   ├── src/
│   ├── App.tsx
│   └── package.json
├── shared/                     # Recursos compartidos
│   ├── openapi/
│   └── types/
└── scripts/                    # Scripts de desarrollo
```

## Scripts disponibles

**Desarrollo:**
- `pnpm dev` - Inicia web-admin y mobile-app en paralelo
- `pnpm dev:web` - Solo web-admin (puerto 5173)
- `pnpm dev:mobile` - Solo mobile-app (Expo)

**Build:**
- `pnpm build` - Construye ambas aplicaciones
- `pnpm build:web` - Solo web-admin
- `pnpm build:mobile` - Solo mobile-app

**Calidad de código:**
- `pnpm lint` - ESLint en todos los workspaces
- `pnpm format` - Prettier en todo el proyecto

**Utilidades:**
- `pnpm gen:types` - Genera tipos TypeScript desde OpenAPI
- `scripts/dev.sh` - Script completo de setup inicial
- `scripts/seed.sh` - Re-ejecuta seeders

## Usuarios de prueba

El sistema incluye usuarios de demostración:

**Administrador:**
- Email: `admin@demo.test`
- Password: `password`

**Estudiante:**
- Email: `alumno@demo.test`
- Password: `password`

## Cátedras disponibles

- Cirugías
- Periodoncia
- Pediatría
- Operatoria
- Endodoncia
- Prótesis
- Preventiva
- Implantes

## Desarrollo en dispositivos móviles

Para probar la app móvil en dispositivos físicos, actualizar la variable `API_URL` en el archivo `.env` del móvil con tu IP local:

```bash
# Obtener IP local
ip route get 1 | awk '{print $3}' | head -1  # Linux
ipconfig getifaddr en0                        # macOS

# Actualizar en mobile-app/.env
API_URL=http://192.168.1.100/odontopacientes/backend/public/api
```

## Solución de problemas comunes

**Error de CORS:**
- Verificar que las URLs en `backend/.env` coincidan con las del frontend
- Revisar configuración en `config/cors.php`

**Base de datos:**
- Confirmar que MySQL esté ejecutándose
- Verificar credenciales en `backend/.env`
- Ejecutar `php artisan migrate:status` para ver migraciones

**Apache mod_rewrite:**
- Verificar que esté habilitado: `apache2ctl -M | grep rewrite`
- Confirmar que `.htaccess` existe en `backend/public/`

**Permisos (Linux/macOS):**
```bash
sudo chown -R www-data:www-data backend/storage backend/bootstrap/cache
sudo chmod -R 775 backend/storage backend/bootstrap/cache
```

## Documentación adicional

- [Arquitectura y Objetivos](AGENTS.md)
- [API Endpoints](shared/openapi/openapi.yaml)
- [Tipos TypeScript](shared/types/api.d.ts)

## Licencia

MIT License - ver archivo LICENSE para detalles.
