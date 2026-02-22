import React, { useState, useMemo } from 'react'
import { View, StyleSheet, ScrollView, TouchableOpacity, Linking, ActivityIndicator } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useQuery } from '@tanstack/react-query'
import { useRoute } from '@react-navigation/native'
import { AppText, AppButton } from '../components/ui'
import { colors } from '../theme/colors'
import { spacing } from '../theme/spacing'
import { api } from '../lib/api'

type TabType = 'disponible' | 'proceso' | 'finalizado' | 'cancelado'

interface PatientProcedure {
  id: number
  treatment: { id: number; name: string; code: string }
  chair: { id: number; name: string }
  tooth_fdi: string | null
  status: 'disponible' | 'proceso' | 'finalizado' | 'contraindicado' | 'cancelado'
  created_at: string
  updated_at: string
}

export default function PatientDetailScreen({ navigation }: any) {
  const route = useRoute()
  const params = route.params as { patientId?: number } | undefined
  const patientId = params?.patientId

  const [activeTab, setActiveTab] = useState<TabType>('disponible')

  // Cargar datos del paciente desde la API
  const { data: patientData, isLoading: patientLoading, error: patientError } = useQuery<any>({
    queryKey: ['patient', patientId],
    queryFn: async () => {
      if (!patientId) return null
      const response = await api.patients.get(patientId)
      return response.data.data
    },
    enabled: !!patientId,
  })

  // Cargar procedimientos del paciente
  const { data: proceduresData, isLoading: proceduresLoading } = useQuery({
    queryKey: ['patient-procedures', patientId],
    queryFn: async () => {
      if (!patientId) return []
      const response = await api.get(`/patients/${patientId}/procedures`)
      return response.data.data || []
    },
    enabled: !!patientId,
  })

  // Transformar datos del paciente al formato esperado
  const patient = useMemo(() => {
    if (!patientData) return null
    
    const anamnesisItems: string[] = []
    if (patientData.has_allergies) anamnesisItems.push(`Alergias: ${patientData.allergies_description || 'Sí'}`)
    if (patientData.takes_medication) anamnesisItems.push(`Toma medicamentos: ${patientData.medication_description || 'Sí'}`)
    if (patientData.has_systemic_disease) anamnesisItems.push(`Enfermedad sistémica: ${patientData.systemic_disease_description || 'Sí'}`)
    if (patientData.has_bleeding_disorder) anamnesisItems.push(`Trastorno de sangrado: ${patientData.bleeding_disorder_description || 'Sí'}`)
    if (patientData.has_heart_condition) anamnesisItems.push(`Condición cardíaca: ${patientData.heart_condition_description || 'Sí'}`)
    if (patientData.has_diabetes) anamnesisItems.push(`Diabetes: ${patientData.diabetes_description || 'Sí'}`)
    if (patientData.has_hypertension) anamnesisItems.push('Hipertensión')
    if (patientData.is_pregnant) anamnesisItems.push('Embarazada')
    if (patientData.smokes) anamnesisItems.push('Fumador/a')
    if (patientData.other_conditions) anamnesisItems.push(`Otros: ${patientData.other_conditions}`)

    return {
      id: patientData.id,
      name: patientData.full_name || `${patientData.first_name} ${patientData.last_name}`,
      age: patientData.age || 0,
      gender: patientData.gender === 'M' ? 'Masculino' : patientData.gender === 'F' ? 'Femenino' : patientData.gender || '',
      city: patientData.city || '',
      university: patientData.faculty?.name || '',
      address: patientData.address || '',
      document: patientData.document || '',
      phone: patientData.phone || '',
      email: patientData.email || '',
      civilStatus: patientData.civil_status || '',
      weight: patientData.weight ? `${patientData.weight} kg` : '',
      height: patientData.height ? `${patientData.height}` : '',
      admissionDate: patientData.created_at ? new Date(patientData.created_at).toLocaleDateString('es-PY') : '',
      anamnesis: anamnesisItems,
    }
  }, [patientData])

  // Transformar procedimientos al formato esperado
  const allProcedures = useMemo(() => {
    return (proceduresData || []).map((proc: any) => ({
      id: proc.id,
      name: `${proc.treatment?.name || 'Procedimiento'} ${proc.tooth_description ? `(${proc.tooth_description})` : ''}`,
      status: proc.status as 'disponible' | 'proceso' | 'finalizado',
      date: proc.updated_at ? new Date(proc.updated_at).toLocaleDateString('es-PY') : null,
      chairName: proc.chair?.name || '',
      assignedTo: proc.assignment?.student?.name || null,
    }))
  }, [proceduresData])

  const filteredProcedures = allProcedures.filter((p: any) => p.status === activeTab)

  const procedureCounts = {
    disponible: allProcedures.filter((p: any) => p.status === 'disponible').length,
    proceso: allProcedures.filter((p: any) => p.status === 'proceso').length,
    finalizado: allProcedures.filter((p: any) => p.status === 'finalizado').length,
    cancelado: allProcedures.filter((p: any) => p.status === 'cancelado').length,
  }

  // Verificar si el alumno tiene al menos un procedimiento activo con este paciente
  const hasActiveProcedure = allProcedures.some((p: any) => p.status === 'proceso')

  const isLoading = patientLoading || proceduresLoading

  const handleCall = () => {
    if (!patient?.phone) return
    Linking.openURL(`tel:${patient.phone}`)
  }

  const handleWhatsApp = () => {
    if (!patient?.phone || !patient?.name) return
    const message = encodeURIComponent(`Hola ${patient.name}, te contacto desde OdontoPacientes`)
    Linking.openURL(`whatsapp://send?phone=595${patient.phone.replace(/^0/, '')}&text=${message}`)
  }


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'finalizado':
        return colors.success
      case 'proceso':
        return colors.warning
      case 'disponible':
        return colors.brandTurquoise
      case 'cancelado':
        return '#9CA3AF'
      default:
        return colors.textMuted
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'finalizado':
        return 'Finalizado'
      case 'proceso':
        return 'En Proceso'
      case 'disponible':
        return 'Disponible'
      case 'cancelado':
        return 'Cancelado'
      default:
        return status
    }
  }

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.brandTurquoise} />
          <AppText color="textSecondary" style={styles.loadingText}>
            Cargando datos del paciente...
          </AppText>
        </View>
      </View>
    )
  }

  if (!patient) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <AppText color="textSecondary">No se encontró el paciente</AppText>
          <TouchableOpacity style={styles.goBackButton} onPress={() => navigation.goBack()}>
            <AppText color="white" weight="semibold">Volver</AppText>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.titleSection}>
          <AppText variant="h2" color="brandNavy" weight="bold">
            Ficha del Paciente
          </AppText>
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.smallActionButton}
              onPress={() => navigation.navigate('CreateProcedure' as never, { patientId: patient.id } as never)}
            >
              <Ionicons name="add-circle-outline" size={16} color={colors.white} />
              <AppText color="white" weight="semibold" style={styles.smallButtonText}>Agregar Procedimiento</AppText>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.smallEditButton}
              onPress={() => navigation.navigate('EditPatient' as never, { patientId: patient.id } as never)}
            >
              <Ionicons name="create-outline" size={16} color={colors.white} />
              <AppText color="white" weight="semibold" style={styles.smallButtonText}>Editar Ficha</AppText>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.patientCard}>
          <View style={styles.patientCardHeader}>
            <View style={styles.patientInfo}>
              <AppText variant="h3" color="white" weight="bold">{patient.name}</AppText>
              <AppText color="white" style={styles.patientMeta}>Edad: {patient.age} años</AppText>
              <AppText color="white" style={styles.patientMeta}>Género: {patient.gender}</AppText>
              <AppText color="white" style={styles.patientMeta}>Registrado en: {patient.university}</AppText>
            </View>
            <View style={styles.contactButtons}>
              <TouchableOpacity style={styles.iconButton} onPress={handleCall}>
                <Ionicons name="call" size={24} color={colors.white} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButton} onPress={handleWhatsApp}>
                <Ionicons name="logo-whatsapp" size={24} color={colors.white} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <AppText variant="body" color="brandNavy" weight="semibold" style={styles.infoLabel}>Dirección</AppText>
          <AppText color="textMuted" style={styles.infoValue}>{patient.address || '-'}</AppText>

          <AppText variant="body" color="brandNavy" weight="semibold" style={styles.infoLabel}>Cédula de Identidad</AppText>
          <AppText color="textMuted" style={styles.infoValue}>{patient.document || '-'}</AppText>

          <AppText variant="body" color="brandNavy" weight="semibold" style={styles.infoLabel}>Teléfono</AppText>
          <AppText color="textMuted" style={styles.infoValue}>{patient.phone || '-'}</AppText>

          <AppText variant="body" color="brandNavy" weight="semibold" style={styles.infoLabel}>Email</AppText>
          <AppText color="textMuted" style={styles.infoValue}>{patient.email || '-'}</AppText>

          <AppText variant="body" color="brandNavy" weight="semibold" style={styles.infoLabel}>Estado Civil</AppText>
          <AppText color="textMuted" style={styles.infoValue}>{patient.civilStatus || '-'}</AppText>

          <AppText variant="body" color="brandNavy" weight="semibold" style={styles.infoLabel}>Peso</AppText>
          <AppText color="textMuted" style={styles.infoValue}>{patient.weight || '-'}</AppText>

          <AppText variant="body" color="brandNavy" weight="semibold" style={styles.infoLabel}>Estatura</AppText>
          <AppText color="textMuted" style={styles.infoValue}>{patient.height || '-'}</AppText>

          <AppText variant="body" color="brandNavy" weight="semibold" style={styles.infoLabel}>Fecha de Admisión</AppText>
          <AppText color="textMuted" style={styles.infoValue}>{patient.admissionDate || '-'}</AppText>
        </View>

        <View style={styles.section}>
          <AppText variant="h3" color="brandNavy" weight="bold" style={styles.sectionTitle}>
            Anamnésis
          </AppText>
          {patient.anamnesis.length > 0 ? (
            patient.anamnesis.map((item, index) => (
              <AppText key={index} color="textMuted" style={styles.anamnesisItem}>• {item}</AppText>
            ))
          ) : (
            <AppText color="textMuted">Sin antecedentes registrados</AppText>
          )}
        </View>

        <View style={styles.section}>
          <AppText variant="h3" color="brandNavy" weight="bold" style={styles.sectionTitle}>
            Tipo de Mordida
          </AppText>
          <AppText color="textMuted">Clase 1</AppText>
        </View>

        <View style={styles.section}>
          <AppText variant="h3" color="brandNavy" weight="bold" style={styles.sectionTitle}>
            Odontograma
          </AppText>
          <AppButton
            title="Ver Odontograma"
            onPress={() => navigation.navigate('Odontogram', { patientId, isPediatric: !!patientData?.is_pediatric })}
            variant="secondary"
            fullWidth
          />
        </View>

        <View style={styles.section}>
          <AppText variant="h3" color="brandNavy" weight="bold" style={styles.sectionTitle}>
            Procedimientos
          </AppText>

          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'disponible' && styles.tabActive]}
              onPress={() => setActiveTab('disponible')}
            >
              <AppText
                color={activeTab === 'disponible' ? 'white' : 'brandNavy'}
                weight="semibold"
                style={styles.tabText}
              >
                Disponibles ({procedureCounts.disponible})
              </AppText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, activeTab === 'proceso' && styles.tabActive]}
              onPress={() => setActiveTab('proceso')}
            >
              <AppText
                color={activeTab === 'proceso' ? 'white' : 'brandNavy'}
                weight="semibold"
                style={styles.tabText}
              >
                En Proceso ({procedureCounts.proceso})
              </AppText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, activeTab === 'finalizado' && styles.tabActive]}
              onPress={() => setActiveTab('finalizado')}
            >
              <AppText
                color={activeTab === 'finalizado' ? 'white' : 'brandNavy'}
                weight="semibold"
                style={styles.tabText}
              >
                Finalizados ({procedureCounts.finalizado})
              </AppText>
            </TouchableOpacity>

            {procedureCounts.cancelado > 0 && (
              <TouchableOpacity
                style={[styles.tab, activeTab === 'cancelado' && styles.tabActive, activeTab === 'cancelado' && { backgroundColor: '#9CA3AF' }]}
                onPress={() => setActiveTab('cancelado')}
              >
                <AppText
                  color={activeTab === 'cancelado' ? 'white' : 'textMuted'}
                  weight="semibold"
                  style={styles.tabText}
                >
                  Cancelados ({procedureCounts.cancelado})
                </AppText>
              </TouchableOpacity>
            )}
          </View>

          {filteredProcedures.length > 0 ? (
            filteredProcedures.map((procedure: any) => (
              <TouchableOpacity
                key={procedure.id}
                style={styles.procedureCard}
                onPress={() => {
                  navigation.navigate('ProcedureView' as never, { procedureId: procedure.id } as never)
                }}
              >
                <View style={styles.procedureHeader}>
                  <View style={{ flex: 1 }}>
                    <AppText variant="body" color="brandNavy" weight="bold">
                      {procedure.name}
                    </AppText>
                    {procedure.chairName ? (
                      <AppText variant="caption" color="textMuted">{procedure.chairName}</AppText>
                    ) : null}
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(procedure.status) }]}>
                    <AppText color="white" style={styles.statusText}>
                      {getStatusText(procedure.status)}
                    </AppText>
                  </View>
                </View>
                {procedure.assignedTo && (
                  <AppText variant="caption" color="textSecondary" style={styles.procedureDate}>
                    Asignado a: {procedure.assignedTo}
                  </AppText>
                )}
                {procedure.date && (
                  <AppText color="textMuted" style={styles.procedureDate}>
                    Fecha: {procedure.date}
                  </AppText>
                )}
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <AppText color="textMuted" align="center">
                No hay procedimientos {activeTab === 'disponible' ? 'disponibles' : activeTab === 'proceso' ? 'en proceso' : 'finalizados'}
              </AppText>
            </View>
          )}

          {activeTab === 'disponible' && (
            <AppButton
              title="Agendar Nuevo Procedimiento"
              onPress={() => navigation.navigate('ProcedureSchedule', { patientId: 1 })}
              style={styles.scheduleButton}
            />
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
  titleSection: {
    marginBottom: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  smallActionButton: {
    backgroundColor: colors.success,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  smallEditButton: {
    backgroundColor: colors.brandTurquoise,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  smallButtonText: {
    fontSize: 12,
  },
  goBackButton: {
    backgroundColor: colors.brandNavy,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    marginTop: spacing.md,
  },
  odontogramEditButton: {
    backgroundColor: colors.brandTurquoise,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: 6,
  },
  patientCard: {
    backgroundColor: colors.brandTurquoise,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  patientCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  patientInfo: {
    flex: 1,
  },
  patientMeta: {
    marginTop: spacing.xs,
    fontSize: 14,
  },
  contactButtons: {
    flexDirection: 'column',
    gap: spacing.sm,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoLabel: {
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  infoValue: {
    fontSize: 14,
  },
  anamnesisItem: {
    marginBottom: spacing.xs,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: 8,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.brandNavy,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: colors.brandNavy,
    borderColor: colors.brandNavy,
  },
  tabText: {
    fontSize: 12,
  },
  emptyState: {
    padding: spacing.xl,
    backgroundColor: colors.background,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    marginBottom: spacing.md,
  },
  procedureCard: {
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  procedureHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  procedureDate: {
    fontSize: 13,
  },
  scheduleButton: {
    marginTop: spacing.md,
  },
  spacer: {
    height: spacing.xxl,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 14,
  },
})
