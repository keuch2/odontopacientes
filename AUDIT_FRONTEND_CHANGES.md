# 📋 GUÍA DE CAMBIOS FRONTEND - Eliminación de Mock Data

## Resumen
Este documento detalla los cambios necesarios en las pantallas de React Native para conectarlas a los endpoints reales del backend.

---

## 1. PatientsScreen.tsx

### ❌ Problema Actual
Usa datos hardcodeados:
```typescript
const mockChairs = [
  { id: 'cir', name: 'Cirugías', color: '#ef4444' },
  { id: 'per', name: 'Periodoncia', color: '#10b981' },
  // ...
]

const mockPatients = [
  { id: 1, name: 'María González', age: 45, city: 'Asunción', procedures: 'Extracción, Limpieza', chair: 'cir' },
  // ...
]
```

### ✅ Solución

**Paso 1: Agregar imports necesarios**
```typescript
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { ActivityIndicator } from 'react-native'
```

**Paso 2: Reemplazar mock data con queries**
```typescript
export default function PatientsScreen({ navigation }: any) {
  const [searchText, setSearchText] = useState('')
  const [selectedChair, setSelectedChair] = useState<number | null>(null)

  // Cargar cátedras desde la API
  const { data: chairsData, isLoading: loadingChairs } = useQuery({
    queryKey: ['chairs'],
    queryFn: () => api.chairs.list({ active: true }),
  })

  // Cargar pacientes desde la API
  const { data: patientsData, isLoading: loadingPatients } = useQuery({
    queryKey: ['patients', selectedChair, searchText],
    queryFn: () => api.patients.search({
      q: searchText || undefined,
      chair_id: selectedChair || undefined,
      per_page: 50,
    }),
  })

  const chairs = chairsData?.data?.data || []
  const patients = patientsData?.data?.data || []
  const isLoading = loadingChairs || loadingPatients
```

**Paso 3: Actualizar el renderizado de filtros**
```typescript
{loadingChairs ? (
  <View style={styles.loadingFilters}>
    <ActivityIndicator size="small" color={colors.brandTurquoise} />
  </View>
) : (
  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
    <TouchableOpacity
      style={[styles.filterChip, !selectedChair && styles.filterChipActive]}
      onPress={() => setSelectedChair(null)}
    >
      <AppText variant="caption" weight="semibold" color={!selectedChair ? 'white' : 'textSecondary'}>
        Todas
      </AppText>
    </TouchableOpacity>

    {chairs.map((chair: any) => (
      <TouchableOpacity
        key={chair.id}
        style={[
          styles.filterChip,
          selectedChair === chair.id && styles.filterChipActive,
          selectedChair === chair.id && { backgroundColor: chair.color }
        ]}
        onPress={() => setSelectedChair(chair.id)}
      >
        <AppText variant="caption" weight="semibold" color={selectedChair === chair.id ? 'white' : 'textSecondary'}>
          {chair.name}
        </AppText>
      </TouchableOpacity>
    ))}
  </ScrollView>
)}
```

**Paso 4: Actualizar el renderizado de pacientes**
```typescript
{isLoading ? (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color={colors.brandTurquoise} />
    <AppText color="textMuted" style={styles.loadingText}>
      Cargando pacientes...
    </AppText>
  </View>
) : patients.length === 0 ? (
  <View style={styles.emptyState}>
    <AppText color="textMuted" align="center">
      No se encontraron pacientes
    </AppText>
  </View>
) : (
  patients.map((patient: any) => (
    <PatientCard
      key={patient.id}
      patient={{
        id: patient.id,
        name: patient.full_name,
        age: patient.age,
        city: patient.city,
        procedures: patient.procedures?.map((p: any) => p.treatment?.name).join(', ') || 'Sin procedimientos',
        chair: patient.procedures?.[0]?.treatment?.chair?.key || 'general'
      }}
      onPress={() => navigation.navigate('PatientDetail', { patientId: patient.id })}
    />
  ))
)}
```

**Paso 5: Agregar estilos para loading**
```typescript
loadingFilters: {
  paddingVertical: spacing.md,
  alignItems: 'center',
},
loadingContainer: {
  paddingVertical: spacing.xxl,
  alignItems: 'center',
  justifyContent: 'center',
},
loadingText: {
  marginTop: spacing.md,
  fontSize: 14,
},
```

---

## 2. MyAssignmentsScreen.tsx

### ❌ Problema Actual
```typescript
const mockAssignments = [
  {
    id: 1,
    patient: 'María González',
    treatment: 'Extracción de muela del juicio',
    chair: 'Cirugías',
    chairColor: '#ef4444',
    sessionsCompleted: 2,
    totalSessions: 3,
    progress: 0.67,
    status: 'activa',
    nextSession: '2024-10-02'
  },
  // ...
]
```

### ✅ Solución

**Paso 1: Agregar imports**
```typescript
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { ActivityIndicator } from 'react-native'
```

**Paso 2: Reemplazar mock data**
```typescript
export default function MyAssignmentsScreen({ navigation }: any) {
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null)

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['my-assignments'],
    queryFn: () => api.students.getMyAssignments(),
  })

  const assignments = data?.data?.data || []
```

**Paso 3: Actualizar filtrado**
```typescript
const filteredAssignments = useMemo(() => {
  if (!selectedStatus) return assignments
  return assignments.filter((a: any) => a.status === selectedStatus)
}, [assignments, selectedStatus])
```

**Paso 4: Actualizar renderizado**
```typescript
{isLoading ? (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color={colors.brandTurquoise} />
    <AppText color="textMuted" style={styles.loadingText}>
      Cargando asignaciones...
    </AppText>
  </View>
) : filteredAssignments.length === 0 ? (
  <View style={styles.emptyState}>
    <AppText color="textMuted" align="center">
      No tienes asignaciones {selectedStatus ? `en estado ${selectedStatus}` : ''}
    </AppText>
  </View>
) : (
  filteredAssignments.map((assignment: any) => {
    const progress = assignment.sessions_completed / assignment.patient_procedure.treatment.estimated_sessions
    
    return (
      <AssignmentCard
        key={assignment.id}
        assignment={{
          id: assignment.id,
          patient: assignment.patient_procedure.patient.full_name,
          treatment: assignment.patient_procedure.treatment.name,
          chair: assignment.patient_procedure.treatment.chair.name,
          chairColor: assignment.patient_procedure.treatment.chair.color || '#6b7280',
          sessionsCompleted: assignment.sessions_completed,
          totalSessions: assignment.patient_procedure.treatment.estimated_sessions,
          progress: progress,
          status: assignment.status,
          nextSession: assignment.next_session_date || null
        }}
        onPress={() => navigation.navigate('AssignmentDetail', { assignmentId: assignment.id })}
      />
    )
  })
)}
```

---

## 3. DashboardScreen.tsx

### ❌ Problema Actual
```typescript
const todayAppointments: Appointment[] = [
  { id: 1, treatment: 'CIRUGÍA', toothNumber: '17', patient: 'Cármen Herrera', time: '18:00 hs', location: 'Universidad del Norte' },
]

const weekAppointments: Appointment[] = [
  { id: 2, treatment: 'CIRUGÍA', toothNumber: '17', patient: 'Cármen Herrera', date: 'Jueves 18 de Septiembre, 2025', time: '18:00 hs', location: 'Universidad del Norte' },
]
```

### ✅ Solución

**Paso 1: Usar el endpoint de asignaciones**
```typescript
const { data, isLoading } = useQuery({
  queryKey: ['my-assignments'],
  queryFn: () => api.students.getMyAssignments(),
})

const assignments = data?.data?.data || []
```

**Paso 2: Filtrar por fechas**
```typescript
const todayAssignments = useMemo(() => {
  const today = new Date().toISOString().split('T')[0]
  return assignments.filter((a: any) => 
    a.next_session_date && a.next_session_date.startsWith(today)
  )
}, [assignments])

const weekAssignments = useMemo(() => {
  const today = new Date()
  const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
  
  return assignments.filter((a: any) => {
    if (!a.next_session_date) return false
    const sessionDate = new Date(a.next_session_date)
    return sessionDate > today && sessionDate <= nextWeek
  })
}, [assignments])
```

**Paso 3: Actualizar renderizado**
```typescript
{isLoading ? (
  <ActivityIndicator size="large" color={colors.brandTurquoise} />
) : (
  <>
    <AppText variant="h3" color="brandNavy" weight="bold">
      Hoy ({todayAssignments.length})
    </AppText>
    {todayAssignments.map((assignment: any) => (
      <AppointmentCard
        key={assignment.id}
        appointment={{
          id: assignment.id,
          treatment: assignment.patient_procedure.treatment.name,
          patient: assignment.patient_procedure.patient.full_name,
          time: assignment.next_session_time || 'Por confirmar',
          location: assignment.location || 'Por confirmar'
        }}
      />
    ))}
  </>
)}
```

---

## 4. CatedrasScreen.tsx

### ❌ Problema Actual
```typescript
const catedras = [
  { id: 1, name: 'Cirugías', icon: require('../../assets/images/catedras/cirugias.png') },
  // ...
]

const mockPatients = [
  { id: 1, name: 'Cármen Herrera', age: 20, city: 'Villarrica', university: 'Universidad del Norte', catedra: 'Cirugías', tratamientos: ['CIRUGÍA SIMPLE', 'EXTRACCIÓN'], disponibles: 3, enProceso: 3, finalizados: 3 },
  // ...
]
```

### ✅ Solución

**Paso 1: Cargar cátedras reales**
```typescript
const { data: chairsData, isLoading: loadingChairs } = useQuery({
  queryKey: ['chairs'],
  queryFn: () => api.chairs.list({ active: true }),
})

const chairs = chairsData?.data?.data || []
```

**Paso 2: Cargar pacientes por cátedra**
```typescript
const { data: patientsData, isLoading: loadingPatients } = useQuery({
  queryKey: ['patients', selectedChair],
  queryFn: () => api.patients.search({
    chair_id: selectedChair || undefined,
    per_page: 50,
  }),
  enabled: !!selectedChair,
})

const patients = patientsData?.data?.data || []
```

**Paso 3: Renderizar con datos reales**
```typescript
{chairs.map((chair: any) => (
  <TouchableOpacity
    key={chair.id}
    style={styles.catedraCard}
    onPress={() => setSelectedChair(chair.id)}
  >
    <View style={[styles.iconContainer, { backgroundColor: chair.color }]}>
      <AppText variant="h2" color="white">{chair.name[0]}</AppText>
    </View>
    <AppText variant="h3" weight="bold">{chair.name}</AppText>
    <AppText variant="caption" color="textMuted">
      {chair.treatments?.length || 0} tratamientos
    </AppText>
  </TouchableOpacity>
))}
```

---

## 🎯 Endpoints Disponibles

Todos estos endpoints ya están implementados en `/mobile-app/src/lib/api.ts`:

- ✅ `api.chairs.list()` - Listar cátedras
- ✅ `api.patients.search()` - Buscar pacientes
- ✅ `api.students.getMyAssignments()` - Mis asignaciones
- ✅ `api.students.getAssignmentDetail(id)` - Detalle de asignación
- ✅ `api.students.completeAssignment(id, data)` - Completar asignación
- ✅ `api.students.abandonAssignment(id, data)` - Abandonar asignación
- ✅ `api.stats.getDashboard()` - Estadísticas del dashboard
- ✅ `api.notifications.list()` - Listar notificaciones

---

## 📝 Notas Importantes

1. **React Query ya está configurado** en la app
2. **El cliente API ya tiene todos los métodos** necesarios
3. **Los endpoints del backend ya retornan datos reales**
4. **Solo falta conectar las pantallas** a estos endpoints

---

## ✅ Checklist de Implementación

- [ ] PatientsScreen - Conectar a API
- [ ] MyAssignmentsScreen - Conectar a API
- [ ] DashboardScreen - Conectar a API
- [ ] CatedrasScreen - Conectar a API
- [ ] Probar flujo completo
- [ ] Verificar estados de loading
- [ ] Verificar estados de error
- [ ] Verificar estados vacíos

---

**Fecha de creación:** 2026-01-05  
**Autor:** Auditoría Técnica OdontoPacientes
