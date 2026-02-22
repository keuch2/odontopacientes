# OdontoPacientes - Descripción para Agentes de IA

## Resumen del Proyecto

**OdontoPacientes** es un sistema integral de gestión de pacientes odontológicos diseñado específicamente para estudiantes universitarios de odontología. El sistema conecta de manera eficiente a estudiantes con pacientes fichados por facultades, permitiendo una gestión completa del flujo clínico desde la búsqueda hasta la finalización de tratamientos.

### Problema que Resuelve

Las facultades de odontología enfrentan desafíos significativos en la gestión de pacientes para prácticas estudiantiles:

- **Búsqueda ineficiente**: Los estudiantes pierden tiempo buscando pacientes con tratamientos específicos
- **Falta de trazabilidad**: Dificultad para rastrear el progreso de tratamientos y asignaciones
- **Gestión manual**: Procesos en papel que generan errores y pérdida de información
- **Acceso limitado**: Información no disponible fuera del campus universitario

### Objetivos Principales

1. **Experiencia de Usuario Óptima**
   - Encontrar y agendar pacientes en 3-4 pasos máximo
   - Interfaz intuitiva tanto web como móvil
   - Acceso 24/7 desde cualquier dispositivo

2. **Trazabilidad Completa**
   - Seguimiento detallado por cátedra y procedimiento
   - Sistema de auditoría integral
   - Historial completo de cada estudiante y paciente

3. **Seguridad y Compliance**
   - Protección de datos sensibles de pacientes
   - Gestión de consentimientos digitalizados
   - Cumplimiento de normativas de salud

4. **Escalabilidad**
   - Soporte para múltiples universidades y facultades
   - Adaptable a diferentes flujos de trabajo académicos

## Arquitectura Técnica

### Stack Tecnológico

**Backend (API)**
- **Framework**: Laravel 11 con PHP 8.3
- **Autenticación**: Laravel Sanctum (tokens Bearer)
- **Base de Datos**: MySQL con Redis opcional
- **Documentación**: OpenAPI 3.0
- **Features**: CORS configurado, Query Builder avanzado, sistema de auditoría

**Frontend Web (Administración)**
- **Framework**: React 18 + Vite
- **Lenguaje**: TypeScript
- **Estilo**: Tailwind CSS con sistema de diseño personalizado
- **Estado**: Zustand + React Query
- **Features**: PWA-ready, responsive design, theming por cátedra

**Frontend Móvil**
- **Framework**: React Native con Expo
- **Lenguaje**: TypeScript
- **UI**: React Native Paper + Material Design 3
- **Navegación**: React Navigation 6
- **Features**: Offline-ready, push notifications, biometría

### Entidades Principales

**Gestión Académica**
- `University`: Universidades participantes
- `Faculty`: Facultades de odontología
- `Chair`: Cátedras (Cirugías, Periodoncia, etc.)
- `Treatment`: Tratamientos específicos por cátedra

**Usuarios**
- `User`: Sistema de roles (admin, coordinador, admision, alumno)
- `Student`: Información adicional para estudiantes

**Pacientes y Procedimientos**
- `Patient`: Datos personales y de contacto
- `PatientProcedure`: Tratamientos asignados a pacientes
- `Assignment`: Asignación estudiante-procedimiento
- `Consent`: Consentimientos digitalizados

**Clínico**
- `Odontogram`: Odontogramas digitales
- `OdontogramTooth`: Estado individual de cada diente

**Sistema**
- `Notification`: Sistema de notificaciones
- `Audit`: Trazabilidad completa de acciones

### Estados de Flujo

**Procedimientos de Paciente**
- `disponible`: Listo para ser tomado por estudiante
- `proceso`: Asignado y en tratamiento
- `finalizado`: Completado exitosamente
- `contraindicado`: No apto para tratamiento

**Asignaciones de Estudiante**
- `activa`: Estudiante trabajando en el caso
- `completada`: Tratamiento finalizado
- `abandonada`: Caso abandonado por el estudiante

## Flujos de Trabajo Principales

### Para Estudiantes

1. **Búsqueda de Pacientes**
   - Filtrar por cátedra específica
   - Buscar por tratamientos necesarios
   - Filtrar por ciudad del paciente
   - Ver disponibilidad en tiempo real

2. **Asignación de Casos**
   - Tomar paciente disponible
   - Automáticamente cambia estado a "en proceso"
   - Notificación al coordinador
   - Registro en historial del estudiante

3. **Gestión de Tratamiento**
   - Actualizar progreso de sesiones
   - Registrar notas clínicas
   - Completar tratamiento
   - Registrar precio final (si aplica)

### Para Coordinadores/Admin

1. **Gestión de Pacientes**
   - Registrar nuevos pacientes
   - Asignar procedimientos necesarios
   - Gestionar consentimientos
   - Supervisar odontogramas

2. **Supervisión Académica**
   - Monitorear progreso de estudiantes
   - Generar reportes por cátedra
   - Gestionar asignaciones conflictivas
   - Control de calidad

3. **Administración del Sistema**
   - Configurar cátedras y tratamientos
   - Gestionar usuarios y roles
   - Exportar datos para análisis
   - Mantenimiento del sistema

### Para Personal de Admisión

1. **Ingreso de Pacientes**
   - Registro completo de datos personales
   - Gestión de documentación
   - Verificación de consentimientos
   - Asignación inicial de procedimientos

## Estado Actual del Desarrollo (Enero 2026)

### ✅ Funcionalidades Implementadas

**Mobile App - Odontograma**
- ✅ Pantalla `OdontogramScreen.tsx` creada con UI interactiva
- ✅ Componente de dental chart con estados de dientes (sano, caries, endodoncia, etc.)
- ✅ Selección múltiple de dientes y cambio de estados
- ✅ Integrado en navegación principal
- ✅ Botón "Editar Odontograma" condicional en `PatientDetailScreen`
  - Solo visible si alumno tiene procedimiento activo (status='proceso')
  - Navegación correcta implementada

**Backend - Base de Datos**
- ✅ Migración de ficha médica (`add_medical_history_to_patients_table`)
- ✅ Campos de anamnesis agregados a tabla `patients`
- ✅ Migraciones corregidas (campos decimal 8,2 → 10,2 para precios)
- ✅ Base de datos poblada con datos de prueba:
  - 4 usuarios (admin, coordinador, alumno, admisión)
  - 85 pacientes
  - 448 procedimientos (250 disponibles, 81 en proceso, 70 finalizados, 47 contraindicados)
  - 151 asignaciones
  - 8 cátedras
  - 41 tratamientos
  - 85 odontogramas

**Seeders Funcionales**
- ✅ `DatabaseSeeder` actualizado para llamar todos los seeders
- ✅ `PatientProcedureSeeder` corregido (selección de status)
- ✅ Datos de prueba listos para desarrollo y testing

### 🔴 Pendientes Alta Prioridad - Web Admin

**1. Gestión de Alumnos**
- [ ] CRUD completo de estudiantes
- [ ] Formulario de registro con validación
- [ ] Asignación a facultades/cátedras
- [ ] Gestión de perfiles y permisos
- [ ] Vista de lista con búsqueda y filtros

**2. Gestión de Pacientes**
- [ ] Formulario completo de creación de pacientes
- [ ] Integración de campos de ficha médica (anamnesis)
  - Campos ya existen en BD: `has_allergies`, `allergies_description`, etc.
- [ ] Edición de pacientes existentes
- [ ] Búsqueda y filtrado avanzado
- [ ] Visualización de historial clínico

**3. Gestión de Procedimientos**
- [ ] Crear procedimientos para pacientes
- [ ] Asignar procedimientos a alumnos específicos
- [ ] Cambiar estado de procedimientos (disponible → proceso → finalizado)
- [ ] Vista de calendario/agenda de procedimientos
- [ ] Gestión de sesiones y progreso

**4. Odontograma en Web Admin**
- [ ] Interfaz para editar odontogramas desde web
- [ ] Visualización de historial de cambios
- [ ] Exportación a PDF
- [ ] Sincronización con mobile app

### 🟡 Pendientes Media Prioridad - Mobile App

**5. Integración de Odontograma con Backend**
- [ ] API endpoints para guardar/cargar odontogramas
- [ ] Sincronización de datos del odontograma
- [ ] Historial de cambios por procedimiento
- [ ] Validación de permisos (solo editar si tiene procedimiento activo)

**6. Ficha Médica en Mobile**
- [ ] Formulario de anamnesis en `CreatePatientScreen`
- [ ] Visualización de ficha médica en `PatientDetailScreen`
- [ ] Edición de ficha médica
- [ ] Validación de campos obligatorios

**7. Reemplazar Mock Data**
- [ ] `CatedrasScreen`: Conectar a API real (actualmente usa `mockPatients`)
- [ ] `PatientDetailScreen`: Usar datos reales del backend
- [ ] Eliminar todos los datos hardcoded
- [ ] Implementar manejo de estados de carga y error

### 🟢 Pendientes Baja Prioridad - Mejoras

**8. Notificaciones**
- [ ] Sistema de notificaciones push (Firebase Cloud Messaging)
- [ ] Alertas de procedimientos próximos
- [ ] Notificaciones de asignaciones
- [ ] Configuración de preferencias

**9. Reportes y Analytics**
- [ ] Dashboard de estadísticas por alumno
- [ ] Reportes por cátedra
- [ ] Exportación de datos (Excel, PDF)
- [ ] Visualizaciones con Chart.js

**10. Funcionalidades Avanzadas**
- [ ] Sistema de mensajería entre alumnos y coordinadores
- [ ] Gestión de consentimientos digitales
- [ ] Fotos de procedimientos (tabla `procedure_photos` ya existe)
- [ ] Firma digital
- [ ] Integración con calendario

## Próximos Pasos de Desarrollo

### Fase 1: Web Admin Básico (1-2 semanas)
1. **Módulo de Gestión de Alumnos**
   - Crear componentes React para CRUD
   - Implementar formularios con validación
   - Conectar con endpoints de API

2. **Formulario Completo de Pacientes**
   - Agregar campos de ficha médica
   - Implementar validación frontend
   - Conectar con API de pacientes

3. **Asignación de Procedimientos**
   - Interfaz para crear procedimientos
   - Sistema de asignación a alumnos
   - Gestión de estados

### Fase 2: Integración Mobile-Backend (1 semana)
1. **Conectar Pantallas a API Real**
   - Reemplazar mock data en `CatedrasScreen`
   - Actualizar `PatientDetailScreen` con datos reales
   - Implementar manejo de errores

2. **Odontograma Backend Integration**
   - Crear endpoints para guardar/cargar
   - Implementar sincronización
   - Agregar validación de permisos

3. **Ficha Médica Mobile**
   - Agregar formulario en `CreatePatientScreen`
   - Mostrar en `PatientDetailScreen`
   - Permitir edición

### Fase 3: Funcionalidades Avanzadas (2-3 semanas)
1. Sistema de notificaciones push
2. Reportes y analytics
3. Gestión de consentimientos
4. Fotos de procedimientos

## Próximos Pasos de Desarrollo (Roadmap Original)

### Fase 2: Funcionalidades Avanzadas

**Odontograma Interactivo** (Parcialmente Completado)
- ✅ Canvas interactivo con React Native
- ⏳ Anotaciones por superficie dental
- ⏳ Historial de cambios visuales
- ⏳ Exportación a PDF

**Sistema de Notificaciones Push**
- Firebase Cloud Messaging
- Notificaciones por rol y contexto
- Configuración de preferencias
- Integración con calendario

**Importador de Datos**
- Carga masiva vía CSV/Excel
- Validación automática de datos
- Mapeo de campos flexible
- Reportes de importación

### Fase 3: Inteligencia y Analytics

**Dashboard Analytics**
- Métricas de rendimiento por estudiante
- Análisis predictivo de casos
- Reportes automáticos por período
- Visualizaciones avanzadas con Chart.js

**Sistema de Recomendaciones**
- Sugerir pacientes según historial del estudiante
- Optimizar asignaciones por complejidad
- Alertas de casos urgentes o prioritarios

**Machine Learning**
- Predicción de tiempo de tratamiento
- Detección de patrones en odontogramas
- Recomendaciones de tratamientos alternativos

### Fase 4: Expansión y Integración

**Multi-tenancy**
- Soporte para múltiples universidades
- Configuración personalizada por institución
- Facturación y billing automatizado

**Integraciones Externas**
- Sistemas académicos universitarios
- Equipos de diagnóstico digital
- Plataformas de telemedicina
- Software de gestión hospitalaria

**API Pública**
- Endpoints para terceros
- Webhooks para integraciones
- SDK para desarrolladores
- Marketplace de extensiones

## URLs y Deployment

### Estructura de URLs de Producción

**Ubicación Base**: `http://localhost/odontopacientes/`

- **🏠 Raíz del proyecto**: `http://localhost/odontopacientes/`
- **🖥️ Web Admin (React Build)**: `http://localhost/odontopacientes/web-admin/`
- **🔌 API Backend (Laravel)**: `http://localhost/odontopacientes/backend/public/`
- **📊 API Health Check**: `http://localhost/odontopacientes/backend/public/api/health`
- **🔑 API Login**: `http://localhost/odontopacientes/backend/public/api/auth/login`

### Configuración de Environment Variables

**Backend Laravel** (`.env`):
```env
APP_URL=http://localhost/odontopacientes/backend/public
CORS_ALLOWED_ORIGINS="http://localhost/odontopacientes/web-admin"
```

**Frontend React** (`.env.local`):
```env
VITE_API_URL=http://localhost/odontopacientes/backend/public/api
```

### Comandos de Build

**Web Admin (React)**:
```bash
cd web-admin
npm run build
# Los archivos se generan en: web-admin/dist/
```

**API Backend (Laravel)**:
```bash
cd backend
composer install --optimize-autoloader --no-dev
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

### Credenciales Demo

```bash
# Usuarios de prueba disponibles (Base de datos poblada)
admin@demo.test / password        # Administrador
coordinador@demo.test / password  # Coordinador
alumno@demo.test / password       # Estudiante (con 81 procedimientos activos)
admision@demo.test / password     # Personal de Admisión
```

### Comandos de Desarrollo

**Backend - Resetear y Poblar Base de Datos**:
```bash
cd backend
php artisan migrate:fresh --seed
# Crea 85 pacientes, 448 procedimientos, 151 asignaciones
```

**Mobile App - Iniciar Expo**:
```bash
cd mobile-app
npx expo start --clear
# Escanear QR con Expo Go en iOS/Android
```

### Configuración de Red para Mobile App

**⚠️ IMPORTANTE: Configuración de IP para desarrollo**

La app móvil necesita conectarse al backend Laravel. La IP de red debe configurarse en dos archivos:

1. **`mobile-app/.env`** - Variable de entorno principal:
```env
EXPO_PUBLIC_API_URL=http://TU_IP_LOCAL/odontopacientes/backend/public/api
APP_VARIANT=development
```

2. **`mobile-app/app.config.js`** - Fallback en función `getApiUrl()`:
```javascript
if (IS_DEV) {
  return 'http://TU_IP_LOCAL/odontopacientes/backend/public/api';
}
```

**Obtener tu IP local**:
```bash
# macOS/Linux
ifconfig | grep "inet " | grep -v 127.0.0.1
# Buscar la IP que empieza con 192.168.x.x
```

**Verificar que Apache responde en la IP de red**:
```bash
curl -s http://TU_IP_LOCAL/odontopacientes/backend/public/api/health
# Si hay timeout, reiniciar Apache:
sudo brew services restart httpd
```

### Modos de Inicio de Expo

**Modo LAN (recomendado para dispositivos físicos)**:
```bash
cd mobile-app
npx expo start --clear
# Presionar 'a' para Android o 'i' para iOS simulator
```

**Modo Tunnel (para problemas de conectividad de red)**:
```bash
cd mobile-app
npx expo start --tunnel
# Crea un túnel público, útil cuando el simulador no puede conectarse a la IP local
# Requiere: npm install -g @expo/ngrok
```

**Modo Web (alternativa rápida para testing)**:
```bash
cd mobile-app
npx expo start --clear
# Presionar 'w' para abrir en navegador web
# Usa localhost, evita problemas de red
```

### Troubleshooting Común

**Error: "timeout of 30000ms exceeded"**
1. Verificar que Apache está corriendo: `brew services list | grep httpd`
2. Reiniciar Apache: `sudo brew services restart httpd`
3. Verificar IP correcta en `.env` y `app.config.js`
4. Limpiar caché de Expo: `npx expo start --clear`

**Error: "Operation timed out" en iOS Simulator**
- El simulador iOS puede tener problemas conectándose a IPs de red local
- Usar modo tunnel: `npx expo start --tunnel`
- O usar la versión web: presionar 'w' en Expo

**La app usa IP incorrecta**
- Expo cachea la configuración, siempre usar `--clear` después de cambiar `.env`
- Verificar que `.env` tiene la IP correcta (no `.env.development`)
- El archivo `.env` tiene prioridad sobre `app.config.js`

## Consideraciones Técnicas para Agentes

### Patrones de Desarrollo

**Backend**
- Repository Pattern para acceso a datos
- Service Layer para lógica de negocio  
- Event-Driven Architecture para notificaciones
- SOLID principles y Clean Architecture

**Frontend**
- Component-Driven Development
- Atomic Design principles
- Progressive Web App capabilities
- Accessibility-first approach

### Seguridad

**Autenticación y Autorización**
- JWT tokens con refresh capability
- Role-based access control (RBAC)
- Rate limiting por endpoint
- Audit log completo

**Protección de Datos**
- Encriptación de datos sensibles
- GDPR compliance ready
- Backup automático y disaster recovery
- Anonimización de datos para analytics

### Performance

**Backend**
- Database indexing strategy
- Query optimization con Eloquent
- Redis caching layer
- Queue system para tareas pesadas

**Frontend**
- Code splitting y lazy loading
- Image optimization automática
- Service Worker para offline capability
- Bundle size monitoring

### Testing Strategy

**Cobertura de Pruebas**
- Unit tests para lógica de negocio
- Integration tests para APIs
- E2E tests para flujos críticos
- Performance testing automatizado

### DevOps y Deployment

**Continuous Integration**
- GitHub Actions para CI/CD
- Automated testing en PRs
- Code quality gates con SonarQube
- Dependency vulnerability scanning

**Monitoring y Observability**
- Application Performance Monitoring (APM)
- Error tracking con Sentry
- Structured logging con ELK stack
- Health checks automatizados

## 🔍 Diagnóstico Completo del Web Admin (Enero 2026)

### ✅ **Componentes Implementados**

**Estructura Base**
- ✅ Autenticación con Zustand + localStorage persistence
- ✅ API client con Axios + interceptors (auth, error handling)
- ✅ Layout completo (Sidebar + Header + Toaster)
- ✅ Routing con React Router v6
- ✅ Sistema de diseño con Tailwind CSS

**Páginas Existentes**
1. **LoginPage** - ✅ Funcional
2. **DashboardAdmin** - ✅ Con mock data
3. **PatientsPage** - ⚠️ Solo UI con mock data (3 pacientes)
4. **StudentsPage** - ⚠️ Solo UI con mock data (2 estudiantes)
5. **ChairsPage** - ⚠️ Solo UI con mock data (6 cátedras)
6. **UsersPage** - ❓ Existe pero no analizado

**Rutas Placeholder (Sin Implementar)**
- `/my-assignments` - Placeholder
- `/reports` - Placeholder
- `/imports` - Placeholder
- `/notifications` - Placeholder
- `/settings` - Placeholder

### ⚠️ **Problemas Identificados**

**1. Mock Data en Todas las Páginas**
- `PatientsPage`: 3 pacientes hardcoded (líneas 18-55)
- `StudentsPage`: 2 estudiantes hardcoded (líneas 17-42)
- `ChairsPage`: 6 cátedras hardcoded (líneas 13-68)
- `DashboardAdmin`: Estadísticas mock (líneas 4-30)

**2. Funcionalidades No Conectadas a API**
- ❌ Botón "Nuevo Paciente" no funcional
- ❌ Botón "Nuevo Estudiante" no funcional
- ❌ Botón "Nueva Cátedra" no funcional
- ❌ Botones "Ver", "Editar" no funcionales
- ❌ Filtros no conectados a backend
- ❌ Exportación no implementada

**3. Páginas Faltantes Críticas**
- ❌ Formulario de creación de pacientes
- ❌ Formulario de edición de pacientes
- ❌ Vista detalle de paciente
- ❌ Formulario de creación de estudiantes
- ❌ Vista detalle de estudiante
- ❌ Gestión de procedimientos
- ❌ Asignación de procedimientos a pacientes
- ❌ Asignación de procedimientos a estudiantes
- ❌ Gestión de tratamientos por cátedra
- ❌ Editor de odontogramas
- ❌ Gestión de consentimientos

**4. API Client Completo Pero Sin Uso**
- ✅ API client tiene todos los endpoints necesarios
- ❌ Ninguna página usa el API client
- ❌ No hay integración con React Query
- ❌ No hay manejo de estados de carga
- ❌ No hay manejo de errores en UI

### 📊 **Análisis de Completitud**

**Infraestructura**: 80% ✅
- Autenticación, routing, layout, API client listos
- Falta: Error boundaries, loading states, toast notifications en uso

**UI/UX**: 30% ⚠️
- Diseño visual completo y consistente
- Falta: Formularios, modales, validaciones, feedback visual

**Funcionalidad**: 10% ❌
- Solo login funcional
- Todo lo demás es mock data sin interacción

**Integración Backend**: 5% ❌
- API client existe pero no se usa
- No hay fetch de datos reales
- No hay mutaciones (create, update, delete)

## 🗺️ Roadmap Detallado de Desarrollo Web Admin

### **SPRINT 1: Fundamentos y Pacientes (Semana 1-2)**
**Objetivo**: Sistema completo de gestión de pacientes

#### Tareas Sprint 1
1. **Conectar PatientsPage a API** (4h)
   - Reemplazar mock data con `api.patients.getAll()`
   - Implementar React Query para fetch y cache
   - Agregar estados de loading y error
   - Implementar paginación real

2. **Crear PatientFormModal** (6h)
   - Componente modal reutilizable
   - Formulario completo con validación (react-hook-form)
   - Campos: datos personales, contacto, dirección
   - Integrar campos de ficha médica (anamnesis)
   - Conectar a `api.patients.create()`

3. **Crear PatientDetailPage** (8h)
   - Vista completa de información del paciente
   - Tabs: Información, Procedimientos, Odontograma, Historial
   - Botones de acción: Editar, Asignar Procedimiento
   - Integrar con `api.patients.getById()`

4. **Implementar Edición de Pacientes** (4h)
   - Reutilizar PatientFormModal en modo edición
   - Pre-cargar datos existentes
   - Conectar a `api.patients.update()`

5. **Agregar Filtros Funcionales** (3h)
   - Búsqueda por nombre/documento/email
   - Filtro por ciudad
   - Filtro por estado
   - Debounce en búsqueda

**Entregables Sprint 1**:
- ✅ CRUD completo de pacientes
- ✅ Formulario con ficha médica
- ✅ Vista detalle funcional
- ✅ Filtros y búsqueda operativos

---

### **SPRINT 2: Estudiantes y Asignaciones (Semana 3-4)**
**Objetivo**: Gestión completa de estudiantes y sus asignaciones

#### Tareas Sprint 2
1. **Conectar StudentsPage a API** (3h)
   - Reemplazar mock data con `api.students.getAll()`
   - Implementar React Query
   - Estados de loading y error

2. **Crear StudentFormModal** (5h)
   - Formulario de registro de estudiante
   - Campos: nombre, email, teléfono, matrícula, cátedra
   - Validación de email único
   - Conectar a API (endpoint a crear en backend)

3. **Crear StudentDetailPage** (8h)
   - Información del estudiante
   - Lista de asignaciones activas
   - Historial de procedimientos completados
   - Estadísticas de rendimiento
   - Integrar con `api.students.getById()` y `api.students.getAssignments()`

4. **Crear AssignmentsManagementPage** (10h)
   - Vista de todas las asignaciones del sistema
   - Filtros: por estudiante, por cátedra, por estado
   - Tabla con: Estudiante, Paciente, Procedimiento, Estado, Fecha
   - Acciones: Ver detalle, Cambiar estado, Reasignar

5. **Implementar Asignación de Procedimientos** (6h)
   - Modal para asignar procedimiento a estudiante
   - Búsqueda de estudiantes disponibles
   - Validación de disponibilidad
   - Conectar a `api.procedures.assign()`

**Entregables Sprint 2**:
- ✅ CRUD de estudiantes
- ✅ Vista detalle con asignaciones
- ✅ Sistema de asignación de procedimientos
- ✅ Gestión de asignaciones

---

### **SPRINT 3: Procedimientos y Tratamientos (Semana 5-6)**
**Objetivo**: Gestión completa de procedimientos y tratamientos

#### Tareas Sprint 3
1. **Crear ProceduresPage** (8h)
   - Lista de todos los procedimientos
   - Filtros: por cátedra, por estado, por paciente
   - Tabla: Paciente, Tratamiento, Estado, Estudiante Asignado, Fecha
   - Acciones: Ver, Asignar, Cambiar Estado

2. **Crear ProcedureFormModal** (6h)
   - Formulario para crear procedimiento
   - Selección de paciente
   - Selección de tratamiento (por cátedra)
   - Notas iniciales
   - Precio estimado
   - Conectar a API (endpoint a crear)

3. **Crear ProcedureDetailPage** (8h)
   - Información completa del procedimiento
   - Datos del paciente
   - Estudiante asignado (si aplica)
   - Progreso de sesiones
   - Notas clínicas
   - Historial de cambios
   - Botones: Actualizar Progreso, Completar, Contraindicar

4. **Conectar ChairsPage a API** (4h)
   - Reemplazar mock data con `api.chairs.getAll()`
   - Mostrar estadísticas reales
   - Implementar vista de tratamientos por cátedra

5. **Crear TreatmentsManagementPage** (6h)
   - Lista de tratamientos por cátedra
   - CRUD de tratamientos
   - Campos: nombre, código, cátedra, sesiones estimadas, precio base
   - Ordenamiento y activación/desactivación

**Entregables Sprint 3**:
- ✅ Gestión completa de procedimientos
- ✅ CRUD de tratamientos
- ✅ Cátedras con datos reales
- ✅ Flujo completo de procedimientos

---

### **SPRINT 4: Odontogramas y Consentimientos (Semana 7-8)**
**Objetivo**: Funcionalidades clínicas avanzadas

#### Tareas Sprint 4
1. **Crear OdontogramEditorComponent** (12h)
   - Canvas interactivo con dientes
   - Selección de dientes
   - Estados: sano, caries, endodoncia, extracción, etc.
   - Notas por diente
   - Guardado automático
   - Integrar con API de odontogramas

2. **Integrar Odontograma en PatientDetailPage** (4h)
   - Tab de Odontograma
   - Visualización de odontograma actual
   - Botón para editar
   - Historial de cambios

3. **Crear ConsentsManagementPage** (6h)
   - Lista de consentimientos por paciente
   - Upload de documentos PDF
   - Firma digital (canvas)
   - Estados: pendiente, firmado, rechazado
   - Descarga de consentimientos

4. **Implementar Gestión de Documentos** (5h)
   - Upload de archivos (fotos, documentos)
   - Galería de fotos por procedimiento
   - Integrar con tabla `procedure_photos`
   - Preview de imágenes

**Entregables Sprint 4**:
- ✅ Editor de odontogramas funcional
- ✅ Gestión de consentimientos
- ✅ Sistema de documentos y fotos
- ✅ Firma digital

---

### **SPRINT 5: Reportes y Analytics (Semana 9-10)**
**Objetivo**: Dashboard con métricas y reportes

#### Tareas Sprint 5
1. **Conectar DashboardAdmin a API** (4h)
   - Reemplazar mock data con `api.stats.getDashboard()`
   - Estadísticas reales del sistema
   - Gráficos con Chart.js o Recharts

2. **Crear ReportsPage** (10h)
   - Reportes por cátedra
   - Reportes por estudiante
   - Reportes por período
   - Filtros avanzados
   - Exportación a Excel/PDF
   - Gráficos de rendimiento

3. **Implementar NotificationsPage** (6h)
   - Lista de notificaciones del sistema
   - Filtros por tipo
   - Marcar como leído
   - Configuración de preferencias
   - Integrar con `api.notifications`

4. **Crear SettingsPage** (5h)
   - Configuración de perfil
   - Cambio de contraseña
   - Preferencias de notificaciones
   - Configuración de universidad/facultad

**Entregables Sprint 5**:
- ✅ Dashboard con datos reales
- ✅ Sistema de reportes completo
- ✅ Notificaciones funcionales
- ✅ Configuración de usuario

---

### **SPRINT 6: Importación y Optimización (Semana 11-12)**
**Objetivo**: Funcionalidades avanzadas y optimización

#### Tareas Sprint 6
1. **Crear ImportsPage** (8h)
   - Upload de CSV/Excel
   - Mapeo de columnas
   - Validación de datos
   - Preview antes de importar
   - Importación masiva de pacientes
   - Reporte de errores

2. **Implementar Búsqueda Global** (4h)
   - Barra de búsqueda en header
   - Búsqueda en: pacientes, estudiantes, procedimientos
   - Resultados agrupados por tipo
   - Navegación rápida

3. **Optimizar Performance** (6h)
   - Implementar lazy loading de componentes
   - Optimizar queries con React Query
   - Agregar skeleton loaders
   - Implementar virtual scrolling en tablas grandes

4. **Testing y Bug Fixing** (6h)
   - Pruebas de integración
   - Corrección de bugs
   - Validación de flujos completos
   - Testing de permisos por rol

**Entregables Sprint 6**:
- ✅ Sistema de importación masiva
- ✅ Búsqueda global funcional
- ✅ Performance optimizado
- ✅ Sistema estable y testeado

---

## 📋 Resumen de Estimaciones

| Sprint | Objetivo | Duración | Horas Estimadas |
|--------|----------|----------|----------------|
| Sprint 1 | Pacientes | 2 semanas | 25h |
| Sprint 2 | Estudiantes | 2 semanas | 32h |
| Sprint 3 | Procedimientos | 2 semanas | 32h |
| Sprint 4 | Odontogramas | 2 semanas | 27h |
| Sprint 5 | Reportes | 2 semanas | 25h |
| Sprint 6 | Importación | 2 semanas | 24h |
| **TOTAL** | **Web Admin Completo** | **12 semanas** | **165h** |

## 🎯 Prioridades Inmediatas (Esta Semana)

1. **Conectar PatientsPage a API** (Día 1-2)
2. **Crear PatientFormModal** (Día 2-3)
3. **Implementar PatientDetailPage** (Día 3-5)

## Archivos Clave Modificados Recientemente

**Mobile App**:
- `/mobile-app/src/screens/OdontogramScreen.tsx` - **CREADO** - Pantalla de odontograma interactivo
- `/mobile-app/src/screens/PatientDetailScreen.tsx` - **MODIFICADO** - Botón condicional odontograma
- `/mobile-app/src/screens/CreatePatientScreen.tsx` - **MODIFICADO** - Removido botón odontograma
- `/mobile-app/src/navigation/index.tsx` - **MODIFICADO** - Agregada ruta Odontogram

**Backend - Migraciones**:
- `/backend/database/migrations/2024_01_02_000001_add_medical_history_to_patients_table.php` - **CREADO**
- `/backend/database/migrations/2024_01_01_000006_create_treatments_table.php` - **MODIFICADO** - base_price decimal(10,2)
- `/backend/database/migrations/2024_01_01_000009_create_patient_procedures_table.php` - **MODIFICADO** - estimated_price decimal(10,2)
- `/backend/database/migrations/2024_01_01_000010_create_assignments_table.php` - **MODIFICADO** - final_price decimal(10,2)

**Backend - Seeders**:
- `/backend/database/seeders/DatabaseSeeder.php` - **MODIFICADO** - Llama todos los seeders
- `/backend/database/seeders/PatientProcedureSeeder.php` - **MODIFICADO** - Corregida selección de status

## Notas Importantes para Agentes

**Estado de Mock Data**:
- ⚠️ `PatientDetailScreen.tsx` usa datos hardcoded (líneas 60-95)
- ⚠️ `CatedrasScreen.tsx` usa `mockPatients` (líneas 20-50)
- ✅ Otros screens ya conectados a API real

**Campos de Ficha Médica Disponibles** (tabla `patients`):
- `has_allergies`, `allergies_description`
- `has_chronic_diseases`, `chronic_diseases_description`
- `takes_medications`, `medications_description`
- `has_previous_surgeries`, `previous_surgeries_description`
- `is_pregnant`, `pregnancy_months`
- `has_bleeding_disorders`, `bleeding_disorders_description`

**Convenciones de Código**:
- Mobile: React Native Paper para UI components
- Backend: Laravel Resource Controllers con API Resources
- Validación: Frontend (React Hook Form) + Backend (Form Requests)
- Autenticación: Sanctum tokens en header `Authorization: Bearer {token}`

---

**Nota para Agentes de IA**: Este sistema está diseñado para ser altamente mantenible y escalable. Al trabajar con el código, priorizar la claridad, consistencia y documentación. Seguir las convenciones establecidas y considerar siempre el impacto en la experiencia del usuario final (estudiantes y coordinadores académicos).

**Última Actualización**: Enero 5, 2026 - Implementación de odontograma mobile y población de base de datos.
