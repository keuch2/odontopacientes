import React, { useState } from 'react'
import { View, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { AppText } from '../components/ui'
import { colors } from '../theme/colors'
import { spacing } from '../theme/spacing'
import { api } from '../lib/api'

type FilterType = 'all' | 'activa' | 'completada' | 'creados'

interface Assignment {
  id: number
  status: 'activa' | 'completada'
  sessions_completed: number
  assigned_at: string
  patient_procedure: {
    id: number
    treatment: {
      id: number
      name: string
      estimated_sessions: number
    }
    chair: {
      id: number
      name: string
    }
    patient: {
      id: number
      full_name: string
    }
  }
}

interface CreatedPatient {
  id: number
  full_name: string
  city: string | null
  document_number: string | null
  created_at: string
}

type ListItem =
  | { type: 'assignment'; data: Assignment }
  | { type: 'created_patient'; data: CreatedPatient }

const STATUS_CONFIG = {
  activa: {
    label: 'En Proceso',
    color: colors.success,
    bgColor: '#E8F5E9',
    icon: 'medical' as const,
  },
  completada: {
    label: 'Completada',
    color: colors.brandNavy,
    bgColor: '#E3F2FD',
    icon: 'checkmark-circle' as const,
  },
}

export default function MyPatientsScreen({ navigation }: any) {
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const { data: assignmentsData, isLoading: assignmentsLoading, error: assignmentsError, refetch: refetchAssignments, isRefetching: isRefetchingAssignments } = useQuery({
    queryKey: ['my-assignments'],
    queryFn: async () => {
      const response = await api.students.getMyAssignments()
      return response.data.data as Assignment[]
    },
  })

  const { data: createdPatientsData, isLoading: createdLoading, refetch: refetchCreated, isRefetching: isRefetchingCreated } = useQuery({
    queryKey: ['my-created-patients'],
    queryFn: async () => {
      const response = await api.students.getMyCreatedPatients()
      return response.data.data as CreatedPatient[]
    },
  })

  const isLoading = assignmentsLoading || createdLoading
  const error = assignmentsError
  const isRefetching = isRefetchingAssignments || isRefetchingCreated
  const refetch = () => { refetchAssignments(); refetchCreated() }

  const combinedItems: ListItem[] = React.useMemo(() => {
    const items: ListItem[] = []
    const assignmentPatientIds = new Set<number>()

    // Add assignments
    if (assignmentsData) {
      for (const assignment of assignmentsData) {
        assignmentPatientIds.add(assignment.patient_procedure.patient.id)
        items.push({ type: 'assignment', data: assignment })
      }
    }

    // Add created patients that don't already appear in assignments
    if (createdPatientsData) {
      for (const patient of createdPatientsData) {
        if (!assignmentPatientIds.has(patient.id)) {
          items.push({ type: 'created_patient', data: patient })
        }
      }
    }

    return items
  }, [assignmentsData, createdPatientsData])

  const filteredItems = combinedItems.filter((item) => {
    if (selectedFilter === 'creados') {
      return item.type === 'created_patient'
    }
    if (selectedFilter === 'activa' || selectedFilter === 'completada') {
      return item.type === 'assignment' && item.data.status === selectedFilter
    }
    // 'all'
    return true
  })

  const renderFilterChip = (filter: FilterType, label: string) => {
    const isSelected = selectedFilter === filter
    return (
      <TouchableOpacity
        style={[styles.filterChip, isSelected && styles.filterChipActive]}
        onPress={() => setSelectedFilter(filter)}
      >
        <AppText
          variant="caption"
          weight={isSelected ? 'bold' : 'normal'}
          color={isSelected ? 'white' : 'textSecondary'}
        >
          {label}
        </AppText>
      </TouchableOpacity>
    )
  }

  const renderAssignmentCard = (assignment: Assignment) => {
    const statusConfig = STATUS_CONFIG[assignment.status]
    const progress = (assignment.sessions_completed / assignment.patient_procedure.treatment.estimated_sessions) * 100

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('AssignmentDetail', { assignmentId: assignment.id })}
      >
        <View style={styles.cardHeader}>
          <View style={styles.patientInfo}>
            <AppText variant="h3" weight="bold" color="brandNavy">
              {assignment.patient_procedure.patient.full_name}
            </AppText>
            <AppText variant="caption" color="textSecondary">
              {assignment.patient_procedure.treatment.name}
            </AppText>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}>
            <Ionicons name={statusConfig.icon} size={16} color={statusConfig.color} />
            <AppText variant="caption" weight="semibold" style={{ color: statusConfig.color, marginLeft: 4 }}>
              {statusConfig.label}
            </AppText>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <Ionicons name="school" size={18} color={colors.brandTurquoise} />
            <AppText variant="body" color="textSecondary" style={{ marginLeft: 8 }}>
              {assignment.patient_procedure.chair.name}
            </AppText>
          </View>

          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <AppText variant="caption" color="textSecondary">
                Progreso de sesiones
              </AppText>
              <AppText variant="caption" weight="semibold" color="brandNavy">
                {assignment.sessions_completed}/{assignment.patient_procedure.treatment.estimated_sessions}
              </AppText>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${Math.min(progress, 100)}%` }]} />
            </View>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.dateInfo}>
            <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
            <AppText variant="caption" color="textSecondary" style={{ marginLeft: 4 }}>
              Asignado: {new Date(assignment.assigned_at).toLocaleDateString('es-ES')}
            </AppText>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.brandTurquoise} />
        </View>
      </TouchableOpacity>
    )
  }

  const renderCreatedPatientCard = (patient: CreatedPatient) => {
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('PatientDetail', { patientId: patient.id })}
      >
        <View style={styles.cardHeader}>
          <View style={styles.patientInfo}>
            <AppText variant="h3" weight="bold" color="brandNavy">
              {patient.full_name}
            </AppText>
            {patient.city && (
              <AppText variant="caption" color="textSecondary">
                {patient.city}
              </AppText>
            )}
          </View>
          <View style={[styles.statusBadge, { backgroundColor: '#F3E8FF' }]}>
            <Ionicons name="person-add" size={16} color="#7C3AED" />
            <AppText variant="caption" weight="semibold" style={{ color: '#7C3AED', marginLeft: 4 }}>
              Creado por mí
            </AppText>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.dateInfo}>
            <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
            <AppText variant="caption" color="textSecondary" style={{ marginLeft: 4 }}>
              Creado: {new Date(patient.created_at).toLocaleDateString('es-ES')}
            </AppText>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.brandTurquoise} />
        </View>
      </TouchableOpacity>
    )
  }

  const renderItem = ({ item }: { item: ListItem }) => {
    if (item.type === 'assignment') {
      return renderAssignmentCard(item.data as Assignment)
    }
    return renderCreatedPatientCard(item.data as CreatedPatient)
  }

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="folder-open-outline" size={80} color={colors.border} />
      <AppText variant="h3" color="textSecondary" style={{ marginTop: spacing.md }}>
        No tienes pacientes
      </AppText>
      <AppText variant="body" color="textSecondary" style={{ marginTop: spacing.xs, textAlign: 'center' }}>
        Busca pacientes disponibles en la sección de Cátedras o agrega uno nuevo.
      </AppText>
    </View>
  )

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={60} color={colors.error} />
          <AppText variant="h3" color="error" style={{ marginTop: spacing.md }}>
            Error al cargar pacientes
          </AppText>
          <AppText variant="body" color="textSecondary" style={{ marginTop: spacing.xs, textAlign: 'center' }}>
            No se pudieron cargar tus pacientes asignados
          </AppText>
          <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
            <AppText variant="body" weight="semibold" color="white">
              Reintentar
            </AppText>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <AppText variant="h2" weight="bold" color="brandNavy">
            Mis Pacientes
          </AppText>
          <AppText variant="body" color="textSecondary">
            {filteredItems.length} {filteredItems.length === 1 ? 'paciente' : 'pacientes'}
          </AppText>
        </View>

        <View style={styles.filtersContainer}>
          {renderFilterChip('all', 'Todos')}
          {renderFilterChip('activa', 'En Proceso')}
          {renderFilterChip('completada', 'Completadas')}
          {renderFilterChip('creados', 'Creados por mí')}
        </View>

        <FlatList
          data={filteredItems}
          renderItem={renderItem}
          keyExtractor={(item) => item.type === 'assignment' ? `a-${(item.data as Assignment).id}` : `p-${(item.data as CreatedPatient).id}`}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              colors={[colors.brandTurquoise]}
              tintColor={colors.brandTurquoise}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  header: {
    paddingVertical: spacing.md,
  },
  filtersContainer: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.brandTurquoise,
    borderColor: colors.brandTurquoise,
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  patientInfo: {
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
  },
  cardBody: {
    marginBottom: spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  progressContainer: {
    marginTop: spacing.xs,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.brandTurquoise,
    borderRadius: 3,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxl * 2,
    paddingHorizontal: spacing.xl,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  retryButton: {
    marginTop: spacing.lg,
    backgroundColor: colors.brandTurquoise,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 8,
  },
})
