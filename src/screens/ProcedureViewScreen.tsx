import React, { useState, useEffect } from 'react'
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native'
import { useRoute, useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { AppText, AppButton } from '../components/ui'
import { colors } from '../theme/colors'
import { spacing } from '../theme/spacing'
import { api } from '../lib/api'

export default function ProcedureViewScreen() {
  const navigation = useNavigation()
  const route = useRoute()
  const { procedureId } = route.params as { procedureId: number }

  const [procedure, setProcedure] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    fetchProcedureDetails()
  }, [procedureId])

  const fetchProcedureDetails = async () => {
    try {
      setLoading(true)
      const response = await api.procedures.get(procedureId)
      setProcedure(response.data.data)
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'No se pudo cargar el procedimiento')
    } finally {
      setLoading(false)
    }
  }

  const handleAssign = async () => {
    Alert.alert(
      'Asignarme Procedimiento',
      '¿Estás seguro que deseas asignarte este procedimiento?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Asignarme',
          onPress: async () => {
            try {
              setActionLoading(true)
              await api.procedures.assign(procedureId)
              Alert.alert('Éxito', 'Procedimiento asignado correctamente')
              fetchProcedureDetails()
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.message || 'No se pudo asignar el procedimiento')
            } finally {
              setActionLoading(false)
            }
          }
        }
      ]
    )
  }

  const handleAbandon = async () => {
    Alert.prompt(
      'Abandonar Procedimiento',
      'Por favor indica el motivo del abandono:',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Abandonar',
          style: 'destructive',
          onPress: async (reason: string | undefined) => {
            if (!reason || reason.trim() === '') {
              Alert.alert('Error', 'Debes indicar un motivo')
              return
            }
            try {
              setActionLoading(true)
              await api.students.abandonAssignment(procedureId, { reason: reason.trim() })
              Alert.alert('Éxito', 'Procedimiento abandonado')
              navigation.goBack()
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.message || 'No se pudo abandonar el procedimiento')
            } finally {
              setActionLoading(false)
            }
          }
        }
      ],
      'plain-text'
    )
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.brandTurquoise} />
          <AppText color="textMuted" style={styles.loadingText}>Cargando procedimiento...</AppText>
        </View>
      </View>
    )
  }

  if (!procedure) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <AppText color="error">No se pudo cargar el procedimiento</AppText>
        </View>
      </View>
    )
  }

  const isAssigned = procedure.status === 'proceso'
  const isAvailable = procedure.status === 'disponible'
  const procedurePhotos = procedure.photos || []

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.titleContainer}>
          <AppText variant="h2" color="brandNavy" weight="bold">
            Ver Procedimiento
          </AppText>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <AppText color="white" weight="semibold">Volver</AppText>
          </TouchableOpacity>
        </View>

        {/* Action buttons */}
        {isAvailable && (
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.assignButton]}
              onPress={handleAssign}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <>
                  <Ionicons name="person-add" size={20} color={colors.white} />
                  <AppText color="white" weight="semibold" style={styles.actionButtonText}>ASIGNARME</AppText>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {isAssigned && (
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.abandonButton]}
              onPress={handleAbandon}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <>
                  <Ionicons name="exit-outline" size={20} color={colors.white} />
                  <AppText color="white" weight="semibold" style={styles.actionButtonText}>ABANDONAR</AppText>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Estado badge */}
        <View style={styles.statusBadgeContainer}>
          <View style={[
            styles.statusBadge,
            procedure.status === 'disponible' && styles.statusAvailable,
            procedure.status === 'proceso' && styles.statusInProgress,
            procedure.status === 'finalizado' && styles.statusCompleted,
          ]}>
            <AppText color="white" weight="semibold">
              {procedure.status === 'disponible' && 'DISPONIBLE'}
              {procedure.status === 'proceso' && 'EN PROCESO'}
              {procedure.status === 'finalizado' && 'FINALIZADO'}
              {procedure.status === 'contraindicado' && 'CONTRAINDICADO'}
            </AppText>
          </View>
        </View>

        {/* Patient info */}
        <View style={styles.patientSection}>
          <AppText color="brandNavy" weight="semibold" style={styles.sectionLabel}>
            Paciente
          </AppText>
          <View style={styles.patientCard}>
            <View style={styles.patientInfo}>
              <AppText variant="h3" color="brandNavy" weight="bold">{procedure.patient?.full_name || 'Paciente'}</AppText>
              <AppText color="textMuted" style={styles.patientMeta}>Edad: {procedure.patient?.age || 'N/A'} años</AppText>
              <AppText color="textMuted" style={styles.patientMeta}>Ciudad: {procedure.patient?.city || 'N/A'}</AppText>
              <AppText color="textMuted" style={styles.patientMeta}>
                Cédula: {procedure.patient?.document_number || 'N/A'}
              </AppText>
            </View>
            <TouchableOpacity 
              style={styles.viewFileButton}
              onPress={() => (navigation as any).navigate('PatientDetail', { patientId: procedure.patient_id })}
            >
              <AppText color="white" weight="semibold" style={styles.viewFileButtonText}>
                Ver Ficha
              </AppText>
            </TouchableOpacity>
          </View>
        </View>

        {/* Procedure details */}
        <View style={styles.procedureSection}>
          <View style={styles.procedureHeader}>
            <AppText variant="h3" color="brandNavy" weight="bold">
              {procedure.treatment?.name || 'Procedimiento'}
            </AppText>
            <AppText color="textMuted" style={styles.procedureMeta}>
              Cátedra: {procedure.chair?.name || 'N/A'}
            </AppText>
          </View>
          <AppText color="textMuted" style={styles.procedureDescription}>
            {procedure.description || 'Sin descripción disponible'}
          </AppText>
          {procedure.assigned_student && (
            <View style={styles.assignedStudentInfo}>
              <AppText color="brandNavy" weight="semibold">Asignado a:</AppText>
              <AppText color="textMuted">{procedure.assigned_student.full_name}</AppText>
            </View>
          )}
        </View>

        {/* Photos section */}
        <View style={styles.photosSection}>
          <AppText color="brandNavy" weight="semibold" style={styles.sectionLabel}>
            Fotos
          </AppText>
          {procedurePhotos.length > 0 ? (
            <View style={styles.photosGrid}>
              {procedurePhotos.map((photo: any, index: number) => (
                <View key={index} style={styles.photoPlaceholder}>
                  <AppText color="textMuted">📷</AppText>
                </View>
              ))}
            </View>
          ) : (
            <AppText color="textMuted" style={styles.noPhotosText}>No hay fotos disponibles</AppText>
          )}
        </View>

        <View style={styles.spacer} />
      </ScrollView>
    </View>
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
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.brandTurquoise,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  logoText: {
    fontSize: 18,
  },
  menuButton: {
    padding: spacing.sm,
  },
  menuIcon: {
    width: 24,
    height: 18,
    justifyContent: 'space-between',
  },
  menuLine: {
    width: '100%',
    height: 3,
    backgroundColor: colors.brandNavy,
    borderRadius: 2,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  backButton: {
    backgroundColor: colors.brandNavy,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  statusButtonsContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statusButton: {
    flex: 1,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.brandNavy,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    alignItems: 'center',
  },
  statusButtonActive: {
    backgroundColor: colors.brandTurquoise,
    borderColor: colors.brandTurquoise,
  },
  patientSection: {
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    backgroundColor: '#E0E0E0',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  patientCard: {
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: spacing.md,
  },
  patientInfo: {
    marginBottom: spacing.md,
  },
  patientMeta: {
    marginTop: spacing.xs,
    fontSize: 14,
  },
  viewFileButton: {
    backgroundColor: colors.brandNavy,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    alignItems: 'center',
  },
  viewFileButtonText: {
    fontSize: 14,
  },
  procedureSection: {
    backgroundColor: '#E8F4F8',
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  procedureHeader: {
    marginBottom: spacing.sm,
  },
  procedureDescription: {
    lineHeight: 20,
  },
  photosSection: {
    marginBottom: spacing.lg,
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  photoPlaceholder: {
    width: '31%',
    aspectRatio: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  spacer: {
    height: spacing.xxl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.md,
  },
  actionButtonsContainer: {
    marginBottom: spacing.lg,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: 8,
    gap: spacing.sm,
  },
  assignButton: {
    backgroundColor: colors.success,
  },
  abandonButton: {
    backgroundColor: colors.error,
  },
  actionButtonText: {
    marginLeft: spacing.xs,
  },
  statusBadgeContainer: {
    marginBottom: spacing.lg,
  },
  statusBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    alignItems: 'center',
  },
  statusAvailable: {
    backgroundColor: colors.success,
  },
  statusInProgress: {
    backgroundColor: colors.warning,
  },
  statusCompleted: {
    backgroundColor: colors.brandTurquoise,
  },
  procedureMeta: {
    fontSize: 14,
    marginTop: spacing.xs,
  },
  assignedStudentInfo: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  noPhotosText: {
    textAlign: 'center',
    fontStyle: 'italic',
  },
})
