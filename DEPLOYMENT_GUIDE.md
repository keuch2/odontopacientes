# 🚀 Guía de Deployment - OdontoPacientes

## 📋 Requisitos del Servidor

### Servidor Web
- **PHP**: 8.3 o superior
- **Composer**: 2.x
- **MySQL**: 8.0 o superior
- **Apache/Nginx** con mod_rewrite habilitado
- **SSL Certificate** (para HTTPS)

### Extensiones PHP Requeridas
```bash
php -m | grep -E 'pdo|mysql|mbstring|openssl|tokenizer|xml|ctype|json|bcmath|fileinfo'
```

---

## 🎯 Pasos de Deployment

### 1️⃣ Subir Archivos al Servidor

**Vía FTP/SFTP:**
```
Subir carpeta completa: /backend/
Destino: /public_html/odontopacientes/backend/
```

**Vía Git (recomendado):**
```bash
cd /public_html/odontopacientes/
git clone [tu-repositorio] backend
cd backend
```

---

### 2️⃣ Configurar Base de Datos

**En cPanel/phpMyAdmin:**
1. Crear nueva base de datos: `odontopacientes_prod`
2. Crear usuario MySQL con todos los privilegios
3. Anotar credenciales

**Importar estructura:**
```bash
mysql -u tu_usuario -p odontopacientes_prod < database/migrations.sql
```

O ejecutar migraciones:
```bash
php artisan migrate --force
php artisan db:seed --force
```

---

### 3️⃣ Configurar Variables de Entorno

**Copiar archivo de producción:**
```bash
cd /public_html/odontopacientes/backend
cp .env.production .env
```

**Editar `.env` con credenciales reales:**
```env
DB_DATABASE=odontopacientes_prod
DB_USERNAME=tu_usuario_mysql
DB_PASSWORD=tu_password_mysql

MAIL_HOST=smtp.gmail.com
MAIL_USERNAME=tu_email@gmail.com
MAIL_PASSWORD=tu_app_password
```

---

### 4️⃣ Instalar Dependencias

```bash
cd /public_html/odontopacientes/backend
composer install --optimize-autoloader --no-dev
```

---

### 5️⃣ Configurar Permisos

```bash
chmod -R 755 storage bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache
```

---

### 6️⃣ Optimizar para Producción

```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan optimize
```

---

### 7️⃣ Configurar Apache/Nginx

**Apache (.htaccess ya incluido en /public/):**

Verificar que `AllowOverride All` esté habilitado en Apache config.

**Nginx (agregar a server block):**
```nginx
location /odontopacientes/backend {
    alias /public_html/odontopacientes/backend/public;
    try_files $uri $uri/ /odontopacientes/backend/public/index.php?$query_string;
    
    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.3-fpm.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $request_filename;
        include fastcgi_params;
    }
}
```

---

### 8️⃣ Verificar Deployment

**Health Check:**
```
https://mistercorporation.com/odontopacientes/backend/public/api/health
```

**Respuesta esperada:**
```json
{
  "status": "ok",
  "timestamp": "2025-12-06T20:32:00Z",
  "database": "connected",
  "version": "1.0.0"
}
```

**Login Test:**
```
POST https://mistercorporation.com/odontopacientes/backend/public/api/auth/login
Content-Type: application/json

{
  "email": "admin@demo.test",
  "password": "password"
}
```

---

## 📱 Configuración de App Móvil

La app móvil **ya está configurada** para producción:

```json
// mobile-app/app.json
{
  "extra": {
    "apiUrl": "https://mistercorporation.com/odontopacientes/backend/public/api"
  }
}
```

**No requiere cambios adicionales** ✅

---

## 🌐 Configuración de Web Admin

**Actualizar `.env.production`:**
```env
VITE_API_URL=https://mistercorporation.com/odontopacientes/backend/public/api
```

**Build para producción:**
```bash
cd web-admin
npm run build
```

**Subir archivos:**
```
Origen: web-admin/dist/*
Destino: /public_html/odontopacientes/web-admin/
```

---

## 🔒 Seguridad Post-Deployment

### 1. Proteger archivos sensibles
```bash
# Denegar acceso a .env
echo "deny from all" > /public_html/odontopacientes/backend/.htaccess
```

### 2. Configurar SSL/HTTPS
- Instalar certificado SSL (Let's Encrypt gratis)
- Forzar HTTPS en `.htaccess`

### 3. Configurar CORS
Ya configurado en `config/cors.php` para aceptar requests desde:
- `https://mistercorporation.com`
- App móvil (Expo Go)

---

## 🧪 Testing en Producción

### 1. Web Admin
```
https://mistercorporation.com/odontopacientes/web-admin/
```

### 2. API Backend
```
https://mistercorporation.com/odontopacientes/backend/public/api/health
```

### 3. App Móvil
- Abrir Expo Go
- Escanear QR code
- Login con: `admin@demo.test` / `password`

---

## 🐛 Troubleshooting

### Error 500 - Internal Server Error
```bash
# Ver logs
tail -f storage/logs/laravel.log

# Verificar permisos
ls -la storage bootstrap/cache
```

### Error 404 - Not Found
- Verificar mod_rewrite habilitado
- Verificar `.htaccess` en `/public/`
- Verificar DocumentRoot apunta a `/public/`

### Error de Base de Datos
```bash
# Verificar conexión
php artisan tinker
>>> DB::connection()->getPdo();
```

### CORS Errors
- Verificar `APP_URL` en `.env`
- Verificar `SANCTUM_STATEFUL_DOMAINS`
- Limpiar cache: `php artisan config:clear`

---

## 📊 Monitoreo

### Logs de Laravel
```bash
tail -f storage/logs/laravel.log
```

### Logs de Apache
```bash
tail -f /var/log/apache2/error.log
```

### Logs de MySQL
```bash
tail -f /var/log/mysql/error.log
```

---

## 🔄 Actualizaciones Futuras

```bash
# En el servidor
cd /public_html/odontopacientes/backend
git pull origin main
composer install --no-dev
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

---

## 📞 Soporte

**Credenciales Demo:**
- Admin: `admin@demo.test` / `password`
- Coordinador: `coordinador@demo.test` / `password`
- Alumno: `alumno@demo.test` / `password`

**URLs Importantes:**
- API: `https://mistercorporation.com/odontopacientes/backend/public/api`
- Web Admin: `https://mistercorporation.com/odontopacientes/web-admin/`
- Health Check: `https://mistercorporation.com/odontopacientes/backend/public/api/health`

---

## ✅ Checklist Final

- [ ] Backend subido al servidor
- [ ] Base de datos creada e importada
- [ ] `.env` configurado con credenciales reales
- [ ] Dependencias instaladas (`composer install`)
- [ ] Permisos configurados (755 storage)
- [ ] Cache optimizado (`artisan optimize`)
- [ ] Apache/Nginx configurado
- [ ] SSL/HTTPS habilitado
- [ ] Health check funcionando
- [ ] Login test exitoso
- [ ] App móvil conecta correctamente
- [ ] Web admin desplegado

---

**¡Deployment Completo!** 🎉

Tu cliente ahora puede usar la app desde cualquier lugar con conexión a internet.
