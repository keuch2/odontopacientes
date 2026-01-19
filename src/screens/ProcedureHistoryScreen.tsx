import React, { useState } from 'react'
import { View, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useQuery } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { AppText } from '../components/ui'
import { colors } from '../theme/colors'
import { spacing } from '../theme/spacing'
import { api } from '../lib/api'

type ProcedureStatus = 'activa' | 'completada' | 'all'

interface Assignment {
  id: number
  status: 'activa' | 'completada' | 'abandonada'
  sessions_completed: number
  assigned_at: string
  completed_at?: string
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
      color?: string
    }
    patient: {
      id: number
      full_name: string
    }
  }
}

const STATUS_CONFIG = {
  activa: {
    label: 'En Proceso',
    color: colors.success,
    bgColor: '#E8F5E9',
    icon: 'time-outline' as const,
  },
  completada: {
    label: 'Completado',
    color: colors.brandNavy,
    bgColor: '#E3F2FD',
    icon: 'checkmark-circle-outline' as const,
  },
  abandonada: {
    label: 'Abandonado',
    color: colors.error,
    bgColor: '#FFEBEE',
    icon: 'close-circle-outline' as const,
  },
}

export default function ProcedureHistoryScreen() {
  const navigation = useNavigation<any>()
  const [selectedStatus, setSelectedStatus] = useState<ProcedureStatus>('all')

  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['procedure-history'],
    queryFn: async () => {
      const response = await api.students.getMyAssignments()
      return response.data.data as Assignment[]
    },
  })

  const filteredProcedures = data?.filter((assignment) => {
    if (selectedStatus === 'all') {
      return assignment.status === 'activa' || assignment.status === 'completada'
    }
    return assignment.status === selectedStatus
  })

  const activeCount = data?.filter(a => a.status === 'activa').length || 0
  const completedCount = data?.filter(a => a.status === 'completada').length || 0

  const renderStatusFilter = (status: ProcedureStatus, label: string, count?: number) => {
    const isSelected = selectedStatus === status
    return (
      <TouchableOpacity
        style={[styles.filterChip, isSelected && styles.filterChipActive]}
        onPress={() => setSelectedStatus(status)}
      >
        <AppText
          variant="caption"
          weight={isSelected ? 'bold' : 'normal'}
          color={isSelected ? 'white' : 'textSecondary'}
        >
          {label} {count !== undefined && `(${count})`}
        </AppText>
      </TouchableOpacity>
    )
  }

  const renderProcedureCard = ({ item }: { item: Assignment }) => {
    const statusConfig = STATUS_CONFIG[item.status]
    const progress = Math.round((item.sessions_completed / item.patient_procedure.treatment.estimated_sessions) * 100)

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('AssignmentDetail', { assignmentId: item.id })}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.statusIndicator, { backgroundColor: statusConfig.color }]} />
          <View style={styles.procedureInfo}>
            <AppText variant="h3" weight="bold" color="brandNavy" numberOfLines={1}>
              {item.patient_procedure.treatment.name}
            </AppText>
            <AppText variant="body" color="textSecondary" numberOfLines={1}>
              {item.patient_procedure.patient.full_name}
            </AppText>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}>
            <Ionicons name={statusConfig.icon} size={14} color={statusConfig.color} />
            <AppText variant="caption" weight="semibold" style={{ color: statusConfig.color, marginLeft: 4 }}>
              {statusConfig.label}
            </AppText>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Ionicons name="school-outline" size={16} color={colors.brandTurquoise} />
              <AppText variant="caption" color="textSecondary" style={{ marginLeft: 6 }}>
                {item.patient_procedure.chair.name}
              </AppText>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="calendar-outline" size={16} color={colors.brandTurquoise} />
              <AppText variant="caption" color="textSecondary" style={{ marginLeft: 6 }}>
                {new Date(item.assigned_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
              </AppText>
            </View>
          </View>

          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <AppText variant="caption" color="textSecondary">
                Sesiones: {item.sessions_completed}/{item.patient_procedure.treatment.estimated_sessions}
              </AppText>
              <AppText variant="caption" weight="bold" color="brandTurquoise">
                {progress}%
              </AppText>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${Math.min(progress, 100)}%` }]} />
            </View>
          </View>
        </View>

        {item.status === 'completada' && item.completed_at && (
          <View style={styles.cardFooter}>
            <Ionicons name="checkmark-done" size={16} color={colors.success} />
            <AppText variant="caption" color="success" style={{ marginLeft: 4 }}>
              Completado el {new Date(item.completed_at).toLocaleDateString('es-ES')}
            </AppText>
          </View>
        )}
      </TouchableOpacity>
    )
  }

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="document-text-outline" size={80} color={colors.border} />
      <AppText variant="h3" color="textSecondary" style={{ marginTop: spacing.md }}>
        Sin procedimientos
      </AppText>
      <AppText variant="body" color="textSecondary" style={{ marginTop: spacing.xs, textAlign: 'center' }}>
        {selectedStatus === 'activa'
          ? 'No tienes procedimientos en curso'
          : selectedStatus === 'completada'
          ? 'No tienes procedimientos completados'
          : 'No tienes procedimientos registrados'}
      </AppText>
    </View>
  )

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.brandNavy} />
          </TouchableOpacity>
          <AppText variant="h2" color="brandNavy" weight="bold">
            Historial de Procedimientos
          </AppText>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={60} color={colors.error} />
          <AppText variant="h3" color="error" style={{ marginTop: spacing.md }}>
            Error al cargar historial
          </AppText>
          <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
            <AppText variant="body" weight="semibold" color="white">
              Reintentar
            </AppText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.brandNavy} />
        </TouchableOpacity>
        <AppText variant="h2" color="brandNavy" weight="bold">
          Historial de Procedimientos
        </AppText>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { borderLeftColor: colors.success }]}>
            <AppText variant="h2" weight="bold" color="success">
              {activeCount}
            </AppText>
            <AppText variant="caption" color="textSecondary">
              En Proceso
            </AppText>
          </View>
          <View style={[styles.statCard, { borderLeftColor: colors.brandNavy }]}>
            <AppText variant="h2" weight="bold" color="brandNavy">
              {completedCount}
            </AppText>
            <AppText variant="caption" color="textSecondary">
              Completados
            </AppText>
          </View>
        </View>

        <View style={styles.filtersContainer}>
          {renderStatusFilter('all', 'Todos', activeCount + completedCount)}
          {renderStatusFilter('activa', 'En Proceso', activeCount)}
          {renderStatusFilter('completada', 'Completados', completedCount)}
        </View>

        <FlatList
          data={filteredProcedures}
          renderItem={renderProcedureCard}
          keyExtractor={(item) => item.id.toString()}
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
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
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
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  statusIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: spacing.sm,
  },
  procedureInfo: {
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  cardBody: {
    padding: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressSection: {
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
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: '#E8F5E9',
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
