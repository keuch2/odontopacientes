# OdontoPacientes — Ficha App Store Connect

Textos listos para copiar/pegar en App Store Connect → tu app → Distribución → versión 1.0.

---

## Información básica

| Campo | Valor |
|---|---|
| Nombre de la app | OdontoPacientes |
| Subtítulo (máx 30 caracteres) | Pacientes y cátedras dentales |
| Bundle ID | com.keuch2.odontopacientes-mobile |
| SKU | odontopacientes-mobile |
| Categoría primaria | Medicina |
| Categoría secundaria | Educación |
| Idioma principal | Español (México) |
| Clasificación de edad | 17+ (información médica/clínica) |

---

## Subtítulo (30 caracteres)

```
Pacientes y cátedras dentales
```

(28 caracteres, dentro del límite)

---

## Promotional text (170 caracteres, editable sin nueva revisión)

```
Gestioná tus pacientes, asignaciones de cátedra y odontogramas desde el móvil. Diseñada para alumnos y docentes de odontología universitaria.
```

---

## Descripción (máx 4000 caracteres)

```
OdontoPacientes es una plataforma de gestión clínica diseñada para estudiantes y docentes de odontología universitaria. Permite registrar pacientes, asignar tratamientos, documentar procedimientos clínicos y hacer seguimiento de la historia odontológica desde el dispositivo móvil, en sintonía con el flujo académico de cátedras y facultades.

PRINCIPALES FUNCIONES

• Cátedras y tratamientos
Acceso jerárquico por universidad, facultad y cátedra. Cada cátedra define los tratamientos disponibles, sus subclases y opciones (por ejemplo, Caries → Clase I, Clase II) que el alumno selecciona al registrar un procedimiento.

• Pacientes y odontograma
Cada paciente tiene un odontograma completo con notación FDI internacional. Marcá el estado de cada pieza (sano, caries, endodoncia, ausente) y registrá la superficie tratada y observaciones clínicas.

• Asignaciones y seguimiento
Los coordinadores asignan pacientes y procedimientos a alumnos. La aplicación permite seguir el flujo disponible → en proceso → finalizado, además de marcar contraindicados o ausentes.

• Búsqueda jerárquica
Filtrá pacientes por cátedra, tratamiento, subclase, pieza dental (FDI) y estado del procedimiento. La búsqueda combina nombre del paciente y nombre del tratamiento.

• Historial clínico
Consultá todas las sesiones realizadas sobre un paciente, con tratamientos, subclases, dientes intervenidos y notas clínicas.

• Sesiones y dientes ausentes
Registrá múltiples sesiones por procedimiento. Las muelas del juicio (18, 28, 38, 48) pueden marcarse como ausentes con un solo toque.

• Notificaciones
Recibí avisos sobre nuevas asignaciones, cambios de estado en procedimientos y recordatorios académicos. Podés personalizar qué tipos de notificaciones recibir.

ROLES SOPORTADOS

• Alumno: registra procedimientos, completa sesiones y consulta sus pacientes asignados.
• Coordinador: asigna pacientes a alumnos y supervisa el avance de los tratamientos.
• Admisión: registra nuevos pacientes en la cátedra.
• Administrador: gestiona usuarios, cátedras y tratamientos.

PRIVACIDAD Y SEGURIDAD

OdontoPacientes está diseñada para entornos académicos clínicos. Los datos se transmiten siempre cifrados con HTTPS, el acceso está restringido por roles y los registros de auditoría documentan toda la actividad clínica. Los datos clínicos de pacientes nunca se comparten con proveedores analíticos.

REQUISITOS

Para usar la aplicación necesitás una cuenta institucional asignada por tu cátedra. Si todavía no tenés cuenta, contactá al coordinador o administrador de tu universidad.

Política de privacidad: https://codexpy.com/odontopacientes/privacidad
```

---

## Keywords (máx 100 caracteres, separadas por coma, sin espacios)

```
odontologia,dental,pacientes,catedra,universidad,odontograma,clinica,FDI,tratamiento,alumnos
```

(99 caracteres)

---

## URLs

| Campo | Valor |
|---|---|
| URL de soporte | https://codexpy.com/odontopacientes/privacidad |
| URL de marketing (opcional) | https://codexpy.com/odontopacientes |
| URL de política de privacidad | https://codexpy.com/odontopacientes/privacidad |

> Nota: el campo "URL de soporte" idealmente debería ser una página específica de soporte/contacto. Si no la tenés, usar la de privacidad temporalmente es aceptado por Apple, pero conviene crear una sección de soporte simple a futuro.

---

## Información de privacidad (App Privacy)

App Store Connect → tu app → **Privacidad de la app** → Editar.

### Datos recolectados

| Tipo de dato | Vinculado a usuario | Tracking | Propósito |
|---|---|---|---|
| Nombre | Sí | No | Funcionalidad de la app |
| Email | Sí | No | Funcionalidad de la app, soporte |
| ID de usuario | Sí | No | Funcionalidad de la app |
| Datos de uso (acciones) | Sí | No | Analytics, funcionalidad |
| Diagnóstico (logs de errores) | No vinculado | No | Diagnóstico de fallas |
| Datos de salud (de pacientes) | Sí | No | Funcionalidad de la app |

> **Importante**: declarar "Datos de salud" porque la app guarda historia clínica odontológica. Apple acepta que sean datos de pacientes (no del usuario) siempre que se aclare en las notas de revisión.

### Tracking

**No realizamos tracking entre apps o sitios web.** Marcar "No" en la pregunta de tracking.

---

## Cuestionario de exportación (cifrado)

Pregunta: *"¿Tu app usa cifrado?"*

Respuesta: **Sí**, pero **exenta** porque solo usa HTTPS estándar de iOS para comunicarse con el servidor (no implementa cifrado propio).

> Esto se declaró ya en `app.config.js` con `ITSAppUsesNonExemptEncryption: false`, así que App Store Connect debería detectarlo automáticamente.

---

## Notas para el equipo de revisión de Apple

Pegar exactamente este texto en App Store Connect → tu app → versión → **Notas para el equipo de revisión** (Notes for Review):

```
INFORMACIÓN PARA EL REVISOR

Esta es una aplicación institucional para gestión de pacientes odontológicos en el contexto de práctica académica universitaria. Los usuarios son alumnos, docentes y personal administrativo de facultades de odontología. Los pacientes cuyos datos clínicos se cargan en la aplicación NO son usuarios de la app: son personas atendidas en clínicas universitarias bajo supervisión académica.

CUENTAS DE PRUEBA

Alumno:
   Email: alumno@demo.test
   Password: password

Coordinador (puede asignar pacientes a alumnos):
   Email: coordinador@demo.test
   Password: password

Admisión (puede registrar pacientes nuevos):
   Email: admision@demo.test
   Password: password

Administrador (acceso completo):
   Email: admin@demo.test
   Password: password

INSTRUCCIONES SUGERIDAS

1. Iniciar sesión con las credenciales de "Alumno" para ver el flujo principal.
2. Explorar la pestaña "Cátedras" para ver pacientes filtrados por cátedra.
3. Abrir un paciente y ver su odontograma con notación FDI.
4. Probar "Mis Pacientes" para ver asignaciones activas.
5. Iniciar sesión como "Coordinador" para probar la asignación de pacientes.

CONSENTIMIENTO INFORMADO DE PACIENTES

El consentimiento informado de los pacientes es obtenido por la institución académica (cátedra/facultad) antes de la carga de datos en la aplicación. La aplicación documenta esta autorización pero la responsabilidad legal recae en la institución y el alumno tratante, conforme se detalla en la sección 6 de la política de privacidad: https://codexpy.com/odontopacientes/privacidad

CONTACTO

Email: boris@mister.com.py
Responsable: Boris Dedoff
```

---

## Capturas de pantalla requeridas

### iPhone 6.9" (obligatorio)
- Resolución: **1320 × 2868 px**
- Dispositivos: iPhone 16 Pro Max, iPhone 15 Pro Max
- Mínimo: 1 captura — Recomendado: 5–8

### iPhone 6.7" (obligatorio si la 6.9" no está disponible)
- Resolución: **1284 × 2778 px**
- Dispositivos: iPhone 14 Plus, iPhone 13 Pro Max
- Apple usa estas como fallback para tamaños menores

### iPad Pro 13" (obligatorio porque `supportsTablet: true`)
- Resolución: **2064 × 2752 px**
- Dispositivo: iPad Pro 13" (M4)

### Capturas sugeridas (en orden de aparición en la ficha)

1. **Pantalla de inicio / login** con branding visible
2. **Lista de cátedras** mostrando la jerarquía
3. **Pacientes filtrados por cátedra** con barra de búsqueda
4. **Detalle de paciente con odontograma** (la pantalla más visual)
5. **Mis pacientes / asignaciones activas**
6. **Detalle de procedimiento** con sesiones y notas
7. **Historial clínico** de un paciente

---

## Checklist final antes de "Enviar para revisión"

- [ ] Build de producción subido y seleccionado en la versión
- [ ] Subtítulo, descripción, promotional text, keywords completados
- [ ] Categorías Medicina + Educación seleccionadas
- [ ] Clasificación de edad 17+ (cuestionario completado: información médica frecuente/intensa)
- [ ] URL de política de privacidad: https://codexpy.com/odontopacientes/privacidad
- [ ] URL de soporte completada
- [ ] App Privacy: declarado uso de datos de salud, ID, email, nombre, datos de uso
- [ ] Tracking: declarado "No"
- [ ] Cuestionario de exportación: marcado como exento (HTTPS estándar)
- [ ] Notas para revisor con cuentas demo pegadas
- [ ] Capturas iPhone 6.9", 6.7" y iPad 13" subidas
- [ ] Versión 1.0 con build seleccionado y "Manual release" o "Automatic release" configurado
```
